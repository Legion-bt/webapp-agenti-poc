import React, { useState } from 'react';
import { CustomerSuspendedItem } from '../../types';
import { customerService } from '../../services/customer.service';
import { X, Check, Banknote, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  item: CustomerSuspendedItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ item, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(item.balance);
  const [notes, setNotes] = useState<string>('Ritirato assegno / bonifico sul posto');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > item.balance) return;

    setIsSubmitting(true);
    setTimeout(() => {
      customerService.recordPayment(item.id, amount, notes);
      setIsSubmitting(false);
      onSuccess();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Registra Incasso Partita Aperta</h3>
              <p className="text-xs text-slate-400 font-mono">{item.docNumber} • {item.internalRef}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Documento:</span>
              <span className="font-medium text-slate-800">{item.matchTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scadenza:</span>
              <span className="font-medium text-slate-800">{item.dueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Importo Fattura:</span>
              <span className="font-medium text-slate-800">€{item.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
              <span className="text-rose-600">Saldo Residuo Aperto:</span>
              <span className="text-rose-700 font-mono text-sm">€{item.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Importo Incassato (€)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-medium">€</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={item.balance}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
            {amount < item.balance && amount > 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Incasso parziale: residuo futuro €{(item.balance - amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note Incasso (es. N. Assegno, Bonifico, Quietanza)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="es. Assegno circolare n. 4819280 Banca Intesa"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvataggio...' : 'Conferma Incasso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
