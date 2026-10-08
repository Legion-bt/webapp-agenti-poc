import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { userService, DirectoryAgent, DirectoryOrganization } from '../../services/user.service';
import { ManagedUser, ManagedUserInput, UserRole } from '../../types';
import {
  UserPlus,
  Search,
  Pencil,
  KeyRound,
  Ban,
  CircleCheck,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Briefcase,
  UserRound,
} from 'lucide-react';

const ROLE_INFO: Record<UserRole, { label: string; description: string; badge: string; icon: React.ElementType }> = {
  HQ_SUPERADMIN: {
    label: 'Amministratore',
    description: 'Sede centrale: vede tutte le organizzazioni e gestisce tutti gli utenti.',
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
    icon: ShieldCheck,
  },
  ORG_ADMIN: {
    label: 'Manager',
    description: "Vede clienti e ordini della propria organizzazione e ne gestisce gli utenti.",
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Briefcase,
  },
  AGENT: {
    label: 'Agente',
    description: 'Vede solo i clienti assegnati alla sua scheda agente.',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: UserRound,
  },
};

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Mai';

const initialsOf = (u: ManagedUser) =>
  ((u.firstName.charAt(0) || u.email.charAt(0)) + u.lastName.charAt(0)).toUpperCase();

const displayName = (u: ManagedUser) => `${u.firstName} ${u.lastName}`.trim() || u.email.split('@')[0];

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: ManagedUser }
  | { kind: 'password'; user: ManagedUser }
  | { kind: 'credentials'; email: string; password: string; title: string }
  | null;

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [organizations, setOrganizations] = useState<DirectoryOrganization[]>([]);
  const [agents, setAgents] = useState<DirectoryAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [dialog, setDialog] = useState<Dialog>(null);

  const isHq = userService.currentRole() === 'HQ_SUPERADMIN';
  const selfId = userService.currentUserId();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, directory] = await Promise.all([userService.listUsers(), userService.loadDirectory()]);
      setUsers(list);
      setOrganizations(directory.organizations);
      setAgents(directory.agents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orgName = (id: string | null) => organizations.find((o) => o.id === id)?.name || '—';
  const agentLabel = (id: string | null) => {
    const a = agents.find((x) => x.id === id);
    return a ? `${a.code} · ${a.fullName}` : null;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!q) return true;
      return `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  const runAction = async (user: ManagedUser, action: () => Promise<void>) => {
    setBusyId(user.id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleDisabled = (user: ManagedUser) => {
    const verb = user.disabled ? 'Riattivare' : 'Disattivare';
    if (!window.confirm(`${verb} l'accesso di ${displayName(user)}?`)) return;
    runAction(user, () => userService.setDisabled(user.id, !user.disabled));
  };

  const remove = (user: ManagedUser) => {
    if (!window.confirm(`Eliminare definitivamente l'utente ${user.email}? L'operazione non si può annullare.`)) return;
    runAction(user, () => userService.deleteUser(user.id));
  };

  const counts = useMemo(
    () => ({
      ALL: users.length,
      HQ_SUPERADMIN: users.filter((u) => u.role === 'HQ_SUPERADMIN').length,
      ORG_ADMIN: users.filter((u) => u.role === 'ORG_ADMIN').length,
      AGENT: users.filter((u) => u.role === 'AGENT').length,
    }),
    [users]
  );

  const filters: { id: 'ALL' | UserRole; label: string }[] = [
    { id: 'ALL', label: 'Tutti' },
    ...(isHq ? [{ id: 'HQ_SUPERADMIN' as const, label: 'Amministratori' }] : []),
    { id: 'ORG_ADMIN', label: 'Manager' },
    { id: 'AGENT', label: 'Agenti' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Utenti e accessi</h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {users.length} utenti
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isHq
              ? 'Crea gli account di sede, manager e agenti e decidi cosa può vedere ciascuno.'
              : 'Crea e gestisci gli account dei manager e degli agenti della tua organizzazione.'}
          </p>
        </div>
        <button
          onClick={() => setDialog({ kind: 'create' })}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuovo utente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o email…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`cursor-pointer whitespace-nowrap px-3 h-8 rounded-md text-xs font-semibold transition-colors ${
                roleFilter === f.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label} <span className="opacity-60 font-mono">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="cursor-pointer text-rose-500 hover:text-rose-700" aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Caricamento utenti…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            {users.length === 0 ? 'Nessun utente da mostrare.' : 'Nessun utente corrisponde alla ricerca.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((u) => {
              const role = u.role ? ROLE_INFO[u.role] : null;
              const isSelf = u.id === selfId;
              const agent = u.role === 'AGENT' ? agentLabel(u.agentId) : null;
              return (
                <li
                  key={u.id}
                  className={`flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-4 ${u.disabled ? 'bg-slate-50/70 dark:bg-white/[0.03]' : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.03]'}`}
                >
                  {/* Identity */}
                  <div className="flex items-center gap-3 min-w-0 lg:w-[34%]">
                    <span
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        u.disabled ? 'bg-slate-300' : 'bg-gradient-to-br from-blue-500 to-violet-600'
                      }`}
                    >
                      {initialsOf(u)}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${u.disabled ? 'text-slate-500' : 'text-slate-900'}`}>
                        {displayName(u)}
                        {isSelf && <span className="ml-2 text-xs font-medium text-slate-400">(tu)</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Role & scope */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0 lg:flex-1">
                    {role ? (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${role.badge}`}>
                        <role.icon className="w-3.5 h-3.5" />
                        {role.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                        Senza ruolo
                      </span>
                    )}
                    {u.role && u.role !== 'HQ_SUPERADMIN' && (
                      <span className="text-xs text-slate-600 truncate">{orgName(u.orgId)}</span>
                    )}
                    {u.role === 'AGENT' && (
                      <span className={`text-xs truncate ${agent ? 'text-slate-500' : 'text-amber-600 font-medium'}`}>
                        {agent ? `Agente ${agent}` : 'Nessuna scheda agente'}
                      </span>
                    )}
                    {u.disabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        Disattivato
                      </span>
                    )}
                  </div>

                  {/* Last access */}
                  <div className="text-xs text-slate-500 lg:w-40 shrink-0">
                    <span className="lg:hidden">Ultimo accesso: </span>
                    {formatDate(u.lastSignInAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 lg:w-[148px] lg:justify-end">
                    {busyId === u.id ? (
                      <Loader2 className="w-4 h-4 m-2 text-slate-400 animate-spin" />
                    ) : (
                      <>
                        <IconButton title="Modifica" onClick={() => setDialog({ kind: 'edit', user: u })} icon={Pencil} />
                        <IconButton title="Reimposta password" onClick={() => setDialog({ kind: 'password', user: u })} icon={KeyRound} />
                        {!isSelf && (
                          <IconButton
                            title={u.disabled ? 'Riattiva accesso' : 'Disattiva accesso'}
                            onClick={() => toggleDisabled(u)}
                            icon={u.disabled ? CircleCheck : Ban}
                          />
                        )}
                        {!isSelf && <IconButton title="Elimina" onClick={() => remove(u)} icon={Trash2} danger />}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <UserFormDialog
          user={dialog.kind === 'edit' ? dialog.user : undefined}
          users={users}
          organizations={organizations}
          agents={agents}
          isSelf={dialog.kind === 'edit' && dialog.user.id === selfId}
          onClose={() => setDialog(null)}
          onSaved={async (created) => {
            await load();
            setDialog(
              created
                ? { kind: 'credentials', title: 'Utente creato', email: created.email, password: created.password }
                : null
            );
          }}
        />
      )}

      {dialog?.kind === 'password' && (
        <PasswordDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={(password) =>
            setDialog({ kind: 'credentials', title: 'Password aggiornata', email: dialog.user.email, password })
          }
        />
      )}

      {dialog?.kind === 'credentials' && (
        <CredentialsDialog title={dialog.title} email={dialog.email} password={dialog.password} onClose={() => setDialog(null)} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const IconButton: React.FC<{ title: string; onClick: () => void; icon: React.ElementType; danger?: boolean }> = ({
  title,
  onClick,
  icon: Icon,
  danger,
}) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`cursor-pointer p-2 rounded-lg text-slate-500 transition-colors ${
      danger ? 'hover:text-rose-600 hover:bg-rose-50' : 'hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const Modal: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  subtitle,
  onClose,
  children,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 pt-5 pb-4 bg-white border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="cursor-pointer p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const fieldClass =
  'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-xs text-slate-500 mt-1.5">{hint}</span>}
  </label>
);

const PasswordInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(true);
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          className={`${fieldClass} pr-10 font-mono`}
          minLength={8}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
          aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => onChange(userService.generatePassword())}
        className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Genera
      </button>
    </div>
  );
};

const UserFormDialog: React.FC<{
  user?: ManagedUser;
  users: ManagedUser[];
  organizations: DirectoryOrganization[];
  agents: DirectoryAgent[];
  isSelf: boolean;
  onClose: () => void;
  onSaved: (created?: { email: string; password: string }) => void;
}> = ({ user, users, organizations, agents, isSelf, onClose, onSaved }) => {
  const isEdit = Boolean(user);
  const isHq = userService.currentRole() === 'HQ_SUPERADMIN';
  const roles = userService.assignableRoles();

  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'AGENT');
  const [orgId, setOrgId] = useState<string>(user?.orgId || (organizations.length === 1 ? organizations[0].id : ''));
  const [agentId, setAgentId] = useState<string>(user?.agentId || '');
  const [password, setPassword] = useState(() => (isEdit ? '' : userService.generatePassword()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent records of the chosen organization not linked to another user.
  const takenAgentIds = new Set(users.filter((u) => u.id !== user?.id && u.agentId).map((u) => u.agentId));
  const orgAgents = agents.filter((a) => a.orgId === orgId);
  const freeAgents = orgAgents.filter((a) => !takenAgentIds.has(a.id));

  const pickAgent = (id: string) => {
    setAgentId(id);
    // Prefill the name from the agent record when creating.
    const agent = agents.find((a) => a.id === id);
    if (agent && !isEdit && !firstName && !lastName) {
      const [first, ...rest] = agent.fullName.split(' ');
      setFirstName(first);
      setLastName(rest.join(' '));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const input: ManagedUserInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      orgId: role === 'HQ_SUPERADMIN' ? null : orgId || null,
      agentId: role === 'AGENT' ? agentId || null : null,
    };
    try {
      if (user) {
        await userService.updateUser(user.id, input);
        onSaved();
      } else {
        await userService.createUser({ ...input, email: email.trim(), password });
        onSaved({ email: email.trim().toLowerCase(), password });
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifica utente' : 'Nuovo utente'}
      subtitle={isEdit ? user!.email : "L'utente potrà accedere subito con email e password."}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} required autoFocus />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldClass} required />
          </Field>
          <Field label="Cognome">
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldClass} />
          </Field>
        </div>

        <fieldset disabled={isSelf}>
          <legend className="block text-xs font-semibold text-slate-700 mb-1.5">Ruolo</legend>
          <div className="space-y-2">
            {roles.map((r) => {
              const info = ROLE_INFO[r];
              const selected = role === r;
              return (
                <label
                  key={r}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'
                  } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input type="radio" name="role" value={r} checked={selected} onChange={() => setRole(r)} className="sr-only" />
                  <info.icon className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{info.label}</span>
                    <span className="block text-xs text-slate-500">{info.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {isSelf && <p className="text-xs text-slate-500 mt-2">Non puoi cambiare il tuo ruolo.</p>}
        </fieldset>

        {role !== 'HQ_SUPERADMIN' && (
          <Field label="Organizzazione">
            <select
              value={orgId}
              onChange={(e) => {
                setOrgId(e.target.value);
                setAgentId('');
              }}
              className={fieldClass}
              disabled={!isHq || isSelf}
              required
            >
              <option value="" disabled>
                Seleziona…
              </option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {o.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {role === 'AGENT' && (
          <Field
            label="Scheda agente"
            hint={
              orgId && freeAgents.length === 0
                ? "Tutte le schede agente di questa organizzazione sono già collegate a un utente."
                : "L'utente vedrà i clienti assegnati a questo agente."
            }
          >
            <select value={agentId} onChange={(e) => pickAgent(e.target.value)} className={fieldClass} disabled={!orgId} required>
              <option value="" disabled>
                {orgId ? 'Seleziona…' : "Scegli prima l'organizzazione"}
              </option>
              {orgAgents.map((a) => (
                <option key={a.id} value={a.id} disabled={takenAgentIds.has(a.id)}>
                  {a.code} · {a.fullName}
                  {a.area ? ` — ${a.area}` : ''}
                  {takenAgentIds.has(a.id) ? ' (già collegata)' : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        {!isEdit && (
          <Field label="Password iniziale" hint="Almeno 8 caratteri. La vedrai ancora dopo il salvataggio, per comunicarla all'utente.">
            <PasswordInput value={password} onChange={setPassword} />
          </Field>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="cursor-pointer px-4 h-10 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Salva modifiche' : 'Crea utente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const PasswordDialog: React.FC<{ user: ManagedUser; onClose: () => void; onSaved: (password: string) => void }> = ({
  user,
  onClose,
  onSaved,
}) => {
  const [password, setPassword] = useState(() => userService.generatePassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await userService.setPassword(user.id, password);
      onSaved(password);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Reimposta password" subtitle={user.email} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nuova password" hint="La password attuale smette di funzionare subito.">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="cursor-pointer px-4 h-10 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Imposta password
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CredentialsDialog: React.FC<{ title: string; email: string; password: string; onClose: () => void }> = ({
  title,
  email,
  password,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const text = `Accesso AgenteGo\nIndirizzo: ${window.location.origin}\nEmail: ${email}\nPassword: ${password}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available: the values stay visible to copy by hand */
    }
  };

  return (
    <Modal title={title} subtitle="Comunica queste credenziali all'utente: la password non sarà più visibile." onClose={onClose}>
      <dl className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Indirizzo</dt>
          <dd className="font-medium text-slate-900 truncate">{window.location.origin}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-900 truncate">{email}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Password</dt>
          <dd className="font-mono font-semibold text-slate-900 select-all">{password}</dd>
        </div>
      </dl>
      <div className="flex justify-end gap-2 pt-5">
        <button
          onClick={copy}
          className="cursor-pointer inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiato' : 'Copia'}
        </button>
        <button onClick={onClose} className="cursor-pointer px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
          Fatto
        </button>
      </div>
    </Modal>
  );
};
