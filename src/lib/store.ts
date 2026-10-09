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
      return { success: false, error: 'Servizio di accesso non disponibile.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email o password non corrette.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Indirizzo email non ancora confermato. Controlla la tua casella di posta.';
        }
        return { success: false, error: msg };
      }

      if (!data?.user) {
        return { success: false, error: 'Accesso non riuscito. Riprova.' };
      }

      await this.restoreSupabaseSession(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Impossibile contattare il servizio di accesso. Riprova tra qualche istante.' };
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
      // Linked agent record (profiles.agent_id, migration 004); older setups match by email.
      const agentQuery = supabase.from('sales_agents').select('*');
      const { data: aData } = await (profileData?.agent_id
        ? agentQuery.eq('id', profileData.agent_id)
        : agentQuery.eq('email', userEmail)
      ).maybeSingle();
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

  /**
   * Pulls the data the current user is allowed to see (RLS decides) and replaces
   * the local copies. Runs only with a Supabase session; demo data stays otherwise.
   */
  public async syncFromSupabase(): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [orgsRes, agentsRes, customersRes, priceListsRes, productsRes] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        supabase.from('sales_agents').select('*').order('full_name'),
        supabase.from('customers').select('*').order('business_name'),
        supabase.from('price_lists').select('id, name'),
        supabase.from('products').select('*'),
      ]);

      const firstError = [orgsRes, agentsRes, customersRes].find((r) => r.error)?.error;
      if (firstError) {
        console.warn('Sync from Supabase skipped:', firstError.message);
        return;
      }

      const organizations: Organization[] = (orgsRes.data || []).map((o: any) => ({
        id: o.id,
        code: o.code,
        name: o.name,
        legalName: o.legal_name || o.name,
        vatNumber: o.vat_number || '',
        taxCode: o.tax_code || '',
        address: o.address || '',
        city: o.city || '',
        province: o.province || '',
        erpConnectorType: o.erp_connector_type || 'GENERIC_REST',
        erpEndpoint: o.erp_endpoint || '',
        erpStatus: o.erp_status || 'CONNECTED',
        erpLastSync: o.erp_last_sync || '',
        agentsCount: (agentsRes.data || []).filter((a: any) => a.org_id === o.id).length,
        customersCount: (customersRes.data || []).filter((c: any) => c.org_id === o.id).length,
        active: o.active ?? true,
        createdAt: o.created_at || '',
      }));

      const agents: SalesAgent[] = (agentsRes.data || []).map((a: any) => ({
        id: a.id,
        orgId: a.org_id,
        profileId: a.profile_id || '',
        code: a.code,
        fullName: a.full_name,
        email: a.email || '',
        phone: a.phone || '',
        area: a.area || '',
        commissionRate: Number(a.commission_rate ?? 0),
        monthlyTarget: Number(a.monthly_target ?? 0),
        yearlyTarget: Number(a.yearly_target ?? 0),
        active: a.active ?? true,
      }));

      const agentNames = new Map(agents.map((a) => [a.id, a.fullName]));
      const priceListNames = new Map((priceListsRes.data || []).map((p: any) => [p.id, p.name]));

      const customers: Customer[] = (customersRes.data || []).map((sc: any) => ({
        id: sc.id,
        orgId: sc.org_id,
        code: sc.code,
        businessName: sc.business_name,
        vatNumber: sc.vat_number || '',
        taxCode: sc.tax_code || '',
        sdiCode: sc.sdi_code || '0000000',
        email: sc.email || '',
        pec: sc.pec || '',
        phone: sc.phone || '',
        mobile: sc.mobile || '',
        address: sc.address || '',
        city: sc.city || '',
        province: sc.province || '',
        postalCode: sc.postal_code || '',
        country: sc.country || 'ITALIA',
        area: sc.area || '',
        salesAgentId: sc.sales_agent_id || '',
        salesAgentName: agentNames.get(sc.sales_agent_id) || '',
        priceListId: sc.price_list_id || '',
        priceListName: priceListNames.get(sc.price_list_id) || '',
        paymentTerm: sc.payment_term || '',
        iban: sc.iban || '',
        bankName: sc.bank_name || '',
        deliveryNotes: sc.delivery_notes || '',
        creditLimit: Number(sc.credit_limit ?? 0),
        currentExposure: Number(sc.current_exposure ?? 0),
        overdueAmount: Number(sc.overdue_amount ?? 0),
        status: sc.status || 'ACTIVE',
        category: sc.category || '',
        notes: sc.notes || undefined,
        createdAt: sc.created_at || '',
        updatedAt: sc.updated_at || '',
      }));

      const products: Product[] = (productsRes.data || []).map((sp: any) => ({
        id: sp.id,
        orgId: sp.org_id || '',
        code: sp.code,
        barcode: sp.barcode || '',
        name: sp.name,
        description: sp.description || '',
        categoryId: sp.category_id || '',
        categoryName: sp.code?.startsWith('OL') ? 'OLIO IMBOTTIGLIATO' : 'DOCG IMBOTTIGLIATI',
        brand: sp.brand || '',
        unit: sp.unit || 'BT',
        packInfo: sp.pack_info || '',
        basePrice: Number(sp.base_price ?? 0),
        costPrice: Number(sp.cost_price ?? 0),
        defaultDiscount1: Number(sp.default_discount1 ?? 0),
        defaultDiscount2: Number(sp.default_discount2 ?? 0),
        defaultDiscount3: Number(sp.default_discount3 ?? 0),
        imageUrl: sp.image_url || '',
        active: sp.active ?? true,
        isPromo: sp.is_promo ?? false,
      }));

      this.setState((prev) => {
        const activeOrgId = organizations.some((o) => o.id === prev.activeOrgId)
          ? prev.activeOrgId
          : organizations[0]?.id || prev.activeOrgId;
        return {
          ...prev,
          organizations: organizations.length > 0 ? organizations : prev.organizations,
          agents,
          customers,
          products: products.length > 0 ? products : prev.products,
          activeOrgId,
        };
      });

      await this.syncOrders();
    } catch (err) {
      console.warn('Sync from Supabase live skipped:', err);
    }
  }

  /** Reloads the orders the current user can see (RLS) with their lines. */
  public async syncOrders(): Promise<void> {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('orders')
      .select(
        '*, customers(code, business_name), sales_agents(full_name), ' +
          'order_items(*, products(code, name, pack_info, unit))'
      )
      .order('created_at', { ascending: false });
    if (error) {
      // Typically migration 005 not applied yet: keep the current list.
      console.warn('Orders sync skipped:', error.message);
      return;
    }

    const orders: Order[] = (data || []).map((o: any) => ({
      id: o.id,
      orgId: o.org_id,
      number: o.number,
      customerId: o.customer_id,
      customerCode: o.customers?.code || '',
      customerName: o.customers?.business_name || '',
      salesAgentId: o.sales_agent_id,
      salesAgentName: o.sales_agents?.full_name || '',
      status: o.status,
      orderDate: o.order_date || '',
      requestedDeliveryDate: o.requested_delivery_date || '',
      paymentTerm: o.payment_term || '',
      causal: o.causal || 'OV - ORDINI CLIENTI',
      notes: o.notes || '',
      subtotal: Number(o.subtotal ?? 0),
      discountTotal: Number(o.discount_total ?? 0),
      taxTotal: Number(o.tax_total ?? 0),
      total: Number(o.total ?? 0),
      residualTotal: Number(o.residual_total ?? 0),
      backOrder: o.back_order ?? false,
      blockReason: o.block_reason || undefined,
      erpSyncStatus: o.erp_sync_status || 'SYNCED',
      erpDocNumber: o.erp_doc_number || undefined,
      items: (o.order_items || []).map((i: any) => ({
        id: i.id,
        orderId: i.order_id,
        productId: i.product_id,
        productCode: i.products?.code || '',
        productName: i.products?.name || '',
        packInfo: i.products?.pack_info || '',
        unit: i.products?.unit || '',
        quantity: Number(i.quantity ?? 0),
        quantityShipped: Number(i.quantity_shipped ?? 0),
        listPrice: Number(i.list_price ?? 0),
        discount1: Number(i.discount1 ?? 0),
        discount2: Number(i.discount2 ?? 0),
        unitPrice: Number(i.unit_price ?? 0),
        lineTotal: Number(i.line_total ?? 0),
        notes: i.notes || undefined,
      })),
      createdAt: o.created_at || '',
      updatedAt: o.updated_at || o.created_at || '',
    }));

    this.setState((prev) => ({ ...prev, orders }));
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

