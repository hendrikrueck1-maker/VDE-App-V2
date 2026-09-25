/* =========================================================================
   BAUPLAN – Prüfprotokoll elektrischer Anlagen (anlagenpruefung.html)

   HIER wird das Protokoll korrigiert. Nur Feld-IDs aus der Masterbibliothek
   (js/felder-daten.js) – Label, Optionen, Grenzwerte, Hilfen kommen von dort.

   Abschnitt  { id, titel, hinweis?, felder:[…] | gruppen:[{titel, felder}],
                sichtbarWenn?:{feld, enthaelt}, wiederholen?:{…} }
   Feld       'STAM-01'                         Einzelfeld
              'ZNS-01-b'                        Unterfeld eines Blocks
              {block:'RCD-01', nur?:['a','b'], titel?}   ganzer Block / Auswahl
              {id:'STAM-05', anpassen:{…}}      protokollspezifische Abweichung
              {id:'FIN-01', automatisch:true}   wird berechnet, nicht klickbar
              {id:'ERP-05', pflichtWenn:'rcdVorhanden'}  Bedingung aus feld-logik.js
              {id:'…', breit:true}              über die ganze Zeile
              {id:'…', sichtbarWenn:{feld, gleich|enthaelt}}  nur sichtbar, wenn Bedingung erfüllt
   Gruppe     {titel, felder, einklappbar?}   einklappbar: klappt bei wiederholen.einklappenWenn zu
   wiederholen { schluessel (Speicher, = anzahlKey in app-config.js), einzahl, mehrzahl,
                 einklappenWenn:{feld, gleich} (klappt Gruppen mit einklappbar:true zu),
                 titelFeld, kopieren:[IDs, die „Duplizieren" übernimmt] }
   ========================================================================= */
const BAUPLAN_ANLAGE = {
  typ: 'anlage',
  titel: 'Prüfprotokoll elektrischer Anlagen',
  untertitel: 'Erst-, Wiederholungs- und Änderungsprüfung nach DIN VDE 0100-600 / DIN VDE 0105-100',
  /* PDF-Funktionen aus js/pdf-anlage.js (Aufbau des PDFs: PDF_PLAN_ANLAGE dort) */
  pdf: { ausgefuellt: 'pdfAnlageAusgefuellt', leer: 'pdfAnlageLeer' },

  abschnitte: [
    { id:'A1', titel:'Protokollkopf & Stammdaten',
      hinweis:'Vorbelegt aus den zentralen Stammdaten der Hauptseite. Änderungen hier gelten nur für dieses Protokoll.',
      felder:[
        'STAM-01', 'STAM-01-a', 'STAM-02', 'STAM-03', 'STAM-04', 'STAM-08', 'STAM-22', 'STAM-23',
        { id:'STAM-05', anpassen:{ knopf:null, hinweis:'Beim Anlegen automatisch vergeben (ANL/TT/MM/JJJJ/Nr.), nicht änderbar.' } },
        'STAM-13', 'STAM-14', 'STAM-06', 'STAM-07', 'STAM-09', 'STAM-10' ]},

    { id:'A2', titel:'Netzsystem & Einspeisung',
      felder:[ 'NETZ-01', 'NETZ-02', 'NETZ-03', 'NETZ-04', 'NETZ-05' ]},

    { id:'A3', titel:'Generator / Netzersatzanlage',
      hinweis:'Erscheint nur, wenn bei NETZ-05 „NEA“ gewählt ist.',
      sichtbarWenn:{ feld:'NETZ-05', enthaelt:'NEA' },
      felder:[ 'GEN-01', 'GEN-02', 'GEN-03', 'GEN-04', 'GEN-05' ]},

    { id:'A4', titel:'Netzmessung am Speisepunkt',
      felder:[ { block:'NMESS-01' }, 'NMESS-09' ]},

    { id:'A5', titel:'Besichtigen',
      felder:[ 'BES-01', 'BES-02', 'BES-03', 'BES-04', 'BES-05', 'BES-06', 'BES-07', 'BES-08', 'BES-09' ]},

    { id:'A6', titel:'Anschlusskabel der Anlage',
      felder:[ 'LTG-04', 'LTG-05', 'LTG-06', 'LTG-02' ]},

    { id:'A7', titel:'Stromkreise – Messen',
      hinweis:'Je Stromkreis eine Karte – wischen oder Pfeile zum Blättern. „Duplizieren“ übernimmt Kabel und Schutzeinrichtung, nie Messwerte. „Stromkreis in Ordnung: Nein“ klappt die Messungen ein und verlangt eine Bemerkung.',
      wiederholen:{ schluessel:'stromkreise', einzahl:'Stromkreis', mehrzahl:'Stromkreise', titelFeld:'SK-01',
        einklappenWenn:{ feld:'SK-02', gleich:'Nein' },
        kopieren:[ 'LTG-04', 'LTG-06', 'RISO-01-a', 'ZNS-01-a', 'RCD-01-a', 'RCD-01-b', 'RCD-01-c', 'RCD-01-c2', 'RCD-01-f', 'RCD-01-g' ] },
      gruppen:[
        { titel:'Stromkreis', felder:[ 'SK-01', 'LTG-04', 'LTG-06', 'LTG-02' ]},
        { titel:'1. Schutzleiter & Isolation', einklappbar:true, felder:[ 'RPE-01', { block:'RISO-01' } ]},
        { titel:'2. Absicherung, Schleifen- & Netzimpedanz', einklappbar:true, felder:[ { block:'ZNS-01', titel:'Schleifen- und Netzimpedanz mit Kurzschlussstrom' } ]},
        { titel:'3. Fehlerstrom-Schutzeinrichtung (RCD)', einklappbar:true, felder:[ { block:'RCD-01' } ]},
        { titel:'4. Durchgängigkeit', einklappbar:true, felder:[ 'LTG-01' ]},
        { titel:'Ergebnis Stromkreis', felder:[
          { id:'SK-02', breit:true },
          { id:'FIN-09', breit:true, sichtbarWenn:{ feld:'SK-02', gleich:'Nein' },
            anpassen:{ name:'Bemerkung zum Stromkreis', pflicht:'Pflicht', pflichtWenn:null, hinweis:'Pflicht bei „Nein“: Was ist nicht in Ordnung, was ist zu tun?' } },
          { id:'SK-03', breit:true } ]}
      ]},

    { id:'A8', titel:'Erdung & Potenzialausgleich',
      felder:[ 'ERD-01', 'ERD-03', 'ERD-02', { id:'ERD-04', breit:true } ]},

    { id:'A9', titel:'Erproben',
      felder:[ 'ERP-01', 'ERP-03', 'ERP-04', { id:'ERP-05', pflichtWenn:'rcdVorhanden' }, 'ERP-06' ]},

    { id:'A10', titel:'Gesamtbewertung & Unterschriften',
      felder:[
        'FIN-02', 'FIN-04', 'FIN-03',
        { id:'FIN-09', breit:true },
        'FIN-10', 'FIN-11' ]}
  ]
};
