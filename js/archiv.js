/* =========================================================================
   Archiv (archiv.html) – alle archivierten Protokolle mit PDF.
   Daten: Speicher.archivListe() (js/speicher.js). Einstellungen: ARCHIV und
   PROTOKOLL_TYPEN[].vorlage in js/app-config.js.

   Filter      Suche (Nr./Ort/Anlage) · Monat (Prüfdatum) · Protokolltyp · Ergebnis
   Je Eintrag  Ansehen (PdfAnsicht) · Teilen (Teilen-Menü → Versand-Vermerk)
               Erneute Prüfung (neuer Entwurf aus Vorlage) · Aus Archiv löschen
   Auswahl     mehrere Einträge → ZIP → Teilen oder Herunterladen → Versand-Vermerk
   ========================================================================= */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  function el(tag, attrs, ...kinder){
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v])=>{
      if(v == null || v === false) return;
      if(k === 'class') e.className = v;
      else if(k === 'text') e.textContent = v;
      else if(k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    kinder.forEach(k=>{ if(k != null) e.append(k); });
    return e;
  }

  /* ---------------- Formatierung ---------------- */
  const datumDe = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : '–'; };
  const zeitDe = ts => new Date(ts).toLocaleString('de-DE', { dateStyle:'medium', timeStyle:'short' });
  const monatDe = mm => { const [j, m] = String(mm).split('-').map(Number); return j ? new Date(j, m - 1, 1).toLocaleDateString('de-DE', { month:'long', year:'numeric' }) : 'Ohne Datum'; };
  const groesseDe = b => b >= 1048576 ? (b / 1048576).toLocaleString('de-DE', { maximumFractionDigits:1 }) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const plural = (n, eins, mehr) => n + ' ' + (n === 1 ? eins : mehr);
  const typName = t => (protokollTyp(t) || { kurz:t }).kurz;
  const einheit = t => (protokollTyp(t) || { einheit:'Anzahl' }).einheit;
  /* Anzeige des Ergebnisses; „offen" = mit „Trotzdem erstellen" ohne Mangel erzeugt (Pflichtfelder fehlen) */
  const ERGEBNIS = {
    'i.O.':   { text:'✓ i.O.',   klasse:'io' },
    'n.i.O.': { text:'✗ n.i.O.', klasse:'nio' },
    'offen':  { text:'? offen – unvollständig', klasse:'offen', titel:'Pflichtfelder fehlten beim Erstellen – nicht als i.O. bewertet' }
  };
  const versandweg = s => ARCHIV.versandwege.find(w=>w.schluessel === s) || { text:s, icon:'➜' };

  /* ---------------- Meldung & Dialoge ---------------- */
  let meldungTimer = null;
  function meldung(text, art){
    const m = $('meldung');
    m.className = 'meldung' + (art ? ' meldung--' + art : '');
    m.textContent = ({ fehler:'Fehler: ', ok:'', hinweis:'Hinweis: ' }[art] || '') + text;
    m.hidden = false;
    clearTimeout(meldungTimer);
    if(art === 'hinweis') meldungTimer = setTimeout(()=>{ m.hidden = true; }, 12000);
    m.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  const fehlerText = e => (e && e.message) ? e.message : 'Unbekannter Fehler.';
  function fehler(kontext, e){ console.error(kontext, e); meldung(kontext + ' ' + fehlerText(e), 'fehler'); }

  function dialogWarten(d){
    return new Promise(resolve=>{
      d.returnValue = 'abbruch';
      d.addEventListener('close', ()=>resolve(d.returnValue), { once:true });
      d.showModal();
    });
  }
  async function bestaetigen({ titel, text, ok, gefahr }){
    $('dialog-titel').textContent = titel;
    $('dialog-text').replaceChildren(...[].concat(text).map(t=>el('p', { text:t })));
    $('dialog-ok').textContent = ok || 'OK';
    $('dialog-ok').className = 'btn' + (gefahr ? ' btn-danger' : '');
    const warten = dialogWarten($('dialog'));
    $('dialog-abbruch').focus();
    return (await warten) === 'ok';
  }

  /* ---------------- Zustand ---------------- */
  let alle = [];
  const auswahl = new Set();
  const F = { suche:$('f-suche'), monat:$('f-monat'), typ:$('f-typ'), ergebnis:$('f-ergebnis') };

  function gefiltert(){
    const q = F.suche.value.trim().toLowerCase();
    return alle.filter(e=>
      (!F.monat.value || e.monat === F.monat.value) &&
      (!F.typ.value || e.typ === F.typ.value) &&
      (!F.ergebnis.value || e.ergebnis === F.ergebnis.value) &&
      (!q || [e.nummer, e.pruefort, e.anlage].join(' ').toLowerCase().includes(q)));
  }

  /* Auswahllisten aus dem Bestand, gewählter Wert bleibt erhalten */
  function filterFuellen(){
    const fuellen = (sel, erste, eintraege) => {
      const alt = sel.value;
      sel.replaceChildren(el('option', { value:'', text:erste }), ...eintraege.map(([w, t])=>el('option', { value:w, text:t })));
      sel.value = eintraege.some(([w])=>w === alt) ? alt : '';
    };
    const zaehle = key => alle.reduce((m, e)=>m.set(e[key], (m.get(e[key]) || 0) + 1), new Map());
    const monate = zaehle('monat'), typen = zaehle('typ');
    fuellen(F.monat, 'Alle Monate', [...monate.keys()].sort().reverse().map(m=>[m, monatDe(m) + ' (' + monate.get(m) + ')']));
    fuellen(F.typ, 'Alle Protokolle', PROTOKOLL_TYPEN.filter(t=>typen.has(t.schluessel)).map(t=>[t.schluessel, t.kurz + ' (' + typen.get(t.schluessel) + ')']));
  }

  /* ---------------- Liste ---------------- */
  function karte(e){
    const nio = e.ergebnis === 'n.i.O.', erg = ERGEBNIS[e.ergebnis] || ERGEBNIS.offen;
    const wahl = el('input', { type:'checkbox', 'aria-label':'Protokoll ' + e.nummer + ' für ZIP auswählen' });
    wahl.checked = auswahl.has(e.id);
    wahl.addEventListener('change', ()=>{ wahl.checked ? auswahl.add(e.id) : auswahl.delete(e.id); k.classList.toggle('arch-karte--gewaehlt', wahl.checked); auswahlAnzeigen(); });

    const letzter = (e.versand || [])[e.versand ? e.versand.length - 1 : 0];
    const versand = letzter
      ? el('p', { class:'arch-versand', text: versandweg(letzter.weg).icon + ' Verschickt ' + versandweg(letzter.weg).text + (letzter.zip ? ' (in ZIP)' : '') + ' am ' + zeitDe(letzter.am) + (e.versand.length > 1 ? ' (' + e.versand.length + '× insgesamt)' : '') })
      : (e.vorherVersendet ? el('p', { class:'arch-versand arch-versand--alt', text:'Neue Fassung – ältere Fassung wurde am ' + zeitDe(e.vorherVersendet[e.vorherVersendet.length - 1].am) + ' verschickt.' }) : null);
    const knopf = (text, klasse, fn, label) => el('button', { type:'button', class:'btn ' + klasse, text, 'aria-label':label ? label + ' ' + e.nummer : null, onclick:fn });

    const k = el('article', { class:'arch-karte arch-karte--' + erg.klasse + (auswahl.has(e.id) ? ' arch-karte--gewaehlt' : '') },
      el('div', { class:'arch-kopf' },
        el('label', { class:'arch-wahl' }, wahl),
        el('span', { class:'eintrag-nummer arch-nummer', text:e.nummer }),
        el('span', { class:'arch-badge arch-badge--' + erg.klasse, text:erg.text,
          title: nio && e.maengel.length ? e.maengel.join('\n') : erg.titel }),
        e.unvollstaendig && e.ergebnis !== 'offen' ? el('span', { class:'arch-badge arch-badge--offen', text:'unvollständig' }) : null),
      el('dl', { class:'arch-daten' },
        el('div', {}, el('dt', { text:'Ort' }), el('dd', { text:e.pruefort || '–' })),
        el('div', {}, el('dt', { text:'Anlage' }), el('dd', { text:e.anlage || '–' })),
        el('div', { class:'arch-anzahl' }, el('dt', { text:einheit(e.typ) }), el('dd', { text:String(e.anzahl) }))),
      el('p', { class:'arch-meta', text:[typName(e.typ), 'Prüfdatum ' + datumDe(e.pruefdatum), plural(e.seiten, 'Seite', 'Seiten'), groesseDe(e.groesse),
        nio && e.maengel.length ? plural(e.maengel.length, 'Mangel', 'Mängel') : null].filter(Boolean).join(' · ') }),
      versand,
      el('div', { class:'eintrag-aktionen' },
        knopf('👁 Ansehen', 'btn-secondary', ()=>ansehen(e), 'PDF ansehen'),
        knopf('↗ Teilen', 'btn-success', ()=>teilenEinzeln(e), 'PDF teilen'),
        knopf('⟳ Erneute Prüfung', 'btn-secondary', ()=>erneutePruefung(e), 'Erneute Prüfung als Vorlage von'),
        knopf('Löschen', 'btn-danger', ()=>loeschen(e), 'Aus dem Archiv löschen:')));
    return k;
  }

  function render(){
    const liste = gefiltert(), ziel = $('archiv-liste');
    ziel.replaceChildren();
    $('treffer').textContent = alle.length ? plural(liste.length, 'Protokoll', 'Protokolle') + (liste.length !== alle.length ? ' von ' + alle.length : '') + ' angezeigt' : '';
    if(!alle.length){
      ziel.append(el('div', { class:'karte' }, el('p', { class:'leerzustand', text:'Noch nichts im Archiv. Ein Protokoll landet hier, sobald du auf der Protokollseite „Ausgefülltes Protokoll erstellen“ wählst.' })));
      return;
    }
    if(!liste.length){ ziel.append(el('div', { class:'karte' }, el('p', { class:'leerzustand', text:'Kein Protokoll passt zu den Filtern.' }))); return; }
    const gruppen = new Map();
    liste.forEach(e=>{ if(!gruppen.has(e.monat)) gruppen.set(e.monat, []); gruppen.get(e.monat).push(e); });
    gruppen.forEach((eintraege, monat)=>{
      const nio = eintraege.filter(e=>e.ergebnis === 'n.i.O.').length;
      ziel.append(el('section', { class:'arch-monat', 'aria-label':monatDe(monat) },
        el('h2', { class:'arch-monat-titel' }, el('span', { text:monatDe(monat) }),
          el('span', { class:'arch-monat-info', text:plural(eintraege.length, 'Protokoll', 'Protokolle') + (nio ? ' · ' + nio + ' n.i.O.' : '') })),
        el('div', { class:'arch-raster' }, ...eintraege.map(karte))));
    });
  }

  function auswahlAnzeigen(){
    [...auswahl].forEach(id=>{ if(!alle.some(e=>e.id === id)) auswahl.delete(id); });
    $('auswahlleiste').hidden = !auswahl.size;
    document.body.classList.toggle('mit-auswahl', auswahl.size > 0);
    const b = [...auswahl].reduce((s, id)=>s + ((alle.find(e=>e.id === id) || {}).groesse || 0), 0);
    $('auswahl-text').textContent = plural(auswahl.size, 'Protokoll', 'Protokolle') + ' ausgewählt (' + groesseDe(b) + ')';
  }

  async function laden(){
    try{ alle = await Speicher.archivListe(); }
    catch(e){ fehler('Archiv konnte nicht geladen werden.', e); alle = []; }
    filterFuellen(); render(); auswahlAnzeigen();
  }

  /* ---------------- Teilen & Versand-Vermerk ---------------- */
  function kannTeilen(datei){
    try{ return !!(navigator.canShare && navigator.share && navigator.canShare({ files:[datei] })); }catch(e){ return false; }
  }
  /* Öffnet das Teilen-Menü (muss direkt aus einem Klick kommen). Ohne Teilen-Funktion: Download.
     Rückgabe: 'geteilt' | 'geladen' | 'abgebrochen' */
  async function teilen(blob, name, titel, text){
    const datei = new File([blob], name, { type: blob.type || 'application/octet-stream' });
    if(kannTeilen(datei)){
      try{ await navigator.share({ files:[datei], title:titel, text }); return 'geteilt'; }
      catch(e){
        if(e && e.name === 'AbortError') return 'abgebrochen';
        console.warn('Teilen fehlgeschlagen, Download stattdessen', e);
      }
    }
    Speicher.dateiHerunterladen(blob, name);
    return 'geladen';
  }

  /* Fragt nach dem Weg und vermerkt ihn an allen Einträgen. bezug: Text für Meldung */
  async function versandFragen(ids, bezug, art, extra){
    $('versand-text').textContent = (art === 'geladen'
      ? 'Die Datei wurde heruntergeladen (Teilen wird hier nicht unterstützt). Hänge sie in Mail oder WhatsApp an. '
      : '') + 'Hast du ' + bezug + ' verschickt? Der Versand wird im Archiv vermerkt.';
    const knoepfe = ARCHIV.versandwege.map((w, i)=>el('button', { type:'submit', value:w.schluessel, class:'btn' + (i ? ' btn-secondary' : ' btn-success'), text:w.icon + ' Ja, ' + w.text }));
    $('versand-knoepfe').replaceChildren(...knoepfe, el('button', { type:'submit', value:'abbruch', class:'btn btn-secondary', text:'Nein, nicht verschickt' }));
    const warten = dialogWarten($('versand-dialog'));
    knoepfe[0].focus();
    const weg = await warten;
    if(!ARCHIV.versandwege.some(w=>w.schluessel === weg)){ meldung('Kein Versand vermerkt.', 'hinweis'); return; }
    try{
      const am = await Speicher.archivVersandVermerken(ids, weg, extra);
      await laden();
      meldung('✓ Versand bestätigt: ' + bezug + ' ' + versandweg(weg).text + ' verschickt am ' + zeitDe(am) + ' – im Archiv vermerkt.', 'ok');
    }catch(e){ fehler('Versand konnte nicht vermerkt werden.', e); }
  }

  async function teilenEinzeln(e){
    const text = 'Prüfprotokoll ' + e.nummer + (e.pruefort ? ' · ' + e.pruefort : '') + (e.anlage ? ' · ' + e.anlage : '') + ' · Prüfdatum ' + datumDe(e.pruefdatum) + ' · Ergebnis ' + e.ergebnis;
    const art = await teilen(e.pdf, e.dateiname, 'Prüfprotokoll ' + e.nummer, text);
    if(art === 'abgebrochen'){ meldung('Teilen abgebrochen – nichts verschickt.', 'hinweis'); return; }
    await versandFragen([e.id], 'Protokoll ' + e.nummer, art);
  }

  /* ---------------- Aktionen ---------------- */
  function ansehen(e){
    PdfAnsicht.oeffnen(e.pdf, { titel:e.nummer + (e.anlage ? ' · ' + e.anlage : ''), dateiname:e.dateiname,
      aktionen:[{ text:'↗ Teilen', klasse:'btn-success', onclick:()=>teilenEinzeln(e) }] })
      .catch(err=>fehler('PDF konnte nicht angezeigt werden.', err));
  }

  async function erneutePruefung(e){
    const typ = protokollTyp(e.typ);
    if(!typ || !typ.zielseite){ meldung('Die Protokollseite für „' + typName(e.typ) + '“ folgt in einem späteren Schritt.', 'hinweis'); return; }
    const ja = await bestaetigen({ titel:'Erneute Prüfung anlegen?',
      text:['Neues Protokoll (neue Nummer) für „' + (e.anlage || e.pruefort || e.nummer) + '“ mit ' + e.nummer + ' als Vorlage.',
        'Übernommen: ' + ((typ.vorlage && typ.vorlage.text) || 'Objektdaten') + '. Prüfer und Prüfgerät aus den aktuellen Stammdaten.',
        'Nicht übernommen: Messwerte, Besichtigen/Erproben, Ergebnisse, Bemerkung, Unterschriften, Fotos. Prüfdatum = heute.'],
      ok:'Neues Protokoll anlegen' });
    if(!ja) return;
    try{ const r = await Speicher.protokollAusVorlage(e.id); location.href = r.url; }
    catch(err){ fehler('Erneute Prüfung konnte nicht angelegt werden.', err); }
  }

  async function loeschen(e){
    const ja = await bestaetigen({ titel:'Aus dem Archiv löschen?',
      text:['Das PDF zu ' + e.nummer + (e.anlage ? ' („' + e.anlage + '“)' : '') + ' wird aus dem Archiv gelöscht.',
        'Die Protokolldaten auf der Hauptseite unter „Vergangene Prüfungen“ bleiben erhalten – daraus lässt sich das PDF neu erstellen.'],
      ok:'Aus Archiv löschen', gefahr:true });
    if(!ja) return;
    try{ await Speicher.archivLoeschen(e.id); auswahl.delete(e.id); await laden(); meldung('✓ ' + e.nummer + ' wurde aus dem Archiv gelöscht.', 'ok'); }
    catch(err){ fehler('Löschen fehlgeschlagen.', err); }
  }

  /* ZIP: erst erstellen, dann eigener Klick zum Teilen (Teilen-Menü braucht einen frischen Klick) */
  async function zipErstellen(){
    const eintraege = alle.filter(e=>auswahl.has(e.id));
    if(!eintraege.length) return;
    const btn = $('btn-zip'); btn.disabled = true; btn.textContent = 'ZIP wird erstellt …';
    let blob;
    try{ blob = await Zip.erstellen(eintraege.map(e=>({ name:e.dateiname, blob:e.pdf }))); }
    catch(err){ fehler('ZIP konnte nicht erstellt werden.', err); return; }
    finally{ btn.disabled = false; btn.textContent = 'Als ZIP zusammenfassen'; }
    const heute = new Date(), p = n=>String(n).padStart(2, '0');
    const name = ARCHIV.zipName(heute.getFullYear() + '-' + p(heute.getMonth() + 1) + '-' + p(heute.getDate()), eintraege.length);
    const nio = eintraege.filter(e=>e.ergebnis === 'n.i.O.').length;
    $('zip-text').textContent = '„' + name + '“ · ' + plural(eintraege.length, 'PDF', 'PDFs') + ' · ' + groesseDe(blob.size) + (nio ? ' · davon ' + nio + ' n.i.O.' : '');
    const warten = dialogWarten($('zip-dialog'));
    $('zip-teilen').focus();
    const wahl = await warten;
    if(wahl === 'abbruch') return;
    const bezug = 'die ZIP mit ' + plural(eintraege.length, 'Protokoll', 'Protokollen');
    let art;
    if(wahl === 'laden'){ Speicher.dateiHerunterladen(blob, name); art = 'geladen'; }
    else art = await teilen(blob, name, 'Prüfprotokolle (' + eintraege.length + ')', 'Prüfprotokolle: ' + eintraege.map(e=>e.nummer + ' ' + e.ergebnis).join(', '));
    if(art === 'abgebrochen'){ meldung('Teilen abgebrochen – nichts verschickt.', 'hinweis'); return; }
    await versandFragen(eintraege.map(e=>e.id), bezug, art, { zip:name });
  }

  /* ---------------- Start ---------------- */
  function init(){
    Object.values(F).forEach(f=>f.addEventListener(f === F.suche ? 'input' : 'change', render));
    $('btn-filter-zurueck').addEventListener('click', ()=>{ Object.values(F).forEach(f=>{ f.value = ''; }); render(); });
    $('btn-alle-waehlen').addEventListener('click', ()=>{ gefiltert().forEach(e=>auswahl.add(e.id)); render(); auswahlAnzeigen(); });
    $('btn-auswahl-leeren').addEventListener('click', ()=>{ auswahl.clear(); render(); auswahlAnzeigen(); });
    $('btn-zip').addEventListener('click', zipErstellen);
    const q = new URLSearchParams(location.search);
    laden().then(()=>{
      if(q.get('monat')){ F.monat.value = q.get('monat'); render(); }
    });
  }
  init();
})();
