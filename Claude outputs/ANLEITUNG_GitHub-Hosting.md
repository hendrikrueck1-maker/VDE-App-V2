# VDE Prüf App auf GitHub hosten – Schritt für Schritt

**Ergebnis:** Die App läuft unter `https://DEIN-NAME.github.io/vde-pruef-app-v2/`, lässt sich auf Handy, Tablet und PC
installieren und funktioniert danach offline. Kosten: keine (öffentliches Repository).

**Du brauchst:**

- die Datei **`vde-pruef-app_v0.8.2.zip`** (liegt in deinem Ordner unter „Claude outputs“)
- einen PC mit Chrome oder Edge
- ca. 15 Minuten

---

## Schritt 0 – Vorhandene Daten sichern (nur wenn du die App schon benutzt)

Die App speichert alles im Browser, und zwar **je Adresse**. Unter der neuen GitHub-Adresse ist die App deshalb zuerst leer.

1. Die bisherige App öffnen → **Hauptseite → Datensicherung → „Daten exportieren“**.
2. Die Datei `vde-pruefapp-sicherung_JJJJ-MM-TT.json` aufheben. In Schritt 7 wird sie wieder eingespielt.

---

## Schritt 1 – ZIP entpacken

1. Rechtsklick auf `vde-pruef-app_v0.8.2.zip` → **„Alle extrahieren …“**.
2. Du bekommst den Ordner **`vde-pruef-app`** mit 67 Dateien. Darin liegen unter anderem `index.html`, `manifest.json`, `sw.js` und die Ordner `css`, `js`, `icons` und `docs`.

> Die Ordner `Claude outputs` und `vde-pruef-app-v2` aus deinem Arbeitsordner gehören **nicht** ins Repository. Sie sind im ZIP deshalb nicht enthalten.

---

## Schritt 2 – GitHub-Konto anlegen

1. <https://github.com> öffnen → **Sign up**.
2. E-Mail-Adresse, Passwort und **Benutzername** festlegen. Der Benutzername steht später in der Adresse,
   z. B. `hendrikrueck` → `https://hendrikrueck.github.io/…`.
3. E-Mail-Adresse bestätigen.

---

## Schritt 3 – Repository anlegen

1. Oben rechts auf **„+“** klicken → **„New repository“**.
2. **Repository name:** `vde-pruef-app-v2` – **ohne Umlaute und Leerzeichen**. Aus „ü“ macht GitHub sonst einen Bindestrich (z. B. `VDE-Pr-fung-V2`).
3. **Description** (optional): `Prüfprotokolle nach DIN VDE 0100-600 / 0105-100 und DIN EN 50678 / 50699`
4. **Public** auswählen. GitHub Pages ist nur bei öffentlichen Repositories kostenlos.
   Es wird nur der Programmcode öffentlich, **keine Prüfdaten**. Die bleiben auf deinen Geräten.
5. Die Häkchen bei „Add a README“, „.gitignore“ und „license“ **nicht** setzen. Diese Dateien sind schon im ZIP.
6. **„Create repository“** klicken.

---

## Schritt 4 – Dateien hochladen

1. Im neuen, leeren Repository auf den Link **„uploading an existing file“** klicken.
   (Später heißt der Weg: **„Add file“ → „Upload files“**.)
2. Im Windows-Explorer den entpackten Ordner `vde-pruef-app` **öffnen**.
3. Mit **Strg + A** alles markieren. Das umfasst die Ordner `css`, `docs`, `icons` und `js` sowie alle Dateien.
4. Alles in das Upload-Feld im Browser ziehen.
   Ziehe den **Inhalt** des Ordners, nicht den Ordner selbst. Sonst liegt alles eine Ebene zu tief.
5. Warten, bis alle Dateien aufgelistet sind (67 Stück).
6. Unten bei „Commit changes“ eintragen: `Version 0.8.2` → **„Commit changes“**.
7. Kontrolle: In der Dateiliste des Repositorys müssen `index.html` und `manifest.json` **direkt oben** stehen,
   nicht in einem Unterordner.

> Fehlen die Dateien `.gitignore` und `.nojekyll`, ist das kein Problem. Windows blendet Dateien mit Punkt am Anfang manchmal aus.

---

## Schritt 5 – GitHub Pages einschalten

1. Im Repository auf **„Settings“** (Zahnrad, oben) klicken.
2. Links auf **„Pages“** klicken.
3. **Source:** `Deploy from a branch`
4. **Branch:** `main` und Ordner `/ (root)` auswählen → **„Save“**.
5. 1–2 Minuten warten und die Seite neu laden. Oben erscheint:
   **„Your site is live at https://DEIN-NAME.github.io/vde-pruef-app-v2/“**
6. Die Adresse öffnen. Die Hauptseite der App erscheint.

---

## Schritt 6 – App installieren

Die Adresse auf dem jeweiligen Gerät **einmal online** öffnen und warten, bis die Hauptseite geladen ist.

| Gerät | So geht's |
|---|---|
| **Android (Chrome)** | Menü **⋮** → **„App installieren“** bzw. „Zum Startbildschirm hinzufügen“ |
| **iPhone / iPad (Safari)** | Teilen-Symbol **□↑** → **„Zum Home-Bildschirm“** → „Hinzufügen“ |
| **PC (Chrome / Edge)** | Rechts in der Adressleiste auf das Symbol **„App installieren“** (Bildschirm mit Pfeil) klicken |

Kontrolle: **Hauptseite → Version & Update** muss **„0.8.2“** und **„Aktiv – die App ist offline nutzbar“** zeigen.
Danach funktioniert die App auch ohne Netz, z. B. im Keller.

> iPhone/iPad: Die App immer über das Symbol auf dem Home-Bildschirm starten, nicht über Safari. Nur dann bleiben die Daten zuverlässig erhalten.

---

## Schritt 7 – Daten übernehmen (falls in Schritt 0 gesichert)

1. In der neuen App: **Hauptseite → Datensicherung → „Daten importieren …“**.
2. Die Sicherungsdatei wählen → **„Zusammenführen“**.
3. Stammdaten, Protokolle und Archiv sind wieder da. Die Nummernzähler laufen weiter.

Auf jedem weiteren Gerät (z. B. Tablet) genauso vorgehen. Jedes Gerät hat seinen eigenen Datenbestand.

---

## Später: ein Update veröffentlichen

1. Vor dem Hochladen in **`js/app-config.js`** die beiden Zeilen erhöhen, beide auf dieselbe Nummer:
   ```
   const APP_VERSION = '0.8.3';
   const SW_VERSION  = '0.8.3';
   ```
   Ohne diese Änderung merken die installierten Apps nichts vom Update.
2. Im Repository **„Add file“ → „Upload files“** → die geänderten Dateien in derselben Ordnerstruktur hineinziehen.
   Gleichnamige Dateien werden überschrieben. → **„Commit changes“**.
3. 1–2 Minuten warten, bis GitHub die Seite neu veröffentlicht hat. Den Stand siehst du im Repository unter **„Actions“**: ein grüner Haken bedeutet fertig.
4. In der App: **Hauptseite → Version & Update → „Nach Updates suchen“ → „Update verfügbar – jetzt neu laden“**.

Prüfdaten bleiben bei Updates erhalten. Trotzdem vor größeren Updates kurz „Daten exportieren“.

---

## Wichtig: Nur saubere Dateien ins Repository

Lade **nur den Inhalt der ZIP-Datei** hoch, niemals den ganzen Arbeitsordner. Die Ordner `Claude outputs` und
`vde-pruef-app-v2` sowie Dateien älterer Versionen (`service-worker.js`, `app.js`, `vde0100.html`, `style.css` …)
gehören nicht hinein. Alte Dateien können eine veraltete App-Version auf dem Handy festhalten.

**Aufräumen, wenn es schon passiert ist:** Repository → **Settings → General** → ganz unten „Danger Zone“ →
**„Delete this repository“**. Danach Schritt 3–6 mit einem neuen, sauberen Repository wiederholen.
Die Prüfdaten auf dem Handy bleiben erhalten: Sie hängen an `DEIN-NAME.github.io`, nicht am Repository-Namen.
Das alte App-Symbol auf dem Handy vorher entfernen: lange drücken → **„Deinstallieren“**.

**Mehrere Apps unter einem Konto:** Alle Repositories laufen unter derselben Adresse `DEIN-NAME.github.io` und teilen
sich den Offline-Speicher. Die VDE Prüf App lädt fehlende Dateien seit Version 0.8.2 selbst nach, sobald Internet da ist.

## Häufige Probleme

| Problem | Lösung |
|---|---|
| Android: **„App konnte nicht geöffnet werden“** | Altes App-Symbol lange drücken → „Deinstallieren“. Die App-Adresse in Chrome **mit Internet** öffnen, 10 Sekunden warten, dann Menü ⋮ → „App installieren“. Prüfen, ob im Repository nur die Dateien aus der ZIP liegen (siehe oben). |
| Seite zeigt **404** | Liegt `index.html` im Repository ganz oben? Wenn nicht, wurde der Ordner statt seines Inhalts hochgeladen: Dateien löschen und Schritt 4 wiederholen. Nach dem Einschalten von Pages bis zu 10 Minuten warten. |
| Kein **„App installieren“** | Die Seite muss über **https** laufen (GitHub Pages macht das automatisch) und einmal vollständig geladen sein. Seite neu laden und 30 Sekunden warten. |
| Update kommt nicht an | `APP_VERSION` **und** `SW_VERSION` erhöht? Dann „Nach Updates suchen“. Notfalls „Offline-Speicher zurücksetzen“ – das löscht **keine** Prüfdaten. |
| Daten auf dem Handy weg | Andere Adresse oder anderer Browser? Jede Adresse und jeder Browser hat einen eigenen Speicher. Deshalb regelmäßig exportieren. |
| PDF wird nicht gespeichert | Am Handy im Teilen-/Sichern-Dialog „In Dateien sichern“ bzw. „Herunterladen“ wählen. Das Archiv in der App enthält jedes PDF zusätzlich. |

---

## Gut zu wissen

- **Öffentlich heißt:** Jeder mit dem Link kann die App benutzen und den Code ansehen, aber **niemand sieht deine Protokolle**.
- **Lizenz:** Ohne Lizenzdatei bleiben alle Rechte bei dir. Soll die App frei nutzbar sein, im Repository **„Add file“ → „Create new file“** → Name `LICENSE` → rechts „Choose a license template“ (z. B. MIT) wählen.
- **Private Repository:** GitHub Pages für private Repositories gibt es nur mit einem kostenpflichtigen Plan (GitHub Pro).
