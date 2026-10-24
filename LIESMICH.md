# Der Apfelritter – Aufbau des Projekts

Das Spiel ist ein einziges Artefakt (gleicher Link, gleiche Spielstände), besteht aber aus mehreren Dateien:

- `index.html` – Seite, Aussehen (CSS), Menü und die Tafeln (im Fenster „Tafeln und Hilfe“); lädt am Ende die Teile aus `js/`.
  Das Spiel füllt das ganze Fenster; die Bildgröße richtet sich beim Laden nach dem Seitenverhältnis (höchstens 960 × 540).
- `js/01-…js` bis `js/25-…js` – der Spielcode, nach Themen geteilt. Die Teile werden **in der Reihenfolge der Nummern**
  geladen und teilen sich alle Namen der obersten Ebene (wie früher in der einen Datei).

## Regeln beim Ändern

1. Was ein Teil **schon beim Laden** aufruft, muss in demselben oder einem **früheren** Teil stehen.
   Innerhalb von Funktionen, die erst später laufen (Klick, Spielschleife), darf alles aus allen Teilen benutzt werden.
2. Vor jedem Veröffentlichen den Fingerabdruck setzen: `node werkzeug/stempel.mjs`
3. Veröffentlicht werden `index.html` und alle Dateien in `js/` (gleicher Pfad wie hier).

## Werkzeuge

- `node werkzeug/stempel.mjs` – Fingerabdruck für den Ladezwischenspeicher aus allen Teilen berechnen.
- `node werkzeug/ladefolge.cjs` – prüft Regel 1 (nichts aus späteren Teilen schon beim Laden). Braucht `typescript`.
- `node werkzeug/einzeldatei.mjs` – baut wieder eine einzelne HTML-Datei (zum Weitergeben).

## Tests

Die Tests steuern das Spiel in einem echten Browser (Playwright mit Chromium). Mehrspieler-Tests öffnen mehrere Ritter
in getrennten Browserfenstern, die über einen nachgebauten Raum verbunden sind (`tests/mehrspieler/harness.mjs`).

- `bash tests/alle.sh` – alle Tests nacheinander (etwa 45 Minuten), zeigt je Test die Ergebniszeilen.
- `tests/einzel/` – Einzelspieler: Welt, Kampf, Gewölbe, Jagd, Feste, Tastatur, Jahreszeiten, Tjost.
- `tests/mehrspieler/` – Gruppen, Handel, Orden, Turnier, Ereignisse, Post und Markt, Hauptgeschichte, zwei Ritter in Kirchen.
- `tests/funktionen/` – Waffenarten, Kleine Bibel, Handy-Ansicht, Vollbild auf fünf Geräten, Tafeln mit der Tastatur, Kirchen (Räume, Dienste, Messe, Handy), Bergland (Annaberg, Gegner, Anführer), Stufen bis 30 und Meisterschaften, Gegenstände bis Stufe 32, Ostlande (Städte, Fuhrmann, Aufträge, Thesen, Gegner und Anführer), Kriegszüge nach Pavia und Wien.
- `tests/werkzeuge/` – `ladezeit.mjs <Seite> [Drosselung]` misst die Ladezeit, `fehler.mjs` zeigt Fehler beim Laden, `karte.mjs` speichert die Weltkarte, `orte.mjs name:x,y …` Bilder an Weltorten, `gegnerbilder.mjs art …` einen Bildbogen der Gegner, `bauten.mjs art …` einen Bogen der Bauten und Dinge.

Bildschirmfotos der Tests landen in `tests/ausgabe/` (nicht im Repository).

## Teile

| Datei | Inhalt |
|---|---|
| `js/01-grundlagen.js` | Grundlagen: Hilfen, Zeichenwerkzeuge, verzögertes Laden der Tafelbilder |
| `js/02-ritter-pferde.js` | Der Ritter (Herkunft, Harnisch, Schwert, Aussehen) und die Pferde |
| `js/03-gegner-bilder.js` | Bilder der Gegner: Monster, Anführer, Raubritter, Tod, Lindwurm, Stromland, Bergland |
| `js/04-gegenstaende-jahreszeiten.js` | Gegenstände und Symbole, Weltgrafiken, Jahreszeiten |
| `js/05-baeume-haeuser-kirchen.js` | Bäume, Häuser, Kirchen und Klöster, Stromland-Bauten, Göpel, Kanone, Felsklippe |
| `js/06-burg-mauern.js` | Weltgrafiken Teil 2: Burg, Stadtmauer, Ruine, Kleinteile |
| `js/07-welt.js` | Die Welt (6144 × 4608): Gebiete, Gewässer, Wege, Höhen, Kollision, Platzierung, Bergland |
| `js/08-boden-karten-ton.js` | Boden, Karten, Ton und Musik |
| `js/09-regeln-beute-waffen.js` | Regeln, Beute, Kleine Bibel, Waffenarten, Pixelschrift, Symbole |
| `js/10-leute-tiere.js` | Leute in Burg und Stadt, Tiere, Leute unterwegs |
| `js/11-held-auftraege-gasthaeuser.js` | Aufträge, der Held, Erscheinungsorte, Gasthäuser |
| `js/12-leben-tag-nacht.js` | Leben im Reichsland, Tag und Nacht, Wetter |
| `js/13-spiel-kampf.js` | Spielzustand, Eingabe, Monster, Kampf, Jagd, Erfahrung, Aktualisierung |
| `js/14-turnier-gewoelbe-feste.js` | Tjost, Gewölbe, Feste im Jahreslauf |
| `js/15-zeichnen.js` | Zeichnen des Spielbilds |
| `js/16-oberflaeche.js` | Pferd, Schmied, Wegweiser, Oberfläche |
| `js/17-speichern-mehrspieler.js` | Speichern, Ruhmeshalle, andere Ritter, Mehrspieler |
| `js/18-ereignisse-orden-turnier.js` | Weltereignisse, Ritterorden, Großes Turnier, Start |
| `js/19-hauptgeschichte.js` | Hauptgeschichte 1520–1529 |
| `js/20-post-markt-speyer.js` | Botenpost, Marktplatz, Länderwettstreit, Ordenshaus, Speyer und Fluss |
| `js/21-spaetes-spiel-zollburg.js` | Spätes Spiel (Ehre, Prüfungen, Wappen), die versunkene Zollburg |
| `js/22-kirchen.js` | Kirchen, Priester und Glaube: Innenräume, Segen, Beichte, Kerzen, Ablass, Wallfahrt, Messe |
| `js/23-bergland.js` | Das Bergland: Annaberg, Bergmeister und seine Aufträge, Meisterschaften, Tafel |
| `js/24-ostlande.js` | Die Ostlande: Leute in Wittenberg, Nürnberg und Augsburg, Aufträge, Fuhrmann, Thesen, Kriegszüge nach Pavia und Wien, Tafel |
| `js/25-waffen-bibel-start.js` | Waffenarten im Kampf, Zeugmeister, Kleine Bibel, Spielstart |
