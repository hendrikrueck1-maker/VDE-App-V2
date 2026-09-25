/* =========================================================================
   Master-Feldbibliothek – Felddaten.

   DIES ist die Datei, die geändert wird, wenn sich an Messungen/Feldern
   etwas ändert (neues Feld, neuer Grenzwert, neue Anleitung, neues Icon).
   Rendering-Logik liegt in masterbibliothek.js, Icon-Technik in icons.js –
   beide bitte NICHT anfassen, nur um ein Feld zu ändern.

   Jedes Feld = ein eigenständiger Datensatz mit sichtbarer ID.
   Ausnahmen (bewusst als EIN zusammenhängender Block belassen):
   - ZNS-01 Schleifenimpedanz Z_S je Stromkreis (inkl. vorgelagertem LS-Typ,
            automatischer I_K-Berechnung) UND Netzimpedanz Z_L-N (netzweit,
            inkl. I_K2 und Bezug zur Vorsicherung) – auf Nutzerwunsch zu
            einer gemeinsamen Prüfung zusammengeführt (vormals ZS-01/ZN-01)
   - RCD-01 RCD-Messung (getrennt vom Leitungsschutzschalter!), inkl. Berührungsspannung
            (wird bei der RCD-Messung automatisch mitgemessen)

   Quelle: VDE-App_Design-Extraktion_fuer_Neuprogrammierung.md (Abschnitte 3-5)
   ========================================================================= */

/* ---------------- Kurzanleitungen + Icon-Zuordnung je Messung ----------------
   `icons`: Reihe von Icon-Badges, die IMMER sichtbar sind (auch wenn die
            Anleitungen global ausgeblendet sind) – siehe icons/messungen/.
   `typenLegende`: nur bei RCD – Icon-Legende AC/A/F/B/B+, aus icons/rcd-typen/,
            erscheint am Ende der ausklappbaren RCD-Anleitung. */
const INFO = {
  zns: {geraet:'Fluke 1663',
    was:'Gemeinsame Prüfung: Schleifenimpedanz Z_S der Fehlerschleife je Stromkreis wird gemessen, um zu bestätigen, dass der Überstromschutz im Fehlerfall schnell genug auslöst; daraus wird I_K automatisch berechnet. Die Netzimpedanz Z_L-N (netzweit, am Netzeingang) liefert mit demselben Messverfahren analog I_K2 als Referenzwert.',
    warum:'Zu hohe Schleifenimpedanz → Sicherung löst im Fehlerfall nicht rechtzeitig aus, Personen-/Brandschutz nicht mehr sichergestellt (DIN VDE 0100-410).',
    schritte:['Drehschalter auf Position „mit/ohne RCD" (Z-Loop-Funktion) stellen','Messleitungen gemäß Anleitung an L/N/PE bzw. Steckdose anschließen','Messung starten, Wert ablesen','Bei vorgeschaltetem RCD: Messung mit „No-Trip"-Funktion wiederholen'],
    icons:[{datei:'z_s_schleifenimpedanz', label:'Z_i (Z_S)'}]},
  rcd: {geraet:'Fluke 1663',
    was:'Auslösezeit (ΔT) und Auslösestrom (I_ΔN) des Fehlerstrom-Schutzschalters werden gemessen; die Berührungsspannung wird dabei automatisch mitgemessen (kein separater Messschritt) – daher sind die Berührungsspannungs-Felder Teil dieser Karte.',
    warum:'RCD muss innerhalb der Normvorgaben zuverlässig auslösen (typisch < 300 ms bei 1×I_ΔN, DIN VDE 0100-410), um Personen vor gefährlichem Berührungsstrom zu schützen.',
    schritte:['Drehschalter auf „RCD" bzw. „ΔT/I_ΔN" stellen','Auslösestrom-Stufe (z. B. ×½, ×1, ×5) und Polarität einstellen','Prüfstrom-Wellenform passend zum RCD-Typ wählen: „~" für Typ AC/A, Halbwelle für pulsstromsensitive Typ A, „=" (glatter Gleichstrom) für Typ B – bei zeitverzögerten/selektiven RCDs zusätzlich „[S]" wählen','Vor der Messung: Verbindung zwischen Neutralleiter und Schutzleiter prüfen','Messung starten – Gerät löst den RCD testweise aus (bei Typ B beide Phasenwinkel 0° und 180° prüfen)','Auslösezeit, -strom und Berührungsspannung ablesen und dokumentieren'],
    icons:[{datei:'rcd_ausloesezeit_deltat', label:'ΔT'},{datei:'rcd_ausloesestrom_i_deltan', label:'I_ΔN'}],
    typenLegende:[{datei:'rcd_typ_ac',label:'AC'},{datei:'rcd_typ_a',label:'A'},{datei:'rcd_typ_f',label:'F'},{datei:'rcd_typ_b',label:'B'},{datei:'rcd_typ_b_plus',label:'B+'}]},
  riso: {geraet:'Fluke 1663',
    was:'Isolationswiderstand zwischen aktiven Leitern und Erde/Schutzleiter.',
    warum:'Zu niedriger Wert deutet auf beschädigte Isolierung hin – Risiko für Stromschlag/Kurzschluss.',
    schritte:['Anlage/Stromkreis spannungsfrei schalten (Voraussetzung!)','Drehschalter auf „Riso" stellen, Prüfspannung wählen (z. B. 500 V; bei angeschlossenen Geräten 250 V)','Messleitungen anschließen, Messung starten','Wert ablesen; Anlage erst nach Messende wieder unter Spannung setzen'],
    icons:[{typ:'foto', datei:'r_iso_isolationswiderstand', label:'R_ISO'}]},
  riso_ger: {geraet:'Fluke 6500-2',
    was:'Isolationswiderstand zwischen den Anschlüssen L/N und PE bzw. berührbaren leitfähigen Teilen des Prüflings, wahlweise mit 250 V oder 500 V DC Prüfspannung (siehe GER-05b).',
    warum:'Zu niedriger Wert deutet auf beschädigte Isolierung hin – Risiko für Stromschlag/Kurzschluss.',
    schritte:['Taste RISO am Gerätetester wählen','Prüfspannung 250 V oder 500 V einstellen (GER-05b)','Prüfling an die Prüfsteckdose anschließen, Messung starten','Wert ablesen'],
    icons:[{typ:'glyph', haupt:'R', sub:'ISO', label:'R_ISO'}]},
  rpe: {geraet:'Fluke 1663',
    was:'Widerstand des Schutzleiters (PE).',
    warum:'Zu hoher Wert verhindert im Fehlerfall den sicheren Potentialausgleich – Berührungsspannung kann gefährlich hoch werden.',
    schritte:['Drehschalter auf „Rlo" stellen','Messleitungen anschließen – zwischen Stecker und PE-Anschluss','Ggf. Nullabgleich der Messleitungen durchführen','TEST drücken und Leitung während der Messung leicht bewegen (Wackelkontakt-Prüfung nach DIN EN 50699)','Wert ablesen'],
    icons:[{typ:'foto', datei:'r_pe_schutzleiterwiderstand', label:'R_PE'}]},
  rpe_ger: {geraet:'Fluke 6500-2',
    was:'Widerstand des Schutzleiters (PE) am Prüfling, gemessen mit 200 mA Prüfstrom (Tasten-Messfunktion statt Rlo-Drehschalter wie beim Installationstester).',
    warum:'Zu hoher Wert verhindert im Fehlerfall den sicheren Potentialausgleich – Berührungsspannung kann gefährlich hoch werden.',
    schritte:['Taste RPE am Gerätetester wählen','Prüfling an die Prüfsteckdose bzw. Messleitungen anschließen','Messung starten, Wert ablesen'],
    icons:[{typ:'glyph', haupt:'R', sub:'PE', label:'R_PE · 200 mA'}]},
  rlo: {geraet:'Fluke 1663',
    was:'Durchgängigkeit der Potenzialausgleichsverbindung – gleiche niederohmige Widerstandsmessfunktion („Rlo") wie bei R_PE, hier angewendet zwischen Potenzialausgleichsschiene/Erdungsanlage und den anzuschließenden leitfähigen Teilen.',
    warum:'Zu hoher Wert bzw. Unterbrechung verhindert im Fehlerfall den sicheren Potentialausgleich – Berührungsspannung kann gefährlich hoch werden.',
    schritte:['Drehschalter auf „Rlo" stellen','Messleitungen anschließen – zwischen Potenzialausgleichsschiene und dem zu prüfenden leitfähigen Teil','Ggf. Nullabgleich der Messleitungen durchführen','TEST drücken und Leitung während der Messung leicht bewegen (Wackelkontakt-Prüfung nach DIN EN 50699)','Wert ablesen'],
    icons:[{datei:'r_lo_potenzialausgleich', label:'R_LO'}]},
  vhz: {geraet:'Fluke 1663', was:'Anliegende Netzspannung bzw. Referenzwert für weitere Berechnungen (z. B. zulässige Schleifenimpedanz).', warum:'',
    schritte:['Drehschalter auf „V, Hz" stellen','Messleitungen anschließen','Spannungswert ablesen und dokumentieren'],
    icons:[{datei:'netzspannung_v_hz', label:'V, Hz'}]},
  phase: {geraet:'Fluke 1663', was:'Drehfeldrichtung (Rechts-/Linksdrehfeld) bei Drehstromanschlüssen.', warum:'',
    schritte:['Drehschalter auf „Phase" stellen','Messleitungen an L1/L2/L3 anschließen','Drehrichtung am Display ablesen und dokumentieren'],
    icons:[{datei:'phase_drehfeldmessung', label:'Phase'}]},
  ableit: {geraet:'Fluke 6500-2', was:'Drei Messmethoden mit unterschiedlichem Messprinzip (siehe Bedingung bei GER-10): Ersatzableitstrom, Differenzstrom, Direktmessung. Kein Pendant beim Fluke 1663.', warum:'',
    schritte:['Messmethode passend zu Schutzklasse/Gerätetyp wählen (GER-10)','Messung gemäß gewählter Methode durchführen','Wert in mA ablesen und dokumentieren (GER-09)'],
    /* Symbolische Tasten-Icons (keine Fotos, da der Fluke 6500-2 Tasten statt eines
       Drehschalters hat). `wert` verknüpft jedes Icon mit der passenden GER-10-
       Dropdown-Option: das Icon der aktuell gewählten Messmethode wird hervor-
       gehoben, die anderen beiden abgeblendet (siehe updateAbleitIcon() in
       masterbibliothek.js). Label bewusst ohne Klammertext (nur Kurzform), um
       die Icon-Reihe kompakt zu halten – die ausführliche Bezeichnung steht im
       jeweiligen Bedingung-Text von GER-09/GER-10. */
    icons:[
      {typ:'glyph', haupt:'I', sub:'EA', label:'I_EA', wert:'Ersatzableitstrom'},
      {typ:'glyph', custom:'I<span class="glyph-sub">Δ</span><span class="glyph-slash">/</span>I<span class="glyph-sub">L</span>', label:'IΔ / I_L', wert:'Differenzstrom'},
      {typ:'glyph', haupt:'I', sub:'B', label:'I_B', wert:'Direktmessung'}
    ]}
};

/* ---------------- Feld-Datensätze ---------------- */
const FIELDS = [
// ===== STAMMDATEN =====
{id:'STAM-01',name:'Auftraggeber / Prüfort',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',
 inhalt:'Freitext',bedingung:'Keine Bedingung.',kind:'text',ph:'z. B. Stadttheater Konstanz'},
{id:'STAM-02',name:'Gebäude / Bereich',cat:'Stammdaten',typ:'Text mit editierbarer Liste (Datalist)',pflicht:'Pflicht',
 inhalt:'Nutzerverwaltete Liste, nicht hart codiert',bedingung:'Liste wird vom Nutzer selbst gepflegt (Button „Liste bearbeiten"), gemeinsam für alle aktuellen Prüfprotokolle. Speicherung aktuell im Browser (localStorage) – zieht bei Umzug auf eine echte Datenbank mit um.',kind:'text',ph:'editierbare Liste',datalist:['Hauptbühne','Studiobühne','Werkstatt'],editableList:true},
{id:'STAM-03',name:'Anlage / Objekt',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Keine Bedingung.',kind:'text',ph:'Bezeichnung Anlage/Objekt'},
{id:'STAM-04',name:'Prüflings-ID',cat:'Stammdaten',typ:'Text',pflicht:'Optional',inhalt:'Freitext',bedingung:'Keine Bedingung. Optisch wie ein Pflichtfeld markiert (gelb/grün), obwohl technisch optional.',kind:'text',ph:'interne Kennung',markieren:true},
{id:'STAM-05',name:'Protokoll-Nr.',cat:'Stammdaten',typ:'Text (automatisch)',pflicht:'Optional',
 inhalt:'Format: ABK/TT/MM/JJJJ/laufende Nummer (3-stellig), z. B. ANL/23/09/2026/001. ABK aus STAM-13 (Prüfart), Datum aus STAM-08.',
 bedingung:'Wird per Klick auf „Neue Nr. vergeben" erzeugt (nicht bei jeder Änderung neu berechnet). Zähler je Abkürzung+Datum in localStorage, zählt nur hoch, wird nie zweimal vergeben – im Zweifel wird lieber eine Nummer übersprungen als doppelt vergeben.',
 kind:'readonly',elId:'stam05',ph:'wird automatisch vergeben',knopf:{id:'stam05_neu_btn',label:'Neue Nr. vergeben'}},
{id:'STAM-06',name:'Prüfer/-in',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Keine Bedingung.',kind:'text',ph:'Name'},
{id:'STAM-07',name:'Qualifikation',cat:'Stammdaten',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Elektrofachkraft / Unterwiesene Person',bedingung:'Kein vorbelegter Wert.',kind:'select',options:['Elektrofachkraft','Unterwiesene Person']},
{id:'STAM-08',name:'Prüfdatum',cat:'Stammdaten',typ:'Datum',pflicht:'Pflicht',inhalt:'Datumswert',bedingung:'Wird beim Öffnen automatisch mit dem heutigen Datum vorbelegt (änderbar). Basis für automatische Berechnung von STAM-23 (nächster Prüftermin) und STAM-05 (Protokoll-Nr.).',kind:'date',elId:'stam08'},
{id:'STAM-09',name:'Prüfgerät (Installationstester) – Name/Typ',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext, z. B. „Fluke 1663"',bedingung:'Automatische Übernahme aus editierbaren Prüfgeräte-Stammdaten.',kind:'text',ph:'z. B. Fluke 1663'},
{id:'STAM-10',name:'Seriennummer Installationstester',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Keine Bedingung.',kind:'text',ph:'Seriennummer'},
{id:'STAM-11',name:'Prüfgerät (Gerätetester) – Name/Typ',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext, z. B. „Fluke 6500-2"',bedingung:'Nur relevant für Geräteprüfung, dort Pflicht.',kind:'text',ph:'z. B. Fluke 6500-2'},
{id:'STAM-12',name:'Seriennummer Gerätetester',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Nur relevant für Geräteprüfung, dort Pflicht.',kind:'text',ph:'Seriennummer'},
{id:'STAM-13',name:'Grund der Prüfung / Prüfart',cat:'Stammdaten',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Anlagenprüfung: Neuanlage / Bestand / Änderung / Wiederholung. Geräteprüfung: Erstprüfung / Wiederholungsprüfung / Prüfung nach Reparatur (ehemals eigenes Feld GER-01, hier zusammengeführt).',
 bedingung:'Gilt für Anlagenprüfung UND Geräteprüfung – jeweils eigener Optionsblock. Kein vorbelegter Wert. Liefert außerdem die Abkürzung für STAM-05 (Protokoll-Nr.).',
 kind:'select',options:['Neuanlage','Bestand','Änderung','Wiederholung','Erstprüfung (Gerät)','Wiederholungsprüfung (Gerät)','Prüfung nach Reparatur (Gerät)'],elId:'stam13'},
{id:'STAM-14',name:'Prüfart/Norm',cat:'Stammdaten',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'DIN VDE 0100-600 / DIN VDE 0105-100 / DIN VDE 0100-600 + 0105-100 / DIN VDE 0701-0702 / DIN EN 50678 / DIN EN 50699',
 bedingung:'Gilt für Anlagenprüfung UND Geräteprüfung. Bei Geräteprüfung zusätzlich die neueren EN-Normen: DIN EN 50678 (ersetzt VDE 0701, Prüfung nach Reparatur/Änderung) und DIN EN 50699 (ersetzt VDE 0702, Wiederholungsprüfung). Kein vorbelegter Wert.',
 kind:'select',options:['DIN VDE 0100-600','DIN VDE 0105-100','DIN VDE 0100-600 / 0105-100','DIN VDE 0701-0702','DIN EN 50678 (ersetzt VDE 0701)','DIN EN 50699 (ersetzt VDE 0702)']},
{id:'STAM-16',name:'Firma / Vermieter',cat:'Stammdaten',typ:'Text',pflicht:'Optional',inhalt:'Freitext – getrennt von NETZ-04 Netzbetreiber',bedingung:'Nur Anschlussprüfung. Kein Pflichtfeld, kann grau/optisch zurückhaltend dargestellt werden.',kind:'text',ph:'Firma/Vermieter'},
{id:'STAM-18',name:'Ansprechpartner',cat:'Stammdaten',typ:'Text',pflicht:'Optional',inhalt:'Freitext',bedingung:'Nur Anschlussprüfung. Optische Kennzeichnung: grau statt gelb hinterlegt.',kind:'text',ph:'Name'},
{id:'STAM-19',name:'Telefon',cat:'Stammdaten',typ:'Text (Telefon)',pflicht:'Optional',inhalt:'Freitext/Telefonnummer',bedingung:'Nur Anschlussprüfung. Grau statt gelb hinterlegt.',kind:'tel',ph:'Telefonnummer'},
{id:'STAM-20',name:'Standort Übergabepunkt',cat:'Stammdaten',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Nur Anschlussprüfung.',kind:'text',ph:'z. B. Verteiler Ost'},
{id:'STAM-21',name:'Anschlussleistung',cat:'Stammdaten',typ:'Zahl (Dezimal)',pflicht:'Optional',inhalt:'Wert in kVA',bedingung:'Nur Anschlussprüfung.',kind:'number',ph:'z. B. 63',einheit:'kVA'},
{id:'STAM-22',name:'Prüfintervall',cat:'Stammdaten',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Pflicht',
 inhalt:'Schnellauswahl: 1 Monat / 2 Monate / 3 Monate / 1 Jahr / 2 Jahre / 4 Jahre',
 bedingung:'Wird in allen drei Prüfprotokollen verwendet. Bestimmt zusammen mit STAM-08 automatisch STAM-23 (nächster Prüftermin).',
 kind:'quickmanual',quick:['1 Monat','2 Monate','3 Monate','1 Jahr','2 Jahre','4 Jahre'],elId:'stam22'},
{id:'STAM-23',name:'Nächster Prüftermin',cat:'Stammdaten',typ:'Datum (automatisch)',pflicht:'—',
 inhalt:'Berechnet aus STAM-08 + STAM-22',bedingung:'Automatisch berechnet, kein manuelles Eingabefeld.',kind:'readonly',elId:'stam23',ph:'wird automatisch berechnet'},

// ===== NETZSYSTEM =====
{id:'NETZ-01',name:'Netzsystem',cat:'Netzsystem',typ:'Dropdown (mit Standardwert)',pflicht:'Pflicht',
 inhalt:'TN-S / TN-C-S / TN-C / TT / IT',bedingung:'Vorbelegt mit „TN-C" (häufigster Fall) – Ausnahme von der „kein Default"-Regel, da Konfigurationsfeld statt Prüfergebnis. Vor dem Speichern bestätigen/ggf. ändern.',
 kind:'select',options:['TN-S','TN-C-S','TN-C','TT','IT'],default:'TN-C'},
{id:'NETZ-02',name:'Netzspannung',cat:'Netzsystem',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Pflicht',
 inhalt:'Schnellauswahl: 230 V / 230/400 V / 400 V',bedingung:'Bestimmt Toleranzband für NMESS-01…06 (±10 % nach DIN EN 50160).',
 kind:'quickmanual',quick:['230 V','230/400 V','400 V'],elId:'netz02',info:'vhz'},
{id:'NETZ-03',name:'Art der Einspeisung',cat:'Netzsystem',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Festanschluss / Steckstelle / Baustromverteiler / Sonstiges',
 bedingung:'Beeinflusst Pflicht der Netzmessung NMESS-01…09. Deckt auch „Art des Speisepunkts" ab (Festanschluss/Steckstelle).',
 kind:'select',options:['Festanschluss','Steckstelle','Baustromverteiler','Sonstiges']},
{id:'NETZ-04',name:'Netzbetreiber (Verteilnetzbetreiber)',cat:'Netzsystem',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',
 bedingung:'Pflichtfeld für alle Protokolltypen.',kind:'text',ph:'Name Netzbetreiber'},
{id:'NETZ-05',name:'Vorsicherung (Hausanschluss/Speisepunkt)',cat:'Netzsystem',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Pflicht',
 inhalt:'Schnellauswahl: NH 3x100A / NH 3x63A / CEE 63A / CEE 125A / NEA',
 bedingung:'Bei Auswahl „NEA": NMESS-08 (Frequenz) wird Pflicht. Wert bestimmt live den Mindest-Kurzschlussstrom I_K2 bei ZNS-01e (Netzimpedanz) – Praxis-Näherung: ca. 5× Nennstrom bei NH-Sicherungen/CEE-Absicherung, keine automatische Prüfung bei „NEA" (kein fester Auslösefaktor).',
 kind:'quickmanual',quick:['NH 3x100A','NH 3x63A','CEE 63A','CEE 125A','NEA'],elId:'netz05'},

// ===== NETZMESSUNG =====
// NETZ-08 (Drehstrom/1-phasig) steht bewusst HIER statt bei Netzsystem: sie
// gehört inhaltlich zu den nachfolgenden Spannungsmessungen (bestimmt, welche
// davon überhaupt sinnvoll/sichtbar sind) und ist mit ihnen zusammengefasst.
{id:'NETZ-08',name:'Drehstrom / 1-phasig',cat:'Netzmessung',typ:'Umschalter (2 Zustände)',pflicht:'Pflicht',
 inhalt:'Drehstrom / 1-phasig',bedingung:'Globaler Schalter für die gesamte Netzmessung: bei „1-phasig" bleiben nur NMESS-01 (U L1-N), NMESS-07 (U N-PE) und NMESS-08 (Frequenz) sichtbar/relevant, alle anderen (L2/L3-Spannungen, Drehfeld) werden ausgeblendet.',
 kind:'toggle2',opts:['Drehstrom','1-phasig'],elId:'netz08'},
{id:'NMESS-01',name:'U L1-N',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',
 inhalt:'Messwert in V',bedingung:'Toleranz 207–244 V bei 230 V (DIN EN 50160).',
 kind:'number',ph:'207–244',einheit:'V',norm:{min:207,max:244}},
{id:'NMESS-02',name:'U L2-N',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',
 inhalt:'Messwert in V',bedingung:'Wie NMESS-01. Ausgeblendet bei NETZ-08 = „1-phasig".',kind:'number',ph:'207–244',einheit:'V',norm:{min:207,max:244},drehstromOnly:true},
{id:'NMESS-03',name:'U L3-N',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',
 inhalt:'Messwert in V',bedingung:'Wie NMESS-01. Ausgeblendet bei NETZ-08 = „1-phasig".',kind:'number',ph:'207–244',einheit:'V',norm:{min:207,max:244},drehstromOnly:true},
{id:'NMESS-04',name:'U L1-L2',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',
 inhalt:'Messwert in V',bedingung:'Toleranz 360–424 V bei 400 V. Ausgeblendet bei NETZ-08 = „1-phasig".',kind:'number',ph:'360–424',einheit:'V',norm:{min:360,max:424},drehstromOnly:true},
{id:'NMESS-05',name:'U L2-L3',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',
 inhalt:'Messwert in V',bedingung:'Wie NMESS-04. Ausgeblendet bei NETZ-08 = „1-phasig".',kind:'number',ph:'360–424',einheit:'V',norm:{min:360,max:424},drehstromOnly:true},
{id:'NMESS-06',name:'U L1-L3',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',
 inhalt:'Messwert in V',bedingung:'Wie NMESS-04. Ausgeblendet bei NETZ-08 = „1-phasig".',kind:'number',ph:'360–424',einheit:'V',norm:{min:360,max:424},drehstromOnly:true},
{id:'NMESS-07',name:'U N-PE',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit V',pflicht:'Pflicht',inhalt:'Messwert in V',
 bedingung:'Praxis-Richtwert ≤ 5 V (kein fester DIN-Grenzwert wie bei den L-N-/L-L-Spannungen, sondern ein üblicher Plausibilitäts-Schwellwert – deutlich höhere Werte deuten meist auf eine lose N-Verbindung/Ausgleichsströme hin und sollten fachlich bewertet werden). Bitte anpassen, falls in der Praxis ein anderer Schwellwert verwendet wird.',
 kind:'number',einheit:'V',norm:{max:5}},
{id:'NMESS-08',name:'Frequenz',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit Hz',pflicht:'Pflicht',inhalt:'Messwert in Hz, typ. 50,0',
 bedingung:'Toleranz 49,5–50,5 Hz (±1 %, DIN EN 50160, öffentliches Netz). Bei Versorgung über Generator/Wechselrichter (NETZ-05 = „NEA") ist in der Praxis eine größere Abweichung möglich – diese feste Toleranz dann bitte fachlich statt nach der Farbmarkierung bewerten. Zusätzlich ausdrücklich Pflicht bei NEA/Wechselrichter.',kind:'number',ph:'50,0',einheit:'Hz',norm:{min:49.5,max:50.5}},
{id:'NMESS-09',name:'Drehfeldrichtung',cat:'Netzmessung',typ:'Segmentiert rechts/links',pflicht:'Pflicht',
 inhalt:'rechts / links',
 bedingung:'Nur bei Drehstromanschluss (NETZ-08), sonst ausgeblendet. Zeigt die tatsächliche Drehrichtung statt einer i.O./n.i.O.-Bewertung. Dient in der Anlagenprüfung zugleich als „Drehfeld CEE" im Erproben-Abschnitt. Kein Wert vorbelegt.',
 kind:'segmented',options:['rechts','links'],name_group:'nmess09',info:'phase',drehstromOnly:true},
{id:'NMESS-10',name:'Geplante Last dieser Versorgung',cat:'Netzmessung',typ:'Zahl (Dezimal), Einheit kVA',pflicht:'Optional',
 inhalt:'Wert in kVA',bedingung:'Nur Übergabepunkt (Anschlussprüfung).',kind:'number',einheit:'kVA'},

// ===== BESICHTIGUNG =====
{id:'BES-01',name:'Betriebsmittel',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. (n.a. gesperrt)',bedingung:'„n.a." ist bei diesem Punkt gesperrt. Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],naDisabled:true,name_group:'bes01'},
{id:'BES-02',name:'Kabel & Leitungen',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. (n.a. gesperrt)',bedingung:'„n.a." ist bei diesem Punkt gesperrt. Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],naDisabled:true,name_group:'bes02'},
{id:'BES-03',name:'Zugänglichkeit',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes03'},
{id:'BES-04',name:'Schaltgeräte',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes04'},
{id:'BES-05',name:'Kennzeichnung',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes05'},
{id:'BES-06',name:'Zusätzlicher Potenzialausgleich',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes06'},
{id:'BES-07',name:'Berührungsschutz',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. (n.a. gesperrt)',bedingung:'„n.a." ist bei diesem Punkt gesperrt. Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],naDisabled:true,name_group:'bes07'},
{id:'BES-08',name:'Typenschild',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes08'},
{id:'BES-09',name:'Leiterverbindungen',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes09'},
{id:'BES-10',name:'Steckvorrichtungen/Kupplungen',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Anschlussprüfung/Übergabepunkt. Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes10'},
{id:'BES-11',name:'Witterungsschutz',cat:'Besichtigung',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Anschlussprüfung/Übergabepunkt, falls außen. Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'bes11'},

// ===== SCHUTZLEITERWIDERSTAND =====
{id:'RPE-01',name:'Schutzleiterwiderstand R_PE (Installationstester)',cat:'Schutzleiterwiderstand',typ:'Zahl (Dezimal), Einheit Ω',pflicht:'Pflicht',
 inhalt:'Messwert in Ω',
 bedingung:'Grenzwert ≤ 0,30 Ω. Eigenständige Prüfung, nicht Teil der Isolationswiderstandsprüfung. Für Anlagenprüfung (Stromkreis) und Anschlussprüfung (Übergabepunkt) mit dem Fluke 1663 – für die Geräteprüfung mit dem Fluke 6500-2 siehe GER-05.',
 kind:'number',einheit:'Ω',norm:{max:0.30},info:'rpe'},

// ===== ISOLATIONSWIDERSTAND =====
{id:'RISO-01',name:'R_ISO Modus / Prüfspannung (Installationstester)',cat:'Isolationswiderstand',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'500 V ohne Verbraucher / 250 V mit Verbrauchern / 1000 V DC / SELV-PELV',
 bedingung:'Kein vorbelegter Wert. Auswahl „SELV-PELV" senkt den Grenzwert für RISO-02 auf ≥ 0,5 MΩ. Für die Geräteprüfung mit dem Fluke 6500-2 siehe GER-05b.',kind:'select',options:['500 V ohne Verbraucher','250 V mit Verbrauchern','1000 V DC','SELV-PELV'],elId:'riso01'},
{id:'RISO-02',name:'R_ISO Messwert (Installationstester)',cat:'Isolationswiderstand',typ:'Zahl (Dezimal), Einheit MΩ',pflicht:'Pflicht',
 inhalt:'Messwert in MΩ',
 bedingung:'Grenzwert ≥ 1 MΩ allgemein, ≥ 0,5 MΩ wenn RISO-01 = „SELV-PELV" – wird live anhand von RISO-01 umgeschaltet (nicht nur als Text, sondern auch bei der Rot/Grün-Prüfung). Eigenständige Prüfung, nicht Teil der Schutzleiterwiderstandsprüfung. Für Anlagenprüfung (Stromkreis) und Anschlussprüfung (Übergabepunkt).',
 kind:'number',einheit:'MΩ',norm:{min:1},elId:'riso02',info:'riso'},

// ===== ERDUNG =====
{id:'ERD-01',name:'Potenzialausgleich grundsätzlich vorhanden',cat:'Erdung',typ:'Segmentiert i.O./n.i.O.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.'],name_group:'erd01'},
{id:'ERD-02',name:'Durchgängigkeit Potenzialausgleich',cat:'Erdung',typ:'Segmentiert i.O./n.i.O.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.'],name_group:'erd02',info:'rlo'},
{id:'ERD-03',name:'Erdungswiderstand R_E',cat:'Erdung',typ:'Zahl (Dezimal), Einheit Ω',pflicht:'Pflicht',
 inhalt:'Messwert in Ω',bedingung:'Grenzwert anlagenspezifisch, kein fester Normwert.',kind:'number',einheit:'Ω'},
{id:'ERD-04',name:'Erdungsmesspunkt',cat:'Erdung',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Optional',
 inhalt:'Schnellauswahl: HES (Haupterdungsschiene) / Potenzialausgleichsschiene (PAS) / Hauptverteilung HV / Unterverteilung UV / Fundamenterder / Blitzschutzanlage / Hauptschutzleiter PE / Hauptwasserleitung / Heizungsanlage / Gasleitung (Isolierstück beachten) / Klima-/Lüftungsanlage / Gebäudekonstruktion / Stahlbau / Traverse / Tribüne / Bühnenwagen / Drehbühne / Kabelpritsche / Kabeltrasse',
 bedingung:'Vollständige, auf Nutzerwunsch erweiterte Liste typischer Messpunkte im Theater-/Veranstaltungsumfeld (ersetzt die bisherige 4er-Kurzliste). Keine weitere Bedingung.',
 kind:'quickmanual',quick:['HES (Haupterdungsschiene)','Potenzialausgleichsschiene (PAS)','Hauptverteilung HV','Unterverteilung UV','Fundamenterder','Blitzschutzanlage','Hauptschutzleiter PE','Hauptwasserleitung','Heizungsanlage','Gasleitung (Isolierstück beachten)','Klima-/Lüftungsanlage','Gebäudekonstruktion / Stahlbau','Traverse / Tribüne','Bühnenwagen / Drehbühne','Kabelpritsche / Kabeltrasse'],elId:'erd04'},

// ===== GENERATOR =====
{id:'GEN-01',name:'Nennleistung',cat:'Generator',typ:'Zahl (Dezimal), Einheit kVA',pflicht:'Bedingt',inhalt:'Wert in kVA',bedingung:'Nur wenn Generator-Block zutreffend (Übergabepunkt).',kind:'number',einheit:'kVA'},
{id:'GEN-02',name:'Bauart',cat:'Generator',typ:'Text',pflicht:'Bedingt',inhalt:'Freitext',bedingung:'Nur wenn Generator-Block zutreffend.',kind:'text',ph:'z. B. Synchrongenerator'},
{id:'GEN-03',name:'Sternpunkt',cat:'Generator',typ:'Text',pflicht:'Bedingt',inhalt:'Freitext',bedingung:'Nur wenn Generator-Block zutreffend.',kind:'text',ph:'geerdet / isoliert'},
{id:'GEN-04',name:'Erdung',cat:'Generator',typ:'Text',pflicht:'Bedingt',inhalt:'Freitext',bedingung:'Nur wenn Generator-Block zutreffend.',kind:'text',ph:'Erdungsart'},
{id:'GEN-05',name:'Aufstellort',cat:'Generator',typ:'Text',pflicht:'Bedingt',inhalt:'Freitext',bedingung:'Nur wenn Generator-Block zutreffend.',kind:'text',ph:'Standort Generator'},

// ===== LEITUNG =====
{id:'LTG-01',name:'Durchgangsprüfung',cat:'Leitung',typ:'Segmentiert i.O./n.i.O.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O.',bedingung:'Eigenständige Prüfung des Kabeldurchgangs.',kind:'segmented',options:['i.O.','n.i.O.'],name_group:'ltg01'},
{id:'LTG-02',name:'Anschlussleitungslänge',cat:'Leitung',typ:'Zahl (Dezimal), Einheit m',pflicht:'Optional',inhalt:'Wert in m',bedingung:'Keine Bedingung.',kind:'number',einheit:'m'},
{id:'LTG-04',name:'Kabeltyp',cat:'Leitung',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Optional',
 inhalt:'Schnellauswahl: NYY-J / NYM-J / H07RN-F / H05RN-F',
 bedingung:'Anschlusskabel der Anlage (Anlagenprüfung, ggf. auch Anschlussprüfung). Optisch wie ein Pflichtfeld markiert (gelb/grün), obwohl technisch optional.',
 kind:'quickmanual',quick:['NYY-J','NYM-J','H07RN-F','H05RN-F'],elId:'ltg04',markieren:true},
{id:'LTG-05',name:'Leiter-Anzahl',cat:'Leitung',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Optional',
 inhalt:'Schnellauswahl: 3G / 4G / 5G',bedingung:'Keine Bedingung. Optisch wie ein Pflichtfeld markiert (gelb/grün), obwohl technisch optional.',kind:'quickmanual',quick:['3G','4G','5G'],elId:'ltg05',markieren:true},
{id:'LTG-06',name:'Querschnitt',cat:'Leitung',typ:'Schnellauswahl + manuelle Eingabe',pflicht:'Optional',
 inhalt:'Schnellauswahl: 1,5 mm² / 2,5 mm² / 4 mm² / 6 mm² / 10 mm² / 16 mm²',bedingung:'Keine Bedingung. Optisch wie ein Pflichtfeld markiert (gelb/grün), obwohl technisch optional.',
 kind:'quickmanual',quick:['1,5 mm²','2,5 mm²','4 mm²','6 mm²','10 mm²','16 mm²'],elId:'ltg06',markieren:true},

// ===== ERPROBEN =====
{id:'ERP-01',name:'Funktion Anlage',cat:'Erproben',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Anlagenprüfung. Kein Wert vorbelegt.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp01'},
{id:'ERP-03',name:'Polarität/Steckdosenbelegung',cat:'Erproben',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Anlagenprüfung UND Übergabepunkt (Anschlussprüfung). Betrifft die Steckdosenbelegung, nicht die Kabelprüfung aus LTG-01.',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp03'},
{id:'ERP-04',name:'Schutzeinrichtungen',cat:'Erproben',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Wird in mehreren Prüfprotokollen verwendet (nicht nur Anlagenprüfung).',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp04'},
{id:'ERP-05',name:'RCD-Prüftaste',cat:'Erproben',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Bedingt',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Nur Pflicht, wenn eine RCD-Schutzeinrichtung vorhanden ist (RCD-01-a ≠ „ohne RCD"). Wird in mehreren Prüfprotokollen verwendet (nicht nur Anlagenprüfung).',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp05'},
{id:'ERP-06',name:'Drehrichtung Motoren',cat:'Erproben',typ:'Segmentiert i.O./n.i.O./n.a.',pflicht:'Pflicht',inhalt:'i.O. / n.i.O. / n.a.',bedingung:'Wird in mehreren Prüfprotokollen verwendet (nicht nur Anlagenprüfung).',kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'erp06'},

// ===== GERÄTEPRÜFUNG =====
{id:'GER-02',name:'Gerätebezeichnung',cat:'Geräteprüfung',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Keine Bedingung.',kind:'text',ph:'z. B. Bühnenscheinwerfer'},
{id:'GER-03',name:'Standort',cat:'Geräteprüfung',typ:'Text',pflicht:'Pflicht',inhalt:'Freitext',bedingung:'Keine Bedingung.',kind:'text',ph:'z. B. Lager Technik'},
{id:'GER-04',name:'Gerätetyp',cat:'Geräteprüfung',typ:'Freitext mit Vorschlagsliste (Datalist)',pflicht:'Pflicht',
 inhalt:'Freitext – Vorschlagsliste (Auszug): Verlängerungsleitung, Mehrfachsteckdose, Bühnenscheinwerfer, Lötkolben, Bohrmaschine, Kaffeemaschine, Laptop-Netzteil, Nebelmaschine, Funkmikrofon-Ladestation, Verteiler mobil',
 bedingung:'Bewusst Freitext statt starres Dropdown (> 50 mögliche Typen, nicht abschließend listbar). Grenzwert Ableitstrom (GER-09) hängt vom eingetragenen Gerätetyp ab.',
 kind:'text',ph:'Gerätetyp eingeben oder aus Vorschlägen wählen',
 datalist:['Verlängerungsleitung','Mehrfachsteckdose','Bühnenscheinwerfer','Lötkolben','Bohrmaschine','Kaffeemaschine','Laptop-Netzteil','Nebelmaschine','Funkmikrofon-Ladestation','Verteiler mobil']},
{id:'GER-06',name:'Inventar-/Seriennummer',cat:'Geräteprüfung',typ:'Text',pflicht:'Optional',inhalt:'Freitext',bedingung:'Keine Bedingung. Optisch wie ein Pflichtfeld markiert (gelb/grün), obwohl technisch optional.',kind:'text',ph:'Inventar- oder Seriennummer',markieren:true},
{id:'GER-07',name:'Schutzklasse',cat:'Geräteprüfung',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'I / II / III',bedingung:'Kein vorbelegter Wert. Bestimmt live die Grenzwerte bei GER-05c (R_ISO: SK I ≥ 1 MΩ, SK II ≥ 2 MΩ) und GER-09 (Ableitstrom, zusätzlich abhängig von GER-10) – Schutzklasse II: R_PE (GER-05) i. d. R. nicht zutreffend, Schutzklasse III (SELV/PELV): weder R_ISO- noch Ableitstrom-Grenzwert hinterlegt.',
 kind:'select',options:['I','II','III']},
{id:'GER-08',name:'Leitungslänge',cat:'Geräteprüfung',typ:'Zahl (Dezimal), Einheit m',pflicht:'Optional',inhalt:'Wert in m',bedingung:'Beeinflusst den zulässigen Grenzwert von GER-05 (R_PE) bei diesem Gerät.',kind:'number',einheit:'m'},
{id:'GER-05',name:'Schutzleiterwiderstand R_PE (Gerätetester)',cat:'Geräteprüfung',typ:'Zahl (Dezimal), Einheit Ω',pflicht:'Pflicht',
 inhalt:'Messwert in Ω, gemessen mit 200 mA Prüfstrom',
 bedingung:'Grenzwert ≤ 0,30 Ω, zusätzlich abhängig von Leitungslänge (GER-08) und Schutzklasse (GER-07; bei Schutzklasse II i. d. R. nicht zutreffend).',
 kind:'number',einheit:'Ω',norm:{max:0.30},info:'rpe_ger'},
{id:'GER-05b',name:'R_ISO Modus / Prüfspannung (Gerätetester)',cat:'Geräteprüfung',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'250 V DC / 500 V DC',
 bedingung:'Kein vorbelegter Wert. Der Fluke 6500-2 kennt nur diese zwei Prüfspannungen (Handbuch). 250 V insbesondere bei Geräten mit empfindlichen elektronischen Bauteilen (z. B. Computer, IT-Geräte) zum Schutz vor Beschädigung, 500 V sonst üblich bei Schutzklasse I.',
 kind:'select',options:['250 V DC','500 V DC'],elId:'ger05b'},
{id:'GER-05c',name:'R_ISO Messwert (Gerätetester)',cat:'Geräteprüfung',typ:'Zahl (Dezimal), Einheit MΩ',pflicht:'Pflicht',
 inhalt:'Messwert in MΩ',
 bedingung:'Grenzwert abhängig von der Schutzklasse (GER-07) – wird live umgeschaltet: Schutzklasse I ≥ 1 MΩ, Schutzklasse II ≥ 2 MΩ (höhere Anforderung, da keine PE-Rückfallebene). Schutzklasse III (SELV/PELV) wird nicht geprüft, da hier keine feste Grenze hinterlegt ist.',
 kind:'number',einheit:'MΩ',norm:{min:1},elId:'ger05c',info:'riso_ger'},
{id:'GER-10',name:'Messmethode Ableitstrom',cat:'Geräteprüfung',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Ersatzableitstrom / Differenzstrom / Direktmessung',
 bedingung:'Unterschiede: „Ersatzableitstrom" misst am spannungsfreien Gerät mit angelegter Ersatzspannung (Isolationswiderstand-äquivalent, kein Betriebsstrom) – typisch bei Schutzklasse I ohne Last. „Differenzstrom" misst im laufenden Betrieb die Differenz zwischen Außenleiter- und Neutralleiterstrom. „Direktmessung" misst den Ableitstrom direkt am berührbaren leitfähigen Teil gegen Erde, Gerät läuft normal. Nur Fluke 6500-2 (kein Pendant beim Fluke 1663). Kein vorbelegter Wert. Auf Nutzerwunsch wieder vor GER-09 einsortiert (Anzeige-Reihenfolge weicht damit von der numerischen ID-Reihenfolge ab): in der Praxis zuerst hier die Methode wählen, dann den Wert bei GER-09 eintragen.',
 kind:'select',options:['Ersatzableitstrom','Differenzstrom','Direktmessung'],elId:'ger10',info:'ableit'},
{id:'GER-09',name:'Ableitstrom',cat:'Geräteprüfung',typ:'Zahl (Dezimal), Einheit mA',pflicht:'Pflicht',
 inhalt:'Messwert in mA, ermittelt nach der in GER-10 gewählten Messmethode',
 bedingung:'Grenzwert abhängig von Schutzklasse (GER-07) UND Messmethode (GER-10) – wird live umgeschaltet: Schutzklasse I ≤ 3,5 mA (Ersatzableitstrom/Differenzstrom) bzw. ≤ 0,5 mA (Direktmessung/Berührungsstrom); Schutzklasse II ≤ 0,5 mA (Ersatzableitstrom/Differenzstrom) bzw. ≤ 0,25 mA (Direktmessung). Schutzklasse III wird nicht geprüft (SELV/PELV). Übliche Praxiswerte angelehnt an DIN EN 50699/VDE 0701-0702 – bei abweichenden Herstellervorgaben zum jeweiligen Gerätetyp (GER-04) bitte fachlich prüfen und ggf. anpassen. Der Zahlenwert allein ist ohne Angabe der Messmethode (GER-10) nicht aussagekräftig, da die drei Methoden unterschiedliche Ströme erfassen. Auf Nutzerwunsch wieder nach GER-10 einsortiert (Anzeige-Reihenfolge weicht damit von der numerischen ID-Reihenfolge ab): erst dort die Methode wählen, dann hier den Wert eintragen.',
 kind:'number',einheit:'mA',info:'ableit',norm:{},elId:'ger09'},
{id:'GER-11',name:'Sichtprüfung',cat:'Geräteprüfung',typ:'Segmentiert (Ankreuzfeld) i.O./n.i.O.',pflicht:'Kritisch',
 inhalt:'i.O. / n.i.O. (kein n.a.)',
 bedingung:'KRITISCHSTE REGEL im gesamten Projekt: niemals vorbelegte Auswahl, kein „n.a." möglich (sonst könnte eine nie durchgeführte Prüfung unbemerkt als „i.O." ins PDF gelangen). Ankreuzfeld-Stil analog ERP-04.',
 kind:'segmented',options:['i.O.','n.i.O.'],name_group:'ger11',kritisch:true},
{id:'GER-12',name:'Funktionsprüfung',cat:'Geräteprüfung',typ:'Segmentiert (Ankreuzfeld) i.O./n.i.O./n.a.',pflicht:'Pflicht',
 inhalt:'i.O. / n.i.O. / n.a.',
 bedingung:'Keine vorbelegte Auswahl, aber im Gegensatz zu GER-11 ist „n.a." zulässig (z. B. Gerät ohne separaten Funktionstest) – daher nicht als „kritisch" eingestuft. Ankreuzfeld-Stil analog ERP-04.',
 kind:'segmented',options:['i.O.','n.i.O.','n.a.'],name_group:'ger12'},
{id:'GER-13',name:'Prüfergebnis',cat:'Geräteprüfung',typ:'Segmentiert (Ankreuzfeld)',pflicht:'Pflicht',
 inhalt:'OK / Fehler / Nicht prüfbar',bedingung:'Kein vorbelegter Wert. Ankreuzfeld-Stil analog ERP-04.',
 kind:'segmented',options:['OK','Fehler','Nicht prüfbar'],name_group:'ger13'},

// ===== ABSCHLUSS =====
{id:'FIN-01',name:'Ampel-Beurteilung',cat:'Abschluss',typ:'Segmentiert (3 Zustände)',pflicht:'—',inhalt:'🟢 i.O. / 🟡 Bemerkung / 🔴 Mangel',bedingung:'Ergibt sich automatisch aus den übrigen Prüfergebnissen, kein eigenständiges Eingabefeld.',kind:'segmented',options:['🟢 i.O.','🟡 Bemerkung','🔴 Mangel'],name_group:'fin01'},
{id:'FIN-02',name:'Gesamtbewertung Mängel',cat:'Abschluss',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Keine Mängel festgestellt / Mängel festgestellt und behoben (siehe Bemerkung) / Mängel festgestellt (siehe Bemerkung)',
 bedingung:'Kein vorbelegter Wert. Bei den beiden Mängel-Optionen gehört eine Erläuterung ins Bemerkungsfeld (FIN-09).',
 kind:'select',options:['Keine Mängel festgestellt','Mängel festgestellt und behoben (siehe Bemerkung)','Mängel festgestellt (siehe Bemerkung)']},
{id:'FIN-03',name:'Prüfplakette erteilt',cat:'Abschluss',typ:'Segmentiert Ja/Nein',pflicht:'Pflicht',
 inhalt:'Ja / Nein',bedingung:'Kein vorbelegter Wert.',kind:'segmented',options:['Ja','Nein'],name_group:'fin03'},
{id:'FIN-04',name:'Sicherer Gebrauch gewährleistet',cat:'Abschluss',typ:'Dropdown',pflicht:'Pflicht',
 inhalt:'Ja (Anlage entspricht VDE-Regeln) / Nein (Sicherheitsrisiko)',
 bedingung:'Kein vorbelegter Wert. Eigenständige Abschlussfrage – ersetzt die frühere Doppelrolle von FIN-02 als „Sicherer Gebrauch"/„Betrieb zulässig".',
 kind:'select',options:['Ja (Anlage entspricht VDE-Regeln)','Nein (Sicherheitsrisiko)']},
{id:'FIN-09',name:'Bemerkungsfeld',cat:'Abschluss',typ:'Textarea',pflicht:'Optional',inhalt:'Freitext',
 bedingung:'Farblogik: rot bei „Mängel festgestellt", gelb bei Text ohne offene Mängel, neutral wenn leer.',kind:'textarea'},
{id:'FIN-10',name:'Unterschrift Prüfer/-in',cat:'Abschluss',typ:'Canvas-Signaturpad',pflicht:'Optional',inhalt:'Zeichenfläche, 38×12 mm im PDF',
 bedingung:'Kein technischer Zwang zur Unterschrift vor PDF-Erzeugung (bewusste Nutzerentscheidung, nicht gesperrt).',kind:'canvas'},
{id:'FIN-11',name:'Unterschrift Auftraggeber/Betreiber',cat:'Abschluss',typ:'Canvas-Signaturpad',pflicht:'Optional',inhalt:'Zeichenfläche, 38×12 mm im PDF',
 bedingung:'Wie FIN-10, kein technischer Zwang.',kind:'canvas'}
];

/* ---------------- Ausnahme-Block (bewusst zusammenhängend) ----------------
   ZNS-01 fasst die vormals getrennten Karten ZS-01 (Schleifenimpedanz je
   Stromkreis) und ZN-01 (Netzimpedanz, netzweit) auf Nutzerwunsch zu EINER
   gemeinsamen Prüfung zusammen: beide liefern einen Kurzschlussstrom-Bezug
   und werden mit demselben Messvorgang (Fluke 1663, Z-Loop-Funktion)
   ermittelt. Der Kurzschlussstrom I_K (Unterfeld c) wird jetzt automatisch
   aus der gemessenen Schleifenimpedanz Z_S berechnet (I_K = 230 V / Z_S) –
   vorher musste dieser Wert manuell eingetragen werden, obwohl er sich
   direkt aus Z_S ergibt (das war die gemeldete "Berechnung funktioniert
   nicht"). */
const KAT_ZNS = 'Schleifen-/Netzimpedanz';

const ZNS_GROUP = {
  id:'ZNS-01', name:'Schleifenimpedanz Z_S je Stromkreis + Netzimpedanz Z_L-N (gemeinsamer Kurzschlussstrom-Nachweis)', cat:KAT_ZNS,
  badge:'Ausnahme: zusammenhängend',
  bedingung:'Pflicht/Optional ist je Unterfeld über die eigene Sub-Badge ersichtlich (a–c Pflicht, d–e Optional); die Gruppen-Badge zeigt wie bei RCD-01 nur den kurzen Hinweis "Ausnahme: zusammenhängend". Zusammengeführt aus den bisherigen Karten ZS-01 und ZN-01 zu einer gemeinsamen Prüfung (Nutzerwunsch). Ausnahme von der Ein-Feld-pro-Karte-Regel: der Leitungsschutzschalter-Typ (a) muss vor der Z_S-Messung (b) bekannt sein, da er den Mindest-I_K bestimmt (getMinIk()); der Kurzschlussstrom I_K (c) wird automatisch aus Z_S berechnet, ist aber überschreibbar, falls das Prüfgerät I_K direkt anzeigt. Die Netzimpedanz-Unterfelder (d–e) bleiben wie bisher optional und netzweit statt je Stromkreis; die frühere reine Anzeige-Referenz auf NETZ-05 (Vorsicherung) wurde entfernt, weil sie nichts weiter tat – NETZ-05 fließt jetzt direkt und live in die Mindest-I_K2-Prüfung bei ZNS-01e ein (updateNetzIk2Min()). Getrennt von RCD-01 (LS/Netzimpedanz und RCD sind zwei unterschiedliche Prüfungen).',
  info:'zns',
  sub:[
    {suf:'a', label:'Leitungsschutzschalter Typ/Nennstrom', typ:'Schnellauswahl + manuell', inhalt:'B 10A / B 16A / B 32A / C 16A / C 32A / C 63A', bedingung:'Muss vor der Z_S-Messung feststehen – deckt Anlagen- und Anschlussprüfung ab. Bestimmt zugleich den Mindest-I_K für ZNS-01c (getMinIk()).', kind:'quickmanual', quick:['B 10A','B 16A','B 32A','C 16A','C 32A','C 63A'], elId:'zns01_a', pflicht:'Pflicht'},
    {suf:'b', label:'Z_S (Ω) – Schleifenimpedanz L–PE', typ:'Zahl (Dezimal), Ω', inhalt:'Messwert', bedingung:'Pflicht-Messwert je Stromkreis/Übergabepunkt. Wird automatisch in den Kurzschlussstrom I_K (ZNS-01c) umgerechnet.', kind:'number', einheit:'Ω', elId:'zns01_b', pflicht:'Pflicht'},
    {suf:'c', label:'I_K (A) [min. siehe Platzhalter]:', typ:'Zahl (Dezimal, automatisch berechnet, überschreibbar), A', inhalt:'Automatisch berechnet aus Z_S (I_K = 230 V / Z_S); manuell überschreibbar, falls das Prüfgerät I_K direkt anzeigt', bedingung:'Berechnung: I_K = U / Z_S (230-V-Referenz) – wird bei jeder Änderung von ZNS-01b automatisch neu berechnet (vorher musste dieser Wert manuell eingetragen werden, obwohl er sich direkt aus Z_S ergibt). Mindestwert abhängig vom Leitungsschutzschalter-Typ (ZNS-01a), automatisch als Platzhalter angezeigt UND live geprüft (getMinIk(), Auslösefaktor nach DIN EN 60898-1: 5×In bei Charakteristik B, 10×In bei C; ein berechneter oder manuell eingetragener Wert unterhalb des Mindest-I_K wird rot markiert).', kind:'number', einheit:'A', elId:'zns01_c', pflicht:'Pflicht', norm:{}},
    {suf:'d', label:'Z_I (Ω) – Netzimpedanz L-N (netzweit)', typ:'Zahl (Dezimal), Ω', inhalt:'Messwert', bedingung:'Netzweite Messung (nicht je Stromkreis) am Netzeingang, optional. Basis für automatische I_K2-Berechnung (ZNS-01e).', kind:'number', elId:'zns01_d', einheit:'Ω', pflicht:'Optional'},
    {suf:'e', label:'I_K2 (A) [min. siehe Platzhalter] – Kurzschlussstrom L–N (netzweit)', typ:'Zahl (automatisch berechnet, readonly), A', inhalt:'Automatisch berechnet aus ZNS-01d', bedingung:'Berechnung: I_K2 = U / Z_I (230-V-Referenz). Messverfahren wie bei ZNS-01b (gleiche Anleitung). Mindestwert jetzt live aus der Vorsicherung NETZ-05 abgeleitet und geprüft (updateNetzIk2Min(), Praxis-Näherung: ca. 5× Nennstrom als Mindest-Auslösestrom bei NH-Sicherungen/CEE-Absicherung, kein fester Faktor bei „NEA" – dort keine Prüfung). Vorher fehlte hier jede Rot/Grün-Prüfung (gemeldete Lücke, behoben).', kind:'readonly', elId:'zns01_e', ph:'automatisch berechnet', norm:{}}
  ]
};

const RCD_GROUP = {
  id:'RCD-01', name:'RCD-Messung inkl. Berührungsspannung', cat:'RCD-Prüfung',
  badge:'Ausnahme: zusammenhängend',
  bedingung:'Leitungsschutzschalter (LS) und RCD sind zwei getrennte Prüfungen – LS-Felder befinden sich bei ZNS-01. Berührungsspannung wird bei der RCD-Messung automatisch mitgemessen und ist deshalb Teil dieser Karte statt einer eigenen Kategorie.',
  info:'rcd',
  sub:[
    {suf:'a', label:'RCD-Typ', typ:'Schnellauswahl + manuell', inhalt:'A / B / B+ / F / AC / ohne RCD', bedingung:'Steuert zulässige Prüfstrom-Wellenform (siehe Anleitung). Reihenfolge der Schnellauswahl auf Nutzerwunsch: A, B, B+, F, AC, ohne RCD. Auswahl „ohne RCD" blendet RCD-01-b bis RCD-01-i automatisch aus (keine RCD-Schutzeinrichtung vorhanden) und setzt ERP-05 auf „nicht Pflicht". Ansonsten (mit RCD) sind alle Unterfelder dieser Karte Pflicht.', kind:'quickmanual', quick:['A','B','B+','F','AC','ohne RCD'], elId:'rcd01_a', pflicht:'Pflicht'},
    {suf:'b', label:'Bemessungsstrom I_n (RCD)', typ:'Schnellauswahl + manuell', inhalt:'16 A / 25 A / 40 A / 63 A', bedingung:'Eigenschaft des RCD-Bauteils, NICHT der Absicherung/des Leitungsschutzschalters (dessen Nennstrom steht bei ZNS-01a). Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'quickmanual', quick:['16 A','25 A','40 A','63 A'], elId:'rcd01_b', pflicht:'Pflicht'},
    {suf:'c', label:'Bemessungsfehlerstrom / Auslösestrom I_Δn', typ:'Schnellauswahl + manuell', inhalt:'30 mA / 100 mA / 300 mA', bedingung:'Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'quickmanual', quick:['30 mA','100 mA','300 mA'], elId:'rcd01_c', pflicht:'Pflicht'},
    {suf:'c2', label:'Prüfstrom für Auslösestrom / Auslösezeit', typ:'Dropdown', inhalt:'1 × IΔn (max. 300 ms) / 2 × IΔn (max. 150 ms) / 5 × IΔn (max. 40 ms)', bedingung:'Bestimmt den zulässigen Grenzwert für die Auslösezeit (RCD-01-e), wird dort automatisch als Platzhalter angezeigt. Voreingestellt: 5 × IΔn (kürzeste zulässige Zeit, häufigster Prüfmodus). Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'select', options:['1 × IΔn (max. 300 ms)','2 × IΔn (max. 150 ms)','5 × IΔn (max. 40 ms)'], default:'5 × IΔn (max. 40 ms)', elId:'rcd01_c2', pflicht:'Pflicht'},
    {suf:'d', label:'Auslösestrom IΔmess (mA):', typ:'Zahl (Dezimal)', inhalt:'Messwert', bedingung:'Muss zwischen 0,5× und 1,0× des Bemessungsfehlerstroms I_Δn (RCD-01c) liegen – wird live anhand von RCD-01c geprüft (0,5×I_Δn bis 1×I_Δn: RCD darf nicht zu früh, muss aber spätestens bei I_Δn auslösen). Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'number', einheit:'mA', elId:'rcd01_d', pflicht:'Pflicht', norm:{}},
    {suf:'e', label:'Auslösezeit tA (ms) [max. 40 ms]:', typ:'Zahl (Dezimal), ms', inhalt:'Messwert', bedingung:'Grenzwert abhängig vom gewählten Prüfstrom-Multiplikator (RCD-01-c2): 300/150/40 ms bei 1×/2×/5× I_Δn (bzw. 500/200/150 ms bei selektiven/zeitverzögerten RCDs). Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'number', einheit:'ms', norm:{max:40}, elId:'rcd01_e', pflicht:'Pflicht'},
    {suf:'f', label:'Spannungsart Netzeinspeisung:', typ:'Segmentiert AC/DC', inhalt:'AC / DC', bedingung:'Bestimmt zusammen mit RCD-01g den Grenzwert von RCD-01h. Wird bei dieser Messung automatisch miterfasst. Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'segmented', options:['AC','DC'], name_group:'ul01', elId:'ul01', pflicht:'Pflicht'},
    {suf:'g', label:'Bereich / Gefährdung:', typ:'Segmentiert normal/erhöht', inhalt:'normal / erhöht', bedingung:'Bestimmt zusammen mit RCD-01f den Grenzwert von RCD-01h. Kein Wert vorbelegt. Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'segmented', options:['normal','erhöht'], name_group:'ul02', elId:'ul02', pflicht:'Pflicht'},
    {suf:'h', label:'Maximal zulässige Spannung UL:', typ:'Zahl (automatisch, readonly)', inhalt:'≤ 50 V AC / ≤ 120 V DC (normal) bzw. ≤ 25 V AC / ≤ 60 V DC (erhöht)', bedingung:'Automatisch aus RCD-01f + RCD-01g berechnet. Optisch wie die übrigen Unterfelder dieser Karte markiert (gelb/grün), obwohl automatisch berechnet.', kind:'readonly', elId:'ul03', ph:'abhängig von RCD-01f/g', markieren:true},
    {suf:'i', label:'Gemessene Berührungsspannung Umess (V):', typ:'Zahl (Dezimal), Einheit V', inhalt:'Messwert in V', bedingung:'Muss ≤ Wert aus RCD-01h sein – wird live geprüft, sobald RCD-01f/g eine Grenzspannung ergeben haben (vorher keine Prüfung möglich). Wird automatisch mit ΔT/I_ΔN mitgemessen (kein separater Messschritt). Pflicht, sofern RCD-01-a ≠ „ohne RCD".', kind:'number', einheit:'V', elId:'rcd01_i', pflicht:'Pflicht', norm:{}}
  ]
};
