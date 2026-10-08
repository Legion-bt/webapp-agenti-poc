import React, { useState } from 'react';
import { commissionService } from '../../services/commission.service';
import { StatusBadge } from '../common/StatusBadge';
import { exportToCSV } from '../../lib/export';
import {
  TrendingUp,
  FileDown,
  Sparkles,
  Banknote,
  CheckCircle,
} from 'lucide-react';

export const CommissionsView: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const summary = commissionService.getSummary();

  const filteredCommissions = summary.commissionsList.filter((c) =>
    statusFilter === 'ALL' ? true : c.status === statusFilter
  );

  const handleExport = () => {
    const rows = filteredCommissions.map((c) => ({
      NumeroOrdine: c.orderNumber,
      Cliente: c.customerName,
      ImponibileOrdine: c.baseAmount,
      PercentualeProvvigione: `${c.percentage}%`,
      ImportoProvvigione: c.amount,
      Stato: c.status,
      DataMaturazione: c.accruedDate,
      DataLiquidazione: c.paidDate || '-',
    }));
    exportToCSV(`estratto_provvigioni_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Estratto Conto Provvigioni</h1>
            <span className="bg-amber-100 text-amber-800 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {summary.commissionsList.length} movimenti
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Riepilogo provvigionale maturato sulle vendite effettive, liquidato e scadenze di pagamento.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
        >
          <FileDown className="w-4 h-4 text-slate-500" />
          <span>Esporta Excel / CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Mese Corrente</span>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            €{summary.accruedMonth.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">In maturazione</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Maturato YTD 2026</span>
          <div className="text-xl font-extrabold font-mono text-amber-700 mt-1">
            €{summary.accruedYtd.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">Totale progressivo anno</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Da Liquidare</span>
          <div className="text-xl font-extrabold font-mono text-blue-700 mt-1">
            €{summary.payable.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">Prossimo bonifico fine mese</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Già Liquidato</span>
          <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1">
            €{summary.paidYtd.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">Pagamenti saldati</span>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Dettaglio Ordini e Provvigioni</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="ACCRUED">Solo Maturate</option>
            <option value="PAYABLE">Solo Da Liquidare</option>
            <option value="PAID">Solo Liquidate</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-3xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Num. Ordine</th>
                <th className="py-2.5 px-3">Cliente Intestatario</th>
                <th className="py-2.5 px-3">Data Maturazione</th>
                <th className="py-2.5 px-3 text-right">Imponibile Ordine</th>
                <th className="py-2.5 px-3 text-center">Aliquota</th>
                <th className="py-2.5 px-3 text-right">Provvigione Spettante</th>
                <th className="py-2.5 px-3 text-center">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {filteredCommissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-blue-700">
                    {comm.orderNumber}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-800">
                    {comm.customerName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{comm.accruedDate}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    €{comm.baseAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-bold">
                    {comm.percentage}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-amber-700">
                    €{comm.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    <StatusBadge status={comm.status} size="sm" />
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
