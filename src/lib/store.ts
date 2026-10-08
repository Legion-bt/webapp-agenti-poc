import {
  Organization,
  UserProfile,
  UserRole,
  SalesAgent,
  Customer,
  CustomerSuspendedItem,
  Product,
  WarehouseStock,
  PriceList,
  PriceListItem,
  CustomerProductPrice,
  Order,
  Quote,
  Visit,
  Commission,
  ErpSyncLog,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase/client';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_PROFILES,
  INITIAL_AGENTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUSPENDED_ITEMS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK,
  INITIAL_PRICE_LISTS,
  INITIAL_PRICE_LIST_ITEMS,
  INITIAL_CUSTOMER_PRICES,
  INITIAL_ORDERS,
  INITIAL_QUOTES,
  INITIAL_VISITS,
  INITIAL_COMMISSIONS,
  INITIAL_ERP_LOGS,
} from './mock-data';

const STORAGE_KEY = 'agentego_erp_database_v1';

export interface AppState {
  organizations: Organization[];
  profiles: UserProfile[];
  agents: SalesAgent[];
  customers: Customer[];
  suspendedItems: CustomerSuspendedItem[];
  products: Product[];
  stock: WarehouseStock[];
  priceLists: PriceList[];
  priceListItems: PriceListItem[];
  customerPrices: CustomerProductPrice[];
  orders: Order[];
  quotes: Quote[];
  visits: Visit[];
  commissions: Commission[];
  erpLogs: ErpSyncLog[];
  currentProfileId: string;
  activeOrgId: string;
  isAuthenticated: boolean;
}

function loadInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
      organizations: INITIAL_ORGANIZATIONS,
      profiles: INITIAL_PROFILES,
      agents: INITIAL_AGENTS,
      customers: INITIAL_CUSTOMERS,
      suspendedItems: INITIAL_SUSPENDED_ITEMS,
      products: INITIAL_PRODUCTS,
      stock: INITIAL_STOCK,
      priceLists: INITIAL_PRICE_LISTS,
      priceListItems: INITIAL_PRICE_LIST_ITEMS,
      customerPrices: INITIAL_CUSTOMER_PRICES,
      orders: INITIAL_ORDERS,
      quotes: INITIAL_QUOTES,
      visits: INITIAL_VISITS,
      commissions: INITIAL_COMMISSIONS,
      erpLogs: INITIAL_ERP_LOGS,
      currentProfileId: 'usr-agent-01',
      activeOrgId: 'org-01',
      isAuthenticated: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.customers && parsed.orders) {
        return {
          ...parsed,
          isAuthenticated: false, // Require Supabase session validation
        };
      }
    }
  } catch (err) {
    console.error('Failed to load local storage state:', err);
  }

  const defaultState: AppState = {
    organizations: INITIAL_ORGANIZATIONS,
    profiles: INITIAL_PROFILES,
    agents: INITIAL_AGENTS,
    customers: INITIAL_CUSTOMERS,
    suspendedItems: INITIAL_SUSPENDED_ITEMS,
    products: INITIAL_PRODUCTS,
    stock: INITIAL_STOCK,
    priceLists: INITIAL_PRICE_LISTS,
    priceListItems: INITIAL_PRICE_LIST_ITEMS,
    customerPrices: INITIAL_CUSTOMER_PRICES,
    orders: INITIAL_ORDERS,
    quotes: INITIAL_QUOTES,
    visits: INITIAL_VISITS,
    commissions: INITIAL_COMMISSIONS,
    erpLogs: INITIAL_ERP_LOGS,
    currentProfileId: 'usr-agent-01',
    activeOrgId: 'org-01',
    isAuthenticated: false,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  } catch {
    // Ignore storage quota errors
  }

  return defaultState;
}

class Store {
  private state: AppState = loadInitialState();
  private listeners: Set<() => void> = new Set();

  public getState(): AppState {
    return this.state;
  }

  public setState(updater: (prev: AppState) => AppState): void {
    this.state = updater(this.state);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.error('Storage save error:', err);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  public resetToDefault(): void {
    this.setState(() => ({
      organizations: INITIAL_ORGANIZATIONS,
      profiles: INITIAL_PROFILES,
      agents: INITIAL_AGENTS,
      customers: INITIAL_CUSTOMERS,
      suspendedItems: INITIAL_SUSPENDED_ITEMS,
      products: INITIAL_PRODUCTS,
      stock: INITIAL_STOCK,
      priceLists: INITIAL_PRICE_LISTS,
      priceListItems: INITIAL_PRICE_LIST_ITEMS,
      customerPrices: INITIAL_CUSTOMER_PRICES,
      orders: INITIAL_ORDERS,
      quotes: INITIAL_QUOTES,
      visits: INITIAL_VISITS,
      commissions: INITIAL_COMMISSIONS,
      erpLogs: INITIAL_ERP_LOGS,
      currentProfileId: 'usr-agent-01',
      activeOrgId: 'org-01',
      isAuthenticated: false,
    }));
  }

  public async loginWithSupabase(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: 'Configurazione Supabase non disponibile.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Credenziali non valide. Verifica l\'email e la password create nel tuo database Supabase.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Email non confermata in Supabase. Conferma l\'indirizzo o disabilita la conferma email nella dashboard di Supabase.';
        }
        return { success: false, error: msg };
      }

      if (!data?.user) {
        return { success: false, error: 'Nessun utente restituito dal server Supabase.' };
      }

      await this.restoreSupabaseSession(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Errore durante l\'autenticazione con Supabase' };
    }
  }

  public async restoreSupabaseSession(user: any): Promise<void> {
    if (!user || !supabase) return;
    const userEmail = user.email || '';

    // 1. Try fetching profile from Supabase 'profiles' table
    let profileData: any = null;
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      profileData = pData;
    } catch (err) {
      console.warn('Could not query profiles table:', err);
    }

    // 2. Try fetching from 'sales_agents' table
    let agentData: any = null;
    try {
      const { data: aData } = await supabase
        .from('sales_agents')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      agentData = aData;
    } catch (err) {
      console.warn('Could not query sales_agents table:', err);
    }

    const metaRole = user.user_metadata?.role;
    let computedRole: UserRole = 'AGENT';
    if (profileData?.role) {
      computedRole = profileData.role;
    } else if (metaRole === 'HQ_SUPERADMIN' || metaRole === 'admin' || metaRole === 'HQ_ADMIN') {
      computedRole = 'HQ_SUPERADMIN';
    } else if (metaRole === 'ORG_ADMIN' || metaRole === 'manager') {
      computedRole = 'ORG_ADMIN';
    } else if (agentData) {
      computedRole = 'AGENT';
    }

    const firstName =
      profileData?.first_name ||
      user.user_metadata?.first_name ||
      (agentData?.full_name ? agentData.full_name.split(' ')[0] : '') ||
      userEmail.split('@')[0];

    const lastName =
      profileData?.last_name ||
      user.user_metadata?.last_name ||
      (agentData?.full_name ? agentData.full_name.split(' ').slice(1).join(' ') : '') ||
      '';

    const orgId = profileData?.org_id || agentData?.org_id || 'org-01';

    const profile: UserProfile = {
      id: user.id,
      email: userEmail,
      firstName,
      lastName,
      role: computedRole,
      orgId,
      agentId: agentData?.id,
      avatarUrl: user.user_metadata?.avatar_url || profileData?.avatar_url,
    };

    this.setState((prev) => {
      const otherProfiles = prev.profiles.filter(
        (p) => p.id !== profile.id && p.email.toLowerCase() !== userEmail.toLowerCase()
      );
      return {
        ...prev,
        isAuthenticated: true,
        profiles: [profile, ...otherProfiles],
        currentProfileId: profile.id,
        activeOrgId: profile.orgId,
      };
    });

    // Sync remote data permitted by user's RLS role
    this.syncFromSupabase();
  }

  public async logout(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    this.clearLocalSession();
  }

  // Local-only reset, used when Supabase reports no session: calling signOut()
  // here would emit SIGNED_OUT again and loop forever via onAuthStateChange.
  public clearLocalSession(): void {
    if (!this.state.isAuthenticated) return;
    this.setState((prev) => ({
      ...prev,
      isAuthenticated: false,
    }));
  }

  public setActiveOrg(orgId: string): void {
    this.setState((prev) => ({
      ...prev,
      activeOrgId: orgId,
    }));
  }

  public async syncFromSupabase(): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;

    try {
      // Fetch live customers from Supabase
      const { data: supaCustomers } = await supabase.from('customers').select('*');
      const { data: supaProducts } = await supabase.from('products').select('*');
      const { data: supaOrders } = await supabase.from('orders').select('*');
      const { data: supaSuspended } = await supabase.from('customer_suspended_items').select('*');

      if (supaCustomers && supaCustomers.length > 0) {
        this.setState((prev) => {
          // Merge customers
          const mappedCustomers: Customer[] = supaCustomers.map((sc: any) => ({
            id: sc.id,
            orgId: sc.org_id || 'org-01',
            code: sc.code,
            businessName: sc.business_name,
            vatNumber: sc.vat_number,
            taxCode: sc.tax_code,
            sdiCode: sc.sdi_code || '0000000',
            email: sc.email,
            pec: sc.pec || '',
            phone: sc.phone || '',
            mobile: sc.mobile || '',
            address: sc.address,
            city: sc.city,
            province: sc.province,
            postalCode: sc.postal_code,
            country: sc.country || 'ITALIA',
            area: sc.area || '',
            salesAgentId: sc.sales_agent_id || 'agent-01',
            salesAgentName: 'Alessandro Manoni',
            priceListId: sc.price_list_id || 'pl-01',
            priceListName: '01_002 Listino Base 2026',
            paymentTerm: sc.payment_term || 'Bonifico 30/60/90',
            iban: sc.iban || '',
            bankName: sc.bank_name || '',
            deliveryNotes: sc.delivery_notes || '',
            creditLimit: Number(sc.credit_limit) || 950000,
            currentExposure: Number(sc.current_exposure) || 929762.68,
            overdueAmount: Number(sc.overdue_amount) || 811008.82,
            status: sc.status || 'BLOCKED',
            category: sc.category || 'HOTEL 3-4',
            createdAt: sc.created_at || '2026-01-01',
            updatedAt: sc.updated_at || '2026-10-07',
          }));

          // Merge products
          const mappedProducts: Product[] = (supaProducts && supaProducts.length > 0)
            ? supaProducts.map((sp: any) => ({
                id: sp.id,
                orgId: sp.org_id || 'org-01',
                code: sp.code,
                barcode: sp.barcode || '',
                name: sp.name,
                description: sp.description || '',
                categoryId: sp.category_id || 'cat-01',
                categoryName: sp.code.startsWith('OL') ? 'OLIO IMBOTTIGLIATO' : 'DOCG IMBOTTIGLIATI',
                brand: sp.brand || '',
                unit: sp.unit || 'BT',
                packInfo: sp.pack_info || '12 BT x CA12',
                basePrice: Number(sp.base_price) || 18,
                costPrice: Number(sp.cost_price) || 8,
                defaultDiscount1: Number(sp.default_discount1) || 0,
                defaultDiscount2: Number(sp.default_discount2) || 0,
                defaultDiscount3: Number(sp.default_discount3) || 0,
                imageUrl: sp.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500',
                active: sp.active ?? true,
                isPromo: sp.is_promo ?? false,
              }))
            : prev.products;

          return {
            ...prev,
            customers: mappedCustomers.length > 0 ? mappedCustomers : prev.customers,
            products: mappedProducts.length > 0 ? mappedProducts : prev.products,
          };
        });
      }
    } catch (err) {
      console.warn('Sync from Supabase live skipped:', err);
    }
  }
}

export const store = new Store();

// Hydrate from live Supabase if running in browser
if (typeof window !== 'undefined') {
  store.syncFromSupabase();

  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        store.restoreSupabaseSession(session.user);
      } else {
        store.clearLocalSession();
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        store.restoreSupabaseSession(session.user);
      } else {
        store.clearLocalSession();
      }
    });
  }
}

