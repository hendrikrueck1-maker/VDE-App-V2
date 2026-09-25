/* =========================================================================
   Protokollseiten-Engine – EINE Logik für alle Protokolle (Anlage, später
   Anschluss und Geräte). Die Seite selbst ist nur ein Bauplan (z. B.
   js/protokoll-anlage.js) + ProtokollSeite.start(BAUPLAN).

   Aufgaben
     Laden        ?entwurf=<id> aus speicher.js, Stammdaten-Kopie als Vorbelegung
     Aufbau       Abschnitte, Gruppen, Blöcke und Felder per renderFeld(<ID>)
     Wiederholen  Karten (Stromkreise) im Karussell: hinzufügen, duplizieren, entfernen
     Logik        Regeln aus feld-logik.js je Bereich (Protokoll / Karte)
     Status       Pflichtfelder, Ampel FIN-01, Speicherstatus, Feld-IDs ein/aus
     Speichern    automatisch 0,6 s nach jeder Änderung und beim Verlassen
     Erstellen    Knöpfe „ausgefüllt" / „leer" → PDF-Funktionen aus bauplan.pdf
                  bauplan.pdf = null → nur „Pflichtfelder prüfen" (PDF folgt später)
     Ohne `wiederholen` = ein Prüfling je Protokoll (Anschluss, Gerät)

   Datenformat entwurf.daten
     { '<Feld-ID>': wert, …, '<wiederholen.schluessel>': [ { id, werte:{ '<Feld-ID>': wert } } ] }
   ========================================================================= */
const ProtokollSeite = (function(){
  'use strict';

  const $ = id => document.getElementById(id);
  function el(tag, attrs, ...kinder){
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v])=>{
      if(v == null || v === false) return;
      if(k === 'class') e.className = v;
      else if(k === 'text') e.textContent = v;
      else if(k === 'html') e.innerHTML = v;            /* nur für statische Daten aus felder-daten.js */
      else if(k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    kinder.forEach(k=>{ if(k != null) e.append(k); });
    return e;
  }
  const fehlerText = e => (e && e.message) ? e.message : 'Unbekannter Fehler.';
  const AMPEL = { gruen:'🟢 i.O.', gelb:'🟡 Bemerkung', rot:'🔴 Mangel' };

  /* ---------------- Zustand ---------------- */
  let B = null;                 /* Bauplan */
  let entwurf = null;
  let form = null;              /* Wurzel aller Felder */
  const kopfHandles = [];       /* Felder außerhalb von Karten */
  const instanzen = new Map();  /* uid → { uid, karte, handles[] } */
  let reihenfolge = [];         /* Instanzen in Anzeige-Reihenfolge */
  let wdh = null;               /* Abschnitt mit `wiederholen` */
  let karussell = null;
  let ladend = true, intern = false, gesperrt = false;
  let speicherTimer = null;
  let trotzdemErstellen = null;   /* gesetzt in erstellenInit() */

  const alleHandles = () => kopfHandles.concat(...reihenfolge.map(i=>i.handles));

  /* ---------------- Meldung & Dialog ---------------- */
  function meldung(text, art){
    const m = $('meldung');
    m.className = 'meldung' + (art ? ' meldung--' + art : '');
    m.textContent = ({ fehler:'Fehler: ', ok:'Erledigt: ', hinweis:'Hinweis: ' }[art] || '') + text;
    m.hidden = false;
  }
  function bestaetigen({ titel, text, ok, gefahr }){
    return new Promise(resolve=>{
      const d = $('dialog');
      $('dialog-titel').textContent = titel;
      const box = $('dialog-text'); box.replaceChildren();
      [].concat(text).forEach(t=>box.append(el('p', { text:t })));
      const okBtn = $('dialog-ok');
      okBtn.textContent = ok || 'OK';
      okBtn.className = 'btn' + (gefahr ? ' btn-danger' : '');
      d.addEventListener('close', ()=>resolve(d.returnValue === 'ok'), { once:true });
      d.returnValue = 'abbruch';
      d.showModal();
      $('dialog-abbruch').focus();
    });
  }

  /* ---------------- Bauplan-Einträge ---------------- */
  function eintragNorm(e){ return (typeof e === 'string') ? { id:e } : e; }

  function feldRendern(e, ziel, instanz){
    const h = renderFeld(e.id, ziel, { modus:'formular', suffix: instanz ? instanz.uid : null, anpassen: e.anpassen });
    h.eintrag = e; h.instanz = instanz || null;
    const f = h.feld;
    if(e.breit || f.kind==='textarea' || f.kind==='canvas' || (f.quick && f.quick.length > 6)) h.el.classList.add('feld--breit');
    if(e.automatisch){
      h.el.classList.add('feld--automatisch');
      h.el.querySelectorAll('input, select, textarea').forEach(x=>{ x.disabled = true; });
    }
    (instanz ? instanz.handles : kopfHandles).push(h);
    return h;
  }

  function blockRendern(e, ziel, instanz){
    const g = blockFinden(e.block);
    if(!g) throw new Error('Block „' + e.block + '" existiert nicht in felder-daten.js');
    const info = g.info && typeof INFO !== 'undefined' ? INFO[g.info] : null;
    const box = el('div', { class:'block feld--breit', 'data-block':g.id },
      el('div', { class:'block-kopf' },
        info ? el('span', { html: renderIconRow(info.icons, 'messungen') }) : null,
        el('h4', { text: e.titel || g.name }),
        el('span', { class:'feld-id', text: g.id + (e.nur ? '-' + e.nur.join('/') : '') })));
    if(g.erkl){
      const erkl = el('div', { class:'gruppen-erkl', html: renderErklaerung(g.erkl, g.id) });
      initErklaerungen(erkl);
      box.append(erkl);
    }
    const raster = el('div', { class:'feldraster' });
    box.append(raster);
    ziel.append(box);
    g.sub.filter(s=>!e.nur || e.nur.includes(s.suf)).forEach(s=>feldRendern({ id: g.id + '-' + s.suf }, raster, instanz));
  }

  function eintraegeRendern(liste, ziel, instanz){
    liste.map(eintragNorm).forEach(e=>{
      try{ e.block ? blockRendern(e, ziel, instanz) : feldRendern(e, ziel, instanz); }
      catch(err){ console.error(err); ziel.append(el('p', { class:'meldung meldung--fehler', text: 'Bauplan-Fehler: ' + fehlerText(err) })); }
    });
  }

  /* Felder bzw. Gruppen eines Abschnitts in `ziel` */
  function inhaltRendern(ab, ziel, instanz){
    if(ab.gruppen){
      ab.gruppen.forEach(gr=>{
        const raster = el('div', { class:'feldraster' });
        let ort = ziel;
        /* Gruppen mit einklappbar:true liegen in einer Karte gemeinsam in .sk-messungen */
        if(instanz && gr.einklappbar){
          if(!instanz.messungen) klappBereichAnlegen(instanz, ziel);
          ort = instanz.messungen;
        }
        ort.append(el('div', { class:'untergruppe' }, el('h3', { class:'untergruppe-titel', text:gr.titel }), raster));
        eintraegeRendern(gr.felder, raster, instanz);
      });
    } else {
      const raster = el('div', { class:'feldraster' });
      ziel.append(raster);
      eintraegeRendern(ab.felder || [], raster, instanz);
    }
  }

  /* ---------------- Einklappen (wiederholen.einklappenWenn) ---------------- */
  function klappBereichAnlegen(inst, ziel){
    const id = 'messungen-' + inst.uid;
    inst.messungen = el('div', { class:'sk-messungen', id });
    inst.klappBtn = el('button', { type:'button', class:'btn btn-secondary sk-klapp', 'aria-expanded':'true', 'aria-controls':id,
      onclick: ()=>klappen(inst, !inst.messungen.hidden) });
    inst.klappLeiste = el('div', { class:'sk-klapp-leiste', hidden:true },
      el('span', { class:'sk-klapp-text', text:'✗ ' + wdh.wiederholen.einzahl + ' nicht in Ordnung – Felder und Messungen eingeklappt.' }), inst.klappBtn);
    ziel.append(inst.klappLeiste, inst.messungen);
  }
  function klappen(inst, zu){
    if(!inst.messungen) return;
    inst.messungen.hidden = zu;
    inst.klappBtn.setAttribute('aria-expanded', String(!zu));
    inst.klappBtn.textContent = zu ? '▸ Felder & Messungen anzeigen' : '▾ Felder & Messungen einklappen';
  }
  /* Automatisch nur beim Wechsel der Bedingung; von Hand auf-/zuklappen bleibt erhalten */
  function einklappenPruefen(inst){
    const b = wdh && wdh.wiederholen.einklappenWenn;
    if(!b || !inst.messungen) return;
    const h = inst.handles.find(x=>x.id === b.feld);
    const soll = !!h && String(h.lesen() || '') === b.gleich;
    if(inst.eingeklappt === soll) return;
    inst.eingeklappt = soll;
    inst.klappLeiste.hidden = !soll;
    klappen(inst, soll);
  }

  /* Feld-Bedingung {feld, gleich | enthaelt} im Bereich des Feldes (Karte, sonst Protokoll) */
  function bedingungErfuellt(b, inst){
    const w = kontext(inst, false).wert(b.feld);
    if(b.gleich !== undefined) return w === b.gleich;
    return w.toLowerCase().includes(String(b.enthaelt || '').toLowerCase());
  }

  /* ---------------- Werte setzen ---------------- */
  /* Wert zu einer Feld-ID, bei umbenannten Feldern auch unter der alten ID (FELD_ALT_IDS) */
  function wertAus(werte, id){
    if(!werte) return undefined;
    if(Object.prototype.hasOwnProperty.call(werte, id)) return werte[id];
    const alt = typeof FELD_ALT_IDS !== 'undefined' ? FELD_ALT_IDS[id] : null;
    return alt ? werte[alt] : undefined;
  }

  function wertSetzen(h, v){
    if(v === undefined || v === null) return;
    const f = h.feld;
    if(v === '' && (f.kind === 'toggle2' || (f.kind === 'select' && f.default))) return;
    h.setzen(v);
  }

  /* ---------------- Wiederholte Karten (Karussell) ---------------- */
  function neueUid(){ return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function instanzAnlegen(werte, uid, nach){
    const w = wdh.wiederholen;
    const inst = { uid: uid || neueUid(), handles: [] };
    const aktion = (text, cls, fn) => el('button', { type:'button', class:'btn ' + cls + ' nur-bearbeiten', text, onclick: fn });
    const leiste = () => el('div', { class:'sk-aktionen' },
      aktion('⧉ Duplizieren', 'btn-secondary', ()=>instanzDuplizieren(inst)),
      aktion('Entfernen', 'btn-danger sk-entfernen', ()=>instanzEntfernen(inst)));
    const inhalt = el('div', { class:'sk-inhalt' });
    inst.karte = el('article', { class:'sk-karte', 'data-instanz':inst.uid },
      el('header', { class:'sk-kopf' },
        el('h3', {}, el('span', { class:'sk-nr' }), el('span', { class:'sk-titel' })), leiste()),
      inhalt,
      el('footer', { class:'sk-fuss' }, leiste()));
    if(nach) nach.karte.after(inst.karte); else karussell.append(inst.karte);   /* erst ins DOM, dann Felder */
    instanzen.set(inst.uid, inst);
    inhaltRendern(wdh, inhalt, inst);
    const vorher = ladend; ladend = true;
    inst.handles.forEach(h=>wertSetzen(h, wertAus(werte, h.id)));
    ladend = vorher;
    if(gesperrt) sperren(inst.karte);
    reihenfolgeAktualisieren();
    regelnInitial(inst);
    return inst;
  }

  function reihenfolgeAktualisieren(){
    reihenfolge = [...karussell.children].map(k=>instanzen.get(k.dataset.instanz)).filter(Boolean);
    const w = wdh.wiederholen;
    reihenfolge.forEach((inst, i)=>{
      const titel = (inst.handles.find(h=>h.id === w.titelFeld) || { lesen:()=>'' }).lesen().trim();
      inst.nr = i + 1;
      inst.karte.querySelector('.sk-nr').textContent = w.einzahl + ' ' + (i + 1);
      inst.karte.querySelector('.sk-titel').textContent = titel ? ' · ' + titel : '';
      inst.karte.setAttribute('aria-label', w.einzahl + ' ' + (i + 1) + ' von ' + reihenfolge.length + (titel ? ': ' + titel : ''));
    });
    const einzig = reihenfolge.length <= 1;
    karussell.querySelectorAll('.sk-entfernen').forEach(b=>{
      b.setAttribute('aria-disabled', String(einzig || gesperrt));
      b.title = einzig ? 'Mindestens ein ' + w.einzahl + ' bleibt bestehen.' : '';
    });
    positionAnzeigen();
  }

  function aktuelleIndex(){
    const x = karussell.scrollLeft;
    let best = 0, abstand = Infinity;
    reihenfolge.forEach((inst, i)=>{ const d = Math.abs(inst.karte.offsetLeft - x); if(d < abstand){ abstand = d; best = i; } });
    return best;
  }
  function positionAnzeigen(){
    const pos = $('sk-position'); if(!pos || !reihenfolge.length) return;
    const i = aktuelleIndex();
    const sichtbar2 = reihenfolge.length > 1 && karussell.clientWidth > reihenfolge[0].karte.offsetWidth * 1.8;
    pos.textContent = wdh.wiederholen.einzahl + ' ' + (i + 1) + (sichtbar2 && i + 2 <= reihenfolge.length ? '–' + (i + 2) : '') + ' von ' + reihenfolge.length;
    $('sk-zurueck').disabled = i <= 0;
    $('sk-vor').disabled = i >= reihenfolge.length - 1 || (sichtbar2 && i >= reihenfolge.length - 2);
  }
  function zeigeInstanz(inst, fokus){
    karussell.scrollTo({ left: inst.karte.offsetLeft, behavior: 'smooth' });
    if(fokus){ const f = inst.karte.querySelector('input:not([disabled]), select, textarea'); if(f) setTimeout(()=>f.focus({ preventScroll:true }), 350); }
  }

  function instanzNeu(){
    const letzte = reihenfolge[reihenfolge.length - 1];
    const inst = instanzAnlegen({}, null, letzte);
    aenderungNachlauf(); speichernPlanen();
    zeigeInstanz(inst, true);
    meldung(wdh.wiederholen.einzahl + ' ' + inst.nr + ' hinzugefügt.', 'ok');
  }
  function instanzDuplizieren(quelle){
    if(gesperrt) return;
    const werte = {};
    (wdh.wiederholen.kopieren || []).forEach(id=>{ const h = quelle.handles.find(x=>x.id === id); if(h) werte[id] = h.lesen(); });
    const inst = instanzAnlegen(werte, null, quelle);
    aenderungNachlauf(); speichernPlanen();
    zeigeInstanz(inst, true);
    meldung(wdh.wiederholen.einzahl + ' ' + quelle.nr + ' dupliziert → ' + wdh.wiederholen.einzahl + ' ' + inst.nr + ' (nur Schutzeinrichtungs-Daten, keine Messwerte).', 'ok');
  }
  async function instanzEntfernen(inst){
    if(gesperrt || reihenfolge.length <= 1) return;
    const w = wdh.wiederholen;
    const titel = (inst.handles.find(h=>h.id === w.titelFeld) || { lesen:()=>'' }).lesen().trim();
    const ja = await bestaetigen({ titel: w.einzahl + ' ' + inst.nr + ' entfernen?',
      text: [w.einzahl + ' ' + inst.nr + (titel ? ' („' + titel + '“)' : '') + ' wird mit allen Messwerten gelöscht.', 'Das kann nicht rückgängig gemacht werden.'],
      ok: 'Entfernen', gefahr: true });
    if(!ja) return;
    inst.karte.remove(); instanzen.delete(inst.uid);
    reihenfolgeAktualisieren(); aenderungNachlauf(); speichernPlanen();
    meldung(w.einzahl + ' entfernt.', 'ok');
  }

  /* ---------------- Regeln (feld-logik.js) ---------------- */
  function kontext(inst, initial){
    const lokal = id => (inst ? inst.handles : kopfHandles).find(h=>h.id === id) || null;
    const h = id => lokal(id) || (inst ? kopfHandles.find(x=>x.id === id) : null) || null;
    return { h, lokal, initial,
      wert: id => { const x = h(id); return x ? String(x.lesen() == null ? '' : x.lesen()) : ''; },
      eingabe: id => { const x = h(id); return x ? x.eingabe : null; },
      root: inst ? inst.karte : form };
  }
  function regelAusfuehren(r, c){
    try{ r.aktion(c); }catch(e){ console.error('Regel ' + r.name, e); }
  }
  function regelnFuer(feldId, inst){
    const regeln = FeldLogik.REGELN.filter(r=>r.ausloeser.includes(feldId));
    const c = kontext(inst, false);
    regeln.forEach(r=>regelAusfuehren(r, c));
    /* Änderung im Protokoll-Kopf (z. B. NETZ-05): Regeln auch in jeder Karte, die eigene Felder dazu hat */
    if(!inst) reihenfolge.forEach(i=>{
      const ci = kontext(i, false);
      regeln.forEach(r=>{ if(r.ausloeser.some(id=>ci.lokal(id))) regelAusfuehren(r, ci); });
    });
  }
  function regelnInitial(inst){
    const c = kontext(inst, true);
    const alt = intern; intern = true;
    FeldLogik.REGELN.forEach(r=>{ if(r.ausloeser.some(id=>c.lokal(id))) regelAusfuehren(r, c); });
    intern = alt;
  }

  /* ---------------- Pflichtfelder, Sichtbarkeit, Ampel ---------------- */
  const ausgeblendet = h => !!h.el.closest('.ausgeblendet');
  /* Zahlenfeld mit ungültiger Eingabe (Text, negativ, Tausenderpunkt) – zählt als NICHT ausgefüllt */
  const ungueltig = h => !!(h.eingabe && h.eingabe.classList && h.eingabe.classList.contains('eingabe-ungueltig'));
  const ausgefuellt = h => String(h.lesen() == null ? '' : h.lesen()).trim() !== '' && !ungueltig(h);
  /* Bedingung für „Pflicht wenn …": Bauplan-Eintrag vor Masterbibliothek (anpassen:{pflichtWenn:null} hebt sie auf) */
  const pflichtBedingung = h => h.eintrag.pflichtWenn || h.feld.pflichtWenn || null;
  /* Karte mit „nicht in Ordnung" (wiederholen.einklappenWenn): eingeklappte Messungen sind keine Pflicht */
  const inEingeklappterKarte = h => !!(h.instanz && h.instanz.eingeklappt && h.instanz.messungen && h.instanz.messungen.contains(h.el));
  function pflichtWirksam(h){
    if(ausgeblendet(h) || h.eintrag.automatisch || inEingeklappterKarte(h)) return false;
    const pw = pflichtBedingung(h);
    if(pw){
      const b = FeldLogik.BEDINGUNGEN[pw];
      return b ? !!b(alleHandles()) : true;
    }
    return ['Pflicht', 'Kritisch', 'Bedingt'].includes(h.feld.pflicht);   /* Bedingt = Pflicht, solange sichtbar */
  }
  function beschreibung(h){
    const w = wdh && wdh.wiederholen;
    let ort = '';
    if(h.instanz && w){
      const t = (h.instanz.handles.find(x=>x.id === w.titelFeld) || { lesen:()=>'' }).lesen().trim();
      ort = w.einzahl + ' ' + h.instanz.nr + (t ? ' (' + t + ')' : '') + ' · ';
    }
    return ort + h.id + ' ' + h.feld.name + (ungueltig(h) ? ' – ungültige Eingabe „' + String(h.lesen()).trim() + '“' : '');
  }
  function pflichtFehlend(){ return alleHandles().filter(h=>pflichtWirksam(h) && !ausgefuellt(h)); }

  function bedingteAbschnitte(){
    B.abschnitte.filter(a=>a.sichtbarWenn).forEach(a=>{
      const h = kopfHandles.find(x=>x.id === a.sichtbarWenn.feld);
      const ja = !!h && String(h.lesen() || '').toLowerCase().includes(String(a.sichtbarWenn.enthaelt).toLowerCase());
      const sec = $('abschnitt-' + a.id), chip = document.querySelector('.abschnitt-nav a[href="#abschnitt-' + a.id + '"]');
      if(sec) sec.classList.toggle('ausgeblendet', !ja);
      if(chip) chip.classList.toggle('ausgeblendet', !ja);
    });
  }
  function bedingteBadges(){
    alleHandles().filter(pflichtBedingung).forEach(h=>{
      const b = h.el.querySelector('.fk-badge'); if(!b) return;
      const ja = pflichtWirksam(h);
      b.textContent = ja ? 'Pflicht' : 'Optional';
      b.className = 'fk-badge ' + (ja ? 'pflicht' : 'optional') + (ja && ausgefuellt(h) ? ' fk-badge--erledigt' : '');
    });
  }

  /* FIN-01: 🔴 bei n.i.O./Grenzwert/Mangel · leer, solange Pflichtfelder fehlen ·
     🟡 bei Bemerkung ohne Mangel · 🟢 sonst. Nie „grün", solange etwas ungeprüft ist. */
  function ampel(){
    const h = kopfHandles.find(x=>x.id === 'FIN-01');
    const mangel = [];                                   /* [{ h, text }] – Sprungziele für die Statusleiste */
    const neu = (x, text)=>mangel.push({ h:x, text });
    alleHandles().forEach(x=>{
      if(ausgeblendet(x) || x.eintrag.automatisch) return;
      const v = String(x.lesen() || '');
      if(x.feld.kind === 'segmented' && (v === 'n.i.O.' || (x.feld.mangelWert && v === x.feld.mangelWert))) neu(x, beschreibung(x) + ': ' + v);
      if(x.eingabe && x.eingabe.classList.contains('out-of-norm')) neu(x, beschreibung(x) + ': ' + v + ' außerhalb Grenzwert');
    });
    const kopf = id => kopfHandles.find(y=>y.id === id) || null;
    const w = id => { const x = kopf(id); return x ? String(x.lesen() || '') : ''; };
    if(/^Nein/.test(w('FIN-04'))) neu(kopf('FIN-04'), 'FIN-04: sicherer Gebrauch nicht gewährleistet');
    if(w('FIN-02') === 'Mängel festgestellt (siehe Bemerkung)') neu(kopf('FIN-02'), 'FIN-02: Mängel festgestellt');
    const gruende = mangel.map(m=>m.text);
    const fehlend = pflichtFehlend();
    const bemerkung = w('FIN-09').trim() !== '' || /behoben/.test(w('FIN-02'));
    let wert, text, art;
    if(gruende.length){ wert = AMPEL.rot; art = 'fehler'; text = '✗ Mangel – ' + gruende.slice(0, 6).join(' · ') + (gruende.length > 6 ? ' · und ' + (gruende.length - 6) + ' weitere' : ''); }
    else if(fehlend.length){ wert = ''; art = 'hinweis'; text = 'Noch offen: ' + fehlend.length + ' Pflichtfeld' + (fehlend.length === 1 ? '' : 'er') + ' – die Ampel wird erst gesetzt, wenn alles geprüft ist.'; }
    else if(bemerkung){ wert = AMPEL.gelb; art = 'hinweis'; text = 'Keine Mängel, aber Bemerkung vorhanden.'; }
    else { wert = AMPEL.gruen; art = 'ok'; text = '✓ Alle Pflichtfelder ausgefüllt, keine Mängel.'; }
    if(h){
      if(h.lesen() !== wert) h.setzen(wert);
      let st = h.el.querySelector('.grenz-status');
      if(!st){ st = el('div', { class:'grenz-status', 'aria-live':'polite' }); h.el.querySelector('.fk-eingabe').append(st); }
      st.className = 'grenz-status grenz-status--' + art; st.textContent = text;
    }
    /* FIN-09 Bemerkung: rot bei Mangel, gelb bei Text ohne Mangel */
    const bem = kopfHandles.find(x=>x.id === 'FIN-09');
    if(bem && bem.eingabe){
      bem.eingabe.classList.toggle('bemerkung--mangel', !!gruende.length && w('FIN-09').trim() !== '');
      bem.eingabe.classList.toggle('bemerkung--hinweis', !gruende.length && w('FIN-09').trim() !== '');
    }
    mangelMarkieren(mangel);
    return { gruende, fehlend, mangel };
  }

  /* Widersprüche zur Ampel (Masterbibliothek: beiMangelNicht) – z. B. „Keine Mängel“ oder
     „Prüfplakette: Ja“, obwohl ein Mangel bewertet ist. Sperren die PDF-Erstellung (auch „Trotzdem“). */
  function widersprueche(gruende){
    const liste = [];
    if(!gruende.length) return liste;
    const kopfWert = id => { const x = kopfHandles.find(y=>y.id === id); return x ? String(x.lesen() || '') : ''; };
    alleHandles().forEach(h=>{
      const r = h.feld.beiMangelNicht;
      if(!r || ausgeblendet(h)) return;
      const v = String(h.lesen() || '');
      if(!r.werte.includes(v)) return;
      if(r.ausserWenn && kopfWert(r.ausserWenn.feld).toLowerCase().includes(String(r.ausserWenn.enthaelt).toLowerCase())) return;
      liste.push({ h, text: beschreibung(h) + ': „' + v + '“ passt nicht zu den festgestellten Mängeln' });
    });
    return liste;
  }
  function widersprucheMarkieren(liste){
    alleHandles().forEach(h=>{
      const w = liste.find(x=>x.h === h);
      h.el.classList.toggle('feld--widerspruch', !!w);
      let st = h.el.querySelector(':scope > .widerspruch-status');
      if(w && !st){ st = el('div', { class:'grenz-status grenz-status--fehler widerspruch-status', 'aria-live':'polite' }); h.el.querySelector('.fk-eingabe').after(st); }
      if(st) st.textContent = w ? '✗ Widerspruch: Es sind Mängel festgestellt (siehe Statusleiste) – bitte korrigieren.' : '';
      if(st && !w) st.remove();
    });
  }

  function fortschritt(fehlend){
    const pflicht = alleHandles().filter(pflichtWirksam).length;
    const fertig = pflicht - fehlend.length;
    $('p-fortschritt').textContent = 'Pflichtfelder ' + fertig + ' / ' + pflicht + (wdh ? ' · ' + reihenfolge.length + ' ' + (reihenfolge.length === 1 ? wdh.wiederholen.einzahl : (wdh.wiederholen.mehrzahl || wdh.wiederholen.einzahl)) : '');
    $('p-fortschritt').className = 'status-chip' + (fehlend.length ? '' : ' status-chip--ok');
  }

  /* Felder, die als Mangel zählen: roter Rand + Hinweis (wichtig bei einfarbigen Feldern wie ERD-01) */
  function mangelMarkieren(mangel){
    alleHandles().forEach(h=>{
      const m = mangel.find(x=>x.h === h);
      h.el.classList.toggle('feld--mangel', !!m);
      let st = h.el.querySelector(':scope > .mangel-status');
      const zeigen = m && h.feld.kind === 'segmented' && h.feld.einfarbig;   /* sonst zeigt das Feld den Mangel schon selbst */
      if(zeigen && !st){ st = el('div', { class:'grenz-status grenz-status--fehler mangel-status' }); h.el.append(st); }
      if(st) st.textContent = zeigen ? '✗ „' + h.lesen() + '“ zählt als Mangel.' : '';
      if(st && !zeigen) st.remove();
    });
  }

  /* Mängel-Chip in der Statusleiste: 1 Mangel → direkt hinspringen, mehrere → Liste zum Antippen */
  let maengelAktuell = [];
  function maengelAnzeigen(mangel){
    maengelAktuell = mangel;
    const c = $('p-maengel'); if(!c) return;
    c.hidden = !mangel.length;
    c.textContent = '✗ ' + mangel.length + (mangel.length === 1 ? ' Mangel' : ' Mängel') + ' ›';
    c.title = mangel.map(m=>m.text).join('\n') + '\n\nAntippen, um hinzuspringen.';
    const liste = $('p-maengel-liste');
    if(liste && !liste.hidden) (mangel.length ? maengelListeFuellen(liste) : maengelListeSchliessen());
  }
  function maengelListeFuellen(liste){
    liste.replaceChildren(
      el('p', { class:'pflicht-liste-kopf', text: maengelAktuell.length + (maengelAktuell.length === 1 ? ' Mangel' : ' Mängel') + ' – antippen, um hinzuspringen:' }),
      el('ul', {}, ...maengelAktuell.map(m=>el('li', {}, el('button', { type:'button', class:'pflicht-sprung', text:m.text,
        onclick: ()=>{ maengelListeSchliessen(); if(m.h) springeZu(m.h); } })))));
  }
  function maengelListeSchliessen(){
    const liste = $('p-maengel-liste'); if(liste) liste.hidden = true;
    const c = $('p-maengel'); if(c) c.setAttribute('aria-expanded', 'false');
  }
  function maengelInit(){
    const c = $('p-maengel'); if(!c) return;
    c.setAttribute('aria-expanded', 'false');
    const liste = el('div', { id:'p-maengel-liste', class:'maengel-liste meldung meldung--fehler pflicht-liste', hidden:true });
    document.body.append(liste);                       /* fest unter der Statusleiste (die auf dem Handy seitlich scrollt) */
    c.addEventListener('click', ev=>{
      ev.stopPropagation();
      if(maengelAktuell.length === 1 && maengelAktuell[0].h){ maengelListeSchliessen(); springeZu(maengelAktuell[0].h); return; }
      if(!liste.hidden){ maengelListeSchliessen(); return; }
      maengelListeFuellen(liste);
      liste.style.top = Math.max(0, c.closest('.statusleiste').getBoundingClientRect().bottom + 4) + 'px';
      liste.hidden = false; c.setAttribute('aria-expanded', 'true');
    });
    document.addEventListener('click', ev=>{ if(!liste.hidden && !liste.contains(ev.target)) maengelListeSchliessen(); });
    document.addEventListener('keydown', ev=>{ if(ev.key === 'Escape') maengelListeSchliessen(); });
  }

  function aenderungNachlauf(){
    const alt = intern; intern = true;
    try{
      bedingteAbschnitte();
      alleHandles().filter(h=>h.eintrag.sichtbarWenn).forEach(h=>h.el.classList.toggle('ausgeblendet', !bedingungErfuellt(h.eintrag.sichtbarWenn, h.instanz)));
      reihenfolge.forEach(einklappenPruefen);
      bedingteBadges();
      if(wdh) reihenfolgeAktualisieren();
      const r = ampel();
      fortschritt(r.fehlend);
      maengelAnzeigen(r.mangel);
      widersprucheMarkieren(widersprueche(r.gruende));
      if(!$('pflicht-ergebnis').hidden) pflichtListeZeigen(r.fehlend, true);
    } finally { intern = alt; }
  }

  function onAenderung(ev){
    if(intern) return;
    const fe = ev.target.closest && ev.target.closest('.feld');
    if(!fe) return;
    const karte = fe.closest('[data-instanz]');
    const inst = karte ? instanzen.get(karte.dataset.instanz) : null;
    intern = true;
    try{ regelnFuer(fe.dataset.feld, inst); } finally { intern = false; }
    aenderungNachlauf();
    speichernPlanen();
  }

  /* ---------------- Speichern ---------------- */
  function speicherStatus(text, art){
    const s = $('p-speicher'); s.textContent = text;
    s.className = 'status-chip' + (art ? ' status-chip--' + art : '');
  }
  function datenSammeln(){
    const d = {};
    kopfHandles.forEach(h=>{ d[h.id] = h.lesen(); });
    if(wdh) d[wdh.wiederholen.schluessel] = reihenfolge.map(inst=>{
      const werte = {}; inst.handles.forEach(h=>{ werte[h.id] = h.lesen(); });
      return { id: inst.uid, werte };
    });
    return d;
  }
  async function speichernJetzt(){
    clearTimeout(speicherTimer); speicherTimer = null;
    if(gesperrt || !entwurf) return;
    try{
      entwurf.daten = datenSammeln();
      await Speicher.entwurfSpeichern(entwurf);
      speicherStatus('✓ Gespeichert ' + new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', second:'2-digit' }), 'ok');
    }catch(e){ console.error('Speichern', e); speicherStatus('✗ Nicht gespeichert – ' + fehlerText(e), 'fehler'); }
  }
  function speichernPlanen(){
    if(ladend || gesperrt) return;
    speicherStatus('Änderung wird gespeichert …');
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(speichernJetzt, 600);
  }
  const speichernFallsOffen = ()=>{ if(speicherTimer) speichernJetzt(); };

  /* ---------------- Abgeschlossen: nur lesen ---------------- */
  function sperren(root){
    root.querySelectorAll('input, select, textarea').forEach(x=>{ x.disabled = true; });
    root.querySelectorAll('.quick-btn, .liste-toggle-btn, .signatur-loeschen, .foto-entfernen, .nur-bearbeiten').forEach(x=>{ x.disabled = true; });
  }

  /* ---------------- Pflichtfeld-Liste mit Sprungmarken ---------------- */
  function springeZu(h){
    if(h.instanz) zeigeInstanz(h.instanz, false);
    if(h.instanz && h.instanz.messungen && h.instanz.messungen.contains(h.el)) klappen(h.instanz, false);
    setTimeout(()=>{
      h.el.scrollIntoView({ behavior:'smooth', block:'center' });
      const f = h.el.querySelector('input:not([type=radio]):not([disabled]), select, textarea, input[type=radio], canvas');
      if(f) setTimeout(()=>f.focus({ preventScroll:true }), 400);
      h.el.classList.add('feld--markiert'); setTimeout(()=>h.el.classList.remove('feld--markiert'), 2500);
    }, h.instanz ? 350 : 0);
  }
  function pflichtListeZeigen(fehlend, nurAktualisieren){
    const box = $('pflicht-ergebnis');
    box.replaceChildren(); box.hidden = false;
    const wid = widersprueche(ampel().gruende);
    if(wid.length){
      box.className = 'meldung meldung--fehler pflicht-liste';
      box.append(el('p', { class:'pflicht-liste-kopf', text: (B.pdf ? 'PDF gesperrt: ' : '') + wid.length + ' Widerspr' + (wid.length === 1 ? 'uch' : 'üche') + ' zur Mängelbewertung – das Protokoll darf nicht „i.O.“ aussagen, wenn Mängel festgestellt sind. Antippen, um hinzuspringen:' }),
        el('ul', {}, ...wid.map(x=>el('li', {}, el('button', { type:'button', class:'pflicht-sprung', text:x.text, onclick: ()=>springeZu(x.h) })))));
      if(fehlend.length) box.append(el('p', { class:'pflicht-liste-kopf', text:'Außerdem fehlen ' + fehlend.length + ' Pflichtfeld' + (fehlend.length === 1 ? '' : 'er') + '.' }),
        el('ul', {}, ...fehlend.map(h=>el('li', {}, el('button', { type:'button', class:'pflicht-sprung', text: beschreibung(h), onclick: ()=>springeZu(h) })))));
      if(!nurAktualisieren) box.scrollIntoView({ behavior:'smooth', block:'nearest' });
      return;
    }
    if(!fehlend.length){
      box.className = 'meldung meldung--ok';
      box.append(el('span', { text: '✓ Alle Pflichtfelder sind ausgefüllt.' }));
      return;
    }
    box.className = 'meldung meldung--hinweis pflicht-liste';
    box.append(el('p', { class:'pflicht-liste-kopf', text: (B.pdf ? 'PDF nicht erstellt: ' : '') + fehlend.length + ' Pflichtfeld' + (fehlend.length === 1 ? ' fehlt' : 'er fehlen') + ' – antippen, um hinzuspringen:' }),
      el('ul', {}, ...fehlend.map(h=>el('li', {}, el('button', { type:'button', class:'pflicht-sprung', text: beschreibung(h), onclick: ()=>springeZu(h) })))),
      B.pdf ? el('div', { class:'aktionszeile aktionszeile--links' },
        el('button', { type:'button', class:'btn btn-danger', text:'Trotzdem erstellen (unvollständig)', onclick: ()=>trotzdemErstellen && trotzdemErstellen() })) : null);
    if(!nurAktualisieren) box.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  /* ---------------- Aufbau der Seite ---------------- */
  function seiteAufbauen(){
    document.title = B.titel + ' – ' + entwurf.nummer;
    $('p-titel').textContent = B.titel;
    $('p-untertitel').textContent = B.untertitel || '';
    $('p-nummer').textContent = entwurf.nummer;
    $('p-status').textContent = entwurf.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Entwurf';
    $('p-status').className = 'status-chip' + (entwurf.status === 'abgeschlossen' ? ' status-chip--ok' : '');

    const nav = $('abschnitt-nav');
    form = $('protokoll-form');
    B.abschnitte.forEach((ab, i)=>{
      const sec = el('section', { class:'karte abschnitt', id:'abschnitt-' + ab.id, 'aria-labelledby':'h-' + ab.id },
        el('h2', { id:'h-' + ab.id }, el('span', { text:(i + 1) + '. ' + ab.titel }), el('span', { class:'feld-id', text:ab.id })));
      if(ab.hinweis) sec.append(el('p', { class:'karte-hinweis', text:ab.hinweis }));
      nav.append(el('a', { href:'#abschnitt-' + ab.id, class:'chip', text:(i + 1) + '. ' + ab.titel }));
      form.append(sec);
      if(ab.wiederholen){
        wdh = ab;
        const w = ab.wiederholen;
        karussell = el('div', { class:'karussell', role:'region', 'aria-label':w.einzahl + '-Karten', tabindex:'0' });
        sec.append(
          el('div', { class:'sk-leiste' },
            el('button', { type:'button', class:'btn btn-secondary', id:'sk-zurueck', 'aria-label':'Vorheriger ' + w.einzahl, text:'◀', onclick:()=>{ const i2 = aktuelleIndex(); if(i2 > 0) zeigeInstanz(reihenfolge[i2 - 1]); } }),
            el('span', { class:'sk-position', id:'sk-position', 'aria-live':'polite' }),
            el('button', { type:'button', class:'btn btn-secondary', id:'sk-vor', 'aria-label':'Nächster ' + w.einzahl, text:'▶', onclick:()=>{ const i2 = aktuelleIndex(); if(i2 < reihenfolge.length - 1) zeigeInstanz(reihenfolge[i2 + 1]); } }),
            el('button', { type:'button', class:'btn btn-success nur-bearbeiten', text:'+ ' + w.einzahl + ' hinzufügen', onclick: instanzNeu })),
          karussell,
          el('div', { class:'sk-leiste sk-leiste--unten' },
            el('button', { type:'button', class:'btn btn-success nur-bearbeiten', text:'+ ' + w.einzahl + ' hinzufügen', onclick: instanzNeu })));
        let t = null;
        karussell.addEventListener('scroll', ()=>{ clearTimeout(t); t = setTimeout(positionAnzeigen, 60); });
        window.addEventListener('resize', positionAnzeigen);
      } else {
        inhaltRendern(ab, sec, null);
      }
    });
  }

  function werteLaden(){
    const d = entwurf.daten || {}, st = entwurf.stammdaten || {};
    kopfHandles.forEach(h=>{
      let v = wertAus(d, h.id); if(v === undefined) v = st[h.id];
      if(h.id === 'STAM-05') v = entwurf.nummer;
      if(h.id === 'STAM-08' && !v) v = new Date().toISOString().slice(0, 10);
      wertSetzen(h, v);
    });
    regelnInitial(null);
    if(wdh){
      const liste = Array.isArray(d[wdh.wiederholen.schluessel]) ? d[wdh.wiederholen.schluessel] : [];
      if(liste.length) liste.forEach(x=>instanzAnlegen(x.werte, /^[a-z0-9]{4,40}$/i.test(x.id || '') ? x.id : null));
      else instanzAnlegen({});
    }
  }

  function schalterInit(){
    initHilfenSchalter($('toggleInfokarten'));
    const cb = $('toggleFeldIds'), key = SPEICHER_KEYS.feldIdsSichtbar;
    const txt = cb.closest('label').querySelector('[data-schalter-text]');
    const anwenden = ()=>{ document.body.classList.toggle('feld-ids-sichtbar', cb.checked); txt.textContent = cb.checked ? 'Ein' : 'Aus'; };
    let s = null; try{ s = localStorage.getItem(key); }catch(e){}
    cb.checked = s === 'true';   /* Standard: aus – IDs nur zum Korrigieren einblenden */
    anwenden();
    cb.addEventListener('change', ()=>{ try{ localStorage.setItem(key, cb.checked); }catch(e){} anwenden(); });
  }

  function erstellenInit(){
    /* Protokoll ohne PDF-Plan: nur Pflichtfeld-Prüfung */
    if(!B.pdf){
      const hinweis = document.querySelector('#abschnitt-erstellen .karte-hinweis');
      if(hinweis) hinweis.textContent = 'Die PDF-Erstellung für dieses Protokoll folgt in einem späteren Schritt. Alle Eingaben werden automatisch gespeichert. „Pflichtfelder prüfen“ listet fehlende Angaben mit Sprungmarke.';
      $('btn-pdf-leer').remove();   /* .btn überschreibt [hidden] */
      const b = $('btn-pdf-ausgefuellt');
      b.textContent = 'Pflichtfelder prüfen';
      b.addEventListener('click', async ()=>{ await speichernJetzt(); pflichtListeZeigen(pflichtFehlend()); });
      return;
    }
    /* archivieren: nur beim ausgefüllten PDF – ersetzt den Archiv-Eintrag dieses Protokolls (speicher.js) */
    const archivieren = async (r, arg) => {
      if(!r || !(r.blob instanceof Blob)) return '';
      try{
        const a = await Speicher.archivSpeichern(entwurf, { blob:r.blob, dateiname:r.dateiname, seiten:r.seiten,
          maengel:arg.maengel, unvollstaendig:arg.unvollstaendig });
        return ' Im Archiv abgelegt (Ergebnis ' + a.ergebnis + ').';
      }catch(e){ console.error(e); return ' ACHTUNG: Ablage im Archiv fehlgeschlagen – ' + fehlerText(e); }
    };
    const aufrufen = (name, arg, archiv) => {
      const fn = name && window[name];
      if(typeof fn === 'function'){
        meldung('PDF wird erstellt …', 'hinweis');
        return Promise.resolve().then(()=>fn(arg))
          .then(async r=>{
            const zusatz = archiv ? await archivieren(r, arg) : '';
            if(r && r.meldung) meldung(r.meldung + zusatz, /ACHTUNG/.test(zusatz) ? 'fehler' : 'ok'); else $('meldung').hidden = true;
          })
          .catch(e=>{ console.error(e); meldung('PDF konnte nicht erstellt werden. ' + fehlerText(e), 'fehler'); });
      }
      meldung('PDF-Erzeugung folgt in einem späteren Schritt (Funktion „' + name + '“ noch nicht vorhanden).', 'hinweis');
    };
    /* Fehlende Pflichtfelder sperren die Erstellung – „Trotzdem erstellen" umgeht das nach Rückfrage */
    const ausgefuellt = unvollstaendig => {
      const r = ampel();
      aufrufen(B.pdf && B.pdf.ausgefuellt, { bauplan:B, protokoll:entwurf, unvollstaendig: !!unvollstaendig,
        fehlend:r.fehlend.map(beschreibung), maengel:r.gruende }, true);
    };
    trotzdemErstellen = async ()=>{
      if(widersprueche(ampel().gruende).length){ pflichtListeZeigen(pflichtFehlend()); return; }
      const n = pflichtFehlend().length;
      const ja = await bestaetigen({ titel:'Unvollständiges Protokoll erstellen?',
        text:[n + ' Pflichtfeld' + (n === 1 ? ' ist' : 'er sind') + ' nicht ausgefüllt.', 'Das PDF wird trotzdem erzeugt und als unvollständig gekennzeichnet. Du bist für die Vollständigkeit der Prüfung verantwortlich.'],
        ok:'Trotzdem erstellen', gefahr:true });
      if(ja){ await speichernJetzt(); ausgefuellt(true); }
    };
    $('btn-pdf-ausgefuellt').addEventListener('click', async ()=>{
      await speichernJetzt();
      const fehlend = pflichtFehlend();
      pflichtListeZeigen(fehlend);
      if(!fehlend.length && !widersprueche(ampel().gruende).length) ausgefuellt(false);
    });
    $('btn-pdf-leer').addEventListener('click', ()=>aufrufen(B.pdf && B.pdf.leer, { bauplan:B, protokoll:{ nummer:'', stammdaten:{}, daten:{} } }));
  }

  /* Kein oder ungültiger Entwurf: klare Rückmeldung statt leerem Formular */
  function ohneEntwurf(text){
    $('protokoll-inhalt').hidden = true;
    const box = $('kein-entwurf'); box.hidden = false;
    $('kein-entwurf-text').textContent = text;
    $('btn-neu-anlegen').addEventListener('click', async ()=>{
      try{ const r = await Speicher.protokollNeu(B.typ); if(r.ok) location.href = r.url; else meldung('Protokollseite ist in app-config.js nicht freigeschaltet.', 'fehler'); }
      catch(e){ meldung('Neues Protokoll konnte nicht angelegt werden. ' + fehlerText(e), 'fehler'); }
    });
  }

  async function start(bauplan){
    B = bauplan;
    schalterInit();
    maengelInit();
    const id = new URLSearchParams(location.search).get('entwurf');
    if(!id){ ohneEntwurf('Es ist kein Protokoll geöffnet. Starte ein neues Protokoll oder öffne ein vorhandenes über die Hauptseite.'); return; }
    let r;
    try{ r = await Speicher.entwurfLaden(id); }
    catch(e){ ohneEntwurf('Der Datenspeicher konnte nicht gelesen werden: ' + fehlerText(e)); return; }
    if(!r.gefunden){ ohneEntwurf(r.grund === 'ungueltige-id' ? 'Die Adresse enthält keine gültige Protokoll-Kennung.' : 'Dieses Protokoll wurde nicht gefunden – eventuell wurde es gelöscht oder stammt von einem anderen Gerät.'); return; }
    if(r.entwurf.typ !== B.typ){ ohneEntwurf('Dieses Protokoll gehört zu einem anderen Protokolltyp (' + r.entwurf.typ + ') und kann hier nicht geöffnet werden.'); return; }
    entwurf = r.entwurf;
    gesperrt = entwurf.status === 'abgeschlossen';

    seiteAufbauen();
    werteLaden();
    form.addEventListener('input', onAenderung);
    form.addEventListener('change', onAenderung);
    if(gesperrt){
      form.classList.add('gesperrt'); sperren(form);
      meldung('Dieses Protokoll ist abgeschlossen und kann nur gelesen werden.', 'hinweis');
      speicherStatus('Nur lesen');
    } else {
      speicherStatus(entwurf.geaendert ? 'Geladen – zuletzt gespeichert ' + new Date(entwurf.geaendert).toLocaleString('de-DE', { dateStyle:'short', timeStyle:'short' }) : 'Neu');
    }
    ladend = false;
    aenderungNachlauf();
    if(!gesperrt && entwurf.vorlageVon && !entwurf.vorlageGezeigt){   /* einmalig nach „Erneute Prüfung" im Archiv */
      const vt = (protokollTyp(B.typ) || {}).vorlage;
      meldung('Erneute Prüfung – Vorlage aus ' + entwurf.vorlageVon + ': ' + ((vt && vt.text) || 'Objektdaten') + ' übernommen. Messwerte, Prüfungen, Ergebnisse und Unterschriften bitte neu erfassen.', 'hinweis');
      entwurf.vorlageGezeigt = true;
    }
    if(!gesperrt) speichernJetzt();   /* Vorbelegung (Stammdaten, Datum, Nr.) sofort sichern */
    erstellenInit();
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') speichernFallsOffen(); });
    window.addEventListener('pagehide', speichernFallsOffen);
  }

  return { start: bauplan => start(bauplan).catch(e=>{ console.error(e); meldung('Die Protokollseite konnte nicht aufgebaut werden. ' + fehlerText(e), 'fehler'); }) };
})();
