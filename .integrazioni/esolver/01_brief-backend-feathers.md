# eSolver: brief dal backend FeathersJS (app logistica)

Fonte: sessione `feathersjs-backend-esolver-barcodescanne-d7`, messaggio del 2026-10-09.
Stato: informazioni ricevute, **nessuna decisione presa**. Le decisioni spettano ad Alessandro.

Premessa della sessione backend: il backend **non verrà modificato**, le integrazioni vanno
previste lato webapp. L'esposizione del backend (via CDN) la valuteranno più avanti
Alessandro e quella sessione.

## 1. Lettura dati

- **Gateway:** un unico gateway Feathers, `/esolver`.
- **Autenticazione:** login con JWT.
  - `POST /authentication` con `{ strategy: 'local', email, password }`.
  - Gli utenti stanno nella tabella MySQL `users`.
- **Report:** i dati si leggono dai report eSolver.
  - Esempio: `GET /esolver?report=CLIENTI4APP&$skip=0&$limit=100&CodCliFor[$eq]=123`.
  - Risposta: `{ data, total, skip, limit }`.
- **Filtri:**
  - Operatori: `$eq`, `$ne`, `$between`, `$gt`, `$gte`, `$lt`, `$lte`, `$like`, `$contains`, `$in`.
  - ⚠️ Un filtro non previsto dal report, o scritto senza `[$op]`, viene **ignorato in silenzio**: la risposta contiene tutte le righe.
  - `GET /esolver?getFilters=<REPORT>` restituisce i filtri ammessi.
- **Report disponibili** (tra gli altri):

| Area | Report |
|---|---|
| Clienti e indirizzi | `CLIENTI4APP`, `INDCLIENTI4APP` |
| Articoli | `ARTICOLI4APP`, `ARTICOLI4WEBAPP`, `CODBARRE4APP` |
| Giacenze | `GIACART4APP`, `GIACLOTART4APP` |
| Ordini di vendita | `ODV4APP`, `ODV4WEBAPP`, `RIGHEODV4APP`, `TIPIODV4APP` |
| Zone | `ZONE4APP` |

- **Non esistono:**
  - report per **listini e prezzi**;
  - un filtro di **visibilità per agente** (oggi ogni utente vede tutti i clienti).
- **Prestazioni:** ogni chiamata ottiene un nuovo token eSolver e ha un timeout di 10 s. Per i dati che cambiano poco serve una cache lato webapp.

## 2. Scrittura (es. ordini)

- **Nessuna scrittura diretta:** si passa da una coda MongoDB con stato numerico.

| Stato | Significato |
|---|---|
| 0 | da inviare |
| 1 | in attesa di eSolver |
| 2 | importato |
| 3 | errore, motivo in `msgError` |

- **Processor Feathers**, ogni 30 s:
  1. prende il documento in modo esclusivo;
  2. costruisce il JSON secondo un **tracciato**, cioè un file di configurazione per cliente e tipo documento (Tipologia, Modello, campi di testata e di riga);
  3. importa con `ImportaConJSON`;
  4. salva subito il codice del lavoro eSolver, così lo stesso ordine non viene mai inviato due volte;
  5. recupera l'esito con `RichiediEsito`.
- **Correzioni:** un ordine in errore si corregge e si ripresenta (stato da 3 a 1). Con stato 1 o 2 non si modifica (risposta 409).
- È lo stesso schema usato per gli ordini di acquisto e di vendita dell'app logistica.

## 3. Vincoli

- **Formato di import:**
  - Il formato ordini cliente `ORV_APP` (Modello 25) è condiviso con un altro middleware e **non si può modificare**.
  - Per gli ordini agenti serve un **formato eSolver dedicato**, con il suo tracciato, da far creare al tecnico eSolver.
- **Codice cliente:** nel campo 78 eSolver vuole il codice cliente esterno. Funziona solo se in anagrafica `CodiceEsterno = CodCliFor`, altrimenti l'ordine viene rifiutato.
- **Numerazione:** serve uno spazio di numeri di registrazione distinto.
  - L'app logistica usa `5.000.000 + (anno % 100) × 10.000 + progressivo`.
  - Anche il middleware esistente ha il suo spazio.
- **Prezzi e IVA:**
  - Oggi gli ordini dell'app arrivano con prezzo 0 e li calcola eSolver.
  - Se l'agente deve vedere o imporre prezzi, servono un report listini e il campo prezzo nel formato.
- **Un'installazione per cliente:** ogni backend serve una sola istanza eSolver. Se la webapp deve servire più aziende, va previsto.

## 4. Domande del backend alla webapp (risposte in attesa di Alessandro)

1. Quali dati deve leggere la webapp: clienti dell'agente, articoli, giacenze, listini, storico ordini, scadenze?
2. Cosa deve scrivere: solo ordini cliente o anche altro (offerte, nuovi clienti…)? Con quali campi (prezzi, sconti, destinazione, pagamento, consegna)?
3. Come si identifica l'agente e cosa può vedere (codice agente eSolver, zone, clienti assegnati)?
4. Stack e hosting: risposto con i fatti, vedi `03_scambi.md`.
5. Volumi (agenti, ordini al giorno), operazioni offline, sincronizzazioni.
