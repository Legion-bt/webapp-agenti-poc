import React, { useState } from 'react';
import { orderService } from '../../services/order.service';
import { OrderStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { exportToCSV } from '../../lib/export';
import {
  Search,
  PlusCircle,
  FileDown,
  Eye,
  FileText,
  Mail,
  Printer,
  Calendar,
} from 'lucide-react';

interface OrdersViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const orders = orderService.getOrders({
    search: searchTerm,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as OrderStatus),
  });

  const handleExport = () => {
    const rows = orders.map((o) => ({
      NumeroOrdine: o.number,
      Data: o.orderDate,
      CodiceCliente: o.customerCode,
      Cliente: o.customerName,
      Stato: o.status,
      Imponibile: o.subtotal,
      TotaleDocumento: o.total,
      Residuo: o.residualTotal,
      BackOrder: o.backOrder ? 'SI' : 'NO',
      Causale: o.causal,
      Note: o.notes,
      SyncERP: o.erpSyncStatus,
    }));
    exportToCSV(`ordini_b2b_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Storico Ordini & Elenco Documenti B2B
            </h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {orders.length} ordini
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controllo avanzamento vendite, tracking spedizioni, back-order e sincronizzazione Apra ERP.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExport}
            className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Esporta Excel</span>
          </button>
          <button
            onClick={() => onNavigate('new-order')}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nuovo Ordine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cerca ordine per riferimento (es. 2026-OV-0000036), ragione sociale o note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium outline-hidden"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="CONFIRMED">Confermati</option>
            <option value="PREPARING">In Preparazione</option>
            <option value="SHIPPED">Spediti / Evasi</option>
            <option value="BLOCKED">Bloccati</option>
          </select>
        </div>
      </div>

      {/* Orders Table directly matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-600 uppercase text-3xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center">Stato</th>
                <th className="py-3 px-3">Riferimento</th>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Note Operative</th>
                <th className="py-3 px-3 text-right">Totale Documento</th>
                <th className="py-3 px-3 text-right">Residuo</th>
                <th className="py-3 px-3 text-center">BackOrder</th>
                <th className="py-3 px-3 text-center">Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {orders.map((order) => {
                // Color dots matching Screenshot 5
                let dotColor = 'bg-emerald-500';
                if (order.status === 'BLOCKED') dotColor = 'bg-rose-500';
                if (order.status === 'PREPARING') dotColor = 'bg-amber-500';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onNavigate('order-detail', order.id)}
                  >
                    {/* Stato dot */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      </div>
                    </td>

                    {/* Riferimento e.g. 2026-OV-0000036 */}
                    <td className="py-3 px-3 font-semibold text-blue-700 hover:underline">
                      {order.number}
                    </td>

                    {/* Data */}
                    <td className="py-3 px-3 text-slate-500">{order.orderDate}</td>

                    {/* Cliente */}
                    <td className="py-3 px-3 font-sans font-bold text-slate-800 max-w-xs truncate">
                      {order.customerName}
                    </td>

                    {/* Note */}
                    <td className="py-3 px-3 font-sans text-slate-500 italic max-w-xs truncate">
                      {order.notes || '-'}
                    </td>

                    {/* Totale */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      €{order.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Residuo */}
                    <td className="py-3 px-3 text-right text-slate-600">
                      €{order.residualTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>

                    {/* BackOrder */}
                    <td className="py-3 px-3 text-center">
                      {order.backOrder ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-3xs font-sans font-semibold">
                          SI
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Documento Actions */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <button
                          onClick={() => onNavigate('order-detail', order.id)}
                          className="cursor-pointer p-1 hover:text-blue-600 rounded transition-colors"
                          title="Visualizza ordine"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => alert(`Stampa bolla ordine ${order.number}`)}
                          className="cursor-pointer p-1 hover:text-slate-700 rounded transition-colors"
                          title="Stampa documento PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
