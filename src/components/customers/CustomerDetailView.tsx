import React, { useState } from 'react';
import { customerService } from '../../services/customer.service';
import { CustomerSuspendedItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CreditAlertBanner } from '../common/CreditAlertBanner';
import { PaymentModal } from '../common/PaymentModal';
import { CustomerDocumentsPanel } from './CustomerDocumentsPanel';
import {
  ArrowLeft,
  ShoppingCart,
  PlusCircle,
  Banknote,
  Printer,
  Mail,
  Building2,
  CalendarCheck,
  ShieldAlert,
  FileText,
} from 'lucide-react';

interface CustomerDetailViewProps {
  customerId: string;
  onNavigate: (view: string, id?: string) => void;
  onBack: () => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customerId,
  onNavigate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'suspended' | 'pricing' | 'visits' | 'fiscal' | 'documents'
  >('suspended'); // default to suspended if has overdue to highlight Screenshot 3!

  const [paymentTargetItem, setPaymentTargetItem] = useState<CustomerSuspendedItem | null>(null);

  const customer = customerService.getCustomerById(customerId);
  const suspendedItems = customer ? customerService.getSuspendedItems(customer.id) : [];

  if (!customer) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Cliente non trovato</p>
        <button onClick={onBack} className="mt-3 text-xs font-semibold text-blue-600">
          Torna all'elenco clienti
        </button>
      </div>
    );
  }

  const remainingCredit = customer.creditLimit - customer.currentExposure;
  const isOverdue = customer.overdueAmount > 0;

  // Calculate suspended totals
  const totalOverdue = suspendedItems.reduce((acc, item) => acc + item.balance, 0);

  return (
    <div className="space-y-5">
      {/* Top Back Navigation & Primary Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna all'elenco clienti</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('new-order', customer.id)}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Nuovo Ordine</span>
          </button>
        </div>
      </div>

      {/* Prominent Credit Alert Banner if customer has overdues (matching Screenshot 2) */}
      <CreditAlertBanner
        overdueAmount={customer.overdueAmount}
        currentExposure={customer.currentExposure}
        creditLimit={customer.creditLimit}
        onViewSuspended={() => setActiveTab('suspended')}
      />

      {/* Customer Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Codice {customer.code}
              </span>
              <StatusBadge status={customer.status} />
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">
                {customer.category}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {customer.businessName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {customer.address} • {customer.postalCode} {customer.city} ({customer.province}) • P.IVA {customer.vatNumber}
            </p>
          </div>

          {/* Financial Exposure KPI Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono">
            <div className="px-2">
              <span className="text-3xs text-slate-500 uppercase font-sans font-semibold block">Fido Concesso</span>
              <span className="text-xs font-bold text-slate-800">
                €{customer.creditLimit.toLocaleString('it-IT')}
              </span>
            </div>
            <div className="px-2 border-x border-slate-200">
              <span className="text-3xs text-slate-500 uppercase font-sans font-semibold block">Esposizione</span>
              <span className="text-xs font-bold text-slate-900">
                €{customer.currentExposure.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="px-2">
              <span className="text-3xs text-slate-500 uppercase font-sans font-semibold block">Scaduto / Sospeso</span>
              <span className={`text-xs font-extrabold ${isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                €{customer.overdueAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-slate-200 mt-5 pt-3 overflow-x-auto">
          {[
            { id: 'suspended', label: 'Sospesi & Partite Aperte', icon: Banknote, count: suspendedItems.length, highlight: isOverdue },
            { id: 'overview', label: 'Panoramica Commerciale', icon: Building2 },
            { id: 'fiscal', label: 'Scheda Anagrafica Fiscale (ERP)', icon: Building2 },
            { id: 'orders', label: 'Storico Ordini', icon: ShoppingCart },
            { id: 'pricing', label: 'Listino & Prezzi Dedicati', icon: Building2 },
            { id: 'visits', label: 'Visite & Note CRM', icon: CalendarCheck },
            { id: 'documents', label: 'Documenti', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-3xs font-mono px-1.5 py-0.2 rounded font-bold ${
                      tab.highlight ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Sospesi & Partite Aperte (MATCHING SCREENSHOT 3) */}
      {activeTab === 'suspended' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header Bar matching Screenshot 3: [ Inserisci Incasso ] [ Stampa PDF ] [ Invia PDF ] */}
          <div className="bg-slate-900 text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                Sospesi Cliente {customer.code} : {customer.businessName}
              </h2>
              <p className="text-xs text-slate-400">
                Elementi trovati: {suspendedItems.length} partite contabili
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (suspendedItems.length > 0) {
                    setPaymentTargetItem(suspendedItems[0]);
                  }
                }}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Inserisci Incasso</span>
              </button>

              <button
                onClick={() => window.print()}
                className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-md flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Stampa PDF</span>
              </button>

              <button
                onClick={() => alert(`Partitari inviati all'indirizzo ${customer.email}`)}
                className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-md flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Invia PDF</span>
              </button>
            </div>
          </div>

          {/* Suspended Items Table directly matching Screenshot 3 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-600 uppercase text-3xs font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Num. Documento</th>
                  <th className="py-2.5 px-3">Num.</th>
                  <th className="py-2.5 px-3">Data Documento</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Partita / Descrizione</th>
                  <th className="py-2.5 px-3">Scadenza</th>
                  <th className="py-2.5 px-3 text-right">Saldo (€)</th>
                  <th className="py-2.5 px-3 text-right">Importo (€)</th>
                  <th className="py-2.5 px-3 text-right">Da Incassare</th>
                  <th className="py-2.5 px-3 text-center">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {suspendedItems.map((item) => {
                  const isPaid = item.isPaid || item.balance <= 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isPaid ? 'bg-slate-50 text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-blue-700">
                        {item.docNumber}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.internalRef}</td>
                      <td className="py-2 px-3 text-slate-600">{item.docDate}</td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded text-3xs font-bold">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-xs text-slate-700 max-w-xs truncate">
                        {item.matchTitle}
                      </td>
                      <td className="py-2 px-3 font-semibold text-rose-700">
                        {item.dueDate}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">
                        €{item.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        €{item.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        €{item.toCollect.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {!isPaid ? (
                          <button
                            onClick={() => setPaymentTargetItem(item)}
                            className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded text-3xs font-bold font-sans transition-colors"
                          >
                            Incassa
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-3xs font-sans font-bold">Saldato</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals Footer Strip matching Screenshot 3 */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-sans">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Dati sincronizzati dal giornale partitari ERP</span>
            </div>

            <div className="flex items-center gap-6 font-mono">
              <div>
                <span className="text-slate-500 font-sans text-2xs block">Scaduto Totale:</span>
                <span className="font-extrabold text-sm text-rose-700">
                  €{totalOverdue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans text-2xs block">Da Scadere:</span>
                <span className="font-bold text-slate-800">€0,00</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 font-sans text-2xs block">Totale Posizione:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  €{totalOverdue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Scheda Anagrafica Fiscale & Logistica (MATCHING SCREENSHOT 1) */}
      {activeTab === 'fiscal' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Dati Anagrafici e Fiscali ERP
            </h2>
            <p className="text-xs text-slate-500">
              Informazioni di fatturazione elettronica, condizioni bancarie e recapiti di consegna.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Row 1: Ragione Sociale, Stato, Città, Provincia */}
            <div className="md:col-span-2">
              <label className="text-2xs font-semibold text-slate-400 uppercase">Ragione Sociale</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900">
                {customer.businessName}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Stato</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {customer.country}
              </div>
            </div>

            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Città</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {customer.city}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Provincia</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {customer.province}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">CAP</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono">
                {customer.postalCode}
              </div>
            </div>

            {/* Row 2: Indirizzo, Zona, Telefono, Cellulare */}
            <div className="md:col-span-2">
              <label className="text-2xs font-semibold text-slate-400 uppercase">Indirizzo Sede Legale/Operativa</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {customer.address}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Zona Commerciale</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {customer.area}
              </div>
            </div>

            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Telefono Fisso</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800">
                {customer.phone}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Cellulare Referente</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800">
                {customer.mobile}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">PEC Fatturazione</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 truncate">
                {customer.pec}
              </div>
            </div>

            {/* Row 3: Partita IVA, Cod. Fiscale, Codice SDI, Email */}
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Partita IVA</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800">
                {customer.vatNumber}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Codice Fiscale</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800">
                {customer.taxCode}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Codice Destinatario SDI</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800">
                {customer.sdiCode}
              </div>
            </div>

            {/* Row 4: Pagamento, IBAN, Listino, Dati Consegna */}
            <div className="md:col-span-2">
              <label className="text-2xs font-semibold text-slate-400 uppercase">Condizioni di Pagamento</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800">
                {customer.paymentTerm}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Listino Assegnato</label>
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-semibold">
                {customer.priceListName}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-2xs font-semibold text-slate-400 uppercase">IBAN Appoggio Bancario</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800">
                {customer.iban} <span className="text-slate-400 font-sans font-normal">({customer.bankName})</span>
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-slate-400 uppercase">Agente Incaricato</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800">
                {customer.salesAgentName}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-2xs font-semibold text-slate-400 uppercase">Dati e Orari di Consegna (Logistica)</label>
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-slate-800">
                {customer.deliveryNotes}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Panoramica Commerciale */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Situazione Commerciale & Fido</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fido Concesso:</span>
                <span className="font-mono font-bold text-slate-800">€{customer.creditLimit.toLocaleString('it-IT')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Esposizione Ordini + Fatture:</span>
                <span className="font-mono font-bold text-slate-800">€{customer.currentExposure.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fido Residuo Operativo:</span>
                <span className={`font-mono font-bold ${remainingCredit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  €{remainingCredit.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Ultimo Ordine Ricevuto:</span>
                <span className="font-mono text-slate-700">{customer.lastOrderDate || 'Nessuno'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Note Commerciali Interne</h3>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
              "{customer.notes || 'Nessuna nota presente per questo cliente.'}"
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('visits')}
                className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Registra nuova visita o nota CRM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ordini */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Storico Ordini Cliente</h3>
            <button
              onClick={() => onNavigate('new-order', customer.id)}
              className="cursor-pointer text-xs font-bold text-blue-600 hover:underline"
            >
              + Nuovo Ordine
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Gli ordini emessi per questo cliente sono consultabili nella sezione <strong>Storico Ordini</strong>.
          </p>
        </div>
      )}

      {/* Tab 4: Prezzi & Listino */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Listino & Condizioni Economiche</h3>
          <p className="text-xs text-slate-600">
            Listino di default collegato: <strong>{customer.priceListName}</strong>.
            I prezzi vengono calcolati in tempo reale dal Pricing Engine con priorità ai patti commerciali speciali.
          </p>
        </div>
      )}

      {/* Tab 5: Visite */}
      {activeTab === 'visits' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Registro Visite & Contatti</h3>
          <p className="text-xs text-slate-600">
            Consulta gli incontri commerciali e programma i follow-up sul cliente.
          </p>
        </div>
      )}

      {/* Tab 7: Documenti PDF */}
      {activeTab === 'documents' && <CustomerDocumentsPanel customerId={customer.id} />}

      {/* Payment Modal */}
      {paymentTargetItem && (
        <PaymentModal
          item={paymentTargetItem}
          onClose={() => setPaymentTargetItem(null)}
          onSuccess={() => {
            setPaymentTargetItem(null);
          }}
        />
      )}
    </div>
  );
};
