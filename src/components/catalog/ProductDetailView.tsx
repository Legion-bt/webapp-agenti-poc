import React, { useRef, useState } from 'react';
import { productService } from '../../services/product.service';
import { productImageService } from '../../services/product-image.service';
import { Product } from '../../types';
import { ProductImage } from './ProductImage';
import {
  ArrowLeft,
  ShoppingCart,
  Building,
  CheckCircle2,
  Calendar,
  ImagePlus,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (view: string, id?: string) => void;
  onBack: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onNavigate,
  onBack,
  onAddToCart,
}) => {
  const product = productService.getProductById(productId);
  const warehouseStocks = product ? productService.getStockForProduct(product.id) : [];
  const totalAvailable = product ? productService.getTotalAvailableStock(product.id) : 0;
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Articolo non trovato</p>
        <button onClick={onBack} className="mt-3 text-xs font-semibold text-blue-600">
          Torna al catalogo
        </button>
      </div>
    );
  }

  const canManageImage = productImageService.canManage(product);

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    setImageBusy(true);
    try {
      await productImageService.upload(product, file);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Caricamento non riuscito.');
    } finally {
      setImageBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleImageRemove = async () => {
    if (!window.confirm("Rimuovere l'immagine di questo articolo?")) return;
    setImageError(null);
    setImageBusy(true);
    try {
      await productImageService.remove(product);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Rimozione non riuscita.');
    } finally {
      setImageBusy(false);
    }
  };

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, 1);
    }
    onNavigate('new-order');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna al catalogo prodotti</span>
        </button>

        <button
          onClick={handleAdd}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Aggiungi all'Ordine</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image & Basic Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col items-center">
          <div className="w-full h-72 bg-slate-50 rounded-lg flex items-center justify-center p-6 border border-slate-100">
            <ProductImage product={product} className="h-full max-h-full max-w-full object-contain" />
          </div>

          {canManageImage && (
            <div className="w-full mt-3">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInput.current?.click()}
                  disabled={imageBusy}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {imageBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  <span>{product.imagePath ? 'Sostituisci immagine' : 'Carica immagine'}</span>
                </button>
                {product.imagePath && (
                  <button
                    onClick={handleImageRemove}
                    disabled={imageBusy}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Rimuovi</span>
                  </button>
                )}
              </div>
              <p className="text-3xs text-slate-400 text-center mt-1.5">
                JPEG, PNG o WebP fino a 5 MB. Visibile solo agli utenti della webapp.
              </p>
              {imageError && <p className="text-2xs text-rose-600 text-center mt-1">{imageError}</p>}
            </div>
          )}

          <div className="w-full mt-4 text-center">
            <span className="text-2xs font-bold text-blue-600 uppercase tracking-wide">
              {product.categoryName}
            </span>
            <h1 className="text-base font-extrabold text-slate-900 uppercase mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Codice: {product.code} • EAN: {product.barcode}
            </p>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-3">
              €{product.basePrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Right Columns: Multi-Warehouse Availability & Specifications */}
        <div className="lg:col-span-2 space-y-5">
          {/* Warehouse Stocks Table */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Disponibilità Giacenze per Deposito ERP
                </h2>
                <p className="text-2xs text-slate-500">
                  Situazione in tempo reale aggiornata dai magazzini aziendali.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-3xs text-slate-400 block uppercase font-sans">Totale Disponibile</span>
                <span className="text-lg font-extrabold text-emerald-600">
                  {totalAvailable} {product.unit}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-3xs font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Deposito / Magazzino</th>
                    <th className="py-2.5 px-3 text-right">Giacenza Fisica</th>
                    <th className="py-2.5 px-3 text-right">Quantità Impegnata</th>
                    <th className="py-2.5 px-3 text-right">Disponibilità Reale</th>
                    <th className="py-2.5 px-3">Prossimo Arrivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                  {warehouseStocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 font-sans flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{stock.warehouseName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {stock.quantityOnHand} {product.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700">
                        {stock.quantityCommitted} {product.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {stock.quantityAvailable} {product.unit}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-2xs text-slate-500">
                        {stock.nextArrivalDate ? (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Calendar className="w-3 h-3" />
                            <span>+{stock.nextArrivalQty} {product.unit} il {stock.nextArrivalDate}</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Specifications & Packaging Details */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Scheda Tecnica & Confezionamento</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {product.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-2xs font-semibold text-slate-400 uppercase block">Unità di Vendita</span>
                <span className="font-bold text-slate-800 font-mono">{product.unit}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-2xs font-semibold text-slate-400 uppercase block">Collo / Confezione</span>
                <span className="font-bold text-slate-800 font-mono">{product.packInfo}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-2xs font-semibold text-slate-400 uppercase block">Annata / Lotto</span>
                <span className="font-bold text-slate-800 font-mono">{product.vintageYear || 'Corrente'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-2xs font-semibold text-slate-400 uppercase block">Gradazione</span>
                <span className="font-bold text-slate-800 font-mono">{product.alcoholPercentage || 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
