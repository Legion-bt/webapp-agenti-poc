import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { organizationService, OrganizationInput } from '../../services/organization.service';
import { Organization } from '../../types';
import { Field, IconButton, Modal, fieldClass } from './ui';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Ban,
  CircleCheck,
  Loader2,
  AlertCircle,
  X,
  Users,
  Store,
  ListChecks,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

const CONNECTORS: { value: Organization['erpConnectorType']; label: string }[] = [
  { value: 'GENERIC_REST', label: 'Gateway REST generico' },
  { value: 'SAP_BUSINESS_ONE', label: 'SAP Business One (Service Layer)' },
];

const EMPTY_INPUT: OrganizationInput = {
  code: '',
  name: '',
  legalName: '',
  vatNumber: '',
  taxCode: '',
  address: '',
  city: '',
  province: '',
  erpConnectorType: 'GENERIC_REST',
  erpEndpoint: '',
};

type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; org: Organization }
  | { kind: 'created'; orgId: string }
  | null;

interface OrganizationsViewProps {
  organizations: Organization[];
  onNavigate: (view: string, id?: string) => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({ organizations, onNavigate }) => {
  const [priceLists, setPriceLists] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ACTIVE');
  const [dialog, setDialog] = useState<Dialog>(null);

  const loadPriceLists = useCallback(async () => {
    try {
      setPriceLists(await organizationService.loadPriceListCounts());
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadPriceLists();
  }, [loadPriceLists]);

  const counts = useMemo(
    () => ({
      ACTIVE: organizations.filter((o) => o.active).length,
      INACTIVE: organizations.filter((o) => !o.active).length,
      ALL: organizations.length,
    }),
    [organizations]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((o) => {
      if (status === 'ACTIVE' && !o.active) return false;
      if (status === 'INACTIVE' && o.active) return false;
      if (!q) return true;
      return `${o.code} ${o.name} ${o.legalName} ${o.city} ${o.vatNumber}`.toLowerCase().includes(q);
    });
  }, [organizations, search, status]);

  const run = async (orgId: string, action: () => Promise<void>) => {
    setBusyId(orgId);
    setError(null);
    try {
      await action();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = (org: Organization) => {
    const message = org.active
      ? `Disattivare ${org.name}? I suoi manager e agenti non potranno più accedere ai dati. Clienti, ordini e utenti restano salvati e tornano disponibili riattivandola.`
      : `Riattivare ${org.name}? I suoi utenti potranno di nuovo accedere.`;
    if (!window.confirm(message)) return;
    run(org.id, () => organizationService.setActive(org.id, !org.active));
  };

  const createPriceList = (org: Organization) =>
    run(org.id, async () => {
      await organizationService.createBasePriceList(org.id);
      await loadPriceLists();
    });

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'ACTIVE', label: 'Attive' },
    { id: 'INACTIVE', label: 'Disattivate' },
    { id: 'ALL', label: 'Tutte' },
  ];

  const createdOrg = dialog?.kind === 'created' ? organizations.find((o) => o.id === dialog.orgId) : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Organizzazioni</h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {counts.ACTIVE} attive
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Le aziende clienti della piattaforma: ognuna ha i suoi manager, agenti, clienti, listini e collegamento ERP.
          </p>
        </div>
        <button
          onClick={() => setDialog({ kind: 'create' })}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuova organizzazione
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per codice, nome, città o P.IVA…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={`cursor-pointer whitespace-nowrap px-3 h-8 rounded-md text-xs font-semibold transition-colors ${
                status === f.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100'
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
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            {organizations.length === 0 ? 'Nessuna organizzazione.' : 'Nessuna organizzazione corrisponde ai filtri.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((o) => {
              const lists = priceLists?.[o.id] ?? 0;
              return (
                <li
                  key={o.id}
                  className={`flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-4 ${
                    o.active ? 'hover:bg-slate-50/60 dark:hover:bg-white/[0.03]' : 'bg-slate-50/70 dark:bg-white/[0.03]'
                  }`}
                >
                  {/* Identity */}
                  <div className="flex items-center gap-3 min-w-0 lg:w-[36%]">
                    <span
                      className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-white ${
                        o.active ? 'bg-gradient-to-br from-blue-500 to-violet-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${o.active ? 'text-slate-900' : 'text-slate-500'}`}>{o.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        <span className="font-mono">{o.code}</span>
                        {o.city && ` · ${o.city}${o.province ? ` (${o.province})` : ''}`}
                        {o.vatNumber && ` · ${o.vatNumber}`}
                      </p>
                    </div>
                  </div>

                  {/* Figures */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 lg:flex-1">
                    <span className="inline-flex items-center gap-1.5" title="Schede agente">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {o.agentsCount} agenti
                    </span>
                    <span className="inline-flex items-center gap-1.5" title="Clienti">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      {o.customersCount} clienti
                    </span>
                    {priceLists === null ? null : lists > 0 ? (
                      <span className="inline-flex items-center gap-1.5" title="Listini">
                        <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                        {lists} {lists === 1 ? 'listino' : 'listini'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                        <ListChecks className="w-3.5 h-3.5" />
                        Nessun listino
                        {o.active && busyId !== o.id && (
                          <button
                            onClick={() => createPriceList(o)}
                            className="cursor-pointer ml-1 underline underline-offset-2 hover:text-amber-700"
                          >
                            crea listino base
                          </button>
                        )}
                      </span>
                    )}
                    <span className="text-slate-500">{CONNECTORS.find((c) => c.value === o.erpConnectorType)?.label}</span>
                    {!o.active && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        Disattivata
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 lg:w-[96px] lg:justify-end">
                    {busyId === o.id ? (
                      <Loader2 className="w-4 h-4 m-2 text-slate-400 animate-spin" />
                    ) : (
                      <>
                        <IconButton title="Modifica" onClick={() => setDialog({ kind: 'edit', org: o })} icon={Pencil} />
                        <IconButton
                          title={o.active ? 'Disattiva' : 'Riattiva'}
                          onClick={() => toggleActive(o)}
                          icon={o.active ? Ban : CircleCheck}
                          danger={o.active}
                        />
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
        <OrganizationFormDialog
          org={dialog.kind === 'edit' ? dialog.org : undefined}
          onClose={() => setDialog(null)}
          onCreated={(orgId) => {
            loadPriceLists();
            setDialog({ kind: 'created', orgId });
          }}
          onSaved={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'created' && (
        <Modal title="Organizzazione creata" subtitle={createdOrg?.name} onClose={() => setDialog(null)}>
          <p className="text-sm text-slate-600">Per renderla operativa:</p>
          <ol className="mt-3 space-y-3">
            <NextStep
              done={Boolean(priceLists?.[dialog.orgId])}
              title="Crea il listino base"
              text="Serve per assegnare i clienti e prendere ordini. Gli articoli arriveranno dal collegamento ERP."
              action={
                priceLists?.[dialog.orgId] ? undefined : (
                  <button
                    onClick={() => createdOrg && createPriceList(createdOrg)}
                    disabled={busyId === dialog.orgId}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {busyId === dialog.orgId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListChecks className="w-3.5 h-3.5" />}
                    Crea listino base
                  </button>
                )
              }
            />
            <NextStep
              title="Crea il manager e gli agenti"
              text='Da "Utenti e accessi", scegliendo questa organizzazione. La scheda agente si crea insieme all’utente.'
              action={
                <button
                  onClick={() => onNavigate('admin-users')}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Vai a Utenti e accessi
                </button>
              }
            />
          </ol>
          {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}
          <div className="flex justify-end pt-5">
            <button
              onClick={() => setDialog(null)}
              className="cursor-pointer px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
            >
              Fatto
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const NextStep: React.FC<{ title: string; text: string; done?: boolean; action?: React.ReactNode }> = ({
  title,
  text,
  done,
  action,
}) => (
  <li className="flex items-start gap-3 p-3 rounded-lg border border-slate-200">
    <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${done ? 'text-emerald-500' : 'text-slate-300'}`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  </li>
);

const OrganizationFormDialog: React.FC<{
  org?: Organization;
  onClose: () => void;
  onCreated: (orgId: string) => void;
  onSaved: () => void;
}> = ({ org, onClose, onCreated, onSaved }) => {
  const isEdit = Boolean(org);
  const [input, setInput] = useState<OrganizationInput>(() =>
    org
      ? {
          code: org.code,
          name: org.name,
          legalName: org.legalName === org.name ? '' : org.legalName,
          vatNumber: org.vatNumber,
          taxCode: org.taxCode,
          address: org.address,
          city: org.city,
          province: org.province,
          erpConnectorType: org.erpConnectorType,
          erpEndpoint: org.erpEndpoint,
        }
      : EMPTY_INPUT
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof OrganizationInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInput((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (org) {
        await organizationService.updateOrganization(org.id, input);
        onSaved();
      } else {
        onCreated(await organizationService.createOrganization(input));
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifica organizzazione' : 'Nuova organizzazione'}
      subtitle={isEdit ? org!.code : 'Potrai aggiungere manager, agenti e listini subito dopo.'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Codice" hint={isEdit ? 'Non modificabile.' : 'Es. ORG-03'}>
            <input
              value={input.code}
              onChange={(e) => setInput((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
              className={`${fieldClass} font-mono`}
              disabled={isEdit}
              required
              autoFocus={!isEdit}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Nome">
              <input value={input.name} onChange={set('name')} className={fieldClass} required />
            </Field>
          </div>
        </div>

        <Field label="Ragione sociale" hint="Se diversa dal nome.">
          <input value={input.legalName} onChange={set('legalName')} className={fieldClass} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Partita IVA">
            <input value={input.vatNumber} onChange={set('vatNumber')} className={`${fieldClass} font-mono`} />
          </Field>
          <Field label="Codice fiscale">
            <input value={input.taxCode} onChange={set('taxCode')} className={`${fieldClass} font-mono`} />
          </Field>
        </div>

        <Field label="Indirizzo">
          <input value={input.address} onChange={set('address')} className={fieldClass} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Città">
              <input value={input.city} onChange={set('city')} className={fieldClass} />
            </Field>
          </div>
          <Field label="Provincia">
            <input value={input.province} onChange={set('province')} className={`${fieldClass} uppercase`} maxLength={2} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Connettore ERP">
            <select value={input.erpConnectorType} onChange={set('erpConnectorType')} className={fieldClass}>
              {CONNECTORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Endpoint ERP" hint="Facoltativo, si può impostare dopo.">
            <input
              value={input.erpEndpoint}
              onChange={set('erpEndpoint')}
              className={`${fieldClass} font-mono text-xs`}
              placeholder="https://…"
            />
          </Field>
        </div>

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
            {isEdit ? 'Salva modifiche' : 'Crea organizzazione'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
