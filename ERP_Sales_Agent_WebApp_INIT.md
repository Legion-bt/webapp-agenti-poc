# ERP Sales Agent WebApp — INIT / PROJECT SPEC

**Project type:** POC / demo navigabile  
**Target:** WebApp responsive per agenti commerciali umani collegata a ERP  
**Stack obbligatorio:** TanStack Start + React 19 + TypeScript + Tailwind CSS 4 + Radix UI + Supabase  
**Obiettivo UX:** esperienza moderna, rapida e visuale, stile Lovable/SaaS, ottimizzata desktop + tablet + mobile  
**Backend POC:** Supabase (PostgreSQL + Auth + RLS)  
**Data:** dataset demo realistico  
**Lingua UI:** Italiano

---

# 1. Obiettivo

Creare una POC completa di una WebApp destinata agli **agenti commerciali umani** di un'azienda.

L'app NON è un ERP completo e NON deve duplicare la logica gestionale dell'ERP.

Deve rappresentare il livello operativo/commerciale usato dall'agente per:

- consultare i propri clienti;
- vedere informazioni commerciali rilevanti;
- consultare articoli e disponibilità;
- applicare listini e condizioni;
- creare preventivi;
- trasformare preventivi in ordini;
- inserire ordini;
- consultare stato evasione ordini;
- controllare fatturato e andamento commerciale;
- consultare provvigioni;
- registrare visite e note;
- lavorare anche con dati demo realistici;
- predisporre l'architettura per futura integrazione con ERP reale.

La POC deve sembrare un prodotto già utilizzabile, non un semplice wireframe.

---

# 2. Principio architetturale

Separare sempre:

```text
WEBAPP AGENTE
      |
      v
SERVICE / DATA ACCESS LAYER
      |
      +---- Supabase POC
      |
      +---- ERP API futura
```

La UI non deve conoscere direttamente dettagli specifici del gestionale.

Tutte le chiamate dati devono passare attraverso repository/service TypeScript.

Esempio:

```ts
customerService.getCustomers()
customerService.getCustomer(id)

productService.searchProducts(filters)
productService.getAvailability(productId)

pricingService.calculatePrice({
  customerId,
  productId,
  quantity,
  date,
})

quoteService.createQuote(...)
orderService.createOrder(...)
```

In POC i service usano Supabase.

In futuro potranno essere sostituiti o estesi per usare:

- REST API ERP;
- FeathersJS;
- stored procedure;
- servizi middleware;
- endpoint custom.

---

# 3. Stack obbligatorio

Usare ESATTAMENTE questa base applicativa.

```json
{
  "name": "tanstack_start_ts",
  "version": "1.0.0",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "overrides": {
    "rolldown": "1.2.1"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/supabase-js": "^2.117.2",
    "@tailwindcss/vite": "^4.2.1",
    "@tanstack/react-query": "^5.101.1",
    "@tanstack/react-router": "1.170.41",
    "@tanstack/react-start": "1.168.60",
    "@tanstack/router-plugin": "1.168.42",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "exceljs": "^4.4.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.575.0",
    "react": "^19.2.0",
    "react-day-picker": "^9.14.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.71.2",
    "react-resizable-panels": "^4.6.5",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.1",
    "tw-animate-css": "^1.3.4",
    "vaul": "^1.1.2",
    "vite-tsconfig-paths": "^6.0.2",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@lovable.dev/vite-tanstack-config": "^2.24.0",
    "@types/node": "^22.16.5",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.2.0",
    "drizzle-kit": "^0.31.11",
    "drizzle-orm": "^0.45.3",
    "eslint": "^9.32.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.6",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "nitro": "3.0.260603-beta",
    "postgres": "^3.4.9",
    "prettier": "^3.7.3",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.56.1",
    "vite": "8.1.5"
  }
}
```

Non sostituire TanStack Router con React Router.

Non usare Next.js.

Non usare component library esterne oltre a quelle già disponibili.

---

# 4. Design system

La UI deve sembrare una moderna applicazione SaaS commerciale.

## Linee guida

- layout pulito;
- card ampie;
- buon uso dello spazio;
- sidebar desktop;
- bottom navigation o drawer su mobile;
- tabelle responsive;
- skeleton durante caricamento;
- toast per operazioni;
- dialog per conferme;
- drawer laterali per dettagli rapidi;
- icone Lucide;
- grafici Recharts;
- filtri moderni;
- command palette tramite `cmdk`;
- dark mode predisposta;
- evitare UI da gestionale anni 2000.

## Aspetto

Preferire:

- sfondo neutro;
- superfici/card distinte;
- bordi sottili;
- radius medio;
- KPI ben leggibili;
- badge di stato;
- tabelle con righe compatte ma leggibili;
- colori semantici solo per stati:
  - successo;
  - warning;
  - errore;
  - informazione.

La UI deve essere coerente in tutte le pagine.

---

# 5. Utenti e ruoli

Per la POC prevedere almeno:

```text
AGENT
SALES_MANAGER
ADMIN
```

## AGENT

Può vedere:

- solo i clienti assegnati;
- i propri preventivi;
- i propri ordini;
- i propri dati commerciali;
- le proprie provvigioni;
- catalogo prodotti;
- disponibilità;
- listini applicabili.

## SALES_MANAGER

Può vedere:

- tutti gli agenti assegnati;
- clienti del team;
- vendite aggregate;
- andamento agenti;
- preventivi e ordini del team.

## ADMIN

Accesso completo POC.

---

# 6. Navigazione principale

Desktop:

```text
Dashboard
Clienti
Catalogo
Preventivi
Ordini
Visite
Provvigioni
Statistiche
Impostazioni
```

Mobile:

```text
Home
Clienti
Catalogo
Ordini
Altro
```

Il pulsante principale sempre facilmente raggiungibile:

```text
+ Nuovo ordine
```

---

# 7. Dashboard

Route:

```text
/
```

oppure:

```text
/dashboard
```

La Dashboard deve contenere:

## KPI principali

- Fatturato mese;
- Fatturato anno;
- Obiettivo mese;
- Percentuale raggiungimento obiettivo;
- Ordini mese;
- Preventivi aperti;
- Clienti da visitare;
- Provvigioni maturate.

## Grafici

1. fatturato ultimi 12 mesi;
2. confronto anno corrente / anno precedente;
3. top clienti;
4. top categorie prodotto.

## Widget operativi

### Attività di oggi

Esempio:

```text
09:30  Visita Rossi Srl
11:00  Richiamo Bianchi Spa
15:30  Presentazione nuovo listino
```

### Preventivi da seguire

Mostrare:

- cliente;
- valore;
- data;
- scadenza;
- stato.

### Ordini recenti

Mostrare:

- numero;
- cliente;
- data;
- totale;
- stato.

---

# 8. Clienti

Route:

```text
/customers
```

La lista clienti deve supportare:

- ricerca;
- filtro zona;
- filtro provincia;
- filtro stato cliente;
- filtro presenza scaduti;
- filtro clienti attivi/inattivi;
- ordinamento per fatturato;
- ordinamento per ultimo ordine.

Card/lista cliente:

```text
Rossi Srl
Sassari

Fatturato YTD: €84.230
Ultimo ordine: 18 giorni fa
Ordini aperti: 2
Scaduto: €0
```

Badge:

```text
TOP CUSTOMER
DA VISITARE
SCADUTO
NUOVO
```

---

# 9. Scheda cliente

Route:

```text
/customers/$customerId
```

Header:

```text
Rossi Srl
P.IVA
Città
Agente
Zona
```

CTA:

```text
Nuovo preventivo
Nuovo ordine
Registra visita
```

Tab:

```text
Panoramica
Ordini
Preventivi
Prodotti acquistati
Situazione contabile
Visite e note
```

## Panoramica

Mostrare:

- fatturato anno;
- fatturato anno precedente;
- variazione %;
- ultimo ordine;
- ordine medio;
- frequenza media acquisto;
- listino;
- pagamento;
- fido;
- esposizione;
- scaduto.

## Prodotti acquistati

Tabella:

```text
Articolo
Descrizione
Ultimo acquisto
Quantità YTD
Prezzo ultimo
Frequenza
```

CTA:

```text
Riordina
```

---

# 10. Catalogo articoli

Route:

```text
/products
```

Deve funzionare bene sia desktop sia mobile.

## Ricerca

Ricercare per:

- codice;
- descrizione;
- barcode;
- marca;
- categoria.

Filtri:

- categoria;
- marca;
- disponibili;
- promozione;
- acquistati dal cliente selezionato.

## Card articolo

```text
[foto]

ART-001
Trapano Professionale X20

€129,00

Disponibili: 24

Categoria: Elettroutensili
```

Azioni:

```text
Dettaglio
Aggiungi all'ordine
```

---

# 11. Dettaglio articolo

Route:

```text
/products/$productId
```

Mostrare:

- foto;
- codice;
- descrizione;
- categoria;
- marca;
- unità misura;
- prezzo base;
- disponibilità totale;
- disponibilità per deposito;
- quantità impegnata;
- disponibilità futura;
- prossimo arrivo;
- articoli alternativi;
- accessori;
- storico vendite sintetico.

Esempio:

```text
Magazzino Sassari       15
Magazzino Cagliari       9
Impegnato               10
Disponibile             14

Prossimo arrivo:
50 pezzi - 15/10/2026
```

---

# 12. Prezzi e listini

La POC deve simulare la logica ERP.

NON calcolare il prezzo esclusivamente nel componente React.

Implementare:

```ts
pricingService.calculatePrice()
```

Input:

```ts
{
  customerId,
  productId,
  quantity,
  date
}
```

Output:

```ts
{
  listPrice,
  priceListCode,
  discount1,
  discount2,
  specialPrice,
  finalPrice,
  reason
}
```

Esempio:

```json
{
  "listPrice": 100,
  "priceListCode": "RIVENDITORI",
  "discount1": 10,
  "discount2": 5,
  "specialPrice": null,
  "finalPrice": 85.5,
  "reason": "Listino RIVENDITORI + sconto cliente"
}
```

Il prezzo deve essere visibile e spiegabile all'agente.

---

# 13. Preventivi

Route:

```text
/quotes
```

Stati:

```text
DRAFT
SENT
ACCEPTED
REJECTED
EXPIRED
CONVERTED
```

Lista con:

- numero;
- cliente;
- data;
- validità;
- totale;
- stato;
- agente.

## Nuovo preventivo

Route:

```text
/quotes/new
```

Wizard semplice:

```text
1 Cliente
2 Articoli
3 Condizioni
4 Riepilogo
```

Il documento deve supportare:

- quantità;
- prezzo;
- sconti;
- note riga;
- note documento;
- pagamento;
- validità;
- data consegna indicativa.

CTA finale:

```text
Salva bozza
Conferma preventivo
```

---

# 14. Trasformazione preventivo -> ordine

Un preventivo in stato:

```text
ACCEPTED
```

deve mostrare:

```text
Converti in ordine
```

La conversione deve:

1. creare testata ordine;
2. copiare righe;
3. ricalcolare/verificare prezzi;
4. verificare disponibilità;
5. mantenere riferimento al preventivo originario.

---

# 15. Ordini

Route:

```text
/orders
```

Stati POC:

```text
DRAFT
SUBMITTED
CONFIRMED
PREPARING
PARTIALLY_SHIPPED
SHIPPED
INVOICED
CANCELLED
BLOCKED
```

Usare badge ben distinguibili.

Filtri:

- periodo;
- cliente;
- stato;
- agente;
- solo ordini aperti.

---

# 16. Nuovo ordine

Route:

```text
/orders/new
```

Flusso:

```text
Cliente
   ↓
Catalogo
   ↓
Carrello
   ↓
Prezzi ERP
   ↓
Disponibilità
   ↓
Condizioni
   ↓
Riepilogo
   ↓
Conferma
```

Il carrello deve essere persistente almeno durante la sessione.

Ogni riga deve contenere:

```text
Codice
Descrizione
Quantità
Prezzo listino
Sconto
Prezzo netto
Totale
Disponibilità
```

Esempio:

```text
ART001
10 x €90,00
Totale €900

Disponibile: 30
```

---

# 17. Controlli ordine

Prima della conferma verificare:

- cliente attivo;
- cliente non bloccato;
- fido;
- scaduti;
- disponibilità;
- quantità minima;
- prezzi;
- condizioni commerciali.

Possibili warning:

```text
Il cliente presenta €3.500 di scaduto.
```

oppure:

```text
Fido residuo insufficiente.
Ordine soggetto ad approvazione.
```

Lo stato può diventare:

```text
BLOCKED
```

ma la POC deve permettere di visualizzare chiaramente il motivo.

---

# 18. Dettaglio ordine

Route:

```text
/orders/$orderId
```

Mostrare timeline:

```text
Ordine inserito
      |
      v
Confermato
      |
      v
Preparazione
      |
      v
Spedito
      |
      v
Fatturato
```

Mostrare:

- documento;
- cliente;
- agente;
- righe;
- quantità;
- prezzi;
- totale;
- stato;
- consegna prevista;
- eventuali spedizioni;
- eventuali fatture correlate.

---

# 19. Visite commerciali

Route:

```text
/visits
```

L'agente deve poter registrare:

```text
Cliente
Data
Tipo contatto
Esito
Note
Follow-up
Data prossimo contatto
```

Tipi:

```text
VISIT
CALL
EMAIL
VIDEO_CALL
OTHER
```

Esempio:

```text
Rossi Srl
07/10/2026

Visita

Interessato alla nuova gamma X.
Richiamare tra 10 giorni.
```

---

# 20. Provvigioni

Route:

```text
/commissions
```

Dashboard:

```text
Maturato mese
Maturato anno
Da liquidare
Liquidato
```

Tabella:

```text
Documento
Cliente
Imponibile
Percentuale
Provvigione
Stato
```

Stati:

```text
ACCRUED
PAYABLE
PAID
```

---

# 21. Statistiche

Route:

```text
/analytics
```

Inserire almeno:

- fatturato per mese;
- confronto anno precedente;
- ordini;
- valore medio ordine;
- top clienti;
- top prodotti;
- top categorie;
- clienti inattivi;
- nuovi clienti;
- andamento obiettivo.

Usare Recharts.

---

# 22. Supabase

Usare Supabase per:

- Auth;
- PostgreSQL;
- RLS;
- seed demo;
- eventuale Storage per immagini prodotto/avatar.

Environment:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Creare:

```text
src/lib/supabase/client.ts
```

Non inserire chiavi hardcoded.

---

# 23. Schema database POC

Creare migrazioni Supabase.

## profiles

```text
id uuid PK -> auth.users
first_name
last_name
role
avatar_url
created_at
updated_at
```

## sales_agents

```text
id uuid PK
profile_id uuid
code
area
commission_default
active
```

## customers

```text
id uuid PK
code
business_name
vat_number
tax_code
email
phone
address
city
province
postal_code
country
sales_agent_id
price_list_id
payment_term
credit_limit
current_exposure
overdue_amount
status
latitude
longitude
created_at
updated_at
```

## customer_notes

```text
id
customer_id
sales_agent_id
note
created_at
```

## product_categories

```text
id
code
name
```

## products

```text
id
code
barcode
name
description
category_id
brand
unit
base_price
cost_price
image_url
active
created_at
updated_at
```

## warehouses

```text
id
code
name
city
```

## stock

```text
id
warehouse_id
product_id
quantity_on_hand
quantity_committed
quantity_available
updated_at
```

## price_lists

```text
id
code
name
valid_from
valid_to
active
```

## price_list_items

```text
id
price_list_id
product_id
price
discount1
discount2
```

## customer_product_prices

```text
id
customer_id
product_id
price
discount1
discount2
valid_from
valid_to
```

## quotes

```text
id
number
customer_id
sales_agent_id
status
quote_date
valid_until
payment_term
notes
subtotal
discount_total
tax_total
total
converted_order_id
created_at
updated_at
```

## quote_items

```text
id
quote_id
product_id
quantity
list_price
discount1
discount2
unit_price
line_total
notes
```

## orders

```text
id
number
customer_id
sales_agent_id
quote_id
status
order_date
requested_delivery_date
payment_term
notes
subtotal
discount_total
tax_total
total
block_reason
created_at
updated_at
```

## order_items

```text
id
order_id
product_id
quantity
quantity_shipped
list_price
discount1
discount2
unit_price
line_total
```

## shipments

```text
id
order_id
number
shipment_date
status
tracking_code
```

## invoices

```text
id
order_id
number
invoice_date
due_date
subtotal
tax_total
total
paid_amount
status
```

## visits

```text
id
customer_id
sales_agent_id
visit_date
type
outcome
notes
follow_up_date
created_at
```

## commissions

```text
id
sales_agent_id
order_id
invoice_id
base_amount
percentage
amount
status
accrued_date
paid_date
```

## sales_targets

```text
id
sales_agent_id
year
month
target_amount
```

---

# 24. Relazioni principali

```text
sales_agent
   |
   +---- customers
   |
   +---- quotes
   |
   +---- orders
   |
   +---- visits
   |
   +---- commissions
   |
   +---- sales_targets


customer
   |
   +---- quotes
   |
   +---- orders
   |
   +---- visits
   |
   +---- customer_product_prices


product
   |
   +---- stock
   |
   +---- price_list_items
   |
   +---- quote_items
   |
   +---- order_items
```

---

# 25. Row Level Security

Abilitare RLS.

## AGENT

Un agente vede solo dati associati al proprio `sales_agent_id`.

Esempio logico:

```text
customers.sales_agent_id = current_agent_id
```

Stesso principio per:

- quotes;
- orders;
- visits;
- commissions.

## SALES_MANAGER

Può vedere il proprio team.

Per POC è accettabile implementare una tabella:

```text
sales_manager_agents
```

con:

```text
manager_profile_id
sales_agent_id
```

## ADMIN

Accesso completo.

---

# 26. Dataset demo

Creare seed realistico.

Minimo:

```text
5 agenti
40 clienti
80 articoli
6 categorie
3 magazzini
4 listini
100 ordini
25 preventivi
50 visite
12 mesi di target
provvigioni associate
```

I dati devono generare dashboard interessanti.

Inserire esempi di:

- cliente top;
- cliente inattivo;
- cliente con scaduto;
- cliente vicino al limite fido;
- articolo esaurito;
- articolo in arrivo;
- articolo molto venduto;
- preventivo in scadenza;
- ordine bloccato;
- ordine spedito;
- ordine parzialmente spedito.

---

# 27. Struttura cartelle

Usare una struttura simile:

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── customers/
│   ├── products/
│   ├── quotes/
│   ├── orders/
│   └── analytics/
│
├── features/
│   ├── auth/
│   ├── customers/
│   ├── products/
│   ├── pricing/
│   ├── quotes/
│   ├── orders/
│   ├── visits/
│   ├── commissions/
│   └── analytics/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── query-client.ts
│   ├── utils.ts
│   └── constants.ts
│
├── services/
│   ├── customer.service.ts
│   ├── product.service.ts
│   ├── pricing.service.ts
│   ├── quote.service.ts
│   ├── order.service.ts
│   ├── visit.service.ts
│   ├── commission.service.ts
│   └── analytics.service.ts
│
├── schemas/
│   ├── customer.schema.ts
│   ├── quote.schema.ts
│   ├── order.schema.ts
│   └── visit.schema.ts
│
├── types/
│   ├── database.ts
│   └── domain.ts
│
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── dashboard.tsx
│   ├── customers/
│   ├── products/
│   ├── quotes/
│   ├── orders/
│   ├── visits/
│   ├── commissions/
│   └── analytics/
│
└── styles/
    └── app.css

supabase/
├── config.toml
├── migrations/
└── seed.sql
```

---

# 28. TanStack Query

Usare TanStack Query per i dati remoti.

Definire query key coerenti.

Esempio:

```ts
['customers']
['customer', customerId]
['products', filters]
['product', productId]
['orders', filters]
['order', orderId]
['dashboard', agentId]
```

Dopo mutation:

```ts
queryClient.invalidateQueries(...)
```

Non gestire manualmente caching complesso nei componenti.

---

# 29. Form

Usare:

```text
react-hook-form
+
zod
+
@hookform/resolvers
```

Validazione condivisa tramite schema.

Esempio:

```ts
const orderSchema = z.object({
  customerId: z.string().uuid(),
  requestedDeliveryDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
})
```

---

# 30. UX di caricamento e errori

Ogni pagina deve gestire:

```text
loading
empty
error
success
```

Usare:

- skeleton;
- empty state;
- retry;
- toast Sonner.

Non lasciare schermate vuote.

---

# 31. Ricerca globale

Implementare command palette:

```text
CTRL + K
```

oppure:

```text
CMD + K
```

Ricerca rapida:

```text
Clienti
Articoli
Ordini
Preventivi
```

Risultato cliccabile.

---

# 32. Responsive

La POC deve funzionare bene a:

```text
375 px
768 px
1024 px
1440 px
```

Su mobile:

- niente tabelle ingestibili;
- convertire liste in card quando necessario;
- drawer;
- toolbar compatta;
- CTA ordine sempre facilmente raggiungibile.

---

# 33. Mock ERP boundary

Creare interfaccia:

```ts
export interface ErpGateway {
  calculatePrice(...)
  getAvailability(...)
  validateCustomerCredit(...)
  submitOrder(...)
}
```

Implementazione POC:

```text
SupabaseErpGateway
```

In futuro:

```text
RestErpGateway
FeathersErpGateway
```

Questo è un requisito importante.

La UI non deve dipendere da Supabase per la logica ERP.

---

# 34. Pricing engine POC

Per simulare il gestionale usare questo ordine:

```text
1 customer_product_prices valido
2 price_list_items del listino cliente
3 products.base_price
```

Applicare quindi:

```text
discount1
discount2
```

Formula:

```text
net = price
net = net - net * discount1 / 100
net = net - net * discount2 / 100
```

Il servizio deve restituire anche l'origine del prezzo.

---

# 35. Disponibilità POC

Calcolare:

```text
available =
quantity_on_hand
-
quantity_committed
```

Disponibilità totale articolo:

```text
SUM(stock.quantity_available)
```

La UI deve poter mostrare anche il dettaglio per deposito.

---

# 36. Fido e blocco ordine

Calcolare:

```text
remaining_credit =
credit_limit
-
current_exposure
```

Se:

```text
order_total > remaining_credit
```

mostrare warning.

Se:

```text
overdue_amount > 0
```

mostrare warning.

Per POC:

```text
overdue_amount > 5000
```

può causare:

```text
BLOCKED
```

La soglia deve essere isolata in configurazione.

---

# 37. Dashboard calculation

Calcolare almeno:

```text
monthly_revenue
yearly_revenue
previous_year_revenue
monthly_target
target_percentage
open_quotes
open_orders
commission_ytd
customers_to_visit
```

---

# 38. Dati demo e immagini

Se non sono disponibili immagini reali:

- usare placeholder coerenti;
- preferire immagini prodotto neutre;
- evitare immagini casuali incoerenti.

L'app deve essere gradevole anche senza immagini.

---

# 39. Export Excel

Usare `exceljs`.

Aggiungere export almeno per:

```text
Clienti
Ordini
Provvigioni
```

CTA:

```text
Esporta Excel
```

---

# 40. Autenticazione

Pagina:

```text
/login
```

Login email/password Supabase.

La registrazione pubblica NON serve.

Prevedere session persistence.

Dopo login:

```text
/dashboard
```

Se utente non autenticato:

```text
/login
```

---

# 41. Account demo

Nel seed/documentazione prevedere:

```text
agente@example.local
manager@example.local
admin@example.local
```

Per sicurezza NON inserire password reali nel repository pubblico.

Per sviluppo locale documentare il modo di creare gli utenti tramite Supabase.

---

# 42. Componenti UI da creare

Minimo:

```text
AppSidebar
MobileNavigation
PageHeader
StatCard
StatusBadge
DataTable
EmptyState
SearchInput
FilterBar
CustomerCard
ProductCard
PriceDisplay
StockBadge
OrderStatusTimeline
QuoteStatusBadge
CurrencyValue
PercentageTrend
DateRangeFilter
ConfirmDialog
```

---

# 43. Feature prioritization

## MVP 1

Implementare prima:

```text
Auth
Layout
Dashboard
Clienti
Scheda cliente
Catalogo
Dettaglio articolo
```

## MVP 2

```text
Prezzi
Nuovo preventivo
Lista preventivi
Nuovo ordine
Lista ordini
Dettaglio ordine
```

## MVP 3

```text
Visite
Provvigioni
Statistiche
Export Excel
```

---

# 44. Pagine obbligatorie per considerare la POC completa

Devono essere navigabili:

```text
/login
/dashboard
/customers
/customers/$customerId
/products
/products/$productId
/quotes
/quotes/new
/quotes/$quoteId
/orders
/orders/new
/orders/$orderId
/visits
/commissions
/analytics
```

---

# 45. Demo scenario

La POC deve permettere questa dimostrazione completa:

## Scenario

1. Login come agente.
2. Dashboard mostra KPI.
3. Aprire `Rossi Srl`.
4. Visualizzare storico acquisti.
5. Cliccare `Nuovo ordine`.
6. Cercare `ART-001`.
7. Vedere prezzo specifico cliente.
8. Vedere disponibilità.
9. Inserire quantità.
10. Aggiungere un secondo articolo.
11. Visualizzare riepilogo.
12. Mostrare eventuale warning fido/scaduto.
13. Confermare ordine.
14. Aprire dettaglio ordine.
15. Vedere timeline stato.
16. Tornare al cliente.
17. Vedere il nuovo ordine nello storico.

Questo flusso deve essere prioritario rispetto a funzionalità secondarie.

---

# 46. Qualità codice

Richiesto:

```text
TypeScript strict
```

Evitare:

```ts
any
```

quando possibile.

Separare:

```text
UI
business logic
data access
types
validation
```

Non scrivere grandi componenti monolitici.

Obiettivo indicativo:

```text
< 300 righe per componente
```

quando ragionevole.

---

# 47. Naming

Codice in inglese.

UI in italiano.

Esempio:

```text
Customer
Order
Quote
Product
SalesAgent
```

UI:

```text
Cliente
Ordine
Preventivo
Articolo
Agente
```

---

# 48. Setup Supabase locale

La POC deve essere compatibile con Supabase locale.

Comandi indicativi:

```bash
supabase init
supabase start
supabase db reset
```

Le migrazioni devono essere versionate.

Il seed deve permettere:

```bash
supabase db reset
```

e ottenere nuovamente una demo funzionante.

---

# 49. Environment template

Creare:

```text
.env.example
```

con:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=
```

Non committare `.env`.

---

# 50. README minimo generato dal progetto

Dopo la generazione dell'app creare anche `README.md` con:

```text
Prerequisiti
Installazione
Supabase locale
Environment
Avvio sviluppo
Build
Reset database
Account demo
Architettura sintetica
```

---

# 51. Comandi iniziali

Il progetto deve poter essere avviato con:

```bash
npm install
```

poi:

```bash
supabase start
```

poi:

```bash
supabase db reset
```

poi configurare:

```text
.env
```

infine:

```bash
npm run dev
```

---

# 52. Definition of Done POC

La POC è considerata completa se:

- build TypeScript riuscita;
- `npm run build` funziona;
- login funzionante;
- RLS attiva;
- dati demo disponibili;
- dashboard popolata;
- navigazione responsive;
- clienti consultabili;
- articoli consultabili;
- prezzi specifici cliente calcolati;
- preventivo creabile;
- ordine creabile;
- ordine visualizzabile;
- warning fido/scaduti presenti;
- visite registrabili;
- provvigioni visualizzabili;
- analytics visibili;
- nessun errore console bloccante;
- nessuna chiave segreta hardcoded.

---

# 53. Vincoli importanti

NON:

- trasformare l'app in ERP completo;
- implementare contabilità generale;
- duplicare logiche ERP inutilmente;
- mettere SQL direttamente nei componenti React;
- collegare componenti direttamente a tabelle senza service layer;
- inserire dati statici se esistono già nel seed;
- creare una UI puramente desktop;
- usare `any` indiscriminatamente;
- aggiungere framework non richiesti.

---

# 54. Estensioni future previste

Preparare l'architettura, senza necessariamente implementare ora:

```text
ERP REST API
FeathersJS middleware
offline mode / PWA
geolocalizzazione clienti
giro visite
firma cliente
catalogo PDF
invio preventivo email
notifiche
ordini offline
sincronizzazione bidirezionale ERP
barcode scanner
push notification
allegati
documenti cliente
DDT
fatture
pagamenti
CRM avanzato
AI assistant commerciale
```

Queste funzionalità future NON devono complicare il POC iniziale.

---

# 55. Direzione UX finale

La webapp deve dare l'impressione di:

```text
CRM commerciale
+
catalogo digitale
+
raccolta ordini
+
dashboard vendite
```

non di un ERP tradizionale.

L'agente deve poter completare le operazioni principali con pochi click.

Priorità UX:

```text
cliente
→ articolo
→ prezzo
→ disponibilità
→ ordine
```

---

# 56. Istruzioni finali per l'agente di sviluppo

Procedere senza chiedere conferme intermedie per decisioni UI minori.

Ordine consigliato:

```text
1 scaffold progetto
2 setup Tailwind
3 setup Supabase
4 migrazioni
5 seed
6 auth
7 layout
8 dashboard
9 clienti
10 prodotti
11 pricing
12 preventivi
13 ordini
14 visite
15 provvigioni
16 analytics
17 responsive pass
18 test build
19 README
```

Quando una funzionalità non è definita in dettaglio, scegliere la soluzione più semplice e coerente con:

```text
POC
mobile-first
commercial agent workflow
clean SaaS UX
future ERP integration
```

Non interrompere il lavoro per dettagli cosmetici.

La priorità assoluta è rendere completo e dimostrabile il flusso:

```text
LOGIN
  ↓
CLIENTE
  ↓
ARTICOLO
  ↓
PREZZO
  ↓
DISPONIBILITÀ
  ↓
ORDINE
  ↓
STATO ORDINE
```

---

# 57. Risultato atteso

Al termine deve esistere una POC avviabile localmente che permetta di presentare concretamente il concetto di **WebApp per agenti commerciali integrata con ERP**, con Supabase come backend dimostrativo e un'architettura pronta a essere collegata successivamente al gestionale reale.

