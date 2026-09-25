/* =========================================================================
   BAUPLAN – Prüfprotokoll elektrischer Geräte (geraetepruefung.html)

   EIN Protokoll = EIN Gerät. Kein Karussell, keine Wiederholung – für das
   nächste Gerät ein neues Protokoll starten.

   HIER wird das Protokoll korrigiert. Nur Feld-IDs aus der Masterbibliothek
   (js/felder-daten.js) – Label, Optionen, Grenzwerte, Hilfen kommen von dort.
   Grenzwerte GER-05 / GER-05c / GER-09 und das Ausblenden je Schutzklasse:
   GRENZWERTE.GER_* (felder-daten.js) + REGELN ger* (feld-logik.js).
   Aufbau der Einträge: siehe Kopf von js/protokoll-anlage.js.
   ========================================================================= */
const BAUPLAN_GERAETE = {
  typ: 'geraete',
  titel: 'Prüfprotokoll elektrischer Geräte',
  untertitel: 'Prüfung nach DIN EN 50678 (nach Reparatur) / DIN EN 50699 (Wiederholungsprüfung)',
  /* PDF-Funktionen aus js/pdf-geraete.js (Aufbau des PDFs: PDF_PLAN_GERAETE dort) – zwingend 1 Seite + Fotos */
  pdf: { ausgefuellt:'pdfGeraetAusgefuellt', leer:'pdfGeraetLeer' },

  abschnitte: [
    { id:'C1', titel:'Protokollkopf & Stammdaten',
      hinweis:'Vorbelegt aus den zentralen Stammdaten der Hauptseite. Änderungen hier gelten nur für dieses Protokoll.',
      felder:[
        'STAM-01', 'STAM-01-a', 'STAM-02', 'STAM-08', 'STAM-22', 'STAM-23',
        { id:'STAM-05', anpassen:{ knopf:null, hinweis:'Beim Anlegen automatisch vergeben (GP/TT/MM/JJJJ/Nr.), nicht änderbar.' } },
        { id:'STAM-13', anpassen:{ options:['Erstprüfung (Gerät)','Wiederholungsprüfung (Gerät)','Prüfung nach Reparatur (Gerät)'] } },
        { id:'STAM-14', anpassen:{ options:['DIN EN 50678 (ersetzt VDE 0701)','DIN EN 50699 (ersetzt VDE 0702)','DIN VDE 0701-0702'],
          hinweis:'Gerät: EN 50699 = Wiederholungsprüfung, EN 50678 = nach Reparatur/Änderung. „Welche Norm wann?“ erklärt alle Fälle.' } },
        'STAM-06', 'STAM-07',
        { id:'STAM-11', anpassen:{ pflicht:'Pflicht', hinweis:null } }, { id:'STAM-12', anpassen:{ pflicht:'Pflicht', hinweis:'Steht auf dem Typenschild des Gerätetesters.' } } ]},

    { id:'C2', titel:'Gerät',
      hinweis:'Ein Protokoll je Gerät. Für das nächste Gerät ein neues Protokoll starten.',
      felder:[ 'GER-02', 'GER-04', 'GER-03', 'GER-06', 'GER-07', 'GER-14', 'GER-15', 'GER-08',
        { id:'LTG-06', anpassen:{ name:'Leitungsquerschnitt', quick:['0,75 mm²','1,0 mm²','1,5 mm²','2,5 mm²','4 mm²'],
          hinweis:'Querschnitt der Anschlussleitung – bestimmt mit der Länge den R_PE-Grenzwert.' } } ]},

    { id:'C3', titel:'Sichtprüfung',
      felder:[ { id:'GER-11', breit:true } ]},

    { id:'C4', titel:'Messen',
      hinweis:'Grenzwerte passen sich automatisch an Schutzklasse, Heizelemente, Leitung und Messmethode an. SK II: kein R_PE · SK III: nur R_ISO.',
      gruppen:[
        { titel:'1. Schutzleiterwiderstand', felder:[ 'GER-05' ]},
        { titel:'2. Isolationswiderstand', felder:[ 'GER-05b', 'GER-05c' ]},
        { titel:'3. Ableitstrom', felder:[ 'GER-10', 'GER-09' ]}
      ]},

    { id:'C5', titel:'Funktionsprüfung',
      felder:[ { id:'GER-12', breit:true } ]},

    { id:'C7', titel:'Fotodokumentation',
      hinweis:'Fotos erscheinen im PDF auf einer eigenen Seite nach dem Protokoll.',
      felder:[ { id:'SK-03', breit:true, anpassen:{ name:'Fotos Gerät' } } ]},

    { id:'C6', titel:'Ergebnis & Unterschriften',
      felder:[
        'GER-13', 'FIN-03',
        { id:'FIN-09', breit:true },
        'FIN-10', 'FIN-11' ]}
  ]
};
