import { store } from '../lib/store';
import { PricingResult } from '../types';

export interface PriceCalculationInput {
  customerId: string;
  productId: string;
  quantity: number;
  date?: string;
}

export class PricingService {
  /**
   * Calculates the exact ERP price according to business rules:
   * 1. customer_product_prices (specific contractual price)
   * 2. price_list_items (item in customer's assigned price list)
   * 3. product.base_price (fallback)
   * Then applies discount1 and discount2 sequentially:
   * net = price * (1 - d1/100) * (1 - d2/100)
   */
  public calculatePrice(input: PriceCalculationInput): PricingResult {
    const state = store.getState();
    const customer = state.customers.find((c) => c.id === input.customerId);
    const product = state.products.find((p) => p.id === input.productId);

    if (!product) {
      return {
        listPrice: 0,
        priceListCode: 'STANDARD',
        discount1: 0,
        discount2: 0,
        specialPrice: null,
        netPrice: 0,
        lineTotal: 0,
        reason: 'Articolo non trovato',
      };
    }

    // Step 1: Check customer specific contractual price
    const special = state.customerPrices.find(
      (cp) => cp.customerId === input.customerId && cp.productId === input.productId
    );

    if (special) {
      let net = special.price;
      if (special.discount1 > 0) net = net * (1 - special.discount1 / 100);
      if (special.discount2 > 0) net = net * (1 - special.discount2 / 100);
      const roundedNet = Math.round(net * 100) / 100;

      return {
        listPrice: special.price,
        priceListCode: 'CUSTOM_CONTRACT',
        discount1: special.discount1,
        discount2: special.discount2,
        specialPrice: special.price,
        netPrice: roundedNet,
        lineTotal: Math.round(roundedNet * input.quantity * 100) / 100,
        reason: `Prezzo speciale riservato al cliente (${special.discount1 > 0 ? `-${special.discount1}%` : 'Netto'})`,
      };
    }

    // Step 2: Check assigned price list
    const priceListId = customer?.priceListId;
    const priceListItem = priceListId
      ? state.priceListItems.find(
          (pli) => pli.priceListId === priceListId && pli.productId === input.productId
        )
      : null;

    if (priceListItem) {
      const pList = state.priceLists.find((pl) => pl.id === priceListId);
      let net = priceListItem.price;
      if (priceListItem.discount1 > 0) net = net * (1 - priceListItem.discount1 / 100);
      if (priceListItem.discount2 > 0) net = net * (1 - priceListItem.discount2 / 100);
      const roundedNet = Math.round(net * 100) / 100;

      return {
        listPrice: priceListItem.price,
        priceListCode: pList?.code || 'LISTINO',
        discount1: priceListItem.discount1,
        discount2: priceListItem.discount2,
        specialPrice: null,
        netPrice: roundedNet,
        lineTotal: Math.round(roundedNet * input.quantity * 100) / 100,
        reason: `Listino ${pList?.name || pList?.code || ''} con sconti ${priceListItem.discount1}% + ${priceListItem.discount2}%`,
      };
    }

    // Step 3: Base price with default discounts
    let net = product.basePrice;
    if (product.defaultDiscount1 > 0) net = net * (1 - product.defaultDiscount1 / 100);
    if (product.defaultDiscount2 > 0) net = net * (1 - product.defaultDiscount2 / 100);
    const roundedNet = Math.round(net * 100) / 100;

    return {
      listPrice: product.basePrice,
      priceListCode: 'BASE',
      discount1: product.defaultDiscount1,
      discount2: product.defaultDiscount2,
      specialPrice: null,
      netPrice: roundedNet,
      lineTotal: Math.round(roundedNet * input.quantity * 100) / 100,
      reason: product.defaultDiscount1 > 0
        ? `Prezzo base catalogo con sconto campagna (-${product.defaultDiscount1}%)`
        : 'Prezzo base catalogo',
    };
  }
}

export const pricingService = new PricingService();
