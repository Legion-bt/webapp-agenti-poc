// Edge Function "admin-users": user management for the AgenteGo web app.
//
// Creating users, changing passwords and disabling accounts need the service_role
// key, which must never reach the browser. The web app calls this function with the
// logged-in user's token; the function checks the caller's role and then acts with
// the service_role key.
//
// Who can do what:
//   HQ_SUPERADMIN -> every user, every role and organization
//   ORG_ADMIN     -> managers and agents of their own organization
//   AGENT         -> nothing
// Nobody can change their own role, disable or delete themselves.
//
// Deploy: Supabase dashboard > Edge Functions > Deploy a new function > Via editor,
// name "admin-users", paste this file. "Verify JWT" can stay off: the function
// verifies the token itself.

import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

type Role = 'HQ_SUPERADMIN' | 'ORG_ADMIN' | 'AGENT';
const ROLES: Role[] = ['HQ_SUPERADMIN', 'ORG_ADMIN', 'AGENT'];

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  org_id: string | null;
  agent_id: string | null;
}

interface UserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  orgId?: string | null;
  agentId?: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const MIN_PASSWORD = 8;
const DISABLED_BAN = '876000h'; // ~100 years

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = readSecretKey();
    if (!url || !serviceKey) throw new HttpError(500, 'Funzione non configurata (chiave di servizio mancante).');

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth?.user) throw new HttpError(401, 'Sessione scaduta: accedi di nuovo.');

    const caller = await getProfile(admin, auth.user.id);
    if (!caller || caller.role === 'AGENT') throw new HttpError(403, 'Non hai i permessi per gestire gli utenti.');

    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case 'list':
        return json({ users: await listUsers(admin, caller) });
      case 'create':
        return json({ user: await createUser(admin, caller, body.user || {}) });
      case 'update':
        return json({ user: await updateUser(admin, caller, body.userId, body.user || {}) });
      case 'set_password':
        await setPassword(admin, caller, body.userId, body.password);
        return json({ ok: true });
      case 'set_disabled':
        await setDisabled(admin, caller, body.userId, Boolean(body.disabled));
        return json({ ok: true });
      case 'delete':
        await deleteUser(admin, caller, body.userId);
        return json({ ok: true });
      default:
        throw new HttpError(400, 'Operazione non riconosciuta.');
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: 'Errore interno del servizio utenti.' }, 500);
  }
});

// ---------------------------------------------------------------------------

/**
 * Server-side key: a custom SUPABASE_SECRET_KEY secret, the new-style secret keys
 * injected by the platform (SUPABASE_SECRET_KEYS, JSON name -> key), or the legacy
 * service_role key.
 */
function readSecretKey(): string | undefined {
  const custom = Deno.env.get('SUPABASE_SECRET_KEY');
  if (custom) return custom;
  const injected = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (injected) {
    try {
      const keys = JSON.parse(injected) as Record<string, string>;
      const key = keys.default || Object.values(keys)[0];
      if (key) return key;
    } catch {
      /* not JSON: fall through to the legacy key */
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

async function getProfile(admin: SupabaseClient, id: string): Promise<Profile | null> {
  const { data, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new HttpError(500, `Lettura profilo non riuscita: ${error.message}`);
  return data as Profile | null;
}

function isDisabled(user: User): boolean {
  const until = (user as User & { banned_until?: string }).banned_until;
  return Boolean(until && new Date(until) > new Date());
}

function toDto(user: User, profile: Profile | undefined) {
  return {
    id: user.id,
    email: user.email || profile?.email || '',
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    role: profile?.role || null,
    orgId: profile?.org_id || null,
    agentId: profile?.agent_id || null,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at || null,
    disabled: isDisabled(user),
  };
}

/** HQ manages everyone; a manager manages non-HQ users of their own organization. */
function canManage(caller: Profile, target: Profile | null | undefined): boolean {
  if (caller.role === 'HQ_SUPERADMIN') return true;
  return Boolean(target && target.role !== 'HQ_SUPERADMIN' && target.org_id === caller.org_id);
}

async function listUsers(admin: SupabaseClient, caller: Profile) {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new HttpError(500, error.message);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const { data: profiles, error } = await admin.from('profiles').select('*');
  if (error) throw new HttpError(500, error.message);
  const byId = new Map((profiles as Profile[]).map((p) => [p.id, p]));

  return users
    .filter((u) => canManage(caller, byId.get(u.id)) || u.id === caller.id)
    .map((u) => toDto(u, byId.get(u.id)))
    .sort((a, b) => `${a.lastName} ${a.firstName} ${a.email}`.localeCompare(`${b.lastName} ${b.firstName} ${b.email}`));
}

/** Validates role, organization and agent; returns the profile fields to write. */
async function resolveAssignment(admin: SupabaseClient, caller: Profile, input: UserInput, targetId?: string) {
  const role = input.role;
  if (!role || !ROLES.includes(role)) throw new HttpError(400, 'Ruolo non valido.');

  let orgId = role === 'HQ_SUPERADMIN' ? null : input.orgId || null;
  if (caller.role === 'ORG_ADMIN') {
    if (role === 'HQ_SUPERADMIN') throw new HttpError(403, 'Solo la sede può assegnare il ruolo Amministratore.');
    orgId = caller.org_id;
  }
  if (role !== 'HQ_SUPERADMIN' && !orgId) throw new HttpError(400, "Seleziona l'organizzazione.");

  if (orgId) {
    const { data: org } = await admin.from('organizations').select('id').eq('id', orgId).maybeSingle();
    if (!org) throw new HttpError(400, 'Organizzazione non trovata.');
  }

  let agentId: string | null = null;
  if (role === 'AGENT') {
    if (!input.agentId) throw new HttpError(400, "Seleziona la scheda agente da collegare all'utente.");
    const { data: agent } = await admin
      .from('sales_agents')
      .select('id, org_id')
      .eq('id', input.agentId)
      .maybeSingle();
    if (!agent || agent.org_id !== orgId) throw new HttpError(400, "La scheda agente non appartiene all'organizzazione scelta.");

    let taken = admin.from('profiles').select('email').eq('agent_id', agent.id);
    if (targetId) taken = taken.neq('id', targetId);
    const { data: owner } = await taken.maybeSingle();
    if (owner) throw new HttpError(409, `Questa scheda agente è già collegata a ${owner.email}.`);
    agentId = agent.id;
  }

  return { role, org_id: orgId, agent_id: agentId };
}

function cleanName(value: string | undefined): string {
  return (value || '').trim().slice(0, 100);
}

function checkPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new HttpError(400, `La password deve avere almeno ${MIN_PASSWORD} caratteri.`);
  }
  return password;
}

async function createUser(admin: SupabaseClient, caller: Profile, input: UserInput) {
  const email = (input.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Indirizzo email non valido.');
  const password = checkPassword(input.password);
  const firstName = cleanName(input.firstName);
  const lastName = cleanName(input.lastName);
  if (!firstName) throw new HttpError(400, 'Inserisci il nome.');

  const assignment = await resolveAssignment(admin, caller, input);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  if (error || !data.user) {
    if (/already|registered|exists/i.test(error?.message || '')) {
      throw new HttpError(409, 'Esiste già un utente con questa email.');
    }
    throw new HttpError(400, error?.message || 'Creazione utente non riuscita.');
  }

  const profile = { id: data.user.id, email, first_name: firstName, last_name: lastName, ...assignment };
  const { error: profileError } = await admin.from('profiles').upsert(profile);
  if (profileError) {
    // Do not leave an account without role behind.
    await admin.auth.admin.deleteUser(data.user.id);
    throw new HttpError(500, `Profilo non salvato: ${profileError.message}`);
  }

  return toDto(data.user, profile as Profile);
}

async function loadTarget(admin: SupabaseClient, caller: Profile, userId: unknown) {
  if (typeof userId !== 'string' || !userId) throw new HttpError(400, 'Utente non specificato.');
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new HttpError(404, 'Utente non trovato.');
  const profile = await getProfile(admin, userId);
  if (!canManage(caller, profile)) throw new HttpError(403, 'Non puoi gestire questo utente.');
  return { user: data.user, profile };
}

async function updateUser(admin: SupabaseClient, caller: Profile, userId: unknown, input: UserInput) {
  const { user, profile } = await loadTarget(admin, caller, userId);
  const firstName = cleanName(input.firstName);
  if (!firstName) throw new HttpError(400, 'Inserisci il nome.');

  const assignment = await resolveAssignment(admin, caller, input, user.id);
  if (user.id === caller.id && (assignment.role !== caller.role || assignment.org_id !== caller.org_id)) {
    throw new HttpError(400, 'Non puoi cambiare il tuo ruolo o la tua organizzazione.');
  }

  const row = {
    id: user.id,
    email: user.email || profile?.email || '',
    first_name: firstName,
    last_name: cleanName(input.lastName),
    ...assignment,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from('profiles').upsert(row);
  if (error) throw new HttpError(500, `Profilo non salvato: ${error.message}`);

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, first_name: row.first_name, last_name: row.last_name },
  });
  return toDto(user, row as Profile);
}

async function setPassword(admin: SupabaseClient, caller: Profile, userId: unknown, password: unknown) {
  const { user } = await loadTarget(admin, caller, userId);
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: checkPassword(password) });
  if (error) throw new HttpError(400, error.message);
}

async function setDisabled(admin: SupabaseClient, caller: Profile, userId: unknown, disabled: boolean) {
  const { user } = await loadTarget(admin, caller, userId);
  if (user.id === caller.id) throw new HttpError(400, 'Non puoi disattivare il tuo account.');
  const { error } = await admin.auth.admin.updateUserById(user.id, { ban_duration: disabled ? DISABLED_BAN : 'none' });
  if (error) throw new HttpError(400, error.message);
}

async function deleteUser(admin: SupabaseClient, caller: Profile, userId: unknown) {
  const { user } = await loadTarget(admin, caller, userId);
  if (user.id === caller.id) throw new HttpError(400, 'Non puoi eliminare il tuo account.');
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new HttpError(400, error.message);
}
