import { store } from '../lib/store';
import { Order, OrderStatus } from '../types';
import { erpGateway } from './erp-gateway';

export class OrderService {
  public getOrders(filters?: {
    search?: string;
    status?: OrderStatus;
    customerId?: string;
    agentId?: string;
    period?: 'today' | 'week' | 'month' | 'year' | 'all';
  }): Order[] {
    const state = store.getState();
    const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId);

    let list = state.orders;

    // Filter by Organization
    if (currentProfile?.role !== 'HQ_SUPERADMIN') {
      list = list.filter((o) => o.orgId === state.activeOrgId);
    }

    // Role-based filtering: AGENT only sees their own orders
    if (currentProfile?.role === 'AGENT' && currentProfile.agentId) {
      list = list.filter((o) => o.salesAgentId === currentProfile.agentId);
    } else if (filters?.agentId) {
      list = list.filter((o) => o.salesAgentId === filters.agentId);
    }

    if (filters?.customerId) {
      list = list.filter((o) => o.customerId === filters.customerId);
    }

    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerCode.toLowerCase().includes(q) ||
          (o.notes && o.notes.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return store.getState().orders.find((o) => o.id === id);
  }

  public async createOrder(orderInput: {
    customerId: string;
    requestedDeliveryDate: string;
    paymentTerm?: string;
    notes?: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  }): Promise<{ order: Order; isBlocked: boolean; warnings: string[] }> {
    const state = store.getState();
    const customer = state.customers.find((c) => c.id === orderInput.customerId);
    if (!customer) throw new Error('Cliente non trovato');

    const agent = state.agents.find((a) => a.id === customer.salesAgentId) || state.agents[0];

    // Build items with pricing
    let subtotal = 0;
    const preparedItems = orderInput.items.map((item, idx) => {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Articolo ${item.productId} non trovato`);

      const priceResult = erpGateway.calculatePrice({
        customerId: customer.id,
        productId: product.id,
        quantity: item.quantity,
      });

      // Price calculation is synchronous in ApraErpGateway
      const resolvedPrice = (priceResult as any).listPrice ? (priceResult as any) : {
        listPrice: product.basePrice,
        discount1: product.defaultDiscount1,
        discount2: product.defaultDiscount2,
        netPrice: product.basePrice * (1 - product.defaultDiscount1 / 100),
        lineTotal: product.basePrice * (1 - product.defaultDiscount1 / 100) * item.quantity,
      };

      subtotal += resolvedPrice.lineTotal;

      return {
        id: `oi-${Date.now()}-${idx}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        packInfo: product.packInfo,
        unit: product.unit,
        quantity: item.quantity,
        quantityShipped: 0,
        listPrice: resolvedPrice.listPrice,
        discount1: resolvedPrice.discount1,
        discount2: resolvedPrice.discount2,
        unitPrice: resolvedPrice.netPrice,
        lineTotal: resolvedPrice.lineTotal,
      };
    });

    const taxTotal = Math.round(subtotal * 0.22 * 100) / 100;
    const total = Math.round((subtotal + taxTotal) * 100) / 100;

    // ERP Credit validation
    const creditCheck = await erpGateway.validateCustomerCredit(customer.id, total);

    const year = new Date().getFullYear();
    const serialCount = state.orders.length + 37;
    const padded = String(serialCount).padStart(7, '0');
    const orderNumber = `${year}-OV-${padded}`;

    const orderStatus: OrderStatus = creditCheck.isBlocked ? 'BLOCKED' : 'CONFIRMED';
    const blockReason = creditCheck.isBlocked
      ? creditCheck.warnings.join(' | ')
      : undefined;

    // Submit to ERP gateway
    const erpResult = await erpGateway.submitOrder({
      number: orderNumber,
      orgId: customer.orgId,
      total,
    });

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orgId: customer.orgId,
      number: orderNumber,
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.businessName,
      salesAgentId: agent.id,
      salesAgentName: agent.fullName,
      status: orderStatus,
      orderDate: new Date().toISOString().slice(0, 10),
      requestedDeliveryDate: orderInput.requestedDeliveryDate,
      paymentTerm: orderInput.paymentTerm || customer.paymentTerm,
      causal: 'OV - ORDINI CLIENTI',
      notes: orderInput.notes || '',
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: 0,
      taxTotal,
      total,
      residualTotal: total,
      backOrder: false,
      blockReason,
      erpSyncStatus: 'SYNCED',
      erpDocNumber: erpResult.erpDocNumber,
      items: preparedItems,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    // Calculate agent commission
    const commissionAmount = Math.round(subtotal * (agent.commissionRate / 100) * 100) / 100;
    const newCommission = {
      id: 'comm-' + Date.now(),
      orgId: customer.orgId,
      salesAgentId: agent.id,
      agentName: agent.fullName,
      orderId: newOrder.id,
      orderNumber: newOrder.number,
      customerName: customer.businessName,
      baseAmount: subtotal,
      percentage: agent.commissionRate,
      amount: commissionAmount,
      status: 'ACCRUED' as const,
      accruedDate: newOrder.orderDate,
    };

    // Update state & deduct stock commitment
    store.setState((prev) => {
      // Update stock committed
      const updatedStock = prev.stock.map((stk) => {
        const item = preparedItems.find((pi) => pi.productId === stk.productId);
        if (item && stk.warehouseName.includes('Centrale')) {
          return {
            ...stk,
            quantityCommitted: stk.quantityCommitted + item.quantity,
            quantityAvailable: Math.max(0, stk.quantityOnHand - (stk.quantityCommitted + item.quantity)),
          };
        }
        return stk;
      });

      // Update customer exposure and lastOrderDate
      const updatedCustomers = prev.customers.map((c) => {
        if (c.id === customer.id) {
          return {
            ...c,
            currentExposure: c.currentExposure + total,
            lastOrderDate: newOrder.orderDate,
          };
        }
        return c;
      });

      return {
        ...prev,
        orders: [newOrder, ...prev.orders],
        commissions: [newCommission, ...prev.commissions],
        stock: updatedStock,
        customers: updatedCustomers,
      };
    });

    return {
      order: newOrder,
      isBlocked: creditCheck.isBlocked,
      warnings: creditCheck.warnings,
    };
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): void {
    store.setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
          : o
      ),
    }));
  }
}

export const orderService = new OrderService();
