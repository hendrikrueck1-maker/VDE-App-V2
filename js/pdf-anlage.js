/* =========================================================================
   PDF-PLAN – Prüfprotokoll elektrischer Anlagen (ausgefüllt + Leerformular)

   HIER wird das PDF korrigiert: welches Feld in welchem Kasten, Reihenfolge,
   Breiten-Gewichte (b), Kurztexte. Zeichnen übernimmt js/pdf-layout.js,
   Grenzwerte kommen aus FeldLogik.grenzwert (eine Quelle mit dem Formular).

   OBERSTES GEBOT: bis KREISE_SEITE_1 Stromkreise passt ALLES (inkl. längerer
   Bemerkung und Unterschriften) auf Seite 1. Weitere Stromkreise laufen auf
   Folgeseiten („Fortsetzung“), danach die Fotodokumentation.

   Zelle   'ID' | { id, b, label, einheit, wahl:[Werte], kurz:{Wert:Kurztext},
                    farbe:{Wert:'rotText'}, nurDrehstrom, fett, format }
   Spalte  { kopf, gruppe, b, id | inhalt(w,i), ausr, mess, format }
   ========================================================================= */
const PDF_PLAN_ANLAGE = {
  titel: 'PRÜFPROTOKOLL ELEKTRISCHER ANLAGEN',
  untertitel: 'Erst-, Wiederholungs- und Änderungsprüfung nach DIN VDE 0100-600 / DIN VDE 0105-100',
  datei: 'Pruefprotokoll_Anlage',
  infoLabel: 'Bereich / Gebäude', infoFeld: 'STAM-02',
  KREISE_SEITE_1: 6,              /* oberstes Gebot: bis hier eine Seite */
  KREISE_LEER: 5,                 /* Zeilen im Leerformular (groß zum Schreiben) */
  hoehe: { zelle:7.4, zelleLeer:8.5, kreis:5.2, kreisLeer:9.8, check:4.3, checkLeer:4.4, unterschrift:17, bemerkungMin:3, bemerkungMinLeer:2 },

  kaesten: [
    { titel:'Auftraggeber & Prüfung', zeilen:[
      [ { id:'STAM-01', b:2 }, { id:'STAM-01-a', b:2 } ],
      [ { id:'STAM-02', b:2 }, { id:'STAM-04', b:1 }, { id:'STAM-08', b:1 } ],
      [ { id:'STAM-13', b:2, wahl:['Neuanlage','Bestand','Änderung','Wiederholung'] },
        { id:'STAM-14', b:2, wahl:['DIN VDE 0100-600','DIN VDE 0105-100','DIN VDE 0100-600 / 0105-100'], kurz:{ 'DIN VDE 0100-600 / 0105-100':'beide' } } ],
      [ { id:'STAM-06', b:1 }, { id:'STAM-07', b:1.25, wahl:['Elektrofachkraft','Unterwiesene Person'], kurz:{ 'Unterwiesene Person':'EuP' } },
        { id:'STAM-09', b:1, label:'Prüfgerät (Installationstester)' }, { id:'STAM-10', b:0.75, label:'Seriennummer' } ]
    ]},

    { titel:'Netz, Einspeisung & Erdung', zeilen:[
      [ { id:'NETZ-01', b:3, wahl:['TN-S','TN-C-S','TN-C','TT','IT'] }, { id:'NETZ-02', b:1.3 }, { id:'NETZ-03', b:1.7 },
        { id:'NETZ-04', b:2 }, { id:'NETZ-05', b:1.7, label:'Vorsicherung / Speisepunkt' } ],
      [ { id:'NMESS-01-a', b:2.2, label:'Netzmessung am Speisepunkt', wahl:['Drehstrom','1-phasig'] },
        { id:'NMESS-01-b', label:'U_{L1-N}', einheit:'V' },
        { id:'NMESS-01-c', label:'U_{L2-N}', einheit:'V', nurDrehstrom:true },
        { id:'NMESS-01-d', label:'U_{L3-N}', einheit:'V', nurDrehstrom:true },
        { id:'NMESS-01-e', label:'U_{L1-L2}', einheit:'V', nurDrehstrom:true },
        { id:'NMESS-01-f', label:'U_{L2-L3}', einheit:'V', nurDrehstrom:true },
        { id:'NMESS-01-g', label:'U_{L1-L3}', einheit:'V', nurDrehstrom:true },
        { id:'NMESS-01-h', label:'U_{N-PE}', einheit:'V' },
        { id:'NMESS-01-i', label:'Frequenz', einheit:'Hz' },
        { id:'NMESS-09', b:1.8, label:'Drehfeld', wahl:['rechts','links'], nurDrehstrom:true } ],
      { nurWenn:{ feld:'NETZ-05', enthaelt:'NEA' }, zellen:[
        { id:'GEN-01', label:'Generator/NEA – Nennleistung' }, 'GEN-02', 'GEN-03', 'GEN-04', 'GEN-05' ] },
      [ { id:'LTG-04', b:1.3, label:'Anschlusskabel Typ' }, { id:'LTG-05', b:0.75, label:'Leiter' },
        { id:'LTG-06', b:0.95, label:'Querschnitt' }, { id:'LTG-02', b:0.8, label:'Länge' },
        { id:'ERD-01', b:1.45, label:'Zus. Potenzialausgleich', wahl:['Ja','Nein'] },
        { id:'ERD-02', b:1.45, label:'Durchgängigkeit PA', wahl:['i.O.','n.i.O.'], farbe:{ 'n.i.O.':'rotText' } },
        { id:'ERD-03', b:0.9, label:'R_{E}' }, { id:'ERD-04', b:2.1, label:'Erdungsmesspunkt' } ]
    ]}
  ],

  checklisten: { titel:'Besichtigen & Erproben', optionen:['i.O.','n.i.O.','n.a.'], spalten:[
    { titel:'Besichtigen', felder:['BES-01','BES-02','BES-03','BES-04','BES-05'] },
    { titel:'Besichtigen', felder:['BES-06','BES-07','BES-08','BES-09'] },
    { titel:'Erproben',    felder:['ERP-01','ERP-03','ERP-04','ERP-05','ERP-06'], kurz:{ 'ERP-03':'Polarität / Steckdosen' } }
  ]},

  stromkreise: { titel:'Stromkreise – Messen', spalten:[
    { kopf:'Nr.', b:5, inhalt:(w, i)=>String(i + 1) },
    { kopf:'Stromkreis', b:21, id:'SK-01', ausr:'links' },
    { gruppe:'Leitung', kopf:'Typ · mm²', b:16, inhalt:w=>[w('LTG-04'), w('LTG-06').replace(/\s*mm²?$/i, '')].filter(Boolean).join(' · ') },
    { gruppe:'Leitung', kopf:'l\nm', b:7, id:'LTG-02', format:'zahl' },
    { gruppe:'PE · Isolation', kopf:'R_{PE}\nΩ', b:9, id:'RPE-01', mess:true, format:'zahl' },
    { gruppe:'PE · Isolation', kopf:'U_{ISO}\nV', b:8, id:'RISO-01-a', mess:true, format:'anfang' },
    { gruppe:'PE · Isolation', kopf:'R_{ISO}\nMΩ', b:9, id:'RISO-01-b', mess:true, format:'zahl' },
    { gruppe:'Überstromschutz · Impedanz', kopf:'LS', b:10, id:'ZNS-01-a', mess:true },
    { gruppe:'Überstromschutz · Impedanz', kopf:'Z_{S}\nΩ', b:9, id:'ZNS-01-b', mess:true, format:'zahl' },
    { gruppe:'Überstromschutz · Impedanz', kopf:'I_{K}\nA', b:9, id:'ZNS-01-c', mess:true, format:'zahl' },
    { gruppe:'Überstromschutz · Impedanz', kopf:'Z_{I}\nΩ', b:9, id:'ZNS-01-d', mess:true, format:'zahl' },
    { gruppe:'Überstromschutz · Impedanz', kopf:'I_{K2}\nA', b:9, id:'ZNS-01-e', mess:true, format:'zahl' },
    { gruppe:'Fehlerstrom-Schutzeinrichtung (RCD)', kopf:'Typ\nI_{n}/I_{Δn}', b:14, mess:true, rcd:'typ',
      inhalt:w=>[w('RCD-01-a'), [nurZahl(w('RCD-01-b')), nurZahl(w('RCD-01-c'))].filter(Boolean).join('/')].filter(Boolean).join(' ') },
    { gruppe:'Fehlerstrom-Schutzeinrichtung (RCD)', kopf:'×\nI_{Δn}', b:6, id:'RCD-01-c2', mess:true, rcd:true, inhalt:w=>{ const m = /^\s*(\d+)/.exec(w('RCD-01-c2')); return m ? m[1] + '×' : ''; } },
    { gruppe:'Fehlerstrom-Schutzeinrichtung (RCD)', kopf:'I_{Δ}\nmA', b:8, id:'RCD-01-d', mess:true, rcd:true, format:'zahl' },
    { gruppe:'Fehlerstrom-Schutzeinrichtung (RCD)', kopf:'t_{A}\nms', b:8, id:'RCD-01-e', mess:true, rcd:true, format:'zahl' },
    { gruppe:'Fehlerstrom-Schutzeinrichtung (RCD)', kopf:'U_{F}\nV', b:8, id:'RCD-01-i', mess:true, rcd:true, format:'zahl' },
    { gruppe:'Ergebnis', kopf:'Durch-\ngang', b:8, id:'LTG-01', mess:true },
    { gruppe:'Ergebnis', kopf:'i.O.', b:7, id:'SK-02', ergebnis:true }
  ]},

  abschluss: { titel:'Ergebnis & Unterschriften',
    zeile:[
      { id:'FIN-02', b:3.1, label:'Gesamtbewertung', wahl:['Keine Mängel festgestellt','Mängel festgestellt und behoben (siehe Bemerkung)','Mängel festgestellt (siehe Bemerkung)'],
        kurz:{ 'Keine Mängel festgestellt':'keine Mängel', 'Mängel festgestellt und behoben (siehe Bemerkung)':'Mängel behoben', 'Mängel festgestellt (siehe Bemerkung)':'Mängel festgestellt' },
        farbe:{ 'Mängel festgestellt (siehe Bemerkung)':'rotText' } },
      { id:'FIN-04', b:1.45, label:'Sicherer Gebrauch gewährleistet', wahl:['Ja (Anlage entspricht VDE-Regeln)','Nein (Sicherheitsrisiko)'],
        kurz:{ 'Ja (Anlage entspricht VDE-Regeln)':'Ja', 'Nein (Sicherheitsrisiko)':'Nein' }, farbe:{ 'Nein (Sicherheitsrisiko)':'rotText' } },
      { id:'FIN-03', b:1.1, label:'Prüfplakette erteilt', wahl:['Ja','Nein'] },
      { id:'STAM-22', b:1, label:'Prüfintervall' },
      { id:'STAM-23', b:1.25, label:'Nächster Prüftermin', fett:true } ],
    bemerkung:'FIN-09', mangelWert:{ feld:'FIN-02', gleich:'Mängel festgestellt (siehe Bemerkung)' },
    unterschriften:[
      { id:'FIN-10', titel:'Prüfer/-in', unterzeile:'Unterschrift Prüfer/-in', name:'STAM-06' },
      { id:'FIN-11', titel:'Auftraggeber / Betreiber', unterzeile:'Unterschrift Auftraggeber/Betreiber' } ] },

  fotos: { titel:'Fotodokumentation', feld:'SK-03', spalten:2, zeilen:3 }
};

/* Hilfen für Inhalts-Funktionen im Plan */
function nurZahl(t){ const m = /[\d]+(?:[.,]\d+)?/.exec(String(t || '')); return m ? m[0].replace('.', ',') : ''; }

/* =========================================================================
   Erzeugung (normalerweise keine Änderung nötig)
   ========================================================================= */
const PdfAnlage = (function(){
  'use strict';
  const PL = PDF_PLAN_ANLAGE;

  /* gemeinsame Bausteine: js/pdf-protokoll.js */
  const { leser, datumDe, formatieren, norm, zelle } = PdfProtokoll;

  /* ---------- Stromkreis-Tabelle ---------- */
  function kreisZeile(wk, i, leer){
    const S = PL.stromkreise.spalten;
    if(leer) return { zellen:S.map((sp, k)=>k === 0 ? { text:String(i + 1), status:'aus' } : {}) };
    const w = leser(wk);
    const ohneRcd = /^ohne\s*rcd$/i.test(w('RCD-01-a'));
    const zellen = S.map(sp=>{
      let text = sp.inhalt ? sp.inhalt(w, i) : formatieren(w(sp.id), sp.format);
      let status = null;
      if(sp.rcd && ohneRcd){ return sp.rcd === 'typ' ? { text:'ohne RCD' } : { text:'–', status:'aus' }; }
      if(sp.ergebnis){ text = text === 'Ja' ? 'i.O.' : text === 'Nein' ? 'n.i.O.' : text; status = text === 'i.O.' ? 'gruen' : text === 'n.i.O.' ? 'rot' : null; }
      else if(text === 'n.i.O.') status = 'rot';
      else if(sp.mess && sp.id && text && FeldLogik.ausserhalb(sp.id, w)) status = 'rot';
      return { text, status };
    });
    const z = { zellen };
    if(w('SK-02') === 'Nein'){
      let von = -1, bis = -1;
      S.forEach((s, k)=>{ if(s.mess){ if(von < 0) von = k; bis = k; } });
      const bem = w('FIN-09');
      z.verbunden = { von, bis, status:'rot', text:'Mangel: ' + (bem || 'Bemerkung fehlt') };
    }
    return z;
  }
  function legende(){
    const G = GRENZWERTE, f = n => String(n).replace('.', ',');
    const R = G.ANL_RPE;
    const zeiten = Object.values(G.RCD_ZEIT_MAX).join(' / ');
    const faktoren = Object.keys(G.RCD_ZEIT_MAX).map(k=>(/^\s*(\d+)/.exec(k) || ['', '?'])[1]).join(' / ');
    return 'Grenzwerte: R_{PE} ≤ l/(' + R.kappa + '·A) + ' + f(R.uebergang) + ' Ω (ohne Länge/Querschnitt ' + f(R.ohneDaten.toFixed(1)) + ' Ω) · R_{ISO} ≥ ' + f(G.RISO_MIN.standard.toFixed(1)) + ' MΩ (SELV/PELV ≥ ' + f(G.RISO_MIN['SELV-PELV']) + ' MΩ) · ' +
      'I_{K}, I_{K2} ≥ ' + G.LS_FAKTOR.B + ' × I_{n} (B) bzw. ' + G.LS_FAKTOR.C + ' × I_{n} (C), gG: I_{a} (0,4 s / 5 s) · I_{Δ} ' + f(G.RCD_STROM_BAND.min) + '–' + f(G.RCD_STROM_BAND.max.toFixed(1)) + ' × I_{Δn} · ' +
      't_{A} ≤ ' + zeiten + ' ms bei ' + faktoren + ' × I_{Δn} · U_{F} ≤ U_{L} (' + G.UL.AC.normal + ' V AC, erhöht ' + G.UL.AC['erhöht'] + ' V) · rot hinterlegt = nicht eingehalten';
  }

  /* ---------- Hauptablauf ---------- */
  async function erstellen(arg, leer){
    await PdfLayout.laden();
    const L = PdfLayout, SE = L.SEITE, AB = L.ABSTAND, H = PL.hoehe;
    const { P, pr, w, y:y0 } = PdfProtokoll.start(PL, arg, leer);
    let y = y0;
    const kreiseDaten = leer ? [] : ((pr.daten || {}).stromkreise || []).map(k=>k.werte || {});
    const n = leer ? PL.KREISE_LEER : kreiseDaten.length;

    /* 1. Zellen-Kästen · 2. Checklisten */
    const zh = leer ? H.zelleLeer : H.zelle;
    PL.kaesten.forEach(k=>{ y = PdfProtokoll.zellenKasten(P, y, k, w, leer, zh) + AB.box; });
    y = PdfProtokoll.checkliste(P, y, PL.checklisten, w, leer, leer ? H.checkLeer : H.check) + AB.box;

    /* 3. Stromkreise: so viele wie passen, höchstens KREISE_SEITE_1 – Rest auf Folgeseiten */
    const T = PL.stromkreise, S = T.spalten;
    const zeilen = Array.from({ length:n }, (_, i)=>kreisZeile(kreiseDaten[i], i, leer));
    const zhK = leer ? H.kreisLeer : H.kreis;
    const hoehen = zeilen.map(z=>P.tabelleZeileHoehe(S, z, zhK));
    const kopfH = P.tabelleKopfHoehe(S);
    const leg = legende();
    const abschlussFix = PdfProtokoll.abschlussFixHoehe(P, PL.abschluss, w, leer, zh, H);
    const bemMin = leer ? 3.8 + H.bemerkungMinLeer * 6.8 + 1.5 : P.textFeldHoehe('', H.bemerkungMin);
    const verfuegbar = (legTxt)=>SE.inhaltEnde - y - AB.titel - kopfH - P.kleintext(0, legTxt, false) - AB.box - abschlussFix - bemMin;
    const passend = (platz)=>{ let k = 0, r = platz; while(k < Math.min(PL.KREISE_SEITE_1, n) && hoehen[k] <= r){ r -= hoehen[k]; k++; } return k; };
    let k1 = passend(verfuegbar(leg));
    const fortsetzung = k => k < n ? ' · Fortsetzung: Stromkreise ' + (k + 1) + '–' + n + ' auf Folgeseite' : '';
    if(k1 < n) k1 = passend(verfuegbar(leg + fortsetzung(k1)));
    if(k1 === 0 && n) k1 = 1;

    const bereich = (a, b)=>n ? (a === 1 && b === n ? n + (n === 1 ? ' Stromkreis' : ' Stromkreise') : 'Stromkreise ' + a + '–' + b + ' von ' + n) : '';
    const tabelle = (von, bis, titel)=>{
      y = P.kastenTitel(y, titel, leer ? 'Bei n.i.O.: Mangel in die Zeile eintragen' : bereich(von + 1, bis));
      y += P.tabelleKopf(y, S);
      for(let i = von; i < bis; i++){ P.tabelleZeile(y, S, zeilen[i], hoehen[i], (i - von) % 2 === 1); y += hoehen[i]; }
    };
    tabelle(0, k1, T.titel);
    y += P.kleintext(y, leg + fortsetzung(k1));
    y += AB.box;

    /* 4. Abschluss – Bemerkung füllt den Rest der Seite, Unterschriften unten bündig */
    const abs = PdfProtokoll.abschluss(P, y, PL.abschluss, w, leer, zh, H, false);
    const bemStatus = abs.status;
    y = abs.y;

    /* 5. Folgeseiten: restliche Stromkreise */
    let i = k1;
    while(i < n){
      y = P.seiteNeu();
      let platz = SE.inhaltEnde - y - AB.titel - kopfH - P.kleintext(0, leg, false);
      let bis = i;
      while(bis < n && hoehen[bis] <= platz){ platz -= hoehen[bis]; bis++; }
      if(bis === i) bis = i + 1;
      tabelle(i, bis, T.titel + ' (Fortsetzung)');
      y += P.kleintext(y, leg + (bis < n ? ' · Fortsetzung auf Folgeseite' : ''));
      y += AB.box;
      i = bis;
    }

    /* 6. Überlange Bemerkung fortsetzen */
    let rest = abs.rest;
    while(rest){
      if(SE.inhaltEnde - y < 30) y = P.seiteNeu();
      const h = Math.min(SE.inhaltEnde - y, P.textFeldHoehe(rest, 1));
      rest = P.textFeld(y, h, 'Bemerkungen / festgestellte Mängel (Fortsetzung)', rest, bemStatus).rest;
      y += h + AB.box;
    }

    /* 7. Fotodokumentation (je Stromkreis SK-03) */
    const F = PL.fotos;
    const nFotos = leer ? 0 : PdfProtokoll.fotos(P, [].concat(...kreiseDaten.map((wk, i)=>{
      const name = String(wk['SK-01'] || '').trim();
      return PdfProtokoll.fotoListe(wk[F.feld], 'Stromkreis ' + (i + 1) + (name ? ' · ' + name : ''));
    })), F);

    const r = PdfProtokoll.fertig(P, PL, pr, w, leer, arg, w('STAM-02'));
    return Object.assign(r, { kreise:n, seite1:k1, fotos:nFotos });
  }

  /* ---------- Aufruf aus protokoll-seite.js (Namen im Bauplan: pdf.ausgefuellt / pdf.leer) ---------- */
  async function speichern(arg, leer){
    const r = await erstellen(arg, leer);
    return PdfProtokoll.speichern(r, leer ? 'Leerformular (' + r.kreise + ' Stromkreis-Zeilen)' :
      r.kreise + (r.kreise === 1 ? ' Stromkreis' : ' Stromkreise') + (r.seite1 < r.kreise ? ', davon ' + r.seite1 + ' auf Seite 1' : '') + PdfProtokoll.fotoText(r.fotos));
  }

  return { erstellen, speichern };
})();

function pdfAnlageAusgefuellt(arg){ return PdfAnlage.speichern(arg, false); }
function pdfAnlageLeer(arg){ return PdfAnlage.speichern(arg, true); }
