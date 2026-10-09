# Estensioni: Telegram e OCR

Stato: **analisi, nessuna decisione presa** (2026-10-09). Alessandro ha dato l'ok di massima
a Telegram; per l'OCR l'idea è registrare, per ogni formato di documento, un criterio di
estrazione approvato da usare sugli ordini.

## 1. Telegram

### Notifiche e azioni (bot)

| Uso | Esempio | Per chi |
|---|---|---|
| Approvazione ordini bloccati | "Ordine … bloccato: fido superato. [Sblocca] [Rifiuta]" | Manager |
| Esito invio al gestionale | importato in eSolver con numero …, oppure errore con motivo | Agente |
| Avanzamento ordine | evaso, spedito, fatturato | Agente |
| Promemoria | visite e richiami in agenda, clienti con scadenze aperte prima di una visita | Agente |
| Riepilogo del mattino | visite del giorno, insoluti, promozioni attive | Agente |
| Domande rapide | "Giacenza RRIS075?", "Situazione cliente …?" | Agente |
| Ordine via messaggio o foto | bozza d'ordine da confermare nell'app (si combina con l'OCR) | Agente |

### Canale dell'agente (comunicazione verso i clienti)

- In Telegram è un **canale**: chi segue riceve, non può scrivere.
- **Pubblicazione:**
  - l'agente scrive nell'app un post (novità, promozione, opportunità);
  - può allegare un articolo del catalogo con la sua foto;
  - il bot, amministratore del canale, lo pubblica.
- **Iscrizione dei clienti** con un link o un QR code, mostrato anche durante la visita.
- **Contenuti:** il canale è di fatto pubblico, quindi solo promozioni generali, mai prezzi riservati a un cliente.
- **Privacy:** sono comunicazioni commerciali; prevedere consenso o almeno un'informativa.

### Come si realizzerebbe

- Bot Telegram con webhook su una Edge Function Supabase; il token del bot è un segreto lato server.
- **Collegamento dell'account:** dal profilo nell'app, con un codice usa e getta; si salva il `chat_id`.
- **Permessi:** il bot rispetta quelli dell'app (un agente riceve solo dati dei suoi clienti).
- **Alternativa da considerare:** WhatsApp Business, più diffuso tra agenti e clienti in Italia, ma a pagamento e con più vincoli.

### Decisioni aperte

1. Canale per agente, per azienda o entrambi?
2. I post del canale devono essere approvati dal manager?
3. Quali notifiche attivare per prime?

## 2. OCR con modelli di documento approvati

I documenti in arrivo (ordini, bolle) hanno formati diversi a seconda del mittente. Per ogni
formato si registra un **modello di estrazione**, lo si prova e lo si approva; poi viene
applicato in automatico ai documenti di quel formato.

### Flusso

1. **Riconoscimento del formato.**
   - Ogni modello ha un'impronta: P.IVA del mittente, parole fisse (intestazione, ragione sociale) o disposizione della pagina.
   - All'arrivo di un documento si sceglie il modello che corrisponde.
2. **Regole di estrazione per campo.**
   - **Campi singoli** (numero, data, cliente, destinazione): un'etichetta di riferimento ("N. DDT") e il valore accanto o sotto, con un controllo del formato (espressione regolare).
   - **Righe** (codice, descrizione, quantità): la tabella si individua dalle intestazioni delle colonne.
   - **Abbinamento dei codici:** una tabella di corrispondenza tra il codice usato dal mittente e il codice del nostro catalogo, una per cliente.
   - Le regole sono **ancorate alle etichette, non a coordinate fisse**: con foto e scansioni la pagina è spostata o inclinata.
3. **Prova e approvazione.**
   - Il modello si prova su 3–5 documenti di esempio, confrontando il risultato con il dato atteso.
   - Un manager lo approva.
   - I modelli hanno versioni: una modifica non rompe quelli in uso.
4. **Uso.**
   - Estrazione, poi bozza d'ordine, poi conferma dell'agente (sempre obbligatoria).
   - Nessun modello corrispondente: inserimento manuale, oppure creazione di un nuovo modello.

### Strumenti: basta Tesseract?

| Documento | Strumento | Affidabilità |
|---|---|---|
| PDF nati digitali (da gestionale) | nessun OCR: testo e posizioni letti direttamente dal PDF | altissima, gratuito |
| Scansioni pulite | Tesseract (con le posizioni delle parole), dopo raddrizzamento e pulizia dell'immagine | buona |
| Foto da telefono, scrittura a mano, tabelle storte | Tesseract fatica | bassa: serve un modello AI con riconoscimento immagini |

**Proposta, approccio misto:**
- testo dal PDF quando c'è, Tesseract per le scansioni, regole deterministiche approvate;
- l'AI resta opzionale, per due usi:
  - proporre le regole partendo da un documento di esempio (una persona le corregge e le approva);
  - ripiego sui documenti difficili.
- Così i documenti normali non escono dai nostri server e il risultato è ripetibile.

**Vincolo tecnico:** Tesseract non gira bene nelle Edge Functions Supabase (Deno, tempi limitati). Due possibilità:
- sul dispositivo, con tesseract.js: più lento, ma la foto non esce dal telefono;
- su un piccolo server dedicato.

### Decisioni aperte

1. I documenti in arrivo sono soprattutto PDF digitali o foto e scansioni? (servono esempi anonimizzati)
2. È accettabile un servizio AI esterno per creare i modelli e per i documenti difficili, o solo strumenti locali?
3. Chi crea e approva i modelli: il manager dell'azienda o la sede?

## 3. Stime indicative

| Blocco | Stima |
|---|---|
| Notifiche Telegram e approvazione degli ordini bloccati | 2–3 gg |
| Canale Telegram dell'agente (pubblicazione dall'app, approvazione opzionale) | 3–4 gg |
| Modelli di documento per PDF digitali (editor, prova, approvazione, uso negli ordini) | 6–10 gg |
| Aggiunta delle scansioni con Tesseract | +3–5 gg |
| Aiuto AI per creare i modelli e ripiego sui documenti difficili | +3–4 gg |

Le stime valgono sul prototipo attuale; sui dati reali dipendono anche dall'integrazione eSolver
(`../esolver/02_analisi-e-stima.md`).
