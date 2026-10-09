import React, { useEffect, useRef, useState } from 'react';
import { store } from '../../lib/store';
import { connectorLabel } from '../../services/organization.service';
import { Search, Menu, LogOut, ChevronDown, ChevronsUpDown, Check, Building2 } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  onOpenCommand: () => void;
  onToggleSidebar?: () => void;
  onNavigate: (view: string, id?: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  AGENT: 'Agente',
  ORG_ADMIN: 'Manager',
  HQ_SUPERADMIN: 'Amministratore',
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Closes a popover when clicking outside of it or pressing Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommand, onToggleSidebar, onNavigate }) => {
  const state = store.getState();
  const defaultProfile = { id: 'usr-default', firstName: 'Utente', lastName: '', email: 'agente@azienda.it', role: 'AGENT' as const, agentId: 'ag-01' };
  const currentProfile = state.profiles?.find((p) => p.id === state.currentProfileId) || state.profiles?.[0] || defaultProfile;
  const defaultOrg = { id: 'org-01', name: 'Azienda Hub', code: 'HUB', erpConnectorType: 'ERP_REST_API', erpLastSync: 'Oggi' };
  const activeOrg = state.organizations?.find((o) => o.id === state.activeOrgId) || state.organizations?.[0] || defaultOrg;

  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const orgMenuRef = useDismiss(orgMenuOpen, () => setOrgMenuOpen(false));
  const userMenuRef = useDismiss(userMenuOpen, () => setUserMenuOpen(false));

  const fullName = `${currentProfile.firstName} ${currentProfile.lastName}`.trim();
  const initials = (
    (currentProfile.firstName?.charAt(0) || '') + (currentProfile.lastName?.charAt(0) || '')
  ).toUpperCase() || 'U';
  const roleLabel = ROLE_LABELS[currentProfile.role] || currentProfile.role;
  const erpName = connectorLabel(activeOrg.erpConnectorType);
  const canSwitchOrg = (state.organizations?.length || 0) > 1;

  return (
    <header className="sticky top-0 z-[45] h-16 flex items-center gap-4 px-4 lg:px-6 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200">
      {/* Left: menu toggle, brand, organization */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer"
          aria-label="Vai alla dashboard"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            A
          </div>
          <span className="hidden sm:block font-bold text-[15px] tracking-tight text-slate-900">AgenteGo</span>
        </button>

        <span className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div ref={orgMenuRef} className="relative hidden md:block min-w-0">
          <button
            onClick={() => canSwitchOrg && setOrgMenuOpen((v) => !v)}
            className={`flex items-center gap-2 max-w-[280px] px-2 py-1.5 rounded-lg text-sm font-medium text-slate-700 ${
              canSwitchOrg ? 'hover:bg-slate-100 cursor-pointer' : 'cursor-default'
            }`}
            aria-haspopup="listbox"
            aria-expanded={orgMenuOpen}
          >
            <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">{activeOrg.name}</span>
            {canSwitchOrg && <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
          </button>

          {orgMenuOpen && (
            <div
              role="listbox"
              className="absolute left-0 top-full mt-2 w-72 p-1.5 bg-white rounded-xl border border-slate-200 shadow-lg"
            >
              <p className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-slate-400">Organizzazione</p>
              {state.organizations.map((org) => (
                <button
                  key={org.id}
                  role="option"
                  aria-selected={org.id === activeOrg.id}
                  onClick={() => {
                    store.setActiveOrg(org.id);
                    setOrgMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-left text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrg.id && <Check className="w-4 h-4 shrink-0 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: global search */}
      <div className="hidden md:flex flex-1 justify-center">
        <button
          onClick={onOpenCommand}
          className="group w-full max-w-md h-9 flex items-center gap-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-sm text-slate-500 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
          <span className="flex-1 text-left truncate">Cerca clienti, articoli, ordini…</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 h-5 rounded border border-slate-200 bg-white font-sans text-[11px] font-medium text-slate-400">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
      </div>

      {/* Right: ERP status, theme, user menu */}
      <div className="flex items-center gap-1.5 ml-auto md:ml-0 shrink-0">
        <button
          onClick={() => onNavigate('admin-erp')}
          className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          title={`Connettore ${erpName} · Ultima sincronizzazione: ${activeOrg.erpLastSync}`}
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden lg:inline">ERP collegato</span>
        </button>

        <ThemeToggle />

        <span className="hidden sm:block h-6 w-px mx-1.5 bg-slate-200 dark:bg-slate-800" />

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 h-10 pl-1 pr-2 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </span>
            <span className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-slate-800 max-w-[160px] truncate">{fullName}</span>
              <span className="text-xs text-slate-500">{roleLabel}</span>
            </span>
            <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 p-1.5 bg-white rounded-xl border border-slate-200 shadow-lg"
            >
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-900 truncate">{fullName}</p>
                <p className="text-xs text-slate-500 truncate">{currentProfile.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  {roleLabel}
                </span>
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  store.logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
