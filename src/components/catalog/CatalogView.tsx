import React, { useState } from 'react';
import { productService } from '../../services/product.service';
import { Product } from '../../types';
import { ProductImage } from './ProductImage';
import {
  Search,
  ShoppingCart,
  Plus,
  Check,
  Building,
} from 'lucide-react';

interface CatalogViewProps {
  onNavigate: (view: string, id?: string) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onNavigate, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [addedPopupId, setAddedPopupId] = useState<string | null>(null);

  const categories = productService.getCategories();
  const products = productService.getProducts({
    search: searchTerm,
    categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
    onlyAvailable,
    onlyPromo,
  });

  const handleAddProduct = (product: Product, qty: number = 1) => {
    if (onAddToCart) {
      onAddToCart(product, qty);
    } else {
      onNavigate('new-order', undefined);
    }
    setAddedPopupId(product.id);
    setTimeout(() => setAddedPopupId(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Catalog Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Catalogo Prodotti & Listini</h1>
            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {products.length} articoli
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizzazione disponibilità in tempo reale tra magazzini, confezionamenti e condizioni commerciali.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-order')}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Vai al Carrello / Ordine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cerca per denominazione, codice articolo, EAN o brand (es. RRIS075, Olio, Frantoio)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium outline-hidden"
          >
            <option value="ALL">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyPromo(!onlyPromo)}
            className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap ${
              onlyPromo
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solo Promo
          </button>

          <button
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap ${
              onlyAvailable
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solo Disponibili
          </button>
        </div>
      </div>

      {/* Product Grid directly matching Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const totalStock = productService.getTotalAvailableStock(product.id);
          const isAdded = addedPopupId === product.id;

          // Status dot color matching Screenshot 4:
          // green (> 50 pcs), yellow (1-50 pcs), red (0 pcs)
          let stockDotClass = 'bg-emerald-500';
          let stockLabel = `${totalStock} ${product.unit} disponibili`;
          if (totalStock <= 0) {
            stockDotClass = 'bg-rose-500';
            stockLabel = 'Esaurito';
          } else if (totalStock < 30) {
            stockDotClass = 'bg-amber-500';
            stockLabel = `Scorte basse (${totalStock} ${product.unit})`;
          }

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Image & Promo Badge */}
              <div className="relative h-56 bg-slate-50 flex items-center justify-center p-4 overflow-hidden border-b border-slate-100">
                <ProductImage
                  product={product}
                  className="h-full max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                {product.isPromo && (
                  <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-2xs">
                    PROMO {product.defaultDiscount1}%
                  </span>
                )}

                <button
                  onClick={() => onNavigate('product-detail', product.id)}
                  className="cursor-pointer absolute top-2.5 right-2.5 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-full shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dettaglio giacenze magazzino"
                >
                  <Building className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Info matching Screenshot 4 typography & codes */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-3xs font-bold text-blue-600 uppercase tracking-wide">
                    {product.categoryName}
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 mt-1 line-clamp-2 leading-tight uppercase">
                    {product.name}
                  </h3>

                  {/* Code & Pack info matching Screenshot 4: Cod: RRIS075 | 12 BT x CA12 */}
                  <div className="mt-2 text-2xs text-slate-500 font-mono flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stockDotClass} shrink-0`} />
                    <span className="truncate">
                      Cod: {product.code} | {product.packInfo}
                    </span>
                  </div>

                  {/* Stock label */}
                  <div className="text-3xs text-slate-400 mt-0.5">
                    {stockLabel}
                  </div>
                </div>

                {/* Price and Add button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-base font-mono text-slate-900">
                      €{product.basePrice.toFixed(2)}
                    </div>
                    {/* Discount indication matching Screenshot 4: 20% 10% 0% */}
                    <div className="text-3xs text-slate-400 font-mono">
                      Sconti base: {product.defaultDiscount1}% {product.defaultDiscount2}% {product.defaultDiscount3}%
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddProduct(product, 1)}
                    disabled={totalStock <= 0}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : totalStock > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Aggiunto!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi</span>
                      </>
                    )}
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
