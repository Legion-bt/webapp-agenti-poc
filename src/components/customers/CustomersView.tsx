import React, { useState } from 'react';
import { customerService } from '../../services/customer.service';
import { exportToCSV } from '../../lib/export';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  PlusCircle,
  FileDown,
  ShieldAlert,
  ArrowRight,
  ShoppingCart,
  Banknote,
  MapPin,
  Building,
} from 'lucide-react';

interface CustomersViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const customers = customerService.getCustomers({
    search: searchTerm,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    hasOverdue: onlyOverdue ? true : undefined,
  });

  const handleExport = () => {
    const rows = customers.map((c) => ({
      Codice: c.code,
      RagioneSociale: c.businessName,
      PartitaIVA: c.vatNumber,
      Citta: c.city,
      Provincia: c.province,
      Stato: c.status,
      FidoConcesso: c.creditLimit,
      EsposizioneAttuale: c.currentExposure,
      ScadutoInsoluto: c.overdueAmount,
      Listino: c.priceListName,
      TerminiPagamento: c.paymentTerm,
      Agente: c.salesAgentName,
    }));
    exportToCSV(`clienti_agente_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Anagrafica Clienti B2B</h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {customers.length} clienti
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestione clienti assegnati, verifica disponibilità fido, partite aperte e listini dedicati.
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

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cerca cliente per ragione sociale, codice, partita IVA o città..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium outline-hidden"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="ACTIVE">Solo Attivi</option>
            <option value="BLOCKED">Solo Bloccati</option>
            <option value="POTENTIAL">Potenziali</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyOverdue(!onlyOverdue)}
            className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              onlyOverdue
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Solo con Scaduto</span>
          </button>
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => {
          const remainingCredit = customer.creditLimit - customer.currentExposure;
          const hasOverdue = customer.overdueAmount > 0;

          return (
            <div
              key={customer.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Cod. {customer.code}
                      </span>
                      <StatusBadge status={customer.status} size="sm" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {customer.businessName}
                    </h3>
                  </div>
                </div>

                <div className="text-2xs text-slate-500 mt-2 space-y-1">
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{customer.address}, {customer.city} ({customer.province})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Listino: {customer.priceListName}</span>
                  </div>
                </div>

                {/* Credit Exposure Box */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-4 -mb-4 p-3.5">
                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    <div>
                      <span className="text-slate-400 block">Fido Residuo:</span>
                      <span
                        className={`font-mono font-bold ${
                          remainingCredit < 0 ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        €{remainingCredit.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Scaduto Insoluto:</span>
                      <span
                        className={`font-mono font-bold ${
                          hasOverdue ? 'text-rose-600 font-extrabold' : 'text-emerald-600'
                        }`}
                      >
                        €{customer.overdueAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {hasOverdue && (
                    <div className="mt-2 text-3xs text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200 flex items-center gap-1 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Insoluti da incassare. Richiesto controllo preventivo.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('customer-detail', customer.id)}
                  className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1"
                >
                  <span>Scheda Cliente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  {hasOverdue && (
                    <button
                      onClick={() => onNavigate('customer-detail', customer.id)}
                      className="cursor-pointer p-1.5 text-amber-700 hover:bg-amber-50 rounded-md border border-amber-200"
                      title="Partitari e Sospesi"
                    >
                      <Banknote className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onNavigate('new-order', customer.id);
                    }}
                    className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 text-2xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ Ordine</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
