# AgenteGo — WebApp per agenti commerciali B2B (POC) — note per gli agenti di sviluppo

## Origine del progetto

- Codice generato con **Google AI Studio** (strumento web) ed esportato qui. AI Studio è il
  sistema esterno usato per la POC, come Lovable per ShiftOps: non si sincronizza da solo con
  questa cartella. Prima di modificare qualcosa che vada riportato in AI Studio, o prima di
  sovrascrivere il codice con un nuovo export da AI Studio, chiedere all'utente.
- Al momento la cartella **non è un repository git**. Non fare `git init` e non creare remoti senza
  conferma; prima va sistemato `.gitignore` (vedi Sicurezza).
- La specifica di riferimento è `ERP_Sales_Agent_WebApp_INIT.md` (57 sezioni: ruoli, route,
  schema DB, RLS, pricing engine, demo scenario, Definition of Done). `README.md` descrive
  quanto implementato da AI Studio.
- `note_operative/06_10_2026/*.png` sono gli screenshot del gestionale di riferimento
  (Sospesi, Catalogo, Nuovo Ordine, Storico Ordini) che la UI replica.
- `metadata.json` e i commenti `DISABLE_HMR` in `vite.config.ts` servono ad AI Studio: non
  rimuoverli.

## Stato reale vs specifica (importante)

La specifica chiede TanStack Start + TanStack Router/Query + Radix/shadcn + react-hook-form/zod
+ Recharts + exceljs. Il codice generato **non** segue quello stack:

- Vite 8 + React 19 SPA, Tailwind v4, `lucide-react`, `motion`; `server.ts` (Express) serve
  `dist/` in produzione (Cloud Run di AI Studio), compilato in `server.js` dal `build`.
- **Nessun router**: la navigazione è uno `useState` in `src/App.tsx` (`currentView` +
  `selectedEntityId`), quindi niente URL per le pagine.
- **Dati in memoria**: `src/lib/store.ts` è uno store globale (pattern subscribe) inizializzato
  da `src/lib/mock-data.ts` e persistito in `localStorage` (`agentego_erp_database_v1`).
  I service in `src/services/*.service.ts` leggono e scrivono lo store, **non Supabase**.
- **Supabase è usato solo per**: login email/password (`store.loginWithSupabase`), lettura di
  `profiles` / `sales_agents` per il ruolo, test di connessione in `AdminErpView`.
- Ruoli nel codice: `HQ_SUPERADMIN`, `ORG_ADMIN`, `AGENT` (multi-tenant con `organizations`);
  la specifica parla di `ADMIN`, `SALES_MANAGER`, `AGENT`.
- `src/services/erp-gateway.ts` definisce l'interfaccia `ErpGateway` (impl. `SimulatedErpGateway`
  simulata): è il confine ERP richiesto dalla specifica §33, da mantenere.

Decisioni ancora aperte (chiedere all'utente, non procedere da soli): migrare allo stack della
specifica (TanStack Start ecc.) oppure evolvere la SPA attuale; collegare i service a Supabase
al posto dello store locale.

## Ambiente di sviluppo

- Esiste `bun.lock`: usare **Bun** (`bun install`, `bun run dev`), coerentemente con gli altri
  progetti dell'utente. Il README dice npm (generato da AI Studio): non mischiare i lockfile.
- `node_modules` non è installato: al primo avvio eseguire `bun install`.
- Script: `dev` (Vite su porta 3000, host 0.0.0.0), `build` (Vite + esbuild di `server.ts`),
  `start` (`node server.js`), `lint` (= `tsc --noEmit`, non c'è ESLint).
- `scripts/*.ts` (seed live, test connessione, prova SQL) si eseguono con `bun scripts/<file>.ts`.

## Supabase

- **Cloud** (attuale): progetto `ppfebdhulnkncvyfgyul` su supabase.com
  (`https://ppfebdhulnkncvyfgyul.supabase.co`). Dashboard:
  `https://supabase.com/dashboard/project/ppfebdhulnkncvyfgyul`.
- `.env.local` (gitignored, creato il 2026-10-08) punta già al cloud con URL e publishable key; `SUPABASE_SECRET_KEY` è vuota finché l'utente non la ruota e la inserisce.
- **Locale**: previsto più avanti (la specifica §48 chiede compatibilità con `supabase start` /
  `supabase db reset`). Le env vanno in `.env.local` (gitignored), mai in `.env.example`.
- Variabili lette dal client: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (oppure
  `VITE_SUPABASE_PUBLISHABLE_KEY`). La chiave publishable/anon non è segreta.
- SQL nel repo: `supabase/migrations/001_initial_schema.sql` (schema + RLS),
  `supabase/seed.sql`, `supabase/setup_complete.sql` (versione "tutto in uno" da incollare nel
  SQL Editor). Non è verificato quale sia applicato sul cloud né se coincidano: controllare
  prima di scrivere nuove migrazioni.
- Applicate sul cloud dall'utente (SQL Editor): `002` (profiles, RLS per ruolo, documenti PDF),
  `003` (dati demo), `004` (profiles.agent_id). Edge Function `admin-users`
  (`supabase/functions/admin-users`, gestione utenti con la chiave segreta lato server) pubblicata
  dal dashboard (Via Editor, Verify JWT disattivato): dopo ogni modifica va ripubblicata a mano.
- `005` (ordini: order_items, RPC `create_order`, numerazione lato server): ordini letti e scritti
  su Supabase da `order.service.ts` / `store.syncOrders()`. Provvigioni, giacenze, preventivi e
  visite restano dati demo locali.
  La Edge Function è esclusa dal `tsc` del progetto (è codice Deno).
- Regole per lo schema (stesse di ShiftOps): ogni nuova tabella in `public` con GRANT espliciti,
  RLS abilitata e policy separate per select/insert/update/delete; ruoli in tabella dedicata,
  non controllati lato client. Nuove modifiche come **nuovi file** numerati in
  `supabase/migrations/`, mai riscrivendo quelli già applicati.
- Non eseguire mai `supabase db reset` o DROP sul cloud senza conferma esplicita.
  Per applicare SQL sul cloud, scrivere il file e chiedere all'utente come applicarlo.

## Sicurezza (da sistemare per primo)

- `scripts/seed-supabase-live.ts`, `scripts/test-supabase.ts`, `scripts/try-sql.ts` contengono
  una **secret key Supabase (`sb_secret_…`) hardcoded** come fallback. Va rimossa dal codice
  (solo `process.env.SUPABASE_SECRET_KEY`, letta da `.env.local`) e l'utente deve
  **ruotarla** dalla dashboard Supabase (è già finita nell'export di AI Studio).
- `src/lib/supabase/client.ts` e `AdminErpView.tsx` hanno URL/publishable key hardcoded come
  fallback: non è un segreto, ma la specifica §22 chiede niente chiavi nel codice.
- `supabase_progetto.txt` contiene credenziali in chiaro: è escluso da git, non leggerlo né
  stamparne il contenuto se non serve, non copiarlo altrove.
- Non stampare mai valori di chiavi o password nell'output.

## Convenzioni

- Codice in inglese, UI in italiano (specifica §47).
- Nessun SQL o chiamata Supabase diretta nei componenti: passare dai service (§2, §53).
- Pricing, disponibilità, fido/blocco ordine sono logica di service (`pricing.service.ts`,
  `erp-gateway.ts`), non dei componenti React (§12, §34–36).
- Flusso prioritario da tenere sempre funzionante: login → cliente → articolo → prezzo →
  disponibilità → ordine → stato ordine (§45, §56).
