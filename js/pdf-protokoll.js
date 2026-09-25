/* =========================================================================
   PDF-Bausteine für ALLE Protokolle – zwischen Engine (pdf-layout.js) und
   den PDF-Plänen (pdf-anlage.js, pdf-anschluss.js, pdf-geraete.js).

   Kennt Feld-IDs, Werte, Grenzwerte (FeldLogik.grenzwert), Kopf, Abschluss,
   Fotodokumentation und das Speichern. Die Pläne sagen nur WAS WO steht.

   einseitig(plan, arg, leer)  Protokoll aus Blöcken, zwingend EINE Seite
                               (Bemerkung füllt den Rest, wird notfalls kleiner
                               bzw. gekürzt) + Fotodokumentation auf Folgeseiten.
   Block-Arten im Plan
     { art:'zellen',     titel, rechts?, zeilen:[ [Zelle…] | {nurWenn, zellen} ], legende?:fn }
     { art:'checkliste', titel, optionen, spalten:[{ titel, felder, optionen?, kurz? }] }
     { art:'ablauf',     titel, rechts?, abschnitte:(w, leer)=>[…], zeileMin, zeileMinLeer, legende?:fn }  (Prüfablauf in 2 Spalten, pdf-layout ablauf())
     { art:'tabelle',    titel, rechts?:text|fn(w,leer), spalten, zeilen:(w, leer)=>[…], zh, zhLeer, legende?:fn }
   Zelle   'ID' | { id, b, label, einheit, wahl, kurz, farbe, fett, format,
                    nurDrehstrom, ausWenn:(w)=>bool }
   ========================================================================= */
const PdfProtokoll = (function(){
  'use strict';

  /* ---------------- Werte ---------------- */
  function leser(werte, fallback){
    return id=>{
      let v = werte ? werte[id] : undefined;
      if(v === undefined && werte && typeof FELD_ALT_IDS !== 'undefined' && FELD_ALT_IDS[id]) v = werte[FELD_ALT_IDS[id]];
      if((v === undefined || v === '') && fallback) v = fallback(id);
      return Array.isArray(v) ? v : String(v == null ? '' : v).trim();
    };
  }
  function datumDe(t){ const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : (t || ''); }
  function formatieren(v, art){
    if(v === '' || v == null) return '';
    let t = String(v);
    if(art === 'faktor'){ const m = /^\s*(\d+)/.exec(t); return m ? m[1] + ' × I_{Δn}' : t; }
    if(art === 'anfang'){ const m = /^\s*(\d+)/.exec(t); return m ? m[1] : t.split(/[\s-]/)[0]; }
    if(art === 'zahl'){ const m = /^(-?[\d.,]+)\s*(A|V|Ω|mA|ms|MΩ|Hz|m|kVA)?$/.exec(t); if(m) t = m[1]; }
    if(/^-?\d+(\.\d+)?$/.test(t)) t = t.replace('.', ',');
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? datumDe(t) : t;
  }
  const zahlDe = (n, st)=>Number(n).toLocaleString('de-DE', { maximumFractionDigits: st == null ? 2 : st });
  const norm = e => typeof e === 'string' ? { id:e } : e;
  const einphasig = w => w('NMESS-01-a') === '1-phasig';
  function bedingung(b, w){
    if(!b) return true;
    if(b.gleich !== undefined) return String(w(b.feld)) === b.gleich;
    return String(w(b.feld)).toLowerCase().includes(String(b.enthaelt).toLowerCase());
  }
  const feldName = id => ((typeof feldFinden === 'function' && feldFinden(id)) || { name:id }).name;

  /* ---------------- Zellen ---------------- */
  /* opt: Zusatz für FeldLogik.grenzwert (z. B. { speisepunkt:true }) */
  function zelle(e, w, leer, opt){
    const f = (typeof feldFinden === 'function' && feldFinden(e.id)) || { name:e.id };
    const z = { b:e.b || 1, label:e.label || String(f.name || e.id).replace(/\s*\([^)]*\)\s*$/, ''), fett:e.fett };
    z.einheit = e.einheit !== undefined ? e.einheit : (f.einheit || '');
    if(leer){ if(e.wahl) z.wahl = e.wahl.map(o=>({ wert:o, text:(e.kurz || {})[o] || o })); return z; }
    if((e.nurDrehstrom && einphasig(w)) || (e.ausWenn && e.ausWenn(w))){ z.status = 'aus'; z.wert = ''; z.einheit = ''; return z; }
    const v = formatieren(w(e.id), e.format || 'zahl');
    if(e.wahl){
      z.wahl = e.wahl.map(o=>({ wert:o, text:(e.kurz || {})[o] || o, farbe:(e.farbe || {})[o] }));
      if(v && !e.wahl.includes(v)) z.wahl.push({ wert:v, text:v });
      z.wert = v; return z;
    }
    z.wert = v;
    if(v && typeof FeldLogik !== 'undefined' && FeldLogik.ausserhalb(e.id, w, opt)) z.status = 'rot';
    return z;
  }
  function zellenZeilen(kasten, w, leer, opt){
    return kasten.zeilen.map(r=>{
      const def = Array.isArray(r) ? { zellen:r } : r;
      if(!leer && def.nurWenn && !bedingung(def.nurWenn, w)) return null;
      return def.zellen.map(e=>zelle(norm(e), w, leer, opt));
    }).filter(Boolean);
  }

  /* ---------------- Blöcke zeichnen (Rückgabe: neues y) ---------------- */
  function zellenKasten(P, y, k, w, leer, zh, opt){
    y = P.kastenTitel(y, k.titel, typeof k.rechts === 'function' ? k.rechts(w, leer) : (k.rechts || ''));
    zellenZeilen(k, w, leer, opt).forEach(r=>{ y += P.zellenZeile(y, r, zh); });
    if(k.legende) y += P.kleintext(y, k.legende(w, leer));
    return y;
  }
  function checkliste(P, y, C, w, leer, zh){
    y = P.kastenTitel(y, C.titel, leer ? '' : (C.rechts != null ? C.rechts : 'i.O. = in Ordnung · n.i.O. = nicht in Ordnung · n.a. = nicht anwendbar'));
    return y + P.checklisten(y, C.spalten.map(sp=>({ titel:sp.titel, optionen:sp.optionen || C.optionen,
      punkte: sp.felder.map(id=>({ text:(sp.kurz || {})[id] || feldName(id), wert: w(id) })) })), zh);
  }
  function tabelle(P, y, T, w, leer){
    y = P.kastenTitel(y, T.titel, typeof T.rechts === 'function' ? T.rechts(w, leer) : (T.rechts || ''));
    y += P.tabelleKopf(y, T.spalten);
    T.zeilen(w, leer).forEach((z, i)=>{
      const h = P.tabelleZeileHoehe(T.spalten, z, leer ? T.zhLeer : T.zh);
      P.tabelleZeile(y, T.spalten, z, h, i % 2 === 1); y += h;
    });
    if(T.legende) y += P.kleintext(y, T.legende(w, leer));
    return y;
  }

  /* Prüfablauf (zwei Spalten, Schritte mit Grenzwert, Werten und i.O./n.i.O.) – Inhalt liefert der Plan */
  function ablauf(P, y, A, w, leer){
    y = P.kastenTitel(y, A.titel, typeof A.rechts === 'function' ? A.rechts(w, leer) : (A.rechts || ''));
    y += P.ablauf(y, A.abschnitte(w, leer), { zeileMin: leer ? A.zeileMinLeer : A.zeileMin });
    if(A.legende) y += P.kleintext(y, A.legende(w, leer));
    return y;
  }

  /* ---------------- Kopf, Abschluss, Fuß ---------------- */
  function start(plan, arg, leer, infoId){
    const P = PdfLayout.neu({ leer });
    const pr = arg.protokoll || {}, st = pr.stammdaten || {};
    const w = leer ? (()=>'') : leser(pr.daten || {}, id=>id === 'STAM-05' ? pr.nummer : st[id]);
    P.kopfDaten = { titel:plan.titel, untertitel:plan.untertitel, nummer: leer ? '' : pr.nummer,
      infoLabel:plan.infoLabel, info: leer ? '' : w(infoId || plan.infoFeld || 'STAM-03') };
    let y = P.seiteNeu();
    if(!leer && arg.unvollstaendig){
      const nf = (arg.fehlend || []).length;
      y += P.band(y, 'UNVOLLSTÄNDIG – ' + nf + ' Pflichtfeld' + (nf === 1 ? '' : 'er') + ' nicht ausgefüllt. Erstellt auf ausdrückliche Entscheidung des Prüfers.', 'rot') + 2;
    }
    return { P, pr, w, y };
  }
  function abschlussFixHoehe(P, A, w, leer, zh, H){
    return PdfLayout.ABSTAND.titel + P.zellenMessen(A.zeile.map(e=>zelle(norm(e), w, leer)), zh) + H.unterschrift;
  }
  /* Abschluss bis zum Seitenende: Zeile, Bemerkung (füllt Rest), Unterschriften unten bündig */
  function abschluss(P, y, A, w, leer, zh, H, einSeite){
    const SE = PdfLayout.SEITE;
    y = P.kastenTitel(y, A.titel);
    y += P.zellenZeile(y, A.zeile.map(e=>zelle(norm(e), w, leer)), zh);
    const bemerkung = leer ? '' : w(A.bemerkung);
    const bemH = SE.inhaltEnde - y - H.unterschrift;
    const status = !bemerkung ? null : (w(A.mangelWert.feld) === A.mangelWert.gleich ? 'rot' : 'gelb');
    const erg = P.textFeld(y, bemH, 'Bemerkungen / festgestellte Mängel', bemerkung, status, { einSeite });
    y += bemH;
    const ort = (/\b\d{5}\s+([^,\n]+)/.exec(w('STAM-01-a')) || [])[1] || '';
    P.unterschriften(y, A.unterschriften.map(u=>({ titel:u.titel, unterzeile:u.unterzeile + (u.name && w(u.name) ? ' · ' + w(u.name) : ''),
      bild: w(u.id), ortDatum:[ort.trim(), datumDe(w('STAM-08'))].filter(Boolean).join(', ') })), H.unterschrift);
    return { y: y + H.unterschrift, rest: erg.rest, status };
  }

  /* Fotodokumentation: liste [{ src, text }] – eigene Seiten, spalten × zeilen je Seite */
  function fotos(P, liste, F){
    liste = liste.filter(f=>typeof f.src === 'string' && f.src.startsWith('data:image/'));
    if(!liste.length) return 0;
    const SE = PdfLayout.SEITE, proSeite = F.spalten * F.zeilen, luft = 3;
    for(let s = 0; s < liste.length; s += proSeite){
      let y = P.seiteNeu();
      y = P.kastenTitel(y, (F.titel || 'Fotodokumentation') + (liste.length > proSeite ? ' (' + (s / proSeite + 1) + '/' + Math.ceil(liste.length / proSeite) + ')' : ''),
        liste.length + ' Foto' + (liste.length === 1 ? '' : 's')) + luft;
      const bw = (SE.breite - (F.spalten - 1) * luft) / F.spalten, bh = (SE.inhaltEnde - y - (F.zeilen - 1) * luft) / F.zeilen;
      liste.slice(s, s + proSeite).forEach((f, k)=>{
        const c = k % F.spalten, r = Math.floor(k / F.spalten);
        P.foto(SE.links + c * (bw + luft), y + r * (bh + luft), bw, bh, f.src, f.text);
      });
    }
    return liste.length;
  }
  /* Fotos eines Feldes (Liste von Data-URLs) mit Beschriftung „<präfix> – Foto i von n“ */
  function fotoListe(bilder, praefix){
    const b = Array.isArray(bilder) ? bilder.filter(s=>typeof s === 'string' && s.startsWith('data:image/')) : [];
    return b.map((src, j)=>({ src, text:(praefix ? praefix + ' – ' : '') + 'Foto ' + (j + 1) + ' von ' + b.length }));
  }

  function fertig(P, plan, pr, w, leer, arg, namensteil){
    const jetzt = new Date();
    const fuss = (leer ? 'Leerformular · ' : '') + APP_NAME + ' v' + APP_VERSION + ' · erstellt ' +
      jetzt.toLocaleDateString('de-DE') + ' ' + jetzt.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
    const seiten = P.abschliessen(fuss);
    P.doc.setProperties({ title: plan.titel + (leer ? ' – Leerformular' : ' ' + (pr.nummer || '')), subject:plan.untertitel, creator:APP_NAME + ' ' + APP_VERSION });
    const name = leer ? plan.datei + '_Leerformular' :
      [plan.datei, String(pr.nummer || '').replace(/\//g, '-'), String(namensteil || '').slice(0, 40)].filter(Boolean).join('_') + (arg.unvollstaendig ? '_UNVOLLSTAENDIG' : '');
    return { blob:P.blob(), dateiname:name.replace(/\s+/g, '_') + '.pdf', seiten };
  }

  /* ---------------- Einseitiges Protokoll aus Blöcken ---------------- */
  async function einseitig(plan, arg, leer){
    await PdfLayout.laden();
    const AB = PdfLayout.ABSTAND, H = plan.hoehe;
    const { P, pr, w, y:y0 } = start(plan, arg, leer);
    const zh = leer ? H.zelleLeer : H.zelle, opt = plan.grenzwertOpt;
    let y = y0;
    plan.bloecke.forEach(b=>{
      if(b.art === 'zellen') y = zellenKasten(P, y, b, w, leer, zh, opt);
      else if(b.art === 'checkliste') y = checkliste(P, y, b, w, leer, leer ? H.checkLeer : H.check);
      else if(b.art === 'tabelle') y = tabelle(P, y, b, w, leer);
      else if(b.art === 'ablauf') y = ablauf(P, y, b, w, leer);
      y += AB.box;
    });
    /* Sicherung: der Abschluss braucht Mindestplatz – sonst ist der Plan zu voll (Fehler statt 2. Seite) */
    const bemMin = leer ? 3.8 + 2 * 6.8 + 1.5 : P.textFeldHoehe('', 2);
    const frei = PdfLayout.SEITE.inhaltEnde - y - abschlussFixHoehe(P, plan.abschluss, w, leer, zh, H) - bemMin;
    if(frei < 0) throw new Error('PDF-Plan „' + plan.titel + '“ passt nicht auf eine Seite (' + Math.round(-frei) + ' mm zu viel).');
    abschluss(P, y, plan.abschluss, w, leer, zh, H, true);
    const nFotos = leer || !plan.fotos ? 0 : fotos(P, fotoListe(w(plan.fotos.feld), plan.fotos.beschriftung ? plan.fotos.beschriftung(w) : ''), plan.fotos);
    const r = fertig(P, plan, pr, w, leer, arg, plan.namensFeld ? w(plan.namensFeld) : '');
    r.fotos = nFotos;
    return r;
  }

  /* ---------------- Speichern + Meldung (Aufruf aus protokoll-seite.js) ---------------- */
  async function speichern(r, inhalt){
    const s = await Speicher.pdfSpeichern(r.blob, r.dateiname);
    const seiten = r.seiten + (r.seiten === 1 ? ' Seite' : ' Seiten');
    /* blob + dateiname: protokoll-seite.js legt ausgefüllte PDFs damit im Archiv ab */
    return { ok:true, seiten:r.seiten, blob:r.blob, dateiname:s.dateiname,
      meldung:'PDF erstellt – ' + seiten + (inhalt ? ', ' + inhalt : '') + '. Gespeichert als „' + s.dateiname + '“' +
        (s.ort === 'ordner' ? ' im Ordner „' + s.ordnerName + '“.' : ' (Download).') + (s.hinweis ? ' ' + s.hinweis : '') };
  }
  const fotoText = n => n ? ' + Fotodokumentation (' + n + ' Foto' + (n === 1 ? '' : 's') + ')' : '';

  return { leser, datumDe, formatieren, zahlDe, norm, bedingung, feldName, zelle, zellenZeilen,
    zellenKasten, checkliste, tabelle, ablauf, start, abschlussFixHoehe, abschluss, fotos, fotoListe, fertig,
    einseitig, speichern, fotoText };
})();
