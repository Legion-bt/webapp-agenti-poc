import React, { useState, useEffect } from 'react';
import { store } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { Search, User, Package, FileText, X, ArrowRight, PlusCircle, RefreshCw, Sun, Moon } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const state = store.getState();
  const q = query.toLowerCase().trim();

  const filteredCustomers = q
    ? state.customers
        .filter(
          (c) =>
            c.businessName.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : state.customers.slice(0, 3);

  const filteredProducts = q
    ? state.products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : state.products.slice(0, 3);

  const filteredOrders = q
    ? state.orders
        .filter(
          (o) =>
            o.number.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-2.5" />
          <input
            type="text"
            placeholder="Cerca clienti, articoli, ordini o azioni (es. Rossi, SAGR075)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-hidden text-slate-800 placeholder:text-slate-400 font-medium"
            autoFocus
          />
          <button
            onClick={onClose}
            className="cursor-pointer p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {/* Quick Actions */}
          <div className="py-2">
            <p className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Azioni Rapide
            </p>
            <button
              onClick={() => {
                toggleTheme();
                onClose();
              }}
              className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{isDark ? 'Passa al Tema Chiaro' : 'Passa al Tema Scuro'}</span>
              </div>
              <span className="text-3xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                {isDark ? 'Chiaro' : 'Scuro'}
              </span>
            </button>
            <button
              onClick={() => {
                onNavigate('new-order');
                onClose();
              }}
              className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>+ Crea Nuovo Ordine Vendita</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              onClick={() => {
                onNavigate('admin-erp');
                onClose();
              }}
              className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Stato e Sincronizzazione Gateway ERP</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div className="py-2">
              <p className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Clienti Anagrafica
              </p>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onNavigate('customer-detail', c.id);
                    onClose();
                  }}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 rounded-md">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{c.businessName}</div>
                      <div className="text-2xs text-slate-500 font-mono">
                        Cod: {c.code} • {c.city} ({c.province})
                      </div>
                    </div>
                  </div>
                  {c.overdueAmount > 0 && (
                    <span className="text-2xs font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Scaduto €{c.overdueAmount.toLocaleString('it-IT')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div className="py-2">
              <p className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Articoli a Catalogo
              </p>
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onNavigate('product-detail', p.id);
                    onClose();
                  }}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 rounded-md">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-2xs text-slate-500 font-mono">
                        {p.code} • {p.packInfo}
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold font-mono text-slate-900">
                    €{p.basePrice.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Orders */}
          {filteredOrders.length > 0 && (
            <div className="py-2">
              <p className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ordini Recenti
              </p>
              {filteredOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onNavigate('order-detail', o.id);
                    onClose();
                  }}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-semibold font-mono text-slate-800">{o.number}</div>
                      <div className="text-2xs text-slate-500">{o.customerName}</div>
                    </div>
                  </div>
                  <span className="font-semibold font-mono text-slate-900">
                    €{o.total.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-2xs text-slate-500 flex items-center justify-between">
          <span>Usa le frecce per navigare, Invio per selezionare</span>
          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">ESC per chiudere</span>
        </div>
      </div>
    </div>
  );
};
