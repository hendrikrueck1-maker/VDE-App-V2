/* =========================================================================
   Icons je Messung. Datei mit passendem Namen in icons/messungen/ ablegen
   (Liste: _ICONS-BENOETIGT.md) – erscheint ohne Code-Änderung. Fehlt sie,
   wird ein Platzhalter angezeigt.
   ========================================================================= */

/* Reihenfolge, in der Dateiformate probiert werden, bis eines existiert. */
const ICON_EXTENSIONS = ['png', 'svg', 'jpg', 'jpeg', 'webp'];

/**
 * Ein Icon mit Kurzlabel.
 * - "foto" (Standard): rundes Bild aus icons/<ordner>/ (Drehschalter Fluke 1663)
 * - "glyph": per CSS gezeichnete Taste (Fluke 6500-2)
 * @param {object} icon   {typ?, datei?, label, haupt?, sub?, custom?, wert?}
 *   wert: zugehörige GER-10-Option (Hervorhebung der gewählten Methode)
 * @param {string} ordner Unterordner unter icons/ (Standard: messungen)
 */
function renderIconBadge(icon, ordner){
  ordner = ordner || 'messungen';
  if(icon.typ === 'glyph'){
    const inhalt = icon.custom
      ? icon.custom
      : `<span class="glyph-main">${icon.haupt}</span>${icon.sub?`<span class="glyph-sub">${icon.sub}</span>`:''}`;
    const methodeAttr = icon.wert ? ` data-methode="${icon.wert}"` : '';
    return `<span class="icon-badge icon-badge--glyph"${methodeAttr}>
      <span class="glyph-box">${inhalt}</span>
      <span class="icon-badge-label">${icon.label}</span>
    </span>`;
  }
  const ext0 = ICON_EXTENSIONS[0];
  /* ohne loading="lazy", damit auch der Platzhalter sicher erscheint */
  return `<span class="icon-badge">
    <img src="icons/${ordner}/${icon.datei}.${ext0}" alt="${icon.label}"
      data-datei="${icon.datei}" data-ordner="${ordner}" data-ext-index="0"
      onerror="handleIconError(this)">
    <span class="icon-badge-label">${icon.label}</span>
  </span>`;
}

/**
 * Rendert eine Reihe von Icons (oder nichts, wenn keine vorgesehen sind).
 * @param {Array<object>} icons  siehe renderIconBadge
 * @param {string} ordner
 */
function renderIconRow(icons, ordner){
  if(!icons || !icons.length) return '';
  return `<div class="icon-row">${icons.map(i=>renderIconBadge(i, ordner)).join('')}</div>`;
}

/**
 * Wird per onerror am <img> aufgerufen. Probiert der Reihe nach die übrigen
 * Dateiformate durch; wenn keins existiert, wird ein gestrichelter
 * Platzhalter-Kreis mit den ersten Buchstaben des Kurzlabels angezeigt.
 */
function handleIconError(img){
  const naechsterIndex = parseInt(img.dataset.extIndex, 10) + 1;
  if(naechsterIndex < ICON_EXTENSIONS.length){
    img.dataset.extIndex = String(naechsterIndex);
    img.src = `icons/${img.dataset.ordner}/${img.dataset.datei}.${ICON_EXTENSIONS[naechsterIndex]}`;
    return;
  }
  const badge = img.closest('.icon-badge');
  if(!badge) return;
  badge.classList.add('icon-badge--fehlt');
  const platzhalter = document.createElement('div');
  platzhalter.className = 'icon-badge-platzhalter';
  platzhalter.textContent = (img.alt || '?').replace(/[^A-Za-zÄÖÜäöüΔ0-9]/g,'').slice(0,3) || '?';
  img.replaceWith(platzhalter);
}
