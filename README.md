# AgenteGo ERP — WebApp B2B per Agenti Commerciali & Hub Multi-tenant

Soluzione SaaS multi-tenant per agenti commerciali (persone fisiche) collegata a gestionale ERP, con backend relazionale PostgreSQL su Supabase e pannello di amministrazione centralizzato per gestire i dati sincronizzati.

---

## 1. Architettura a 3 Livelli (SaaS Multi-tenant)

1. **Sede Centrale (HQ SuperAdmin)**: Gestione globale delle organizzazioni (aziende clienti del servizio SaaS), monitoraggio connettori ERP, audit trail e configurazioni di fatturazione del servizio.
2. **Organizzazioni / Aziende Clienti (Tenant B2B)**: Ogni azienda possiede i propri connettori ERP (es. Sistemi - RestAPI - Esolver, gateway REST generico), catalogo, listini, depositi magazzino e la propria rete di agenti commerciali.
3. **Agenti Commerciali (Persone Fisiche)**: Ogni agente ha il proprio accesso dedicato protetto da Row Level Security (RLS). Visualizza esclusivamente i clienti assegnati, catalogo con listini netti, disponibilità tra depositi, carrello ordini, scadenziario partite aperte con registrazione incassi sul posto, visite CRM e provvigioni maturate.

---

## 2. Pagine e Funzionalità Implementate

- **Dashboard**: KPI fatturato mese vs target (€35.000), fatturato YTD (+14.2%), ordini in corso, provvigioni maturate, andamento vendite 12 mesi comparato (SVG interattivo), top clienti e visite del giorno.
- **Clienti**: Anagrafica con filtri zona, fido concesso, esposizione creditizia e partite scadute. Scheda cliente con 6 tab (Panoramica, Storico Ordini, Sospesi & Partite Aperte, Listino & Prezzi Dedicati, Visite & Note CRM, Scheda Anagrafica Fiscale ERP con SDI e IBAN).
- **Sospesi & Incassi** *(replica screenshot)*: Scadenziario partite aperte con calcolo dello scaduto (€92.415,30), visualizzazione saldo, e pulsante **"Inserisci Incasso"** per registrare assegni/bonifici sul campo che riallineano immediatamente la posizione contabile.
- **Catalogo Prodotti** *(replica screenshot)*: Griglia visuale con foto bottiglie/articoli, codici e moltiplicatori packaging (es. `RRIS075 | 12 BT x CA12`, `OLEXT075 | 1 ST x BT`), sconti base applicati, dot di disponibilità reale e giacenze tra depositi (Valdoro Centrale, Porto Selene, Isola Grande).
- **Nuovo Ordine** *(replica screenshot)*: Testata documento (Cliente `VERDEMARE FORNITURE SPA`, Agente `3 FERRARESI DAVIDE`, causale `OV - ORDINI CLIENTI`, consegna richiesta), banner di allerta arancione in caso di fido superato o insoluti, pricing engine multilivello e invio con registrazione codice (es. `2026-OV-0000037`).
- **Storico Ordini** *(replica screenshot)*: Elenco documenti B2B con pallini stato colorati (verde, arancione, rosso), riferimenti seriali, residui, back-order e timeline interattiva a 5 fasi: `Inserito` ➔ `Confermato` ➔ `In Preparazione` ➔ `Spedito` ➔ `Fatturato`.
- **Preventivi**: Offerte con pulsante one-click **"Converti in Ordine"** (Specifica Sez. 14).
- **Visite & CRM**: Registrazione appuntamenti, esiti e promemoria ricontatto.
- **Provvigioni**: Estratto conto provvigionale (Maturato, Da Liquidare, Liquidato) con export Excel/CSV.
- **Statistiche**: Grafici di performance e concentrazione portafoglio.
- **Sede Centrale & Hub ERP**: Test connettore (Esolver, REST), sincronizzazione bidirezionale forzata in tempo reale e registro audit log.
- **Command Palette rapida**: Attivabile con `Cmd + K` o `Ctrl + K`.

---

## 3. Account Demo & Quick Switcher

Per testare istantaneamente tutti e tre i livelli della gerarchia, è disponibile un selettore rapido in alto a destra nella barra di navigazione:

- **Agente di Vendita**: `Davide Ferraresi` (`agente@example.local`) — Codice Agente 3, Area Porto Selene & Rocca Ventosa.
- **Sales Manager Organizzazione**: `Dott. Fabio Riccardi` (`manager@example.local`) — Direzione Commerciale.
- **Sede Centrale SuperAdmin**: `Direzione Sede Centrale` (`admin@example.local`) — Amministrazione globale multi-tenant.

---

## 4. Prerequisiti & Avvio Locale

### Prerequisiti
- Node.js >= 18
- npm >= 9

### Installazione dipendenze
```bash
npm install
```

### Avvio Server di Sviluppo
```bash
npm run dev
```

Il server sarà accessibile all'indirizzo `http://localhost:3000`.

### Build di Produzione
```bash
npm run build
```

---

## 5. Backend Supabase & PostgreSQL

Il progetto include le migrazioni PostgreSQL e i dati di seed pronti:
- `supabase/migrations/001_initial_schema.sql` (Tabelle multi-tenant con Row Level Security)
- `supabase/seed.sql` (Dataset italiano con clienti, articoli, listini, partite aperte e ordini)

### Configurazione variabili d'ambiente (`.env`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-placeholder
VITE_ERP_CONNECTOR_TYPE=generic_rest
VITE_ERP_ENDPOINT=https://erp.enterprise.example/api/v2
VITE_ERP_SYNC_INTERVAL_SEC=300
```

Se le credenziali Supabase non sono ancora impostate, l'applicazione attiva automaticamente il motore reattivo **Local Demo Engine**, garantendo persistenza locale, calcolo prezzi e test completo di tutte le funzionalità.
