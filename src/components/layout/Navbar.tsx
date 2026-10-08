import React from 'react';
import { store } from '../../lib/store';
import { getDatabaseStatus } from '../../lib/supabase/client';
import {
  Search,
  Building2,
  RefreshCw,
  Database,
  Menu,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  onOpenCommand: () => void;
  onToggleSidebar?: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommand, onToggleSidebar, onNavigate }) => {
  const state = store.getState();
  const defaultProfile = { id: 'usr-default', firstName: 'Utente', lastName: '', email: 'agente@azienda.it', role: 'AGENT' as const, agentId: 'ag-01' };
  const currentProfile = state.profiles?.find((p) => p.id === state.currentProfileId) || state.profiles?.[0] || defaultProfile;
  const defaultOrg = { id: 'org-01', name: 'Azienda Hub', code: 'HUB', erpConnectorType: 'ERP_REST_API', erpLastSync: 'Oggi' };
  const activeOrg = state.organizations?.find((o) => o.id === state.activeOrgId) || state.organizations?.[0] || defaultOrg;
  const dbStatus = getDatabaseStatus();

  const handleOrgChange = (orgId: string) => {
    store.setActiveOrg(orgId);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile Toggle & Brand/Org */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            A
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">AgenteGo</span>
              <span className="bg-blue-100 text-blue-700 text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                B2B ERP SaaS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-slate-500">
              <Building2 className="w-3 h-3 text-slate-400" />
              <select
                value={activeOrg.id}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-hidden cursor-pointer hover:underline"
              >
                {state.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar / Cmd+K */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommand}
          className="cursor-pointer w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span className="text-slate-500 font-medium">Cerca clienti, articoli, ordini...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 font-mono text-2xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: ERP status, DB indicator & Role Switcher */}
      <div className="flex items-center gap-2.5">
        {/* ERP Connector Status Pill */}
        <button
          onClick={() => onNavigate('admin-erp')}
          className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-2xs font-semibold transition-colors"
          title={`Connettore: ${activeOrg.erpConnectorType} • Ultima sync: ${activeOrg.erpLastSync}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{activeOrg.erpConnectorType.replace('_', ' ')}: Attivo</span>
          <RefreshCw className="w-3 h-3 text-emerald-600" />
        </button>

        {/* Database Mode Pill */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-3xs font-mono"
          title={dbStatus.provider === 'SUPABASE_LIVE' ? 'Supabase Live PostgreSQL' : 'Local Demo SQLite Store'}
        >
          <Database className="w-3 h-3 text-slate-500" />
          <span>{dbStatus.provider === 'SUPABASE_LIVE' ? 'Supabase RLS' : 'Demo Engine'}</span>
        </div>

        {/* Theme Mode Toggle (Chiaro / Scuro) */}
        <ThemeToggle />

        {/* Authenticated Supabase User & Logout */}
        <div className="flex items-center gap-3 pl-2.5 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentProfile.firstName ? currentProfile.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentProfile.firstName} {currentProfile.lastName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-3xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded uppercase">
                  {currentProfile.role === 'AGENT'
                    ? 'Agente'
                    : currentProfile.role === 'ORG_ADMIN'
                    ? 'Manager'
                    : 'HQ Admin'}
                </span>
                <span className="text-3xs text-slate-400 font-mono hidden xl:inline">
                  {currentProfile.email}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => store.logout()}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
            title="Disconnetti account Supabase"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </div>
    </header>
  );
};
