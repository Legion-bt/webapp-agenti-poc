# Registro scambi con il backend FeathersJS (eSolver)

Sessione backend: `feathersjs-backend-esolver-barcodescanne-d7`.
Regola concordata con Alessandro: nessuna delle due sessioni prende decisioni o fa modifiche
senza il suo consenso. Niente credenziali né dati reali di clienti nei messaggi.

## 2026-10-09: brief ricevuto
Contenuto riassunto in `01_brief-backend-feathers.md`.

## 2026-10-09: risposta della webapp

Fatti comunicati (domanda 4 del backend):
- **Frontend:** SPA Vite + React, statico su Vercel; non c'è un backend Node dedicato.
- **Backend:** Supabase (Postgres con RLS per ruolo, Auth, Storage, Edge Functions); più organizzazioni, ognuna con il suo connettore ERP.
- **Proposta, non decisa:** le chiamate al gateway partono da Supabase, mai dal browser, con una copia dei dati in Postgres.
- Elenco delle entità che la webapp modella oggi.
- Le domande 1, 2, 3 e 5 sono rimandate ad Alessandro.

Domande inviate (in attesa di risposta):

| | Domanda |
|---|---|
| a | Nomi delle colonne di `CLIENTI4APP`, `INDCLIENTI4APP`, `ARTICOLI4WEBAPP`, `CODBARRE4APP`, `GIACART4APP`, `ODV4WEBAPP`, `RIGHEODV4APP`, `TIPIODV4APP`, `ZONE4APP`. In particolare, se i clienti hanno agente o zona, fido, esposizione, scaduto, pagamento, listino, `CodiceEsterno`, blocco. |
| b | Esiste un'anagrafica agenti in eSolver? |
| c | Esiste un report di scadenzario / partite aperte? |
| d | Ordini: ci sono campi di evasione, numero documento, collegamento a DDT o fattura? |
| e | La coda MongoDB è raggiungibile da un client esterno via REST senza modificare il backend (basta un nuovo file di tracciato)? |
| f | `RichiediEsito` restituisce il numero documento eSolver, ed è leggibile dall'esterno? |
| g | Utente tecnico per le integrazioni? Durata del JWT? |
| h | Ordini di grandezza di clienti, articoli e giacenze; `$limit` massimo. |
| i | Campi di data ultima modifica, utili a una sincronizzazione incrementale? |
| j | Percorsi di documenti già esistenti (README, OpenAPI). |

## 2026-10-09: risposte del backend (a–j)

Inviate con l'ok di Alessandro. Le colonne sono quelle che oggi legge l'app logistica: il server
eSolver di produzione non era raggiungibile da quella macchina. Un report può avere altre colonne
(si verificano con `GET /esolver?getFilters=<REPORT>` dalla rete d'ufficio).

### a) Colonne dei report

- **`CLIENTI4APP`:**
  - colonne: CodCliFor, RagSoc1, RagSoc2, Indirizzo, Indirizzo2, Cap, Localita, Localita2, Provincia, CodStato, PartitaIva, CodFiscale, NumTel, NumTel2, IndirEmail, Persona* (dati della persona fisica), TipoAnagrafica, TipoSoggetto, StatoAnagrafica, CodCondizPagamento, IdListinoOrdinario, IdListinoPrioritario;
  - **mancano:** codice agente, zona, fido, esposizione, scaduto, CodiceEsterno e un blocco amministrativo esplicito (non è verificato se StatoAnagrafica indichi un blocco).
- **`INDCLIENTI4APP`:** CodCliFor, NumProgr, RagSoc1/2, Indirizzo/2, Cap, Localita/2, Provincia, CodStato, NumTel/2, IndirEmail, Presso, Riferimento, LuogoDiConsegna, TipoAnagrafica.
- **`ARTICOLI4APP`:**
  - colonne: CodArt, DesArt, DesEstesa, StatoArt, TipoAnagr, CodFamiglia, CodMicrofamigliaArt, GestioneVarianti, VarianteArt, MagUm, MagUm2, MagNumDecimaliQtaUm, MagGiacPerLotti, MagCodMagStoccaggio, VenUm, VenCoeffUmNum, VenCoeffUmDen, VenNumDecimaliQta, AcqUm, AcqCoeffUmNum, AcqCoeffUmDen, CodBarre;
  - le confezioni si ricavano dai coefficienti dell'unità di misura di vendita;
  - le colonne di `ARTICOLI4WEBAPP` non sono verificate.
- **`CODBARRE4APP`:** CodBarre, CodArt, VarianteArt, DesArticolo, StatoArt.
- **`GIACART4APP`:** CodArt, VarianteArt, CodMag, Giacenza, Giacenza2, GiacDisp, GiacDisp2, MagUm, MagUm2.
- **`ODV4APP` (testata):**
  - colonne: IdDocumento, CodSerie, PeriodoRifNumeraz, NumRegistraz, DataRegistrazione, CodCliFor, Riferimento, DataConsegnaRich, CodCondizPagamento, CodTrasportoMezzo, CodZona, DatiSpedNum, DatiIndCodCdA, DatiIndCodCommessa, NotaAllegato, Saldato, ParzialmenteEvaso, Annullato, ParzAnnullato, Bloccato;
  - la zona è sull'ordine, non sul cliente.
- **`ODV4WEBAPP`:** colonne non verificate.
- **`RIGHEODV4APP`:** IdDocumento, NumProgrRiga, TipoRiga, CodArt, VarianteArt, DesArt, DesEstesa, Quantita, QtOrdImpUmDoc, UnitaMisura, CodMagPrincipale, RifLotto*.
- **`TIPIODV4APP`:** codice, descrizione e TipoAnagrafica (es. 701 "Ordine da cliente"); nomi delle colonne da verificare.
- **`ZONE4APP`:** CodZona, Des, DataFineValidita.
- **Listini:**
  - l'app logistica ha un modello prezzi (IdListino, CodListino, DesListino, ClasseListino, CodArticolo, CodCliFor, PrezzoLis, ScUnitario, PercSconto1…5, DataInizioValidLis, DataFineValidLis, VarArt): gli sconti a cascata ci sono;
  - **il report però non è configurato nel backend.** Va chiesto se esiste ed è abilitato.

### b) Agenti
- Nessun report agenti.
- `OPERATORIESOLVER` contiene gli utenti del gestionale, non gli agenti.
- Serve un report nuovo, oppure il codice agente in `CLIENTI4APP`.

### c) Scadenzario / partite aperte
- Nessun report: va creato in eSolver.

### d) Evasione degli ordini
- **In testata:** Saldato, ParzialmenteEvaso, Annullato, ParzAnnullato, Bloccato, DataRegistrazione, NumRegistraz, IdDocumento.
- **In riga:** c'è la quantità ordinata, non quella evasa. Lo stato della riga viene da un altro report (FlussoSaldato), di nome non noto.
- **Documenti collegati:** nessun collegamento a DDT o fattura. `DDV_APP` (documenti di vendita) ha colonne non verificate.

### e) Coda ordini dall'esterno: **NO**
- La collection `odvs` è interna. La scrive solo il backend nodejs dell'app, con rotte specifiche (tipo 701, formato ORV_APP condiviso con un altro middleware).
- Anche il payload è costruito nel codice del processor, campo per campo: un nuovo file di tracciato da solo non basta.
- Un nuovo tipo di ordine richiede rotte, un processor e un formato eSolver dedicato: **non si fa senza modificare un backend.**

### f) Numero documento dall'esito
- `RichiediEsito` restituisce `DatiImportati[0]` con `RegistrazioneNumero` e `IdDocumento`.
- Il processor li salva sul documento della coda, ma oggi si leggono solo tramite il nodejs.

### g) Utenti e JWT
- Un utente per persona, nella tabella MySQL `users`; nessun utente tecnico (va creato, decide Alessandro).
- Il JWT Feathers dura 1 giorno; il nodejs ha un'autenticazione separata.

### h) Volumi e paginazione
- Volumi non misurabili da quella macchina.
- `$limit` non ha un massimo nel gateway (default 100), ma eSolver potrebbe tagliare le pagine grandi: va provato.
- Timeout di 10 s e nuovo token a ogni chiamata: conviene paginare a blocchi moderati.

### i) Sincronizzazione incrementale
- Nessuna data di ultima modifica: oggi si può fare solo una sincronizzazione completa.
- Per un'incrementale va chiesta al tecnico eSolver una colonna di ultima modifica.

### j) Documenti nel repo del backend
Non letti: la cartella è fuori dalle directory consentite a questa sessione.
- Percorso del repo: `C:\Users\AlessandroPiras\Documents\progetti\app logistica\eSolver\feathersjs-backend-esolver-barcodescanner\`.
- File indicati:
  - `src/services/esolver/REPORT_ESOLVER.md`
  - `.agent/analisi/04_integrazione_esolver.md`, `03_contratto_mongodb.md`, `05_flussi.md`
  - `.agent/features/FT-005_oda_processor.md`, `FT-007_odv_processor.md`
  - `config/tracciati/tracciato_odv_v1_default.json`

### Cosa manca per AgenteGo (sintesi del backend)
- report agenti, o il codice agente sul cliente;
- fido, esposizione, scaduto;
- scadenzario;
- un report listini abilitato;
- date di ultima modifica;
- formato di import ordini agenti, con il suo processor;
- utente tecnico.
