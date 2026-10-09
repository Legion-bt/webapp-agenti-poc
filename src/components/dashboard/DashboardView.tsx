import React from 'react';
import { store } from '../../lib/store';
import { analyticsService } from '../../services/analytics.service';
import { StatusBadge } from '../common/StatusBadge';
import {
  TrendingUp,
  Euro,
  FileSpreadsheet,
  AlertTriangle,
  CalendarCheck,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const state = store.getState();
  const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId) || state.profiles[0];
  const activeAgent = state.agents.find((a) => a.id === currentProfile.agentId) || state.agents[0];
  const analytics = analyticsService.getAnalytics();

  // Top recent orders
  const recentOrders = state.orders.slice(0, 5);

  // Today's visits
  const todayVisits = state.visits.slice(0, 3);

  // Open quotes to follow up
  const followUpQuotes = state.quotes.filter((q) => q.status === 'SENT' || q.status === 'ACCEPTED').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Bentornato, {currentProfile.firstName}
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {currentProfile.role === 'AGENT' ? (activeAgent?.area ? `Agente ${activeAgent.area}` : 'Agente') : currentProfile.role === 'ORG_ADMIN' ? 'Manager' : 'Sede centrale'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Panoramica vendite, portafoglio clienti e sincronizzazione ordini con gestione centrale ERP.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onNavigate('new-order')}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-98 flex-1 md:flex-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nuovo Ordine</span>
          </button>
          <button
            onClick={() => onNavigate('suspended')}
            className="cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Sospesi (€{Math.round(analytics.overdueTotal / 1000)}k)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Fatturato Mese */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Fatturato Mese
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1.5 font-mono">
            €{analytics.monthlyRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-2xs mt-2 text-slate-600">
            <span className="text-emerald-600 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 53%
            </span>
            <span>di target €{(activeAgent?.monthlyTarget ?? 0).toLocaleString('it-IT')}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
            <div className="bg-blue-600 h-1 rounded-full" style={{ width: '53%' }} />
          </div>
        </div>

        {/* KPI 2: Fatturato YTD */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Fatturato YTD 2026
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1.5 font-mono">
            €{analytics.yearlyRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-2xs mt-2 text-emerald-600 font-bold">
            <span>+14.2%</span>
            <span className="text-slate-500 font-normal">rispetto all'anno precedente</span>
          </div>
        </div>

        {/* KPI 3: Ordini Aperti & Preventivi */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Ordini in Corso
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1.5 font-mono">
            {analytics.openOrdersCount} ordini
          </div>
          <div className="text-2xs mt-2 text-slate-500 flex items-center justify-between">
            <span>Preventivi attivi:</span>
            <span className="font-bold font-mono text-purple-700">{analytics.openQuotesCount} doc</span>
          </div>
        </div>

        {/* KPI 4: Provvigioni YTD */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Provvigioni Maturate
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-700 mt-1.5 font-mono">
            €{analytics.commissionsYtd.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-2xs mt-2 text-slate-500">
            <span>Aliquota contrattuale:</span>
            <span className="font-bold text-slate-800">{activeAgent?.commissionRate ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 12-Month Sales History Chart (SVG Interactive) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Andamento Vendite 12 Mesi</h2>
              <p className="text-2xs text-slate-500">Confronto Anno Corrente vs Anno Precedente vs Target Mese</p>
            </div>
            <div className="flex items-center gap-3 text-2xs">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs" />
                <span className="text-slate-600 font-medium">2026</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs" />
                <span className="text-slate-500">2025</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-500" />
                <span className="text-slate-500">Target</span>
              </div>
            </div>
          </div>

          {/* SVG Bar & Line Chart */}
          <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {analytics.monthlyHistory.map((item, index) => {
              const maxVal = 40000;
              const hCurrent = Math.min(100, (item.currentYear / maxVal) * 100);
              const hPrior = Math.min(100, (item.priorYear / maxVal) * 100);

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-3xs rounded px-2 py-1 pointer-events-none whitespace-nowrap z-20 font-mono">
                    {item.month}: €{item.currentYear.toLocaleString('it-IT')}
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                    {/* Prior year bar */}
                    <div
                      className="w-2 bg-slate-200 rounded-t-xs transition-all group-hover:bg-slate-300"
                      style={{ height: `${hPrior}%` }}
                    />
                    {/* Current year bar */}
                    <div
                      className="w-3.5 bg-blue-600 rounded-t-xs transition-all group-hover:bg-blue-700"
                      style={{ height: `${hCurrent}%` }}
                    />
                  </div>
                  <span className="text-3xs text-slate-500 font-medium mt-1">{item.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-400 pt-2 font-mono">
            <span>Dati riallineati con il gestionale ERP alle ore 08:30</span>
            <span>Target mensile fisso: €35.000</span>
          </div>
        </div>

        {/* Right: Top Clienti del Portafoglio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Top Clienti YTD</h2>
              <button
                onClick={() => onNavigate('customers')}
                className="cursor-pointer text-2xs font-semibold text-blue-600 hover:underline flex items-center"
              >
                Vedi tutti <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <div className="space-y-3">
              {analytics.topCustomers.map((cust, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-2xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800 line-clamp-1">{cust.name}</div>
                      <div className="text-3xs text-slate-400 font-mono">{cust.ordersCount} ordini emessi</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-xs">
                    €{cust.total.toLocaleString('it-IT')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl">
            <div className="flex items-center justify-between text-2xs">
              <span className="text-slate-500">Totale Top 5 Clienti:</span>
              <span className="font-bold font-mono text-slate-900">
                €{analytics.topCustomers.reduce((acc, c) => acc + c.total, 0).toLocaleString('it-IT')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operative Section: Visite di Oggi, Preventivi & Ultimi Ordini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Attività & Visite di Oggi */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Attività & Visite di Oggi</h2>
            </div>
            <button
              onClick={() => onNavigate('visits')}
              className="cursor-pointer text-2xs font-semibold text-blue-600 hover:underline"
            >
              Agenda
            </button>
          </div>

          <div className="space-y-2.5">
            {todayVisits.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-colors"
              >
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-bold text-slate-800">{v.customerName}</span>
                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-3xs font-semibold uppercase">
                    {v.type}
                  </span>
                </div>
                <div className="text-3xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{v.visitDate} • {v.customerCity}</span>
                </div>
                <p className="text-2xs text-slate-600 mt-1.5 line-clamp-2 italic">
                  "{v.notes}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Preventivi da Seguire */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Preventivi da Chiudere</h2>
            </div>
            <button
              onClick={() => onNavigate('quotes')}
              className="cursor-pointer text-2xs font-semibold text-purple-600 hover:underline"
            >
              Tutti
            </button>
          </div>

          <div className="space-y-2.5">
            {followUpQuotes.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-colors"
              >
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-mono font-bold text-slate-700">{q.number}</span>
                  <StatusBadge status={q.status} size="sm" />
                </div>
                <div className="font-semibold text-slate-900 text-xs mt-1">{q.customerName}</div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200 text-2xs">
                  <span className="text-slate-500">Scadenza: {q.validUntil}</span>
                  <span className="font-mono font-bold text-purple-700">€{q.total.toLocaleString('it-IT')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Ordini Recenti (Screenshot 5 Preview) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Ultimi Ordini Inseriti</h2>
            <button
              onClick={() => onNavigate('orders')}
              className="cursor-pointer text-2xs font-semibold text-blue-600 hover:underline"
            >
              Elenco Ordini
            </button>
          </div>

          <div className="space-y-2.5">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => onNavigate('order-detail', o.id)}
                className="cursor-pointer p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-colors"
              >
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-mono font-bold text-slate-800">{o.number}</span>
                  <StatusBadge status={o.status} size="sm" />
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                  {o.customerName}
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200 text-2xs font-mono">
                  <span className="text-slate-400">{o.orderDate}</span>
                  <span className="font-bold text-slate-900">€{o.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
