import React, { useState } from 'react';
import { visitService } from '../../services/visit.service';
import { customerService } from '../../services/customer.service';
import { Visit } from '../../types';
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  Phone,
  Video,
  Mail,
  User,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const VisitsView: React.FC = () => {
  const visits = visitService.getVisits();
  const customers = customerService.getCustomers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<Visit['type']>('VISIT');
  const [outcome, setOutcome] = useState<Visit['outcome']>('POSITIVE');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    visitService.recordVisit({
      orgId: cust.orgId,
      customerId: cust.id,
      customerName: cust.businessName,
      customerCity: `${cust.city} (${cust.province})`,
      salesAgentId: cust.salesAgentId,
      visitDate,
      type,
      outcome,
      notes,
      followUpDate: followUpDate || undefined,
    });

    setIsModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Registro Visite Commerciali & CRM
            </h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {visits.length} attività
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Agenda incontri, promemoria di ricontatto, telefonate e storico relazioni con i clienti.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Registra Nuova Visita / Chiamata</span>
        </button>
      </div>

      {/* Visits List */}
      <div className="space-y-3">
        {visits.map((visit) => {
          let outcomeBadge = {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            label: 'Esito Positivo',
          };
          if (visit.outcome === 'FOLLOW_UP_REQUIRED') {
            outcomeBadge = {
              bg: 'bg-amber-50 text-amber-700 border-amber-200',
              label: 'Richiesto Follow-up',
            };
          } else if (visit.outcome === 'NEUTRAL') {
            outcomeBadge = {
              bg: 'bg-slate-100 text-slate-700 border-slate-200',
              label: 'Informativo',
            };
          }

          return (
            <div
              key={visit.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {visit.customerName}
                  </span>
                  <span className="text-2xs font-mono text-slate-400">
                    {visit.customerCity}
                  </span>
                  <span className={`text-3xs font-semibold px-2 py-0.5 rounded-full border ${outcomeBadge.bg}`}>
                    {outcomeBadge.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-2xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {visit.visitDate}
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-3xs font-bold uppercase">
                    {visit.type}
                  </span>
                  {visit.followUpDate && (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-3xs font-semibold">
                      Prossimo contatto: {visit.followUpDate}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 pt-1 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{visit.notes}"
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Registra Visita Commerciale</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente Incontrato
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.businessName} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Incontro
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo Contatto
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="VISIT">Visita sul posto</option>
                    <option value="CALL">Telefonata</option>
                    <option value="EMAIL">Email</option>
                    <option value="VIDEO_CALL">Videochiamata</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Esito Commerciale
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="POSITIVE">Positivo / Interessato</option>
                    <option value="FOLLOW_UP_REQUIRED">Richiesto Ricontatto</option>
                    <option value="NEUTRAL">Informativo</option>
                    <option value="NEGATIVE">Non interessato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Prossimo Ricontatto
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note & Sintesi Colloquio
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Argomenti trattati, prodotti proposti, obiezioni del cliente..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Salva Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
