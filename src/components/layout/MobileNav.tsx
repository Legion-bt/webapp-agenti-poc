import React from 'react';
import { LayoutDashboard, Users, PlusCircle, Package, ShoppingCart } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`cursor-pointer flex flex-col items-center p-1 text-2xs font-medium transition-colors ${
          currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onNavigate('customers')}
        className={`cursor-pointer flex flex-col items-center p-1 text-2xs font-medium transition-colors ${
          currentView === 'customers' || currentView === 'customer-detail'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Clienti</span>
      </button>

      {/* Floating center action button */}
      <button
        onClick={() => onNavigate('new-order')}
        className="cursor-pointer -top-5 relative bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center border-4 border-slate-50 dark:border-slate-950"
        title="Nuovo Ordine"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <button
        onClick={() => onNavigate('catalog')}
        className={`cursor-pointer flex flex-col items-center p-1 text-2xs font-medium transition-colors ${
          currentView === 'catalog' || currentView === 'product-detail'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Package className="w-5 h-5 mb-0.5" />
        <span>Catalogo</span>
      </button>

      <button
        onClick={() => onNavigate('orders')}
        className={`cursor-pointer flex flex-col items-center p-1 text-2xs font-medium transition-colors ${
          currentView === 'orders' || currentView === 'order-detail'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <ShoppingCart className="w-5 h-5 mb-0.5" />
        <span>Ordini</span>
      </button>
    </nav>
  );
};
