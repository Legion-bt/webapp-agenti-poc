import React from 'react';
import { analyticsService } from '../../services/analytics.service';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Euro,
  Users,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const data = analyticsService.getAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Statistiche & Performance Commerciali
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Analisi delle vendite, raggiungimento budget mensili, andamento categorie e concentrazione clienti.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Fatturato YTD 2026</span>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            €{data.yearlyRevenue.toLocaleString('it-IT')}
          </div>
          <span className="text-3xs text-emerald-600 font-semibold mt-1 block">+14.2% vs 2025</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Target Mensile</span>
          <div className="text-xl font-extrabold font-mono text-blue-700 mt-1">
            {data.targetPercentage}%
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">€18.450 su €35.000</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Valore Medio Ordine</span>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            €2.840
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">Sulla gamma food & wine</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Insoluti Totali Rete</span>
          <div className="text-xl font-extrabold font-mono text-rose-700 mt-1">
            €{Math.round(data.overdueTotal / 1000)}k
          </div>
          <span className="text-3xs text-rose-600 mt-1 block">Da monitorare con contabilità</span>
        </div>
      </div>

      {/* 12 Months Breakdown Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Evoluzione Mensile del Fatturato</h2>
            <p className="text-2xs text-slate-500">Volumi mensili comparati tra anno in corso e anno precedente</p>
          </div>
          <div className="flex items-center gap-3 text-2xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs" />
              <span>Anno 2026</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs" />
              <span>Anno 2025</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 border-b border-slate-100 font-mono">
          {data.monthlyHistory.map((item, idx) => {
            const maxVal = 40000;
            const hCurrent = Math.min(100, (item.currentYear / maxVal) * 100);
            const hPrior = Math.min(100, (item.priorYear / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                  <div className="w-2 bg-slate-200 rounded-t-xs" style={{ height: `${hPrior}%` }} />
                  <div className="w-3.5 bg-blue-600 rounded-t-xs" style={{ height: `${hCurrent}%` }} />
                </div>
                <span className="text-3xs text-slate-500 mt-1">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories and Top Customers Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Ripartizione per Linea di Prodotto</h2>
          <div className="space-y-3">
            {data.topCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{cat.name}</span>
                  <span className="font-mono text-slate-900">€{cat.total.toLocaleString('it-IT')} ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Customers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Top 5 Clienti per Fatturato</h2>
          <div className="space-y-3">
            {data.topCustomers.map((cust, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-2xs">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{cust.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">€{cust.total.toLocaleString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
