import React from 'react';
import { orderService } from '../../services/order.service';
import { OrderStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowLeft,
  Calendar,
  Building,
  Printer,
  ShieldAlert,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface OrderDetailViewProps {
  orderId: string;
  onBack: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  orderId,
  onBack,
  onNavigate,
}) => {
  const order = orderService.getOrderById(orderId);

  if (!order) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Ordine non trovato</p>
        <button onClick={onBack} className="mt-3 text-xs font-semibold text-blue-600">
          Torna all'elenco ordini
        </button>
      </div>
    );
  }

  // Lifecycle steps for timeline
  const stages: { key: OrderStatus; label: string }[] = [
    { key: 'CONFIRMED', label: '1. Inserito ed Acquisito' },
    { key: 'CONFIRMED', label: '2. Confermato ERP' },
    { key: 'PREPARING', label: '3. Preparazione Prelievo' },
    { key: 'SHIPPED', label: '4. Spedito / Consegnato' },
    { key: 'INVOICED', label: '5. Fatturato' },
  ];

  let currentStageIndex = 1;
  if (order.status === 'PREPARING') currentStageIndex = 2;
  if (order.status === 'SHIPPED' || order.status === 'PARTIALLY_SHIPPED') currentStageIndex = 3;
  if (order.status === 'INVOICED') currentStageIndex = 4;
  if (order.status === 'BLOCKED') currentStageIndex = 1;

  const handleAdvanceStatus = (newStatus: OrderStatus) => {
    orderService.updateOrderStatus(order.id, newStatus);
  };

  return (
    <div className="space-y-5">
      {/* Back button & actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna all'elenco ordini</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Stampa Riepilogo</span>
          </button>
        </div>
      </div>

      {/* Block Alert Banner if BLOCKED */}
      {order.status === 'BLOCKED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-xs uppercase tracking-wider">
              ORDINE BLOCCATO DAL SISTEMA ERP
            </h3>
            <p className="text-xs mt-0.5">
              Motivo blocco: <strong>{order.blockReason || 'Insoluti aperti o limite fido cliente superato.'}</strong>
            </p>
          </div>
          <button
            onClick={() => handleAdvanceStatus('CONFIRMED')}
            className="cursor-pointer text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md shadow-2xs transition-colors shrink-0"
          >
            Sblocca Ordine (Override Amministrativo)
          </button>
        </div>
      )}

      {/* Order Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-extrabold text-blue-700">
                {order.number}
              </span>
              <StatusBadge status={order.status} />
              <span className="text-2xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Ref. ERP: {order.erpDocNumber || 'Sincronizzato'}
              </span>
            </div>
            <h1 className="text-base font-extrabold text-slate-900 mt-1">
              {order.customerName}
            </h1>
          </div>

          <div className="text-right font-mono">
            <span className="text-3xs text-slate-400 block font-sans uppercase">Totale Documento</span>
            <span className="text-xl font-extrabold text-slate-900">
              €{order.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 5-Stage Timeline Progression */}
        <div className="py-2">
          <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Avanzamento Evasione Ordine
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stages.map((st, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs transition-colors ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-300 font-bold text-blue-900'
                      : isPast
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-3xs font-mono mb-1">
                    <span>FASE {idx + 1}</span>
                    {isPast && <span className="text-emerald-600 font-bold">✓</span>}
                  </div>
                  <div className="line-clamp-1">{st.label}</div>
                </div>
              );
            })}
          </div>

          {/* Quick status change simulator button */}
          <div className="flex items-center justify-end gap-2 mt-3 pt-2">
            <span className="text-3xs text-slate-400">Azione rapida demo:</span>
            {order.status === 'CONFIRMED' && (
              <button
                onClick={() => handleAdvanceStatus('PREPARING')}
                className="cursor-pointer text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-md font-semibold"
              >
                Inizia Preparazione Prelievo
              </button>
            )}
            {order.status === 'PREPARING' && (
              <button
                onClick={() => handleAdvanceStatus('SHIPPED')}
                className="cursor-pointer text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-md font-semibold"
              >
                Segna come Spedito
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button
                onClick={() => handleAdvanceStatus('INVOICED')}
                className="cursor-pointer text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 px-2.5 py-1 rounded-md font-semibold"
              >
                Genera Fattura Fiscale
              </button>
            )}
          </div>
        </div>

        {/* Order metadata info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg text-xs border border-slate-200/80">
          <div>
            <span className="text-slate-400 text-2xs block uppercase">Data Registrazione</span>
            <span className="font-mono font-semibold text-slate-800">{order.orderDate}</span>
          </div>
          <div>
            <span className="text-slate-400 text-2xs block uppercase">Data Consegna Richiesta</span>
            <span className="font-mono font-semibold text-slate-800">{order.requestedDeliveryDate}</span>
          </div>
          <div>
            <span className="text-slate-400 text-2xs block uppercase">Agente Commerciale</span>
            <span className="font-semibold text-slate-800">{order.salesAgentName}</span>
          </div>
          <div>
            <span className="text-slate-400 text-2xs block uppercase">Termini Pagamento</span>
            <span className="font-semibold text-slate-800 line-clamp-1">{order.paymentTerm}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Dettaglio Articoli Evasione</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-3xs font-bold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Codice / Descrizione Articolo</th>
                <th className="py-2.5 px-3">Confezione</th>
                <th className="py-2.5 px-3 text-center">Quantità Ordinata</th>
                <th className="py-2.5 px-3 text-right">Prezzo Listino</th>
                <th className="py-2.5 px-3 text-center">Sconti</th>
                <th className="py-2.5 px-3 text-right">Prezzo Netto</th>
                <th className="py-2.5 px-3 text-right">Totale Riga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-3xs text-blue-600 font-mono">Cod: {item.productCode}</div>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{item.packInfo}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    €{item.listPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.discount1 > 0 ? (
                      <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-3xs font-bold">
                        -{item.discount1}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                    €{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-mono">
                    €{item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-end pt-3 border-t border-slate-100 text-xs font-mono">
          <div className="w-full sm:w-64 space-y-1.5 text-right">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Subtotale Imponibile:</span>
              <span>€{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">IVA 22%:</span>
              <span>€{order.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span className="font-sans">Totale Ordine:</span>
              <span className="text-blue-700">€{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
