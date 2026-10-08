import { store } from '../lib/store';
import { Quote, QuoteStatus } from '../types';
import { orderService } from './order.service';

export class QuoteService {
  public getQuotes(): Quote[] {
    const state = store.getState();
    const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId);

    let list = state.quotes;
    if (currentProfile?.role !== 'HQ_SUPERADMIN') {
      list = list.filter((q) => q.orgId === state.activeOrgId);
    }
    if (currentProfile?.role === 'AGENT' && currentProfile.agentId) {
      list = list.filter((q) => q.salesAgentId === currentProfile.agentId);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getQuoteById(id: string): Quote | undefined {
    return store.getState().quotes.find((q) => q.id === id);
  }

  public updateQuoteStatus(id: string, status: QuoteStatus): void {
    store.setState((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) => (q.id === id ? { ...q, status } : q)),
    }));
  }

  /**
   * Converts an ACCEPTED quote into an order (Specification Section 14)
   */
  public async convertToOrder(quoteId: string): Promise<string> {
    const quote = this.getQuoteById(quoteId);
    if (!quote) throw new Error('Preventivo non trovato');

    const result = await orderService.createOrder({
      customerId: quote.customerId,
      requestedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      paymentTerm: quote.paymentTerm,
      notes: `Generato da preventivo ${quote.number}`,
      items: quote.items.map((qi) => ({
        productId: qi.productId,
        quantity: qi.quantity,
      })),
    });

    store.setState((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              status: 'CONVERTED',
              convertedOrderId: result.order.id,
            }
          : q
      ),
    }));

    return result.order.id;
  }
}

export const quoteService = new QuoteService();
