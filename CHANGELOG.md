# Änderungen

## 0.8.3 – Mängel finden
- Mängel-Chip in der Statusleiste antippen: bei einem Mangel direkt zum Feld, bei mehreren eine Liste zum Hinspringen.
- Felder, die als Mangel zählen, haben einen roten Rand (einfarbige Felder zusätzlich „zählt als Mangel“).
- ERD-01 „Zusätzlicher Potenzialausgleich vorhanden: Nein“ ist kein Mangel mehr – nicht jede Anlage hat oder braucht einen.
- STAM-03 „Anlage / Objekt“ aus Anlagen- und Anschlussprotokoll (App und PDF) entfernt. PDF-Kopf der Anlagenprüfung zeigt
  jetzt „Bereich / Gebäude“ (STAM-02); Übersicht/Archiv: Anlage → STAM-02, Anschluss → Standort Übergabepunkt (STAM-20).
- Geräteprüfung: Hinweistext zur Prüfnorm (STAM-14) passt jetzt zu Geräten (EN 50699 / EN 50678).
- Anlagenprüfung: „Grund der Prüfung“ und „Prüfnorm“ bieten keine Geräte-Optionen mehr an.

## 0.8.2 – Android-Startfehler behoben
- Offline-Cache repariert sich selbst: Andere Web-Apps unter derselben github.io-Adresse löschen beim Aktualisieren
  fremde Caches – fehlende App-Dateien werden jetzt bei jedem Aufruf mit Internet still nachgeladen.
- Offline ohne gespeicherte Dateien erscheint eine verständliche Ersatzseite statt „App konnte nicht geöffnet werden“.
- „Offline-Speicher zurücksetzen“ meldet nur noch den eigenen Service Worker ab (vorher alle der Domain).
- Manifest mit fester App-Kennung (`id`).

## 0.8.1 – erste Veröffentlichung auf GitHub
- Installierbar als App: `manifest.json`, App-Icons, Apple-Touch-Icon, Theme-Farbe auf allen Seiten.
- Browser wird gebeten, die Prüfdaten dauerhaft zu speichern (`navigator.storage.persist`).
- Texte gekürzt und vereinheitlicht; Platzhalter „App-Anleitung folgt“ entfernt; „Feld-IDs anzeigen“ standardmäßig aus;
  Masterbibliothek mit Link zurück zur Hauptseite; Gerätetester in den Stammdaten optional (Pflicht nur in der Geräteprüfung).
- Lizenztext der PDF-Schrift ergänzt, Entwicklerdoku nach `docs/ENTWICKLER.md` verschoben.

## 0.8.0
- Zahlenfelder: Zahlentastatur, Prüfung auf Text, negative Werte und Tausenderpunkt.
- Widersprüche zur Mängelbewertung sperren das PDF; Bemerkung bei Mängeln Pflicht.
- Stromkreis „nicht in Ordnung“: eingeklappte Messungen keine Pflicht.
- R_PE Anlage aus Länge und Querschnitt; Sicherungen gG/NH/Neozed/Diazed, LS K/Z.
- Geräteprüfung: Heizelemente, SK III mit R_ISO, Querschnitt, Ableitstrom „entfällt“.

## 0.7.x
- Anschluss- und Geräteprüfung mit einseitigem PDF und Prüfablauf, Fotodokumentation.

## 0.5.0 – 0.6.0
- Archiv (Ansehen, Teilen, ZIP, erneute Prüfung), Anschluss- und Geräteprüfung.

## 0.4.0
- PDF-Export der Anlagenprüfung.
