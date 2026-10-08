import { store } from '../lib/store';
import { Organization, ErpSyncLog } from '../types';

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

  public createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'erpLastSync' | 'agentsCount' | 'customersCount'>): Organization {
    const newOrg: Organization = {
      ...data,
      id: 'org-' + Date.now(),
      erpLastSync: 'Non ancora eseguita',
      agentsCount: 1,
      customersCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    store.setState((prev) => ({
      ...prev,
      organizations: [...prev.organizations, newOrg],
    }));

    return newOrg;
  }
}

export const organizationService = new OrganizationService();
