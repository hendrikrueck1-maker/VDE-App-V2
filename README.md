# VDE Prüf App

Web-App (PWA) für Prüfprotokolle in der Elektrotechnik – läuft im Browser auf Handy, Tablet und PC,
lässt sich wie eine App auf den Startbildschirm legen und funktioniert nach dem ersten Öffnen auch **offline**.

| Protokoll | Grundlage | Umfang |
|---|---|---|
| Prüfprotokoll elektrischer Anlagen | DIN VDE 0100-600 / DIN VDE 0105-100 | beliebig viele Stromkreise |
| Prüfprotokoll Anschlussprüfung | DIN VDE 0100-600 / DIN VDE 0105-100 | ein Übergabepunkt je Protokoll |
| Prüfprotokoll elektrischer Geräte | DIN EN 50678 / DIN EN 50699 | ein Gerät je Protokoll |

## Funktionen

- Stammdaten einmal eingeben – jedes neue Protokoll übernimmt sie, Protokollnummer automatisch (`ANL/TT/MM/JJJJ/Nr.`).
- Grenzwerte werden live geprüft (rot = nicht eingehalten), Kurzschlussstrom aus Z_S wird berechnet,
  Grenzwerte passen sich an LS/Sicherung, RCD, Leitung und Schutzklasse an.
- Eingabeprüfung: keine Texte, negativen Werte oder Tausenderpunkte in Messfeldern; Pflichtfelder mit Sprungliste;
  ein Protokoll kann nicht „keine Mängel“ aussagen, wenn Mängel festgestellt sind.
- PDF-Export (ausgefüllt oder als Leerformular), Fotodokumentation, Unterschriften.
- Archiv aller PDFs: ansehen, filtern, teilen (Mail, WhatsApp), als ZIP versenden, erneute Prüfung als Vorlage.
- Hilfen „Warum wird geprüft? / Wie wird geprüft?“ je Messung, abgestimmt auf Fluke 1663 und Fluke 6500-2.
- Datensicherung als Datei (Export/Import).

## Benutzen

App-Adresse im Browser öffnen, dann:

- **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.
- **iPhone/iPad (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“.
- **PC (Chrome/Edge):** Installieren-Symbol rechts in der Adressleiste.

## Daten & Datenschutz

Alle Prüfdaten, Fotos und PDFs werden **nur auf dem jeweiligen Gerät** im Browser gespeichert – es gibt keinen Server
und keine Übertragung. Jedes Gerät hat seinen eigenen Bestand. Deshalb regelmäßig über
**Hauptseite → Datensicherung → Daten exportieren** sichern; auf einem anderen Gerät mit „Daten importieren“ übernehmen.

## Updates

Neue Version hochladen (dabei `APP_VERSION` und `SW_VERSION` in `js/app-config.js` erhöhen),
dann in der App **Hauptseite → Version & Update → Nach Updates suchen → jetzt neu laden**.

## Hinweis

Die App ist ein Hilfsmittel für Elektrofachkräfte. Sie ersetzt nicht die fachliche Beurteilung der prüfenden
Person; Grenzwerte und Texte ohne Gewähr – maßgeblich sind die jeweils gültigen Normen.

## Für Entwickler

Aufbau, Dateien und „Wo wird was geändert?“: [docs/ENTWICKLER.md](docs/ENTWICKLER.md) · Änderungen: [CHANGELOG.md](CHANGELOG.md)

Verwendete Bibliotheken: jsPDF (MIT, `js/lib/jspdf-LICENSE.txt`), pdf.js (Apache-2.0, `js/lib/pdfjs-LICENSE.txt`),
Schrift Liberation Sans (SIL OFL 1.1, `js/lib/LiberationSans-OFL.txt`).
