import React, { useState } from 'react';
import { quoteService } from '../../services/quote.service';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react';

interface QuotesViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isConverting, setIsConverting] = useState<string | null>(null);

  const quotes = quoteService.getQuotes().filter(
    (q) =>
      q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConvert = async (quoteId: string) => {
    setIsConverting(quoteId);
    try {
      const orderId = await quoteService.convertToOrder(quoteId);
      setTimeout(() => {
        setIsConverting(null);
        onNavigate('order-detail', orderId);
      }, 400);
    } catch (err: any) {
      alert(`Errore conversione preventivo: ${err.message}`);
      setIsConverting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Preventivi & Offerte B2B</h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {quotes.length} offerte
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestione trattative commerciali in corso e trasformazione immediata con un click in Ordini confermati.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-order')}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Nuovo Preventivo / Ordine</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cerca preventivo per numero o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Quotes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote) => (
          <div
            key={quote.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs p-5 flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {quote.number}
                </span>
                <StatusBadge status={quote.status} />
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-2">
                {quote.customerName}
              </h3>
              <p className="text-2xs text-slate-500 mt-1 italic">"{quote.notes}"</p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-2xs text-slate-400 block uppercase">Emesso il</span>
                  <span className="font-mono text-slate-700">{quote.quoteDate}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block uppercase">Scadenza Validità</span>
                  <span className="font-mono text-slate-700">{quote.validUntil}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-3xs text-slate-400 block uppercase font-sans">Valore Offerta</span>
                <span className="font-mono font-extrabold text-base text-slate-900">
                  €{quote.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {quote.status === 'ACCEPTED' ? (
                <button
                  onClick={() => handleConvert(quote.id)}
                  disabled={isConverting === quote.id}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isConverting === quote.id ? 'Conversione...' : 'Converti in Ordine'}</span>
                </button>
              ) : quote.status === 'CONVERTED' ? (
                <button
                  onClick={() => quote.convertedOrderId && onNavigate('order-detail', quote.convertedOrderId)}
                  className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Vedi Ordine Generato</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-2xs text-slate-400 italic">In attesa accettazione cliente</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
