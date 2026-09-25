/* =========================================================================
   Speicherschicht der VDE-Prüf-App V2 – EINE Stelle für alle Seiten.
   Konstanten, Schlüssel und Namen: js/app-config.js.

   IndexedDB (vde2_db)  Stammdaten, Entwürfe/Abgeschlossene, Nummernzähler,
                        Ordner-Handle für PDFs
   localStorage         nur kleine Einstellungen (vde2_…), dazu die zwei
                        Altschlüssel aus der Masterbibliothek

   Öffentlich (Objekt `Speicher`)
     Stammdaten      stammdatenLaden() · stammdatenSpeichern(werte) · stammdatenLeeren()
     Protokolle      protokollNeu(typ) · protokollnummerVergeben(typ) · entwurfLaden(id)
                     entwurfSpeichern(protokoll) · protokollListe(status) · protokollLoeschen(id)
                     protokollAbschliessen(id) · anzahlVon(protokoll)
     PDF             pdfSpeichern(blob, dateiname) · pdfOrdnerWaehlen() · pdfAufDownload()
                     pdfStatus() · ordnerWahlMoeglich()
     Archiv          archivSpeichern(protokoll, pdf) · archivListe() · archivLoeschen(id)
                     archivVersandVermerken(ids, weg) · protokollAusVorlage(archivId)
     Datensicherung  exportErstellen() · importPruefen(text) · importAnwenden(daten, modus)
     Sonstiges       verfuegbar() · dateiHerunterladen(blob, name)
   Alle Funktionen sind async und werfen bei Fehlern (der Aufrufer zeigt die Meldung).
   ========================================================================= */

const Speicher = (function(){
  'use strict';

  /* ---------------- IndexedDB Grundlagen ---------------- */
  let dbPromise = null;

  function verfuegbar(){
    try{ return typeof indexedDB !== 'undefined' && indexedDB !== null; }catch(e){ return false; }
  }

  function db(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject)=>{
      if(!verfuegbar()){ reject(new Error('Dieser Browser bietet keinen Datenspeicher (IndexedDB).')); return; }
      let req;
      try{ req = indexedDB.open(DB_NAME, SCHEMA_VERSION); }catch(e){ reject(e); return; }
      req.onupgradeneeded = ()=>{
        const d = req.result;
        Object.values(DB_STORES).forEach(name=>{
          if(!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath:'id' });
        });
      };
      req.onsuccess = ()=>{
        const d = req.result;
        d.onversionchange = ()=>{ d.close(); dbPromise = null; };
        resolve(d);
      };
      req.onerror = ()=>reject(req.error || new Error('Datenspeicher konnte nicht geöffnet werden.'));
      req.onblocked = ()=>reject(new Error('Datenspeicher ist durch ein anderes Fenster blockiert. Bitte andere Fenster der App schließen.'));
    }).catch(e=>{ dbPromise = null; throw e; });
    return dbPromise;
  }

  function anfrage(r){
    return new Promise((resolve, reject)=>{ r.onsuccess = ()=>resolve(r.result); r.onerror = ()=>reject(r.error); });
  }

  /* Transaktion über mehrere Stores; `arbeit` darf nur IndexedDB-Anfragen awaiten */
  async function tx(namen, modus, arbeit){
    const d = await db();
    return new Promise((resolve, reject)=>{
      let t;
      try{ t = d.transaction(namen, modus); }catch(e){ reject(e); return; }
      const stores = {};
      namen.forEach(n=>{ stores[n] = t.objectStore(n); });
      let ergebnis;
      t.oncomplete = ()=>resolve(ergebnis);
      t.onerror = ()=>reject(t.error || new Error('Speichern fehlgeschlagen.'));
      t.onabort = ()=>reject(t.error || new Error('Speichervorgang abgebrochen.'));
      Promise.resolve().then(()=>arbeit(stores)).then(r=>{ ergebnis = r; }).catch(e=>{ try{ t.abort(); }catch(_){} reject(e); });
    });
  }

  const S = DB_STORES;
  const jetzt = ()=>Date.now();

  function neueId(){
    if(typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id' + jetzt().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  const ID_MUSTER = /^[A-Za-z0-9_-]{1,64}$/;

  /* ---------------- Stammdaten: { [feldId]: wert } ---------------- */
  async function stammdatenLaden(){
    const r = await tx([S.stammdaten], 'readonly', st=>anfrage(st[S.stammdaten].get('aktuell')));
    return r ? { werte: r.werte || {}, geaendert: r.geaendert || 0 } : { werte: {}, geaendert: 0 };
  }
  async function stammdatenSpeichern(werte){
    const satz = { id:'aktuell', werte: Object.assign({}, werte), geaendert: jetzt() };
    await tx([S.stammdaten], 'readwrite', st=>anfrage(st[S.stammdaten].put(satz)));
    return satz.geaendert;
  }
  async function stammdatenLeeren(){
    await tx([S.stammdaten], 'readwrite', st=>anfrage(st[S.stammdaten].delete('aktuell')));
  }

  /* ---------------- Nummernzähler (je Typ und Jahr, zählt nur hoch) ---------------- */
  /* Nummernzähler je Typ und Tag (NUMMER_ZAEHLER_KEY / NUMMER_FORMAT in app-config.js) */
  async function zaehlerErhoehen(stores, typ, datum){
    const key = NUMMER_ZAEHLER_KEY(typ.schluessel, datum);
    const alt = await anfrage(stores[S.zaehler].get(key));
    const lfd = (alt ? alt.wert : 0) + 1;
    await anfrage(stores[S.zaehler].put({ id:key, wert:lfd }));
    return NUMMER_FORMAT(typ.praefix, datum, lfd);
  }

  /* Nur die Nummer (eigene Transaktion). Nutzt protokollNeu() bereits intern. */
  async function protokollnummerVergeben(typSchluessel){
    const typ = protokollTyp(typSchluessel);
    if(!typ) throw new Error('Unbekannter Protokolltyp: ' + typSchluessel);
    return tx([S.zaehler], 'readwrite', st=>zaehlerErhoehen(st, typ, new Date()));
  }

  /* ---------------- Protokolle (Entwürfe und Abgeschlossene) ----------------
     { id, typ, nummer, status:'entwurf'|'abgeschlossen', stammdaten:{…Kopie},
       daten:{…Protokollinhalt der jeweiligen Seite}, erstellt, geaendert, abgeschlossenAm } */

  /* Neuer Entwurf: Nummer + Stammdaten-Kopie + Speichern in EINER Transaktion.
     Ohne Zielseite (null): keine Nummer, kein Entwurf. */
  async function protokollNeu(typSchluessel){
    const typ = protokollTyp(typSchluessel);
    if(!typ) throw new Error('Unbekannter Protokolltyp: ' + typSchluessel);
    if(!typ.zielseite) return { ok:false, grund:'zielseite-fehlt', typ };
    const datum = new Date();
    const entwurf = await tx([S.zaehler, S.protokolle, S.stammdaten], 'readwrite', async st=>{
      const sd = await anfrage(st[S.stammdaten].get('aktuell'));
      const nummer = await zaehlerErhoehen(st, typ, datum);
      const t = jetzt();
      const e = {
        id: neueId(), typ: typ.schluessel, nummer, status:'entwurf',
        stammdaten: JSON.parse(JSON.stringify((sd && sd.werte) || {})),
        daten: {}, erstellt: t, geaendert: t, abgeschlossenAm: null
      };
      await anfrage(st[S.protokolle].put(e));
      return e;
    });
    return { ok:true, entwurf, url: typ.zielseite + '?entwurf=' + encodeURIComponent(entwurf.id) };
  }

  /* Für spätere Seiten (?entwurf=<id>): unbekannte/ungültige ID → { gefunden:false } */
  async function entwurfLaden(id){
    if(typeof id !== 'string' || !ID_MUSTER.test(id)) return { gefunden:false, grund:'ungueltige-id' };
    const p = await tx([S.protokolle], 'readonly', st=>anfrage(st[S.protokolle].get(id)));
    return p ? { gefunden:true, entwurf:p } : { gefunden:false, grund:'nicht-gefunden' };
  }

  /* Speichert einen (geänderten) Entwurf; setzt `geaendert` neu */
  async function entwurfSpeichern(protokoll){
    if(!protokoll || !ID_MUSTER.test(String(protokoll.id||''))) throw new Error('Ungültiges Protokoll.');
    protokoll.geaendert = jetzt();
    await tx([S.protokolle], 'readwrite', st=>anfrage(st[S.protokolle].put(protokoll)));
    return protokoll;
  }

  async function protokollListe(status){
    const alle = await tx([S.protokolle], 'readonly', st=>anfrage(st[S.protokolle].getAll()));
    return alle.filter(p=>!status || p.status===status)
               .sort((a,b)=>(b.geaendert||0)-(a.geaendert||0));
  }

  async function protokollLoeschen(id){
    await tx([S.protokolle], 'readwrite', st=>anfrage(st[S.protokolle].delete(id)));
  }

  async function protokollAbschliessen(id){
    return tx([S.protokolle], 'readwrite', async st=>{
      const p = await anfrage(st[S.protokolle].get(id));
      if(!p) throw new Error('Protokoll nicht gefunden.');
      p.status = 'abgeschlossen'; p.abgeschlossenAm = jetzt(); p.geaendert = p.abgeschlossenAm;
      await anfrage(st[S.protokolle].put(p));
      return p;
    });
  }

  /* typspezifische Anzahl (Stromkreise / Übergabepunkte / Geräte) */
  function anzahlVon(p){
    const typ = protokollTyp(p.typ);
    if(!typ || !p.daten) return 0;
    if(!typ.anzahlKey) return 1;                  /* ein Prüfling je Protokoll (Anschluss, Gerät) */
    const v = p.daten[typ.anzahlKey];
    if(Array.isArray(v)) return v.length;
    return Number.isFinite(Number(v)) ? Number(v) : 0;
  }

  /* ---------------- Archiv ----------------
     Ein Eintrag je Protokoll (id = Protokoll-ID). Jedes neue „ausgefüllte" PDF
     ersetzt den Eintrag; der Entwurf bleibt bearbeitbar. Kurzdaten und Vorlage
     werden beim Archivieren eingefroren – der Eintrag bleibt vollständig, auch
     wenn das Protokoll später gelöscht wird.
     { id, typ, nummer, dateiname, pdf:Blob, groesse, seiten,
       pruefort, anlage, anzahl, pruefdatum:'JJJJ-MM-TT', monat:'JJJJ-MM',
       ergebnis:'i.O.'|'n.i.O.'|'offen', maengel:[Text], unvollstaendig,
       vorlage:{ felder:{}, liste:[{werte}] }, erstellt, versand:[{ am, weg, anzahlImZip? }] } */
  const oder_ = (v, alt) => (v != null && String(v).trim()) ? String(v).trim() : (alt || '');
  function isoTag(d){ const p = n=>String(n).padStart(2,'0'); return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()); }

  /* Nur die Felder aus PROTOKOLL_TYPEN[].vorlage – klein, ohne Fotos und Messwerte */
  function vorlageAus(p){
    const typ = protokollTyp(p.typ), v = typ && typ.vorlage;
    if(!v) return null;
    const d = p.daten || {}, felder = {};
    v.felder.forEach(id=>{ if(d[id] != null && String(d[id]).trim() !== '') felder[id] = d[id]; });
    const quelle = typ.anzahlKey && Array.isArray(d[typ.anzahlKey]) ? d[typ.anzahlKey] : [];
    const liste = quelle.map(k=>{
      const werte = {};
      (v.listeFelder || []).forEach(id=>{ const w = k && k.werte ? k.werte[id] : undefined; if(w != null && String(w).trim() !== '') werte[id] = w; });
      return { werte };
    });
    return { felder, liste };
  }

  async function archivSpeichern(p, pdf){
    if(!p || !ID_MUSTER.test(String(p.id||''))) throw new Error('Ungültiges Protokoll.');
    if(!(pdf && pdf.blob instanceof Blob)) throw new Error('Kein PDF zum Archivieren.');
    const d = p.daten || {}, st = p.stammdaten || {};
    const datum = /^\d{4}-\d{2}-\d{2}$/.test(String(d[FELD_PRUEFDATUM]||'')) ? d[FELD_PRUEFDATUM] : isoTag(new Date());
    const maengel = Array.isArray(pdf.maengel) ? pdf.maengel.map(String) : [];
    const alt = await tx([S.archiv], 'readonly', s2=>anfrage(s2[S.archiv].get(p.id)));
    const e = {
      id: p.id, typ: p.typ, nummer: p.nummer,
      dateiname: dateinameBereinigen(pdf.dateiname), pdf: pdf.blob, groesse: pdf.blob.size, seiten: pdf.seiten || 0,
      pruefort: oder_(d[FELD_PRUEFORT], st[FELD_PRUEFORT]), anlage: oder_(d[objektFeld(p.typ)], st[objektFeld(p.typ)]),
      anzahl: anzahlVon(p), pruefdatum: datum, monat: datum.slice(0, 7),
      ergebnis: maengel.length ? 'n.i.O.' : (pdf.unvollstaendig ? 'offen' : 'i.O.'), maengel,   /* offen = unvollständig ohne Mangel: nie „i.O." */ unvollstaendig: !!pdf.unvollstaendig,
      vorlage: vorlageAus(p), erstellt: jetzt(),
      versand: [],                                   /* neues PDF = neuer Stand, alter Vermerk gilt nicht mehr */
      vorherVersendet: alt && alt.versand && alt.versand.length ? alt.versand : undefined
    };
    await tx([S.archiv], 'readwrite', s2=>anfrage(s2[S.archiv].put(e)));
    return e;
  }

  /* neueste Prüfung zuerst (Prüfdatum, dann Erstellzeit) */
  async function archivListe(){
    const alle = await tx([S.archiv], 'readonly', s2=>anfrage(s2[S.archiv].getAll()));
    return alle.sort((a, b)=>String(b.pruefdatum).localeCompare(String(a.pruefdatum)) || (b.erstellt||0) - (a.erstellt||0));
  }

  async function archivLoeschen(id){
    await tx([S.archiv], 'readwrite', s2=>anfrage(s2[S.archiv].delete(id)));
  }

  /* weg: Schlüssel aus ARCHIV.versandwege. Rückgabe: Zeitpunkt */
  async function archivVersandVermerken(ids, weg, extra){
    const am = jetzt();
    await tx([S.archiv], 'readwrite', async s2=>{
      for(const id of [].concat(ids)){
        const e = await anfrage(s2[S.archiv].get(id));
        if(!e) continue;
        e.versand = (e.versand || []).concat(Object.assign({ am, weg }, extra || {}));
        await anfrage(s2[S.archiv].put(e));
      }
    });
    return am;
  }

  /* „Erneute Prüfung": neuer Entwurf (neue Nummer, aktuelle Stammdaten) + Vorlage des Archiv-Eintrags */
  async function protokollAusVorlage(archivId){
    const a = await tx([S.archiv], 'readonly', s2=>anfrage(s2[S.archiv].get(archivId)));
    if(!a) throw new Error('Archiv-Eintrag nicht gefunden.');
    const typ = protokollTyp(a.typ);
    if(!typ || !typ.zielseite) throw new Error('Die Protokollseite für diesen Typ ist noch nicht freigeschaltet.');
    const r = await protokollNeu(a.typ);
    if(!r.ok) throw new Error('Neues Protokoll konnte nicht angelegt werden.');
    const v = a.vorlage || { felder:{}, liste:[] };
    const daten = Object.assign({}, v.felder, (typ.vorlage && typ.vorlage.setzen) || {});
    if(typ.anzahlKey && v.liste && v.liste.length) daten[typ.anzahlKey] = v.liste.map((k, i)=>({ id:'v' + Date.now().toString(36) + i, werte: Object.assign({}, k.werte) }));
    r.entwurf.daten = daten;
    r.entwurf.vorlageVon = a.nummer;
    await entwurfSpeichern(r.entwurf);
    return r;
  }

  /* ---------------- Einstellungen (localStorage) ---------------- */
  function lsLesen(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
  function lsSchreiben(key, wert){ try{ localStorage.setItem(key, wert); return true; }catch(e){ return false; } }
  function lsEntfernen(key){ try{ localStorage.removeItem(key); }catch(e){} }

  /* Alle Schlüssel, die zur Sicherung gehören. Gerätespezifisches (PDF-Ordner) nicht. */
  function istSicherungsSchluessel(k){
    if(k===SPEICHER_KEYS.pdfModus || k===SPEICHER_KEYS.pdfOrdnerName) return false;
    return k.startsWith(SPEICHER_PRAEFIX) || k===SPEICHER_KEYS.hilfenSichtbar || k.startsWith(SPEICHER_KEYS.listePraefix);
  }
  function einstellungenSammeln(){
    const o = {};
    try{
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && istSicherungsSchluessel(k)) o[k] = localStorage.getItem(k);
      }
    }catch(e){}
    return o;
  }

  /* ---------------- PDF-Speicherort ---------------- */
  function ordnerWahlMoeglich(){
    return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
  }
  async function handleLesen(){
    const r = await tx([S.handles], 'readonly', st=>anfrage(st[S.handles].get('pdfOrdner')));
    return r ? r.handle : null;
  }
  async function pdfStatus(){
    let modus = lsLesen(SPEICHER_KEYS.pdfModus) || 'download';
    if(modus==='ordner' && !ordnerWahlMoeglich()) modus = 'download';
    return { modus, ordnerName: lsLesen(SPEICHER_KEYS.pdfOrdnerName) || '', ordnerWahlMoeglich: ordnerWahlMoeglich() };
  }
  async function pdfOrdnerWaehlen(){
    if(!ordnerWahlMoeglich()) throw new Error('Dieser Browser kann keinen eigenen Ordner wählen.');
    let handle;
    try{ handle = await window.showDirectoryPicker({ mode:'readwrite', id:'vde2-pdf' }); }
    catch(e){ if(e && e.name==='AbortError') return { abgebrochen:true }; throw e; }
    await tx([S.handles], 'readwrite', st=>anfrage(st[S.handles].put({ id:'pdfOrdner', handle })));
    lsSchreiben(SPEICHER_KEYS.pdfModus, 'ordner');
    lsSchreiben(SPEICHER_KEYS.pdfOrdnerName, handle.name);
    return { ok:true, ordnerName: handle.name };
  }
  async function pdfAufDownload(){
    lsSchreiben(SPEICHER_KEYS.pdfModus, 'download');
    lsEntfernen(SPEICHER_KEYS.pdfOrdnerName);
    try{ await tx([S.handles], 'readwrite', st=>anfrage(st[S.handles].delete('pdfOrdner'))); }catch(e){}
  }

  function dateinameBereinigen(name){
    const n = String(name||'protokoll.pdf').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').trim() || 'protokoll.pdf';
    return /\.pdf$/i.test(n) ? n : n + '.pdf';
  }

  function dateiHerunterladen(blob, name){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 30000);
  }

  /* Von späteren Protokollseiten aufzurufen (aus einem Klick heraus, wegen der Berechtigung).
     Rückgabe: { ok, ort:'ordner'|'download', dateiname, ordnerName?, hinweis? } */
  async function pdfSpeichern(blob, dateiname){
    const name = dateinameBereinigen(dateiname);
    const st = await pdfStatus();
    if(st.modus==='ordner'){
      try{
        const handle = await handleLesen();
        if(!handle) throw new Error('Der gewählte Ordner ist nicht mehr gespeichert.');
        let p = await handle.queryPermission({ mode:'readwrite' });
        if(p!=='granted') p = await handle.requestPermission({ mode:'readwrite' });
        if(p!=='granted') throw new Error('Der Zugriff auf den Ordner wurde nicht erlaubt.');
        const fh = await handle.getFileHandle(name, { create:true });
        const w = await fh.createWritable();
        await w.write(blob); await w.close();
        return { ok:true, ort:'ordner', dateiname:name, ordnerName:handle.name };
      }catch(e){
        dateiHerunterladen(blob, name);
        return { ok:true, ort:'download', dateiname:name,
          hinweis:'Eigener Ordner nicht verfügbar (' + (e && e.message ? e.message : 'unbekannter Fehler') + '). Die PDF wurde stattdessen heruntergeladen.' };
      }
    }
    dateiHerunterladen(blob, name);
    return { ok:true, ort:'download', dateiname:name };
  }

  /* ---------------- Datensicherung ---------------- */
  function blobZuBase64(blob){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onload = ()=>resolve(String(r.result).split(',')[1] || '');
      r.onerror = ()=>reject(r.error);
      r.readAsDataURL(blob);
    });
  }
  function base64ZuBlob(b64, typ){
    const bin = atob(b64); const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: typ || 'application/octet-stream' });
  }
  /* Blobs (Fotos, Unterschriften) → Base64-Objekt; alles andere unverändert */
  async function serialisieren(w){
    if(typeof Blob !== 'undefined' && w instanceof Blob) return { __blob:true, typ:w.type, daten: await blobZuBase64(w) };
    if(Array.isArray(w)) return Promise.all(w.map(serialisieren));
    if(w && typeof w === 'object'){
      const o = {};
      for(const k of Object.keys(w)) o[k] = await serialisieren(w[k]);
      return o;
    }
    return w;
  }
  function deserialisieren(w){
    if(Array.isArray(w)) return w.map(deserialisieren);
    if(w && typeof w === 'object'){
      if(w.__blob===true && typeof w.daten==='string') return base64ZuBlob(w.daten, w.typ);
      const o = {};
      for(const k of Object.keys(w)) o[k] = deserialisieren(w[k]);
      return o;
    }
    return w;
  }

  function datumTeil(d){
    const p = n=>String(n).padStart(2,'0');
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate());
  }

  async function exportErstellen(){
    const d = await db();
    const t = d.transaction([S.stammdaten, S.protokolle, S.zaehler, S.archiv], 'readonly');
    const [sd, prot, zaehlerListe, archiv] = await Promise.all([
      anfrage(t.objectStore(S.stammdaten).get('aktuell')),
      anfrage(t.objectStore(S.protokolle).getAll()),
      anfrage(t.objectStore(S.zaehler).getAll()),
      anfrage(t.objectStore(S.archiv).getAll())
    ]);
    const zaehler = {}; zaehlerListe.forEach(z=>{ zaehler[z.id] = z.wert; });
    const jetztDatum = new Date();
    const inhalt = await serialisieren({
      meta: { app: APP_NAME, appVersion: APP_VERSION, exportiertAm: jetztDatum.toISOString(), schemaVersion: SCHEMA_VERSION },
      stammdaten: sd ? { werte: sd.werte, geaendert: sd.geaendert } : null,
      protokolle: prot,
      archiv,
      zaehler,
      einstellungen: einstellungenSammeln()
    });
    const blob = new Blob([JSON.stringify(inhalt, null, 2)], { type:'application/json' });
    return {
      blob, dateiname: 'vde-pruefapp-sicherung_' + datumTeil(jetztDatum) + '.json',
      anzahl: { entwuerfe: prot.filter(p=>p.status==='entwurf').length, abgeschlossen: prot.filter(p=>p.status==='abgeschlossen').length, archiv: archiv.length }
    };
  }

  /* Datei prüfen (noch nichts verändern) → { ok, fehler } oder { ok, vorschau, daten } */
  function importPruefen(text){
    let daten;
    try{ daten = JSON.parse(text); }catch(e){ return { ok:false, fehler:'Die Datei ist keine gültige JSON-Datei.' }; }
    if(!daten || typeof daten !== 'object' || !daten.meta) return { ok:false, fehler:'Die Datei hat nicht das Format einer Sicherung dieser App.' };
    if(daten.meta.app !== APP_NAME) return { ok:false, fehler:'Die Datei stammt nicht aus der ' + APP_NAME + ' (App-Kennung: „' + String(daten.meta.app||'–') + '“).' };
    const sv = Number(daten.meta.schemaVersion);
    if(!Number.isInteger(sv) || sv < 1) return { ok:false, fehler:'Die Datei hat keine gültige Schema-Version.' };
    if(sv > SCHEMA_VERSION) return { ok:false, fehler:'Die Sicherung stammt aus einer neueren App-Version (Schema ' + sv + ', diese App kennt bis ' + SCHEMA_VERSION + '). Bitte zuerst die App aktualisieren.' };
    if(!Array.isArray(daten.protokolle)) return { ok:false, fehler:'In der Datei fehlt die Liste der Protokolle.' };
    const gueltig = daten.protokolle.filter(protokollGueltig);
    return { ok:true, daten, vorschau:{
      entwuerfe: gueltig.filter(p=>p.status==='entwurf').length,
      abgeschlossen: gueltig.filter(p=>p.status==='abgeschlossen').length,
      ungueltig: daten.protokolle.length - gueltig.length,
      archiv: Array.isArray(daten.archiv) ? daten.archiv.filter(archivGueltig).length : 0,
      hatStammdaten: !!(daten.stammdaten && daten.stammdaten.werte),
      exportiertAm: daten.meta.exportiertAm || '', appVersion: daten.meta.appVersion || '', schemaVersion: sv
    }};
  }
  function archivGueltig(a){
    return a && typeof a==='object' && ID_MUSTER.test(String(a.id||'')) && protokollTyp(a.typ) && typeof a.nummer==='string'
      && a.pdf && typeof a.pdf==='object' && a.pdf.__blob===true;
  }
  function protokollGueltig(p){
    return p && typeof p==='object' && ID_MUSTER.test(String(p.id||'')) && protokollTyp(p.typ)
      && (p.status==='entwurf' || p.status==='abgeschlossen') && typeof p.nummer==='string';
  }

  /* modus: 'zusammenfuehren' (gleiche ID: neuerer Stand gewinnt) | 'ersetzen'
     Nummernzähler werden NIE zurückgesetzt (nur hochgesetzt). */
  async function importAnwenden(daten, modus){
    const ersetzen = (modus==='ersetzen');
    const protokolle = deserialisieren(daten.protokolle.filter(protokollGueltig));
    const erg = { hinzugefuegt:0, aktualisiert:0, unveraendert:0, uebersprungen: daten.protokolle.length - protokolle.length, ersetzt:ersetzen, archiv:0 };

    const archiv = deserialisieren((Array.isArray(daten.archiv) ? daten.archiv : []).filter(archivGueltig));
    await tx([S.stammdaten, S.protokolle, S.zaehler, S.archiv], 'readwrite', async st=>{
      if(ersetzen){ await anfrage(st[S.protokolle].clear()); await anfrage(st[S.archiv].clear()); }
      /* Archiv: gleicher Eintrag → neueres PDF gewinnt */
      for(const a of archiv){
        const alt = ersetzen ? null : await anfrage(st[S.archiv].get(a.id));
        if(!alt || (a.erstellt||0) > (alt.erstellt||0)){ await anfrage(st[S.archiv].put(a)); erg.archiv++; }
      }
      for(const p of protokolle){
        const alt = ersetzen ? null : await anfrage(st[S.protokolle].get(p.id));
        if(!alt){ await anfrage(st[S.protokolle].put(p)); erg.hinzugefuegt++; }
        else if((p.geaendert||0) > (alt.geaendert||0)){ await anfrage(st[S.protokolle].put(p)); erg.aktualisiert++; }
        else erg.unveraendert++;
      }
      /* Stammdaten */
      const sdNeu = daten.stammdaten && daten.stammdaten.werte ? daten.stammdaten : null;
      if(ersetzen){
        if(sdNeu) await anfrage(st[S.stammdaten].put({ id:'aktuell', werte:sdNeu.werte, geaendert:sdNeu.geaendert||jetzt() }));
        else await anfrage(st[S.stammdaten].delete('aktuell'));
      } else if(sdNeu){
        const alt = await anfrage(st[S.stammdaten].get('aktuell'));
        if(!alt || (sdNeu.geaendert||0) > (alt.geaendert||0)) await anfrage(st[S.stammdaten].put({ id:'aktuell', werte:sdNeu.werte, geaendert:sdNeu.geaendert||jetzt() }));
      }
      /* Zähler: je Schlüssel das Maximum aus vorhandenem, importiertem und höchster vorkommender Nummer */
      const kandidaten = {};
      const merke = (key, wert)=>{ if(Number.isFinite(wert) && wert > (kandidaten[key]||0)) kandidaten[key] = wert; };
      Object.keys(daten.zaehler||{}).forEach(k=>merke(k, Number(daten.zaehler[k])));
      protokolle.forEach(p=>{
        const z = nummerZerlegen(p.nummer);
        if(z) merke(p.typ + '_' + (z.tagKey || z.jahr), z.lfd);
      });
      for(const key of Object.keys(kandidaten)){
        if(!/^[a-z]+_(\d{4}|\d{8})$/.test(key)) continue;
        const alt = await anfrage(st[S.zaehler].get(key));
        if(!alt || alt.wert < kandidaten[key]) await anfrage(st[S.zaehler].put({ id:key, wert:kandidaten[key] }));
      }
    });

    /* Einstellungen (localStorage) */
    const ein = (daten.einstellungen && typeof daten.einstellungen==='object') ? daten.einstellungen : {};
    if(ersetzen) Object.keys(einstellungenSammeln()).forEach(lsEntfernen);
    Object.keys(ein).forEach(k=>{
      if(!istSicherungsSchluessel(k) || typeof ein[k] !== 'string') return;
      if(ersetzen || lsLesen(k)===null) lsSchreiben(k, ein[k]);
    });
    return erg;
  }

  return {
    verfuegbar, dateiHerunterladen,
    stammdatenLaden, stammdatenSpeichern, stammdatenLeeren,
    protokollNeu, protokollnummerVergeben, entwurfLaden, entwurfSpeichern, protokollListe,
    protokollLoeschen, protokollAbschliessen, anzahlVon,
    pdfSpeichern, pdfOrdnerWaehlen, pdfAufDownload, pdfStatus, ordnerWahlMoeglich,
    archivSpeichern, archivListe, archivLoeschen, archivVersandVermerken, protokollAusVorlage,
    exportErstellen, importPruefen, importAnwenden
  };
})();

/* Kurzformen für spätere Seiten */
const pdfSpeichern = Speicher.pdfSpeichern;
const entwurfLaden = Speicher.entwurfLaden;
