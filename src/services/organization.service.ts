import { store } from '../lib/store';
import { supabase } from '../lib/supabase/client';
import { Organization, ErpSyncLog } from '../types';

export interface OrganizationInput {
  code: string;
  name: string;
  legalName: string;
  vatNumber: string;
  taxCode: string;
  address: string;
  city: string;
  province: string;
  erpConnectorType: Organization['erpConnectorType'];
  erpEndpoint: string;
}

const UNAVAILABLE = 'Servizio non disponibile: serve la connessione al database.';

export class OrganizationService {
  public getOrganizations(): Organization[] {
    return store.getState().organizations;
  }

  public getActiveOrganization(): Organization | undefined {
    const state = store.getState();
    return state.organizations.find((o) => o.id === state.activeOrgId);
  }

  public getErpLogs(): ErpSyncLog[] {
    const state = store.getState();
    return state.erpLogs.filter((log) => log.orgId === state.activeOrgId);
  }

  public updateConnector(orgId: string, updates: Partial<Organization>): void {
    store.setState((prev) => ({
      ...prev,
      organizations: prev.organizations.map((org) =>
        org.id === orgId ? { ...org, ...updates } : org
      ),
    }));
  }

  public async triggerErpSync(entityType: 'ALL' | 'CUSTOMERS' | 'STOCK' | 'ORDERS' = 'ALL'): Promise<{
    success: boolean;
    recordsCount: number;
    message: string;
  }> {
    const org = this.getActiveOrganization();
    if (!org) throw new Error('Organizzazione non selezionata');

    const duration = Math.floor(250 + Math.random() * 450);
    const count = entityType === 'STOCK' ? 88 : entityType === 'CUSTOMERS' ? 42 : 130;

    const newLog: ErpSyncLog = {
      id: 'log-' + Date.now(),
      orgId: org.id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      entityType: entityType === 'ALL' ? 'CUSTOMERS' : (entityType as any),
      direction: 'ERP_TO_APP',
      status: 'SUCCESS',
      recordsCount: count,
      message: `Sincronizzazione manuale ${entityType} completata con successo con ${org.erpConnectorType}`,
      durationMs: duration,
    };

    store.setState((prev) => ({
      ...prev,
      organizations: prev.organizations.map((o) =>
        o.id === org.id
          ? {
              ...o,
              erpLastSync: new Date().toISOString().replace('T', ' ').slice(0, 19),
              erpStatus: 'CONNECTED',
            }
          : o
      ),
      erpLogs: [newLog, ...prev.erpLogs],
    }));

    return {
      success: true,
      recordsCount: count,
      message: `Sincronizzazione completata: ${count} record elaborati in ${duration}ms`,
    };
  }

  // Creation, changes and (de)activation are reserved to HQ by RLS on organizations
  // (supabase/migrations/002 and 009); the check here only drives the UI.
  public canManageOrganizations(): boolean {
    const state = store.getState();
    return state.profiles.find((p) => p.id === state.currentProfileId)?.role === 'HQ_SUPERADMIN';
  }

  /** Returns an error message for invalid input, or null. */
  public validate(input: OrganizationInput): string | null {
    if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(input.code)) {
      return 'Il codice deve avere da 2 a 30 caratteri: lettere maiuscole, numeri, "-" o "_".';
    }
    if (!input.name.trim()) return 'Inserisci il nome.';
    if (input.erpEndpoint && !/^https:\/\//i.test(input.erpEndpoint)) return "L'endpoint ERP deve iniziare con https://";
    return null;
  }

  public async createOrganization(input: OrganizationInput): Promise<string> {
    if (!supabase) throw new Error(UNAVAILABLE);
    const invalid = this.validate(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabase
      .from('organizations')
      .insert({ ...this.toRow(input), active: true, erp_status: 'OFFLINE', erp_last_sync: null })
      .select('id')
      .single();
    if (error) throw new Error(this.describeError(error));
    await store.syncFromSupabase();
    return data.id;
  }

  public async updateOrganization(id: string, input: OrganizationInput): Promise<void> {
    if (!supabase) throw new Error(UNAVAILABLE);
    const invalid = this.validate(input);
    if (invalid) throw new Error(invalid);
    await this.update(id, this.toRow(input));
  }

  /** Organizations are never deleted: deactivating keeps customers and orders. */
  public async setActive(id: string, active: boolean): Promise<void> {
    if (!supabase) throw new Error(UNAVAILABLE);
    await this.update(id, { active });
  }

  /** Number of price lists per organization (an organization needs one to take orders). */
  public async loadPriceListCounts(): Promise<Record<string, number>> {
    if (!supabase) return {};
    const { data, error } = await supabase.from('price_lists').select('org_id');
    if (error) throw new Error(this.describeError(error));
    return (data || []).reduce<Record<string, number>>((acc, row: any) => {
      acc[row.org_id] = (acc[row.org_id] || 0) + 1;
      return acc;
    }, {});
  }

  /** Empty base price list, so customers of a new organization can be assigned one. */
  public async createBasePriceList(orgId: string): Promise<void> {
    if (!supabase) throw new Error(UNAVAILABLE);
    const year = new Date().getFullYear();
    const { error } = await supabase.from('price_lists').insert({
      org_id: orgId,
      code: '01_BASE',
      name: `01_BASE Listino Base ${year}`,
      valid_from: new Date().toISOString().slice(0, 10),
      active: true,
    });
    if (error) throw new Error(this.describeError(error));
    await store.syncFromSupabase();
  }

  private async update(id: string, row: Record<string, unknown>): Promise<void> {
    const { data, error } = await supabase!.from('organizations').update(row).eq('id', id).select('id');
    if (error) throw new Error(this.describeError(error));
    if (!data || data.length === 0) throw new Error('Solo la sede può modificare le organizzazioni.');
    await store.syncFromSupabase();
  }

  private toRow(input: OrganizationInput) {
    const clean = (v: string) => v.trim() || null;
    return {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      legal_name: clean(input.legalName),
      vat_number: clean(input.vatNumber),
      tax_code: clean(input.taxCode),
      address: clean(input.address),
      city: clean(input.city),
      province: clean(input.province.toUpperCase()),
      erp_connector_type: input.erpConnectorType,
      erp_endpoint: clean(input.erpEndpoint),
    };
  }

  private describeError(error: { message: string; code?: string }): string {
    if (error.code === '23505') {
      return /price_lists/i.test(error.message)
        ? 'Questa organizzazione ha già un listino con codice 01_BASE.'
        : "Esiste già un'organizzazione con questo codice.";
    }
    if (/row-level security|violates|permission denied|42501/i.test(error.message)) {
      return 'Solo la sede può gestire le organizzazioni.';
    }
    return error.message || 'Operazione non riuscita.';
  }
}

export const organizationService = new OrganizationService();
