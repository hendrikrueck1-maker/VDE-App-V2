/* =========================================================================
   Master-Feldbibliothek – Rendering & Interaktion.

   Nutzt die globalen Konstanten aus felder-daten.js (FIELDS, ZS_GROUP,
   ZN_GROUP, RCD_GROUP, INFO) und die Icon-Helfer aus icons.js
   (renderIconRow, renderIconBadge, handleIconError). Diese Datei bitte NUR
   anfassen, wenn sich am VERHALTEN der Seite etwas ändern soll – für neue
   Felder/Messungen/Icons reicht es, felder-daten.js zu bearbeiten.
   ========================================================================= */

function anleitungHtml(info){
  if(!info) return '';
  const typLegende = info.typenLegende
    ? `<p><b>RCD-Typ-Kennzeichen:</b></p>${renderIconRow(info.typenLegende, 'rcd-typen')}`
    : '';
  return `<details class="anleitung"><summary>So geht's mit dem ${info.geraet}</summary>
    <div class="karte-body">
      <p><b>Was:</b> ${info.was}</p>${info.warum?`<p><b>Warum:</b> ${info.warum}</p>`:''}
      <ol>${info.schritte.map(s=>`<li>${s}</li>`).join('')}</ol>
      ${typLegende}
      <p class="geraet-ref">Inoffizielle, selbst erstellte Kurzanleitung – keine geprüfte Übersetzung der offiziellen Fluke-Bedienungsanleitung.</p>
    </div></details>`;
}

/* ---------------- Rendering ---------------- */
function badgeClass(pflicht){
  if(pflicht==='Pflicht') return 'pflicht';
  if(pflicht==='Optional') return 'optional';
  if(pflicht==='Kritisch') return 'kritisch';
  if(pflicht==='Bedingt') return 'bedingt';
  return 'optional';
}

function simpleInputHtml(f, idAttr, phOverride){
  const ph = phOverride!==undefined ? phOverride : (f.ph||'');
  switch(f.kind){
    case 'text': {
      if(f.datalist){
        const dlid = idAttr+'_dl';
        const opts = f.datalist.map(o=>`<option value="${o}">`).join('');
        return `<input type="text" id="${idAttr}" list="${dlid}" placeholder="${ph}"><datalist id="${dlid}">${opts}</datalist>`;
      }
      return `<input type="text" id="${idAttr}" placeholder="${ph}">`;
    }
    case 'tel': return `<input type="tel" id="${idAttr}" placeholder="${ph}">`;
    case 'number': return `<input type="text" inputmode="decimal" id="${idAttr}" placeholder="${ph}"${f.norm?` class="normcheck" data-min="${f.norm.min??''}" data-max="${f.norm.max??''}"`:''}>`;
    case 'date': return `<input type="date" id="${idAttr}">`;
    case 'readonly': return `<input type="text" id="${idAttr}" class="readonly-field" placeholder="${ph}" readonly>`;
    case 'textarea': return `<textarea id="${idAttr}" placeholder="Freitext"></textarea>`;
    case 'canvas': return `<div class="readonly-field" style="height:56px;border:1px dashed var(--border);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:.76rem;">Signaturfeld (Canvas)</div>`;
    default: return '';
  }
}

function selectHtml(f, idAttr){
  const opts = f.options.map(o=>`<option${f.default===o?' selected':''}>${o}</option>`).join('');
  const placeholder = f.default ? '' : `<option value="" selected disabled>– bitte wählen –</option>`;
  return `<select id="${idAttr}" class="${f.default?'':'leer'}">${placeholder}${opts}</select>`;
}

function segmentedHtml(f){
  return `<div class="segmented">${f.options.map((o)=>{
    const isNa = f.naDisabled && o==='n.a.';
    return `<label class="opt${isNa?' na-disabled':''}"><input type="radio" name="${f.name_group||f.id}" ${isNa?'disabled':''}><span>${o}</span></label>`;
  }).join('')}</div>`;
}

function toggle2Html(f){
  return `<div class="quick-row" id="${f.elId}_row">${f.opts.map((o,i)=>`<button type="button" class="quick-btn${i===0?' active':''}" data-val="${o}">${o}</button>`).join('')}</div>`;
}

function quickmanualHtml(f, idAttr){
  return `<div class="quick-row" id="${idAttr}_qr">${f.quick.map(v=>`<button type="button" class="quick-btn" data-val="${v}">${v}</button>`).join('')}</div>
    <label class="sublabel">oder manuell eingeben</label>
    <input type="text" id="${idAttr}" placeholder="freier Wert">`;
}

function renderInput(f, idAttr){
  if(f.kind==='select') return selectHtml(f, idAttr);
  if(f.kind==='segmented') return segmentedHtml(f);
  if(f.kind==='toggle2') return toggle2Html(f);
  if(f.kind==='quickmanual') return quickmanualHtml(f, idAttr);
  return simpleInputHtml(f, idAttr);
}

/* ---------------- Feld-/Gruppen-Körper: links Eingabe, rechts Bemerkung ----------------
   Typ/Inhalt/Bedingung sind reine Bau-Dokumentation für die Feldbibliothek und
   werden bei KEINEM Feld ins spätere Protokoll übernommen - deshalb stehen sie
   rechts als "Bemerkung", optisch abgesetzt von der eigentlichen Eingabe links,
   aber weiterhin direkt am Feld (nicht in einer separaten Liste). */
function fkBemerkungHtml(typ, inhalt, bedingung){
  return `<div class="fk-bemerkung">
    <div class="fk-bemerkung-kopf">Bemerkung <span class="fk-bemerkung-hinweis">– nicht im Protokoll</span></div>
    <div><b>Typ:</b> ${typ}</div>
    <div><b>Inhalt/Optionen:</b> ${inhalt}</div>
    <div><b>Bedingung:</b> ${bedingung}</div>
  </div>`;
}

/* Zusatz-Knopf neben der Eingabe (z. B. STAM-05 "Neue Nr. vergeben") -
   rein optional, nur wenn f.knopf gesetzt ist. */
function extraKnopfHtml(f){
  if(!f.knopf) return '';
  return `<button type="button" class="quick-btn extra-knopf" id="${f.knopf.id}">${f.knopf.label}</button>`;
}

/* Editierbare Liste (aktuell nur STAM-02) - Button "Liste bearbeiten" +
   ausklappbares Panel mit Chips/Eingabe. Die eigentliche Logik/Speicherung
   sitzt in setupEditableListen() weiter unten, hier nur das Markup. */
function editableListHtml(f, idAttr){
  if(!f.editableList) return '';
  return `<div class="liste-editor-wrap">
    <button type="button" class="quick-btn liste-toggle-btn" data-target="${idAttr}">Liste bearbeiten</button>
    <div class="liste-editor" id="${idAttr}_editor" hidden>
      <div class="liste-editor-items" id="${idAttr}_items"></div>
      <div class="liste-editor-add">
        <input type="text" id="${idAttr}_neu" placeholder="Neuer Eintrag" class="liste-editor-input">
        <button type="button" class="quick-btn liste-add-btn" data-target="${idAttr}">+ Hinzufügen</button>
      </div>
    </div>
  </div>`;
}

function renderField(f){
  const idAttr = f.elId || f.id.toLowerCase().replace(/[^a-z0-9]/g,'_');
  const einheit = f.einheit?` <span style="font-weight:400;color:var(--secondary);">[${f.einheit}]</span>`:'';
  const info = f.info ? INFO[f.info] : null;
  /* Icon(s) stehen LINKS neben der Überschrift (in .fk-kopf), nicht mehr
     unterhalb der Eingabe - dadurch immer sichtbar, auch wenn "Anleitungen"
     global ausgeblendet sind (nur details.anleitung wird dann versteckt). */
  const iconRow = info ? renderIconRow(info.icons, 'messungen') : '';
  /* f.markieren: rein optische Pflichtfeld-Markierung (gelb/grün) für Felder,
     die technisch Optional bleiben (z. B. STAM-04, LTG-04/05/06, GER-06) -
     siehe initPflichtfeldFarben(). */
  const badgeCls = badgeClass(f.pflicht) + (f.markieren?' farbe-aktiv':'');
  return `<div class="feldkarte" id="${f.id}" data-cat="${f.cat}" data-search="${(f.id+' '+f.name).toLowerCase()}">
    <div class="fk-kopf">
      ${iconRow}
      <span class="fk-id">${f.id}</span>
      <span class="fk-name">${f.name}${einheit}</span>
      <span class="fk-badge ${badgeCls}" id="badge-${f.id}">${f.pflicht}</span>
      <span class="fk-cat">${f.cat}</span>
    </div>
    <div class="fk-body">
      <div class="fk-eingabe">${renderInput(f, idAttr)}${extraKnopfHtml(f)}${editableListHtml(f, idAttr)}</div>
      ${fkBemerkungHtml(f.typ, f.inhalt, f.bedingung)}
    </div>
    ${info?anleitungHtml(info):''}
  </div>`;
}

function renderGroup(g){
  const subHtml = g.sub.map(s=>{
    const idAttr = s.elId || (g.id.toLowerCase()+'_'+s.suf);
    const subBadge = (s.pflicht||s.markieren)
      ? ` <span class="fk-badge ${badgeClass(s.pflicht)}${s.markieren?' farbe-aktiv':''}" id="badge-${g.id}-${s.suf}">${s.pflicht||'Optional'}</span>`
      : '';
    return `<div class="subgroup" id="${g.id}-${s.suf}" data-search="${(g.id+'-'+s.suf+' '+s.label).toLowerCase()}">
      <span class="fk-id-mini">${g.id}-${s.suf}</span><strong>${s.label}</strong>${subBadge}
      <div class="fk-body">
        <div class="fk-eingabe">${renderInput(s, idAttr)}${extraKnopfHtml(s)}</div>
        ${fkBemerkungHtml(s.typ, s.inhalt, s.bedingung)}
      </div>
    </div>`;
  }).join('');
  const info = g.info ? INFO[g.info] : null;
  const iconRow = info ? renderIconRow(info.icons, 'messungen') : '';
  return `<div class="feldkarte" id="${g.id}" data-cat="${g.cat}" data-search="${(g.id+' '+g.name).toLowerCase()}">
    <div class="fk-kopf">
      ${iconRow}
      <span class="fk-id">${g.id}</span>
      <span class="fk-name">${g.name}</span>
      <span class="fk-badge bedingt">${g.badge||'Ausnahme: zusammenhängend'}</span>
      <span class="fk-cat">${g.cat}</span>
    </div>
    <div class="fk-meta"><div><b>Bedingung:</b> ${g.bedingung}</div></div>
    ${subHtml}
    ${info?anleitungHtml(info):''}
  </div>`;
}

/* ---------------- Aufbau der Seite ---------------- */
const listEl = document.getElementById('feldliste');
let html = '';
const order = ["Stammdaten","Netzsystem","Netzmessung","Besichtigung","Schutzleiterwiderstand",
  "Isolationswiderstand",GEMEINSAME_KAT_ZS_ZN,"RCD-Prüfung",
  "Leitung","Erdung","Generator","Erproben","Geräteprüfung","Abschluss"];

order.forEach(cat=>{
  FIELDS.filter(f=>f.cat===cat).forEach(f=>{ html += renderField(f); });
  if(cat===ZS_GROUP.cat) html += renderGroup(ZS_GROUP);
  if(cat===ZN_GROUP.cat) html += renderGroup(ZN_GROUP);
  if(cat===RCD_GROUP.cat) html += renderGroup(RCD_GROUP);
});
listEl.innerHTML = html;

document.getElementById('count-info').textContent =
  (FIELDS.length+3)+' Feld-Einträge mit Prüflogik (inkl. 3 zusammenhängender Ausnahme-Blöcke: ZS-01 mit '+ZS_GROUP.sub.length+', ZN-01 mit '+ZN_GROUP.sub.length+', RCD-01 mit '+RCD_GROUP.sub.length+' Unterfeldern)';

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

/* ---------------- Quick-Buttons: setzen Wert in zugehöriges Eingabefeld ---------------- */
document.querySelectorAll('.quick-row .quick-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const row = btn.parentElement;
    [...row.children].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(row.id.endsWith('_qr')){
      const inp = document.getElementById(row.id.replace('_qr',''));
      if(inp){ inp.value = btn.dataset.val; inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); }
    }
  });
});

/* ZN-01b Netzimpedanz -> ZN-01c I_K2 (manuell getippt oder per Quick-Value) */
const zlnEl = document.getElementById('zln');
if(zlnEl) zlnEl.addEventListener('input', calcIk2);

/* ---------------- RCD-01-a "ohne RCD" -> restliche RCD-Unterfelder ausblenden + ERP-05 Pflicht-Status ---------------- */
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

/* ---------------- Infokarten/Anleitungen-Toggle ---------------- */
const KEY='vde_infokarten_sichtbar';
const toggle = document.getElementById('toggleInfokarten');
function applyToggle(){ document.body.classList.toggle('infokarten-versteckt', !toggle.checked); }
const saved = localStorage.getItem(KEY);
toggle.checked = saved===null ? true : saved==='true';
applyToggle();
toggle.addEventListener('change', ()=>{ localStorage.setItem(KEY, toggle.checked); applyToggle(); });

/* ---------------- Normabweichungs-Live-Check ---------------- */
document.querySelectorAll('.normcheck').forEach(inp=>{
  inp.addEventListener('input', ()=>{
    const v = parseFloat(inp.value.replace(',', '.'));
    const min = inp.dataset.min!==''?parseFloat(inp.dataset.min):null;
    const max = inp.dataset.max!==''?parseFloat(inp.dataset.max):null;
    let bad=false;
    if(!isNaN(v)){ if(min!==null && !isNaN(min) && v<min) bad=true; if(max!==null && !isNaN(max) && v>max) bad=true; }
    inp.classList.toggle('out-of-norm', bad);
  });
});

/* ---------------- I_K2 Demo-Berechnung (U/Z, Referenz 230V) ---------------- */
function calcIk2(){
  const z = parseFloat((document.getElementById('zln').value||'').replace(',', '.'));
  const out = document.getElementById('ik2');
  out.value = (!isNaN(z) && z>0) ? (230/z).toFixed(1)+' A' : '';
}

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

/* ---------------- NETZ-08 Drehstrom/1-phasig -> NMESS L2/L3 ein-/ausblenden ---------------- */
const netz08row = document.getElementById('netz08_row');
if(netz08row){
  netz08row.addEventListener('click', e=>{
    if(!e.target.classList.contains('quick-btn')) return;
    [...netz08row.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    const einPhasig = e.target.dataset.val==='1-phasig';
    document.querySelectorAll('.feldkarte').forEach(card=>{
      const f = FIELDS.find(ff=>ff.id===card.id);
      if(f && f.drehstromOnly) card.style.display = einPhasig ? 'none' : '';
    });
  });
}

/* ---------------- RCD-01f/g -> RCD-01h automatische Grenzwertanzeige (ehem. UL-01/02 -> UL-03) ---------------- */
function berechneUL(){
  const acdc = document.querySelector('input[name="ul01"]:checked');
  const bereich = document.querySelector('input[name="ul02"]:checked');
  const ul03 = document.getElementById('ul03');
  if(!acdc || !bereich){ ul03.value=''; return; }
  const art = acdc.closest('label').textContent.trim();
  const ber = bereich.closest('label').textContent.trim();
  if(ber==='normal') ul03.value = art==='AC' ? '≤ 50 V' : '≤ 120 V';
  else ul03.value = art==='AC' ? '≤ 25 V' : '≤ 60 V';
}
document.querySelectorAll('input[name="ul01"], input[name="ul02"]').forEach(r=>r.addEventListener('change', berechneUL));

/* ---------------- GER-10 Messmethode -> passendes Ableitstrom-Icon hervorheben ----------------
   Die 3 Icons bei GER-09/GER-10 (I_EA, IΔ/I_L, I_B) tragen je ein data-methode-
   Attribut (siehe icon.wert in felder-daten.js). Sobald in GER-10 eine Methode
   gewählt wird, bekommt das passende Icon eine Hervorhebung, die anderen beiden
   werden abgeblendet - so ist auf einen Blick klar, welche Taste/Methode gemeint
   ist, ohne dass die Karte für jede Methode einzeln aufgebaut werden muss. */
function updateAbleitIcon(){
  const sel = document.getElementById('ger10');
  if(!sel) return;
  const val = sel.value;
  document.querySelectorAll('.icon-badge[data-methode]').forEach(badge=>{
    badge.classList.toggle('icon-badge--aktiv', !!val && badge.dataset.methode===val);
    badge.classList.toggle('icon-badge--inaktiv', !!val && badge.dataset.methode!==val);
  });
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

/* ---------------- STAM-02 "Liste bearbeiten" (Button + Chips, localStorage) ----------------
   Betrifft aktuell nur STAM-02 (Gebäude/Bereich), ist aber generisch für jedes
   Feld mit f.editableList:true gebaut - neue Felder brauchen nur das Flag. */
function setupEditableListen(){
  FIELDS.filter(f=>f.editableList).forEach(f=>{
    const idAttr = f.elId || f.id.toLowerCase().replace(/[^a-z0-9]/g,'_');
    const key = 'liste_'+f.id;
    let items;
    try{ items = JSON.parse(localStorage.getItem(key)); }catch(e){ items = null; }
    if(!Array.isArray(items) || !items.length) items = (f.datalist||[]).slice();

    function speichern(){ try{ localStorage.setItem(key, JSON.stringify(items)); }catch(e){} }
    function renderDatalist(){
      const dl = document.getElementById(idAttr+'_dl');
      if(dl) dl.innerHTML = items.map(o=>`<option value="${o}">`).join('');
    }
    function renderItems(){
      const box = document.getElementById(idAttr+'_items');
      if(!box) return;
      box.innerHTML = items.map((o,i)=>`<span class="liste-chip">${o}<button type="button" class="liste-chip-entfernen" data-i="${i}" aria-label="entfernen">×</button></span>`).join('')
        || '<span class="liste-editor-leer">Liste ist leer</span>';
    }
    renderDatalist(); renderItems();

    const toggleBtn = document.querySelector(`.liste-toggle-btn[data-target="${idAttr}"]`);
    const panel = document.getElementById(idAttr+'_editor');
    if(toggleBtn && panel) toggleBtn.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; });

    const addBtn = document.querySelector(`.liste-add-btn[data-target="${idAttr}"]`);
    const neuInput = document.getElementById(idAttr+'_neu');
    function hinzufuegen(){
      const val = (neuInput.value||'').trim();
      if(!val || items.includes(val)) return;
      items.push(val); speichern(); renderDatalist(); renderItems(); neuInput.value='';
    }
    if(addBtn) addBtn.addEventListener('click', hinzufuegen);
    if(neuInput) neuInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); hinzufuegen(); } });

    const itemsBox = document.getElementById(idAttr+'_items');
    if(itemsBox) itemsBox.addEventListener('click', e=>{
      if(!e.target.classList.contains('liste-chip-entfernen')) return;
      const i = parseInt(e.target.dataset.i, 10);
      items.splice(i,1); speichern(); renderDatalist(); renderItems();
    });
  });
}
setupEditableListen();

/* ---------------- STAM-05 automatische Protokollnummer ----------------
   Format: ABK/TT/MM/JJJJ/laufende Nummer (z.B. ANL/23/09/2026/001). ABK aus
   STAM-13 (Prüfart), Datum aus STAM-08. Zähler je ABK+Datum in localStorage,
   zählt nur hoch, wird nie doppelt vergeben (lieber eine Nummer überspringen
   als eine Nummer doppelt zu vergeben - so vom Nutzer gewünscht). */
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

/* ---------------- ZS-01a Leitungsschutzschalter-Typ -> Mindest-I_K-Platzhalter bei ZS-01e ----------------
   Auslösefaktor nach DIN EN 60898-1: 5×In bei Charakteristik B, 10×In bei C. */
const LS_MIN_IK = {'B 10A':50,'B 16A':80,'B 32A':160,'C 16A':160,'C 32A':320,'C 63A':630};
function getMinIk(lsTyp){ return LS_MIN_IK[(lsTyp||'').trim()] || null; }
function updateZsMinPlatzhalter(){
  const lsInput = document.getElementById('zs01_a');
  const ikInput = document.getElementById('zs01_e');
  if(!lsInput || !ikInput) return;
  const min = getMinIk(lsInput.value);
  ikInput.placeholder = min ? `min. ${min} A` : 'min. siehe LS-Typ';
}
const zs01aEl = document.getElementById('zs01_a');
if(zs01aEl){ zs01aEl.addEventListener('input', updateZsMinPlatzhalter); updateZsMinPlatzhalter(); }

/* ---------------- RCD-01c2 Prüfstrom-Multiplikator -> Grenzwert bei RCD-01e (Auslösezeit) ---------------- */
const RCD_MULT_MAX = {'1 × IΔn (max. 300 ms)':300,'2 × IΔn (max. 150 ms)':150,'5 × IΔn (max. 40 ms)':40};
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

/* ---------------- Pflichtfeld-Modul (gelb leer / grün ausgefüllt) ----------------
   Für Text/Number/Date/Select/Textarea UND segmentierte (Radio-)Felder.
   WICHTIG: Scope zuerst auf .subgroup, erst dann auf .feldkarte - sonst
   würden sich innerhalb einer Gruppenkarte (z. B. RCD-01 mit 10 Unterfeldern)
   alle Sub-Badges dasselbe erste Eingabefeld der Karte teilen (Bug in der
   Vorversion). .farbe-aktiv erfasst zusätzlich optisch markierte, aber
   technisch optionale Felder (STAM-04, LTG-04/05/06, GER-06, RCD-01h). */
function initPflichtfeldFarben(){
  document.querySelectorAll('.fk-badge.pflicht, .fk-badge.kritisch, .fk-badge.farbe-aktiv').forEach(badge=>{
    const scope = badge.closest('.subgroup') || badge.closest('.feldkarte');
    if(!scope) return;
    const el = scope.querySelector('input[type=text], input[type=date], input[type=tel], select, textarea');
    if(el){
      const mark = ()=>{
        const empty = el.tagName==='SELECT' ? !el.value : el.value.trim()==='';
        el.style.background = empty ? '#fffbeb' : '#f0fdf4';
      };
      el.addEventListener('input', mark); el.addEventListener('change', mark); mark();
      return;
    }
    const segmented = scope.querySelector('.segmented');
    if(segmented){
      const mark = ()=>{
        const gewaehlt = segmented.querySelector('input[type=radio]:checked');
        segmented.classList.toggle('segmented--leer', !gewaehlt);
        segmented.classList.toggle('segmented--ausgefuellt', !!gewaehlt);
      };
      segmented.addEventListener('change', mark); mark();
    }
  });
}
initPflichtfeldFarben();
