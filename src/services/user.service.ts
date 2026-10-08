import { store } from '../lib/store';
import { supabase } from '../lib/supabase/client';
import { ManagedUser, ManagedUserInput, UserRole } from '../types';

const FUNCTION_NAME = 'admin-users';
const NOT_DEPLOYED = 'Servizio gestione utenti non ancora attivo (Edge Function "admin-users" da pubblicare su Supabase).';

export interface DirectoryOrganization {
  id: string;
  code: string;
  name: string;
}

export interface DirectoryAgent {
  id: string;
  orgId: string;
  code: string;
  fullName: string;
  area: string;
}

// Permissions are enforced by the admin-users Edge Function; the checks here only drive the UI.
export class UserService {
  public currentRole(): UserRole {
    const state = store.getState();
    return state.profiles.find((p) => p.id === state.currentProfileId)?.role || 'AGENT';
  }

  public currentUserId(): string {
    return store.getState().currentProfileId;
  }

  public canManageUsers(): boolean {
    return this.currentRole() !== 'AGENT';
  }

  public assignableRoles(): UserRole[] {
    return this.currentRole() === 'HQ_SUPERADMIN' ? ['HQ_SUPERADMIN', 'ORG_ADMIN', 'AGENT'] : ['ORG_ADMIN', 'AGENT'];
  }

  public async listUsers(): Promise<ManagedUser[]> {
    const data = await this.call<{ users: ManagedUser[] }>({ action: 'list' });
    return data.users;
  }

  public async createUser(input: ManagedUserInput): Promise<ManagedUser> {
    const data = await this.call<{ user: ManagedUser }>({ action: 'create', user: input });
    return data.user;
  }

  public async updateUser(userId: string, input: ManagedUserInput): Promise<ManagedUser> {
    const data = await this.call<{ user: ManagedUser }>({ action: 'update', userId, user: input });
    return data.user;
  }

  public async setPassword(userId: string, password: string): Promise<void> {
    await this.call({ action: 'set_password', userId, password });
  }

  public async setDisabled(userId: string, disabled: boolean): Promise<void> {
    await this.call({ action: 'set_disabled', userId, disabled });
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.call({ action: 'delete', userId });
  }

  /** Organizations and agent records the current user can see (RLS). */
  public async loadDirectory(): Promise<{ organizations: DirectoryOrganization[]; agents: DirectoryAgent[] }> {
    if (!supabase) return { organizations: [], agents: [] };
    const [orgs, agents] = await Promise.all([
      supabase.from('organizations').select('id, code, name').order('code'),
      supabase.from('sales_agents').select('id, org_id, code, full_name, area').order('full_name'),
    ]);
    if (orgs.error) throw new Error(orgs.error.message);
    if (agents.error) throw new Error(agents.error.message);
    return {
      organizations: (orgs.data || []).map((o: any) => ({ id: o.id, code: o.code, name: o.name })),
      agents: (agents.data || []).map((a: any) => ({
        id: a.id,
        orgId: a.org_id,
        code: a.code,
        fullName: a.full_name,
        area: a.area || '',
      })),
    };
  }

  /** Random password without ambiguous characters, to hand over to the new user. */
  public generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint32Array(length));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }

  private async call<T = unknown>(body: Record<string, unknown>): Promise<T> {
    if (!supabase) throw new Error('Servizio non disponibile.');
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body });
    if (!error) return data as T;

    const response: Response | undefined = (error as any).context;
    if (response && typeof response.json === 'function') {
      if (response.status === 404) throw new Error(NOT_DEPLOYED);
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || payload?.message || `Errore del servizio utenti (${response.status}).`);
    }
    // Network or CORS failure: typically the function does not exist yet.
    if (error.name === 'FunctionsFetchError') throw new Error(NOT_DEPLOYED);
    throw new Error(error.message || 'Operazione non riuscita.');
  }
}

export const userService = new UserService();
