/* =========================================================================
   PDF-Ansicht – zeigt ein PDF (Blob) direkt in der App, auf jedem Gerät gleich
   (auch Android, wo der Browser PDFs sonst nur herunterlädt).
   Zeichnet mit pdf.js (js/lib/pdf.min.js, Mozilla, Apache-2.0), das erst beim
   ersten Öffnen geladen wird. Funktioniert offline (Dateien im Offline-Cache).

   PdfAnsicht.oeffnen(blob, { titel, dateiname, aktionen:[{ text, klasse, onclick }] })
   Aussehen: .pdf-ansicht… in css/archiv.css
   ========================================================================= */
const PdfAnsicht = (function(){
  'use strict';

  const LIB = 'js/lib/pdf.min.js', WORKER = 'js/lib/pdf.worker.min.js';
  const ZOOM = { min:0.5, max:3, schritt:0.25 };
  let libPromise = null;

  function libLaden(){
    if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if(libPromise) return libPromise;
    libPromise = new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = LIB;
      s.onload = ()=>{
        if(!window.pdfjsLib){ reject(new Error('PDF-Anzeige konnte nicht gestartet werden.')); return; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
        resolve(window.pdfjsLib);
      };
      s.onerror = ()=>reject(new Error('PDF-Anzeige konnte nicht geladen werden (offline noch nicht gespeichert?).'));
      document.head.append(s);
    }).catch(e=>{ libPromise = null; throw e; });
    return libPromise;
  }

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

  async function oeffnen(blob, opt){
    opt = opt || {};
    let zoom = 1, doc = null, url = null, lauf = 0;
    const status = el('span', { class:'pdf-ansicht-status', 'aria-live':'polite', text:'Wird geladen …' });
    const seiten = el('div', { class:'pdf-ansicht-seiten', tabindex:'0', 'aria-label':'PDF-Seiten' });
    const zoomText = el('span', { class:'pdf-ansicht-zoom', text:'100 %' });
    const knopf = (text, label, fn, klasse) => el('button', { type:'button', class:'btn ' + (klasse || 'btn-secondary'), text, 'aria-label':label, onclick:fn });
    const neuerTab = ()=>{ url = url || URL.createObjectURL(blob); window.open(url, '_blank', 'noopener'); };

    const dlg = el('dialog', { class:'pdf-ansicht', 'aria-label':'PDF-Ansicht: ' + (opt.titel || 'Protokoll') },
      el('header', { class:'pdf-ansicht-kopf' },
        el('div', { class:'pdf-ansicht-titel' }, el('strong', { text:opt.titel || 'PDF' }), status),
        el('div', { class:'pdf-ansicht-knoepfe' },
          knopf('−', 'Verkleinern', ()=>zoomSetzen(zoom - ZOOM.schritt)),
          zoomText,
          knopf('+', 'Vergrößern', ()=>zoomSetzen(zoom + ZOOM.schritt)),
          knopf('↔ Breite', 'Auf Seitenbreite', ()=>zoomSetzen(1)),
          ...(opt.aktionen || []).map(a=>knopf(a.text, a.text, a.onclick, a.klasse)),
          knopf('✕ Schließen', 'PDF-Ansicht schließen', ()=>dlg.close(), 'btn'))),
      seiten);
    document.body.append(dlg);
    dlg.addEventListener('close', ()=>{
      lauf++;
      if(doc) doc.destroy().catch(()=>{});
      if(url) setTimeout(()=>URL.revokeObjectURL(url), 60000);
      window.removeEventListener('resize', beiGroesse);
      dlg.remove();
    }, { once:true });
    dlg.showModal();

    function zoomSetzen(z){
      zoom = Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round(z * 100) / 100));
      zoomText.textContent = Math.round(zoom * 100) + ' %';
      zeichnen();
    }
    let t = null;
    function beiGroesse(){ clearTimeout(t); t = setTimeout(zeichnen, 200); }
    window.addEventListener('resize', beiGroesse);

    async function zeichnen(){
      if(!doc) return;
      const meinLauf = ++lauf;
      const breite = Math.max(200, seiten.clientWidth - 24);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      for(let n = 1; n <= doc.numPages; n++){
        const seite = await doc.getPage(n);
        if(meinLauf !== lauf) return;
        const basis = seite.getViewport({ scale:1 });
        const vp = seite.getViewport({ scale: breite / basis.width * zoom });
        const cv = el('canvas', { class:'pdf-ansicht-seite', role:'img', 'aria-label':'Seite ' + n + ' von ' + doc.numPages });
        cv.width = Math.floor(vp.width * dpr); cv.height = Math.floor(vp.height * dpr);
        cv.style.width = Math.floor(vp.width) + 'px'; cv.style.height = Math.floor(vp.height) + 'px';
        await seite.render({ canvasContext: cv.getContext('2d'), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
        if(meinLauf !== lauf) return;
        if(n === 1) seiten.replaceChildren(cv); else seiten.append(cv);
      }
      status.textContent = doc.numPages + (doc.numPages === 1 ? ' Seite' : ' Seiten');
    }

    try{
      const lib = await libLaden();
      const daten = new Uint8Array(await blob.arrayBuffer());
      doc = await lib.getDocument({ data:daten, isEvalSupported:false }).promise;
      if(!dlg.open){ doc.destroy(); return; }
      await zeichnen();
      seiten.focus({ preventScroll:true });
    }catch(e){
      console.error(e);
      status.textContent = '';
      seiten.replaceChildren(el('div', { class:'meldung meldung--hinweis pdf-ansicht-fehler' },
        el('span', { text:'Die Vorschau ist hier nicht möglich (' + ((e && e.message) || 'unbekannter Fehler') + ').' }),
        knopf('PDF im Browser öffnen', 'PDF im Browser öffnen', neuerTab)));
    }
  }

  return { oeffnen };
})();
