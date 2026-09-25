/* =========================================================================
   Hilfen „Warum / Wie / Wo finde ich das?" – Darstellung und Verhalten.
   Texte: js/erklaerungen-daten.js · Aussehen: css/erklaerungen.css
   Verknüpfung: `erkl:'<schlüssel>'` am Feld oder Block in felder-daten.js.

     renderErklaerung(key, anker)  → HTML
     initErklaerungen(root)        → Knöpfe auf-/zuklappen
     markiereErklMethode(wert)     → GER-09: gewählte Methode hervorheben
   Alle Hilfen ausblenden: Klasse `infokarten-versteckt` am <body>.
   ========================================================================= */

/* Anschlussbuchsen des Fluke 1663 in Gerätefarbe (Handbuch: L rot, PE grün, N blau) */
const ERKL_BUCHSEN = {L:'l', N:'n', PE:'pe'};

/* RCD-Typ-Symbole (Dateien in icons/rcd-typen/, vom Nutzer geliefert) */
const ERKL_SYMBOLE = {
  ac:     {datei:'rcd_typ_ac',     alt:'Symbol Wechselstrom (Typ AC)'},
  a:      {datei:'rcd_typ_a',      alt:'Symbol Wechsel- und pulsierender Gleichstrom (Typ A)'},
  f:      {datei:'rcd_typ_f',      alt:'Symbol Mischfrequenz (Typ F)'},
  b:      {datei:'rcd_typ_b',      alt:'Symbol glatter Gleichstrom (Typ B)'},
  b_plus: {datei:'rcd_typ_b_plus', alt:'Symbol Hochfrequenz bis 20 kHz (Typ B+)'}
};

/* Kurzschreibweisen im Text → HTML */
function erklFormat(txt){
  if(!txt) return '';
  return String(txt)
    .replace(/\[\[Start\]\]/g, '<kbd class="erkl-taste erkl-taste--start">Start</kbd>')
    .replace(/\[\[Stopp\]\]/g, '<kbd class="erkl-taste erkl-taste--stopp">Stopp</kbd>')
    .replace(/\[\[(.+?)\]\]/g, '<kbd class="erkl-taste">$1</kbd>')
    .replace(/\{(L|N|PE)\}/g, (m,b)=>`<span class="erkl-buchse erkl-buchse--${ERKL_BUCHSEN[b]}">${b}</span>`);
}

function erklSymbole(sym){
  if(!sym || !sym.length) return '';
  return `<span class="erkl-symbole">${sym.map(s=>{
    const d = ERKL_SYMBOLE[s]; if(!d) return '';
    return `<img class="erkl-sym" src="icons/rcd-typen/${d.datei}.png" alt="${d.alt}" title="${d.alt}">`;
  }).join('')}</span>`;
}

function erklPunkte(punkte){
  if(!punkte || !punkte.length) return '';
  return `<ul class="erkl-liste">${punkte.map(p=>{
    const methode = p.methode ? ` data-methode="${p.methode}"` : '';
    const kopf = p.t ? `<b>${erklFormat(p.t)}</b>${(p.sym||p.text||p.sub)?' :':''} ${erklSymbole(p.sym)}` : erklSymbole(p.sym);
    const text = p.text ? `<span class="erkl-text">${erklFormat(p.text)}</span>` : '';
    const sub = p.sub ? `<ul class="erkl-sub">${p.sub.map(s=>`<li>${erklFormat(s)}</li>`).join('')}</ul>` : '';
    return `<li${methode}>${kopf}${text}${sub}</li>`;
  }).join('')}</ul>`;
}

function erklIcons(ref){
  /* `icons` = INFO-Schlüssel aus felder-daten.js (gleiches Icon wie im Kartenkopf) */
  if(!ref || typeof INFO==='undefined' || !INFO[ref] || typeof renderIconRow!=='function') return '';
  return renderIconRow(INFO[ref].icons, 'messungen');
}

/* Inhalt einer Ansicht: intro, punkte, optional abschnitte:[{titel, intro, punkte}], schluss */
function erklInhalt(d){
  return `${d.intro?`<p class="erkl-intro">${erklFormat(d.intro)}</p>`:''}
    ${erklPunkte(d.punkte)}
    ${(d.abschnitte||[]).map(a=>`<h4 class="erkl-abschnitt">${erklFormat(a.titel)}</h4>
      ${a.intro?`<p class="erkl-intro">${erklFormat(a.intro)}</p>`:''}${erklPunkte(a.punkte)}`).join('')}
    ${d.schluss?`<p class="erkl-intro erkl-schluss">${erklFormat(d.schluss)}</p>`:''}`;
}

/* Ansichten: warum · wie (mit Prüfgerät) · finden (feste Werte vom Aufdruck) */
const ERKL_ANSICHTEN = [
  {key:'warum',  label:'Warum wird geprüft?', icon:'?', titel:'warum wird geprüft?'},
  {key:'wie',    label:'Wie wird geprüft?',   icon:'✓', titel:'wie wird geprüft?'},
  {key:'finden', label:'Wo finde ich das?',   icon:'i', titel:'wo finde ich das?'},
  {key:'wann',   label:'Welche Norm wann?',   icon:'§', titel:'welche Norm wann?'}
];

let _erklZaehler = 0;
function renderErklaerung(key, anker){
  const e = (typeof ERKL!=='undefined') ? ERKL[key] : null;
  if(!e) return '';
  const uid = 'erkl-' + (anker || key).toString().toLowerCase().replace(/[^a-z0-9]/g,'-') + '-' + (++_erklZaehler);
  const vorhanden = ERKL_ANSICHTEN.filter(a=>e[a.key]);
  const knoepfe = vorhanden.map(a=>{
    const geraet = e[a.key].geraet ? `<span class="erkl-btn-geraet">${e[a.key].geraet}</span>` : '';
    return `<button type="button" class="erkl-btn erkl-btn--${a.key}" aria-expanded="false" aria-controls="${uid}-${a.key}"><span class="erkl-btn-icon" aria-hidden="true">${a.icon}</span>${a.label}${geraet}</button>`;
  }).join('');
  const panels = vorhanden.map(a=>{
    const d = e[a.key];
    const chip = d.geraet ? ` <span class="erkl-geraet-chip">${d.geraet}</span>` : '';
    const quelle = (a.key!=='warum') ? `<p class="erkl-quelle">Kurzfassung – maßgeblich sind Bedienungsanleitung, Herstellerangaben und Normen.</p>` : '';
    return `<div class="erkl-panel erkl-panel--${a.key}" id="${uid}-${a.key}" role="region" aria-label="${a.label}" hidden>
      <div class="erkl-wie-kopf">${erklIcons(d.icons)}<p class="erkl-titel">${erklFormat(e.titel)} – ${a.titel}${chip}</p></div>
      ${erklInhalt(d)}${quelle}
    </div>`;
  }).join('');
  return `<div class="erkl" data-erkl="${key}"><div class="erkl-knoepfe">${knoepfe}</div>${panels}</div>`;
}

/* Knöpfe wie Reiter: Klick öffnet, zweiter Klick schließt, max. eine Ansicht offen */
function initErklaerungen(root){
  (root || document).addEventListener('click', ev=>{
    const btn = ev.target.closest('.erkl-btn');
    if(!btn) return;
    const box = btn.closest('.erkl');
    const ziel = document.getElementById(btn.getAttribute('aria-controls'));
    const warOffen = btn.getAttribute('aria-expanded')==='true';
    box.querySelectorAll('.erkl-btn').forEach(b=>b.setAttribute('aria-expanded','false'));
    box.querySelectorAll('.erkl-panel').forEach(p=>p.hidden = true);
    if(!warOffen && ziel){ btn.setAttribute('aria-expanded','true'); ziel.hidden = false; }
  });
}

/* GER-09: gewählte Messmethode (GER-10) in der "Wie"-Ansicht hervorheben */
function markiereErklMethode(wert){
  document.querySelectorAll('.erkl-liste li[data-methode]').forEach(li=>{
    li.classList.toggle('erkl-aktiv', !!wert && li.dataset.methode===wert);
    li.classList.toggle('erkl-inaktiv', !!wert && li.dataset.methode!==wert);
  });
}
