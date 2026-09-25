# VDE Prüf App – Aufbau & Änderungen (Entwickler)

Grundprinzip: **Masterbibliothek → Bauplan → gemeinsame Engine.** Jedes Feld existiert genau einmal in
`js/felder-daten.js` (Masterbibliothek, sichtbar in `masterbibliothek.html` mit ID, Legende und Hilfen).
Die Protokollseiten listen nur Feld-IDs (Bauplan) und werden von `js/protokoll-seite.js` aufgebaut.
Änderungen deshalb immer zuerst in der Masterbibliothek, protokollspezifisch nur über `anpassen` im Bauplan.

Speichern, Offline-Betrieb und Updates (Service Worker) funktionieren nur über https oder localhost,
nicht beim Öffnen per Doppelklick (file://).

## Ordner

```
index.html                 Hauptseite (Stammdaten, Protokoll starten, Archiv, Sicherung, Update)
anlagenpruefung.html       Prüfprotokoll elektrischer Anlagen (HTML-Rahmen, Inhalt aus dem Bauplan)
anschlusspruefung.html     Prüfprotokoll Anschlussprüfung – EIN Übergabepunkt je Protokoll
geraetepruefung.html       Prüfprotokoll elektrischer Geräte – EIN Gerät je Protokoll
archiv.html                Archiv aller PDFs (Logik in js/archiv.js)
masterbibliothek.html      alle Felder mit ID, Legende und Hilfen
manifest.json              Web-App-Manifest (Name, Farben, App-Icons) → „Zum Startbildschirm“
sw.js                      Service Worker (Offline), liest Version aus js/app-config.js
css/style.css              Design-System für alle Seiten (Farben, Buttons, Schalter, Karten)
css/felder.css             Feld-Styles für alle Seiten (Eingaben, Schnellwahl, Badges, Icons)
css/startseite.css         nur Hauptseiten-Layout
css/protokoll.css          Layout aller Protokollseiten (Abschnitte, Karussell, Statusleiste)
css/erklaerungen.css       Aussehen der Hilfen (auch für die Formulare)
css/masterbibliothek.css   nur diese Seite
css/archiv.css             Archiv + PDF-Ansicht
js/felder-daten.js         FELDER: Optionen, Grenzwerte (GRENZWERTE), Icons, Hilfe-Verknüpfung
js/erklaerungen-daten.js   TEXTE der Hilfen
js/erklaerungen.js         Darstellung der Hilfen (wiederverwendbar)
js/icons.js                Icons je Messung
js/feld-renderer.js        renderFeld(id, ziel, {modus}) – gemeinsam für ALLE Seiten
js/app-config.js           Versionen, Protokolltypen, Nummernformat, Speicher-Schlüssel
js/speicher.js             EINE Speicherschicht (IndexedDB), Import/Export, pdfSpeichern()
js/startseite.js           Logik der Hauptseite
js/masterbibliothek.js     Berechnungen, Grenzwertprüfung der Masterbibliothek
js/feld-logik.js           Regeln der Protokolle (I_K, I_K2, RCD, U_L, R_ISO, Drehstrom, Prüftermin)
js/protokoll-seite.js      Engine aller Protokollseiten (Aufbau, Karten, Autosave, Pflicht, Ampel)
js/protokoll-anlage.js     BAUPLAN Anlagenprüfung: Abschnitte + Feld-IDs
js/protokoll-anschluss.js  BAUPLAN Anschlussprüfung (B1–B11)
js/protokoll-geraete.js    BAUPLAN Geräteprüfung (C1–C7)
js/pdf-layout.js           PDF-Engine für ALLE Protokolle (Kopf, Kästen, Zellen, Tabellen, Seitenzahlen)
js/pdf-protokoll.js        PDF-Bausteine für alle Protokolle (Werte, Zellen, Kästen, Abschluss, Fotos, Speichern, einseitig())
js/pdf-anlage.js           PDF-PLAN Anlagenprüfung: welches Feld wo, Spalten, Seite-1-Regel
js/pdf-anschluss.js        PDF-PLAN Anschlussprüfung (zwingend 1 Seite + Fotos)
js/pdf-geraete.js          PDF-PLAN Geräteprüfung (zwingend 1 Seite + Fotos, Messtabelle R_PE/R_ISO/Ableitstrom)
js/pdf-schrift.js          eingebettete Schrift Liberation Sans (Ω, Δ, ≤, ², Umlaute) – nicht von Hand ändern
js/lib/jspdf.umd.min.js    jsPDF 4.2.1 (MIT), wird erst beim Erstellen geladen
js/archiv.js               Archivseite: Filter, Ansehen, Teilen + Versand-Vermerk, ZIP, Erneute Prüfung, Löschen
js/pdf-ansicht.js          PDF direkt in der App anzeigen (alle Geräte), PdfAnsicht.oeffnen(blob, {titel})
js/zip.js                  ZIP ohne Fremdbibliothek: Zip.erstellen([{name, blob}])
js/lib/pdf.min.js (+worker) pdf.js 3.11.174 legacy (Apache-2.0), wird erst beim ersten „Ansehen" geladen
icons/messungen/           Fotos Drehschalter Fluke 1663
icons/rcd-typen/           RCD-Typ-Symbole AC / A / F / B / B+
icons/app/                 App-Icons (192/512, maskable, Apple, Favicon)
js/lib/LiberationSans-OFL.txt  Lizenz der eingebetteten PDF-Schrift
```

## Wo wird was geändert?

| Änderung | Datei |
|---|---|
| Feld, Option, Grenzwert, Legende | `js/felder-daten.js` |
| Hilfe-Text | `js/erklaerungen-daten.js` |
| Hilfe an ein Feld hängen | `erkl:'<schlüssel>'` in `js/felder-daten.js` |
| Berechnung / Verhalten (Masterbibliothek) | `js/masterbibliothek.js` |
| Berechnung / Verhalten (Protokolle) | `REGELN` in `js/feld-logik.js` |
| Feld im Protokoll hinzufügen / entfernen / verschieben | Bauplan: `js/protokoll-anlage.js` / `-anschluss.js` / `-geraete.js` |
| Grenzwerte Geräteprüfung (R_PE je Länge, R_ISO, Ableitstrom, entfallende Messungen je SK) | `GRENZWERTE.GER_*` in `js/felder-daten.js` |
| „Anlage / Objekt“ in Übersicht/Archiv je Typ | `feldObjekt` in `PROTOKOLL_TYPEN` (Geräte: GER-02) |
| Feld nur in einem Protokoll anders | `{id:'…', anpassen:{…}}` im Bauplan |
| Was „Duplizieren“ übernimmt | `wiederholen.kopieren` im Bauplan |
| Hinweistext unter einem Feld (Formulare) | `hinweis:'…'` in `js/felder-daten.js` |
| Zahlenprüfung (Text, negativ, Tausenderpunkt), Zahlentastatur | `zahlPruefen()` / `ZAHL_TASTATUR` in `js/feld-renderer.js`; je Feld `negativ:true` bzw. `tastatur:'zahl'` in `js/felder-daten.js` |
| Widerspruch zur Mängelbewertung sperren | `beiMangelNicht:{werte, ausserWenn}` am Feld in `js/felder-daten.js` |
| „Pflicht, wenn …“ | `pflichtWenn:'<Bedingung>'` am Feld (Masterbibliothek) oder im Bauplan, Bedingung in `BEDINGUNGEN` (`js/feld-logik.js`) |
| Sicherungen (gG/NH/Neozed/Diazed), LS-Faktoren | `SICHERUNG_GG`, `SICHERUNG_04S_BIS`, `LS_FAKTOR` in `GRENZWERTE` |
| R_PE Anlage (Länge/Querschnitt) | `ANL_RPE` in `GRENZWERTE` |
| Version erhöhen | `APP_VERSION` + `SW_VERSION` in `js/app-config.js` |
| Protokollseite freischalten | `zielseite` in `js/app-config.js` (PROTOKOLL_TYPEN) |
| Neue Datei offline verfügbar | `PRECACHE_DATEIEN` in `js/app-config.js` |
| PDF: Feld in Kasten/Zeile, Reihenfolge, Breite, Kurztext | `PDF_PLAN_ANLAGE` in `js/pdf-anlage.js` |
| PDF Anschluss / Geräte: Blöcke, Felder, Breiten | `PDF_PLAN_ANSCHLUSS` / `PDF_PLAN_GERAETE` in `js/pdf-anschluss.js` / `js/pdf-geraete.js` |
| PDF: Spalten der Stromkreis-Tabelle | `stromkreise.spalten` in `js/pdf-anlage.js` |
| PDF: Stromkreise auf Seite 1 / Zeilen im Leerformular | `KREISE_SEITE_1` / `KREISE_LEER` in `js/pdf-anlage.js` |
| PDF: Ränder, Schriftgrößen, Farben | `SEITE`, `SCHRIFT`, `FARBE` in `js/pdf-layout.js` |
| Grenzwert ohne Formular (PDF) | `grenzwert()` in `js/feld-logik.js` |
| Archiv: Versandwege der Rückfrage, ZIP-Dateiname | `ARCHIV` in `js/app-config.js` |
| Archiv: was „Erneute Prüfung" übernimmt | `vorlage` je Typ in `PROTOKOLL_TYPEN` (`js/app-config.js`) |
| Archiv: Karten, Filter, Aktionen | `js/archiv.js` |
| Aussehen | jeweilige `.css` |
| Icon | Datei in `icons/…` ablegen |

## Aufbau

- **Einzelfelder** in `FIELDS`, **Blöcke** mit Unterfeldern a, b, c …:
  NMESS-01 (Netzmessung), ZNS-01 (Schleifen-/Netzimpedanz), RCD-01 (RCD-Messung).
- **Rot/Grün-Prüfung** über `norm:{min,max}`; abhängige Grenzwerte setzen die `REGELN` in
  `js/feld-logik.js` (Protokolle, PDF) – `masterbibliothek.js` nutzt dieselben Funktionen.
- **Statuszeile** unter I_K und I_K2 zeigt Ergebnis und Bezugswert im Klartext.
- **Schalter „Warum & Wie“** blendet alle Hilfen aus; im Druck nie sichtbar.

## Protokollseiten

- Eine Protokollseite = HTML-Gerüst + **Bauplan** (nur Feld-IDs) + gemeinsame Engine `js/protokoll-seite.js`.
- Schalter **„Feld-IDs anzeigen“** (Standard: aus) zeigt an jedem Feld, Block und Abschnitt die ID (zum Korrigieren).
- Stromkreise als Karussell; „Duplizieren“ übernimmt nur Kabel- und Schutzeinrichtungs-Daten, nie Messwerte.
- Je Stromkreis: SK-02 „Stromkreis in Ordnung“ Ja/Nein. „Nein“ = Mangel, klappt die Gruppen mit `einklappbar:true` zu und blendet die Bemerkung (FIN-09) als Pflicht ein. SK-03 Fotos (verkleinert auf max. 1600 px, JPEG).
- Protokollnummer: `ANL/TT/MM/JJJJ/Nr.` (Zähler je Typ und Tag, `NUMMER_FORMAT` in `js/app-config.js`).
- „Ausgefülltes Protokoll erstellen“: fehlen Pflichtfelder, wird nichts erzeugt – „Trotzdem erstellen (unvollständig)“ umgeht das nach Rückfrage.
- Autosave 0,6 s nach jeder Änderung; abgeschlossene Protokolle öffnen nur lesend.
- Mängel (n.i.O., `mangelWert`, Grenzwert überschritten) werden in der Statusleiste gezählt.
- Knöpfe „Ausgefülltes / Leeres Protokoll erstellen“ rufen `pdfAnlageAusgefuellt` / `pdfAnlageLeer` auf (Namen im Bauplan, `pdf`).

## PDF

- **Oberstes Gebot:** bis 6 Stromkreise (`KREISE_SEITE_1`) steht alles auf Seite 1 – Stammdaten, Netz/Erdung,
  Besichtigen/Erproben, Stromkreis-Tabelle, Gesamtbewertung, Bemerkung und Unterschriften.
  Ab dem 7. Stromkreis: Folgeseite „Stromkreise – Messen (Fortsetzung)“ mit wiederholtem Tabellenkopf.
- Seite 1 ist immer gleich aufgebaut; die Bemerkung füllt den Rest der Seite, Unterschriften stehen unten.
  Passt die Bemerkung nicht, läuft sie auf der Folgeseite weiter („Fortsetzung auf Folgeseite →“).
- Stromkreis „in Ordnung: Nein“ → die Bemerkung steht rot in der Messzeile (statt der Messwerte), Ergebnis „n.i.O.“.
- Grenzwert verletzt → Zelle rot (Regeln aus `FeldLogik.grenzwert`, Werte aus `GRENZWERTE`). Legende unter der Tabelle.
- „Seite X von Y“ im Kopf und in der Fußzeile jeder Seite. Fotos (SK-03) als Fotodokumentation am Ende (6 je Seite).
- Leerformular: gleicher Zeichencode, 5 große Stromkreis-Zeilen, Ankreuzkästchen, Schreiblinien – immer 1 Seite.
- „Trotzdem erstellen“ → rotes Band „UNVOLLSTÄNDIG“ auf Seite 1, Dateiname endet auf `_UNVOLLSTAENDIG`.
- Gespeichert über `pdfSpeichern()` (eigener Ordner oder Download); Meldung nennt Seitenzahl und Dateinamen.

## Archiv

- „Ausgefülltes Protokoll erstellen" legt das PDF zusätzlich im Archiv ab (IndexedDB-Store `archiv`, ein Eintrag je Protokoll).
  Ein neues PDF desselben Protokolls ersetzt den Eintrag; der Entwurf bleibt bearbeitbar. Leerformulare kommen nicht ins Archiv.
- Je Eintrag eingefroren: Nummer, Ort (STAM-01), Anlage/Objekt (objektFeld je Typ: Anlage STAM-02, Anschluss STAM-20, Gerät GER-02), Anzahl Stromkreise, Prüfdatum/Monat (STAM-08),
  Ergebnis **i.O.** / **n.i.O.** (Mängel laut Ampel-Logik) / **offen** (mit „Trotzdem erstellen" ohne Mangel – nie i.O.), Vorlage.
- Filter: Suche (Nr./Ort/Anlage), Monat, Protokolltyp, Ergebnis. Liste nach Monat gruppiert.
- **Ansehen** mit pdf.js im Vollbild (auch Android). **Teilen** öffnet das Teilen-Menü (WhatsApp, Mail …), danach Rückfrage
  „Wurde es verschickt?" → Vermerk mit Weg und Zeit am Eintrag + Bestätigung. Ohne Teilen-Funktion: Download + Rückfrage.
- **ZIP**: Einträge anhaken → „Als ZIP zusammenfassen" → Teilen oder Herunterladen → Versand-Vermerk an allen Einträgen.
- **Erneute Prüfung**: neues Protokoll (neue Nummer) mit Objekt, Netz, Kabel und Stromkreisen samt Schutzeinrichtungen;
  STAM-13 = Wiederholung, STAM-14 = DIN VDE 0105-100. Nie Messwerte, Ergebnisse, Unterschriften, Fotos.
- **Löschen** entfernt nur den Archiv-Eintrag; die Protokolldaten bleiben unter „Vergangene Prüfungen".
- Datensicherung enthält das Archiv (Schema 2). Sicherungen mit Schema 1 lassen sich weiter importieren.

## Anschluss- und Geräteprüfung

- Beide Seiten nutzen dieselbe Engine (`protokoll-seite.js`) und NUR Felder der Masterbibliothek – kein eigenes Feld.
  Abweichungen nur über `anpassen` im Bauplan (z. B. STAM-13/STAM-14 nur die passenden Optionen).
- **Ein Prüfling je Protokoll**: kein Karussell, `anzahlKey:null` → Anzahl immer 1. Nächster Anschluss / nächstes Gerät = neues Protokoll.
- Nummern: `ANS/TT/MM/JJJJ/Nr.` bzw. `GP/TT/MM/JJJJ/Nr.`
- **PDF:** gleicher Stil wie die Anlagenprüfung, Protokoll **zwingend auf 1 Seite**. Die Bemerkung füllt den Rest der Seite;
  ist sie zu lang, wird die Schrift kleiner (bis 5,6 pt), notfalls gekürzt mit Hinweis „vollständig in der App gespeichert“ – nie eine 2. Protokollseite.
  Passt ein Plan grundsätzlich nicht (zu viele Blöcke), meldet `einseitig()` einen Fehler statt eine 2. Seite zu erzeugen.
- **Fotos:** Feld SK-03 (Masterbibliothek) je Protokoll im Abschnitt „Fotodokumentation“ (`anpassen.name`: „Fotos Übergabepunkt“ / „Fotos Gerät“).
  Im PDF als Fotodokumentation auf Folgeseiten (6 je Seite), „Seite X von Y“ zählt mit.
- Leerformular: gleiche Seite, Ankreuzkästchen, Schreiblinien, Geräte-Messtabelle mit allgemeinen Grenzwerten je Schutzklasse.
- **Anschluss nach Prüfablauf:** App und PDF folgen denselben Schritten – 1 Besichtigen → 2 spannungsfrei messen
  (R_PE, R_ISO, Durchgang, R_E, Potenzialausgleich) → 3 zuschalten, unter Spannung messen (U L-N/L-L, U N-PE/f, Drehfeld,
  Z_S/I_K, Z_I/I_K2, RCD) → 4 Erproben. Im PDF je Schritt eine nummerierte Zeile (2.1 …) mit Grenzwert, Schalterstellung,
  Messwerten und i.O./n.i.O.-Kästchen (Baustein `ablauf()` in pdf-layout.js, Inhalt `anschlussAblauf()` in pdf-anschluss.js).
- Geräteprüfung live: Grenzwerte und entfallende Messungen siehe „Eingaben absichern, Plausibilität, Grenzwerte“; GER-13 „Fehler“ = Mangel.
- Anschluss: I_K2 am Übergabepunkt gegen ≈ 5 × Vorsicherung (NETZ-05), I_K gegen LS aus ZNS-01a, NEA-Abschnitt nur bei NEA.

## Eingaben absichern, Plausibilität, Grenzwerte

- **Zahlenfelder** (`kind:'number'`, dazu Schnellauswahl-Felder mit `tastatur:'zahl'`) öffnen am Handy die Zahlentastatur.
  Geprüft wird an EINER Stelle (`zahlPruefen()` in feld-renderer.js) – für Formular, Ampel und PDF gleich:
  Text („abc“), negative Werte (außer `negativ:true`), mehrere Trennzeichen und der Tausenderpunkt („1.000“) sind ungültig →
  Feld rot gestrichelt + Meldung, zählt **nicht** als ausgefüllt, im PDF (nur über „Trotzdem“) rot. Erlaubt: `0,45`, `0.45`, `>999`, `<0,01`, `22 mA`.
- Wird Z_S gelöscht oder ungültig, wird auch das berechnete I_K geleert (kein veralteter Wert).
- **Widersprüche** (`beiMangelNicht` in der Masterbibliothek): Ist ein Mangel bewertet (Ampel rot), sind FIN-02 „Keine Mängel“,
  FIN-04 „Ja“, FIN-03 Plakette „Ja“ (beide erlaubt, wenn FIN-02 „behoben“) und GER-13 „OK“ gesperrt. Das Feld wird rot umrandet,
  das PDF wird nicht erstellt – auch nicht über „Trotzdem erstellen“.
- **FIN-09 Bemerkung** ist Pflicht bei FIN-02 „Mängel festgestellt …“, FIN-04 „Nein“ oder GER-13 „Fehler/Nicht prüfbar“ (`pflichtWenn:'bemerkungNoetig'`).
- **Stromkreis „in Ordnung: Nein“**: die eingeklappten Messungen sind keine Pflicht mehr – nur die Bemerkung zum Stromkreis.
- **R_PE Anlage/Anschluss** (RPE-01): max. = l / (56 · A) + 0,1 Ω aus LTG-02 und LTG-06 desselben Stromkreises, ohne Leitungsdaten Richtwert 1 Ω.
- **Sicherungen**: ZNS-01-a versteht LS B/C/D/K/Z (5/10/20/14/3 × I_n) und gG-, NH-, Neozed-, Diazed-Sicherungen („gG 35A“, „NH00 3x63A“, „D02 35A“)
  → Mindest-I_K = I_a aus `SICHERUNG_GG` (bis 32 A 0,4 s, darüber 5 s).
- **Geräteprüfung**: GER-14 Heizelemente (nur SK I) und GER-15 Heizleistung (bei „Ja“) → R_ISO ≥ 0,3 MΩ, Schutzleiterstrom über 3,5 kW 1 mA/kW (max. 10 mA);
  SK III: R_ISO ≥ 0,25 MΩ, kein Ableitstrom; SK II Berührungsstrom direkt ≤ 0,5 mA; Leitungsquerschnitt (LTG-06) – über 1,5 mm² R_PE = l / (56 · A) + 0,1 Ω,
  bis 1,5 mm² 0,3 Ω + 0,1 Ω je 7,5 m **anteilig** (max. 1 Ω); GER-10 „entfällt (ohne Verbraucher)“ für Verlängerungen/Kabeltrommeln blendet GER-09 aus.

## Hosting auf github.io – gemeinsame Domain

Alle Repositories eines Kontos laufen unter **derselben Domain** (`<name>.github.io`). Service Worker sind je Ordner
getrennt, aber **Cache-Speicher, IndexedDB und localStorage teilt sich die ganze Domain**. Deshalb:

- `sw.js` löscht beim Aktivieren nur Caches mit `CACHE_PREFIX` (`vde2-cache-`) und lädt fehlende App-Dateien selbst nach
  (`precache(true)` bei jedem Seitenaufruf und per Nachricht `CACHE_PRUEFEN` von der Hauptseite).
- „Offline-Speicher zurücksetzen“ meldet nur die eigene Registrierung ab.
- Andere Apps auf derselben Domain sollten ebenso nur ihre eigenen Caches löschen
  (`keys.filter(k => k.startsWith('<eigenes-präfix>') && k !== CACHE_NAME)`).
- Speicher-Schlüssel tragen das Präfix `vde2_`, die Datenbank heißt `vde2_db` – nicht in anderen Apps verwenden.
