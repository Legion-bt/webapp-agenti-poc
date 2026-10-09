import React, { useState } from 'react';
import { store } from '../../lib/store';
import { customerService } from '../../services/customer.service';
import { CustomerSuspendedItem } from '../../types';
import { PaymentModal } from '../common/PaymentModal';
import { exportToCSV } from '../../lib/export';
import {
  Banknote,
  Search,
  FileDown,
  Printer,
  Mail,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface SuspendedViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const SuspendedView: React.FC<SuspendedViewProps> = ({ onNavigate }) => {
  const state = store.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [targetItem, setTargetItem] = useState<CustomerSuspendedItem | null>(null);

  const items = state.suspendedItems.filter((i) => {
    const cust = state.customers.find((c) => c.id === i.customerId);
    const text = `${i.docNumber} ${i.internalRef} ${i.matchTitle} ${cust?.businessName || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const totalOverdue = items.reduce((acc, i) => acc + (i.isPaid ? 0 : i.balance), 0);

  const handleExport = () => {
    const rows = items.map((i) => {
      const cust = state.customers.find((c) => c.id === i.customerId);
      return {
        Documento: i.docNumber,
        NumeroInterno: i.internalRef,
        Cliente: cust?.businessName || '',
        Data: i.docDate,
        Tipo: i.type,
        Partita: i.matchTitle,
        Scadenza: i.dueDate,
        Importo: i.amount,
        SaldoResiduo: i.balance,
        Stato: i.isPaid ? 'SALDATO' : 'APERTO',
      };
    });
    exportToCSV(`sospesi_e_partite_aperte_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sospesi & Partite Aperte Clienti (ERP)
            </h1>
            <span className="bg-rose-100 text-rose-800 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {items.filter((i) => !i.isPaid).length} partite insolute
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestione incassi sul campo da parte degli agenti, registrazione assegni e riallineamento scadenziario.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Esporta Excel</span>
          </button>
        </div>
      </div>

      {/* Search and Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cerca per numero documento, partita o ragione sociale cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between font-mono">
          <div>
            <span className="text-3xs uppercase text-rose-700 font-sans font-bold block">
              Totale Scaduto Insoluto
            </span>
            <span className="text-lg font-extrabold text-rose-800">
              €{totalOverdue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
      </div>

      {/* Suspended Invoices Table matching Screenshot 3 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider">
            Giornale Scadenziario ERP
          </span>
          <span className="text-3xs text-slate-400 font-mono">
            Riallineato con contabilità generale
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-3xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Num. Documento</th>
                <th className="py-2.5 px-3">Num.</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Data Doc</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Descrizione Partita</th>
                <th className="py-2.5 px-3">Scadenza</th>
                <th className="py-2.5 px-3 text-right">Saldo Residuo</th>
                <th className="py-2.5 px-3 text-right">Importo</th>
                <th className="py-2.5 px-3 text-center">Azione Incasso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {items.map((item) => {
                const cust = state.customers.find((c) => c.id === item.customerId);
                const isPaid = item.isPaid || item.balance <= 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isPaid ? 'bg-slate-50 text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-blue-700">
                      {item.docNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{item.internalRef}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 max-w-xs truncate">
                      {cust?.businessName || 'Cliente'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{item.docDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded text-3xs font-bold">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 max-w-xs truncate">
                      {item.matchTitle}
                    </td>
                    <td className="py-2.5 px-3 text-rose-700 font-bold">{item.dueDate}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-rose-700">
                      €{item.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      €{item.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {!isPaid ? (
                        <button
                          onClick={() => setTargetItem(item)}
                          className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-3xs font-bold px-2.5 py-1 rounded shadow-2xs transition-colors"
                        >
                          Registra Incasso
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-sans text-3xs font-bold">Saldato</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {targetItem && (
        <PaymentModal
          item={targetItem}
          onClose={() => setTargetItem(null)}
          onSuccess={() => setTargetItem(null)}
        />
      )}
    </div>
  );
};
