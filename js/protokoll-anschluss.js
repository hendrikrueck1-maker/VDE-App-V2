/* =========================================================================
   BAUPLAN – Prüfprotokoll Anschlussprüfung (anschlusspruefung.html)

   EIN Protokoll = EIN Anschluss (Übergabepunkt). Kein Karussell, keine
   Wiederholung – für einen weiteren Anschluss ein neues Protokoll starten.

   HIER wird das Protokoll korrigiert. Nur Feld-IDs aus der Masterbibliothek
   (js/felder-daten.js) – Label, Optionen, Grenzwerte, Hilfen kommen von dort.
   Aufbau der Einträge: siehe Kopf von js/protokoll-anlage.js.
   ========================================================================= */
const BAUPLAN_ANSCHLUSS = {
  typ: 'anschluss',
  titel: 'Prüfprotokoll Anschlussprüfung',
  untertitel: 'Temporäre Einspeisung / Übergabepunkt nach DIN VDE 0100-600 / DIN VDE 0105-100',
  /* PDF-Funktionen aus js/pdf-anschluss.js (Aufbau des PDFs: PDF_PLAN_ANSCHLUSS dort) – zwingend 1 Seite + Fotos */
  pdf: { ausgefuellt:'pdfAnschlussAusgefuellt', leer:'pdfAnschlussLeer' },

  abschnitte: [
    { id:'B1', titel:'Protokollkopf & Stammdaten',
      hinweis:'Vorbelegt aus den zentralen Stammdaten der Hauptseite. Änderungen hier gelten nur für dieses Protokoll.',
      felder:[
        'STAM-01', 'STAM-01-a', 'STAM-02', 'STAM-03', 'STAM-08', 'STAM-22', 'STAM-23',
        { id:'STAM-05', anpassen:{ knopf:null, hinweis:'Beim Anlegen automatisch vergeben (ANS/TT/MM/JJJJ/Nr.), nicht änderbar.' } },
        { id:'STAM-13', anpassen:{ options:['Neuanlage','Bestand','Änderung','Wiederholung'] } },
        { id:'STAM-14', anpassen:{ options:['DIN VDE 0100-600','DIN VDE 0105-100','DIN VDE 0100-600 / 0105-100'] } },
        'STAM-06', 'STAM-07', 'STAM-09', 'STAM-10' ]},

    { id:'B2', titel:'Übergabepunkt & Vermieter',
      hinweis:'Ein Protokoll je Anschluss. Für einen weiteren Übergabepunkt ein neues Protokoll starten.',
      felder:[ 'STAM-20', 'STAM-04', 'STAM-16', 'STAM-18', 'STAM-19', 'STAM-21', 'NMESS-10' ]},

    { id:'B3', titel:'Netzsystem & Einspeisung',
      felder:[ 'NETZ-01', 'NETZ-02', 'NETZ-03', 'NETZ-04', 'NETZ-05' ]},

    { id:'B4', titel:'Generator / Netzersatzanlage',
      hinweis:'Erscheint nur, wenn bei NETZ-05 „NEA“ gewählt ist.',
      sichtbarWenn:{ feld:'NETZ-05', enthaelt:'NEA' },
      felder:[ 'GEN-01', 'GEN-02', 'GEN-03', 'GEN-04', 'GEN-05' ]},

    { id:'B5', titel:'Anschlussleitung',
      felder:[ 'LTG-04', 'LTG-05', 'LTG-06', 'LTG-02' ]},

    { id:'B6', titel:'Schritt 1 · Besichtigen (vor dem Messen)',
      hinweis:'Anschluss noch NICHT zugeschaltet. Sichtprüfung aller Betriebsmittel am Übergabepunkt.',
      felder:[ 'BES-01', 'BES-02', 'BES-10', 'BES-04', 'BES-09', 'BES-07', 'BES-05', 'BES-08', 'BES-03', 'BES-11' ]},

    { id:'B7', titel:'Schritt 2 · Spannungsfrei messen (vor dem Zuschalten)',
      hinweis:'Anschluss noch NICHT zugeschaltet: Schutzleiter, Isolation, Durchgang und Erdung messen.',
      gruppen:[
        { titel:'2.1 – 2.3 Schutzleiter, Isolation & Durchgang', felder:[ 'RPE-01', { block:'RISO-01' }, 'LTG-01' ]},
        { titel:'2.4 – 2.5 Erdung & Potenzialausgleich', felder:[ 'ERD-01', 'ERD-03', 'ERD-02', { id:'ERD-04', breit:true } ]}
      ]},

    { id:'B8', titel:'Schritt 3 · Unter Spannung messen (nach dem Zuschalten)',
      hinweis:'Jetzt zuschalten: Netzspannung, Drehfeld, Schleifen-/Netzimpedanz und RCD messen.',
      gruppen:[
        { titel:'3.1 – 3.4 Netzspannung, Frequenz & Drehfeld', felder:[ { block:'NMESS-01' }, 'NMESS-09' ]},
        { titel:'3.5 – 3.6 Absicherung, Schleifen- & Netzimpedanz', felder:[ { block:'ZNS-01', titel:'Schleifen- und Netzimpedanz mit Kurzschlussstrom' } ]},
        { titel:'3.7 – 3.9 Fehlerstrom-Schutzeinrichtung (RCD)', felder:[ { block:'RCD-01' } ]}
      ]},

    { id:'B9', titel:'Schritt 4 · Erproben (zum Schluss, unter Spannung)',
      felder:[ 'ERP-01', 'ERP-03', 'ERP-04', { id:'ERP-05', pflichtWenn:'rcdVorhanden' }, 'ERP-06' ]},

    { id:'B11', titel:'Fotodokumentation',
      hinweis:'Fotos erscheinen im PDF auf einer eigenen Seite nach dem Protokoll.',
      felder:[ { id:'SK-03', breit:true, anpassen:{ name:'Fotos Übergabepunkt' } } ]},

    { id:'B10', titel:'Gesamtbewertung & Unterschriften',
      felder:[
        'FIN-02', 'FIN-04', 'FIN-03',
        { id:'FIN-09', breit:true },
        'FIN-10', 'FIN-11' ]}
  ]
};
