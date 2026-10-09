# eSolver ↔ AgenteGo: analisi delle lacune e stima

Stato: **bozza per Alessandro, nessuna decisione presa.** Aggiornata il 2026-10-09 con le
risposte del backend (`03_scambi.md`). Colonne dei report da verificare su eSolver reale
(`getFilters`).

## Copertura per funzione della webapp

| Funzione AgenteGo | Fonte eSolver | Stato |
|---|---|---|
| Clienti (anagrafica, ricerca) | `CLIENTI4APP` | ✅ c'è: ragione sociale, indirizzo, P.IVA/CF, contatti, pagamento, listino assegnato |
| Destinazioni di consegna | `INDCLIENTI4APP` | ✅ c'è |
| **Visibilità per agente** | nessun codice agente sul cliente, nessun report agenti | ❌ **manca**. Alternative: (a) report o colonna nuova in eSolver; (b) assegnazione clienti→agente fatta a mano nella webapp |
| Fido, esposizione, scaduto, blocco | — | ❌ manca (StatoAnagrafica da verificare come blocco) |
| Partite aperte / scadenzario | — | ❌ manca, da creare in eSolver |
| Articoli, unità di misura e confezioni, barcode | `ARTICOLI4APP`/`ARTICOLI4WEBAPP`, `CODBARRE4APP` | ✅ c'è (confezione dai coefficienti dell'UM di vendita) |
| Categorie | `CodFamiglia`, `CodMicrofamigliaArt` | ✅ solo codici; descrizioni famiglia da verificare |
| Immagini articoli | — | resta il bucket privato della webapp (già fatto) |
| Giacenze per magazzino | `GIACART4APP` (Giacenza, GiacDisp per CodMag) | ✅ c'è; nessun dato sui prossimi arrivi |
| Listini, prezzi cliente, sconti a cascata | modello noto (PrezzoLis, PercSconto1…5, validità), ma **report non configurato** | ⚠️ da verificare se esiste ed è abilitato in eSolver |
| **Creazione ordine** | coda interna del backend, solo tipo 701 / ORV_APP | ❌ **non raggiungibile dall'esterno**: serve un percorso di scrittura nuovo (vedi sotto) |
| Esito e numero ordine eSolver | `RichiediEsito` → RegistrazioneNumero, IdDocumento | ✅ esiste in eSolver; oggi leggibile solo dal backend logistica |
| Stato ordine in testata | `ODV4APP`: Saldato, ParzialmenteEvaso, Annullato, Bloccato | ✅ c'è |
| Stato per riga, spedito/fatturato | quantità evasa assente; nessun collegamento a DDT o fattura (`DDV_APP` da verificare) | ⚠️ parziale |
| Sincronizzazione incrementale | nessuna data di ultima modifica | ⚠️ solo sincronizzazioni complete, salvo colonna nuova |
| Preventivi, provvigioni | — | ❌ non in eSolver/backend: restano nella webapp, salvo decisione |
| Visite / CRM | — | resta nella webapp (non è un dato ERP) |

## Il nodo principale: la scrittura degli ordini

Il backend logistica non accetta ordini dall'esterno e non verrà modificato. Le strade
possibili sono tre, **tutte da decidere con Alessandro**:

| Opzione | Cosa comporta | Pro | Contro |
|---|---|---|---|
| **A.** Estendere il backend Feathers/nodejs (rotte + processor + formato "ordini agenti") | lavoro sul backend logistica | riusa coda, esiti, numerazione già collaudati | contraddice "il backend non si modifica"; accoppia le due app |
| **B.** Coda e processor nella webapp (tabella in Supabase + Edge Function che chiama `ImportaConJSON` / `RichiediEsito` direttamente) | AgenteGo parla con le API di import eSolver | indipendente dal backend logistica | serve accesso diretto alle API eSolver dal cloud (oggi il server non è raggiungibile da fuori); si riscrive la logica a coda |
| **C.** Servizio ponte dedicato (piccolo middleware sulla rete del cliente, che legge la coda AgenteGo e importa in eSolver) | un componente in più da ospitare | eSolver resta irraggiungibile da Internet | un pezzo in più da mantenere |

**In tutti e tre i casi servono, fuori dalla webapp:**
- un **formato eSolver dedicato** agli ordini agenti, creato dal tecnico eSolver (ORV_APP non si tocca);
- una **numerazione dedicata**;
- **CodiceEsterno = CodCliFor** nelle anagrafiche.

## Lettura dei dati

- **Gateway Feathers `/esolver`**, esposto via CDN (decisione e modalità ancora da definire).
- Serve un **utente tecnico** per le integrazioni, che oggi non esiste.
- Le chiamate partono da Supabase, mai dal browser: le credenziali non vanno nel client.
- Dati copiati in Postgres con **sincronizzazione completa periodica**, paginata a blocchi moderati: timeout di 10 s per chiamata, nessuna data di ultima modifica.
- **Attenzione CDN:**
  - le risposte del gateway dipendono dal JWT, quindi non vanno messe in cache condivisa;
  - un filtro scritto male viene ignorato in silenzio e restituisce tutto. Lato webapp va controllato che ogni filtro sia tra quelli di `getFilters`.

## Stima indicativa (solo lato webapp, giorni di lavoro effettivi)

Lettura dati (valida con qualsiasi opzione di scrittura):

| Blocco | Stima |
|---|---|
| Verifica dei report su eSolver reale e mappatura sulle tabelle Supabase | 1–2 gg |
| Edge Function client del gateway (login JWT, paginazione, filtri validati, errori e timeout) | 1–2 gg |
| Sincronizzazione clienti e destinazioni | 1–2 gg |
| Assegnazione clienti→agente nella webapp (se eSolver non avrà il codice agente) | 1–2 gg |
| Sincronizzazione articoli, barcode e giacenze | 1–2 gg |
| Lettura stato ordini da `ODV4APP` | 1 gg |
| Configurazione per organizzazione (URL, utente tecnico come segreto) e pagina stato sincronizzazione | 1–2 gg |
| **Subtotale lettura** | **~7–13 gg** |

Scrittura ordini:

| Opzione | Stima lato webapp |
|---|---|
| A (backend esteso da altri) | 2–3 gg (invio al backend e ritorno dell'esito) + lavoro sul backend, non stimato qui |
| B (coda + processor in Supabase) | 5–8 gg |
| C (servizio ponte) | 6–10 gg, incluso il ponte |

Opzionali:

| Blocco | Stima |
|---|---|
| Prezzi da eSolver, se il report listini viene abilitato | +2–3 gg |
| Fido e scadenzario, se vengono creati i report | +2 gg |
| Test su installazione di prova e correzioni | +2–3 gg |

**Ordine di grandezza complessivo:** circa **3–5 settimane**, a seconda dell'opzione di scrittura
e dei report che verranno creati in eSolver.

## Decisioni per Alessandro (nessuna presa)

1. **Scrittura ordini:** opzione A, B o C?
2. **Visibilità agente:** codice agente in eSolver (report o colonna nuova) o assegnazione clienti fatta nella webapp?
3. **Prezzi:** l'agente vede e imposta i prezzi (serve il report listini e il campo prezzo nel formato) o ordini a prezzo 0 calcolati da eSolver?
4. **Dati da leggere:** quali? Fido, esposizione, scaduto e scadenzario richiedono report nuovi.
5. **Preventivi, provvigioni, visite:** restano solo nella webapp?
6. **Accesso:** gateway esposto via CDN e utente tecnico; chi li predispone?
7. **Volumi:** agenti, ordini al giorno, uso offline.
8. **Più aziende:** una organizzazione AgenteGo per ogni installazione eSolver?

## Richieste da girare al tecnico eSolver (se approvate)

- formato di import ordini agenti, con il suo tracciato;
- numerazione dedicata;
- report agenti, o codice agente in `CLIENTI4APP`;
- report listini abilitato;
- report scadenzario e fido/esposizione;
- colonna di ultima modifica nei report;
- allineamento `CodiceEsterno = CodCliFor`.
