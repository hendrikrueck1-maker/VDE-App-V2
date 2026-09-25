/* =========================================================================
   Master-Feldbibliothek – Felddaten (Bearbeitungspunkt für Felder).

   Hier ändern: neues Feld, Optionen, Grenzwert (norm), Icon (info),
   Verknüpfung zur Hilfe (erkl). Texte der Hilfen: js/erklaerungen-daten.js.
   Darstellung: js/masterbibliothek.js · Icons: js/icons.js.

   Feld-Eigenschaften
     id, name, cat, pflicht        Kopfzeile der Karte
     typ, inhalt, bedingung        Legende (rechte Spalte, nicht im Protokoll)
     kind                          text | tel | number | date | select | segmented |
                                   quickmanual | toggle2 | readonly | textarea | canvas | foto
     elId                          feste Element-ID (für Berechnungen)
     norm:{min,max}                Rot/Grün-Prüfung (leer = wird per JS gesetzt)
     info                          Icon-Schlüssel aus INFO
     erkl                          Hilfe-Schlüssel aus ERKL
     markieren                     gelb/grün wie Pflicht, technisch optional
     hinweis                       kurzer Hilfetext unter dem Feld (nur im Formular-Modus, nicht in der Masterbibliothek)
     drehstromOnly                 bei „1-phasig" (NMESS-01a) ausgeblendet
     mangelWert                    dieser Wert zählt im Protokoll als Mangel (zusätzlich zu „n.i.O.")
     einfarbig                     segmentiert: jede gewählte Option im Farbton von „Ja" (grün), nie rot
     negativ                       Zahl: negative Werte erlaubt (Standard: NEIN – jeder Messwert ≥ 0)
     tastatur:'zahl'               Schnellauswahl + manuell: freie Eingabe öffnet die Zahlentastatur
                                   (kind number öffnet sie immer). Zahlenprüfung: zahlPruefen() in feld-renderer.js
     beiMangelNicht                {werte:[…], ausserWenn?:{feld, enthaelt}} – Wert widerspricht einem Mangel
                                   (Ampel rot) → PDF gesperrt, bis korrigiert (z. B. „Keine Mängel“ trotz Mangel)
     pflichtWenn                   Name einer Bedingung aus FeldLogik.BEDINGUNGEN (Pflicht nur, wenn erfüllt)

   Blockkarten (mehrere Unterfelder a, b, c …): NMESS_GROUP, ZNS_GROUP, RISO_GROUP, RCD_GROUP.
   Umbenannte IDs: FELD_ALT_IDS (neue ID → alte ID, damit alte Entwürfe laden).
   ========================================================================= */

/* ---------------- Icons je Messung (Kartenkopf, immer sichtbar) ---------------- */
const INFO = {
  zns:      {geraet:'Fluke 1663',   icons:[{datei:'z_s_schleifenimpedanz', label:'Z_i (Z_S)'}]},
  rcd:      {geraet:'Fluke 1663',   icons:[{datei:'rcd_ausloesezeit_deltat', label:'ΔT'},{datei:'rcd_ausloesestrom_i_deltan', label:'I_ΔN'}]},
  riso:     {geraet:'Fluke 1663',   icons:[{typ:'foto', datei:'r_iso_isolationswiderstand', label:'R_ISO'}]},
  riso_ger: {geraet:'Fluke 6500-2', icons:[{typ:'glyph', haupt:'R', sub:'ISO', label:'R_ISO'}]},
  rpe:      {geraet:'Fluke 1663',   icons:[{typ:'foto', datei:'r_pe_schutzleiterwiderstand', label:'R_PE'}]},
  rpe_ger:  {geraet:'Fluke 6500-2', icons:[{typ:'glyph', haupt:'R', sub:'PE', label:'R_PE · 200 mA'}]},
  rlo:      {geraet:'Fluke 1663',   icons:[{datei:'r_lo_potenzialausgleich', label:'R_LO'}]},
  vhz:      {geraet:'Fluke 1663',   icons:[{datei:'netzspannung_v_hz', label:'V, Hz'}]},
  phase:    {geraet:'Fluke 1663',   icons:[{datei:'phase_drehfeldmessung', label:'Phase'}]},
  /* `wert` = passende GER-10-Option; das Icon der gewählten Methode wird hervorgehoben */
  ableit:   {geraet:'Fluke 6500-2', icons:[
    {typ:'glyph', haupt:'I', sub:'EA', label:'I_EA', wert:'Ersatzableitstrom'},
    {typ:'glyph', custom:'I<span class="glyph-sub">Δ</span><span class="glyph-slash">/</span>I<span class="glyph-sub">L</span>', label:'IΔ / I_L', wert:'Differenzstrom'},
    {typ:'glyph', haupt:'I', sub:'B', label:'I_B', wert:'Direktmessung'}
  ]}
};

/* ---------------- Einzelfelder ---------------- */
const FIELDS = [
// ===== STAMMDATEN =====
{id:'STAM-01',hinweis:'Name des Auftraggebers oder Ort der Prüfung – erscheint im Protokollkopf.',name:'Auftraggeber / Prüfort',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'z. B. Stadttheater Konstanz'},
{id:'STAM-01-a',hinweis:'Straße, Hausnummer, PLZ und Ort des Prüforts – erscheint im Protokollkopf.',name:'Adresse',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext (Straße Nr., PLZ Ort)',bedingung:'Gehört zu STAM-01.',kind:'text',elId:'stam01_a',ph:'z. B. Konzilstraße 11, 78462 Konstanz'},
{id:'STAM-02',hinweis:'Eintrag aus der Liste wählen oder frei tippen. Neue Einträge über „Liste bearbeiten“ ergänzen.',name:'Bereich / Gebäude',cat:'Stammdaten',typ:'Text mit editierbarer Liste',pflicht:'Pflicht',
 inhalt:'Vom Nutzer gepflegte Liste',bedingung:'Liste über „Liste bearbeiten" pflegbar, gilt für alle Protokolle (Speicher: Browser).',
 kind:'text',ph:'editierbare Liste',datalist:['Hauptbühne','Studiobühne','Werkstatt'],editableList:true},
{id:'STAM-03',name:'Anlage / Objekt',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'Bezeichnung Anlage/Objekt'},
{id:'STAM-04',name:'Prüflings-ID',cat:'Stammdaten',typ:'Text',pflicht:'Optional',
 inhalt:'Freitext',bedingung:'Gelb/grün markiert, technisch optional.',kind:'text',ph:'interne Kennung',markieren:true},
{id:'STAM-05',name:'Protokoll-Nr.',cat:'Stammdaten',typ:'Text (automatisch)',pflicht:'Optional',
 inhalt:'ABK/TT/MM/JJJJ/Nr., z. B. ANL/23/09/2026/001',
 bedingung:'Im Protokoll beim Anlegen automatisch vergeben (ABK je Protokolltyp, Datum des Anlegens). Zähler je ABK + Datum, wird nie doppelt vergeben.',
 kind:'readonly',elId:'stam05',ph:'wird automatisch vergeben',knopf:{id:'stam05_neu_btn',label:'Neue Nr. vergeben'}},
{id:'STAM-06',hinweis:'Vor- und Nachname der Person, die die Prüfung durchführt.',name:'Prüfer/-in',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'Name'},
{id:'STAM-07',hinweis:'Nicht vorbelegt – bitte bewusst wählen.',name:'Qualifikation',cat:'Stammdaten',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Elektrofachkraft / Unterwiesene Person',bedingung:'Nicht vorbelegt.',kind:'select',options:['Elektrofachkraft','Unterwiesene Person']},
{id:'STAM-08',name:'Prüfdatum',cat:'Stammdaten',typ:'Datum',pflicht:'Pflicht',
 inhalt:'Datum',bedingung:'Vorbelegt mit heute (änderbar). Basis für STAM-05 und STAM-23.',kind:'date',elId:'stam08'},
{id:'STAM-09',hinweis:'Für Anlagen- und Anschlussprüfung.',name:'Prüfgerät Installationstester',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'z. B. Fluke 1663',bedingung:'Übernahme aus den Prüfgeräte-Stammdaten.',kind:'text',ph:'z. B. Fluke 1663'},
{id:'STAM-10',hinweis:'Steht auf dem Typenschild des Prüfgeräts.',name:'Seriennummer Installationstester',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'Seriennummer'},
{id:'STAM-11',hinweis:'Nur für die Geräteprüfung.',name:'Prüfgerät Gerätetester',cat:'Stammdaten',typ:'Text',pflicht:'Optional',
 inhalt:'z. B. Fluke 6500-2',bedingung:'Nur Geräteprüfung.',kind:'text',ph:'z. B. Fluke 6500-2'},
{id:'STAM-12',hinweis:'Nur für die Geräteprüfung.',name:'Seriennummer Gerätetester',cat:'Stammdaten',typ:'Text',pflicht:'Optional',
 inhalt:'Freitext',bedingung:'Nur Geräteprüfung.',kind:'text',ph:'Seriennummer'},
{id:'STAM-13',name:'Grund der Prüfung / Prüfart',cat:'Stammdaten',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Anlage: Neuanlage / Bestand / Änderung / Wiederholung · Gerät: Erstprüfung / Wiederholungsprüfung / nach Reparatur',
 bedingung:'Nicht vorbelegt. Liefert die ABK für STAM-05 (ANL bzw. GP).',
 kind:'select',options:['Neuanlage','Bestand','Änderung','Wiederholung','Erstprüfung (Gerät)','Wiederholungsprüfung (Gerät)','Prüfung nach Reparatur (Gerät)'],elId:'stam13'},
{id:'STAM-14',erkl:'pruefnorm',hinweis:'Anlage: 0100-600 = neu/geändert, 0105-100 = wiederkehrend. „Welche Norm wann?“ erklärt alle Fälle.',name:'Prüfnorm',cat:'Stammdaten',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'DIN VDE 0100-600 / 0105-100 / 0701-0702 / DIN EN 50678 / DIN EN 50699',
 bedingung:'Nicht vorbelegt. Gerät: EN 50678 = nach Reparatur, EN 50699 = Wiederholungsprüfung.',
 kind:'select',options:['DIN VDE 0100-600','DIN VDE 0105-100','DIN VDE 0100-600 / 0105-100','DIN VDE 0701-0702','DIN EN 50678 (ersetzt VDE 0701)','DIN EN 50699 (ersetzt VDE 0702)']},
{id:'STAM-16',name:'Firma / Vermieter',cat:'Stammdaten',typ:'Text',pflicht:'Optional',
 inhalt:'Freitext',bedingung:'Nur Anschlussprüfung.',kind:'text',ph:'Firma/Vermieter'},
{id:'STAM-18',name:'Ansprechpartner',cat:'Stammdaten',typ:'Text',pflicht:'Optional',
 inhalt:'Freitext',bedingung:'Nur Anschlussprüfung.',kind:'text',ph:'Name'},
{id:'STAM-19',name:'Telefon',cat:'Stammdaten',typ:'Telefon',pflicht:'Optional',
 inhalt:'Telefonnummer',bedingung:'Nur Anschlussprüfung.',kind:'tel',ph:'Telefonnummer'},
{id:'STAM-20',name:'Standort Übergabepunkt',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'Nur Anschlussprüfung.',kind:'text',ph:'z. B. Verteiler Ost'},
{id:'STAM-21',name:'Anschlussleistung',cat:'Stammdaten',typ:'Zahl',pflicht:'Optional',
 inhalt:'kVA',bedingung:'Nur Anschlussprüfung.',kind:'number',ph:'z. B. 63',einheit:'kVA'},
{id:'STAM-22',name:'Prüfintervall',cat:'Stammdaten',typ:'Schnellauswahl + manuell',pflicht:'Pflicht',
 inhalt:'1 / 2 / 3 Monate · 1 / 2 / 4 Jahre',bedingung:'Ergibt mit STAM-08 den nächsten Prüftermin (STAM-23).',
 kind:'quickmanual',quick:['1 Monat','2 Monate','3 Monate','1 Jahr','2 Jahre','4 Jahre'],elId:'stam22'},
{id:'STAM-23',name:'Nächster Prüftermin',cat:'Stammdaten',typ:'Datum (automatisch)',pflicht:'—',
 inhalt:'STAM-08 + STAM-22',bedingung:'Automatisch berechnet.',kind:'readonly',elId:'stam23',ph:'wird automatisch berechnet'},

// ===== NETZSYSTEM =====
{id:'NETZ-01',name:'Netzsystem',cat:'Netzsystem',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'TN-S / TN-C-S / TN-C / TT / IT',bedingung:'Vorbelegt mit TN-S, vor dem Speichern bestätigen.',
 kind:'select',options:['TN-S','TN-C-S','TN-C','TT','IT'],default:'TN-S'},
{id:'NETZ-02',name:'Netzspannung',cat:'Netzsystem',typ:'Schnellauswahl + manuell',pflicht:'Pflicht',
 inhalt:'230 V / 230/400 V / 400 V',bedingung:'Nennwert für die Toleranzen in NMESS-01.',
 kind:'quickmanual',quick:['230 V','230/400 V','400 V'],elId:'netz02',info:'vhz'},
{id:'NETZ-03',name:'Art der Einspeisung',cat:'Netzsystem',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Festanschluss / Steckstelle / Baustromverteiler / Sonstiges',bedingung:'Nicht vorbelegt.',
 kind:'select',options:['Festanschluss','Steckstelle','Baustromverteiler','Sonstiges']},
{id:'NETZ-04',hinweis:'Betreiber des vorgelagerten Netzes, z. B. laut Stromrechnung.',name:'Netzbetreiber',cat:'Netzsystem',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'Name Netzbetreiber'},
{id:'NETZ-05',hinweis:'Grundlage für den Mindest-Kurzschlussstrom am Speisepunkt (≈ 5 × Nennstrom). Bei Notstromaggregat (NEA) keine automatische Bewertung.',name:'Vorsicherung (Hausanschluss/Speisepunkt)',cat:'Netzsystem',typ:'Schnellauswahl + manuell',pflicht:'Pflicht',
 inhalt:'NH 3x100A / NH 3x63A / CEE 63A / CEE 125A / NEA',
 bedingung:'Ergibt den Mindest-I_K2 in ZNS-01e (≈ 5 × Nennstrom). NEA: keine automatische Bewertung, Frequenz (NMESS-01i) Pflicht.',
 kind:'quickmanual',quick:['NH 3x100A','NH 3x63A','CEE 63A','CEE 125A','NEA'],elId:'netz05'},

// ===== NETZMESSUNG (Block NMESS-01 siehe unten) =====
{id:'NMESS-09',erkl:'drehfeld',name:'Drehfeldrichtung',cat:'Netzmessung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'rechts / links',bedingung:'Nur bei Drehstrom (NMESS-01a). Nicht vorbelegt.',
 kind:'segmented',options:['rechts','links'],name_group:'nmess09',info:'phase',drehstromOnly:true},
{id:'NMESS-10',name:'Geplante Last dieser Versorgung',cat:'Netzmessung',typ:'Zahl',pflicht:'Optional',
 inhalt:'kVA',bedingung:'Nur Anschlussprüfung.',kind:'number',einheit:'kVA'},

// ===== BESICHTIGUNG =====
{id:'BES-01',name:'Betriebsmittel',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Nicht vorbelegt, n.a. gesperrt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],naDisabled:true,name_group:'bes01'},
{id:'BES-02',name:'Kabel & Leitungen',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Nicht vorbelegt, n.a. gesperrt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],naDisabled:true,name_group:'bes02'},
{id:'BES-03',name:'Zugänglichkeit',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes03'},
{id:'BES-04',name:'Schaltgeräte',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes04'},
{id:'BES-05',name:'Kennzeichnung',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes05'},
{id:'BES-06',name:'Zusätzlicher Potenzialausgleich',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes06'},
{id:'BES-07',name:'Berührungsschutz',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Nicht vorbelegt, n.a. gesperrt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],naDisabled:true,name_group:'bes07'},
{id:'BES-08',name:'Typenschild',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes08'},
{id:'BES-09',name:'Leiterverbindungen',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes09'},
{id:'BES-10',name:'Steckvorrichtungen / Kupplungen',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Anschlussprüfung. Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes10'},
{id:'BES-11',name:'Witterungsschutz',cat:'Besichtigung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Anschlussprüfung im Außenbereich. Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes11'},

// ===== STROMKREIS =====
{id:'SK-01',hinweis:'Wie auf der Verteilung beschriftet, z. B. „F3 Steckdosen Werkstatt“.',name:'Stromkreisbezeichnung',cat:'Stromkreis',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext (Verteilung / Sicherung / Verbraucher)',bedingung:'Je Stromkreis (Anlagenprüfung). Erscheint im Kopf der Stromkreis-Karte.',kind:'text',ph:'z. B. F3 Steckdosen Werkstatt'},
{id:'SK-02',name:'Stromkreis in Ordnung',cat:'Stromkreis',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'Ja / Nein',bedingung:'Nicht vorbelegt. Nein = Mangel: Felder und Messungen des Stromkreises werden eingeklappt, Bemerkung (FIN-09) wird Pflicht.',
 kind:'segmented',options:['Ja','Nein'],name_group:'sk02',mangelWert:'Nein'},
{id:'SK-03',hinweis:'Kamera oder Datei, mehrere Fotos möglich. Fotos werden verkleinert gespeichert.',name:'Fotos Stromkreis',cat:'Stromkreis',typ:'Foto',pflicht:'Optional',
 inhalt:'Fotos (max. 1600 px, JPEG ≈ 0,72)',bedingung:'Je Stromkreis bzw. Prüfling. Erscheint als Fotodokumentation im PDF.',kind:'foto'},

// ===== SCHUTZLEITERWIDERSTAND =====
{id:'RPE-01',erkl:'rpe',name:'Schutzleiterwiderstand R_PE',cat:'Schutzleiterwiderstand',typ:'Zahl',pflicht:'Pflicht',
 inhalt:'Messwert in Ω (Fluke 1663)',bedingung:'Max. = Leiterwiderstand l / (56 · A) + 0,1 Ω Übergang, aus Länge LTG-02 und Querschnitt LTG-06 (im Stromkreis). Ohne Leitungsdaten Richtwert ≤ 1 Ω. Geräteprüfung: GER-05.',
 hinweis:'Grenzwert aus Länge und Querschnitt der Leitung – beide eintragen für den genauen Wert, sonst Richtwert 1 Ω.',
 kind:'number',einheit:'Ω',norm:{},info:'rpe'},

// ===== ISOLATIONSWIDERSTAND: Block RISO-01 (unten) =====

// ===== ERDUNG =====
{id:'ERD-01',name:'Zusätzlicher Potenzialausgleich vorhanden',cat:'Erdung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'Ja / Nein',bedingung:'Nicht vorbelegt. „Nein“ = Mangel (zählt im Protokoll), wird aber farblich wie „Ja“ angezeigt.',kind:'segmented',options:['Ja','Nein'],name_group:'erd01',mangelWert:'Nein',einfarbig:true},
{id:'ERD-02',erkl:'rlo',name:'Durchgängigkeit Potenzialausgleich',cat:'Erdung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.'],name_group:'erd02',info:'rlo'},
{id:'ERD-03',erkl:'erdung',name:'Erdungswiderstand R_E',cat:'Erdung',typ:'Zahl',pflicht:'Pflicht',
 inhalt:'Messwert in Ω',bedingung:'Grenzwert anlagenspezifisch.',kind:'number',einheit:'Ω'},
{id:'ERD-04',name:'Erdungsmesspunkt',cat:'Erdung',typ:'Schnellauswahl + manuell',pflicht:'Optional',
 inhalt:'Typische Messpunkte im Theater-/Veranstaltungsbereich (15 Vorgaben)',bedingung:'—',
 kind:'quickmanual',quick:['HES (Haupterdungsschiene)','Potenzialausgleichsschiene (PAS)','Hauptverteilung HV','Unterverteilung UV','Fundamenterder','Blitzschutzanlage','Hauptschutzleiter PE','Hauptwasserleitung','Heizungsanlage','Gasleitung (Isolierstück beachten)','Klima-/Lüftungsanlage','Gebäudekonstruktion / Stahlbau','Traverse / Tribüne','Bühnenwagen / Drehbühne','Kabelpritsche / Kabeltrasse'],elId:'erd04'},

// ===== GENERATOR =====
{id:'GEN-01',name:'Nennleistung',cat:'Generator',typ:'Zahl',pflicht:'Bedingt',
 inhalt:'kVA',bedingung:'Nur bei Generator-Einspeisung.',kind:'number',einheit:'kVA'},
{id:'GEN-02',name:'Bauart',cat:'Generator',typ:'Text',pflicht:'Bedingt',
 inhalt:'Freitext',bedingung:'Nur bei Generator-Einspeisung.',kind:'text',ph:'z. B. Synchrongenerator'},
{id:'GEN-03',name:'Sternpunkt',cat:'Generator',typ:'Text',pflicht:'Bedingt',
 inhalt:'Freitext',bedingung:'Nur bei Generator-Einspeisung.',kind:'text',ph:'geerdet / isoliert'},
{id:'GEN-04',name:'Erdung',cat:'Generator',typ:'Text',pflicht:'Bedingt',
 inhalt:'Freitext',bedingung:'Nur bei Generator-Einspeisung.',kind:'text',ph:'Erdungsart'},
{id:'GEN-05',name:'Aufstellort',cat:'Generator',typ:'Text',pflicht:'Bedingt',
 inhalt:'Freitext',bedingung:'Nur bei Generator-Einspeisung.',kind:'text',ph:'Standort Generator'},

// ===== LEITUNG =====
{id:'LTG-01',erkl:'ltg_durchgang',name:'Durchgangsprüfung',cat:'Leitung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.'],name_group:'ltg01'},
{id:'LTG-02',name:'Anschlussleitungslänge',cat:'Leitung',typ:'Zahl',pflicht:'Optional',
 inhalt:'m',bedingung:'Mit LTG-06 Grundlage für den R_PE-Grenzwert (RPE-01).',kind:'number',einheit:'m'},
{id:'LTG-04',name:'Kabeltyp',cat:'Leitung',typ:'Schnellauswahl + manuell',pflicht:'Optional',
 inhalt:'NYY-J / NYM-J / H07RN-F / H05RN-F',bedingung:'Gelb/grün markiert, technisch optional.',
 kind:'quickmanual',quick:['NYY-J','NYM-J','H07RN-F','H05RN-F'],elId:'ltg04',markieren:true},
{id:'LTG-05',name:'Leiteranzahl',cat:'Leitung',typ:'Schnellauswahl + manuell',pflicht:'Optional',
 inhalt:'3G / 4G / 5G',bedingung:'Gelb/grün markiert, technisch optional.',
 kind:'quickmanual',quick:['3G','4G','5G'],elId:'ltg05',markieren:true},
{id:'LTG-06',name:'Querschnitt',cat:'Leitung',typ:'Schnellauswahl + manuell',pflicht:'Optional',
 inhalt:'1,5 / 2,5 / 4 / 6 / 10 / 16 mm²',bedingung:'Gelb/grün markiert, technisch optional.',
 kind:'quickmanual',quick:['1,5 mm²','2,5 mm²','4 mm²','6 mm²','10 mm²','16 mm²'],elId:'ltg06',markieren:true,tastatur:'zahl'},

// ===== ERPROBEN =====
{id:'ERP-01',name:'Funktion Anlage',cat:'Erproben',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Anlagenprüfung. Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp01'},
{id:'ERP-03',erkl:'polaritaet',name:'Polarität / Steckdosenbelegung',cat:'Erproben',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Anlagen- und Anschlussprüfung. Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp03'},
{id:'ERP-04',name:'Schutzeinrichtungen',cat:'Erproben',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp04'},
{id:'ERP-05',name:'RCD-Prüftaste',cat:'Erproben',typ:'Segmentiert',pflicht:'Bedingt',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Pflicht, wenn ein RCD vorhanden ist (RCD-01a ≠ „ohne RCD").',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp05'},
{id:'ERP-06',name:'Drehrichtung Motoren',cat:'Erproben',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp06'},

// ===== GERÄTEPRÜFUNG =====
{id:'GER-02',name:'Gerätebezeichnung',cat:'Geräteprüfung',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'z. B. Bühnenscheinwerfer'},
{id:'GER-03',name:'Standort',cat:'Geräteprüfung',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'—',kind:'text',ph:'z. B. Lager Technik'},
{id:'GER-04',name:'Gerätetyp',cat:'Geräteprüfung',typ:'Text mit Vorschlagsliste',pflicht:'Pflicht',
 inhalt:'Freitext mit Vorschlägen (Verlängerung, Scheinwerfer, Nebelmaschine …)',bedingung:'—',
 kind:'text',ph:'Gerätetyp eingeben oder aus Vorschlägen wählen',
 datalist:['Verlängerungsleitung','Kabeltrommel','Mehrfachsteckdose','Bühnenscheinwerfer','Heizlüfter','Wasserkocher','Lötkolben','Bohrmaschine','Kaffeemaschine','Laptop-Netzteil','Nebelmaschine','Funkmikrofon-Ladestation','Verteiler mobil']},
{id:'GER-06',name:'Inventar-/Seriennummer',cat:'Geräteprüfung',typ:'Text',pflicht:'Optional',
 inhalt:'Freitext',bedingung:'Gelb/grün markiert, technisch optional.',kind:'text',ph:'Inventar- oder Seriennummer',markieren:true},
{id:'GER-07',name:'Schutzklasse',cat:'Geräteprüfung',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'I / II / III',bedingung:'Nicht vorbelegt. Bestimmt die Grenzwerte von GER-05c und GER-09. SK II: kein R_PE · SK III: kein R_PE, kein Ableitstrom, R_ISO ≥ 0,25 MΩ. Nur SK I: Heizelemente (GER-14).',
 kind:'select',options:['I','II','III']},
{id:'GER-08',name:'Leitungslänge',cat:'Geräteprüfung',typ:'Zahl',pflicht:'Optional',
 inhalt:'m',bedingung:'Beeinflusst den zulässigen R_PE (GER-05), zusammen mit dem Querschnitt (LTG-06).',kind:'number',einheit:'m'},
{id:'GER-14',name:'Heizelemente vorhanden',cat:'Geräteprüfung',typ:'Segmentiert',pflicht:'Bedingt',
 inhalt:'Ja / Nein',bedingung:'Nur bei Schutzklasse I sichtbar und Pflicht. „Ja“: R_ISO ≥ 0,3 MΩ statt 1 MΩ (GER-05c).',
 hinweis:'z. B. Heizlüfter, Wasserkocher, Heizstrahler, Scheinwerfer mit Heizwiderstand.',
 kind:'segmented',options:['Ja','Nein'],name_group:'ger14',einfarbig:true},
{id:'GER-15',name:'Heizleistung',cat:'Geräteprüfung',typ:'Zahl',pflicht:'Bedingt',
 inhalt:'kW (Typenschild)',bedingung:'Nur bei GER-14 „Ja“. Über 3,5 kW: Schutzleiterstrom max. 1 mA je kW, höchstens 10 mA (GER-09).',
 hinweis:'Leistung vom Typenschild in kW (z. B. 2 kW = 2).',kind:'number',einheit:'kW',elId:'ger15'},
{id:'GER-05',erkl:'rpe_ger',name:'Schutzleiterwiderstand R_PE',cat:'Geräteprüfung',typ:'Zahl',pflicht:'Pflicht',
 inhalt:'Messwert in Ω, 200 mA (Fluke 6500-2)',bedingung:'Bis 1,5 mm²: ≤ 0,30 Ω bis 5 m, +0,10 Ω je weitere 7,5 m (anteilig), max. 1 Ω · über 1,5 mm² (LTG-06): l / (56 · A) + 0,1 Ω. Entfällt bei SK II / III.',
 kind:'number',einheit:'Ω',norm:{},info:'rpe_ger'},
{id:'GER-05b',erkl:'riso_ger_spannung',name:'R_ISO Prüfspannung',cat:'Geräteprüfung',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'250 V DC / 500 V DC',bedingung:'Nicht vorbelegt. Standard 500 V, 250 V bei Überspannungsableitern.',
 kind:'select',options:['250 V DC','500 V DC'],elId:'ger05b'},
{id:'GER-05c',erkl:'riso_ger',name:'R_ISO Messwert',cat:'Geräteprüfung',typ:'Zahl',pflicht:'Pflicht',
 inhalt:'Messwert in MΩ (Fluke 6500-2)',bedingung:'SK I ≥ 1 MΩ (mit Heizelementen GER-14 ≥ 0,3 MΩ), SK II ≥ 2 MΩ, SK III ≥ 0,25 MΩ (aus GER-07).',
 kind:'number',einheit:'MΩ',norm:{},elId:'ger05c',info:'riso_ger'},
{id:'GER-10',erkl:'ableit_methode',name:'Messmethode Ableitstrom',cat:'Geräteprüfung',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Ersatzableitstrom / Differenzstrom / Direktmessung / entfällt',bedingung:'Nicht vorbelegt. Vor GER-09 wählen, bestimmt dessen Grenzwert. „entfällt“ nur für Betriebsmittel ohne eigene Verbraucher (Verlängerung, Kabeltrommel, Mehrfachsteckdose) – GER-09 wird ausgeblendet.',
 kind:'select',options:['Ersatzableitstrom','Differenzstrom','Direktmessung','entfällt (ohne Verbraucher)'],elId:'ger10',info:'ableit'},
{id:'GER-09',erkl:'ableit',name:'Ableitstrom',cat:'Geräteprüfung',typ:'Zahl',pflicht:'Pflicht',
 inhalt:'Messwert in mA nach Methode GER-10',
 bedingung:'SK I: Schutzleiterstrom ≤ 3,5 mA (Ersatz/Differenz), mit Heizelementen > 3,5 kW 1 mA/kW bis max. 10 mA · Berührungsstrom (direkt) ≤ 0,5 mA · SK II: ≤ 0,5 mA · SK III ohne Ableitstrom.',
 kind:'number',einheit:'mA',info:'ableit',norm:{},elId:'ger09'},
{id:'GER-11',erkl:'ger_sicht',name:'Sichtprüfung',cat:'Geräteprüfung',typ:'Segmentiert',pflicht:'Kritisch',
 inhalt:'i.O. / n.i.O.',bedingung:'Nie vorbelegt, kein n.a. – eine nicht durchgeführte Prüfung darf nicht als i.O. erscheinen.',
 kind:'segmented',options:['i.O.','n.i.O.'],name_group:'ger11',kritisch:true},
{id:'GER-12',name:'Funktionsprüfung',cat:'Geräteprüfung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nicht vorbelegt. n.a. zulässig.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'ger12'},
{id:'GER-13',name:'Prüfergebnis',cat:'Geräteprüfung',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'OK / Fehler / Nicht prüfbar',bedingung:'Nicht vorbelegt. „Fehler“ zählt im Protokoll als Mangel. „OK“ ist bei einem Mangel (Grenzwert, n.i.O.) gesperrt.',kind:'segmented',options:['OK','Fehler','Nicht prüfbar'],name_group:'ger13',mangelWert:'Fehler',
 beiMangelNicht:{werte:['OK']}},

// ===== ABSCHLUSS =====
{id:'FIN-01',name:'Ampel-Beurteilung',cat:'Abschluss',typ:'Segmentiert (automatisch)',pflicht:'—',
 inhalt:'🟢 i.O. / 🟡 Bemerkung / 🔴 Mangel',bedingung:'Ergibt sich aus den Prüfergebnissen.',kind:'segmented',options:['🟢 i.O.','🟡 Bemerkung','🔴 Mangel'],name_group:'fin01'},
{id:'FIN-02',name:'Gesamtbewertung Mängel',cat:'Abschluss',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Keine Mängel / Mängel behoben / Mängel festgestellt',bedingung:'Nicht vorbelegt. Bei Mängeln Erläuterung in FIN-09.',
 kind:'select',options:['Keine Mängel festgestellt','Mängel festgestellt und behoben (siehe Bemerkung)','Mängel festgestellt (siehe Bemerkung)'],
 beiMangelNicht:{werte:['Keine Mängel festgestellt']}},
{id:'FIN-03',name:'Prüfplakette erteilt',cat:'Abschluss',typ:'Segmentiert',pflicht:'Pflicht',
 inhalt:'Ja / Nein',bedingung:'Nicht vorbelegt. „Ja“ bei Mangel nur, wenn FIN-02 „behoben“.',kind:'segmented',options:['Ja','Nein'],name_group:'fin03',
 beiMangelNicht:{werte:['Ja'], ausserWenn:{feld:'FIN-02', enthaelt:'behoben'}}},
{id:'FIN-04',name:'Sicherer Gebrauch gewährleistet',cat:'Abschluss',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Ja / Nein (Sicherheitsrisiko)',bedingung:'Nicht vorbelegt. „Ja“ bei Mangel nur, wenn FIN-02 „behoben“.',
 kind:'select',options:['Ja (Anlage entspricht VDE-Regeln)','Nein (Sicherheitsrisiko)'],
 beiMangelNicht:{werte:['Ja (Anlage entspricht VDE-Regeln)'], ausserWenn:{feld:'FIN-02', enthaelt:'behoben'}}},
{id:'FIN-09',name:'Bemerkungsfeld',cat:'Abschluss',typ:'Textfeld',pflicht:'Bedingt',
 inhalt:'Freitext',bedingung:'Pflicht bei Mängeln (FIN-02 „Mängel …“, FIN-04 „Nein“, GER-13 „Fehler“/„Nicht prüfbar“). Rot bei Mängeln, gelb bei Text ohne Mängel.',kind:'textarea',
 pflichtWenn:'bemerkungNoetig'},
{id:'FIN-10',name:'Unterschrift Prüfer/-in',cat:'Abschluss',typ:'Signaturfeld',pflicht:'Optional',
 inhalt:'Zeichenfläche, 38 × 12 mm im PDF',bedingung:'Keine Pflicht vor PDF-Erzeugung.',kind:'canvas'},
{id:'FIN-11',name:'Unterschrift Auftraggeber/Betreiber',cat:'Abschluss',typ:'Signaturfeld',pflicht:'Optional',
 inhalt:'Zeichenfläche, 38 × 12 mm im PDF',bedingung:'Keine Pflicht vor PDF-Erzeugung.',kind:'canvas'}
];

/* ---------------- Grenzwert-Tabellen (EINE Quelle für Masterbibliothek und Protokolle) ----------------
   U0              Bezugsspannung für I_K = U0 / Z
   LS_MIN_IK       Mindest-I_K je Schnellauswahl (DIN EN 60898-1: B 5 × I_n, C 10 × I_n)
   LS_FAKTOR       für frei eingetippte LS („B 20A", „D 16A") im Protokoll
   NETZ_IK2_FAKTOR Praxis-Näherung Mindest-I_K2 ≈ 5 × Vorsicherung (NETZ-05)
   RCD_ZEIT_MAX    max. Auslösezeit je Prüfstrom (RCD-01c2 → RCD-01e)
   RCD_STROM_BAND  Auslösestrom als Faktor von I_Δn (RCD-01c → RCD-01d)
   UL              zulässige Berührungsspannung [Spannungsart][Bereich] (RCD-01f/g → h)
   RISO_MIN        Mindest-R_ISO je Prüfspannung (RISO-01a → RISO-01b), sonst `standard`
   SICHERUNG_GG    Abschaltstrom I_a (A) von gG-Sicherungen je Nennstrom für 0,4 s bzw. 5 s
                   (DIN VDE 0100-410 / DIN VDE 0636). Bis SICHERUNG_04S_BIS A gilt 0,4 s (Endstromkreis), darüber 5 s.
   ANL_RPE         R_PE Anlage: l / (kappa · A) + uebergang; ohne Länge/Querschnitt Richtwert `ohneDaten` */
const GRENZWERTE = {
  U0: 230,
  LS_MIN_IK: {'B 10A':50,'B 16A':80,'B 32A':160,'C 16A':160,'C 32A':320,'C 63A':630},
  LS_FAKTOR: {B:5, C:10, D:20, K:14, Z:3},
  SICHERUNG_GG: {
    '0,4 s': {2:16, 4:32, 6:47, 10:82, 16:107, 20:145, 25:180, 32:265, 35:295, 40:310, 50:460, 63:550, 80:960},
    '5 s':   {2:9.2, 4:19, 6:27, 10:47, 16:65, 20:85, 25:110, 32:150, 35:173, 40:190, 50:260, 63:320, 80:440}
  },
  SICHERUNG_04S_BIS: 32,
  ANL_RPE: {kappa:56, uebergang:0.1, ohneDaten:1.0},
  NETZ_IK2_FAKTOR: 5,
  RCD_ZEIT_MAX: {'1 × IΔn (max. 300 ms)':300,'2 × IΔn (max. 150 ms)':150,'5 × IΔn (max. 40 ms)':40},
  RCD_STROM_BAND: {min:0.5, max:1.0},
  UL: {AC:{'normal':50,'erhöht':25}, DC:{'normal':120,'erhöht':60}},
  RISO_MIN: {standard:1, 'SELV-PELV':0.5},
  /* Geräteprüfung (DIN EN 50678 / 50699) – GER-07 Schutzklasse, GER-08 Länge, GER-10 Methode */
  /* R_PE: bis abQuerschnitt mm² 0,3 Ω bis 5 m, +0,1 Ω je weitere 7,5 m (anteilig), max. 1 Ω ·
     darüber (LTG-06) l / (kappa · A) + uebergang (DIN EN 50678/50699) */
  GER_RPE: {basis:0.30, bisM:5, schrittM:7.5, zuschlag:0.10, max:1.00, abQuerschnitt:1.5, kappa:56, uebergang:0.10},
  GER_RISO_MIN: {'I':1, 'II':2, 'III':0.25},                               /* MΩ je Schutzklasse */
  GER_RISO_MIN_HEIZ: 0.3,                                                  /* MΩ, SK I mit Heizelementen (GER-14) */
  GER_ABLEIT_MAX: {                                                        /* mA je Schutzklasse und Methode */
    'I':  {'Ersatzableitstrom':3.5, 'Differenzstrom':3.5, 'Direktmessung':0.5},
    'II': {'Ersatzableitstrom':0.5, 'Differenzstrom':0.5, 'Direktmessung':0.5}
  },
  GER_ABLEIT_HEIZ: {abKW:3.5, jeKW:1, max:10},   /* SK I mit Heizelementen > 3,5 kW: 1 mA/kW, max. 10 mA (nicht für Direktmessung) */
  GER_METHODE_OHNE: 'entfällt (ohne Verbraucher)',  /* GER-10: kein Ableitstrom (Verlängerung, Kabeltrommel …) */
  GER_OHNE_RPE: ['II','III'],        /* Schutzklassen ohne Schutzleiter → GER-05 entfällt */
  GER_OHNE_ABLEIT: ['III']           /* Schutzklassen ohne Ableitstrom → GER-10, GER-09 entfallen (R_ISO bleibt, ≥ 0,25 MΩ) */
};

/* ---------------- Block NMESS-01: Netzmessung ---------------- */
const NMESS_GROUP = {
  id:'NMESS-01', name:'Netzmessung – Spannungen und Frequenz', cat:'Netzmessung', badge:'Block',
  bedingung:'a steuert die Sichtbarkeit: bei 1-phasig nur b, h und i.',
  info:'vhz', erkl:'netzmessung',
  sub:[
    {suf:'a', label:'Drehstrom / 1-phasig', typ:'Umschalter', inhalt:'Drehstrom / 1-phasig', bedingung:'1-phasig blendet c–g und NMESS-09 aus.', kind:'toggle2', opts:['Drehstrom','1-phasig'], elId:'netz08', pflicht:'Pflicht'},
    {suf:'b', label:'U L1-N (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'207–244 V', kind:'number', einheit:'V', ph:'207–244', norm:{min:207,max:244}, elId:'nmess01_b', pflicht:'Pflicht'},
    {suf:'c', label:'U L2-N (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'207–244 V', kind:'number', einheit:'V', ph:'207–244', norm:{min:207,max:244}, elId:'nmess01_c', pflicht:'Pflicht', drehstromOnly:true},
    {suf:'d', label:'U L3-N (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'207–244 V', kind:'number', einheit:'V', ph:'207–244', norm:{min:207,max:244}, elId:'nmess01_d', pflicht:'Pflicht', drehstromOnly:true},
    {suf:'e', label:'U L1-L2 (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'360–424 V', kind:'number', einheit:'V', ph:'360–424', norm:{min:360,max:424}, elId:'nmess01_e', pflicht:'Pflicht', drehstromOnly:true},
    {suf:'f', label:'U L2-L3 (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'360–424 V', kind:'number', einheit:'V', ph:'360–424', norm:{min:360,max:424}, elId:'nmess01_f', pflicht:'Pflicht', drehstromOnly:true},
    {suf:'g', label:'U L1-L3 (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'360–424 V', kind:'number', einheit:'V', ph:'360–424', norm:{min:360,max:424}, elId:'nmess01_g', pflicht:'Pflicht', drehstromOnly:true},
    {suf:'h', label:'U N-PE (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'≤ 5 V (Praxis-Richtwert)', kind:'number', einheit:'V', ph:'≤ 5', norm:{max:5}, elId:'nmess01_h', pflicht:'Pflicht'},
    {suf:'i', label:'Frequenz (Hz)', typ:'Zahl', inhalt:'Messwert in Hz', bedingung:'49,5–50,5 Hz. Bei NEA fachlich bewerten.', kind:'number', einheit:'Hz', ph:'50,0', norm:{min:49.5,max:50.5}, elId:'nmess01_i', pflicht:'Pflicht'}
  ]
};

/* ---------------- Block ZNS-01: Schleifen- und Netzimpedanz ---------------- */
const KAT_ZNS = 'Schleifen-/Netzimpedanz';

const ZNS_GROUP = {
  id:'ZNS-01', name:'Schleifen- und Netzimpedanz mit Kurzschlussstrom', cat:KAT_ZNS, badge:'Block',
  bedingung:'a–e je Stromkreis; a–c Pflicht, d–e optional. I_K2 wird im Stromkreis gegen den LS aus a bewertet, sonst gegen die Vorsicherung NETZ-05.',
  info:'zns', erkl:'impedanz',
  sub:[
    {suf:'a', label:'Überstrom-Schutzeinrichtung (LS / Sicherung)', typ:'Schnellauswahl + manuell', inhalt:'LS B/C/D/K/Z oder Sicherung gG/NH/Neozed/Diazed, z. B. „B 16A“, „gG 35A“, „NH 63A“', bedingung:'Bestimmt den Mindest-I_K in c. LS: B 5 × I_n, C 10 ×, D 20 ×, K 14 ×, Z 3 × I_n. Sicherung gG: I_a aus Tabelle (bis 32 A 0,4 s, darüber 5 s).', kind:'quickmanual', quick:['B 10A','B 16A','B 32A','C 16A','C 32A','C 63A','gG 16A','gG 35A','gG 63A'], elId:'zns01_a', erkl:'ls_typ', pflicht:'Pflicht'},
    {suf:'b', label:'Z_S (Ω) – Schleifenimpedanz L-PE', typ:'Zahl', inhalt:'Messwert in Ω', bedingung:'Max. = 230 V / Mindest-I_K.', kind:'number', einheit:'Ω', elId:'zns01_b', pflicht:'Pflicht'},
    {suf:'c', label:'I_K (A) – Kurzschlussstrom L-PE', typ:'Zahl (berechnet, überschreibbar)', inhalt:'230 V / Z_S', bedingung:'≥ Mindest-I_K aus a. Statuszeile zeigt das Ergebnis.', kind:'number', einheit:'A', elId:'zns01_c', pflicht:'Pflicht', norm:{}},
    {suf:'d', label:'Z_I (Ω) – Netzimpedanz L-N', typ:'Zahl', inhalt:'Messwert in Ω', bedingung:'Max. = 230 V / Mindest-I_K2.', kind:'number', einheit:'Ω', elId:'zns01_d', pflicht:'Optional'},
    {suf:'e', label:'I_K2 (A) – Kurzschlussstrom L-N', typ:'Zahl (berechnet)', inhalt:'230 V / Z_I', bedingung:'≥ ca. 5 × Vorsicherung (NETZ-05). NEA: keine Bewertung.', kind:'readonly', elId:'zns01_e', ph:'automatisch berechnet', norm:{}}
  ]
};

/* ---------------- Block RISO-01: Isolationswiderstand (früher RISO-01 + RISO-02) ---------------- */
const RISO_GROUP = {
  id:'RISO-01', name:'Isolationswiderstand R_ISO', cat:'Isolationswiderstand', badge:'Block',
  bedingung:'a bestimmt den Grenzwert in b. Geräteprüfung: GER-05b.',
  info:'riso', erkl:'riso',
  sub:[
    {suf:'a', label:'Prüfspannung', typ:'Dropdown', inhalt:'500 V ohne Verbraucher / 250 V mit Verbrauchern / 1000 V DC / SELV-PELV', bedingung:'Nicht vorbelegt. SELV-PELV setzt den Grenzwert in b auf ≥ 0,5 MΩ.', kind:'select', options:['500 V ohne Verbraucher','250 V mit Verbrauchern','1000 V DC','SELV-PELV'], elId:'riso01', pflicht:'Pflicht'},
    {suf:'b', label:'Messwert R_ISO (MΩ)', typ:'Zahl', inhalt:'Messwert in MΩ (Fluke 1663)', bedingung:'≥ 1 MΩ, bei SELV-PELV (a) ≥ 0,5 MΩ.', kind:'number', einheit:'MΩ', norm:{min:1}, elId:'riso02', pflicht:'Pflicht'}
  ]
};

/* Frühere Feld-IDs → neue IDs (ältere Entwürfe laden weiter) */
const FELD_ALT_IDS = { 'RISO-01-a':'RISO-01', 'RISO-01-b':'RISO-02' };

/* ---------------- Block RCD-01: RCD-Messung ---------------- */
const RCD_GROUP = {
  id:'RCD-01', name:'RCD-Messung mit Berührungsspannung', cat:'RCD-Prüfung', badge:'Block',
  bedingung:'Bei „ohne RCD" in a entfallen b–i. Sonst alle Unterfelder Pflicht.',
  info:'rcd',
  sub:[
    {suf:'a', label:'RCD-Typ', typ:'Schnellauswahl + manuell', inhalt:'A / B / B+ / F / AC / ohne RCD', bedingung:'Bestimmt die Prüfstromform.', kind:'quickmanual', quick:['A','B','B+','F','AC','ohne RCD'], elId:'rcd01_a', erkl:'rcd_typ', pflicht:'Pflicht'},
    {suf:'b', label:'Bemessungsstrom I_n', typ:'Schnellauswahl + manuell', inhalt:'16 A / 25 A / 40 A / 63 A', bedingung:'Wert des RCD, nicht des LS.', kind:'quickmanual', quick:['16 A','25 A','40 A','63 A'], tastatur:'zahl', elId:'rcd01_b', erkl:'rcd_in', pflicht:'Pflicht'},
    {suf:'c', label:'Bemessungsfehlerstrom I_Δn', typ:'Schnellauswahl + manuell', inhalt:'30 mA / 100 mA / 300 mA', bedingung:'Bestimmt das Toleranzband in d.', kind:'quickmanual', quick:['30 mA','100 mA','300 mA'], tastatur:'zahl', elId:'rcd01_c', erkl:'rcd_idn', pflicht:'Pflicht'},
    {suf:'c2', label:'Prüfstrom', typ:'Dropdown', inhalt:'1 × / 2 × / 5 × I_Δn', bedingung:'Vorbelegt 5 × I_Δn. Bestimmt die max. Auslösezeit in e.', kind:'select', options:['1 × IΔn (max. 300 ms)','2 × IΔn (max. 150 ms)','5 × IΔn (max. 40 ms)'], default:'5 × IΔn (max. 40 ms)', elId:'rcd01_c2', pflicht:'Pflicht'},
    {suf:'d', label:'Auslösestrom (mA)', typ:'Zahl', inhalt:'Messwert in mA', bedingung:'0,5–1,0 × I_Δn (aus c).', kind:'number', einheit:'mA', elId:'rcd01_d', erkl:'rcd_strom', pflicht:'Pflicht', norm:{}},
    {suf:'e', label:'Auslösezeit (ms)', typ:'Zahl', inhalt:'Messwert in ms', bedingung:'300 / 150 / 40 ms bei 1 × / 2 × / 5 × I_Δn (aus c2).', kind:'number', einheit:'ms', norm:{max:40}, elId:'rcd01_e', erkl:'rcd_zeit', pflicht:'Pflicht'},
    {suf:'f', label:'Spannungsart', typ:'Segmentiert', inhalt:'AC / DC', bedingung:'Mit g → U_L in h.', kind:'segmented', options:['AC','DC'], name_group:'ul01', elId:'ul01', pflicht:'Pflicht'},
    {suf:'g', label:'Bereich', typ:'Segmentiert', inhalt:'normal / erhöht', bedingung:'Mit f → U_L in h. Nicht vorbelegt.', kind:'segmented', options:['normal','erhöht'], name_group:'ul02', elId:'ul02', erkl:'rcd_ul', pflicht:'Pflicht'},
    {suf:'h', label:'Zulässige Berührungsspannung U_L', typ:'Zahl (berechnet)', inhalt:'50 V AC / 120 V DC · erhöht 25 V AC / 60 V DC', bedingung:'Aus f + g.', kind:'readonly', elId:'ul03', ph:'abhängig von f/g', markieren:true},
    {suf:'i', label:'Berührungsspannung U_F (V)', typ:'Zahl', inhalt:'Messwert in V', bedingung:'≤ U_L aus h.', kind:'number', einheit:'V', elId:'rcd01_i', erkl:'rcd_ub', pflicht:'Pflicht', norm:{}}
  ]
};
