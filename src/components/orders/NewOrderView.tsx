import React, { useState, useEffect } from 'react';
import { store } from '../../lib/store';
import { customerService } from '../../services/customer.service';
import { productService } from '../../services/product.service';
import { orderService } from '../../services/order.service';
import { pricingService } from '../../services/pricing.service';
import { Customer, Product } from '../../types';
import { CreditAlertBanner } from '../common/CreditAlertBanner';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Send,
  Building,
  Calendar,
  Lock,
} from 'lucide-react';

interface NewOrderViewProps {
  initialCustomerId?: string;
  onNavigate: (view: string, id?: string) => void;
  onBack: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const NewOrderView: React.FC<NewOrderViewProps> = ({
  initialCustomerId,
  onNavigate,
  onBack,
}) => {
  const state = store.getState();
  const customers = customerService.getCustomers();
  const allProducts = productService.getProducts();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.id ?? '')
  );
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-10-08');
  const [causal, setCausal] = useState<string>('OV - ORDINI CLIENTI');
  const [notes, setNotes] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([
    // Pre-populate with sample items matching the screenshots if customer is Rossi Valentino SpA
    { product: allProducts[0], quantity: 12 },
    { product: allProducts[1], quantity: 24 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    orderId: string;
    orderNumber: string;
    isBlocked: boolean;
    erpDocNumber: string;
  } | null>(null);

  const selectedCustomer: Customer | undefined = customers.find(
    (c) => c.id === selectedCustomerId
  );

  // Recalculate delivery date to 2 days ahead if default
  useEffect(() => {
    if (!deliveryDate) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDeliveryDate(d.toISOString().slice(0, 10));
    }
  }, []);

  const handleAddProduct = (productId: string) => {
    const prod = allProducts.find((p) => p.id === productId);
    if (!prod) return;

    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === prod.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Compute pricing lines through pricing engine
  const lineCalculations = cart.map((item) => {
    const calc = pricingService.calculatePrice({
      customerId: selectedCustomer?.id || '',
      productId: item.product.id,
      quantity: item.quantity,
    });
    return {
      item,
      calc,
    };
  });

  const subtotal = lineCalculations.reduce((sum, line) => sum + line.calc.lineTotal, 0);
  const taxTotal = Math.round(subtotal * 0.22 * 100) / 100;
  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

  const remainingCredit = (selectedCustomer?.creditLimit ?? 0) - (selectedCustomer?.currentExposure ?? 0);
  const isCreditExceeded = grandTotal > remainingCredit;
  const isCustomerBlocked = selectedCustomer?.status === 'BLOCKED' || (selectedCustomer?.overdueAmount ?? 0) > 5000;

  const handleSubmitOrder = async () => {
    if (!selectedCustomer || cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await orderService.createOrder({
        customerId: selectedCustomer.id,
        requestedDeliveryDate: deliveryDate,
        paymentTerm: selectedCustomer.paymentTerm,
        notes,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });

      setSubmissionSuccess({
        orderId: result.order.id,
        orderNumber: result.order.number,
        isBlocked: result.isBlocked,
        erpDocNumber: result.order.erpDocNumber || '',
      });
    } catch (err: any) {
      alert(`Errore creazione ordine: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl p-8 border border-slate-200 shadow-lg text-center space-y-5 animate-in fade-in">
        <div
          className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
            submissionSuccess.isBlocked
              ? 'bg-rose-100 text-rose-600'
              : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {submissionSuccess.isBlocked ? (
            <AlertTriangle className="w-8 h-8" />
          ) : (
            <CheckCircle className="w-8 h-8" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {submissionSuccess.isBlocked
              ? 'Ordine Inserito ma BLOCCATO da Regole ERP'
              : 'Ordine Inviato e Confermato con Successo!'}
          </h2>
          <div className="font-mono text-base font-bold text-blue-600 mt-2">
            Riferimento Documento: {submissionSuccess.orderNumber}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            Numero Registrazione ERP: {submissionSuccess.erpDocNumber}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {submissionSuccess.isBlocked
            ? 'L\'ordine è stato trasmesso a sistema ma risulta in stato BLOCCATO a causa del superamento fido o insoluti aperti del cliente. La direzione commerciale è stata notificata per lo sblocco manuale.'
            : 'L\'ordine è stato recepito dal gateway ERP, la disponibilità di magazzino è stata impegnata e la provvigione dell\'agente è stata registrata regolarmente.'}
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onNavigate('order-detail', submissionSuccess.orderId)}
            className="cursor-pointer px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
          >
            Visualizza Dettaglio Ordine
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
          >
            Torna allo Storico Ordini
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Indietro</span>
        </button>
        <span className="text-2xs font-mono text-slate-400">Modulo Ordine Agenti v2.4</span>
      </div>

      {/* Credit Warning Banner directly matching Screenshot 2 */}
      {selectedCustomer && (
        <CreditAlertBanner
          overdueAmount={selectedCustomer.overdueAmount}
          currentExposure={selectedCustomer.currentExposure}
          creditLimit={selectedCustomer.creditLimit}
          onViewSuspended={() => onNavigate('customer-detail', selectedCustomer.id)}
        />
      )}

      {/* Document Header matching Screenshot 2 ("Nuovo Ordine - Testata del documento") */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-extrabold text-slate-900">
              Nuovo Ordine — Testata del documento
            </h1>
          </div>
          <span className="text-3xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
            B2B Agent Portal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Cliente selector */}
          <div className="md:col-span-2">
            <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
              Cliente Intestatario Ordine
            </label>
            <div className="flex gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.businessName} ({c.city})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onNavigate('customer-detail', selectedCustomerId)}
                className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
                title="Apri scheda anagrafica cliente"
              >
                Scheda
              </button>
            </div>
          </div>

          {/* Cliente Fatturazione */}
          <div>
            <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
              Cliente Fatturazione
            </label>
            <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono text-2xs truncate">
              {selectedCustomer?.code} — {selectedCustomer?.businessName}
            </div>
          </div>

          {/* Codice Agente */}
          <div>
            <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
              Codice Agente Incaricato
            </label>
            <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs font-bold">
              3 — MANONI ALESSANDRO
            </div>
          </div>

          {/* Causale */}
          <div>
            <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
              Causale Movimento ERP
            </label>
            <input
              type="text"
              value={causal}
              onChange={(e) => setCausal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Consegna */}
          <div>
            <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
              Data Consegna Richiesta
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Customer logistics and payment terms reminder strip */}
        {selectedCustomer && (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-blue-900">
            <div>
              <span className="font-bold">Listino:</span> {selectedCustomer.priceListName} •{' '}
              <span className="font-bold">Pagamento:</span> {selectedCustomer.paymentTerm}
            </div>
            <div className="font-mono text-slate-600">
              IBAN: {selectedCustomer.iban}
            </div>
          </div>
        )}
      </div>

      {/* Cart & Lines Section */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Righe Articolo dell'Ordine</h2>
            <p className="text-2xs text-slate-500">
              I prezzi unitari sono calcolati automaticamente in base a listini cliente e contratti speciali.
            </p>
          </div>

          {/* Quick Product Adder dropdown */}
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddProduct(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="cursor-pointer bg-blue-50 border border-blue-300 text-blue-800 text-xs rounded-lg px-3 py-1.5 font-bold outline-hidden hover:bg-blue-100 transition-colors"
            >
              <option value="" disabled>
                + Aggiungi Articolo da Catalogo...
              </option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} (€{p.basePrice.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nessun articolo nel carrello ordine.</p>
            <p className="text-2xs text-slate-400 mt-1">Seleziona un prodotto dal menu a tendina o dal catalogo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-3xs font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Codice / Descrizione Articolo</th>
                  <th className="py-2.5 px-3">Confezione</th>
                  <th className="py-2.5 px-3 text-center">Quantità</th>
                  <th className="py-2.5 px-3 text-right">Listino Base</th>
                  <th className="py-2.5 px-3 text-center">Sconti ERP</th>
                  <th className="py-2.5 px-3 text-right">Prezzo Netto</th>
                  <th className="py-2.5 px-3 text-right">Totale Riga</th>
                  <th className="py-2.5 px-3 text-center">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {lineCalculations.map(({ item, calc }) => (
                  <tr key={item.product.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-sans">{item.product.name}</div>
                      <div className="text-3xs text-blue-600 font-mono">
                        Cod: {item.product.code} • {calc.reason}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-sans">{item.product.packInfo}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center border border-slate-300 rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-l-md font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)
                          }
                          className="w-12 text-center text-xs font-bold outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-r-md font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      €{calc.listPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {calc.discount1 > 0 ? (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-3xs font-bold">
                          -{calc.discount1}% {calc.discount2 > 0 ? `-${calc.discount2}%` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      €{calc.netPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono">
                      €{calc.lineTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Rimuovi riga"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes & Summary Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
          <div>
            <label className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
              Note Aggiuntive per Magazzino e Autista
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Consegna mattino presto, citofonare carico merci retro bottega, bancale sponda idraulica..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Totale Imponibile Merce:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">IVA di Legge (22%):</span>
              <span>€{taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base text-slate-900">
              <span className="font-sans">Totale Documento:</span>
              <span className="text-blue-700">€{grandTotal.toFixed(2)}</span>
            </div>

            {/* Fido status preview */}
            {isCreditExceeded && (
              <div className="text-3xs font-sans text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 mt-2 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Superamento Fido: l'ordine sarà inviato in stato BLOCCATO.</span>
              </div>
            )}
          </div>
        </div>

        {/* Submission Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Annulla inserimento
          </button>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting || cart.length === 0}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Sincronizzazione in corso...' : 'Conferma ed Invia ad ERP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
