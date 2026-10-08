import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

interface CreditAlertBannerProps {
  overdueAmount: number;
  currentExposure: number;
  creditLimit: number;
  onViewSuspended?: () => void;
}

export const CreditAlertBanner: React.FC<CreditAlertBannerProps> = ({
  overdueAmount,
  currentExposure,
  creditLimit,
  onViewSuspended,
}) => {
  const remainingCredit = creditLimit - currentExposure;
  const isOverdue = overdueAmount > 0;
  const isExceeded = remainingCredit < 0;

  if (!isOverdue && !isExceeded) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white rounded-lg p-3.5 mb-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-amber-600">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-600/60 rounded-md">
          {isOverdue ? (
            <ShieldAlert className="w-5 h-5 text-amber-100" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-100" />
          )}
        </div>
        <div>
          <div className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
            <span>PAGAMENTI SOSPESI & FIDO</span>
            {isOverdue && (
              <span className="bg-amber-700/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                Scaduto: €{overdueAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-100 mt-0.5">
            {isOverdue
              ? 'Il cliente presenta insoluti o partite aperte scadute. Verificare con amministrazione o richiedere autorizzazione.'
              : `Fido disponibile ridotto (€${remainingCredit.toLocaleString('it-IT', { minimumFractionDigits: 2 })}).`}
          </p>
        </div>
      </div>

      {onViewSuspended && (
        <button
          type="button"
          onClick={onViewSuspended}
          className="cursor-pointer bg-white text-amber-900 hover:bg-amber-50 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs whitespace-nowrap self-end md:self-auto transition-colors"
        >
          <span>Apri Partitari Sospesi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
