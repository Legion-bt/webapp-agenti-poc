import { store } from '../lib/store';
import { Product, ProductCategory, WarehouseStock } from '../types';

export class ProductService {
  public getProducts(filters?: {
    search?: string;
    categoryId?: string;
    brand?: string;
    onlyAvailable?: boolean;
    onlyPromo?: boolean;
  }): Product[] {
    const state = store.getState();
    let list = state.products.filter((p) => p.active);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    if (filters?.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId);
    }

    if (filters?.brand) {
      list = list.filter((p) => p.brand.toLowerCase() === filters.brand!.toLowerCase());
    }

    if (filters?.onlyPromo) {
      list = list.filter((p) => p.isPromo);
    }

    if (filters?.onlyAvailable) {
      list = list.filter((p) => {
        const totalAvail = this.getTotalAvailableStock(p.id);
        return totalAvail > 0;
      });
    }

    return list;
  }

  public getProductById(id: string): Product | undefined {
    const state = store.getState();
    return state.products.find((p) => p.id === id);
  }

  public getProductByCode(code: string): Product | undefined {
    const state = store.getState();
    return state.products.find((p) => p.code.toLowerCase() === code.toLowerCase());
  }

  public getCategories(): ProductCategory[] {
    return store.getState().products.reduce<ProductCategory[]>((acc, prod) => {
      if (!acc.some((c) => c.id === prod.categoryId)) {
        acc.push({ id: prod.categoryId, code: prod.categoryId, name: prod.categoryName });
      }
      return acc;
    }, []);
  }

  public getStockForProduct(productId: string): WarehouseStock[] {
    return store.getState().stock.filter((s) => s.productId === productId);
  }

  public getTotalAvailableStock(productId: string): number {
    const stocks = this.getStockForProduct(productId);
    return stocks.reduce((sum, s) => sum + s.quantityAvailable, 0);
  }
}

export const productService = new ProductService();
