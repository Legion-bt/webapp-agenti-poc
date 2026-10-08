import { store } from '../lib/store';
import { Customer, CustomerSuspendedItem } from '../types';

export class CustomerService {
  public getCustomers(filters?: {
    search?: string;
    area?: string;
    province?: string;
    status?: string;
    hasOverdue?: boolean;
    agentId?: string;
  }): Customer[] {
    const state = store.getState();
    const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId);

    let list = state.customers;

    // Filter by Org if not HQ_SUPERADMIN
    if (currentProfile?.role !== 'HQ_SUPERADMIN') {
      list = list.filter((c) => c.orgId === state.activeOrgId);
    }

    // Role-based security (RLS in app layer): AGENT only sees their customers
    if (currentProfile?.role === 'AGENT' && currentProfile.agentId) {
      list = list.filter((c) => c.salesAgentId === currentProfile.agentId);
    } else if (filters?.agentId) {
      list = list.filter((c) => c.salesAgentId === filters.agentId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.businessName.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.vatNumber.toLowerCase().includes(q) ||
          c.taxCode.toLowerCase().includes(q)
      );
    }

    if (filters?.province) {
      list = list.filter((c) => c.province.toLowerCase().includes(filters.province!.toLowerCase()));
    }

    if (filters?.status) {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters?.hasOverdue) {
      list = list.filter((c) => c.overdueAmount > 0);
    }

    return list;
  }

  public getCustomerById(id: string): Customer | undefined {
    const state = store.getState();
    return state.customers.find((c) => c.id === id);
  }

  public getCustomerByCode(code: string): Customer | undefined {
    const state = store.getState();
    return state.customers.find((c) => c.code === code);
  }

  public getSuspendedItems(customerId: string): CustomerSuspendedItem[] {
    const state = store.getState();
    return state.suspendedItems.filter((item) => item.customerId === customerId);
  }

  public recordPayment(itemId: string, collectedAmount: number, notes?: string): void {
    store.setState((prev) => {
      const updatedSuspended = prev.suspendedItems.map((item) => {
        if (item.id === itemId) {
          const newBalance = Math.max(0, item.balance - collectedAmount);
          return {
            ...item,
            balance: newBalance,
            toCollect: Math.max(0, item.toCollect - collectedAmount),
            isPaid: newBalance <= 0,
            notes: notes ? `${item.notes ? item.notes + ' | ' : ''}${notes}` : item.notes,
          };
        }
        return item;
      });

      // Recalculate customer total overdue amount
      const targetItem = prev.suspendedItems.find((i) => i.id === itemId);
      const updatedCustomers = prev.customers.map((c) => {
        if (targetItem && c.id === targetItem.customerId) {
          const remainingCustomerOverdue = updatedSuspended
            .filter((i) => i.customerId === c.id && !i.isPaid)
            .reduce((sum, i) => sum + i.balance, 0);

          return {
            ...c,
            overdueAmount: remainingCustomerOverdue,
            status: (remainingCustomerOverdue === 0 && c.status === 'BLOCKED' ? 'ACTIVE' : c.status) as Customer['status'],
          };
        }
        return c;
      });

      return {
        ...prev,
        suspendedItems: updatedSuspended,
        customers: updatedCustomers,
      };
    });
  }

  public createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const newId = 'cust-' + Date.now();
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    store.setState((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));

    return newCustomer;
  }
}

export const customerService = new CustomerService();
