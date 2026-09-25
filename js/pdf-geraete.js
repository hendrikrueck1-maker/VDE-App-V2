/* =========================================================================
   PDF-PLAN – Prüfprotokoll elektrischer Geräte (ausgefüllt + Leerformular)

   HIER wird das PDF korrigiert: Blöcke, Feld-IDs, Breiten-Gewichte (b),
   Kurztexte, Messtabelle. Aufbau der Blöcke/Zellen: Kopf von js/pdf-protokoll.js.
   Grenzwerte: GRENZWERTE.GER_* (felder-daten.js) über FeldLogik (eine Quelle).

   ZWINGEND EINE SEITE (Bemerkung füllt den Rest, wird notfalls kleiner bzw.
   gekürzt). Fotos (SK-03) als Fotodokumentation auf Folgeseiten.
   ========================================================================= */
const PDF_PLAN_GERAETE = {
  titel: 'PRÜFPROTOKOLL ELEKTRISCHER GERÄTE',
  untertitel: 'Prüfung nach DIN EN 50678 (nach Reparatur) / DIN EN 50699 (Wiederholungsprüfung)',
  datei: 'Pruefprotokoll_Geraet',
  infoLabel: 'Gerät', infoFeld: 'GER-02', namensFeld: 'GER-02',
  hoehe: { zelle:7.4, zelleLeer:8.5, check:5, checkLeer:5.5, unterschrift:17 },

  bloecke: [
    { art:'zellen', titel:'Auftraggeber & Prüfung', zeilen:[
      [ { id:'STAM-01', b:2 }, { id:'STAM-01-a', b:2 } ],
      [ { id:'STAM-02', b:1.2 }, { id:'STAM-08', b:0.8 }, { id:'STAM-06', b:1.2 },
        { id:'STAM-07', b:1.3, wahl:['Elektrofachkraft','Unterwiesene Person'], kurz:{ 'Unterwiesene Person':'EuP' } } ],
      [ { id:'STAM-13', b:2, wahl:['Erstprüfung (Gerät)','Wiederholungsprüfung (Gerät)','Prüfung nach Reparatur (Gerät)'],
          kurz:{ 'Erstprüfung (Gerät)':'Erstprüfung', 'Wiederholungsprüfung (Gerät)':'Wiederholungsprüfung', 'Prüfung nach Reparatur (Gerät)':'nach Reparatur' } },
        { id:'STAM-14', b:2, wahl:['DIN EN 50678 (ersetzt VDE 0701)','DIN EN 50699 (ersetzt VDE 0702)','DIN VDE 0701-0702'],
          kurz:{ 'DIN EN 50678 (ersetzt VDE 0701)':'DIN EN 50678', 'DIN EN 50699 (ersetzt VDE 0702)':'DIN EN 50699' } } ],
      [ { id:'STAM-11', b:2, label:'Prüfgerät (Gerätetester)' }, { id:'STAM-12', b:2, label:'Seriennummer Gerätetester' } ]
    ]},

    { art:'zellen', titel:'Gerät', zeilen:[
      [ { id:'GER-02', b:2 }, { id:'GER-04', b:1.6 }, { id:'GER-06', b:1.4 } ],
      [ { id:'GER-03', b:2 }, { id:'GER-07', b:1.6, wahl:['I','II','III'], kurz:{ 'I':'SK I', 'II':'SK II', 'III':'SK III' } },
        { id:'GER-08', b:0.7 }, { id:'LTG-06', b:0.7, label:'Querschnitt' } ],
      { nurWenn:{ feld:'GER-07', gleich:'I' }, zellen:[ { id:'GER-14', b:2, label:'Heizelemente (nur SK I)', wahl:['Ja','Nein'] },
        { id:'GER-15', b:3, label:'Heizleistung', ausWenn:w=>w('GER-14') !== 'Ja' } ] }
    ]},

    { art:'checkliste', titel:'Sichtprüfung & Funktionsprüfung', rechts:'i.O. = in Ordnung · n.i.O. = nicht in Ordnung · n.a. = nicht anwendbar', spalten:[
      { titel:'Besichtigen', optionen:['i.O.','n.i.O.'], felder:['GER-11'], kurz:{ 'GER-11':'Sichtprüfung (Gehäuse, Leitung, Stecker)' } },
      { titel:'Erproben', optionen:['i.O.','n.i.O.','n.a.'], felder:['GER-12'] }
    ]},

    { art:'tabelle', titel:'Messen', zh:7, zhLeer:10,
      rechts:(w, leer)=>leer ? 'Grenzwerte je Schutzklasse – Zutreffendes einkreisen' : (w('GER-07') ? 'Schutzklasse ' + w('GER-07') : ''),
      spalten:[
        { kopf:'Messung', b:3.3, ausr:'links' },
        { kopf:'Verfahren / Prüfbedingung', b:3.1, ausr:'links' },
        { kopf:'Messwert', b:1.5 },
        { kopf:'Grenzwert', b:3 },
        { kopf:'Ergebnis', b:1.3 } ],
      zeilen:(w, leer)=>geraeteMesszeilen(w, leer),
      legende:()=>'Grenzwerte nach DIN EN 50678 / 50699: R_{PE} nach Länge und Querschnitt · R_{ISO} und Ableitstrom nach Schutzklasse, Heizelementen und Messmethode · rot hinterlegt = nicht eingehalten' }
  ],

  abschluss: { titel:'Ergebnis & Unterschriften',
    zeile:[
      { id:'GER-13', b:2.6, label:'Prüfergebnis', wahl:['OK','Fehler','Nicht prüfbar'], kurz:{ 'OK':'bestanden (OK)', 'Nicht prüfbar':'nicht prüfbar' }, farbe:{ 'Fehler':'rotText' } },
      { id:'FIN-03', b:1.2, label:'Prüfplakette erteilt', wahl:['Ja','Nein'] },
      { id:'STAM-22', b:1, label:'Prüfintervall' },
      { id:'STAM-23', b:1.25, label:'Nächster Prüftermin', fett:true } ],
    bemerkung:'FIN-09', mangelWert:{ feld:'GER-13', gleich:'Fehler' },
    unterschriften:[
      { id:'FIN-10', titel:'Prüfer/-in', unterzeile:'Unterschrift Prüfer/-in', name:'STAM-06' },
      { id:'FIN-11', titel:'Auftraggeber / Betreiber', unterzeile:'Unterschrift Auftraggeber/Betreiber' } ] },

  fotos: { titel:'Fotodokumentation', feld:'SK-03', spalten:2, zeilen:3, beschriftung: w=>w('GER-02') || 'Gerät' }
};

/* Messtabelle: R_PE, R_ISO, Ableitstrom – Grenzwert je Schutzklasse/Länge/Methode aus FeldLogik */
function geraeteMesszeilen(w, leer){
  const G = GRENZWERTE, R = G.GER_RPE, f = PdfProtokoll.zahlDe, P = PdfProtokoll;
  const sk = leer ? '' : w('GER-07');
  const ohneAbleit = G.GER_OHNE_ABLEIT.includes(sk) || (!leer && w('GER-10') === G.GER_METHODE_OHNE);
  const zeilen = [
    { mess:'Schutzleiterwiderstand R_{PE}', id:'GER-05', einheit:'Ω', entfaellt: G.GER_OHNE_RPE.includes(sk),
      verfahren: leer ? '200 mA · ____ m · ____ mm²' : '200 mA' + (w('GER-08') ? ' · ' + P.formatieren(w('GER-08'), 'zahl') + ' m' : '') + (w('LTG-06') ? ' · ' + w('LTG-06') : ''),
      allgemein: '≤ ' + f(R.basis) + ' Ω bis ' + R.bisM + ' m, +' + f(R.zuschlag) + ' Ω je ' + f(R.schrittM) + ' m (max. ' + f(R.max) + ' Ω) · > ' + f(R.abQuerschnitt) + ' mm²: l/(' + R.kappa + '·A) + ' + f(R.uebergang) + ' Ω' },
    { mess:'Isolationswiderstand R_{ISO}', id:'GER-05c', einheit:'MΩ', entfaellt:false,
      verfahren: leer ? '250 V DC / 500 V DC' : w('GER-05b'),
      allgemein: Object.entries(G.GER_RISO_MIN).map(([k, v])=>'SK ' + k + ' ≥ ' + f(v)).join(' · ') + ' MΩ · SK I Heizung ≥ ' + f(G.GER_RISO_MIN_HEIZ) + ' MΩ' },
    { mess:'Ableitstrom', id:'GER-09', einheit:'mA', entfaellt: ohneAbleit,
      verfahren: leer ? 'Ersatz- / Differenzstrom / direkt' : w('GER-10') + (sk === 'I' && w('GER-14') === 'Ja' && w('GER-15') ? ' · Heizung ' + P.formatieren(w('GER-15'), 'zahl') + ' kW' : ''),
      allgemein: 'SK I ≤ ' + f(G.GER_ABLEIT_MAX.I.Ersatzableitstrom) + ' mA (Heizung > ' + f(G.GER_ABLEIT_HEIZ.abKW) + ' kW: ' + f(G.GER_ABLEIT_HEIZ.jeKW) + ' mA/kW, max. ' + f(G.GER_ABLEIT_HEIZ.max) + ') · direkt/SK II ≤ ' + f(G.GER_ABLEIT_MAX.II.Direktmessung) + ' mA' }
  ];
  return zeilen.map(z=>{
    if(leer) return { zellen:[ { text:z.mess, fett:true }, { text:z.verfahren, status:'aus' }, {}, { text:z.allgemein, status:'aus' }, {} ] };
    if(z.entfaellt) return { zellen:[ { text:z.mess, fett:true }, { text:'entfällt (' + (G.GER_OHNE_ABLEIT.includes(sk) || z.id !== 'GER-09' ? 'Schutzklasse ' + sk : 'ohne Verbraucher') + ')', status:'aus' }, { text:'–', status:'aus' }, { text:'–', status:'aus' }, { text:'–', status:'aus' } ] };
    const v = P.formatieren(w(z.id), 'zahl'), g = FeldLogik.grenzwert(z.id, w);
    const gz = x => z.einheit === 'Ω' ? x.toFixed(2).replace('.', ',') : f(x);
    const grenz = g ? (g.max != null ? '≤ ' + gz(g.max) : '≥ ' + gz(g.min)) + ' ' + z.einheit : z.allgemein;
    const aus = v && FeldLogik.ausserhalb(z.id, w);
    const erg = !v || !g ? '' : aus ? 'n.i.O.' : 'i.O.';
    return { zellen:[ { text:z.mess, fett:true }, { text:z.verfahren }, { text: v ? v + ' ' + z.einheit : '', status: aus ? 'rot' : null },
      { text:grenz, status: g ? null : 'aus' }, { text:erg, status: erg === 'i.O.' ? 'gruen' : erg ? 'rot' : null } ] };
  });
}

async function pdfGeraet(arg, leer){
  const r = await PdfProtokoll.einseitig(PDF_PLAN_GERAETE, arg, leer);
  return PdfProtokoll.speichern(r, leer ? 'Leerformular' : r.fotos ? 'Protokoll 1 Seite' + PdfProtokoll.fotoText(r.fotos) : '');
}
function pdfGeraetAusgefuellt(arg){ return pdfGeraet(arg, false); }
function pdfGeraetLeer(arg){ return pdfGeraet(arg, true); }
