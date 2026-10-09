import { store } from '../lib/store';
import { Customer, PricingResult, Order } from '../types';
import { pricingService, PriceCalculationInput } from './pricing.service';

export interface CreditValidationResult {
  isValid: boolean;
  isBlocked: boolean;
  warnings: string[];
  remainingCredit: number;
  overdueAmount: number;
  creditLimit: number;
  currentExposure: number;
}

export interface ErpGateway {
  calculatePrice(input: PriceCalculationInput): Promise<PricingResult>;
  getAvailability(productId: string): Promise<{ totalAvailable: number; byWarehouse: Record<string, number> }>;
  validateCustomerCredit(customerId: string, orderTotal: number): Promise<CreditValidationResult>;
  submitOrder(order: Partial<Order>): Promise<{ success: boolean; erpDocNumber: string; status: string }>;
}

export class SimulatedErpGateway implements ErpGateway {
  public async calculatePrice(input: PriceCalculationInput): Promise<PricingResult> {
    // Delegates to centralized pricing engine
    return pricingService.calculatePrice(input);
  }

  public async getAvailability(productId: string): Promise<{
    totalAvailable: number;
    byWarehouse: Record<string, number>;
  }> {
    const state = store.getState();
    const stocks = state.stock.filter((s) => s.productId === productId);
    const byWarehouse: Record<string, number> = {};
    let totalAvailable = 0;

    stocks.forEach((s) => {
      byWarehouse[s.warehouseName] = s.quantityAvailable;
      totalAvailable += s.quantityAvailable;
    });

    return { totalAvailable, byWarehouse };
  }

  public async validateCustomerCredit(
    customerId: string,
    orderTotal: number
  ): Promise<CreditValidationResult> {
    const state = store.getState();
    const customer = state.customers.find((c) => c.id === customerId);

    if (!customer) {
      return {
        isValid: false,
        isBlocked: true,
        warnings: ['Cliente non presente in anagrafica ERP'],
        remainingCredit: 0,
        overdueAmount: 0,
        creditLimit: 0,
        currentExposure: 0,
      };
    }

    const remainingCredit = customer.creditLimit - customer.currentExposure;
    const warnings: string[] = [];
    let isBlocked = false;

    // Condition 1: Check overdue amount (threshold > 5000 causes BLOCKED in standard ERP config)
    if (customer.overdueAmount > 0) {
      warnings.push(
        `Attenzione: Il cliente presenta €${customer.overdueAmount.toLocaleString('it-IT', {
          minimumFractionDigits: 2,
        })} di scaduto/insoluto.`
      );
      if (customer.overdueAmount > 5000 || customer.status === 'BLOCKED') {
        isBlocked = true;
        warnings.push('Blocco amministrativo attivo: insoluti superiori alla soglia di sicurezza.');
      }
    }

    // Condition 2: Credit limit exposure check
    if (orderTotal > remainingCredit) {
      warnings.push(
        `Fido insufficiente: l'importo dell'ordine (€${orderTotal.toFixed(
          2
        )}) supera il fido residuo (€${remainingCredit.toFixed(2)}).`
      );
      if (remainingCredit <= 0) {
        isBlocked = true;
      }
    }

    return {
      isValid: !isBlocked,
      isBlocked,
      warnings,
      remainingCredit,
      overdueAmount: customer.overdueAmount,
      creditLimit: customer.creditLimit,
      currentExposure: customer.currentExposure,
    };
  }

  public async submitOrder(orderData: Partial<Order>): Promise<{
    success: boolean;
    erpDocNumber: string;
    status: string;
  }> {
    // Simulates the ERP electronic document registration
    const year = new Date().getFullYear();
    const randomSerial = Math.floor(1000 + Math.random() * 9000);
    const erpDocNumber = `ERP-OV-${year.toString().slice(-2)}-${randomSerial}`;

    // Add entry in sync logs
    const newLog = {
      id: 'log-' + Date.now(),
      orgId: orderData.orgId || 'org-01',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      entityType: 'ORDERS' as const,
      direction: 'APP_TO_ERP' as const,
      status: 'SUCCESS' as const,
      recordsCount: 1,
      message: `Ordine ${orderData.number || 'Nuovo'} sincronizzato con ERP (${erpDocNumber})`,
      durationMs: 320,
    };

    store.setState((prev) => ({
      ...prev,
      erpLogs: [newLog, ...prev.erpLogs],
    }));

    return {
      success: true,
      erpDocNumber,
      status: 'CONFIRMED',
    };
  }
}

export const erpGateway: ErpGateway = new SimulatedErpGateway();
