# Regole di Seme e Fiori

## Obiettivo

Supera otto ante consecutive, ciascuna composta da piccolo buio, grande buio e boss. Gli obiettivi sono:

| Anta | Piccolo buio | Grande buio |  Boss |
| ---: | -----------: | ----------: | ----: |
|    1 |          300 |         450 |   600 |
|    2 |          600 |         900 |  1200 |
|    3 |         1000 |        1500 |  2000 |
|    4 |         1500 |        2250 |  3000 |
|    5 |         2500 |        3750 |  5000 |
|    6 |         4000 |        6000 |  8000 |
|    7 |         6000 |        9000 | 12000 |
|    8 |        10000 |       15000 | 25000 |

Prima di ogni buio puoi consultare l'obiettivo corrente e quelli successivi dell'anta. I bui non si possono saltare: dopo aver superato un obiettivo, premi **Gioca** per affrontare il successivo. Se le quattro mani finiscono prima dell'obiettivo, la partita è persa. Superato il boss, il negozio permette di prepararsi all'anta seguente; superato il boss dell'ultima anta, vinci.

## Mazzo e azioni

- Il mazzo francese contiene 52 carte: quattro semi e tredici valori per seme.
- All'inizio ricevi otto carte.
- La mano è sempre ordinata da sinistra a destra, dal valore più alto al più basso. Anche dopo aver pescato o sostituito carte, l'ordine viene aggiornato.
- Seleziona da una a cinque carte per giocarle o scartarle. Le carte giocate e scartate sono rimpiazzate dal mazzo; quando il mazzo di pesca finisce, gli scarti vengono rimescolati.
- La combinazione e il punteggio provvisorio sono mostrati mentre selezioni le carte.
- Hai quattro mani e tre scarti per buio. Gli scarti non consumano una mano.
- Il punteggio delle mani si somma all'interno del buio e si azzera quando ne inizi uno nuovo; denaro e jolly restano tra i bui.
- L'ordine dal valore più alto a sinistra al più basso a destra resta corretto anche dopo una modifica casuale del boss, il riordino o il caricamento del salvataggio.

## Boss e malus

Ogni boss si affronta nel terzo buio dell'ante indicata. Il malus è visibile nella panoramica prima di iniziare e resta attivo per l'intero boss.

| Ante | Boss                    | Malus                                                                                                                                                    |
| ---: | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Michael Jackson         | Ogni Jack, Regina, Re o Asso giocato ha il 50% di probabilità di non assegnare i propri punti carta né attivare effetti dei Jolly legati a quella carta. |
|    2 | Il Leone                | Coppia, Doppia coppia e Tris assegnano metà del punteggio finale, arrotondato per difetto.                                                               |
|    3 | Lo Stallone Kirkificato | Nessuno scarto. Ogni carta rimasta in mano dopo aver scelto quelle da giocare costa $1; il costo è annunciato e non porta il denaro sotto zero.          |
|    4 | Big bro                 | Il primo Jolly della collezione, mostrato a sinistra, è disattivato per tutto il boss.                                                                   |
|    5 | Hamburgerona            | I bonus additivi al moltiplicatore sono disattivati; in questo gioco si applica al Fiore regale.                                                         |
|    6 | Il Macigno Pannoso      | Si ricevono sei carte anziché otto. Questa versione non prevede carte consumabili, quindi non esiste un costo in mani per usarle.                        |
|    7 | DOMANDINAAA             | Dopo ogni mano o scarto, una carta in mano cambia casualmente valore o seme fino al termine del boss. Le carte restano ordinate per valore effettivo.    |
|    8 | L'Aura Suprema          | Il boss richiede 2,5 volte l'obiettivo base di 10000 punti. All'inizio dello scoring di ogni mano, un Jolly casuale è disattivato per quella sola mano.  |

Il nome del boss dell'Ante 6 è stato reso neutro. In questa versione non sono presenti Jolly con rarità: per Big bro è disattivato il primo Jolly, cioè quello più a sinistra.

## Combinazioni e punteggio

`(fiches base della combinazione + valore delle sole carte che la compongono) × moltiplicatore`

Le carte numeriche valgono il proprio numero; Jack, Regina e Re valgono 10; l'Asso vale 11. In una scala l'Asso può essere basso (A-2-3-4-5) oppure alto (10-J-Q-K-A).

| Combinazione                              | Fiches base | Moltiplicatore |
| ----------------------------------------- | ----------: | -------------: |
| Carta alta                                |           5 |             ×1 |
| Coppia                                    |          10 |             ×2 |
| Doppia coppia                             |          20 |             ×2 |
| Tris                                      |          30 |             ×3 |
| Scala                                     |          30 |             ×4 |
| Colore (cinque carte dello stesso seme)   |          35 |             ×4 |
| Full                                      |          40 |             ×4 |
| Poker (quattro carte dello stesso valore) |          60 |             ×7 |
| Scala colore                              |         100 |             ×8 |

Quando una selezione contiene carte che non fanno parte della combinazione, non danno fiches: per esempio, con una coppia contano soltanto le due carte della coppia. Con carta alta conta solo la carta di valore più alto.

## Jolly

I jolly personalizzati modificano la mano prima del calcolo del punteggio:

- **Moneta fortunata** (`$4`): +15 fiches a ogni mano.
- **Fiore regale** (`$5`): +4 al moltiplicatore se una carta che segna punti è un Jack, una Regina o un Re.
- **Corona del mazzo** (`$5`): +25 fiches con coppia, doppia coppia, tris, full o poker.
- **Giglio fortunato** (`$6`): raddoppia il moltiplicatore con scala, colore o scala colore.
- **Corona dell'asso** (`$5`): +20 fiches se un Asso fa parte della combinazione.

Puoi possedere al massimo cinque jolly. Tra un'anta e la successiva il negozio offre fino a tre jolly non ancora posseduti; ogni offerta può essere acquistata una volta.

## Denaro

Ogni mano giocata assegna `$2`. Quando superi un buio guadagni altri `$3` più `$1` per ogni mano rimasta. Gli scarti non assegnano denaro.

## Tastiera

| Tasto  | Azione                                                             |
| ------ | ------------------------------------------------------------------ |
| Frecce | Spostarsi tra le carte                                             |
| Spazio | Selezionare o deselezionare la carta focalizzata                   |
| D      | Giocare le carte selezionate                                       |
| X      | Scartare le carte selezionate                                      |
| O      | Riordinare la mano da sinistra a destra, dal più alto al più basso |
| `?`    | Aprire l'aiuto                                                     |
| Esc    | Chiudere l'aiuto                                                   |

Il seme è rappresentato da nome, simbolo e colore; nessuna informazione si basa solo sul colore.
