/* =========================================================================
   Zentrale Konstanten der VDE-Prüf-App V2 – EINZIGE Stelle für Versionen,
   Protokolltypen, Nummernformat und Speicher-Schlüssel.
   Wird von den Seiten (<script>) UND vom Service Worker (importScripts)
   gelesen. Deshalb nur Konstanten und reine Funktionen, kein DOM-Zugriff.

   Version hochzählen: APP_VERSION und SW_VERSION gemeinsam ändern.
   Der Cache-Name enthält SW_VERSION → neue Version = neuer Offline-Cache.
   ========================================================================= */

const APP_VERSION = '0.8.2';
const SW_VERSION  = '0.8.2';
const SCHEMA_VERSION = 2;                 /* Format von Datenbank und Sicherungsdatei (2 = mit Archiv) */
const APP_NAME = 'VDE Prüf App V2';
const CACHE_PREFIX = 'vde2-cache-';
const CACHE_NAME = CACHE_PREFIX + SW_VERSION;

/* ---------------- Protokolltypen ----------------
   schluessel  interne ID (Speicher, Nummernzähler)
   name        Anzeigename
   praefix     Nummern-Präfix (siehe NUMMER_FORMAT)
   zielseite   Datei der Protokollseite ODER null, solange nicht gebaut
               → null: keine Nummer, kein Entwurf, nur Hinweis
   einheit     Zähl-Einheit in der Übersicht
   anzahlKey   Feld im Entwurf (daten[anzahlKey]), dessen Länge/Wert gezählt wird
               → null: EIN Prüfling je Protokoll (Anzahl immer 1)
   feldObjekt  Feld, das in Übersicht/Archiv als „Anlage / Objekt" erscheint (Standard FELD_ANLAGE)
   vorlage     „Erneute Prüfung" im Archiv: felder, listeFelder, setzen, text (Hinweis im Dialog)
   Neue Protokollseite fertig? Nur `zielseite` eintragen. */
const PROTOKOLL_TYPEN = [
  { schluessel:'anlage',    name:'Prüfprotokoll elektrischer Anlagen', kurz:'Anlagen',
    praefix:'ANL', zielseite:'anlagenpruefung.html', einheit:'Stromkreise',    anzahlKey:'stromkreise',
    beschreibung:'Erst-, Wiederholungs- und Änderungsprüfung nach DIN VDE 0100-600 / 0105-100.',
    /* „Erneute Prüfung als Vorlage" (Archiv): was aus dem alten Protokoll übernommen wird.
       Nie übernommen: Messwerte, Ergebnisse, Bemerkung, Unterschriften, Fotos, Prüfdatum, Nummer.
       Prüfer, Qualifikation und Prüfgerät kommen aus den aktuellen Stammdaten. */
    vorlage:{
      felder:[ 'STAM-01','STAM-01-a','STAM-02','STAM-03','STAM-04','STAM-22',
               'NETZ-01','NETZ-02','NETZ-03','NETZ-04','NETZ-05','GEN-01','GEN-02','GEN-03','GEN-04','GEN-05',
               'NMESS-01-a','LTG-04','LTG-05','LTG-06','LTG-02','ERD-01','ERD-04' ],
      listeFelder:[ 'SK-01','LTG-04','LTG-06','LTG-02','RISO-01-a','ZNS-01-a',
                    'RCD-01-a','RCD-01-b','RCD-01-c','RCD-01-c2','RCD-01-f','RCD-01-g' ],
      setzen:{ 'STAM-13':'Wiederholung', 'STAM-14':'DIN VDE 0105-100' },
      text:'Objekt, Netz & Einspeisung, Anschlusskabel und alle Stromkreise mit Kabel und Schutzeinrichtungen'
    } },
  { schluessel:'anschluss', name:'Prüfprotokoll Anschlussprüfung',     kurz:'Anschluss',
    praefix:'ANS', zielseite:'anschlusspruefung.html', einheit:'Übergabepunkt', anzahlKey:null,
    beschreibung:'Ein Anschluss (Übergabepunkt) je Protokoll: Netzsystem, Netzmessung, Schleifenimpedanz, RCD.',
    vorlage:{
      felder:[ 'STAM-01','STAM-01-a','STAM-02','STAM-03','STAM-04','STAM-22','STAM-16','STAM-18','STAM-19','STAM-20','STAM-21','NMESS-10',
               'NETZ-01','NETZ-02','NETZ-03','NETZ-04','NETZ-05','GEN-01','GEN-02','GEN-03','GEN-04','GEN-05',
               'NMESS-01-a','LTG-04','LTG-05','LTG-06','LTG-02','RISO-01-a','ZNS-01-a',
               'RCD-01-a','RCD-01-b','RCD-01-c','RCD-01-c2','RCD-01-f','RCD-01-g','ERD-01','ERD-04' ],
      setzen:{ 'STAM-13':'Wiederholung', 'STAM-14':'DIN VDE 0105-100' },
      text:'Übergabepunkt, Vermieter, Netz & Einspeisung, Anschlussleitung und Schutzeinrichtungen'
    } },
  { schluessel:'geraete',   name:'Prüfprotokoll elektrischer Geräte',  kurz:'Geräte',
    praefix:'GP',  zielseite:'geraetepruefung.html', einheit:'Gerät', anzahlKey:null, feldObjekt:'GER-02',
    beschreibung:'Ein Gerät je Protokoll nach DIN EN 50678 / 50699 (vormals VDE 0701-0702).',
    vorlage:{
      felder:[ 'STAM-01','STAM-01-a','STAM-02','STAM-22','GER-02','GER-03','GER-04','GER-06','GER-07','GER-14','GER-15','GER-08','LTG-06','GER-05b','GER-10' ],
      setzen:{ 'STAM-13':'Wiederholungsprüfung (Gerät)', 'STAM-14':'DIN EN 50699 (ersetzt VDE 0702)' },
      text:'Standort, Gerätedaten, Schutzklasse und Messmethoden'
    } }
];

function protokollTyp(schluessel){
  return PROTOKOLL_TYPEN.find(t=>t.schluessel===schluessel) || null;
}
/* Feld für „Anlage / Objekt" je Typ (Geräte: Gerätebezeichnung) */
function objektFeld(typSchluessel){
  const t = protokollTyp(typSchluessel);
  return (t && t.feldObjekt) || FELD_ANLAGE;
}

/* Protokollnummer: <ABK>/<TT>/<MM>/<JJJJ>/<Nr., 3-stellig>, z. B. ANL/24/09/2026/001.
   Zähler je Typ und Tag (Datum des Anlegens), zählt nur hoch. */
const NUMMER_STELLEN = 3;
function NUMMER_FORMAT(praefix, datum, lfd){
  const p = n => String(n).padStart(2, '0');
  return praefix + '/' + p(datum.getDate()) + '/' + p(datum.getMonth()+1) + '/' + datum.getFullYear() + '/' + String(lfd).padStart(NUMMER_STELLEN, '0');
}
/* Zähler-Schlüssel je Typ und Tag: <typ>_<JJJJMMTT> */
function NUMMER_ZAEHLER_KEY(typSchluessel, datum){
  const p = n => String(n).padStart(2, '0');
  return typSchluessel + '_' + datum.getFullYear() + p(datum.getMonth()+1) + p(datum.getDate());
}
/* Gegenstück (Import-Absicherung der Zähler): neues Format ANL/TT/MM/JJJJ/Nr.
   → { praefix, tagKey:'JJJJMMTT', lfd }; altes Format ANL-JJJJ-NNNN → { praefix, jahr, lfd } */
function nummerZerlegen(nummer){
  const t = String(nummer||'');
  let m = /^([A-Z0-9]+)\/(\d{2})\/(\d{2})\/(\d{4})\/(\d+)$/.exec(t);
  if(m) return { praefix:m[1], tagKey:m[4]+m[3]+m[2], lfd:parseInt(m[5],10) };
  m = /^([A-Z0-9]+)-(\d{4})-(\d+)$/.exec(t);
  return m ? { praefix:m[1], jahr:parseInt(m[2],10), lfd:parseInt(m[3],10) } : null;
}

/* ---------------- Speicher-Schlüssel ----------------
   Alles Neue trägt das Präfix `vde2_`. Zwei Altschlüssel bleiben bewusst
   unverändert, weil die Masterbibliothek sie schon nutzt und der Zustand
   seitenübergreifend gelten soll:
     hilfenSichtbar  Schalter „Warum & Wie"      (vde_infokarten_sichtbar)
     listePraefix    editierbare Listen z. B. STAM-02 (liste_<Feld-ID>) */
const SPEICHER_PRAEFIX = 'vde2_';
const SPEICHER_KEYS = {
  hilfenSichtbar: 'vde_infokarten_sichtbar',
  listePraefix:   'liste_',
  pdfModus:       SPEICHER_PRAEFIX + 'pdf_modus',       /* 'download' | 'ordner' */
  pdfOrdnerName:  SPEICHER_PRAEFIX + 'pdf_ordner_name', /* nur Anzeige; Handle liegt in IndexedDB */
  feldIdsSichtbar: SPEICHER_PRAEFIX + 'feld_ids_sichtbar' /* Schalter „Feld-IDs" auf Protokollseiten */
};

/* IndexedDB */
const DB_NAME = SPEICHER_PRAEFIX + 'db';
const DB_STORES = {
  stammdaten: 'stammdaten',   /* ein Datensatz: { id:'aktuell', werte:{[feldId]:wert}, geaendert } */
  protokolle: 'protokolle',   /* Entwürfe und Abgeschlossene, Schlüssel: id */
  zaehler:    'zaehler',      /* { id:'<typ>_<JJJJMMTT>', wert:<letzte lfd. Nr.> } (alt: '<typ>_<JJJJ>') */
  handles:    'handles',      /* Ordner-Handle für PDFs: { id:'pdfOrdner', handle } */
  archiv:     'archiv'        /* ein Eintrag je Protokoll (id = Protokoll-ID): PDF + Kurzdaten, siehe speicher.js */
};

/* Stammdaten-Felder der Hauptseite (Reihenfolge verbindlich). Nur IDs – alles
   Übrige (Label, Optionen, Schnellwahl …) kommt aus js/felder-daten.js. */
const STAMMDATEN_FELDER = ['STAM-01','STAM-01-a','STAM-02','STAM-06','STAM-07','STAM-09','STAM-10','STAM-11','STAM-12','NETZ-04','NETZ-05'];

/* Felder, aus denen die Übersicht Prüfort und Anlage/Objekt zeigt */
const FELD_PRUEFORT = 'STAM-01';
const FELD_ANLAGE   = 'STAM-03';
const FELD_PRUEFDATUM = 'STAM-08';     /* Monat im Archiv */

/* ---------------- Archiv ----------------
   versandwege  Antworten auf „Wurde es verschickt?" nach dem Teilen (Vermerk am Eintrag)
   zipName      Dateiname der ZIP-Sammlung (datum = JJJJ-MM-TT, anzahl = Anzahl PDFs) */
const ARCHIV = {
  versandwege: [
    { schluessel:'mail',     text:'per E-Mail',   icon:'✉' },
    { schluessel:'whatsapp', text:'per WhatsApp', icon:'💬' },
    { schluessel:'andere',   text:'auf anderem Weg', icon:'➜' }
  ],
  zipName: (datum, anzahl) => 'Pruefprotokolle_' + datum + '_' + anzahl + '_PDFs.zip'
};

/* Dateien für den Offline-Cache (Service Worker). Neue Datei → hier eintragen. */
const PRECACHE_DATEIEN = [
  './', 'index.html', 'manifest.json', 'icons/app/icon-192.png', 'icons/app/icon-512.png', 'icons/app/icon-maskable-512.png', 'icons/app/apple-touch-icon.png', 'icons/app/favicon-32.png', 'masterbibliothek.html', 'anlagenpruefung.html', 'anschlusspruefung.html', 'geraetepruefung.html', 'archiv.html',
  'css/style.css', 'css/felder.css', 'css/erklaerungen.css', 'css/masterbibliothek.css', 'css/startseite.css', 'css/protokoll.css', 'css/archiv.css',
  'js/archiv.js', 'js/zip.js', 'js/pdf-ansicht.js', 'js/lib/pdf.min.js', 'js/lib/pdf.worker.min.js',
  'js/app-config.js', 'js/felder-daten.js', 'js/icons.js', 'js/erklaerungen-daten.js', 'js/erklaerungen.js',
  'js/feld-renderer.js', 'js/speicher.js', 'js/startseite.js', 'js/masterbibliothek.js',
  'js/feld-logik.js', 'js/protokoll-seite.js', 'js/protokoll-anlage.js', 'js/protokoll-anschluss.js', 'js/protokoll-geraete.js',
  'js/pdf-layout.js', 'js/pdf-protokoll.js', 'js/pdf-anlage.js', 'js/pdf-anschluss.js', 'js/pdf-geraete.js', 'js/pdf-schrift.js', 'js/lib/jspdf.umd.min.js',
  'icons/messungen/netzspannung_v_hz.png', 'icons/messungen/phase_drehfeldmessung.png',
  'icons/messungen/r_iso_isolationswiderstand.png', 'icons/messungen/r_lo_potenzialausgleich.png',
  'icons/messungen/r_pe_schutzleiterwiderstand.png', 'icons/messungen/rcd_ausloesestrom_i_deltan.png',
  'icons/messungen/rcd_ausloesezeit_deltat.png', 'icons/messungen/z_s_schleifenimpedanz.png',
  'icons/rcd-typen/rcd_typ_a.png', 'icons/rcd-typen/rcd_typ_ac.png', 'icons/rcd-typen/rcd_typ_b.png',
  'icons/rcd-typen/rcd_typ_b_plus.png', 'icons/rcd-typen/rcd_typ_f.png'
];
