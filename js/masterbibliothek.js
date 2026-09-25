/* =========================================================================
   Master-Feldbibliothek – Rendering & Interaktion.
   Daten: felder-daten.js (FIELDS, *_GROUP, INFO) · Hilfen: erklaerungen.js
   Icons: icons.js · Render-Bausteine (Karten, Eingaben, Schnellwahl, Norm-Check,
   Listen, Pflichtfarben, Schalter): feld-renderer.js (gemeinsam mit der Hauptseite).
   Für neue Felder reicht felder-daten.js.
   ========================================================================= */

/* ---------------- Aufbau der Seite ---------------- */
const listEl = document.getElementById('feldliste');
let html = '';
const order = ["Stammdaten","Netzsystem","Netzmessung","Besichtigung","Schutzleiterwiderstand",
  "Stromkreis","Isolationswiderstand",KAT_ZNS,"RCD-Prüfung",
  "Leitung","Erdung","Generator","Erproben","Geräteprüfung","Abschluss"];

/* Blockkarten stehen am Anfang ihrer Kategorie, danach die Einzelfelder */
const GROUPS = [NMESS_GROUP, ZNS_GROUP, RISO_GROUP, RCD_GROUP];
order.forEach(cat=>{
  GROUPS.filter(g=>g.cat===cat).forEach(g=>{ html += renderGroup(g); });
  FIELDS.filter(f=>f.cat===cat).forEach(f=>{ html += renderField(f); });
});
listEl.innerHTML = html;

document.getElementById('count-info').textContent =
  FIELDS.length+' Einzelfelder · '+GROUPS.length+' Blöcke ('+GROUPS.map(g=>g.id+': '+g.sub.length).join(', ')+' Unterfelder) · '+document.querySelectorAll('#feldliste .erkl').length+' Hilfen';

/* ---------------- Kategorie-Chips (Filter, keine Überschrift) ---------------- */
const chipbar = document.getElementById('chipbar');
chipbar.innerHTML = `<span class="chip active" data-cat="__all">Alle</span>` + order.map(c=>`<span class="chip" data-cat="${c}">${c}</span>`).join('');
let activeCat = '__all';
chipbar.addEventListener('click', e=>{
  if(!e.target.classList.contains('chip')) return;
  activeCat = e.target.dataset.cat;
  [...chipbar.children].forEach(c=>c.classList.toggle('active', c===e.target));
  applyFilter();
});
document.getElementById('suche').addEventListener('input', applyFilter);
function applyFilter(){
  const q = document.getElementById('suche').value.trim().toLowerCase();
  document.querySelectorAll('.feldkarte').forEach(card=>{
    const catOk = activeCat==='__all' || card.dataset.cat===activeCat;
    const searchOk = !q || card.dataset.search.includes(q) || [...card.querySelectorAll('[data-search]')].some(s=>s.dataset.search.includes(q));
    card.classList.toggle('hidden-by-filter', !(catOk && searchOk));
  });
}

/* ---------------- Quick-Buttons: setzen Wert in zugehöriges Eingabefeld (feld-renderer.js) ---------------- */
initSchnellwahl(document);

/* ZNS-01d Netzimpedanz -> ZNS-01e I_K2 */
const zlnEl = document.getElementById('zns01_d');
if(zlnEl) zlnEl.addEventListener('input', calcIk2);

/* ---------------- RCD-01a „ohne RCD" -> b–i ausblenden, ERP-05 optional ---------------- */
function updateOhneRcd(ohneRcd){
  ['b','c','d','e','f','g','h','i'].forEach(suf=>{
    const el = document.getElementById('RCD-01-'+suf);
    if(el) el.style.display = ohneRcd ? 'none' : '';
  });
  const erpBadge = document.getElementById('badge-ERP-05');
  if(erpBadge){
    if(ohneRcd){ erpBadge.textContent='Optional'; erpBadge.className='fk-badge optional'; }
    else { erpBadge.textContent='Bedingt'; erpBadge.className='fk-badge bedingt'; }
  }
}
const rcd01aInput = document.getElementById('rcd01_a');
if(rcd01aInput){
  rcd01aInput.addEventListener('input', ()=> updateOhneRcd(rcd01aInput.value.trim().toLowerCase()==='ohne rcd'));
}

/* ---------------- "Warum & Wie"-Hilfen: Aufklapp-Verhalten ---------------- */
initErklaerungen(document);

/* ---------------- Schalter „Warum & Wie": alle Hilfen ein-/ausblenden (feld-renderer.js, Zustand seitenübergreifend) ---------------- */
initHilfenSchalter(document.getElementById('toggleInfokarten'));

/* ---------------- Normabweichungs-Live-Check (pruefeNorm / initNormcheck in feld-renderer.js) ---------------- */
initNormcheck(document);

/* ---------------- Kurzschlussstrom-Bewertung (ZNS-01) ----------------
   Statuszeile unter I_K (c) und I_K2 (e): ✓ grün / ✗ rot mit Bezugswert /
   gelber Hinweis, wenn LS bzw. Vorsicherung fehlt. Die Impedanz (b bzw. d)
   bekommt das abgeleitete Maximum Z_max = 230 V / I_min. */
const U0_REF = GRENZWERTE.U0;
function zahl(v){ const n = parseFloat(String(v||'').replace(',', '.')); return isNaN(n) ? null : n; }
function fmtDe(n, st){ return n.toLocaleString('de-DE',{maximumFractionDigits:st===undefined?1:st}); }
function statusZeile(inputId){
  const inp = document.getElementById(inputId);
  if(!inp) return null;
  let st = document.getElementById(inputId+'_status');
  if(!st){ st = document.createElement('div'); st.id = inputId+'_status'; st.className='grenz-status'; st.setAttribute('aria-live','polite'); inp.insertAdjacentElement('afterend', st); }
  return st;
}
/* min: Mindest-Kurzschlussstrom (A) oder null · bezug: Klartext woher · fehlt: Hinweis ohne Bezugswert
   impedanzId: zugehöriges Z-Feld, das den abgeleiteten Maximalwert bekommt */
function bewerteKurzschluss(ikId, impedanzId, min, bezug, fehlt){
  const ik = document.getElementById(ikId), st = statusZeile(ikId), z = document.getElementById(impedanzId);
  if(!ik || !st) return;
  const zmax = min ? U0_REF/min : null;
  if(z){ z.dataset.max = zmax ? zmax.toFixed(3) : ''; if(!z.classList.contains('normcheck')) z.classList.add('normcheck'); pruefeNorm(z); }
  ik.dataset.min = min ? String(min) : '';
  pruefeNorm(ik);
  const v = zahl(ik.value);
  if(v===null){ st.className='grenz-status'; st.textContent = min ? `Mindestwert ${fmtDe(min,0)} A (${bezug}) – entspricht Z ≤ ${fmtDe(zmax,2)} Ω` : fehlt; if(!min) st.className='grenz-status grenz-status--hinweis'; return; }
  if(!min){ st.className='grenz-status grenz-status--hinweis'; st.textContent = fehlt; return; }
  if(v>=min){ st.className='grenz-status grenz-status--ok'; st.textContent = `✓ ${fmtDe(v)} A ≥ min. ${fmtDe(min,0)} A (${bezug})`; }
  else { st.className='grenz-status grenz-status--fehler'; st.textContent = `✗ ${fmtDe(v)} A < min. ${fmtDe(min,0)} A (${bezug}) – Kurzschlussstrom zu niedrig, Impedanz zu hoch (max. ${fmtDe(zmax,2)} Ω)`; }
}

/* ---------------- I_K2 Berechnung Netzimpedanz (U/Z, Referenz 230V) ---------------- */
function calcIk2(){
  const z = parseFloat((document.getElementById('zns01_d').value||'').replace(',', '.'));
  const out = document.getElementById('zns01_e');
  if(!out) return;
  out.value = (!isNaN(z) && z>0) ? (230/z).toFixed(1)+' A' : '';
  out.dispatchEvent(new Event('input'));
  updateNetzIk2Min();
}

/* ---------------- NETZ-05 (Vorsicherung) -> Mindest-I_K2 bei ZNS-01e ----------------
   Praxis-Näherung ≈ 5 × Nennstrom (NH/CEE nach Kennlinie DIN EN 60269, kein
   fester Normfaktor). NEA: keine automatische Bewertung. */
function parseAmps(text){
  const m = (text||'').match(/(\d+(?:[.,]\d+)?)\s*A\b/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}
const NETZ_IK2_FAKTOR = GRENZWERTE.NETZ_IK2_FAKTOR;
function updateNetzIk2Min(){
  const vs = document.getElementById('netz05');
  const ziel = document.getElementById('zns01_e');
  if(!vs || !ziel) return;
  const nea = /nea/i.test(vs.value||'');
  const amps = nea ? null : parseAmps(vs.value);
  const min = amps!==null ? amps*NETZ_IK2_FAKTOR : null;
  ziel.placeholder = min!==null ? `min. ca. ${min} A` : 'automatisch berechnet';
  bewerteKurzschluss('zns01_e', 'zns01_d', min,
    amps!==null ? `≈ ${NETZ_IK2_FAKTOR} × ${fmtDe(amps,0)} A Vorsicherung, NETZ-05` : '',
    nea ? 'NEA/Stromerzeuger: keine automatische Bewertung – fachlich beurteilen.'
        : 'Kein Mindestwert: bitte bei NETZ-05 die Vorsicherung wählen, dann wird I_K2 bewertet.');
}
const netz05El = document.getElementById('netz05');
if(netz05El){ netz05El.addEventListener('input', updateNetzIk2Min); updateNetzIk2Min(); }

/* ---------------- ZNS-01b Z_S -> ZNS-01c I_K = 230 V / Z_S (überschreibbar) ---------------- */
function calcIkSchleife(){
  const z = parseFloat((document.getElementById('zns01_b').value||'').replace(',', '.'));
  const out = document.getElementById('zns01_c');
  if(!out) return;
  if(!isNaN(z) && z>0) out.value = (230/z).toFixed(1);
  out.dispatchEvent(new Event('input'));
  updateZsMinPlatzhalter();
}
const zns01bEl = document.getElementById('zns01_b');
if(zns01bEl) zns01bEl.addEventListener('input', calcIkSchleife);

/* ---------------- STAM-23 automatische Berechnung aus STAM-08 + STAM-22 ---------------- */
function berechneNaechstenTermin(){
  const datumEl = document.getElementById('stam08');
  const intervallEl = document.getElementById('stam22');
  const zielEl = document.getElementById('stam23');
  if(!datumEl.value || !intervallEl.value){ zielEl.value=''; return; }
  const d = new Date(datumEl.value);
  const iv = intervallEl.value.toLowerCase();
  const zahl = parseInt(iv) || 1;
  if(iv.includes('monat')) d.setMonth(d.getMonth()+zahl);
  else if(iv.includes('jahr')) d.setFullYear(d.getFullYear()+zahl);
  else { zielEl.value='Intervall nicht erkannt – manuell eingetragener Wert'; return; }
  zielEl.value = d.toISOString().slice(0,10);
}
document.getElementById('stam08').addEventListener('change', berechneNaechstenTermin);
document.getElementById('stam22').addEventListener('input', berechneNaechstenTermin);

/* ---------------- NMESS-01a Drehstrom/1-phasig -> L2/L3-Messungen ein-/ausblenden ---------------- */
const netz08row = document.getElementById('netz08_row');
if(netz08row){
  netz08row.addEventListener('click', e=>{
    if(!e.target.classList.contains('quick-btn')) return;
    [...netz08row.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    const einPhasig = e.target.dataset.val==='1-phasig';
    /* alle Elemente mit data-drehstrom (Unterfelder NMESS-01c–g, Karte NMESS-09) */
    document.querySelectorAll('[data-drehstrom]').forEach(el=>{
      el.style.display = einPhasig ? 'none' : '';
    });
  });
}

/* ---------------- RCD-01f/g -> U_L in RCD-01h und Grenzwert für RCD-01i ---------------- */
function berechneUL(){
  const acdc = document.querySelector('input[name="ul01"]:checked');
  const bereich = document.querySelector('input[name="ul02"]:checked');
  const ul03 = document.getElementById('ul03');
  const umess = document.getElementById('rcd01_i');
  if(!acdc || !bereich){
    ul03.value='';
    if(umess){ umess.dataset.max=''; umess.dispatchEvent(new Event('input')); }
    return;
  }
  const art = acdc.closest('label').textContent.trim();
  const ber = bereich.closest('label').textContent.trim();
  let grenzwert;
  if(ber==='normal') grenzwert = art==='AC' ? 50 : 120;
  else grenzwert = art==='AC' ? 25 : 60;
  ul03.value = `≤ ${grenzwert} V`;
  if(umess){ umess.dataset.max = String(grenzwert); umess.dispatchEvent(new Event('input')); }
}
document.querySelectorAll('input[name="ul01"], input[name="ul02"]').forEach(r=>r.addEventListener('change', berechneUL));

/* ---------------- GER-10 Messmethode -> passendes Ableitstrom-Icon hervorheben ---------------- */
function updateAbleitIcon(){
  const sel = document.getElementById('ger10');
  if(!sel) return;
  const val = sel.value;
  document.querySelectorAll('.icon-badge[data-methode]').forEach(badge=>{
    badge.classList.toggle('icon-badge--aktiv', !!val && badge.dataset.methode===val);
    badge.classList.toggle('icon-badge--inaktiv', !!val && badge.dataset.methode!==val);
  });
  /* dieselbe Hervorhebung in der Wie-Ansicht von GER-09 */
  if(typeof markiereErklMethode==='function') markiereErklMethode(val);
}
const ger10El = document.getElementById('ger10');
if(ger10El){ ger10El.addEventListener('change', updateAbleitIcon); updateAbleitIcon(); }

/* ---------------- STAM-08 Prüfdatum: immer mit dem heutigen Datum vorbelegen ---------------- */
(function initStam08Heute(){
  const el = document.getElementById('stam08');
  if(el && !el.value){
    el.value = new Date().toISOString().slice(0,10);
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
  }
})();

/* ---------------- Editierbare Listen (f.editableList) – Logik in feld-renderer.js ---------------- */
initEditierbareListen(document);

/* ---------------- STAM-05 Protokollnummer ----------------
   ABK/TT/MM/JJJJ/Nr. · ABK aus STAM-13, Datum aus STAM-08 · Zähler je ABK + Datum,
   zählt nur hoch (nie doppelt vergeben). */
const PROTOKOLL_ABK = {
  'Neuanlage':'ANL','Bestand':'ANL','Änderung':'ANL','Wiederholung':'ANL',
  'Erstprüfung (Gerät)':'GP','Wiederholungsprüfung (Gerät)':'GP','Prüfung nach Reparatur (Gerät)':'GP'
};
function generiereProtokollNr(){
  const artSel = document.getElementById('stam13');
  const datumEl = document.getElementById('stam08');
  const zielEl = document.getElementById('stam05');
  if(!zielEl) return;
  const abk = (artSel && PROTOKOLL_ABK[artSel.value]) || 'PR';
  const datum = (datumEl && datumEl.value) ? new Date(datumEl.value) : new Date();
  const tt = String(datum.getDate()).padStart(2,'0');
  const mm = String(datum.getMonth()+1).padStart(2,'0');
  const jjjj = datum.getFullYear();
  const zaehlerKey = 'protokollnr_zaehler_'+abk+'_'+tt+mm+jjjj;
  let zaehler = parseInt(localStorage.getItem(zaehlerKey)||'0', 10) + 1;
  localStorage.setItem(zaehlerKey, String(zaehler));
  zielEl.value = `${abk}/${tt}/${mm}/${jjjj}/${String(zaehler).padStart(3,'0')}`;
  zielEl.dispatchEvent(new Event('input'));
}
const stam05Btn = document.getElementById('stam05_neu_btn');
if(stam05Btn) stam05Btn.addEventListener('click', generiereProtokollNr);

/* ---------------- ZNS-01a LS/Sicherung -> Mindest-I_K bei ZNS-01c – gleiche Regel wie die Protokolle (FeldLogik.minIkAusLS) ---------------- */
function getMinIk(lsTyp){ const r = FeldLogik.minIkAusLS(lsTyp); return r ? r.min : null; }
function updateZsMinPlatzhalter(){
  const lsInput = document.getElementById('zns01_a');
  const ikInput = document.getElementById('zns01_c');
  if(!lsInput || !ikInput) return;
  const min = getMinIk(lsInput.value);
  ikInput.placeholder = min ? `min. ${min} A` : 'min. siehe LS-Typ';
  bewerteKurzschluss('zns01_c', 'zns01_b', min,
    min ? FeldLogik.minIkAusLS(lsInput.value).bezug : '',
    lsInput.value.trim()
      ? `„${lsInput.value.trim()}“ nicht erkannt – Mindestwert fachlich bestimmen (z. B. „B 16A“, „gG 35A“).`
      : 'Kein Mindestwert: bitte bei ZNS-01a den Leitungsschutzschalter wählen, dann wird I_K bewertet.');
}
const zs01aEl = document.getElementById('zns01_a');
if(zs01aEl){ zs01aEl.addEventListener('input', updateZsMinPlatzhalter); updateZsMinPlatzhalter(); }
/* manuell eingetragener I_K wird ebenfalls bewertet */
const zns01cEl = document.getElementById('zns01_c');
if(zns01cEl) zns01cEl.addEventListener('input', e=>{ if(e.isTrusted) updateZsMinPlatzhalter(); });

/* ---------------- RISO-01a -> Mindestwert RISO-01b (1 MΩ, SELV-PELV 0,5 MΩ) ---------------- */
function updateRisoMin(){
  const modus = document.getElementById('riso01');
  const wert = document.getElementById('riso02');
  if(!modus || !wert) return;
  wert.dataset.min = modus.value==='SELV-PELV' ? '0.5' : '1';
  wert.dispatchEvent(new Event('input'));
}
const riso01El = document.getElementById('riso01');
if(riso01El){ riso01El.addEventListener('change', updateRisoMin); updateRisoMin(); }

/* ---------------- RCD-01c2 Prüfstrom-Multiplikator -> Grenzwert bei RCD-01e (Auslösezeit) ---------------- */
const RCD_MULT_MAX = GRENZWERTE.RCD_ZEIT_MAX;
function updateRcdAusloesezeitGrenzwert(){
  const sel = document.getElementById('rcd01_c2');
  const ziel = document.getElementById('rcd01_e');
  if(!sel || !ziel) return;
  const max = RCD_MULT_MAX[sel.value] || 40;
  ziel.placeholder = `max. ${max} ms`;
  ziel.dataset.max = String(max);
}
const rcd01c2El = document.getElementById('rcd01_c2');
if(rcd01c2El){ rcd01c2El.addEventListener('change', updateRcdAusloesezeitGrenzwert); updateRcdAusloesezeitGrenzwert(); }

/* ---------------- RCD-01c I_Δn -> Toleranzband RCD-01d (0,5–1,0 × I_Δn) ---------------- */
function parseMa(text){
  const m = (text||'').replace(',', '.').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}
function updateRcdAusloesestromBand(){
  const idn = document.getElementById('rcd01_c');
  const ziel = document.getElementById('rcd01_d');
  if(!idn || !ziel) return;
  const idnMa = parseMa(idn.value);
  if(idnMa===null){ ziel.dataset.min=''; ziel.dataset.max=''; ziel.placeholder=''; }
  else {
    ziel.dataset.min = String(idnMa*0.5);
    ziel.dataset.max = String(idnMa);
    ziel.placeholder = (idnMa*0.5).toFixed(1) + '–' + idnMa + ' mA';
  }
  ziel.dispatchEvent(new Event('input'));
}
const rcd01cEl = document.getElementById('rcd01_c');
if(rcd01cEl){ rcd01cEl.addEventListener('input', updateRcdAusloesestromBand); updateRcdAusloesestromBand(); }

/* ---------------- GER-07 Schutzklasse (+ GER-14 Heizelemente) -> Mindestwert GER-05c – Regel aus FeldLogik ---------------- */
const gerHeiz = ()=>{ const r = document.querySelector('input[name="ger14"]:checked'); return r ? r.value : ''; };
const gerKw = ()=>{ const e = document.getElementById('ger15'); return e ? e.value : ''; };
function updateGerRisoMin(){
  const sk = document.getElementById('ger_07');
  const wert = document.getElementById('ger05c');
  if(!sk || !wert) return;
  const min = FeldLogik.gerRisoMin(sk.value, gerHeiz());
  wert.dataset.min = min!==undefined ? String(min) : '';
  wert.placeholder = min!==undefined ? ('min. ' + fmtDe(min, 2) + ' MΩ') : '';
  wert.dispatchEvent(new Event('input'));
}
const ger07El = document.getElementById('ger_07');
if(ger07El){ ger07El.addEventListener('change', updateGerRisoMin); updateGerRisoMin(); }
document.querySelectorAll('input[name="ger14"]').forEach(r=>r.addEventListener('change', ()=>{ updateGerRisoMin(); updateGerAbleitMax(); }));

/* ---------------- GER-07 + GER-10 -> Grenzwert GER-09 (Praxiswerte DIN EN 50699, SK III keine Prüfung) ---------------- */
function updateGerAbleitMax(){
  const sk = document.getElementById('ger_07');
  const methode = document.getElementById('ger10');
  const wert = document.getElementById('ger09');
  if(!sk || !methode || !wert) return;
  const max = FeldLogik.gerAbleitMax(sk.value, methode.value, gerHeiz(), gerKw());
  wert.dataset.max = max!==undefined ? String(max) : '';
  wert.placeholder = max!==undefined ? ('max. ' + max + ' mA') : '';
  wert.dispatchEvent(new Event('input'));
}
if(ger07El) ger07El.addEventListener('change', updateGerAbleitMax);
if(ger10El) ger10El.addEventListener('change', updateGerAbleitMax);
const ger15El = document.getElementById('ger15');
if(ger15El) ger15El.addEventListener('input', updateGerAbleitMax);
updateGerAbleitMax();

/* ---------------- Pflichtfeld-Farben (gelb leer / grün ausgefüllt) – Logik in feld-renderer.js ---------------- */
initPflichtfeldFarben(document);
