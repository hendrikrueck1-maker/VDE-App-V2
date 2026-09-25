/* =========================================================================
   Feld-Logik für Protokollseiten: Berechnungen, abhängige Grenzwerte,
   Ein-/Ausblenden. Arbeitet NICHT mit festen Element-IDs, sondern über einen
   Kontext je Bereich (ganzes Protokoll ODER eine Stromkreis-Karte) – dadurch
   funktionieren dieselben Regeln in beliebig vielen wiederholten Karten.

   Grenzwerte: GRENZWERTE in js/felder-daten.js (eine Quelle für alle Seiten).

   Kontext (von protokoll-seite.js geliefert)
     c.h(id)        Feld-Handle im Bereich (sonst im Protokoll-Kopf) oder null
     c.wert(id)     aktueller Wert als Text ('' wenn nicht vorhanden)
     c.eingabe(id)  Eingabe-Element (input/select) oder null
     c.root         Wurzel des Bereichs (Karte bzw. Formular)
     c.initial      true beim ersten Durchlauf nach dem Laden

   Neue Regel: Eintrag in REGELN mit `ausloeser` (Feld-IDs) und `aktion(c)`.
   Die Regel läuft, wenn eines der Auslöser-Felder im selben Bereich geändert
   wird, und einmal beim Laden (c.initial).
   ========================================================================= */
const FeldLogik = (function(){
  'use strict';
  const G = GRENZWERTE;

  /* Zahl aus Feldtext – gleiche Prüfung wie im Formular (zahlPruefen, feld-renderer.js); ungültig → null */
  function zahl(v){ const r = zahlPruefen(v, true); return r.gueltig ? r.wert : null; }
  /* Eintrag vorhanden, aber keine gültige Zahl (Text, negativ, Tausenderpunkt) */
  function ungueltig(v, negativ){ const r = zahlPruefen(v, !!negativ); return !r.leer && !r.gueltig; }
  function fmt(n, st){ return n.toLocaleString('de-DE', { maximumFractionDigits: st===undefined ? 1 : st }); }
  /* berechnete Feldwerte: deutsches Komma, ohne Tausenderpunkt (sonst Eingabefehler „Tausenderpunkt“) */
  function wertText(n, st){ return n.toLocaleString('de-DE', { maximumFractionDigits: st===undefined ? 1 : st, useGrouping:false }); }

  /* Berechnetes Feld setzen und Pflichtfarbe/Norm-Check mitziehen */
  function setzeBerechnet(inp, wert){
    if(!inp || inp.value===wert) return;
    inp.value = wert;
    inp.dispatchEvent(new Event('input', { bubbles:true }));
  }
  function grenze(inp, min, max){
    if(!inp) return;
    inp.classList.add('normcheck');
    inp.dataset.min = (min==null) ? '' : String(min);
    inp.dataset.max = (max==null) ? '' : String(max);
    pruefeNorm(inp);
  }
  function sichtbar(el, ja){ if(el) el.classList.toggle('ausgeblendet', !ja); }

  function statusZeile(inp){
    if(!inp) return null;
    let st = inp.parentElement.querySelector(':scope > .grenz-status');
    if(!st){ st = document.createElement('div'); st.className = 'grenz-status'; st.setAttribute('aria-live','polite'); inp.insertAdjacentElement('afterend', st); }
    return st;
  }

  /* Mindest-I_K aus der Überstrom-Schutzeinrichtung (ZNS-01-a):
     LS  Tabelle (Schnellauswahl) oder „B 20A" / „K 16A" → Faktor × I_n (LS_FAKTOR)
     gG-/NH-/Neozed-/Diazed-Sicherung („gG 35A", „NH 63A", „NH00 3x63A", „D02 35A")
         → I_a aus SICHERUNG_GG: bis SICHERUNG_04S_BIS A 0,4 s, darüber 5 s */
  const SICHERUNG_MUSTER = /^(?:gG|gL|gL\/gG|NH(?:\s*(?:000|00|0|[1-4])(?=\s))?|Neozed|Diazed|D0[1-3]|DI{2,3})\s*(?:gG\s*)?(?:\d\s*[x×]\s*)?(\d+)\s*A?$/i;
  function minIkAusLS(text){
    const t = String(text||'').trim();
    if(!t) return null;
    if(G.LS_MIN_IK[t]) return { min:G.LS_MIN_IK[t], bezug:'LS ' + t + ', sofortige Auslösung' };
    const s = SICHERUNG_MUSTER.exec(t);
    if(s){
      const inenn = parseInt(s[1], 10), zeit = inenn <= G.SICHERUNG_04S_BIS ? '0,4 s' : '5 s';
      const ia = (G.SICHERUNG_GG[zeit] || {})[inenn];
      return ia ? { min:ia, bezug:'Sicherung ' + t + ', I_a für ' + zeit } : null;
    }
    const m = /^([BCDKZ])\s*(\d+(?:[.,]\d+)?)\s*A?$/i.exec(t);
    if(!m) return null;
    const faktor = G.LS_FAKTOR[m[1].toUpperCase()], inenn = zahl(m[2]);
    return { min: faktor*inenn, bezug:'LS ' + t + ' (' + faktor + ' × I_n)' };
  }
  /* Klartext, wenn minIkAusLS nichts liefert */
  function lsNichtErkannt(ls){
    return SICHERUNG_MUSTER.exec(String(ls).trim())
      ? `Sicherung „${ls}“: Nennstrom nicht in der I_a-Tabelle – Mindestwert fachlich bestimmen.`
      : `„${ls}“ nicht erkannt – Mindestwert fachlich bestimmen (z. B. „B 16A“, „C 32A“, „gG 35A“, „NH 63A“).`;
  }

  /* Grenzwerte auf 0,01 Ω runden – angezeigter und geprüfter Wert sind identisch */
  const rund2 = x => Math.round(x * 100) / 100;

  /* Anlage/Anschluss: zulässiger R_PE aus Länge (LTG-02) und Querschnitt (LTG-06) desselben Bereichs */
  function anlRpeMax(laenge, querschnitt){
    const r = G.ANL_RPE, l = zahl(laenge), a = zahl(querschnitt);
    if(l === null || !a) return { max:r.ohneDaten, bezug:'Richtwert ohne Leitungsdaten' };
    return { max: rund2(l / (r.kappa * a) + r.uebergang), bezug: fmt(l, 1) + ' m · ' + fmt(a, 2) + ' mm² + ' + fmt(r.uebergang, 2) + ' Ω Übergang' };
  }

  /* Statuszeile unter I_K bzw. I_K2 + abgeleitetes Z_max am Impedanzfeld */
  function bewerteKurzschluss(ik, z, min, bezug, fehlt){
    const st = statusZeile(ik);
    if(!ik || !st) return;
    const zmax = min ? G.U0/min : null;
    grenze(z, null, zmax ? zmax.toFixed(3) : null);
    grenze(ik, min || null, null);
    const v = zahl(ik.value);
    if(!min){ st.className = 'grenz-status grenz-status--hinweis'; st.textContent = fehlt; return; }
    if(v===null){ st.className = 'grenz-status'; st.textContent = `Mindestwert ${fmt(min,0)} A (${bezug}) – entspricht Z ≤ ${fmt(zmax,2)} Ω`; return; }
    if(v>=min){ st.className = 'grenz-status grenz-status--ok'; st.textContent = `✓ ${fmt(v)} A ≥ min. ${fmt(min,0)} A (${bezug})`; }
    else { st.className = 'grenz-status grenz-status--fehler'; st.textContent = `✗ ${fmt(v)} A < min. ${fmt(min,0)} A (${bezug}) – Kurzschlussstrom zu niedrig, Impedanz zu hoch (max. ${fmt(zmax,2)} Ω)`; }
  }

  /* Geräteprüfung: zulässiger R_PE aus Leitungslänge (GER-08) und Querschnitt (LTG-06),
     Grenzwerte aus Schutzklasse (GER-07), Heizelementen (GER-14/15) und Methode (GER-10) */
  function gerRpeMax(laenge, querschnitt){
    const r = G.GER_RPE, l = zahl(laenge), a = zahl(querschnitt);
    if(a && a > r.abQuerschnitt && l !== null) return rund2(l / (r.kappa * a) + r.uebergang);   /* Leiter > 1,5 mm² */
    if(l === null || l <= r.bisM) return r.basis;
    return rund2(Math.min(r.max, r.basis + (l - r.bisM) / r.schrittM * r.zuschlag));           /* anteilig je 7,5 m */
  }
  const heizJa = heiz => String(heiz || '') === 'Ja';
  function gerRisoMin(sk, heiz){
    if(sk === 'I' && heizJa(heiz)) return G.GER_RISO_MIN_HEIZ;
    return G.GER_RISO_MIN[sk];
  }
  function gerAbleitMax(sk, methode, heiz, kw){
    if(!methode || methode === G.GER_METHODE_OHNE) return undefined;
    const basis = (G.GER_ABLEIT_MAX[sk] || {})[methode];
    const h = G.GER_ABLEIT_HEIZ, p = zahl(kw);
    if(sk === 'I' && heizJa(heiz) && methode !== 'Direktmessung' && p !== null && p > h.abKW) return Math.min(h.max, p * h.jeKW);
    return basis;
  }

  const REGELN = [
    /* STAM-08 + STAM-22 → STAM-23 nächster Prüftermin */
    { name:'naechsterTermin', ausloeser:['STAM-08','STAM-22'], aktion(c){
      const ziel = c.eingabe('STAM-23'); if(!ziel) return;
      const datum = c.wert('STAM-08'), iv = c.wert('STAM-22').toLowerCase();
      if(!datum || !iv){ setzeBerechnet(ziel, ''); return; }
      const d = new Date(datum + 'T12:00:00'); const n = parseInt(iv, 10) || 1;
      if(iv.includes('monat')) d.setMonth(d.getMonth()+n);
      else if(iv.includes('jahr')) d.setFullYear(d.getFullYear()+n);
      else { setzeBerechnet(ziel, 'Intervall nicht erkannt – bitte „x Monate“ oder „x Jahre“'); return; }
      setzeBerechnet(ziel, d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }));
    }},

    /* NMESS-01a Drehstrom / 1-phasig → NMESS-01c–g und NMESS-09 */
    { name:'drehstrom', ausloeser:['NMESS-01-a'], aktion(c){
      const einphasig = c.wert('NMESS-01-a')==='1-phasig';
      c.root.querySelectorAll('[data-drehstrom]').forEach(el=>sichtbar(el, !einphasig));
    }},

    /* ZNS-01b Z_S → ZNS-01c I_K = U0 / Z_S (nur bei Eingabe in Z_S; I_K bleibt überschreibbar) */
    { name:'ikBerechnen', ausloeser:['ZNS-01-b'], aktion(c){
      if(c.initial) return;
      const z = zahl(c.wert('ZNS-01-b')), ik = c.eingabe('ZNS-01-c');
      if(ik) setzeBerechnet(ik, z>0 ? wertText(G.U0/z) : '');   /* Z_S gelöscht/ungültig → I_K leeren (kein veralteter Wert) */
    }},
    /* ZNS-01a LS → Mindest-I_K, Bewertung von ZNS-01c und Z_max an ZNS-01b */
    { name:'ikBewerten', ausloeser:['ZNS-01-a','ZNS-01-b','ZNS-01-c'], aktion(c){
      const ls = c.wert('ZNS-01-a').trim(), r = minIkAusLS(ls), ik = c.eingabe('ZNS-01-c');
      if(ik) ik.placeholder = r ? `min. ${fmt(r.min,0)} A` : 'min. siehe LS-Typ';
      bewerteKurzschluss(ik, c.eingabe('ZNS-01-b'), r && r.min, r && r.bezug,
        ls ? lsNichtErkannt(ls)
           : 'Kein Mindestwert: bitte zuerst die Schutzeinrichtung (ZNS-01-a, LS oder Sicherung) wählen.');
    }},

    /* ZNS-01d Z_I → ZNS-01e I_K2.
       Im Stromkreis (LS in ZNS-01a vorhanden): Mindestwert wie I_K aus dem LS – der LS muss auch
       bei Kurzschluss L-N abschalten. Am Speisepunkt: ≈ 5 × Vorsicherung NETZ-05, NEA ohne Bewertung. */
    { name:'ik2', ausloeser:['ZNS-01-d','NETZ-05','ZNS-01-a'], aktion(c){
      const e = c.eingabe('ZNS-01-e'); if(!e) return;
      const z = zahl(c.wert('ZNS-01-d'));
      setzeBerechnet(e, (z>0) ? wertText(G.U0/z) : '');
      if(c.lokal('ZNS-01-a') && c.root !== document && c.root.closest('[data-instanz]')){
        const ls = c.wert('ZNS-01-a').trim(), r = minIkAusLS(ls);
        e.placeholder = r ? `min. ${fmt(r.min,0)} A` : 'automatisch berechnet';
        bewerteKurzschluss(e, c.eingabe('ZNS-01-d'), r && r.min, r && r.bezug,
          ls ? lsNichtErkannt(ls) : 'Kein Mindestwert: bitte zuerst die Schutzeinrichtung (ZNS-01-a) wählen.');
        return;
      }
      const vs = c.wert('NETZ-05'), nea = /nea/i.test(vs);
      const m = nea ? null : /(\d+(?:[.,]\d+)?)\s*A\b/i.exec(vs);
      const amps = m ? zahl(m[1]) : null, min = amps ? amps*G.NETZ_IK2_FAKTOR : null;
      e.placeholder = min ? `min. ca. ${fmt(min,0)} A` : 'automatisch berechnet';
      bewerteKurzschluss(e, c.eingabe('ZNS-01-d'), min, amps ? `≈ ${G.NETZ_IK2_FAKTOR} × ${fmt(amps,0)} A Vorsicherung, NETZ-05` : '',
        nea ? 'NEA/Stromerzeuger: keine automatische Bewertung – fachlich beurteilen.'
            : 'Kein Mindestwert: bitte bei NETZ-05 die Vorsicherung wählen.');
    }},

    /* LTG-02 Länge + LTG-06 Querschnitt (im selben Bereich) → Grenzwert R_PE (RPE-01) */
    { name:'rpeAnlage', ausloeser:['LTG-02','LTG-06','RPE-01'], aktion(c){
      const inp = c.eingabe('RPE-01'); if(!inp) return;
      const lokal = id => { const x = c.lokal(id); return x ? String(x.lesen() == null ? '' : x.lesen()) : ''; };
      const r = anlRpeMax(lokal('LTG-02'), lokal('LTG-06'));
      inp.placeholder = 'max. ' + fmt(r.max, 2) + ' Ω';
      grenze(inp, null, r.max);
      const st = statusZeile(inp); if(!st) return;
      const v = zahl(inp.value);
      if(v === null){ st.className = 'grenz-status' + (r.bezug.startsWith('Richtwert') ? ' grenz-status--hinweis' : ''); st.textContent = 'Max. ' + fmt(r.max, 2) + ' Ω (' + r.bezug + ')' + (r.bezug.startsWith('Richtwert') ? ' – Länge LTG-02 und Querschnitt LTG-06 eintragen für den genauen Grenzwert.' : ''); return; }
      if(v <= r.max){ st.className = 'grenz-status grenz-status--ok'; st.textContent = '✓ ' + fmt(v, 2) + ' Ω ≤ max. ' + fmt(r.max, 2) + ' Ω (' + r.bezug + ')'; }
      else { st.className = 'grenz-status grenz-status--fehler'; st.textContent = '✗ ' + fmt(v, 2) + ' Ω > max. ' + fmt(r.max, 2) + ' Ω (' + r.bezug + ') – Schutzleiter/Klemmstellen prüfen.'; }
    }},

    /* RISO-01a Prüfspannung → Mindestwert RISO-01b */
    { name:'risoMin', ausloeser:['RISO-01-a'], aktion(c){
      const inp = c.eingabe('RISO-01-b'); if(!inp) return;
      const min = G.RISO_MIN[c.wert('RISO-01-a')] ?? G.RISO_MIN.standard;
      inp.placeholder = 'min. ' + fmt(min) + ' MΩ';
      grenze(inp, min, null);
    }},

    /* RCD-01a „ohne RCD" → b–i ausblenden */
    { name:'ohneRcd', ausloeser:['RCD-01-a'], aktion(c){
      const ohne = /^ohne\s*rcd$/i.test(c.wert('RCD-01-a').trim());
      ['b','c','c2','d','e','f','g','h','i'].forEach(s=>{ const h = c.h('RCD-01-'+s); if(h) sichtbar(h.el, !ohne); });
    }},
    /* RCD-01c I_Δn → Toleranzband RCD-01d */
    { name:'rcdStrom', ausloeser:['RCD-01-c'], aktion(c){
      const inp = c.eingabe('RCD-01-d'); if(!inp) return;
      const idn = zahl((c.wert('RCD-01-c').match(/[\d.,]+/)||[''])[0]);
      if(idn===null){ inp.placeholder = ''; grenze(inp, null, null); return; }
      const b = G.RCD_STROM_BAND;
      inp.placeholder = fmt(idn*b.min) + '–' + fmt(idn*b.max) + ' mA';
      grenze(inp, idn*b.min, idn*b.max);
    }},
    /* RCD-01c2 Prüfstrom → max. Auslösezeit RCD-01e */
    { name:'rcdZeit', ausloeser:['RCD-01-c2'], aktion(c){
      const inp = c.eingabe('RCD-01-e'); if(!inp) return;
      const max = G.RCD_ZEIT_MAX[c.wert('RCD-01-c2')] || 40;
      inp.placeholder = `max. ${max} ms`;
      grenze(inp, null, max);
    }},
    /* RCD-01f + g → U_L in RCD-01h und Grenzwert für RCD-01i */
    { name:'beruehrungsspannung', ausloeser:['RCD-01-f','RCD-01-g'], aktion(c){
      const art = c.wert('RCD-01-f'), ber = c.wert('RCD-01-g');
      const ul = (G.UL[art] || {})[ber];
      setzeBerechnet(c.eingabe('RCD-01-h'), ul ? `≤ ${ul} V` : '');
      const inp = c.eingabe('RCD-01-i');
      if(inp){ inp.placeholder = ul ? `max. ${ul} V` : 'erst f und g wählen'; grenze(inp, null, ul || null); }
    }},

    /* ===== Geräteprüfung ===== */
    /* GER-07 Schutzklasse (+ GER-14 Heizelemente, GER-10 Methode) → entfallende Felder ausblenden (dann keine Pflicht) */
    { name:'gerSchutzklasse', ausloeser:['GER-07','GER-14','GER-10'], aktion(c){
      const sk = c.wert('GER-07');
      const ohneRpe = G.GER_OHNE_RPE.includes(sk), ohneAbleit = G.GER_OHNE_ABLEIT.includes(sk);
      const h = id => c.h(id);
      if(h('GER-05')) sichtbar(h('GER-05').el, !ohneRpe);
      ['GER-10','GER-09'].forEach(id=>{ if(h(id)) sichtbar(h(id).el, !ohneAbleit); });
      if(h('GER-09') && c.wert('GER-10') === G.GER_METHODE_OHNE) sichtbar(h('GER-09').el, false);
      if(h('GER-14')) sichtbar(h('GER-14').el, sk === 'I');
      if(h('GER-15')) sichtbar(h('GER-15').el, sk === 'I' && heizJa(c.wert('GER-14')));
    }},
    /* GER-08 Länge + LTG-06 Querschnitt → Grenzwert R_PE GER-05 */
    { name:'gerRpe', ausloeser:['GER-07','GER-08','LTG-06'], aktion(c){
      const inp = c.eingabe('GER-05'); if(!inp) return;
      const max = gerRpeMax(c.wert('GER-08'), c.wert('LTG-06'));
      inp.placeholder = 'max. ' + fmt(max, 2) + ' Ω';
      grenze(inp, null, max);
    }},
    /* GER-07 (+ GER-14 Heizelemente) → Mindestwert R_ISO GER-05c */
    { name:'gerRiso', ausloeser:['GER-07','GER-14'], aktion(c){
      const inp = c.eingabe('GER-05c'); if(!inp) return;
      const min = gerRisoMin(c.wert('GER-07'), c.wert('GER-14'));
      inp.placeholder = min != null ? 'min. ' + fmt(min, 2) + ' MΩ' : 'erst Schutzklasse (GER-07) wählen';
      grenze(inp, min ?? null, null);
    }},
    /* GER-07 + GER-10 (+ GER-14/15 Heizleistung) → Grenzwert Ableitstrom GER-09, gewählte Methode am Icon/in der Hilfe hervorheben */
    { name:'gerAbleit', ausloeser:['GER-07','GER-10','GER-14','GER-15'], aktion(c){
      const methode = c.wert('GER-10');
      c.root.querySelectorAll('.icon-badge[data-methode]').forEach(b=>{
        b.classList.toggle('icon-badge--aktiv', !!methode && b.dataset.methode === methode);
        b.classList.toggle('icon-badge--inaktiv', !!methode && b.dataset.methode !== methode);
      });
      if(typeof markiereErklMethode === 'function') markiereErklMethode(methode);
      const inp = c.eingabe('GER-09'); if(!inp) return;
      const max = gerAbleitMax(c.wert('GER-07'), methode, c.wert('GER-14'), c.wert('GER-15'));
      inp.placeholder = max != null ? 'max. ' + fmt(max, 2) + ' mA' : 'erst Schutzklasse und Methode wählen';
      grenze(inp, null, max ?? null);
    }}
  ];

  /* Bedingungen für „Bedingt"-Felder (Bauplan: pflichtWenn:'<name>'), bekommen alle Handles */
  const BEDINGUNGEN = {
    /* FIN-09 Bemerkung (Protokoll-Kopf): Pflicht, sobald ein Mangel bewertet oder das Gerät nicht OK ist */
    bemerkungNoetig(handles){
      const kopf = id => { const h = handles.find(x=>x.id === id && !x.instanz); return h ? String(h.lesen() || '') : ''; };
      return /^Mängel festgestellt/.test(kopf('FIN-02')) || /^Nein/.test(kopf('FIN-04')) || ['Fehler','Nicht prüfbar'].includes(kopf('GER-13'));
    },
    /* ERP-05 RCD-Prüftaste: Pflicht, sobald irgendwo ein RCD eingetragen ist */
    rcdVorhanden(handles){
      return handles.some(h=>h.id==='RCD-01-a' && (h.lesen()||'').trim() && !/^ohne\s*rcd$/i.test(h.lesen().trim()));
    }
  };

  /* Grenzwert eines Feldes OHNE DOM (für PDF & Auswertung) – gleiche Regeln wie oben.
     wert(id) liefert den Text im selben Bereich (Stromkreis, sonst Protokoll).
     Rückgabe { min?, max? } oder null. Neue abhängige Grenze → hier UND in REGELN ergänzen. */
  function grenzwert(id, wert, opt){
    const ls = ()=>minIkAusLS(wert('ZNS-01-a'));
    /* opt.speisepunkt: I_K2 / Z_I gegen ≈ 5 × Vorsicherung NETZ-05 (wie REGEL ik2 außerhalb von Stromkreis-Karten) */
    if(opt && opt.speisepunkt && (id === 'ZNS-01-d' || id === 'ZNS-01-e')){
      const vs = wert('NETZ-05'), m = /nea/i.test(vs) ? null : /(\d+(?:[.,]\d+)?)\s*A\b/i.exec(vs);
      const min = m ? zahl(m[1]) * G.NETZ_IK2_FAKTOR : null;
      return min ? (id === 'ZNS-01-e' ? { min } : { max:G.U0 / min }) : null;
    }
    switch(id){
      case 'ZNS-01-c': case 'ZNS-01-e': { const r = ls(); return r ? { min:r.min } : null; }
      case 'ZNS-01-b': case 'ZNS-01-d': { const r = ls(); return r ? { max:G.U0 / r.min } : null; }
      case 'RISO-01-b': return { min: G.RISO_MIN[wert('RISO-01-a')] ?? G.RISO_MIN.standard };
      case 'RCD-01-d': {
        const idn = zahl((String(wert('RCD-01-c')).match(/[\d.,]+/) || [''])[0]);
        return idn === null ? null : { min:idn * G.RCD_STROM_BAND.min, max:idn * G.RCD_STROM_BAND.max };
      }
      case 'RCD-01-e': return { max: G.RCD_ZEIT_MAX[wert('RCD-01-c2')] || 40 };
      case 'RCD-01-i': { const ul = (G.UL[wert('RCD-01-f')] || {})[wert('RCD-01-g')]; return ul ? { max:ul } : null; }
      case 'RPE-01':  return { max: anlRpeMax(wert('LTG-02'), wert('LTG-06')).max };
      case 'GER-05':  return { max: gerRpeMax(wert('GER-08'), wert('LTG-06')) };
      case 'GER-05c': { const m = gerRisoMin(wert('GER-07'), wert('GER-14')); return m != null ? { min:m } : null; }
      case 'GER-09':  { const m = gerAbleitMax(wert('GER-07'), wert('GER-10'), wert('GER-14'), wert('GER-15')); return m != null ? { max:m } : null; }
    }
    const f = typeof feldFinden === 'function' ? feldFinden(id) : null;
    return f && f.norm && (f.norm.min != null || f.norm.max != null) ? f.norm : null;
  }
  /* true, wenn ein eingetragener Zahlenwert den Grenzwert verletzt – oder bei einem Messfeld
     keine gültige Zahl ist (Text, negativ, Tausenderpunkt; PDF zeigt die Zelle dann rot) */
  function ausserhalb(id, wert, opt){
    const roh = wert(id), r = zahlPruefen(roh, false);
    const f = typeof feldFinden === 'function' ? feldFinden(id) : null;
    if(!r.leer && !r.gueltig && f && f.kind === 'number' && !f.negativ) return true;
    const v = zahl(roh), g = v === null ? null : grenzwert(id, wert, opt);
    const p = r.praefix || '';
    return !!g && ((g.min != null && v < g.min && p !== '>' && p !== '≥') || (g.max != null && v > g.max && p !== '<' && p !== '≤'));
  }

  return { REGELN, BEDINGUNGEN, zahl, ungueltig, wertText, minIkAusLS, anlRpeMax, grenzwert, ausserhalb, gerRpeMax, gerRisoMin, gerAbleitMax };
})();
