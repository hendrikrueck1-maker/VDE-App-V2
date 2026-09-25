/* =========================================================================
   Hauptseite (index.html) – Logik.
   Keine eigenen Eingabefelder: Alle Felder entstehen per renderFeld(<ID>) aus
   js/felder-daten.js (feld-renderer.js). Konstanten: app-config.js,
   Speicherung: speicher.js. Dynamische Inhalte werden per DOM/textContent
   gebaut (kein ungeprüftes innerHTML).
   ========================================================================= */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const HINWEIS_FOLGT = 'Protokollseite folgt in einem späteren Schritt.';

  /* Kleiner DOM-Baukasten: el('button', {class:'btn', onclick:fn, text:'…'}, kinder…) */
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

  function datumZeit(ts){
    if(!ts) return '–';
    return new Date(ts).toLocaleString('de-DE', { dateStyle:'medium', timeStyle:'short' });
  }
  function nurDatum(ts){
    return ts ? new Date(ts).toLocaleDateString('de-DE', { dateStyle:'medium' }) : '–';
  }
  const oder = (v, alt)=> (v && String(v).trim()) ? String(v).trim() : (alt || '–');

  /* ---------------- Meldungen und Bestätigungsdialog ---------------- */
  let meldungTimer = null;
  function meldung(text, art){
    const m = $('meldung');
    m.className = 'meldung' + (art ? ' meldung--' + art : '');
    m.textContent = ({ fehler:'Fehler: ', ok:'Erledigt: ', hinweis:'Hinweis: ' }[art] || '') + text;
    m.hidden = false;
    clearTimeout(meldungTimer);
    if(art !== 'fehler') meldungTimer = setTimeout(()=>{ m.hidden = true; }, 12000);
  }
  function fehlerText(e){ return (e && e.message) ? e.message : 'Unbekannter Fehler.'; }
  function fehler(kontext, e){ console.error(kontext, e); meldung(kontext + ' ' + fehlerText(e), 'fehler'); }

  /* Rückgabe: Promise<boolean>. text: String oder Liste von Absätzen. */
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
      $('dialog-abbruch').focus();   /* sichere Vorauswahl */
    });
  }

  /* ================= 1. Stammdaten ================= */
  const felder = {};                 /* { 'STAM-01': { lesen, setzen, … } } */
  let ladend = true;                 /* unterdrückt Speichern beim Wiederherstellen */
  let speicherTimer = null;
  let stammFehler = false;

  function stammStatus(text, art){
    const s = $('stammdaten-status');
    s.textContent = text;
    s.className = 'speicher-status' + (art ? ' speicher-status--' + art : '');
  }
  function stammWerte(){
    const w = {};
    STAMMDATEN_FELDER.forEach(id=>{ if(felder[id]) w[id] = felder[id].lesen(); });
    return w;
  }
  async function stammSpeichernJetzt(){
    clearTimeout(speicherTimer); speicherTimer = null;
    try{
      await Speicher.stammdatenSpeichern(stammWerte());
      stammFehler = false;
      stammStatus('✓ Gespeichert um ' + new Date().toLocaleTimeString('de-DE'), 'ok');
    }catch(e){
      stammFehler = true;
      stammStatus('✗ Speichern fehlgeschlagen – ' + fehlerText(e), 'fehler');
      console.error('Stammdaten speichern', e);
    }
  }
  function stammSpeichernPlanen(){
    if(ladend) return;
    stammStatus('Änderung wird gespeichert …');
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(stammSpeichernJetzt, 500);
  }
  function stammSofortSpeichernFallsOffen(){
    if(speicherTimer) return stammSpeichernJetzt();
    return Promise.resolve();
  }

  async function stammdatenInit(){
    const ziel = $('stammdaten-felder');
    STAMMDATEN_FELDER.forEach(id=>{
      try{
        felder[id] = renderFeld(id, ziel, { modus:'formular', onChange: stammSpeichernPlanen });
      }catch(e){
        console.error(e);
        ziel.append(el('p', { class:'meldung meldung--fehler', text:'Feld ' + id + ' fehlt in felder-daten.js.' }));
      }
    });
    try{
      const r = await Speicher.stammdatenLaden();
      STAMMDATEN_FELDER.forEach(id=>{ if(felder[id] && r.werte[id] != null) felder[id].setzen(r.werte[id]); });
      stammStatus(r.geaendert ? 'Wiederhergestellt – zuletzt gespeichert: ' + datumZeit(r.geaendert) : 'Noch nichts gespeichert. Eingaben werden automatisch gesichert.');
    }catch(e){
      stammStatus('✗ Gespeicherte Stammdaten konnten nicht geladen werden – ' + fehlerText(e), 'fehler');
      console.error('Stammdaten laden', e);
    }
    ladend = false;

    $('btn-stammdaten-leeren').addEventListener('click', async ()=>{
      const ja = await bestaetigen({
        titel:'Stammdaten leeren?',
        text:['Alle ' + STAMMDATEN_FELDER.length + ' Stammdaten-Felder werden gelöscht.', 'Bereits angelegte Protokolle und Entwürfe bleiben unverändert (sie enthalten ihre eigene Kopie). Das Leeren kann nicht rückgängig gemacht werden.'],
        ok:'Stammdaten leeren', gefahr:true
      });
      if(!ja) return;
      ladend = true;
      Object.values(felder).forEach(f=>f.setzen(''));
      ladend = false;
      try{ await Speicher.stammdatenLeeren(); stammStatus('Stammdaten geleert.', 'ok'); }
      catch(e){ stammStatus('✗ Leeren fehlgeschlagen – ' + fehlerText(e), 'fehler'); }
    });

    /* letzte Eingabe nicht verlieren, wenn die Seite verlassen wird */
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') stammSofortSpeichernFallsOffen(); });
    window.addEventListener('pagehide', stammSofortSpeichernFallsOffen);
  }

  /* ================= 2. Protokoll starten ================= */
  const kacheln = {};                /* schluessel → { fortsetzen, info, hinweis } */

  function protokollUrl(typ, id){ return typ.zielseite + '?entwurf=' + encodeURIComponent(id); }

  function kachelnRender(){
    const ziel = $('kacheln');
    PROTOKOLL_TYPEN.forEach(typ=>{
      const hinweis = el('p', { class:'kachel-hinweis', role:'status' });
      const fortsetzenBox = el('div', { hidden:true });
      const neu = el('button', { type:'button', class:'btn btn-success', text:'+ Neues Protokoll starten', onclick: async ()=>{
        hinweis.textContent = '';
        if(!typ.zielseite){ hinweis.textContent = HINWEIS_FOLGT; return; }
        try{
          await stammSofortSpeichernFallsOffen();
          const r = await Speicher.protokollNeu(typ.schluessel);
          if(r.ok) location.href = r.url; else hinweis.textContent = HINWEIS_FOLGT;
        }catch(e){ fehler('Neues Protokoll konnte nicht angelegt werden.', e); }
      }});
      kacheln[typ.schluessel] = { fortsetzenBox, hinweis };
      ziel.append(el('article', { class:'karte kachel' },
        el('h3', { text:typ.name }),
        el('p', { text:typ.beschreibung }),
        typ.zielseite ? null : el('span', { class:'kachel-status', text:'Protokollseite noch nicht verfügbar' }),
        el('div', { class:'aktionen' }, neu, fortsetzenBox),
        hinweis
      ));
    });
  }

  function kachelnAktualisieren(offene){
    PROTOKOLL_TYPEN.forEach(typ=>{
      const k = kacheln[typ.schluessel];
      k.fortsetzenBox.replaceChildren();
      const letzter = offene.find(p=>p.typ === typ.schluessel);   /* Liste ist nach „zuletzt bearbeitet" sortiert */
      k.fortsetzenBox.hidden = !letzter;
      if(!letzter) return;
      const beschriftung = '▶ Protokoll fortsetzen';
      const knopf = typ.zielseite
        ? el('a', { class:'btn btn-warn', href:protokollUrl(typ, letzter.id), text:beschriftung })
        : el('button', { type:'button', class:'btn btn-warn', text:beschriftung, onclick:()=>{ k.hinweis.textContent = HINWEIS_FOLGT; } });
      k.fortsetzenBox.append(knopf,
        el('span', { class:'kachel-fortsetzen-info', text:letzter.nummer + ' · zuletzt bearbeitet ' + datumZeit(letzter.geaendert) }));
    });
  }

  /* ================= 3./4. Archiv und vergangene Prüfungen ================= */
  function eintragDaten(p){
    const typ = protokollTyp(p.typ);
    const st = p.stammdaten || {}, d = p.daten || {};
    const anlage = oder(d[objektFeld(p.typ)], st[objektFeld(p.typ)]);
    const zeilen = [
      ['Protokolltyp', typ ? typ.name : p.typ],
      ['Protokollnummer', el('span', { class:'eintrag-nummer', text:p.nummer })],
      ['Prüfort', oder(d[FELD_PRUEFORT], st[FELD_PRUEFORT])],
      ['Anlage / Objekt', anlage],
      [typ ? typ.einheit : 'Anzahl', String(Speicher.anzahlVon(p))],
      [p.status === 'abgeschlossen' ? 'Abgeschlossen am' : 'Zuletzt bearbeitet', datumZeit(p.status === 'abgeschlossen' ? p.abgeschlossenAm : p.geaendert)]
    ];
    return el('dl', { class:'eintrag-daten' }, ...zeilen.map(([t, w])=>el('div', {}, el('dt', { text:t }), el('dd', {}, w))));
  }

  function eintragRender(p){
    const typ = protokollTyp(p.typ);
    const hinweis = el('p', { class:'eintrag-hinweis', role:'status' });
    const oeffnen = (typ && typ.zielseite)
      ? el('a', { class:'btn btn-secondary', href:protokollUrl(typ, p.id), text:'Öffnen' })
      : el('button', { type:'button', class:'btn btn-secondary', text:'Öffnen', onclick:()=>{ hinweis.textContent = HINWEIS_FOLGT; } });
    const anlage = oder((p.daten || {})[objektFeld(p.typ)], (p.stammdaten || {})[objektFeld(p.typ)]);
    const bezug = 'Protokoll ' + p.nummer + ' (Anlage/Objekt: ' + anlage + ')';

    const loeschen = el('button', { type:'button', class:'btn btn-danger', text:'Löschen', onclick: async ()=>{
      const ja = await bestaetigen({ titel:'Protokoll löschen?', text:[bezug + ' wird endgültig gelöscht.', 'Das kann nicht rückgängig gemacht werden. Die Protokollnummer wird nicht erneut vergeben.'], ok:'Endgültig löschen', gefahr:true });
      if(!ja) return;
      try{ await Speicher.protokollLoeschen(p.id); meldung(bezug + ' wurde gelöscht.', 'ok'); await listenAktualisieren(); }
      catch(e){ fehler('Löschen fehlgeschlagen.', e); }
    }});

    const knoepfe = [oeffnen];
    if(p.status === 'entwurf'){
      knoepfe.push(el('button', { type:'button', class:'btn btn-success', text:'Abschließen', onclick: async ()=>{
        const ja = await bestaetigen({ titel:'Protokoll abschließen?', text:[bezug + ' wird als abgeschlossen markiert und nach „Bereits abgeschlossen“ verschoben.', 'Es zählt danach nicht mehr als offene Prüfung.'], ok:'Abschließen' });
        if(!ja) return;
        try{ await Speicher.protokollAbschliessen(p.id); meldung(bezug + ' wurde abgeschlossen.', 'ok'); await listenAktualisieren(); }
        catch(e){ fehler('Abschließen fehlgeschlagen.', e); }
      }}));
    }
    knoepfe.push(loeschen);
    return el('article', { class:'eintrag' }, eintragDaten(p), el('div', { class:'eintrag-aktionen' }, ...knoepfe), hinweis);
  }

  function listeFuellen(zielId, liste, leerText){
    const ziel = $(zielId); ziel.replaceChildren();
    if(!liste.length) ziel.append(el('p', { class:'leerzustand', text:leerText }));
    else liste.forEach(p=>ziel.append(eintragRender(p)));
  }

  /* Die 3 zuletzt archivierten PDFs (Archivseite: archiv.html / js/archiv.js) */
  async function archivRender(){
    const ziel = $('archiv-letzte'); ziel.replaceChildren();
    let liste = [];
    try{ liste = await Speicher.archivListe(); }catch(e){ fehler('Archiv konnte nicht gelesen werden.', e); return; }
    $('btn-archiv').textContent = 'Archiv öffnen (' + liste.length + ')';
    if(!liste.length){ ziel.append(el('p', { class:'leerzustand', text:'Noch nichts archiviert. Jedes ausgefüllte PDF landet automatisch im Archiv.' })); return; }
    const karten = liste.slice().sort((a, b)=>(b.erstellt || 0) - (a.erstellt || 0)).slice(0, 3).map(a=>{
      const typ = protokollTyp(a.typ);
      return el('article', { class:'eintrag' },
        el('dl', { class:'eintrag-daten' },
          ...[['Protokollnummer', el('span', { class:'eintrag-nummer', text:a.nummer })],
              ['Ergebnis', el('strong', { class: { 'n.i.O.':'ergebnis-nio', 'offen':'ergebnis-offen' }[a.ergebnis] || 'ergebnis-io',
                text: { 'n.i.O.':'✗ n.i.O.', 'offen':'? offen (unvollständig)' }[a.ergebnis] || '✓ i.O.' })],
              ['Prüfort', oder(a.pruefort)], ['Anlage / Objekt', oder(a.anlage)],
              [typ ? typ.einheit : 'Anzahl', String(a.anzahl)], ['PDF erstellt', datumZeit(a.erstellt)]]
            .map(([t, w])=>el('div', {}, el('dt', { text:t }), el('dd', {}, w)))));
    });
    ziel.append(el('div', { class:'eintraege' }, ...karten));
  }

  async function listenAktualisieren(){
    try{
      const alle = await Speicher.protokollListe();
      const offene = alle.filter(p=>p.status === 'entwurf');
      const fertige = alle.filter(p=>p.status === 'abgeschlossen');
      $('anzahl-offen').textContent = offene.length;
      $('anzahl-abgeschlossen').textContent = fertige.length;
      listeFuellen('liste-offen', offene, 'Keine offenen Prüfungen. Starte oben ein neues Protokoll.');
      listeFuellen('liste-abgeschlossen', fertige, 'Noch keine abgeschlossenen Protokolle.');
      archivRender();
      kachelnAktualisieren(offene);
    }catch(e){ fehler('Protokolle konnten nicht geladen werden.', e); }
  }


  /* ================= 5. PDF-Speicherort ================= */
  async function pdfAnzeigen(){
    try{
      const s = await Speicher.pdfStatus();
      $('pdf-ort').textContent = s.modus === 'ordner'
        ? 'Eigener Ordner „' + (s.ordnerName || 'gewählt') + '“ (Berechtigung wird beim Speichern erneut geprüft)'
        : 'Download-Ordner des Browsers (Standard)';
      $('btn-pdf-ordner').hidden = !s.ordnerWahlMoeglich;
      $('btn-pdf-ordner').textContent = s.modus === 'ordner' ? 'Anderen Ordner wählen' : 'Eigenen Ordner wählen';
      $('btn-pdf-download').hidden = s.modus !== 'ordner';
      $('pdf-hinweis').textContent = s.ordnerWahlMoeglich
        ? 'In Chrome/Edge am Computer kannst du einen eigenen Ordner wählen. Ohne Auswahl landen die PDFs im Download-Ordner.'
        : 'Hier bestimmt das Gerät den Speicherort: Download-Ordner oder Teilen-/Sichern-Dialog (z. B. „In Dateien sichern“).';
    }catch(e){ fehler('Speicherort konnte nicht gelesen werden.', e); }
  }
  function pdfInit(){
    $('btn-pdf-ordner').addEventListener('click', async ()=>{
      try{
        const r = await Speicher.pdfOrdnerWaehlen();
        if(r.ok) meldung('PDFs werden künftig im Ordner „' + r.ordnerName + '“ gespeichert.', 'ok');
      }catch(e){ fehler('Ordner konnte nicht gewählt werden.', e); }
      pdfAnzeigen();
    });
    $('btn-pdf-download').addEventListener('click', async ()=>{
      try{ await Speicher.pdfAufDownload(); meldung('PDFs werden wieder im Download-Ordner gespeichert.', 'ok'); }
      catch(e){ fehler('Umstellen fehlgeschlagen.', e); }
      pdfAnzeigen();
    });
    pdfAnzeigen();
  }

  /* ================= 6. Datensicherung ================= */
  let importDaten = null;
  const IMPORT_MELDUNG_KEY = SPEICHER_PRAEFIX + 'import_meldung';   /* sessionStorage, nur für die Meldung nach dem Neuladen */

  function sicherungInit(){
    $('btn-export').addEventListener('click', async ()=>{
      try{
        const r = await Speicher.exportErstellen();
        Speicher.dateiHerunterladen(r.blob, r.dateiname);
        meldung('Sicherung „' + r.dateiname + '“ erstellt (' + r.anzahl.entwuerfe + ' Entwürfe, ' + r.anzahl.abgeschlossen + ' abgeschlossene Protokolle, ' + r.anzahl.archiv + ' Archiv-PDFs, Stammdaten, Zähler, Einstellungen). Bewahre die Datei außerhalb des Browsers auf.', 'ok');
      }catch(e){ fehler('Export fehlgeschlagen.', e); }
    });

    const datei = $('import-datei');
    $('btn-import').addEventListener('click', ()=>datei.click());
    datei.addEventListener('change', async ()=>{
      const f = datei.files && datei.files[0];
      if(!f) return;
      try{
        const r = Speicher.importPruefen(await f.text());
        if(!r.ok){ importZuruecksetzen(); meldung(r.fehler, 'fehler'); return; }
        importDaten = r.daten;
        const v = r.vorschau;
        $('import-vorschau-text').textContent =
          'Datei „' + f.name + '“ · exportiert am ' + datumZeit(Date.parse(v.exportiertAm)) + ' · App-Version ' + (v.appVersion || '–') + ' · Schema ' + v.schemaVersion + '. ' +
          'Enthalten: ' + v.entwuerfe + ' Entwürfe, ' + v.abgeschlossen + ' abgeschlossene Protokolle, ' + v.archiv + ' Archiv-PDFs' + (v.hatStammdaten ? ', Stammdaten' : '') + '.' +
          (v.ungueltig ? ' ' + v.ungueltig + ' Einträge sind unvollständig und werden übersprungen.' : '');
        $('import-vorschau').hidden = false;
        $('btn-import-merge').focus();
      }catch(e){ importZuruecksetzen(); fehler('Datei konnte nicht gelesen werden.', e); }
    });
    $('btn-import-abbruch').addEventListener('click', importZuruecksetzen);
    $('btn-import-merge').addEventListener('click', ()=>importAusfuehren('zusammenfuehren'));
    $('btn-import-ersetzen').addEventListener('click', async ()=>{
      const ja = await bestaetigen({
        titel:'Alle vorhandenen Daten ersetzen?',
        text:['ACHTUNG: Alle Entwürfe, abgeschlossenen Protokolle, Archiv-PDFs und die Stammdaten auf diesem Gerät werden durch den Inhalt der Sicherung ersetzt.', 'Nicht in der Sicherung enthaltene Protokolle gehen verloren. Die Nummernzähler werden nie zurückgesetzt. Tipp: Erst exportieren, dann ersetzen.'],
        ok:'Ja, ersetzen', gefahr:true
      });
      if(ja) importAusfuehren('ersetzen');
    });
  }
  function importZuruecksetzen(){
    importDaten = null; $('import-vorschau').hidden = true; $('import-datei').value = '';
  }
  async function importAusfuehren(modus){
    if(!importDaten) return;
    try{
      const e = await Speicher.importAnwenden(importDaten, modus);
      const text = 'Import (' + (modus === 'ersetzen' ? 'ersetzt' : 'zusammengeführt') + '): ' + e.hinzugefuegt + ' hinzugefügt, ' + e.aktualisiert + ' aktualisiert, ' + e.unveraendert + ' unverändert, ' + e.archiv + ' Archiv-PDFs übernommen' + (e.uebersprungen ? ', ' + e.uebersprungen + ' übersprungen' : '') + '. Nummernzähler wurden nicht zurückgesetzt.';
      try{ sessionStorage.setItem(IMPORT_MELDUNG_KEY, text); }catch(_){}
      location.reload();   /* alle Bereiche (Felder, Listen, Schalter) sauber aus dem neuen Stand aufbauen */
    }catch(e){ fehler('Import fehlgeschlagen – vorhandene Daten wurden nicht verändert, soweit möglich.', e); }
  }
  function importMeldungAnzeigen(){
    try{
      const t = sessionStorage.getItem(IMPORT_MELDUNG_KEY);
      if(t){ sessionStorage.removeItem(IMPORT_MELDUNG_KEY); meldung(t, 'ok'); }
    }catch(_){}
  }

  /* ================= 7. Version & Update ================= */
  let swReg = null;
  const swOk = ('serviceWorker' in navigator) && /^https?:$/.test(location.protocol);

  async function versionAnzeigen(){
    $('v-app').textContent = APP_VERSION;
    let caches_ = [];
    try{ if('caches' in window) caches_ = (await caches.keys()).filter(k=>k.startsWith(CACHE_PREFIX)); }catch(e){}
    let cacheText = 'Soll: ' + CACHE_NAME + ' · ' + (caches_.length ? 'aktiv: ' + caches_.join(', ') : 'noch kein Offline-Cache angelegt');
    if(caches_.length && !caches_.includes(CACHE_NAME)) cacheText += ' (Update ausstehend)';
    $('v-cache').textContent = 'v' + SW_VERSION + ' – ' + cacheText;

    let sw;
    if(!('serviceWorker' in navigator)) sw = 'Nicht verfügbar – dieser Browser unterstützt keinen Service Worker.';
    else if(!swOk) sw = 'Nicht verfügbar – die Seite wurde als Datei geöffnet. Für Offline-Betrieb und Updates die App über https oder localhost bereitstellen.';
    else if(!swReg) sw = 'Wird registriert …';
    else if(swReg.installing) sw = 'Wird installiert …';
    else if(swReg.waiting) sw = 'Neue Version installiert, wartet auf „jetzt neu laden“.';
    else if(swReg.active) sw = navigator.serviceWorker.controller ? 'Aktiv – die App ist offline nutzbar.' : 'Aktiv – wirkt ab dem nächsten Laden der Seite.';
    else sw = 'Nicht aktiv.';
    $('v-sw').textContent = sw;
    if(swReg && swReg.waiting) $('update-bereich').hidden = false;
  }

  function warteBisInstalliert(worker){
    return new Promise(resolve=>{
      if(!worker || worker.state === 'installed' || worker.state === 'activated') return resolve(worker);
      worker.addEventListener('statechange', ()=>{ if(['installed', 'activated', 'redundant'].includes(worker.state)) resolve(worker); });
    });
  }

  async function swInit(){
    if(swOk){
      try{
        swReg = await navigator.serviceWorker.register('sw.js');
        swReg.addEventListener('updatefound', async ()=>{
          await warteBisInstalliert(swReg.installing);
          versionAnzeigen();
        });
        navigator.serviceWorker.addEventListener('controllerchange', versionAnzeigen);
        /* Offline-Cache prüfen und fehlende Dateien nachladen (andere Apps derselben Domain können ihn gelöscht haben) */
        navigator.serviceWorker.ready.then(r=>{ if(r.active) r.active.postMessage({ typ:'CACHE_PRUEFEN' }); }).catch(()=>{});
      }catch(e){ console.error('Service Worker', e); $('v-sw').textContent = 'Registrierung fehlgeschlagen – ' + fehlerText(e); return; }
    }
    versionAnzeigen();

    $('btn-update-suchen').addEventListener('click', async ()=>{
      const erg = $('update-ergebnis');
      if(!swReg){ erg.textContent = 'Update-Suche nicht möglich: kein Service Worker aktiv (siehe Status oben).'; return; }
      if(navigator.onLine === false){ erg.textContent = 'Keine Internetverbindung – die Update-Suche ist nur online möglich. Die App läuft weiter mit der gespeicherten Version (' + APP_VERSION + ').'; return; }
      erg.textContent = 'Suche läuft …';
      try{
        await swReg.update();
        if(swReg.installing) await warteBisInstalliert(swReg.installing);
        await versionAnzeigen();
        erg.textContent = swReg.waiting
          ? 'Neue Version gefunden – sie kann jetzt geladen werden.'
          : 'Du nutzt die aktuelle Version (' + APP_VERSION + ').';
      }catch(e){ erg.textContent = 'Update-Suche fehlgeschlagen – ' + fehlerText(e) + ' (Ist das Gerät online?)'; }
    });

    $('btn-update-laden').addEventListener('click', ()=>{
      if(!swReg || !swReg.waiting){ location.reload(); return; }
      let neu = false;
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if(!neu){ neu = true; location.reload(); } });
      swReg.waiting.postMessage({ typ:'SKIP_WAITING' });
    });

    $('btn-cache-reset').addEventListener('click', async ()=>{
      const ja = await bestaetigen({
        titel:'Offline-Speicher zurücksetzen?',
        text:['Gelöscht wird nur der Zwischenspeicher der App-Dateien; der Service Worker wird abgemeldet. Deine Prüfdaten (Stammdaten, Entwürfe, abgeschlossene Protokolle) bleiben erhalten.',
              'Danach lädt die Seite neu und holt alle Dateien frisch aus dem Netz – dafür ist eine Internetverbindung nötig.'],
        ok:'Offline-Speicher löschen', gefahr:true
      });
      if(!ja) return;
      try{
        if('caches' in window) await Promise.all((await caches.keys()).filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k)));
        /* nur die eigene Registrierung abmelden – andere Apps unter derselben Domain bleiben unberührt */
        if(swReg) await swReg.unregister();
        try{ sessionStorage.setItem(IMPORT_MELDUNG_KEY, 'Offline-Speicher zurückgesetzt. Prüfdaten sind unverändert.'); }catch(_){}
        location.reload();
      }catch(e){ fehler('Zurücksetzen fehlgeschlagen.', e); }
    });
  }

  /* ================= Start ================= */
  async function start(){
    initHilfenSchalter($('toggleInfokarten'));
    kachelnRender();
    if(!Speicher.verfuegbar()){
      meldung('Der Datenspeicher (IndexedDB) ist in diesem Browser nicht verfügbar – z. B. im privaten Modus. Stammdaten und Protokolle können nicht gespeichert werden.', 'fehler');
    }
    await stammdatenInit();
    await listenAktualisieren();
    pdfInit();
    sicherungInit();
    importMeldungAnzeigen();
    /* Browser bitten, die Prüfdaten nicht automatisch zu löschen (v. a. iPhone/iPad) */
    try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{}); }catch(e){}
    await swInit();
  }
  start().catch(e=>fehler('Die Seite konnte nicht vollständig gestartet werden.', e));
})();
