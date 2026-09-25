# Icons für Messungen – Status

Sobald eine Datei mit **genau** einem der unten genannten Dateinamen in
diesem Ordner liegt, erscheint sie auf der Seite `masterbibliothek.html`
automatisch – ohne dass Code geändert werden muss (einfach Browser neu
laden).

## Format-Empfehlung
- Quadratisch, mindestens 300×300 px (wird als Kreis 44×44 px angezeigt,
  `object-fit: cover` schneidet automatisch mittig zu)
- Erlaubte Formate: `.svg`, `.png`, `.jpg` / `.jpeg`, `.webp`
  (die Seite probiert automatisch alle Formate in dieser Reihenfolge durch)

## Status

| Dateiname (ohne Endung)         | Kurzlabel im UI | Verwendet bei | Status |
|---|---|---|---|
| `z_s_schleifenimpedanz`         | Z_i (Z_S)       | ZNS-01 | ✅ vorhanden |
| `rcd_ausloesezeit_deltat`       | ΔT              | RCD-01 | ✅ vorhanden |
| `rcd_ausloesestrom_i_deltan`    | I_ΔN            | RCD-01 | ✅ vorhanden |
| `r_iso_isolationswiderstand`    | R_ISO           | RISO-02 (Installationstester) | ✅ vorhanden |
| `r_pe_schutzleiterwiderstand`   | R_PE            | RPE-01 (Installationstester) | ✅ vorhanden |
| `r_lo_potenzialausgleich`       | R_LO            | ERD-02 (Durchgängigkeit Potenzialausgleich) | ✅ vorhanden |
| `netzspannung_v_hz`             | V, Hz           | NETZ-02 | ✅ vorhanden |
| `phase_drehfeldmessung`         | Phase           | NMESS-09 | ✅ vorhanden |

Diese Tabelle gilt **nur** für die fotografierten Drehschalter-Icons des
Installationstesters (Fluke 1663). Der Gerätetester (Fluke 6500-2) hat
Tasten statt Drehschalter – seine Symbole sind deshalb keine Bilddateien,
siehe nächster Abschnitt.

## Gerätetester-Symbole (Fluke 6500-2) – KEINE Bilddateien nötig

Diese Icons werden rein per CSS/Text gezeichnet (`typ:'glyph'` in
`js/icons.js`), abgeleitet aus dem vom Nutzer gelieferten Tasten-Mockup
(`Dateien V2/Icons/Geräteprüfung/`), aber ins eigene Badge-Design überführt.
Hier muss **nichts** hochgeladen werden – Status nur zur Übersicht:

| Symbol (Badge-Inhalt) | Kurzlabel im UI | Verwendet bei | Status |
|---|---|---|---|
| `R_PE · 200 mA`        | R_PE (Gerätetester) | GER-05 | ✅ eingebaut |
| `R_ISO`                | R_ISO (Gerätetester) | GER-05c | ✅ eingebaut |
| `I_EA`                 | Ersatzableitstrom | GER-09, GER-10 | ✅ eingebaut |
| `IΔ/I_L`               | Differenzstrom | GER-09, GER-10 | ✅ eingebaut |
| `I_B`                  | Direktmessung | GER-09, GER-10 | ✅ eingebaut |

Seit der Trennung von Installationstester- und Gerätetester-Prüfung
(23.09., Runde 3) haben RPE-01/RISO-01/RISO-02 nur noch je EIN Foto-Icon
(Installationstester); die Gerätetester-Glyphen für R_PE/R_ISO hängen an
den neuen Feldern GER-05 (R_PE) und GER-05b/GER-05c (R_ISO Modus/Messwert).

**Hinweis zu `U_L_Netzspannung.png` aus "Dateien V2":** diese Datei war im
Altsystem (trotz des irreführenden Namens) die V,Hz-Netzspannungs-Ikone.
Sie wurde durch die neue, korrekt benannte `V_Hz_Netzspannung.png` (hier:
`netzspannung_v_hz`) ersetzt und daher nicht übernommen – keine
Doppelbelegung nötig.

## Beispiel
Liegt `phase_drehfeldmessung.png` in diesem Ordner, erscheint sie
automatisch bei der Karte **NMESS-09** auf der Seite. Bis dahin zeigt die
Seite dort einen gestrichelten Platzhalter-Kreis mit den ersten Buchstaben
des Kurzlabels.
