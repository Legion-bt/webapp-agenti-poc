import React from 'react';
import { store } from '../../lib/store';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileSpreadsheet,
  Banknote,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Server,
  PlusCircle,
  ChevronRight,
  Target,
  UserCog,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen = false,
  onCloseMobile,
}) => {
  const state = store.getState();
  const defaultProfile = { id: 'usr-default', firstName: 'Utente', lastName: '', email: 'agente@azienda.it', role: 'AGENT' as const, agentId: 'ag-01' };
  const currentProfile = state.profiles?.find((p) => p.id === state.currentProfileId) || state.profiles?.[0] || defaultProfile;
  const activeAgent = state.agents?.find((a) => a.id === currentProfile.agentId) || state.agents?.[0] || { id: 'ag-01', monthlyTarget: 35000, commissionRate: 5 };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Clienti', icon: Users, badge: state.customers.length },
    { id: 'catalog', label: 'Catalogo Articoli', icon: Package },
    { id: 'orders', label: 'Storico Ordini', icon: ShoppingCart, badge: state.orders.length },
    { id: 'quotes', label: 'Preventivi', icon: FileSpreadsheet, badge: state.quotes.length },
    { id: 'suspended', label: 'Sospesi & Incassi', icon: Banknote, alert: true },
    { id: 'visits', label: 'Visite & CRM', icon: CalendarCheck },
    { id: 'commissions', label: 'Provvigioni', icon: TrendingUp },
    { id: 'analytics', label: 'Statistiche', icon: BarChart3 },
    ...(currentProfile.role === 'HQ_SUPERADMIN' ? [{ id: 'admin-orgs', label: 'Organizzazioni', icon: Building2 }] : []),
    ...(currentProfile.role !== 'AGENT' ? [{ id: 'admin-users', label: 'Utenti e accessi', icon: UserCog }] : []),
    { id: 'admin-erp', label: 'Sede Centrale & Hub ERP', icon: Server, isHq: true },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Primary CTA: + Nuovo Ordine */}
          <button
            onClick={() => handleItemClick('new-order')}
            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98 mb-5 group"
          >
            <PlusCircle className="w-5 h-5 text-blue-200 group-hover:rotate-90 transition-transform" />
            <span>+ Nuovo Ordine</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'customers' && currentView === 'customer-detail') || (item.id === 'orders' && currentView === 'order-detail') || (item.id === 'catalog' && currentView === 'product-detail');

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`cursor-pointer w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.isHq && (
                      <span className="bg-purple-100 text-purple-700 text-3xs px-1.5 py-0.5 rounded font-bold uppercase">
                        SaaS
                      </span>
                    )}
                    {item.alert && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                    {item.badge !== undefined && (
                      <span className="text-3xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: Agent Monthly Target Progress */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="bg-white dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center justify-between text-2xs mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Mese Agente</span>
              </div>
              <span className="font-mono text-emerald-600 font-bold">53%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '53%' }} />
            </div>
            <div className="flex justify-between text-3xs text-slate-500 font-mono">
              <span>€18.450 realizzati</span>
              <span className="text-slate-400">Target €{activeAgent?.monthlyTarget != null ? activeAgent.monthlyTarget.toLocaleString('it-IT') : '35.000'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
