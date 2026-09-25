/* =========================================================================
   Gemeinsames Render-Modul für ALLE Seiten (Masterbibliothek, Hauptseite,
   spätere Protokollseiten). Einzige Datenquelle: js/felder-daten.js
   (FIELDS, *_GROUP, INFO). Hilfen: erklaerungen.js · Icons: icons.js.

   Öffentliche Funktionen
     renderFeld(id, ziel, optionen)   Feld per ID in `ziel` einfügen
         id: Einzelfeld („STAM-01") ODER Unterfeld eines Blocks („ZNS-01-b")
         optionen: { modus: 'formular' (Standard) | 'bibliothek',
                     wert: Startwert, onChange: (id, wert, feld) => …,
                     suffix: Instanz-Kennung für wiederholte Felder (Stromkreise),
                             macht alle Element-IDs/Radio-Namen eindeutig,
                     anpassen: {…} protokollspezifische Abweichung (z. B. knopf:null) }
         Rückgabe: { id, feld, el, eingabe, lesen(), setzen(wert) }
     feldFinden(id) / blockFinden(id) Definition eines Feldes bzw. Blocks (NMESS-01 …)
     feldLesen(feld) / feldSetzen(feld, wert)   Wert eines Feldes (per Feld-Objekt)
     feldElementId(feld)              technische Element-ID (elId oder abgeleitet)
     renderField(f) / renderGroup(g)  Karten der Masterbibliothek (Legende + ID)
     initFeldVerhalten(root)          Schnellwahl, Norm-Check, Listen, Pflichtfarben
     initHilfenSchalter(checkbox)     Schalter „Warum & Wie" (seitenübergreifend)
     escHtml(text)                    Nutzereingaben für innerHTML absichern

   Modus 'bibliothek': Kopf mit ID + Kategorie, Legende (Typ/Inhalt/Bedingung).
   Modus 'formular'  : nur Label, Eingabe, Hinweis (f.hinweis) und Hilfen.
   ========================================================================= */

/* Nutzereingaben (nicht: statische Daten aus felder-daten.js) für HTML absichern */
function escHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Schlüssel des Schalters „Warum & Wie" – zentral in app-config.js (SPEICHER_KEYS) */
function hilfenSchluessel(){
  return (typeof SPEICHER_KEYS !== 'undefined' && SPEICHER_KEYS.hilfenSichtbar) || 'vde_infokarten_sichtbar';
}
function listenSchluessel(feldId){
  return ((typeof SPEICHER_KEYS !== 'undefined' && SPEICHER_KEYS.listePraefix) || 'liste_') + feldId;
}

/* ---------------- Felder finden (Einzelfeld oder Block-Unterfeld) ---------------- */
function feldBloecke(){
  return [typeof NMESS_GROUP!=='undefined'?NMESS_GROUP:null, typeof ZNS_GROUP!=='undefined'?ZNS_GROUP:null,
          typeof RISO_GROUP!=='undefined'?RISO_GROUP:null, typeof RCD_GROUP!=='undefined'?RCD_GROUP:null].filter(Boolean);
}
function blockFinden(id){ return feldBloecke().find(g=>g.id===id) || null; }

/* Unterfeld als eigenständiges Feld: id „ZNS-01-b", name = Label, Einheit nur,
   wenn sie nicht schon im Label steht */
function unterfeldAlsFeld(g, s){
  const einheitImLabel = s.einheit && s.label.includes('('+s.einheit+')');
  return Object.assign({}, s, {
    id: g.id+'-'+s.suf, name: s.label, cat: g.cat, pflicht: s.pflicht || '—',
    elId: s.elId || (g.id.toLowerCase()+'_'+s.suf),
    einheit: einheitImLabel ? undefined : s.einheit, block: g.id
  });
}
function feldFinden(id){
  const f = FIELDS.find(x=>x.id===id);
  if(f) return f;
  for(const g of feldBloecke()){
    if(!String(id).startsWith(g.id+'-')) continue;
    const s = g.sub.find(x=>g.id+'-'+x.suf===id);
    if(s) return unterfeldAlsFeld(g, s);
  }
  return null;
}

/* Instanz eines Feldes (wiederholte Karten): eindeutige Element-IDs und Radio-Namen */
function feldInstanz(f, suffix){
  if(!suffix) return f;
  const s = '__'+suffix;
  const k = Object.assign({}, f, { elId: feldElementId(f)+s, _suffix: suffix });
  if(f.kind==='segmented') k.name_group = (f.name_group||f.id)+s;
  if(f.knopf) k.knopf = Object.assign({}, f.knopf, { id: f.knopf.id+s });
  return k;
}
/* DOM-Schlüssel eines Feldes (Wrapper-, Badge-, Hinweis-IDs) */
function feldDomKey(f){ return f.id + (f._suffix ? '--'+f._suffix : ''); }

/* ---------------- Rendering (Bausteine) ---------------- */

/* Warum/Wie-Hilfe unter dem Feld (volle Kartenbreite) */
function erklHtml(obj, anker){
  return obj.erkl ? renderErklaerung(obj.erkl, anker) : '';
}

function badgeClass(pflicht){
  if(pflicht==='Pflicht') return 'pflicht';
  if(pflicht==='Optional') return 'optional';
  if(pflicht==='Kritisch') return 'kritisch';
  if(pflicht==='Bedingt') return 'bedingt';
  return 'optional';
}

function feldElementId(f){
  return f.elId || f.id.toLowerCase().replace(/[^a-z0-9]/g,'_');
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
    /* Zahlenfeld: öffnet am Handy die Zahlentastatur (inputmode), Prüfung per zahlPruefen() */
    case 'number': return `<input type="text" ${ZAHL_TASTATUR} id="${idAttr}" placeholder="${ph}" class="zahlfeld${f.norm?' normcheck':''}"${f.negativ?' data-negativ="1"':''}${f.norm?` data-min="${f.norm.min??''}" data-max="${f.norm.max??''}"`:''}>`;
    case 'date': return `<input type="date" id="${idAttr}">`;
    case 'readonly': return `<input type="text" id="${idAttr}" class="readonly-field${f.norm?' normcheck':''}" placeholder="${ph}"${f.norm?` data-min="${f.norm.min??''}" data-max="${f.norm.max??''}"`:''} readonly>`;
    case 'textarea': return `<textarea id="${idAttr}" placeholder="Freitext"></textarea>`;
    case 'foto': return `<div class="readonly-field" style="height:56px;border:1px dashed var(--border);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:.76rem;">Foto-Feld (Kamera / Datei)</div>`;
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
  return `<div class="segmented${f.einfarbig?' segmented--einfarbig':''}">${f.options.map((o)=>{
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
    <input type="text" id="${idAttr}" placeholder="freier Wert"${f.tastatur==='zahl'?' '+ZAHL_TASTATUR:''}>`;
}

/* Unterschrift (kind 'canvas') im Formular: echte Zeichenfläche, Wert = PNG als Data-URL */
function signaturHtml(f, idAttr, lblId){
  return `<div class="signatur">
    <canvas id="${idAttr}" class="signatur-flaeche" width="600" height="180" role="img" aria-labelledby="${lblId}"></canvas>
    <button type="button" class="btn btn-secondary signatur-loeschen" data-ziel="${idAttr}">Unterschrift löschen</button>
  </div>`;
}

/* Fotos (kind 'foto') im Formular: Kamera oder Datei, Wert = Liste von JPEG-Data-URLs */
function fotoHtml(f, idAttr, lblId){
  return `<div class="foto-feld" id="${idAttr}" role="group" aria-labelledby="${lblId}">
    <div class="foto-liste"></div>
    <div class="foto-knoepfe">
      <label class="btn btn-secondary foto-knopf">📷 Foto aufnehmen<input type="file" accept="image/*" capture="environment" class="foto-input"></label>
      <label class="btn btn-secondary foto-knopf">🖼 Aus Dateien wählen<input type="file" accept="image/*" multiple class="foto-input"></label>
    </div>
  </div>`;
}

function renderInput(f, idAttr){
  if(f.kind==='select') return selectHtml(f, idAttr);
  if(f.kind==='segmented') return segmentedHtml(f);
  if(f.kind==='toggle2') return toggle2Html(f);
  if(f.kind==='quickmanual') return quickmanualHtml(f, idAttr);
  return simpleInputHtml(f, idAttr);
}

/* ---------------- Karten-Körper: links Eingabe, rechts Legende ----------------
   Legende (Typ/Inhalt/Bedingung) beschreibt das Feld, erscheint nicht im Protokoll. */
function fkBemerkungHtml(typ, inhalt, bedingung){
  return `<div class="fk-bemerkung">
    <div class="fk-bemerkung-kopf">Legende <span class="fk-bemerkung-hinweis">– nicht im Protokoll</span></div>
    <div><b>Typ:</b> ${typ}</div>
    <div><b>Inhalt/Optionen:</b> ${inhalt}</div>
    <div><b>Bedingung:</b> ${bedingung}</div>
  </div>`;
}

/* Zusatz-Knopf neben der Eingabe (f.knopf, z. B. STAM-05) */
function extraKnopfHtml(f){
  if(!f.knopf) return '';
  return `<button type="button" class="quick-btn extra-knopf" id="${f.knopf.id}">${f.knopf.label}</button>`;
}

/* Editierbare Liste (f.editableList) – Markup; Logik in initEditierbareListen() */
function editableListHtml(f, idAttr){
  if(!f.editableList) return '';
  return `<div class="liste-editor-wrap">
    <button type="button" class="quick-btn liste-toggle-btn" data-target="${idAttr}">Liste bearbeiten</button>
    <div class="liste-editor" id="${idAttr}_editor" hidden>
      <div class="liste-editor-items" id="${idAttr}_items"></div>
      <div class="liste-editor-add">
        <input type="text" id="${idAttr}_neu" placeholder="Neuer Eintrag" class="liste-editor-input" aria-label="Neuer Listeneintrag">
        <button type="button" class="quick-btn liste-add-btn" data-target="${idAttr}">+ Hinzufügen</button>
      </div>
    </div>
  </div>`;
}

/* ---------------- Karte der Masterbibliothek (Modus 'bibliothek') ---------------- */
function renderField(f){
  const idAttr = feldElementId(f);
  const einheit = f.einheit?` <span style="font-weight:400;color:var(--secondary);">[${f.einheit}]</span>`:'';
  const info = f.info ? INFO[f.info] : null;
  /* Icons links neben der Überschrift, immer sichtbar */
  const iconRow = info ? renderIconRow(info.icons, 'messungen') : '';
  /* f.markieren: gelb/grün wie Pflicht, technisch optional */
  const badgeCls = badgeClass(f.pflicht) + (f.markieren?' farbe-aktiv':'');
  return `<div class="feldkarte" id="${f.id}" data-cat="${f.cat}"${f.drehstromOnly?' data-drehstrom="1"':''} data-search="${(f.id+' '+f.name).toLowerCase()}">
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
    ${erklHtml(f, f.id)}
  </div>`;
}

function renderGroup(g){
  const subHtml = g.sub.map(s=>{
    const idAttr = s.elId || (g.id.toLowerCase()+'_'+s.suf);
    const subBadge = (s.pflicht||s.markieren)
      ? ` <span class="fk-badge ${badgeClass(s.pflicht)}${s.markieren?' farbe-aktiv':''}" id="badge-${g.id}-${s.suf}">${s.pflicht||'Optional'}</span>`
      : '';
    return `<div class="subgroup" id="${g.id}-${s.suf}"${s.drehstromOnly?' data-drehstrom="1"':''} data-search="${(g.id+'-'+s.suf+' '+s.label).toLowerCase()}">
      <span class="fk-id-mini">${g.id}-${s.suf}</span><strong>${s.label}</strong>${subBadge}
      <div class="fk-body">
        <div class="fk-eingabe">${renderInput(s, idAttr)}${extraKnopfHtml(s)}</div>
        ${fkBemerkungHtml(s.typ, s.inhalt, s.bedingung)}
      </div>
      ${erklHtml(s, g.id+'-'+s.suf)}
    </div>`;
  }).join('');
  const info = g.info ? INFO[g.info] : null;
  const iconRow = info ? renderIconRow(info.icons, 'messungen') : '';
  return `<div class="feldkarte" id="${g.id}" data-cat="${g.cat}" data-search="${(g.id+' '+g.name).toLowerCase()}">
    <div class="fk-kopf">
      ${iconRow}
      <span class="fk-id">${g.id}</span>
      <span class="fk-name">${g.name}</span>
      <span class="fk-badge bedingt">${g.badge||'Block'}</span>
      <span class="fk-cat">${g.cat}</span>
    </div>
    <div class="fk-meta"><div><b>Bedingung:</b> ${g.bedingung}</div></div>
    ${g.erkl?`<div class="gruppen-erkl">${erklHtml(g, g.id)}</div>`:''}
    ${subHtml}
  </div>`;
}

/* ---------------- Feld im Formular (Modus 'formular') ----------------
   Keine ID-Anzeige, keine Legende. Label technisch mit der Eingabe verknüpft. */
function renderFeldFormular(f){
  const idAttr = feldElementId(f);
  const dom = feldDomKey(f);
  const gruppe = (f.kind==='segmented' || f.kind==='toggle2' || f.kind==='canvas' || f.kind==='foto');
  const einheit = f.einheit?` <span class="feld-einheit">[${f.einheit}]</span>`:'';
  const info = f.info ? INFO[f.info] : null;
  const iconRow = info ? renderIconRow(info.icons, 'messungen') : '';
  const badgeCls = badgeClass(f.pflicht) + (f.markieren?' farbe-aktiv':'');
  const lblId = 'lbl-'+dom;
  const hinweis = f.hinweis ? `<p class="feld-hinweis" id="hinweis-${dom}">${f.hinweis}</p>` : '';
  /* Der Hinweis wird dem Feld per aria-describedby zugeordnet */
  let eingabe = f.kind==='canvas' ? signaturHtml(f, idAttr, lblId) : f.kind==='foto' ? fotoHtml(f, idAttr, lblId) : renderInput(f, idAttr);
  if(f.hinweis && !gruppe) eingabe = eingabe.replace(new RegExp(`(<(?:input|select|textarea) id="${idAttr}")`), `$1 aria-describedby="hinweis-${dom}"`);
  if(gruppe && f.kind!=='canvas' && f.kind!=='foto') eingabe = `<div role="group" aria-labelledby="${lblId}"${f.hinweis?` aria-describedby="hinweis-${dom}"`:''}>${eingabe}</div>`;
  if(f.kind==='quickmanual') eingabe = eingabe.replace(`id="${idAttr}_qr"`, `id="${idAttr}_qr" role="group" aria-label="Schnellauswahl ${escHtml(f.name)}"`);
  /* Nicht bezeichnete Nebeneingaben (Listeneditor) tragen ihr eigenes aria-label */
  const kopfLabel = gruppe
    ? `<span class="fk-name" id="${lblId}">${f.name}${einheit}</span>`
    : `<label class="fk-name" id="${lblId}" for="${idAttr}">${f.name}${einheit}</label>`;
  /* Kein Badge bei „—" (berechnete/automatische Felder) */
  const badge = (f.pflicht && f.pflicht!=='—') ? `<span class="fk-badge ${badgeCls}" id="badge-${dom}">${f.pflicht}</span>` : '';
  /* Feld-ID: nur sichtbar mit Body-Klasse `feld-ids-sichtbar` (Protokollseiten, zum Korrigieren) */
  return `<div class="feld" id="feld-${dom}" data-feld="${f.id}"${f._suffix?` data-suffix="${f._suffix}"`:''}${f.drehstromOnly?' data-drehstrom="1"':''}>
    <div class="fk-kopf">
      ${iconRow}
      ${kopfLabel}
      ${badge}
      <span class="feld-id">${f.id}</span>
    </div>
    <div class="fk-eingabe">${eingabe}${extraKnopfHtml(f)}${editableListHtml(f, idAttr)}</div>
    ${hinweis}
    ${erklHtml(f, f.id)}
  </div>`;
}

/* ---------------- Wert lesen / setzen (per Feld-Objekt, alle Eingabearten) ---------------- */
function feldLesen(f){
  const idAttr = feldElementId(f);
  if(f.kind==='segmented'){
    const r = document.querySelector(`input[name="${f.name_group||f.id}"]:checked`);
    return r ? r.value : '';
  }
  if(f.kind==='toggle2'){
    const b = document.querySelector(`#${f.elId}_row .quick-btn.active`);
    return b ? b.dataset.val : '';
  }
  const el = document.getElementById(idAttr);
  if(el && el.tagName==='CANVAS') return el.dataset.wert || '';
  if(el && el.classList.contains('foto-feld')) return (el._fotos || []).slice();
  return el ? el.value : '';
}

function feldSetzen(f, wert){
  const idAttr = feldElementId(f);
  const fotoEl = f.kind==='foto' ? document.getElementById(idAttr) : null;
  if(fotoEl){ fotosAnzeigen(fotoEl, Array.isArray(wert) ? wert : []); return; }
  const w = (wert==null) ? '' : String(wert);
  if(f.kind==='segmented'){
    document.querySelectorAll(`input[name="${f.name_group||f.id}"]`).forEach(r=>{
      r.checked = (r.value===w);
      if(r.checked) r.dispatchEvent(new Event('change',{bubbles:true}));
    });
    if(!w){ const seg = document.querySelector(`input[name="${f.name_group||f.id}"]`); if(seg) seg.closest('.segmented').dispatchEvent(new Event('change',{bubbles:true})); }
    return;
  }
  if(f.kind==='toggle2'){
    const row = document.getElementById(f.elId+'_row');
    if(row) row.querySelectorAll('.quick-btn').forEach(b=>b.classList.toggle('active', b.dataset.val===w));
    return;
  }
  const el = document.getElementById(idAttr);
  if(!el) return;
  if(el.tagName==='CANVAS'){ signaturZeichnen(el, w); return; }
  if(el.tagName==='SELECT'){
    const gueltig = [...el.options].some(o=>(o.value||o.text)===w && !o.disabled);
    el.value = gueltig ? w : '';
    if(!gueltig && el.selectedIndex<0) el.selectedIndex = 0;
  } else {
    el.value = w;
  }
  /* Schnellwahl-Markierung mit dem Wert abgleichen */
  const qr = document.getElementById(idAttr+'_qr');
  if(qr) markiereSchnellwahl(qr, w);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
}

function markiereSchnellwahl(row, wert){
  row.querySelectorAll('.quick-btn').forEach(b=>{
    b.classList.toggle('active', !!wert && b.dataset.val===wert);
    if(b.closest('.feld')) b.setAttribute('aria-pressed', String(b.classList.contains('active')));
  });
}

/* ---------------- Verhalten (je Wurzelelement, mehrfach aufrufbar) ---------------- */

/* Schnellwahl-Knöpfe: setzen den Wert im zugehörigen Eingabefeld */
function initSchnellwahl(root){
  (root||document).querySelectorAll('.quick-row .quick-btn').forEach(btn=>{
    if(btn.dataset.qwInit) return;
    btn.dataset.qwInit = '1';
    if(btn.closest('.feld')) btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
    btn.addEventListener('click', ()=>{
      const row = btn.parentElement;
      [...row.children].forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(row.closest('.feld')) [...row.children].forEach(b=>b.setAttribute('aria-pressed', String(b===btn)));
      if(row.id.endsWith('_qr')){
        const inp = document.getElementById(row.id.replace('_qr',''));
        if(inp){ inp.value = btn.dataset.val; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); }
      }
      /* Umschalter (toggle2) ohne Eingabefeld: Änderung melden (Protokoll-Logik, Autosave) */
      else row.dispatchEvent(new Event('change',{bubbles:true}));
    });
  });
}

/* ---------------- Zahleneingabe prüfen (EINE Stelle für Formular, Logik und PDF) ----------------
   Erlaubt: 12 · 0,45 · 0.45 · >999 · <0,01 · Einheit dahinter (22 mA).
   Nicht erlaubt: Text, negative Werte (außer Feld mit negativ:true), mehrere Trennzeichen,
   Tausenderpunkt (1.000 → mehrdeutig). Rückgabe { leer, gueltig, wert, fehler }. */
const ZAHL_TASTATUR = 'inputmode="decimal" autocomplete="off" enterkeyhint="next"';
const ZAHL_EINHEIT = /\s*(?:mA|ms|MΩ|kΩ|Ω|kVA|kW|kV|Hz|mm²|V|A|W|m|s)$/i;
const ZAHL_FEHLER = {
  text:      'Keine gültige Zahl – nur Ziffern und ein Komma (z. B. 0,45).',
  negativ:   'Messwert darf nicht negativ sein.',
  format:    'Mehrere Trennzeichen – bitte nur ein Komma verwenden (z. B. 1000 oder 0,45).',
  tausender: 'Punkt als Tausendertrennzeichen? Bitte ohne Punkt (1000) oder mit Komma (1,000) eingeben.'
};
function zahlPruefen(text, negativErlaubt){
  const roh = String(text == null ? '' : text).trim();
  if(!roh) return { leer:true, gueltig:true, wert:null };
  const t = roh.replace(ZAHL_EINHEIT, '').replace(/\s+/g, '');
  const m = /^([<>≤≥]?)(-?)(\d*)([.,]?)(\d*)$/.exec(t);
  const fehler = art => ({ leer:false, gueltig:false, wert:null, fehler:ZAHL_FEHLER[art] });
  if(!m){
    if(/^[<>≤≥]?-?[\d.,]+$/.test(t)) return fehler('format');
    return fehler('text');
  }
  const [, , minus, ganz, trenn, nach] = m;
  if(!ganz && !nach) return fehler('text');
  if(minus && !negativErlaubt) return fehler('negativ');
  if(trenn === '.' && nach.length === 3 && ganz && ganz !== '0' && !/^0+$/.test(ganz)) return fehler('tausender');
  const wert = parseFloat((minus || '') + (ganz || '0') + '.' + (nach || '0'));
  return { leer:false, gueltig:true, wert, praefix:m[1] || '' };
}

/* Zahlenfeld prüfen + Normabweichungs-Live-Check (Grenzwerte in data-min / data-max).
   Ungültige Eingabe: Klasse eingabe-ungueltig + Meldung, zählt NICHT als ausgefüllt. */
function pruefeNorm(inp){
  const r = zahlPruefen(inp.value, inp.dataset.negativ === '1');
  const pruefen = inp.classList.contains('zahlfeld') || inp.classList.contains('normcheck');
  const ungueltig = pruefen && !r.gueltig;
  inp.classList.toggle('eingabe-ungueltig', ungueltig);
  inp.setAttribute('aria-invalid', String(ungueltig));
  let meld = inp.parentElement ? inp.parentElement.querySelector(':scope > .zahl-fehler') : null;
  if(ungueltig && !meld && inp.parentElement){
    meld = document.createElement('div'); meld.className = 'zahl-fehler'; meld.setAttribute('role', 'alert');
    inp.insertAdjacentElement('afterend', meld);
  }
  if(meld) meld.textContent = ungueltig ? '✗ ' + r.fehler : '';
  const min = inp.dataset.min ? parseFloat(inp.dataset.min) : null;
  const max = inp.dataset.max ? parseFloat(inp.dataset.max) : null;
  let bad = false;
  if(r.gueltig && r.wert !== null){
    if(min !== null && !isNaN(min) && r.wert < min && r.praefix !== '>' && r.praefix !== '≥') bad = true;
    if(max !== null && !isNaN(max) && r.wert > max && r.praefix !== '<' && r.praefix !== '≤') bad = true;
  }
  inp.classList.toggle('out-of-norm', bad);
}
function initNormcheck(root){
  (root||document).querySelectorAll('.normcheck, .zahlfeld').forEach(inp=>{
    if(inp.dataset.ncInit) return;
    inp.dataset.ncInit = '1';
    inp.addEventListener('input', ()=>pruefeNorm(inp));
  });
}

/* Editierbare Listen (f.editableList, Speicher: localStorage 'liste_<ID>') */
function initEditierbareListen(root){
  const wurzel = root || document;
  FIELDS.filter(f=>f.editableList).forEach(f=>{
    const idAttr = feldElementId(f);
    const panel = wurzel.querySelector('#'+idAttr+'_editor');
    if(!panel || panel.dataset.liInit) return;
    panel.dataset.liInit = '1';
    const key = listenSchluessel(f.id);
    let items;
    try{ items = JSON.parse(localStorage.getItem(key)); }catch(e){ items = null; }
    if(!Array.isArray(items) || !items.length) items = (f.datalist||[]).slice();

    function speichern(){ try{ localStorage.setItem(key, JSON.stringify(items)); }catch(e){} }
    function renderDatalist(){
      const dl = document.getElementById(idAttr+'_dl');
      if(dl) dl.innerHTML = items.map(o=>`<option value="${escHtml(o)}">`).join('');
    }
    function renderItems(){
      const box = document.getElementById(idAttr+'_items');
      if(!box) return;
      box.innerHTML = items.map((o,i)=>`<span class="liste-chip">${escHtml(o)}<button type="button" class="liste-chip-entfernen" data-i="${i}" aria-label="${escHtml(o)} entfernen">×</button></span>`).join('')
        || '<span class="liste-editor-leer">Liste ist leer</span>';
    }
    renderDatalist(); renderItems();

    const toggleBtn = wurzel.querySelector(`.liste-toggle-btn[data-target="${idAttr}"]`);
    if(toggleBtn) toggleBtn.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; toggleBtn.setAttribute('aria-expanded', String(!panel.hidden)); });

    const addBtn = wurzel.querySelector(`.liste-add-btn[data-target="${idAttr}"]`);
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

/* Pflichtfeld-Farben (gelb leer / grün ausgefüllt).
   Bezug je Badge: erst .subgroup, dann .feldkarte, dann .feld (Formular).
   Im Formular zusätzlich Häkchen im Badge (Status nie nur über Farbe). */
function initPflichtfeldFarben(root){
  (root||document).querySelectorAll('.fk-badge.pflicht, .fk-badge.kritisch, .fk-badge.farbe-aktiv').forEach(badge=>{
    if(badge.dataset.pfInit) return;
    badge.dataset.pfInit = '1';
    const scope = badge.closest('.subgroup') || badge.closest('.feldkarte') || badge.closest('.feld');
    if(!scope) return;
    const imFormular = scope.classList.contains('feld');
    const el = scope.querySelector('input[type=text], input[type=date], input[type=tel], select, textarea');
    if(el){
      const mark = ()=>{
        const empty = el.tagName==='SELECT' ? !el.value : (el.value.trim()==='' || el.classList.contains('eingabe-ungueltig'));
        el.style.background = empty ? '#fffbeb' : '#f0fdf4';
        if(imFormular) badge.classList.toggle('fk-badge--erledigt', !empty);
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
        if(imFormular) badge.classList.toggle('fk-badge--erledigt', !!gewaehlt);
      };
      segmented.addEventListener('change', mark); mark();
    }
  });
}

/* ---------------- Unterschrift (Canvas) ----------------
   Zeichnen mit Maus, Stift oder Finger. Nach jedem Strich: dataset.wert = PNG-Data-URL
   und ein 'change'-Ereignis (für Autosave). In gesperrtem <fieldset> bzw. unter .gesperrt keine Eingabe. */
function signaturZeichnen(cv, dataUrl){
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  cv.dataset.wert = dataUrl || '';
  if(!dataUrl) return;
  const img = new Image();
  img.onload = ()=>{ ctx.drawImage(img, 0, 0, cv.width, cv.height); };
  img.src = dataUrl;
}
function initSignaturen(root){
  (root||document).querySelectorAll('canvas.signatur-flaeche').forEach(cv=>{
    if(cv.dataset.sigInit) return;
    cv.dataset.sigInit = '1';
    const ctx = cv.getContext('2d');
    let zeichnet = false, geaendert = false;
    const gesperrt = ()=>!!cv.closest('fieldset:disabled, .gesperrt');
    const punkt = e=>{ const r = cv.getBoundingClientRect(); return [(e.clientX-r.left)*cv.width/r.width, (e.clientY-r.top)*cv.height/r.height]; };
    cv.addEventListener('pointerdown', e=>{
      if(gesperrt()) return;
      zeichnet = true; geaendert = false; cv.setPointerCapture(e.pointerId);
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0f172a';
      const [x,y] = punkt(e); ctx.beginPath(); ctx.moveTo(x,y);
    });
    cv.addEventListener('pointermove', e=>{
      if(!zeichnet) return;
      const [x,y] = punkt(e); ctx.lineTo(x,y); ctx.stroke(); geaendert = true;
    });
    const ende = ()=>{
      if(!zeichnet) return;
      zeichnet = false;
      if(geaendert){ cv.dataset.wert = cv.toDataURL('image/png'); cv.dispatchEvent(new Event('change',{bubbles:true})); }
    };
    cv.addEventListener('pointerup', ende); cv.addEventListener('pointercancel', ende);
    const btn = cv.parentElement.querySelector('.signatur-loeschen');
    if(btn) btn.addEventListener('click', ()=>{ signaturZeichnen(cv, ''); cv.dispatchEvent(new Event('change',{bubbles:true})); });
  });
}

/* ---------------- Fotos (kind 'foto') ----------------
   Bild wird vor dem Speichern verkleinert (max. FOTO_MAX_PX, JPEG FOTO_QUALITAET).
   Nach jeder Änderung ein 'change'-Ereignis am .foto-feld (Autosave). */
const FOTO_MAX_PX = 1600, FOTO_QUALITAET = 0.72;
function fotoVerkleinern(datei){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(datei), img = new Image();
    img.onload = ()=>{
      const f = Math.min(1, FOTO_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth*f); cv.height = Math.round(img.naturalHeight*f);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', FOTO_QUALITAET));
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht gelesen werden.')); };
    img.src = url;
  });
}
function fotosAnzeigen(box, fotos){
  box._fotos = fotos.filter(x=>typeof x==='string' && x.startsWith('data:image/'));
  const liste = box.querySelector('.foto-liste');
  liste.replaceChildren();
  box._fotos.forEach((src, i)=>{
    const fig = document.createElement('figure'); fig.className = 'foto-vorschau';
    const img = document.createElement('img'); img.src = src; img.alt = 'Foto ' + (i+1);
    const del = document.createElement('button'); del.type = 'button'; del.className = 'foto-entfernen';
    del.textContent = '×'; del.setAttribute('aria-label', 'Foto ' + (i+1) + ' entfernen'); del.dataset.i = String(i);
    fig.append(img, del); liste.append(fig);
  });
  if(!box._fotos.length){ const p = document.createElement('p'); p.className = 'foto-leer'; p.textContent = 'Noch keine Fotos.'; liste.append(p); }
}
function initFotos(root){
  (root||document).querySelectorAll('.foto-feld').forEach(box=>{
    if(box.dataset.fotoInit) return;
    box.dataset.fotoInit = '1';
    fotosAnzeigen(box, box._fotos || []);
    const melden = ()=>box.dispatchEvent(new Event('change', { bubbles:true }));
    box.querySelectorAll('.foto-input').forEach(inp=>inp.addEventListener('change', async e=>{
      e.stopPropagation();
      const dateien = [...(inp.files || [])]; inp.value = '';
      for(const d of dateien){
        try{ box._fotos.push(await fotoVerkleinern(d)); }catch(err){ console.error(err); }
      }
      fotosAnzeigen(box, box._fotos); melden();
    }));
    box.querySelector('.foto-liste').addEventListener('click', e=>{
      const b = e.target.closest('.foto-entfernen'); if(!b || b.disabled) return;
      box._fotos.splice(parseInt(b.dataset.i, 10), 1);
      fotosAnzeigen(box, box._fotos); melden();
    });
  });
}

/* Alles auf einmal (für per renderFeld eingefügte Felder) */
function initFeldVerhalten(root){
  initFotos(root);
  initSignaturen(root);
  initSchnellwahl(root);
  initNormcheck(root);
  initEditierbareListen(root);
  initPflichtfeldFarben(root);
}

/* ---------------- Schalter „Warum & Wie": alle Hilfen ein-/ausblenden ----------------
   Zustand in localStorage (Schlüssel: SPEICHER_KEYS.hilfenSichtbar), Body-Klasse
   `infokarten-versteckt`. Gilt dadurch für alle Seiten gleichzeitig. */
function initHilfenSchalter(checkbox){
  const key = hilfenSchluessel();
  const textEl = checkbox.closest('label') ? checkbox.closest('label').querySelector('[data-schalter-text]') : null;
  function anwenden(){
    document.body.classList.toggle('infokarten-versteckt', !checkbox.checked);
    if(textEl) textEl.textContent = checkbox.checked ? 'Ein' : 'Aus';
  }
  let saved = null;
  try{ saved = localStorage.getItem(key); }catch(e){}
  checkbox.checked = saved===null ? true : saved==='true';
  anwenden();
  checkbox.addEventListener('change', ()=>{
    try{ localStorage.setItem(key, checkbox.checked); }catch(e){}
    anwenden();
  });
  /* zweites Fenster/Tab: Zustand mitziehen */
  window.addEventListener('storage', e=>{
    if(e.key===key){ checkbox.checked = e.newValue!=='false'; anwenden(); }
  });
}

/* ---------------- Hauptfunktion: Feld per ID rendern ---------------- */
function renderFeld(id, ziel, optionen){
  optionen = optionen || {};
  let f = feldFinden(id);
  if(!f) throw new Error(`renderFeld: Feld „${id}" existiert nicht in felder-daten.js`);
  if(optionen.anpassen) f = Object.assign({}, f, optionen.anpassen);
  f = feldInstanz(f, optionen.suffix);
  const modus = optionen.modus || 'formular';
  const tmp = document.createElement('div');
  tmp.innerHTML = (modus==='bibliothek') ? renderField(f) : renderFeldFormular(f);
  const el = tmp.firstElementChild;
  ziel.appendChild(el);
  initFeldVerhalten(el);
  if(typeof initErklaerungen==='function') initErklaerungen(el);
  if(optionen.wert!==undefined) feldSetzen(f, optionen.wert);
  if(typeof optionen.onChange==='function'){
    const melden = ()=>optionen.onChange(id, feldLesen(f), f);
    el.addEventListener('input', melden);
    el.addEventListener('change', melden);
  }
  return { id, feld:f, el, eingabe: el.querySelector('#'+CSS.escape(feldElementId(f))),
           lesen:()=>feldLesen(f), setzen:(w)=>feldSetzen(f, w) };
}
