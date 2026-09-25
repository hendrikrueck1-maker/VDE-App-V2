# Änderungen

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
