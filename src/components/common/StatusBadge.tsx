import React from 'react';
import { OrderStatus, QuoteStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | QuoteStatus | 'ACTIVE' | 'BLOCKED' | 'POTENTIAL' | 'INACTIVE' | 'ACCRUED' | 'PAYABLE' | 'PAID' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: status,
  };

  switch (status) {
    // Order statuses
    case 'CONFIRMED':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Confermato',
      };
      break;
    case 'PREPARING':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'In Preparazione',
      };
      break;
    case 'SHIPPED':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Spedito / Evaso',
      };
      break;
    case 'PARTIALLY_SHIPPED':
      config = {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
        label: 'Parz. Spedito',
      };
      break;
    case 'INVOICED':
      config = {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
        label: 'Fatturato',
      };
      break;
    case 'BLOCKED':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-600',
        label: 'Bloccato',
      };
      break;
    case 'DRAFT':
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: 'Bozza',
      };
      break;
    case 'SUBMITTED':
      config = {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
        label: 'Inoltrato',
      };
      break;
    case 'CANCELLED':
      config = {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-400',
        label: 'Annullato',
      };
      break;

    // Quote statuses
    case 'ACCEPTED':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Accettato',
      };
      break;
    case 'SENT':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Inviato',
      };
      break;
    case 'CONVERTED':
      config = {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
        label: 'Convertito in Ordine',
      };
      break;

    // Customer statuses
    case 'ACTIVE':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Attivo',
      };
      break;
    case 'POTENTIAL':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Potenziale',
      };
      break;
    case 'INACTIVE':
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: 'Inattivo',
      };
      break;

    // Commission statuses
    case 'ACCRUED':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Maturata',
      };
      break;
    case 'PAYABLE':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Da Liquidare',
      };
      break;
    case 'PAID':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Liquidata',
      };
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
