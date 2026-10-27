# Seme e Fiori

Un roguelike di carte originale, ispirato alle combinazioni del poker e progettato per essere giocato anche senza mouse. Il tema del gioco è un giardino di carte fiorito; cuori, quadri, fiori e picche restano distinti per nome, simbolo e colore. Realizzato in Angular standalone e installabile come Progressive Web App.

## Avvio

Requisiti: Node.js 24.15.0 o successivo e npm 12.1.0.

```sh
npm install
npm start
```

Apri l'indirizzo mostrato da Angular CLI. Per creare il bundle di produzione:

```sh
npm run build
```

L'output statico è in `dist/balatro-accessibile/browser`. Per distribuire la PWA, pubblica questo contenuto su un host HTTPS, ad esempio Vercel. Il service worker è attivo nelle build di produzione; dopo il primo caricamento l'app shell è disponibile offline. Le nuove versioni vengono rilevate dal service worker di Angular.

Per eseguire i test unitari:

```sh
npm test
```

## Contesto tecnico

- Angular 22.2.3, Angular CLI 22.2.4, TypeScript 6.0.3, Node.js 24.15.0 e npm 12.1.0.
- Componenti standalone Angular e TypeScript strict.
- Nessun meta-framework e nessuna libreria di UI o di gioco.
- Angular Service Worker (`@angular/service-worker`): cache della PWA e accesso offline dopo il primo caricamento.
- Vitest: runner dei test già integrato con Angular CLI.
- Dati e partita salvati in `localStorage`; il salvataggio si ripristina quando si riapre l'app.
- Progetto PWA statico: la build può essere pubblicata senza un server applicativo.

Blocco di contesto usato:

```text
Stack: Angular 22.2.3, TypeScript 6.0.3, Angular CLI 22.2.4.
Piattaforma: PWA statica; pubblicazione prevista su Vercel.
Regole: docs/regole.md; logica pura in src/app/game.ts.
Stato partita e salvataggio: src/app/game-state.service.ts.
Accessibilità: tastiera, focus visibile, ARIA, messaggi live, mobile e offline.
Dipendenze aggiunte: Angular Service Worker per la PWA; Vitest per i test.
Nessun meta-framework o libreria di interfaccia.
```

La consegna di partenza suggeriva React e Vite; questo progetto usa Angular su richiesta esplicita dell'utente. Le funzionalità e i vincoli di accessibilità della consegna restano il riferimento.

## Regole

La versione completa delle regole, inclusi i valori delle mani, il punteggio, i jolly e il negozio, è in [`docs/regole.md`](./docs/regole.md).

## Accessibilità

- Tutte le azioni sono utilizzabili da tastiera; le scorciatoie sono visibili nel dialogo Aiuto (`?`).
- Le carte usano un listbox multiselezione: frecce per spostarsi, spazio per selezionare; la selezione è limitata a cinque.
- La mano viene riordinata dopo ogni distribuzione, giocata o scarto; le carte sono disposte da sinistra a destra, dalla più alta alla più bassa.
- L'ordine della mano resta corretto anche con le mutazioni del boss DOMANDINAAA.
- Otto ante con tre bui ciascuna e otto boss, ognuno con il proprio malus mostrato prima di iniziare.
- La combinazione e il suo punteggio provvisorio vengono mostrati e annunciati mentre si selezionano le carte.
- I contatori delle mani e degli scarti disponibili sono riportati accanto alle rispettive azioni.
- Prima di ogni buio è disponibile una panoramica degli obiettivi dell'anta; piccolo, grande e boss si giocano obbligatoriamente in sequenza.
- Il pulsante “Nuova partita” è sempre disponibile in alto a destra.
- Il focus viene mantenuto sulle carte rimpiazzate, spostato al titolo dopo un cambio di fase e ripristinato dopo la chiusura del dialogo.
- I nomi accessibili annunciano valore e seme; i quattro semi hanno anche simboli e colori distinti.
- Annunci live dopo una mano; focus visibile, comandi e aree toccabili di almeno 44 px, layout adattivo da 320 px e rispetto di `prefers-reduced-motion`.
- Riferimenti: [WAI-ARIA Authoring Practices — Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
- Prima della consegna, verificare la build pubblicata con Lighthouse e axe DevTools, oltre alla prova da tastiera su una partita completa.

## Diario di sviluppo con AI

- Il primo comando di scaffolding è stato eseguito nella cartella superiore anziché nella cartella Git clonata. Il controllo dell'output e dello stato Git ha mostrato la posizione errata; il progetto è stato spostato nella cartella clonata prima di aggiungere codice.
- La guida iniziale richiede React/Vite, ma è stata data esplicita indicazione di usare Angular; il progetto e il README documentano questa scelta.
- Durante la verifica del flusso di scarto è stata corretta una condizione che non confrontava il contatore precedente; i test ora controllano che il numero di scarti diminuisca davvero e che il mazzo resti di 52 carte uniche.

## Pubblicazione

Collega il repository a Vercel e configura:

- Build command: `npm run build`
- Output directory: `dist/balatro-accessibile/browser`

Le API PWA richiedono HTTPS; il deploy di produzione rende attivo il service worker.
