import { store } from '../lib/store';
import { Order, OrderStatus } from '../types';
import { erpGateway } from './erp-gateway';
import { supabase } from '../lib/supabase/client';

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

  /**
   * Prices each line with the ERP gateway, checks the customer's credit and saves the
   * order on Supabase (create_order: number, totals and visibility decided server-side).
   */
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
    if (!supabase) throw new Error('Servizio ordini non disponibile.');
    const state = store.getState();
    const customer = state.customers.find((c) => c.id === orderInput.customerId);
    if (!customer) throw new Error('Cliente non trovato');

    const agent = state.agents.find((a) => a.id === customer.salesAgentId);

    const lines = await Promise.all(
      orderInput.items.map(async (item) => {
        const product = state.products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Articolo ${item.productId} non trovato`);
        const price = await erpGateway.calculatePrice({
          customerId: customer.id,
          productId: product.id,
          quantity: item.quantity,
        });
        return { product, quantity: item.quantity, price };
      })
    );

    const subtotal = lines.reduce((sum, l) => sum + l.price.netPrice * l.quantity, 0);
    const total = Math.round(subtotal * 1.22 * 100) / 100;
    const creditCheck = await erpGateway.validateCustomerCredit(customer.id, total);

    const { data, error } = await supabase.rpc('create_order', {
      p_customer_id: customer.id,
      p_items: lines.map((l) => ({
        product_id: l.product.id,
        quantity: l.quantity,
        list_price: l.price.listPrice,
        discount1: l.price.discount1,
        discount2: l.price.discount2,
        unit_price: Math.round(l.price.netPrice * 100) / 100,
      })),
      p_requested_delivery_date: orderInput.requestedDeliveryDate || null,
      p_payment_term: orderInput.paymentTerm || null,
      p_notes: orderInput.notes || null,
      p_block_reason: creditCheck.isBlocked ? creditCheck.warnings.join(' | ') : null,
    });
    if (error) throw new Error(this.describeError(error.message));
    const created = data as { id: string; number: string };

    // Simulated ERP registration: store its document number on the order.
    const erpResult = await erpGateway.submitOrder({ number: created.number, orgId: customer.orgId, total });
    await supabase.from('orders').update({ erp_doc_number: erpResult.erpDocNumber }).eq('id', created.id);

    await store.syncOrders();
    const order = this.getOrderById(created.id);
    if (!order) throw new Error('Ordine salvato ma non leggibile: aggiorna la pagina.');

    // Commissions and stock are still local demo data.
    const commissionRate = agent?.commissionRate ?? 0;
    store.setState((prev) => ({
      ...prev,
      commissions: [
        {
          id: 'comm-' + Date.now(),
          orgId: customer.orgId,
          salesAgentId: customer.salesAgentId,
          agentName: agent?.fullName || customer.salesAgentName || '',
          orderId: order.id,
          orderNumber: order.number,
          customerName: customer.businessName,
          baseAmount: order.subtotal,
          percentage: commissionRate,
          amount: Math.round(order.subtotal * (commissionRate / 100) * 100) / 100,
          status: 'ACCRUED' as const,
          accruedDate: order.orderDate,
        },
        ...prev.commissions,
      ],
      stock: prev.stock.map((stk) => {
        const line = lines.find((l) => l.product.id === stk.productId);
        if (!line || !stk.warehouseName.includes('Centrale')) return stk;
        const committed = stk.quantityCommitted + line.quantity;
        return { ...stk, quantityCommitted: committed, quantityAvailable: Math.max(0, stk.quantityOnHand - committed) };
      }),
      customers: prev.customers.map((c) =>
        c.id === customer.id
          ? { ...c, currentExposure: c.currentExposure + order.total, lastOrderDate: order.orderDate }
          : c
      ),
    }));

    return { order, isBlocked: creditCheck.isBlocked, warnings: creditCheck.warnings };
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (!supabase) throw new Error('Servizio ordini non disponibile.');
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('id');
    if (error) throw new Error(this.describeError(error.message));
    if (!data || data.length === 0) throw new Error('Non hai i permessi per modificare questo ordine.');
    await store.syncOrders();
  }

  private describeError(message: string): string {
    if (/create_order|schema cache|order_items/i.test(message)) {
      return 'Archivio ordini non ancora configurato sul database (migrazione 005).';
    }
    if (/row-level security|permission denied/i.test(message)) {
      return 'Non hai i permessi per questa operazione.';
    }
    return message || 'Operazione non riuscita.';
  }
}

export const orderService = new OrderService();
