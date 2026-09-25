/* =========================================================================
   Master-Feldbibliothek – Rendering & Interaktion.

   Nutzt die globalen Konstanten aus felder-daten.js (FIELDS, ZNS_GROUP,
   RCD_GROUP, INFO) und die Icon-Helfer aus icons.js
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
    case 'readonly': return `<input type="text" id="${idAttr}" class="readonly-field${f.norm?' normcheck':''}" placeholder="${ph}"${f.norm?` data-min="${f.norm.min??''}" data-max="${f.norm.max??''}"`:''} readonly>`;
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
    return `<label class="opt${isNa?' na-disabled':''}"><input type="radio" name="${f.name_group||f.id}" value="${o}" ${isNa?'disabled':''}><span>${o}</span></label>`;
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
  "Isolationswiderstand",KAT_ZNS,"RCD-Prüfung",
  "Leitung","Erdung","Generator","Erproben","Geräteprüfung","Abschluss"];

order.forEach(cat=>{
  FIELDS.filter(f=>f.cat===cat).forEach(f=>{ html += renderField(f); });
  if(cat===ZNS_GROUP.cat) html += renderGroup(ZNS_GROUP);
  if(cat===RCD_GROUP.cat) html += renderGroup(RCD_GROUP);
});
listEl.innerHTML = html;

document.getElementById('count-info').textContent =
  (FIELDS.length+2)+' Feld-Einträge mit Prüflogik (inkl. 2 zusammenhängender Ausnahme-Blöcke: ZNS-01 mit '+ZNS_GROUP.sub.length+', RCD-01 mit '+RCD_GROUP.sub.length+' Unterfeldern)';

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

/* ZNS-01d Netzimpedanz -> ZNS-01e I_K2 (manuell getippt oder per Quick-Value) */
const zlnEl = document.getElementById('zns01_d');
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

/* ---------------- I_K2 Berechnung Netzimpedanz (U/Z, Referenz 230V) ---------------- */
function calcIk2(){
  const z = parseFloat((document.getElementById('zns01_d').value||'').replace(',', '.'));
  const out = document.getElementById('zns01_e');
  if(!out) return;
  out.value = (!isNaN(z) && z>0) ? (230/z).toFixed(1)+' A' : '';
  out.dispatchEvent(new Event('input'));
}

/* ---------------- NETZ-05 (Vorsicherung) -> Mindest-I_K2 bei ZNS-01e ----------------
   Vorher gab es hier GAR KEINE Rot/Grün-Prüfung (gemeldete Lücke, behoben) – die
   frühere ZNS-01d "Vorsicherung (Bezug)" war nur eine tote Anzeige ("siehe NETZ-05"),
   ohne echte Funktion, und wurde auf Nutzerwunsch entfernt. Stattdessen liest diese
   Funktion NETZ-05 direkt aus und leitet daraus einen Mindest-Kurzschlussstrom ab.
   ACHTUNG Praxis-Näherung, kein exakter Normwert wie bei den LS-Schaltern (dort
   gibt DIN EN 60898-1 einen festen 5×/10×-Faktor vor): NH-Sicherungen und
   CEE-Absicherungen folgen einer Zeit/Strom-Kennlinie (DIN EN 60269) ohne EINEN
   festen Faktor - 5× Nennstrom ist ein üblicher, aber grober Praxis-Richtwert für
   die 5s-Abschaltung. Bei "NEA" (Notstromaggregat) gibt es keinen Sicherungswert,
   daher keine automatische Prüfung. Bitte fachlich gegenprüfen. */
function parseAmps(text){
  const m = (text||'').match(/(\d+(?:[.,]\d+)?)\s*A\b/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}
const NETZ_IK2_FAKTOR = 5;
function updateNetzIk2Min(){
  const vs = document.getElementById('netz05');
  const ziel = document.getElementById('zns01_e');
  if(!vs || !ziel) return;
  const amps = parseAmps(vs.value);
  const min = amps!==null ? amps*NETZ_IK2_FAKTOR : null;
  ziel.dataset.min = min!==null ? String(min) : '';
  ziel.placeholder = min!==null ? `min. ca. ${min} A` : 'automatisch berechnet';
  ziel.dispatchEvent(new Event('input'));
}
const netz05El = document.getElementById('netz05');
if(netz05El){ netz05El.addEventListener('input', updateNetzIk2Min); updateNetzIk2Min(); }

/* ---------------- I_K Berechnung Schleifenimpedanz (ZNS-01b -> ZNS-01c) ----------------
   Vorher gab es dafür KEINE automatische Berechnung – ZNS-01c (ehem. ZS-01e)
   war ein rein manuell auszufüllendes Feld, obwohl sich I_K direkt aus der
   gemessenen Schleifenimpedanz Z_S ergibt (I_K = U / Z_S, 230-V-Referenz,
   gleiche Formel wie bei I_K2). Das war die gemeldete "Berechnung
   funktioniert nicht" – jetzt behoben. Der berechnete Wert bleibt manuell
   überschreibbar (z. B. wenn das Prüfgerät I_K direkt anzeigt); danach
   greift beim manuellen Tippen einfach die normale .normcheck-Prüfung. */
function calcIkSchleife(){
  const z = parseFloat((document.getElementById('zns01_b').value||'').replace(',', '.'));
  const out = document.getElementById('zns01_c');
  if(!out) return;
  if(!isNaN(z) && z>0) out.value = (230/z).toFixed(1);
  out.dispatchEvent(new Event('input'));
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

/* ---------------- RCD-01f/g -> RCD-01h automatische Grenzwertanzeige (ehem. UL-01/02 -> UL-03) ----------------
   Schreibt den berechneten Grenzwert zusätzlich als data-max in RCD-01i
   (Umess) - vorher stand "Muss ≤ Wert aus RCD-01h sein" nur im Bedingung-
   Text, wurde aber nicht tatsächlich geprüft (Lücke, behoben). Vor Auswahl
   von RCD-01f/g bleibt RCD-01i ungeprüft (kein Grenzwert bekannt). */
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

/* ---------------- ZNS-01a Leitungsschutzschalter-Typ -> Mindest-I_K bei ZNS-01c ----------------
   Auslösefaktor nach DIN EN 60898-1: 5×In bei Charakteristik B, 10×In bei C.
   Aktualisiert sowohl den Platzhalter-Text als auch die tatsächliche Rot/Grün-
   Prüfung (data-min der .normcheck-Validierung). */
const LS_MIN_IK = {'B 10A':50,'B 16A':80,'B 32A':160,'C 16A':160,'C 32A':320,'C 63A':630};
function getMinIk(lsTyp){ return LS_MIN_IK[(lsTyp||'').trim()] || null; }
function updateZsMinPlatzhalter(){
  const lsInput = document.getElementById('zns01_a');
  const ikInput = document.getElementById('zns01_c');
  if(!lsInput || !ikInput) return;
  const min = getMinIk(lsInput.value);
  ikInput.placeholder = min ? `min. ${min} A` : 'min. siehe LS-Typ';
  ikInput.dataset.min = min!==null ? String(min) : '';
  ikInput.dispatchEvent(new Event('input'));
}
const zs01aEl = document.getElementById('zns01_a');
if(zs01aEl){ zs01aEl.addEventListener('input', updateZsMinPlatzhalter); updateZsMinPlatzhalter(); }

/* ---------------- RISO-01 Modus -> Mindestwert bei RISO-02 (1 MΩ allgemein, 0,5 MΩ bei SELV-PELV) ----------------
   Vorher stand das nur im Bedingung-Text, die Rot/Grün-Prüfung nutzte immer
   den festen Wert 1 MΩ (Lücke, behoben): ein gültiger SELV-PELV-Messwert von
   z. B. 0,6 MΩ wurde fälschlich rot markiert. */
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

/* ---------------- RCD-01c (I_Δn) -> Toleranzband bei RCD-01d (Auslösestrom) ----------------
   Muss zwischen 0,5x und 1,0x des Bemessungsfehlerstroms liegen (darf nicht zu
   frueh ausloesen, muss spaetestens bei I_Δn ausgeloest haben). RCD-01c ist ein
   Schnellauswahl+Freitext-Feld ("30 mA" etc.) - der Zahlenwert wird per Regex
   herausgelesen; bei nicht erkennbarem/leerem Wert bleibt RCD-01d ungeprueft. */
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

/* ---------------- GER-07 (Schutzklasse) -> Mindestwert bei GER-05c (R_ISO Geraetetester) ----------------
   SK I >= 1 MOhm, SK II >= 2 MOhm (hoehere Anforderung, keine PE-Rueckfallebene),
   SK III (SELV/PELV) wird nicht geprueft. */
const GER_RISO_MIN = {'I':1, 'II':2};
function updateGerRisoMin(){
  const sk = document.getElementById('ger_07');
  const wert = document.getElementById('ger05c');
  if(!sk || !wert) return;
  const min = GER_RISO_MIN[sk.value];
  wert.dataset.min = min!==undefined ? String(min) : '';
  wert.placeholder = min!==undefined ? ('min. ' + min + ' MΩ') : (sk.value==='III' ? 'SK III: keine Prüfung' : '');
  wert.dispatchEvent(new Event('input'));
}
const ger07El = document.getElementById('ger_07');
if(ger07El){ ger07El.addEventListener('change', updateGerRisoMin); updateGerRisoMin(); }

/* ---------------- GER-07 (Schutzklasse) + GER-10 (Messmethode) -> Grenzwert bei GER-09 (Ableitstrom) ----------------
   Praxiswerte angelehnt an DIN EN 50699/VDE 0701-0702 (siehe Bedingung-Text bei
   GER-09) - bitte bei Bedarf je Geraetetyp fachlich anpassen. SK III (SELV/PELV)
   wird nicht geprueft. */
const GER_ABLEIT_MAX = {
  'I':  {'Ersatzableitstrom':3.5, 'Differenzstrom':3.5, 'Direktmessung':0.5},
  'II': {'Ersatzableitstrom':0.5, 'Differenzstrom':0.5, 'Direktmessung':0.25}
};
function updateGerAbleitMax(){
  const sk = document.getElementById('ger_07');
  const methode = document.getElementById('ger10');
  const wert = document.getElementById('ger09');
  if(!sk || !methode || !wert) return;
  const tabelle = GER_ABLEIT_MAX[sk.value];
  const max = tabelle ? tabelle[methode.value] : undefined;
  wert.dataset.max = max!==undefined ? String(max) : '';
  wert.placeholder = max!==undefined ? ('max. ' + max + ' mA') : '';
  wert.dispatchEvent(new Event('input'));
}
if(ger07El) ger07El.addEventListener('change', updateGerAbleitMax);
if(ger10El) ger10El.addEventListener('change', updateGerAbleitMax);
updateGerAbleitMax();

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
