# VDE Prüf App V2 – Gesamttest & Norm-Abgleich (Version 0.7.1)

**Stand:** 24.09.2026 · **Geprüft:** alle 6 Seiten, alle 3 Protokolle, PDF-Export (ausgefüllt + leer), Stromkreise, Archiv, Sicherung, Offline-Betrieb
**Methode:** Der Code wurde vollständig gelesen, danach wurde die App in einem echten Browser (Chromium, Handy-Format 412 px) automatisiert bedient. Es wurden über 60 Testfälle eingegeben, darunter absichtlich falsche Eingaben und Sonderfälle. Alle erzeugten PDFs wurden angesehen.

---

## 1. Kurzfazit

Die App ist **technisch solide gebaut**: keine Programmabstürze, keine JavaScript-Fehler, Offline-Betrieb funktioniert, die PDFs sehen sauber und einheitlich aus, die Seitenumbrüche bei vielen Stromkreisen stimmen. Die Architektur (Masterbibliothek → Bauplan → gemeinsame Engine) hat sich bewährt. Änderungen lassen sich weiterhin an einer Stelle machen.

**Aber:** Im Moment kann man ein **inhaltlich falsches Protokoll erzeugen, das trotzdem „i.O.“ zeigt**. Die Ursache ist, dass Messfelder jeden Text annehmen und dass Widersprüche in der Gesamtbewertung nicht blockiert werden. Einige Grenzwerte weichen außerdem von der Norm bzw. der üblichen Praxis ab. Manche davon erzeugen falsche Mängel, andere lassen Grenzfälle durchgehen.

| Bewertung | Anzahl | Bedeutung |
|---|---|---|
| 🔴 Kritisch | 6 | Kann zu einem falschen, aber „gültig“ aussehenden Protokoll führen → vor v1.0 beheben |
| 🟠 Norm / Grenzwert | 12 | Grenzwert fehlt, ist zu streng oder zu großzügig, Sonderfall wird nicht unterstützt |
| 🟡 Bedienung / Funktion | 14 | Fehlbedienung möglich, Kleinigkeiten, Einheitlichkeit |
| ✅ Funktioniert | – | siehe Abschnitt 5 |

**Empfehlung für GitHub:** Die App so wie sie ist als **v0.8.0 (Beta)** hochladen. **v1.0.0** erst veröffentlichen, wenn die 🔴-Punkte und die ersten drei 🟠-Punkte behoben sind. Das sind überschaubare Änderungen, fast alle in `feld-renderer.js`, `feld-logik.js`, `felder-daten.js` und `protokoll-seite.js`.

---

## 2. 🔴 Kritische Fehler (falsches Protokoll möglich)

### K1 – Messfelder nehmen beliebigen Text an und zählen als „ausgefüllt“
**Test:** Im Stromkreis R_PE = `abc`, Z_S = `x` und I_K = `hallo` eingetragen.
**Ergebnis:** Alle Pflichtfelder gelten als ausgefüllt, es wird kein Mangel angezeigt, das PDF wird erzeugt und im Archiv landet **„i.O.“**. Im PDF steht wörtlich `abc`, `x` und `hallo` in der Messtabelle, und die Zeile ist grün mit „i.O.“ markiert.
**Ursache:** Zahlenfelder sind `type="text"`. `pruefeNorm()` bewertet nur Werte, die `parseFloat` lesen kann. Text wird still ignoriert.
**Lösung:** In `feld-renderer.js` bei `kind:'number'` eine Validierung einbauen. Ist die Eingabe keine Zahl → Feld rot + Hinweis „keine gültige Zahl“ und als Pflicht **nicht** erfüllt. Erlaubt bleiben sollten Anzeigen des Messgeräts wie `>999` oder `<0,01` (als eigenes Muster).

### K2 – Negative Messwerte werden als gültig (grün) angenommen
**Test:** Z_S = `-0,5`, R_PE = `-1`, Auslösezeit = `-5 ms`.
**Ergebnis:** Alle drei grün, kein Mangel. (Nur R_ISO = `-3` wird rot, weil dort ein Mindestwert gilt.)
**Lösung:** Für alle Messfelder `min:0` als harte Plausibilitätsgrenze (unabhängig vom Norm-Grenzwert) festlegen.

### K3 – Tausenderpunkt wird als Komma gelesen
**Test:** Auslösezeit = `1.000` (gemeint 1000 ms).
**Ergebnis:** Die App liest 1,0 ms → **i.O.** Im PDF steht „1,000“.
**Lösung:** Eingaben mit Punkt *und* Komma oder mit mehreren Punkten ablehnen. Alternativ den Punkt nur als Dezimaltrenner zulassen, wenn danach nicht genau drei Ziffern folgen.

### K4 – Widersprüchliche Gesamtbewertung wird nicht verhindert
**Test Anlage:** R_ISO = 0,2 MΩ (Grenzwert 1 MΩ → rot), dazu „Keine Mängel festgestellt“, „Sicherer Gebrauch: Ja“ und „Prüfplakette: Ja“.
**Ergebnis:** Das PDF wird ohne Rückfrage erzeugt. Auf dem Papier steht **„keine Mängel · sicher: Ja · Plakette: Ja“**, obwohl die R_ISO-Zelle rot ist. Das Archiv zeigt dagegen „n.i.O.“. Die beiden widersprechen sich.
**Test Gerät:** R_ISO 0,5 MΩ bei SK I (rot), Prüfergebnis „bestanden (OK)“, Plakette „Ja“ → PDF wird genauso erzeugt.
**Warum das kritisch ist:** Ein solches Protokoll würde bei einem Unfall gegen den Prüfer verwendet.
**Lösung:** Plausibilitätsregel in `protokoll-seite.js` (vor dem Erstellen):
- Gibt es Mängel laut Ampel, sind FIN-02 = „Keine Mängel“, FIN-04 = „Ja“, FIN-03 = „Ja“ und GER-13 = „OK“ **nicht** erlaubt. Dann eine Meldung mit Sprungmarke zeigen, so wie heute bei fehlenden Pflichtfeldern.
- „Mängel festgestellt und behoben“ bleibt erlaubt, braucht dann aber eine Pflicht-Bemerkung.

### K5 – „Stromkreis in Ordnung: Nein“ verlangt trotzdem alle Messwerte
**Test:** SK-02 = „Nein“ und eine Bemerkung eingetragen (z. B. Stromkreis abgeklemmt).
**Ergebnis:** Die Messungen werden eingeklappt, bleiben aber **15 Pflichtfelder**. Ein PDF entsteht nur über „Trotzdem erstellen“ und trägt dann das rote Band **UNVOLLSTÄNDIG**. Das widerspricht der README („klappt zu … Bemerkung als Pflicht“).
**Ursache:** `ausgeblendet()` prüft nur die CSS-Klasse `.ausgeblendet`. Das Einklappen nutzt aber das Attribut `hidden`.
**Lösung:** In `pflichtWirksam()` Felder innerhalb von `.sk-messungen` einer Karte mit `SK-02 = Nein` ausnehmen. Messwerte, die trotzdem eingetragen sind, sollen weiter bewertet werden.

### K6 – Zu großzügige Bewertung der Schleifenimpedanz (fehlender Sicherheitsabstand)
**Test:** LS B 16 A, Z_S = 2,5 Ω → I_K = 92 A ≥ 80 A → **i.O.**
**Norm/Praxis:** Gemessen wird kalt und mit kleinem Prüfstrom. Im Fehlerfall erwärmt sich der Leiter, und das Messgerät hat eine Toleranz. Deshalb gilt in der Praxis **Z_S ≤ 2/3 × U₀ / I_a**, und der Entwurf E DIN VDE 0100-600:2025-12 nennt genau diese Bedingung. Für B 16 A sind das **max. 1,92 Ω** statt 2,88 Ω. Der Stromkreis im Test wäre also **n.i.O.**
**Lösung:** In `GRENZWERTE` einen Faktor `ZS_FAKTOR: 2/3` ergänzen (bzw. I_K-Mindestwert × 1,5) und in `minIkAusLS()` sowie `grenzwert()` anwenden. Die Statuszeile sollte den Faktor nennen.

---

## 3. 🟠 Norm- und Grenzwert-Abgleich

### 3.1 Was stimmt ✅

| Prüfung | Wert in der App | Quelle / Bewertung |
|---|---|---|
| LS-Auslösung B / C / D | 5 / 10 / 20 × I_n | DIN EN 60898, obere Grenze des Sofortauslösers ✅ |
| Berührungsspannung U_L | AC 50 V / 25 V, DC 120 V / 60 V | DIN VDE 0100-410 ✅ |
| R_ISO Anlage (Erstprüfung) | ≥ 1 MΩ, SELV/PELV ≥ 0,5 MΩ | DIN VDE 0100-600 Tab. 6.1 ✅ |
| RCD-Zeit nicht selektiv | 300 / 150 / 40 ms bei 1× / 2× / 5× I_Δn | DIN EN 61008/61009 ✅ |
| RCD-Auslösestrom (Sinus) | 0,5–1,0 × I_Δn | ✅ für Typ AC/A mit Sinus-Prüfstrom |
| Frequenz | 49,5–50,5 Hz | DIN EN 50160 ✅ |
| Gerät R_PE | 0,3 Ω bis 5 m, +0,1 Ω je 7,5 m, max. 1 Ω | DIN EN 50678/50699 für Leitungen ≤ 1,5 mm² ✅ |
| Gerät R_ISO | SK I ≥ 1 MΩ, SK II ≥ 2 MΩ | ✅ |
| Gerät Schutzleiterstrom SK I | ≤ 3,5 mA | ✅ (ohne Heizgeräte, siehe N9) |

### 3.2 Abweichungen und fehlende Sonderfälle

**N1 – Netzspannung oben zu streng (falsche Mängel).**
Die App erlaubt 207–244 V und 360–424 V. Das sind −10 %, aber nur +6 %. Nach DIN EN 50160 bzw. IEC 60038 gilt **230 V ±10 % = 207–253 V** und **400 V ±10 % = 360–440 V**.
Test: 250 V → Mangel, obwohl zulässig. In Netzen mit viel PV-Einspeisung kommt das häufig vor.
→ `norm:{min:207,max:253}` bzw. `{min:360,max:440}` in `NMESS_GROUP`.

**N2 – Selektive RCD (Typ S) fehlen (falsche Mängel).**
Für S-Typen gilt: 1× I_Δn 130–500 ms · 2× 60–200 ms · 5× 50–150 ms.
Test: „A S“, 300 mA, 5×, 90 ms → **rot**, obwohl i.O.
→ Schnellauswahl um „A S“ / „B S“ ergänzen, `RCD_ZEIT_MAX` abhängig vom Typ machen (und für S auch eine Mindestzeit).

**N3 – RCD-Auslösestrom nur für Sinus-Prüfstrom richtig.**
Typ A mit pulsierendem Gleichstrom: 0,35–1,4 × I_Δn. Typ B mit glattem Gleichstrom: 0,5–2,0 × I_Δn.
Test: Typ B, 30 mA, 45 mA (DC-Prüfung) → rot, obwohl i.O.
Außerdem: I_Δn als `0,03 A` eingetragen → die App rechnet mit 0,03 mA → falscher Mangel.
→ Prüfstromform (Sinus / pulsierend / DC) als Auswahl ergänzen. „A“ in I_Δn in mA umrechnen.

**N4 – Nur EIN Prüfstrom je Stromkreis, vorbelegt mit 5 × I_Δn.**
Kern des Nachweises nach VDE 0100-600 ist die Auslösung **bei I_Δn** (Auslösestrom + Auslösezeit ≤ 300 ms). Der Entwurf 2025-12 verlangt außerdem vollständige Einzelwerte statt „bestanden“.
→ Vorbelegung auf **1 × I_Δn** ändern oder zwei Zeitfelder vorsehen (1× und 5×). Der Fluke 1663 liefert beide Werte im Auto-Test.

**N5 – R_ISO bei Wiederholungsprüfung (DIN VDE 0105-100) nicht berücksichtigt.**
Laut Bender gilt dort: **1000 Ω/V** ohne Verbrauchsmittel (≈ 0,23 MΩ bei 230 V), **300 Ω/V** mit angeschlossenen Verbrauchsmitteln, 150 Ω/V im Freien bzw. in feuchter Umgebung. Die App verlangt immer ≥ 1 MΩ, auch bei „250 V mit Verbrauchern“. Das ist sicherheitlich unkritisch, weil strenger, erzeugt aber falsche Mängel an Bestandsanlagen.
→ Grenzwert von STAM-14 (0100-600 vs. 0105-100) und RISO-01-a abhängig machen. Oder bewusst bei 1 MΩ bleiben und das im Hinweis erklären (Entscheidung von dir).

**N6 – R_PE in der Anlage fest ≤ 0,30 Ω.**
0,30 Ω ist der **Gerätewert** (0701-0702 / EN 50678). Für Anlagen gibt es keinen festen Normwert. Der Widerstand hängt von Länge und Querschnitt ab (R = ρ·l/A).
Beispiel: 50 m H07RN-F 2,5 mm² → PE allein ≈ 0,36 Ω → **falscher Mangel**. Bei Veranstaltungen mit langen Leitungen passiert das ständig.
→ Grenzwert aus LTG-02 (Länge) + LTG-06 (Querschnitt) berechnen und einen Übergangswiderstand aufschlagen. Oder den Wert nur als „Richtwert“ (gelb statt rot) zeigen.

**N7 – TT- und IT-System wählbar, aber bewertet wird immer wie TN.**
TT: Maßgeblich ist R_A × I_Δn ≤ 50 V. ERD-03 (R_E) hat aber keinen Grenzwert, und I_K gegen den LS ist im TT-System meist nicht erreichbar. IT: Isolationsüberwachung, Verhalten beim ersten Fehler.
→ Mindestens: Wählt man TT, wird R_E gegen 50 V / I_Δn geprüft (30 mA → max. 1666 Ω). Wählt man IT, erscheint ein Hinweis „fachlich bewerten“.

**N8 – Schmelzsicherungen (gG/NH/Neozed) und LS-Charakteristik K/Z werden nicht ausgewertet.**
Test: `gG 35A`, `NH 63A`, `K 16A` → „nicht erkannt – fachlich bestimmen“. Das ist korrekt gelöst (kein falsches i.O.), aber gerade bei der Anschlussprüfung sind NH-Sicherungen die Regel.
→ Tabelle der Abschaltströme für gG 0,4 s / 5 s ergänzen (DIN VDE 0100-410, Anhang).

**N9 – Geräteprüfung: Sonderfälle fehlen.**
- **SK I mit Heizelementen** (Scheinwerfer, Heizlüfter, Wasserkocher): R_ISO ≥ 0,3 MΩ, Schutzleiterstrom 1 mA/kW bis max. 10 mA → heute **falscher Mangel**.
- **SK III**: Die App blendet alle Messungen aus. Mehrere Quellen (z. B. Deutscher Prüfservice) nennen für SK III aber **R_ISO ≥ 0,25 MΩ**. → prüfen und ggf. R_ISO für SK III einblenden.
- **SK II Berührungsstrom „direkt“ ≤ 0,25 mA:** Die Quellen widersprechen sich. 0,5 mA ist verbreitet (VDE 0701-0702, Deutscher Prüfservice), bott.de nennt 0,25 mA. → Bitte am Normtext DIN EN 50699 Tabelle prüfen. Test: SK II direkt 0,3 mA → rot.
- **R_PE bei Leitungen > 1,5 mm²:** EN 50678/50699 nutzt dafür eine Formel (Leiterwiderstand + 0,1 Ω Übergang). Die App nutzt immer die 0,3-Ω-Regel.
- **Rundung der Leitungslänge:** 13 m → max. 0,5 Ω (angefangene 7,5 m werden aufgerundet). Das ist eine zulässige Lesart, aber die großzügigste.
- Verlängerungsleitungen und Mehrfachsteckdosen (im Theater häufig) haben keine eigene Vorlage.

**N10 – „Zusätzlicher Potenzialausgleich vorhanden: Nein“ ist immer ein Mangel.**
Er ist aber nicht überall gefordert (nur in bestimmten Bereichen, z. B. nach VDE 0100-7xx). Es fehlt die Option „n.a.“. BES-06 hat „n.a.“, ERD-01 nicht.

**N11 – „ohne RCD“ bei Steckdosen-Stromkreisen ohne jeden Hinweis.**
DIN VDE 0100-410: Steckdosen ≤ 32 A brauchen einen 30-mA-RCD. Für Veranstaltungsstätten fordert DIN VDE 0100-711 das für alle Endstromkreise. Im Bestand gilt Bestandsschutz. Deshalb **Hinweis (gelb)**, kein Mangel.

**N12 – Kalibrierdatum des Prüfgeräts fehlt.**
Prüfgerät und Seriennummer sind vorhanden. Der Entwurf DIN VDE 0100-600:2025-12 verlangt aber auch den **Kalibrierstatus**. Auch sonst ist er Standard in jedem Protokoll.
→ Feld „Kalibriert bis“ in den Stammdaten + im PDF-Kopf. Liegt das Datum in der Vergangenheit, erscheint eine Warnung.

---

## 4. 🟡 Bedienung, Einheitlichkeit, kleinere Fehler

| Nr. | Befund | Test / Beleg | Vorschlag |
|---|---|---|---|
| B1 | **Anlagenprüfung bietet Geräte-Optionen an**: „Grund der Prüfung“ enthält „Erstprüfung (Gerät)“, „Prüfnorm“ enthält „DIN EN 50678“ | Dropdown STAM-13/14 im Anlagen-Protokoll | wie bei Anschluss/Gerät per `anpassen:{options}` im Bauplan einschränken |
| B2 | Netzsystem ist mit **TN-S vorbelegt**. Die Beschreibung sagt „vor dem Speichern bestätigen“, das wird aber nicht erzwungen | NETZ-01 | ohne Vorbelegung („– bitte wählen –“) |
| B3 | **Nächster Prüftermin rechnet falsch** am Monatsende | 31.01. + 1 Monat → **03.03.**; 29.02.2024 + 1 Jahr → 01.03.2025; „0 Monate“ → +1 Monat; „−3 Monate“ wird angenommen; „6 Wochen“ → Fehlertext landet **im Terminfeld** (und damit im PDF) | auf Monatsende begrenzen, 0/negativ ablehnen, Wochen ergänzen, Fehlermeldung als Statuszeile statt als Feldwert |
| B4 | I_K bleibt stehen, wenn Z_S gelöscht wird (veralteter Wert gilt als ausgefüllt). Überschreibt man I_K von Hand (z. B. 9999 A), gibt es keinen Abgleich mit Z_S | Z_S 5 → I_K 46; Z_S leeren → I_K bleibt 46 | I_K mitleeren; bei Abweichung > 10 % zu U₀/Z_S einen Hinweis zeigen |
| B5 | Zahlenformat uneinheitlich: in der App `511.1` und `575.0 A` (Punkt, Einheit im Wert), im PDF `511,1` | ZNS-01-c / -e | `toLocaleString('de-DE')`, Einheit nicht in den Wert schreiben |
| B6 | **„Abschließen“ auf der Hauptseite prüft nichts**: kein Pflichtfeld-Check, kein PDF nötig. Danach ist das Protokoll nur noch lesbar, und es gibt keinen Weg zurück | startseite.js Zeile 224 ff. | nur bei vollständigem Protokoll bzw. vorhandenem PDF erlauben; „wieder öffnen“ mit Rückfrage |
| B7 | **Archiv-PDF kann veralten**: Nach dem Erstellen bleibt der Entwurf bearbeitbar. Das Archiv zeigt weiter den alten Stand „i.O.“, ohne Hinweis | Nach dem PDF R_ISO auf 0,1 geändert → Archiv weiter „✓ i.O.“ | am Archiv-Eintrag „Protokoll nach PDF geändert – neu erstellen?“ anzeigen (Vergleich `geaendert` > `erstellt`) |
| B8 | „RCD-Prüftaste i.O.“ wählbar, obwohl überall „ohne RCD“ steht | ERP-05 | bei „ohne RCD“ automatisch „n.a.“ setzen |
| B9 | Unterschriften sind optional. Ein PDF ohne Unterschrift ist möglich | FIN-10/11 | bewusst so lassen, wenn von Hand unterschrieben wird. Sonst FIN-10 Pflicht |
| B10 | Hauptseite: „Prüfgerät/Seriennummer Gerätetester“ tragen das Abzeichen **Pflicht**, der Hinweis sagt aber „sonst leer lassen“ | STAM-11/12 | Badge „Optional“ auf der Hauptseite |
| B11 | Knopf „App-Anleitung – folgt in einem späteren Schritt“ ist sichtbar | index.html | für v1.0 ausblenden oder kurze Anleitung verlinken |
| B12 | Jedes Messungs-Icon wird zuerst als `.svg` angefragt → 8 Fehlermeldungen (404) pro Seite, offline je ein Fehlversuch | icons.js | `ICON_EXTENSIONS = ['png', …]` (die Icons sind PNG) |
| B13 | **Doppelte Protokollnummern bei zwei Geräten**: Der Zähler läuft je Browser. Handy und Tablet vergeben am selben Tag beide `ANL/24/09/2026/001` | app-config.js / speicher.js | Gerätekürzel in die Nummer (z. B. `ANL/24/09/2026/H-001`) oder Prüfer-Kürzel |
| B14 | **Datensicherheit**: Alle Daten liegen nur im Browser. `navigator.storage.persist()` wird nicht angefragt (Test: `persisted() = false`), es gibt kein Web-App-Manifest → nicht als App installierbar. Auf iPhone/iPad kann Safari Daten einer nicht installierten Web-App nach längerer Nichtnutzung löschen | sw.py-Test | `manifest.json` + App-Icons, beim Start `navigator.storage.persist()`, Erinnerung an Datensicherung (z. B. „letzte Sicherung vor 14 Tagen“) |

**Übersichtlichkeit / Einheitlichkeit – Gesamteindruck**
- Alle drei Protokolle nutzen dieselbe Engine, dieselben Felder, dieselbe Optik, dieselben PDF-Bausteine → **sehr einheitlich**. 👍
- Die Pflichtfeld-Liste mit Sprungmarken ist hervorragend.
- Die Anlagenprüfung ist umfangreich: 65 Pflichtfelder bei 1 Stromkreis, +18 je weiterem Stromkreis (8 Stromkreise = 191). Das ist fachlich richtig, auf dem Handy aber viel. Hilfreich wäre ein Knopf „Besichtigen: alle i.O.“ (nur mit Rückfrage und nie vorbelegt).
- Die Hauptseite ist sehr lang (Stammdaten + Start + Archiv + Sicherung + Update untereinander). Vorschlag: Stammdaten und Sicherung einklappbar machen.

---

## 5. ✅ Was getestet wurde und funktioniert

| Bereich | Ergebnis |
|---|---|
| Seiten laden | alle 6 Seiten ohne JavaScript-Fehler |
| Offline (Service Worker) | 53 Dateien im Cache. Hauptseite, Protokoll, Archiv und Masterbibliothek öffnen offline |
| Kurzschlussstrom | I_K = 230 V / Z_S korrekt. LS-Erkennung auch bei `B16`, `b16a`, `B 16 A`, `C 20A`, `D 16A` |
| 1-phasig / Drehstrom | blendet L2/L3, Außenleiterspannungen und Drehfeld richtig aus, Pflichtzahl passt sich an |
| NEA | Generator-Abschnitt erscheint und wird Pflicht, I_K2 am Speisepunkt ohne Bewertung |
| Anschluss: I_K2 | gegen 5 × Vorsicherung (NH 63 A → min. 315 A) korrekt |
| Duplizieren | übernimmt nur Kabel und Schutzeinrichtung, **keine Messwerte** ✅ |
| Stromkreise im PDF | 1 SK → 1 Seite · 8 SK → 2 Seiten (6 auf Seite 1) · 30 SK → 3 Seiten, Tabellenkopf wiederholt, „Seite X von Y“ korrekt |
| Lange Bemerkung | läuft sauber auf Folgeseite(n) weiter, nichts geht verloren |
| Anschluss-/Geräte-PDF | immer 1 Seite. 7 Fotos → 2 Foto-Seiten (6 + 1), verkleinert, beschriftet |
| Leerformulare | alle drei je 1 Seite, mit Ankreuzkästchen und Schreiblinien |
| Grenzwertzellen | rot im PDF, Legende unter der Tabelle |
| „Trotzdem erstellen“ | rotes Band UNVOLLSTÄNDIG, Archiv „offen“ statt i.O. ✅ |
| Archiv | Liste, Filter, Ansehen (pdf.js), Erneute Prüfung übernimmt Objekt/SK/LS, **nicht** die Messwerte ✅ |
| Import | falsches Format wird erkannt. Eingeschleuster HTML-Code wird als Text angezeigt (kein Sicherheitsloch) ✅ |

---

## 6. GitHub – Vorbereitung für die erste Version

### 6.1 Was NICHT ins Repository gehört
| Ordner/Datei | Grund |
|---|---|
| `Claude outputs/` | Arbeitsdateien, Muster-PDFs, Screenshots |
| `vde-pruef-app-v2/` | **alte Kopie** von felder-daten.js / masterbibliothek.js. Verwirrt und wird nicht benutzt |
| `icons/**/_ICONS-BENOETIGT.md` | optional. Kann bleiben, besser in `docs/` |

Vorschlag `.gitignore`:
```
Claude outputs/
vde-pruef-app-v2/
*.pdf
*.png.bak
.DS_Store
Thumbs.db
desktop.ini
```
(Die PNG-Icons in `icons/` werden **nicht** ignoriert, nur PDFs.)

### 6.2 Lizenzen (Pflicht bei öffentlichem Repo)
- ✅ `js/lib/jspdf-LICENSE.txt` (MIT) und `js/lib/pdfjs-LICENSE.txt` (Apache-2.0) sind vorhanden.
- ❌ **Liberation Sans** (in `js/pdf-schrift.js`) steht unter der **SIL Open Font License 1.1**. Der Lizenztext muss mitgeliefert werden → `js/lib/LiberationSans-OFL.txt` ergänzen.
- ❌ **Eigene Lizenz fehlt** (`LICENSE` im Hauptordner). Du musst entscheiden: offen (z. B. MIT) oder „Alle Rechte vorbehalten“. Private Repos brauchen keine.
- Empfehlung: Haftungsausschluss in die README („Hilfsmittel, ersetzt nicht die Beurteilung durch die Elektrofachkraft; Grenzwerte ohne Gewähr“).

### 6.3 Hosting (GitHub Pages)
- Alle Pfade sind relativ → läuft auch unter `https://<name>.github.io/vde-pruef-app/`. ✅
- https ist Voraussetzung für Service Worker und IndexedDB → GitHub Pages erfüllt das. ✅
- Fehlt für „Zum Startbildschirm hinzufügen“: `manifest.json` + App-Icon 192/512 px + `<link rel="manifest">` + `theme-color` in allen HTML-Seiten (siehe B14).
- **Privat oder öffentlich?** Die App enthält keine Kundendaten (Prüfdaten liegen nur im Browser). Ein öffentliches Repo ist also möglich. GitHub Pages geht bei privaten Repos nur mit einem bezahlten Plan.

### 6.4 Versionierung
- In `js/app-config.js` `APP_VERSION` **und** `SW_VERSION` gemeinsam erhöhen (sonst kein Update auf den Geräten).
- Git-Tag `v0.8.0` (Beta) bzw. später `v1.0.0` + Release-Notiz.
- `CHANGELOG.md` anlegen (Inhalt: die Versionsabschnitte aus der README).

### 6.5 Vorgeschlagene Reihenfolge
1. **Jetzt:** Aufräumen (6.1), Lizenzen (6.2), Repo anlegen, als **v0.8.0-beta** hochladen.
2. **Schritt 1 – Eingaben absichern:** K1, K2, K3 (eine Änderung in `feld-renderer.js`/`pruefeNorm`).
3. **Schritt 2 – Plausibilität:** K4, K5, B6, B7 (`protokoll-seite.js`, `startseite.js`, `archiv.js`).
4. **Schritt 3 – Grenzwerte:** K6, N1, N2, N3, N4 (`felder-daten.js` GRENZWERTE + `feld-logik.js`).
5. **Schritt 4 – Sonderfälle:** N5–N12 nach Priorität. Danach **v1.0.0**.
6. Nebenbei: B1–B5, B8, B10–B14.

---

## 7. Quellen (Norm-Abgleich)

Die Normtexte selbst sind kostenpflichtig. Die Werte wurden mit Fachquellen abgeglichen. Bei N5 und N9 bitte gegen die Originalnorm prüfen.

- Bender: [Isolationswiderstände prüfen, messen und überwachen](https://www.bender.de/fachwissen/technologie/it-system/isolationswiderstaende-pruefen-messen-und-ueberwachen/) – VDE 0105-100: 1000 / 300 / 150 Ω/V, VDE 0100-600: ≥ 0,5 / 1,0 MΩ
- Bertsch Prüfinstitut: [Schleifenimpedanz messen](https://www.bertsch-pruefinstitut.de/schleifenimpedanz-messen/) – 2/3-Methode
- elektrofachkraft.de: [Erstprüfung nach DIN VDE 0100-600: Entwurf 2025-12](https://www.elektrofachkraft.de/pruefung/erstpruefung-nach-din-vde-0100-600-entwurf-2025-12) – Z_S ≤ 2/3 · U₀/I_a, vollständige RCD-Werte, Kalibrierstatus
- Deutscher Prüfservice: [Schutzklassen und Messungen](https://deutsche-pruefservice.de/dps-klaert-auf/dguv-pruefung-ortsveraenderliche-elektrische-betriebsmittel-schutzklasse-und-messungen/) – R_PE, R_ISO SK I/II/III, Berührungsstrom 0,5 mA
- bott: [Ableitstromprüfung](https://www.bott.de/glossar/ableitstrompruefung) – nennt 0,25 mA für SK II (Widerspruch → prüfen)
- MEBEDO: [Die neue DIN EN 50678 / 50699](https://mebedo-ac.de/blog/die-neue-din-en-50678-vde-0701-und-din-en-50699-vde-0702/) – R_PE-Formel für Leiter > 1,5 mm²

*Hinweis: Diese Analyse ersetzt keine Normprüfung durch eine verantwortliche Elektrofachkraft.*

---

## 8. Umsetzungsstand v0.8.0 (24.09.2026)

| Punkt | Status | Umsetzung |
|---|---|---|
| K1 Text in Messfeldern | ✅ behoben | `zahlPruefen()` (feld-renderer.js): ungültig = rot + Meldung, zählt nicht als ausgefüllt, PDF-Zelle rot. Zahlentastatur (`inputmode="decimal"`) in allen Zahlenfeldern + RCD I_n/I_Δn + Querschnitt |
| K2 negative Werte | ✅ behoben | Standard: Messwert ≥ 0 (Ausnahme per `negativ:true` in der Masterbibliothek) |
| K3 Tausenderpunkt | ✅ behoben | „1.000“ → Meldung „Tausendertrennzeichen?“, „0.125“ bleibt erlaubt |
| K4 Widersprüche | ✅ behoben | `beiMangelNicht` an FIN-02/03/04, GER-13 → PDF gesperrt (auch „Trotzdem“). FIN-09 Pflicht bei Mängeln |
| K5 Stromkreis „Nein“ | ✅ behoben | eingeklappte Messungen keine Pflicht |
| N6 R_PE Anlage | ✅ angepasst | l / (56 · A) + 0,1 Ω aus LTG-02/LTG-06, ohne Daten 1 Ω Richtwert |
| N8 Sicherungen | ✅ ergänzt | gG/NH/Neozed/Diazed mit I_a-Tabelle (0,4 s / 5 s), LS K (14×) und Z (3×) |
| N9 Geräte | ✅ angepasst | GER-14/15 Heizelemente, SK III R_ISO 0,25 MΩ, SK II direkt 0,5 mA, Querschnitt (LTG-06) mit Formel > 1,5 mm², R_PE-Zuschlag anteilig, GER-10 „entfällt (ohne Verbraucher)“ |
| Nebenbei | ✅ | I_K wird geleert, wenn Z_S gelöscht wird (B4); berechnete Werte mit Komma (B5) |
| Offen | – | K6, N1–N5, N7, N10–N12, B1–B3, B6–B14 |
