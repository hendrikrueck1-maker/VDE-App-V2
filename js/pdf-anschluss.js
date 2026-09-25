/* =========================================================================
   PDF-PLAN – Prüfprotokoll Anschlussprüfung (ausgefüllt + Leerformular)

   HIER wird das PDF korrigiert: Blöcke, Feld-IDs, Breiten-Gewichte (b),
   Kurztexte. Aufbau der Blöcke/Zellen: Kopf von js/pdf-protokoll.js.

   ZWINGEND EINE SEITE (Bemerkung füllt den Rest, wird notfalls kleiner bzw.
   gekürzt). Fotos (SK-03) als Fotodokumentation auf Folgeseiten.

   Aufbau nach Prüfablauf: 1 Besichtigen → 2 spannungsfrei messen → 3 unter
   Spannung messen → 4 Erproben. Schritte 2–4: anschlussAblauf() unten.
   ========================================================================= */
const PDF_PLAN_ANSCHLUSS = {
  titel: 'PRÜFPROTOKOLL ANSCHLUSSPRÜFUNG',
  untertitel: 'Temporäre Einspeisung / Übergabepunkt nach DIN VDE 0100-600 / DIN VDE 0105-100',
  datei: 'Pruefprotokoll_Anschluss',
  infoLabel: 'Übergabepunkt', infoFeld: 'STAM-20', namensFeld: 'STAM-20',
  grenzwertOpt: { speisepunkt:true },      /* I_K2 gegen ≈ 5 × Vorsicherung (wie im Formular) */
  hoehe: { zelle:7.0, zelleLeer:7.8, check:4.3, checkLeer:4.3, unterschrift:17 },

  bloecke: [
    { art:'zellen', titel:'Auftraggeber, Übergabepunkt & Netz', zeilen:[
      [ { id:'STAM-01', b:2 }, { id:'STAM-01-a', b:2 } ],
      [ { id:'STAM-02', b:2.6 }, { id:'STAM-08', b:0.8 }, { id:'STAM-06', b:1 } ],
      [ { id:'STAM-13', b:2, wahl:['Neuanlage','Bestand','Änderung','Wiederholung'] },
        { id:'STAM-14', b:2, wahl:['DIN VDE 0100-600','DIN VDE 0105-100','DIN VDE 0100-600 / 0105-100'], kurz:{ 'DIN VDE 0100-600 / 0105-100':'beide' } } ],
      [ { id:'STAM-07', b:1.25, wahl:['Elektrofachkraft','Unterwiesene Person'], kurz:{ 'Unterwiesene Person':'EuP' } },
        { id:'STAM-09', b:1.3, label:'Prüfgerät (Installationstester)' }, { id:'STAM-10', b:0.9, label:'Seriennummer' },
        { id:'STAM-04', b:0.9 } ],
      [ { id:'STAM-20', b:2.2 }, { id:'STAM-16', b:1.7 }, { id:'STAM-18', b:1.3 }, { id:'STAM-19', b:1.2 } ],
      [ { id:'NETZ-01', b:2.9, wahl:['TN-S','TN-C-S','TN-C','TT','IT'] }, { id:'NETZ-02', b:1 }, { id:'NETZ-03', b:1.25 },
        { id:'NETZ-04', b:1.15 }, { id:'NETZ-05', b:1.15, label:'Vorsicherung' },
        { id:'NMESS-01-a', b:1.75, label:'Netzform', wahl:['Drehstrom','1-phasig'] } ],
      { nurWenn:{ feld:'NETZ-05', enthaelt:'NEA' }, zellen:[
        { id:'GEN-01', label:'Generator/NEA – Nennleistung' }, 'GEN-02', 'GEN-03', 'GEN-04', 'GEN-05' ] },
      [ { id:'LTG-04', b:1.3, label:'Anschlussleitung Typ' }, { id:'LTG-05', b:0.7, label:'Leiter' },
        { id:'LTG-06', b:0.95, label:'Querschnitt' }, { id:'LTG-02', b:0.8, label:'Länge' },
        { id:'STAM-21', b:1.1 }, { id:'NMESS-10', b:1.1, label:'Geplante Last' },
        { id:'ERD-01', b:1.5, label:'Zus. Potenzialausgleich', wahl:['Ja','Nein'] } ]
    ]},

    { art:'checkliste', titel:'Schritt 1 · Besichtigen (vor dem Messen)  ·  Schritt 4 · Erproben (zum Schluss)', optionen:['i.O.','n.i.O.','n.a.'], spalten:[
      { titel:'1 · Besichtigen', felder:['BES-01','BES-02','BES-10','BES-04','BES-09'], kurz:{ 'BES-10':'Steckvorrichtungen/Kupplungen' } },
      { titel:'1 · Besichtigen', felder:['BES-07','BES-05','BES-08','BES-03','BES-11'] },
      { titel:'4 · Erproben – unter Spannung', felder:['ERP-01','ERP-03','ERP-04','ERP-05','ERP-06'], kurz:{ 'ERP-03':'Polarität / Steckdosen', 'ERP-05':'RCD-Prüftaste (nur mit RCD)', 'ERP-06':'Drehrichtung Motoren' } }
    ]},

    { art:'ablauf', titel:'Schritte 2 und 3 · Messen', zeileMin:6, zeileMinLeer:6.8,
      rechts:(w, leer)=>leer ? 'Messwert eintragen · Zutreffendes ankreuzen · Grenzwert steht im Prüfschritt' : 'Grenzwert steht im Prüfschritt · rot = nicht eingehalten',
      abschnitte:(w, leer)=>anschlussAblauf(w, leer),
      legende:()=>'Reihenfolge: 1 Besichtigen → 2 spannungsfrei messen → 3 zuschalten und unter Spannung messen → 4 Erproben · „Schalter“ = Stellung am Installationstester' }
  ],

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
      { id:'FIN-11', titel:'Auftraggeber / Betreiber / Vermieter', unterzeile:'Unterschrift Auftraggeber/Betreiber' } ] },

  fotos: { titel:'Fotodokumentation', feld:'SK-03', spalten:2, zeilen:3, beschriftung: w=>w('STAM-20') || 'Übergabepunkt' }
};

function anschlussOhneRcd(w){ return /^ohne\s*rcd$/i.test(w('RCD-01-a')); }

/* Prüfablauf der Anschlussprüfung: Abschnitt 2 spannungsfrei, Abschnitt 3 unter Spannung (Satz in 2 Spalten).
   Reihenfolge, Texte und Grenzwert-Hinweise HIER ändern. Grenzwerte selbst: GRENZWERTE / FeldLogik. */
function anschlussAblauf(w, leer){
  const P = PdfProtokoll, G = GRENZWERTE, opt = { speisepunkt:true };
  const f = n => P.zahlDe(n), gw = id => leer ? null : FeldLogik.grenzwert(id, w, opt);
  const norm = id => (feldFinden(id) || {}).norm || {};
  const schalter = k => (typeof INFO !== 'undefined' && INFO[k]) ? 'Schalter ' + INFO[k].icons.map(i=>i.label.replace(/_([A-Za-zΔ0-9]+)/g, '_{$1}')).join(' / ') : '';
  const hin = (...t) => t.filter(Boolean).join(' · ');
  const wert = (id, label, einheit, leerBreite) => {
    const v = leer ? '' : P.formatieren(w(id), 'zahl');
    return { id, label, einheit, leerBreite, wert:v, status: v && FeldLogik.ausserhalb(id, w, opt) ? 'rot' : null };
  };
  const text = (id, label, leerBreite) => ({ label, wert: leer ? '' : w(id), leerBreite });
  const wahl = (id, optionen, kurz, farbe) => {
    const v = leer ? '' : w(id);
    const liste = optionen.map(o=>({ wert:o, text:(kurz || {})[o] || o, farbe:(farbe || {})[o] }));
    if(v && !optionen.includes(v)) liste.push({ wert:v, text:v });
    return { wahl:liste, gewaehlt:v };
  };
  /* Ergebnis: n.i.O., sobald ein Wert den Grenzwert verletzt; i.O., wenn alle geprüften Werte da und eingehalten */
  const auto = teile => {
    if(leer) return '';
    const mess = teile.filter(t=>t.id && FeldLogik.grenzwert(t.id, w, opt));
    if(mess.some(t=>t.status === 'rot')) return 'n.i.O.';
    return mess.length && mess.every(t=>t.wert) ? 'i.O.' : '';
  };
  const erg = v => v === 'i.O.' || v === 'n.i.O.' ? v : '';
  const zeile = (nr, text, hinweis, teile, extra) => Object.assign({ nr, text, hinweis, teile, ergebnis:auto(teile) }, extra || {});
  const entfaellt = (nr, text, hinweis, grund) => ({ nr, text, hinweis, aus:true, teile:[{ text:'entfällt (' + grund + ')', status:'aus' }] });

  const einph = !leer && w('NMESS-01-a') === '1-phasig', ohneRcd = !leer && anschlussOhneRcd(w);
  const nLN = norm('NMESS-01-b'), nLL = norm('NMESS-01-e'), nNPE = norm('NMESS-01-h'), nF = norm('NMESS-01-i');
  const riso = gw('RISO-01-b'), ls = leer ? null : FeldLogik.minIkAusLS(w('ZNS-01-a')), ik2 = gw('ZNS-01-e');
  const rd = gw('RCD-01-d'), rt = gw('RCD-01-e'), uf = gw('RCD-01-i');
  const faktoren = Object.keys(G.RCD_ZEIT_MAX).map(k=>(/^\s*(\d+)/.exec(k) || ['', '?'])[1]);

  return [
    { titel:'2 · Spannungsfrei messen – vor dem Zuschalten', zeilen:[
      zeile('2.1', 'Schutzleiterwiderstand R_{PE}', hin(leer ? '≤ l/(' + G.ANL_RPE.kappa + '·A) + ' + f(G.ANL_RPE.uebergang) + ' Ω' : '≤ ' + f(gw('RPE-01').max) + ' Ω', schalter('rpe')),
        [ wert('RPE-01', 'R_{PE}', 'Ω', 10) ]),
      zeile('2.2', 'Isolationswiderstand R_{ISO}', hin(riso ? '≥ ' + f(riso.min) + ' MΩ' : '≥ ' + f(G.RISO_MIN.standard) + ' MΩ · SELV/PELV ≥ ' + f(G.RISO_MIN['SELV-PELV']) + ' MΩ', schalter('riso')),
        [ wahl('RISO-01-a', ['500 V ohne Verbraucher','250 V mit Verbrauchern','1000 V DC','SELV-PELV'],
            { '500 V ohne Verbraucher':'500 V', '250 V mit Verbrauchern':'250 V', '1000 V DC':'1000 V', 'SELV-PELV':'SELV' }),
          wert('RISO-01-b', 'R_{ISO}', 'MΩ', 10) ]),
      zeile('2.3', 'Durchgängigkeit der Leiter', hin('alle Leiter durchgängig', schalter('rlo')), [], { ergebnis:erg(w('LTG-01')) }),
      zeile('2.4', 'Erdungswiderstand R_{E}', 'fachlich bewerten · TT: R_{A} ≤ 50 V / I_{Δn}',
        [ text('ERD-04', 'Messpunkt', 16), wert('ERD-03', 'R_{E}', 'Ω', 9) ], { ohneErgebnis:!leer }),
      zeile('2.5', 'Durchgängigkeit Potenzialausgleich', hin('alle Verbindungen durchgängig', schalter('rlo')), [], { ergebnis:erg(w('ERD-02')) })
    ]},
    { titel:'3 · Unter Spannung messen – nach dem Zuschalten', zeilen:[
      zeile('3.1', 'Spannung L–N', hin(f(nLN.min) + '–' + f(nLN.max) + ' V', schalter('vhz')),
        [ wert('NMESS-01-b', 'L1', '', 7.5) ].concat(einph ? [] : [ wert('NMESS-01-c', 'L2', '', 7.5), wert('NMESS-01-d', 'L3', '', 7.5) ])),
      einph ? entfaellt('3.2', 'Spannung L–L', f(nLL.min) + '–' + f(nLL.max) + ' V', '1-phasig') :
        zeile('3.2', 'Spannung L–L', hin(f(nLL.min) + '–' + f(nLL.max) + ' V', schalter('vhz')),
          [ wert('NMESS-01-e', 'L1-L2', 'V', 8), wert('NMESS-01-f', 'L2-L3', 'V', 8), wert('NMESS-01-g', 'L1-L3', 'V', 8) ]),
      zeile('3.3', 'U_{N-PE} und Frequenz', hin('U_{N-PE} ≤ ' + f(nNPE.max) + ' V · f ' + f(nF.min) + '–' + f(nF.max) + ' Hz', schalter('vhz')),
        [ wert('NMESS-01-h', 'U_{N-PE}', 'V', 8), wert('NMESS-01-i', 'f', 'Hz', 8) ]),
      einph ? entfaellt('3.4', 'Drehfeld', 'Rechtsdrehfeld', '1-phasig') :
        zeile('3.4', 'Drehfeld', hin('Rechtsdrehfeld', schalter('phase')), [ wahl('NMESS-09', ['rechts','links'], null, { links:'rotText' }) ],
          { ergebnis: leer ? '' : w('NMESS-09') === 'rechts' ? 'i.O.' : w('NMESS-09') === 'links' ? 'n.i.O.' : '' }),
      zeile('3.5', 'Schleifenimpedanz Z_{S} → I_{K}', hin(ls ? 'I_{K} ≥ ' + f(ls.min) + ' A (LS ' + w('ZNS-01-a') + ')' : 'I_{K} ≥ ' + G.LS_FAKTOR.B + ' × I_{n} (B) · ' + G.LS_FAKTOR.C + ' × I_{n} (C)', schalter('zns')),
        [ text('ZNS-01-a', 'LS', 10), wert('ZNS-01-b', 'Z_{S}', 'Ω', 8), wert('ZNS-01-c', 'I_{K}', 'A', 9) ]),
      zeile('3.6', 'Netzimpedanz Z_{I} → I_{K2}', hin(ik2 ? 'I_{K2} ≥ ' + f(ik2.min) + ' A (≈ ' + G.NETZ_IK2_FAKTOR + ' × Vorsicherung)' : 'I_{K2} ≥ ≈ ' + G.NETZ_IK2_FAKTOR + ' × Vorsicherung', schalter('zns')),
        [ wert('ZNS-01-d', 'Z_{I}', 'Ω', 8), wert('ZNS-01-e', 'I_{K2}', 'A', 9) ]),
      zeile('3.7', 'RCD – Angaben', 'Typ, Nennstrom, Bemessungsfehlerstrom',
        ohneRcd ? [ { text:'ohne RCD', fett:true } ] :
        [ wahl('RCD-01-a', ['A','F','B','B+','AC','ohne RCD']), wert('RCD-01-b', 'I_{n}', 'A', 8), wert('RCD-01-c', 'I_{Δn}', 'mA', 8) ], { ohneErgebnis:true }),
      ohneRcd ? entfaellt('3.8', 'RCD – Auslösung', '', 'ohne RCD') :
        zeile('3.8', 'RCD – Auslösestrom & -zeit', hin(rd && rt ? 'I_{Δ} ' + f(rd.min) + '–' + f(rd.max) + ' mA · t_{A} ≤ ' + rt.max + ' ms'
            : 'I_{Δ} ' + f(G.RCD_STROM_BAND.min) + '–' + f(G.RCD_STROM_BAND.max) + ' × I_{Δn} · t_{A} ≤ ' + Object.values(G.RCD_ZEIT_MAX).join(' / ') + ' ms', schalter('rcd')),
          [ wahl('RCD-01-c2', Object.keys(G.RCD_ZEIT_MAX), Object.fromEntries(Object.keys(G.RCD_ZEIT_MAX).map((k, i)=>[k, faktoren[i] + '×']))),
            wert('RCD-01-d', 'I_{Δ}', 'mA', 8), wert('RCD-01-e', 't_{A}', 'ms', 8) ]),
      ohneRcd ? entfaellt('3.9', 'Berührungsspannung U_{F}', '', 'ohne RCD') :
        zeile('3.9', 'Berührungsspannung U_{F}', uf ? 'U_{F} ≤ ' + uf.max + ' V' : 'U_{F} ≤ U_{L}: ' + G.UL.AC.normal + ' V AC · erhöht ' + G.UL.AC['erhöht'] + ' V',
          [ wahl('RCD-01-f', ['AC','DC']), wahl('RCD-01-g', ['normal','erhöht']), wert('RCD-01-i', 'U_{F}', 'V', 8) ])
    ]}
  ];
}

async function pdfAnschluss(arg, leer){
  const r = await PdfProtokoll.einseitig(PDF_PLAN_ANSCHLUSS, arg, leer);
  return PdfProtokoll.speichern(r, leer ? 'Leerformular' : r.fotos ? 'Protokoll 1 Seite' + PdfProtokoll.fotoText(r.fotos) : '');
}
function pdfAnschlussAusgefuellt(arg){ return pdfAnschluss(arg, false); }
function pdfAnschlussLeer(arg){ return pdfAnschluss(arg, true); }
