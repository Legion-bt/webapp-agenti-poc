# AgenteGo

**La webapp per gli agenti di commercio B2B.** Dal telefono o dal PC l'agente trova i suoi
clienti, controlla prezzi e disponibilità e inserisce l'ordine; la sede e i manager gestiscono
aziende, utenti e accessi. Una sola installazione serve più aziende, ciascuna con il proprio
collegamento al gestionale.

> **Stato: prototipo funzionante (POC).** Accessi, clienti, catalogo e ordini lavorano su dati
> reali in Supabase; preventivi, scadenzario, visite, provvigioni e statistiche usano ancora
> dati dimostrativi, in attesa del collegamento al gestionale. Tutti i dati demo sono inventati.

Produzione: <https://agentego-poc.vercel.app>

---

## Indice

- [Cosa fa](#cosa-fa)
- [Ruoli](#ruoli)
- [Funzioni e stato](#funzioni-e-stato)
- [Architettura](#architettura)
- [Avvio in locale](#avvio-in-locale)
- [Supabase](#supabase)
- [Deploy](#deploy)
- [Sicurezza](#sicurezza)
- [Struttura del progetto](#struttura-del-progetto)
- [Documentazione](#documentazione)
- [Prossimi passi](#prossimi-passi)

---

## Cosa fa

Il flusso centrale, sempre funzionante, è quello dell'agente:

1. **Accesso** con email e password fornite dall'azienda.
2. **Cliente:** ricerca, scheda con anagrafica, destinazioni, fido, esposizione, scaduto, ordini e documenti PDF.
3. **Articolo:** catalogo con foto, codici, confezioni e promozioni.
4. **Prezzo:** calcolato dal listino del cliente, con prezzi speciali e sconti a cascata.
5. **Disponibilità:** giacenza per magazzino e avviso se non basta.
6. **Ordine:** totali e IVA; con fido superato o insoluti l'ordine viene salvato come bloccato, con il motivo.
7. **Stato ordine:** inviato, confermato, in preparazione, spedito, fatturato, bloccato, annullato.

## Ruoli

| Ruolo | Vede | Può |
|---|---|---|
| **Agente** | Solo i clienti assegnati alla sua scheda agente, con ordini e documenti | Consultare clienti e catalogo, inserire ordini e preventivi, registrare visite e incassi |
| **Manager** | Clienti, agenti e ordini della propria azienda | Quanto l'agente, più gestire utenti (manager e agenti) e immagini degli articoli della sua azienda |
| **Sede centrale** | Tutte le aziende | Creare e disattivare aziende, gestire tutti gli utenti, configurare il connettore del gestionale |

I permessi sono applicati dal database (Row Level Security), non solo dall'interfaccia.

## Funzioni e stato

| Area | Cosa fa | Stato |
|---|---|---|
| Accesso | Login, sessione, tema chiaro/scuro | ✅ Operativa |
| Clienti | Elenco e scheda cliente | ✅ Operativa |
| Documenti cliente | PDF allegati al cliente, in archivio privato | ✅ Operativa |
| Catalogo articoli | Griglia con ricerca e filtri | ✅ Operativa |
| Immagini articoli | Upload da sede e manager in bucket privato; illustrazione automatica se manca | ✅ Operativa |
| Nuovo ordine | Carrello, controllo disponibilità e fido, blocco automatico | ✅ Operativa (prezzi da gateway ERP simulato) |
| Storico ordini | Elenco, dettaglio, avanzamento di stato | ✅ Operativa |
| Utenti e accessi | Creazione utenti, ruoli, password, disattivazione; scheda agente creata con l'utente | ✅ Operativa |
| Organizzazioni | Creazione, modifica, disattivazione aziende; listino base | ✅ Operativa |
| Preventivi | Creazione e conversione in ordine | 🧪 Dimostrativa |
| Sospesi e incassi | Scadenzario e registrazione incassi | 🧪 Dimostrativa |
| Visite e CRM | Agenda, esiti, promemoria | 🧪 Dimostrativa |
| Provvigioni | Maturate, da liquidare, liquidate | 🧪 Dimostrativa |
| Dashboard e statistiche | Obiettivi, fatturato, andamenti | 🧪 Dimostrativa |
| Sede centrale e hub ERP | Stato connettore, sincronizzazioni, registro | 🧪 Dimostrativa (gestionale simulato) |

Ricerca rapida su clienti, articoli e ordini con `Ctrl+K`; interfaccia adattata al telefono.

## Architettura

```
Browser (SPA React)
   │  login, letture e scritture con il token dell'utente
   ▼
Supabase ── Auth ─ ruoli in public.profiles
   ├── Postgres ─ dati per azienda, Row Level Security per ruolo, RPC (es. create_order)
   ├── Storage ─ bucket privati: customer-documents (PDF), product-images (JPEG/PNG/WebP)
   └── Edge Function admin-users ─ gestione utenti con la chiave segreta, solo lato server
         │
         ▼ (in progetto)
Gestionale ERP ─ connettori: "Sistemi - RestAPI - Esolver", gateway REST generico
```

| Componente | Tecnologia |
|---|---|
| Frontend | Vite 8, React 19, TypeScript, Tailwind CSS v4, lucide-react, motion |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions (Deno) |
| Hosting | Vercel (statico) |
| Font | Inclusi nel bundle (`@fontsource`), nessuna risorsa esterna |

Il confine verso il gestionale è l'interfaccia `ErpGateway` in `src/services/erp-gateway.ts`
(oggi implementata da `SimulatedErpGateway`).

## Avvio in locale

Prerequisiti: [Bun](https://bun.sh) (il progetto usa `bun.lock`).

```bash
bun install
cp .env.example .env.local   # poi inserire URL e chiave publishable di Supabase
bun run dev                  # http://localhost:3000
```

| Comando | Cosa fa |
|---|---|
| `bun run dev` | Server di sviluppo Vite sulla porta 3000 |
| `bun run build` | Build di produzione in `dist/` (+ `server.js`) |
| `bun run lint` | Controllo dei tipi (`tsc --noEmit`) |
| `bun run preview` | Anteprima della build |

Variabili lette dal client (`.env.local`, mai committato):

| Variabile | Descrizione |
|---|---|
| `VITE_SUPABASE_URL` | URL del progetto Supabase |
| `VITE_SUPABASE_ANON_KEY` o `VITE_SUPABASE_PUBLISHABLE_KEY` | Chiave publishable (non segreta) |

Senza Supabase configurato l'app mostra i dati dimostrativi salvati nel browser.

## Supabase

Le modifiche al database sono migrazioni numerate in `supabase/migrations/`, da eseguire in
ordine nel SQL Editor. Un file già applicato non si riscrive: ogni cambiamento è un file nuovo.

| Migrazione | Contenuto |
|---|---|
| `001` | Schema iniziale |
| `002` | Profili e ruoli, RLS per ruolo, documenti PDF dei clienti (bucket privato) |
| `003` | Dati demo (organizzazioni, agenti, clienti) |
| `004` | Collegamento utente ↔ scheda agente |
| `005` | Ordini: righe, RPC `create_order`, numerazione lato server |
| `006` | Dati ERP neutri |
| `007` | Anonimizzazione completa dei dati demo |
| `008` | Immagini articoli in bucket privato, RPC `set_product_image` |
| `009` | Organizzazioni disattivabili (non eliminabili), accesso negato agli utenti di aziende disattivate |
| `010` | Connettori ERP ammessi: `ESOLVER_REST`, `GENERIC_REST` |

**Edge Function `admin-users`** (`supabase/functions/admin-users`): crea, modifica, disattiva
ed elimina gli utenti con la chiave segreta, che resta sul server. Va pubblicata dal dashboard
Supabase (Edge Functions → editor, *Verify JWT* disattivato: il controllo del token è nel codice)
e ripubblicata a mano dopo ogni modifica.

## Deploy

```bash
vercel deploy --prod --yes
```

Su Vercel servono solo le variabili `VITE_SUPABASE_*`. La chiave segreta di Supabase non va
mai su Vercel né nel codice client.

## Sicurezza

- Permessi per ruolo applicati da Postgres (RLS) e dalle funzioni `SECURITY DEFINER`.
- Operazioni privilegiate (utenti) solo nella Edge Function, con verifica del ruolo di chi chiama.
- Documenti e immagini in bucket privati, letti con URL firmati a scadenza.
- Nessuna immagine, font o script da domini esterni.
- Dati demo interamente inventati: nessuna persona, azienda, luogo, banca o prodotto reale.
- File con credenziali (`.env.local`, `supabase_progetto.txt`) esclusi da git.

## Struttura del progetto

```
src/
  App.tsx                 navigazione tra le viste
  components/             viste per area (customers, catalog, orders, admin, …)
  services/               logica applicativa e accesso a Supabase (mai SQL nei componenti)
  lib/store.ts            stato globale e sincronizzazione da Supabase
  lib/mock-data.ts        dati dimostrativi
  types/                  tipi condivisi
supabase/
  migrations/             migrazioni numerate
  functions/admin-users/  Edge Function gestione utenti
.integrazioni/            analisi delle integrazioni (eSolver, Telegram, OCR)
scripts/                  script di supporto (seed, test di connessione)
```

## Documentazione

| Documento | Contenuto |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Regole e stato del progetto per lo sviluppo |
| [`ERP_Sales_Agent_WebApp_INIT.md`](ERP_Sales_Agent_WebApp_INIT.md) | Specifica funzionale di riferimento |
| [`.integrazioni/esolver/`](.integrazioni/esolver/) | Integrazione con eSolver: brief del backend, analisi, stima, registro scambi |
| [`.integrazioni/estensioni/telegram-e-ocr.md`](.integrazioni/estensioni/telegram-e-ocr.md) | Estensioni Telegram e OCR |

## Prossimi passi

- **Integrazione eSolver:** lettura di clienti, articoli, giacenze e stato ordini; invio degli
  ordini. Le scelte sono in attesa di decisione (vedi `.integrazioni/esolver/02_analisi-e-stima.md`).
- **Aree da rendere operative:** preventivi, scadenzario e incassi, visite, provvigioni, statistiche.
- **Prezzi e fido lato server**, quando il gestionale li fornirà.
- **Estensioni:** avvisi e canale Telegram, ordini da documento (OCR).
