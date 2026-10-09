import React, { useState } from 'react';
import { store } from '../../lib/store';
import { organizationService } from '../../services/organization.service';
import { getDatabaseStatus, testSupabaseConnection } from '../../lib/supabase/client';
import {
  Server,
  Building2,
  RefreshCw,
  Database,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Plus,
  ShieldCheck,
  Copy,
  ExternalLink,
  Check,
  UserCheck,
} from 'lucide-react';

export const AdminErpView: React.FC = () => {
  const state = store.getState();
  const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId) || state.profiles[0];
  const organizations = organizationService.getOrganizations();
  const activeOrg = organizationService.getActiveOrganization() || organizations[0];
  const erpLogs = organizationService.getErpLogs();
  const dbStatus = getDatabaseStatus();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Supabase Live test state
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    connected: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Edit connector form
  const [connectorType, setConnectorType] = useState(activeOrg.erpConnectorType);
  const [endpoint, setEndpoint] = useState(activeOrg.erpEndpoint);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult(res);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleManualSync = async (type: 'ALL' | 'CUSTOMERS' | 'STOCK' | 'ORDERS' = 'ALL') => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await organizationService.triggerErpSync(type);
      setSyncFeedback(res.message);
    } catch (err: any) {
      setSyncFeedback(`Errore sync: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConnector = (e: React.FormEvent) => {
    e.preventDefault();
    organizationService.updateConnector(activeOrg.id, {
      erpConnectorType: connectorType,
      erpEndpoint: endpoint,
    });
    alert('Impostazioni connettore ERP aggiornate con successo!');
  };

  const handleResetData = () => {
    if (confirm('Sei sicuro di voler ripristinare il database demo ai valori iniziali di fabbrica?')) {
      store.resetToDefault();
      alert('Database ripristinato con successo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Multi-tenant Architecture Overview */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/30 text-purple-200 text-3xs font-extrabold px-2.5 py-0.5 rounded-full border border-purple-400/30 uppercase tracking-wider">
                Architettura Multi-tenant B2B
              </span>
              <span className="text-2xs text-slate-300 font-mono">Livelli: Sede Centrale → Organizzazione → Agente</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mt-1.5">
              Sede Centrale & Hub di Interconnessione ERP
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Pannello amministrativo per la gestione centralizzata delle aziende tenant, configurazione dei connettori gestionali (SAP, REST) e monitoraggio dei flussi bidirezionali di ordini, fidi e partitari.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Ripristina dataset iniziale"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Dati Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Level Hierarchy Visual Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level 1: Sede Centrale */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-2xs font-bold text-purple-700">
            <span className="uppercase tracking-wider">LIVELLO 1: SEDE CENTRALE</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">
            SuperAdmin & SaaS Platform
          </div>
          <p className="text-2xs text-slate-500">
            Governa la piattaforma multi-tenant, attiva nuove organizzazioni, gestisce fatturazione SaaS e ruoli globali.
          </p>
          <div className="text-3xs font-mono text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
            Ruolo: HQ_SUPERADMIN (Accesso a tutti i tenant)
          </div>
        </div>

        {/* Level 2: Organizzazione B2B */}
        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-2xs font-bold text-blue-700">
            <span className="uppercase tracking-wider">LIVELLO 2: AZIENDA TENANT</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900 line-clamp-1">
            {activeOrg.name}
          </div>
          <p className="text-2xs text-slate-500">
            Possiede il proprio connettore gestionale ERP, catalogo dedicato, listini e coordina la propria rete agenti.
          </p>
          <div className="text-3xs font-mono text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
            Connettore: {activeOrg.erpConnectorType} • {activeOrg.agentsCount} agenti attivi
          </div>
        </div>

        {/* Level 3: Agente Commerciale */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-2xs font-bold text-emerald-700">
            <span className="uppercase tracking-wider">LIVELLO 3: AGENTE SUL CAMPO</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">
            Davide Ferraresi (Cod. 3)
          </div>
          <p className="text-2xs text-slate-500">
            Accede con permessi RLS ai soli clienti assegnati, crea ordini offline/online, verifica fidi e registra incassi.
          </p>
          <div className="text-3xs font-mono text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
            Area: {state.agents[0]?.area || '—'} • Provvigione: {state.agents[0]?.commissionRate ?? 0}%
          </div>
        </div>
      </div>

      {/* Access Control & Agent Credentials Management Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Gestione Accessi & Utenti della Rete Commerciale
              </h2>
              <p className="text-2xs text-slate-500">
                Credenziali di accesso per agenti, responsabili vendite e amministratori di sede
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard/project/ppfebdhulnkncvyfgyul/auth/users"
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Gestisci Utenti in Supabase Auth</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-3xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nome Utente</th>
                <th className="py-2.5 px-3">Email Login</th>
                <th className="py-2.5 px-3">Ruolo</th>
                <th className="py-2.5 px-3">Codice Agente</th>
                <th className="py-2.5 px-3">Organizzazione</th>
                <th className="py-2.5 px-3">Politiche di Sicurezza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {state.profiles.map((p) => {
                const ag = state.agents.find((a) => a.id === p.agentId);
                const org = state.organizations.find((o) => o.id === p.orgId);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="py-2.5 px-3 text-blue-700 font-semibold">{p.email}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-3xs font-bold ${
                          p.role === 'AGENT'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : p.role === 'ORG_ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {ag ? `Cod. ${ag.code}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">
                      {org?.name || 'Tutte'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-emerald-700 text-3xs font-semibold">
                      {p.role === 'AGENT'
                        ? 'RLS: Solo clienti assegnati'
                        : p.role === 'ORG_ADMIN'
                        ? 'RLS: Tutti i clienti organizzazione'
                        : 'Accesso globale SuperAdmin'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Grid: Connector Config & Sync Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: ERP Gateway Configuration */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Parametri Connettore ERP Organizzazione
              </h2>
            </div>
            <span className="bg-emerald-50 text-emerald-700 font-bold font-mono text-3xs px-2 py-0.5 rounded-full border border-emerald-200">
              {activeOrg.erpStatus}
            </span>
          </div>

          <form onSubmit={handleSaveConnector} className="space-y-3.5 text-xs">
            <div>
              <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
                Azienda / Tenant Selezionato
              </label>
              <select
                value={activeOrg.id}
                onChange={(e) => store.setActiveOrg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
                Tipo Gestionale Aziendale (ERP Adapter)
              </label>
              <select
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="SAP_BUSINESS_ONE">SAP Business One (Service Layer OData)</option>
                <option value="GENERIC_REST">Custom ERP Webhook / REST Gateway</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
                Endpoint URL Gateway ERP
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-3xs text-slate-500 font-mono">
                Ultima sincronizzazione: {activeOrg.erpLastSync}
              </div>
              <button
                type="submit"
                className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Salva Modifiche
              </button>
            </div>
          </form>
        </div>

        {/* Right: Manual Sync Triggers & Database Health */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Lancio Sincronizzazione Realtime
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Attiva il riallineamento istantaneo tra il database locale/Supabase e il server gestionale ERP aziendale.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => handleManualSync('CUSTOMERS')}
                disabled={isSyncing}
                className="cursor-pointer p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between text-2xs text-blue-600 font-bold mb-1">
                  <span>ANAGRAFICA & FIDI</span>
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <span>Sincronizza Clienti</span>
              </button>

              <button
                onClick={() => handleManualSync('STOCK')}
                disabled={isSyncing}
                className="cursor-pointer p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between text-2xs text-blue-600 font-bold mb-1">
                  <span>GIACENZE DEPOSITI</span>
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <span>Sincronizza Magazzino</span>
              </button>

              <button
                onClick={() => handleManualSync('ORDERS')}
                disabled={isSyncing}
                className="cursor-pointer p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between text-2xs text-blue-600 font-bold mb-1">
                  <span>TRASMISSIONE ORDINI</span>
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <span>Invia Ordini Pendenti</span>
              </button>

              <button
                onClick={() => handleManualSync('ALL')}
                disabled={isSyncing}
                className="cursor-pointer p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-left text-xs font-bold transition-all shadow-xs"
              >
                <div className="flex items-center justify-between text-2xs text-blue-200 font-bold mb-1">
                  <span>FULL SYNC</span>
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <span>Sincronizzazione Totale</span>
              </button>
            </div>

            {syncFeedback && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>

          {/* Database Mode Card */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Database Engine:</span>
              <span className="font-bold text-slate-800 font-mono">
                {dbStatus.provider === 'SUPABASE_LIVE' ? 'Supabase Live PostgreSQL' : 'Local Storage & Seed Provider'}
              </span>
            </div>
            <span className="text-emerald-600 font-semibold font-mono">RLS Enabled</span>
          </div>
        </div>
      </div>

      {/* Supabase Live Integration & Credentials Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Backend Relazionale: Supabase PostgreSQL & Auth
                </h2>
                <span className="bg-emerald-100 text-emerald-800 font-mono text-3xs font-bold px-2 py-0.5 rounded-full">
                  LIVE CONFIGURED
                </span>
              </div>
              <p className="text-2xs text-slate-500 font-mono mt-0.5">
                Progetto: {dbStatus.projectId} • {dbStatus.url}
              </p>
            </div>
          </div>

          <button
            onClick={handleTestSupabase}
            disabled={isTestingSupabase}
            className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
            <span>{isTestingSupabase ? 'Test in corso...' : 'Test Connessione Live'}</span>
          </button>
        </div>

        {/* Live Test Feedback banner */}
        {supabaseTestResult && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between gap-2 ${
              supabaseTestResult.connected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{supabaseTestResult.message}</span>
            </div>
            {supabaseTestResult.latencyMs > 0 && (
              <span className="font-mono text-2xs bg-white/80 px-2 py-0.5 rounded">
                {supabaseTestResult.latencyMs}ms
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-2xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-semibold block uppercase">Supabase URL</span>
            <span className="font-mono text-slate-800 font-bold block truncate mt-1">
              https://ppfebdhulnkncvyfgyul.supabase.co
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-semibold block uppercase">Chiave Pubblica (Anon)</span>
            <span className="font-mono text-slate-800 font-bold block truncate mt-1">
              sb_publishable_HupKDt-ly...CuxPA8L3
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-semibold block uppercase">Sicurezza & RLS</span>
            <span className="text-emerald-700 font-semibold block mt-1">
              Attiva per Ruoli: HQ / Org / Agente
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-2xs space-y-2 text-blue-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-bold flex items-center gap-1.5 text-xs text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Script SQL Unificato Pronto per Supabase (Schema + Seed)</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard/project/ppfebdhulnkncvyfgyul/sql/new"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs shadow-2xs transition-colors"
              >
                <span>Apri SQL Editor Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <p className="text-blue-800 leading-relaxed">
            Abbiamo generato lo script unico consolidato in <code className="font-mono bg-blue-100 px-1 rounded text-blue-900 font-bold">supabase/setup_complete.sql</code>.
            Basta incollarlo nell'editor di Supabase e cliccare <strong>"Run"</strong> per avere tutte le tabelle create e popolate con i dati demo in 3 secondi!
          </p>
        </div>
      </div>

      {/* Sync Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Registro Eventi & Log di Sincronizzazione ERP</h2>
            <p className="text-2xs text-slate-500">Audit trail delle chiamate effettuate al gateway gestionale</p>
          </div>
          <span className="text-2xs font-mono text-slate-400">Ultime operazioni</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-3xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Data e Ora</th>
                <th className="py-2.5 px-3">Entità</th>
                <th className="py-2.5 px-3">Direzione</th>
                <th className="py-2.5 px-3 text-center">Record</th>
                <th className="py-2.5 px-3">Descrizione Operazione</th>
                <th className="py-2.5 px-3 text-right">Latenza</th>
                <th className="py-2.5 px-3 text-center">Esito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {erpLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-500">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-3xs">{log.entityType}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {log.direction === 'ERP_TO_APP' ? 'ERP ➔ WebApp' : 'WebApp ➔ ERP'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {log.recordsCount}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-700 max-w-sm truncate">
                    {log.message}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{log.durationMs}ms</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-3xs font-bold font-sans">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
