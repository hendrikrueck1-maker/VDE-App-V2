/* =========================================================================
   PDF-Layout-Engine – EIN Zeichencode für alle Protokoll-PDFs (Anlage, später
   Anschluss und Geräte). Kennt keine Feld-IDs, nur Zellen, Tabellen und Kästen.
   Was wo steht, legt der PDF-Plan des Protokolls fest (z. B. js/pdf-anlage.js).

   Maße in mm, Schriftgrößen in pt. A4 hoch, Rand links 20 mm (Lochung), sonst 10 mm.
   Nutzbare Breite 180 mm. Alle Breitenangaben (b) in Plänen sind GEWICHTE und
   werden auf die verfügbare Breite umgerechnet → Summen müssen nicht exakt stimmen.

   Tiefgestellt: 'R_{PE}' → R mit tiefgestelltem PE (Kopfzeilen, Legenden, Labels).

   Hier ändern:  Ränder SEITE · Abstände ABSTAND · Schriftgrößen SCHRIFT · Farben FARBE
   Schnittstelle PdfLayout.laden() → PdfLayout.neu({ leer }) → Dok (siehe unten)
   ========================================================================= */
const PdfLayout = (function(){
  'use strict';

  const SEITE = { b:210, h:297, links:20, rechts:10, oben:10, inhaltEnde:283, fussY:289 };
  SEITE.breite = SEITE.b - SEITE.links - SEITE.rechts;          /* 180 mm */
  const ABSTAND = { box:3, pad:1.6, titel:5.2 };                  /* Kasten-Abstand, Zell-Innenabstand, Kastentitel */
  const SCHRIFT = { titel:12, untertitel:7.5, info:7, boxTitel:7.8, label:5.6, wert:8, wahl:6.6,
                    tabelle:6.5, tabKopf:6, legende:5.8, fuss:5.8, bemerkung:7.5 };
  const FARBE = {
    primaer:[0,51,102], text:[15,23,42], label:[71,85,105], grau:[100,116,139], hell:[148,163,184],
    rahmen:[203,213,225], rahmenDunkel:[148,163,184], titelBg:[241,245,249], kopfBg:[226,232,240], zebra:[248,250,252],
    rotBg:[254,226,226], rotText:[153,27,27], gelbBg:[254,249,195], gelbText:[113,63,6],
    gruenText:[22,101,52], gruenBg:[220,252,231], weiss:[255,255,255]
  };
  const PT = 0.3528;                                  /* mm je pt */
  const kap = s => s * PT * 0.72;                     /* Versalhöhe */
  const zeile = s => s * PT * 1.28;                   /* Zeilenabstand */

  /* ---------------- Laden (jsPDF + Schrift erst bei Bedarf, relativ zu dieser Datei) ---------------- */
  const BASIS = ((document.currentScript && document.currentScript.src) || '').replace(/js\/pdf-layout\.js(\?.*)?$/, '');
  function skript(src){
    return new Promise((ok, fehler)=>{
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = ()=>fehler(new Error('Datei „' + src + '“ konnte nicht geladen werden.'));
      document.head.append(s);
    });
  }
  async function laden(){
    if(!(window.jspdf && window.jspdf.jsPDF)) await skript(BASIS + 'js/lib/jspdf.umd.min.js');
    if(typeof PDF_SCHRIFT === 'undefined') await skript(BASIS + 'js/pdf-schrift.js');
  }

  /* ---------------- Text mit Tiefstellung ---------------- */
  function teile(str){
    const t = String(str == null ? '' : str), out = [];
    const re = /_\{([^}]*)\}/g; let m, i = 0;
    while((m = re.exec(t))){ if(m.index > i) out.push({ t:t.slice(i, m.index) }); out.push({ t:m[1], sub:true }); i = re.lastIndex; }
    if(i < t.length) out.push({ t:t.slice(i) });
    return out;
  }
  const ohneMarken = s => String(s == null ? '' : s).replace(/_\{([^}]*)\}/g, '$1');

  class Dok {
    constructor(opt){
      const { jsPDF } = window.jspdf;
      this.doc = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait', compress:true });
      const d = this.doc;
      d.addFileToVFS('LS-normal.ttf', PDF_SCHRIFT.normal); d.addFont('LS-normal.ttf', PDF_SCHRIFT.name, 'normal');
      d.addFileToVFS('LS-fett.ttf', PDF_SCHRIFT.fett);     d.addFont('LS-fett.ttf', PDF_SCHRIFT.name, 'bold');
      this.leer = !!(opt && opt.leer);
      this.y = SEITE.oben;
      this.kopfDaten = null;
    }

    /* ---- Grundfunktionen ---- */
    schrift(s, fett, farbe){
      this.doc.setFont(PDF_SCHRIFT.name, fett ? 'bold' : 'normal');
      this.doc.setFontSize(s);
      const f = farbe || FARBE.text; this.doc.setTextColor(f[0], f[1], f[2]);
    }
    breite(str, s, fett){
      let w = 0;
      teile(str).forEach(p=>{ this.schrift(p.sub ? s * 0.72 : s, fett); w += this.doc.getTextWidth(p.t); });
      return w;
    }
    /* y = Grundlinie; opt: { s, fett, farbe, ausr:'links'|'mitte'|'rechts' } */
    text(str, x, y, opt){
      const o = opt || {}, s = o.s || SCHRIFT.wert;
      const w = this.breite(str, s, o.fett);
      let cx = o.ausr === 'rechts' ? x - w : o.ausr === 'mitte' ? x - w / 2 : x;
      teile(str).forEach(p=>{
        const gs = p.sub ? s * 0.72 : s;
        this.schrift(gs, o.fett, o.farbe);
        this.doc.text(p.t, cx, p.sub ? y + s * PT * 0.22 : y);
        cx += this.doc.getTextWidth(p.t);
      });
      return w;
    }
    /* Zeilenumbruch nach Wörtern (berücksichtigt Tiefstellung und \n), zu lange Wörter werden getrennt */
    umbrechen(str, maxW, s, fett){
      const zeilen = [];
      String(str == null ? '' : str).split(/\r?\n/).forEach(absatz=>{
        const woerter = absatz.split(/ +/); let akt = '';
        woerter.forEach(wort=>{
          const probe = akt ? akt + ' ' + wort : wort;
          if(this.breite(probe, s, fett) <= maxW){ akt = probe; return; }
          if(akt) zeilen.push(akt);
          akt = wort;
          while(this.breite(akt, s, fett) > maxW && akt.length > 1){          /* Wort länger als Zeile */
            let n = akt.length - 1;
            while(n > 1 && this.breite(akt.slice(0, n), s, fett) > maxW) n--;
            zeilen.push(akt.slice(0, n)); akt = akt.slice(n);
          }
        });
        zeilen.push(akt);
      });
      return zeilen;
    }
    /* Tabellenzelle: erst leicht verkleinern (bis 1 pt), dann umbrechen */
    zellLayout(text, maxW, s, fett){
      const t = String(text == null ? '' : text);
      if(!t.includes('\n')){
        for(let g = s; g >= s - 1.001; g -= 0.2) if(this.breite(t, g, fett) <= maxW) return { s:g, zeilen:[t] };
      }
      /* Schrift so wählen, dass kein Wort mitten drin getrennt werden muss (höchstens 1 pt kleiner) */
      const laengstes = t.split(/\s+/).reduce((a, b)=>b.length > a.length ? b : a, '');
      let g = s;
      while(g > s - 1.001 && this.breite(laengstes, g, fett) > maxW) g -= 0.2;
      return { s:g, zeilen:this.umbrechen(t, maxW, g, fett) };
    }
    rechteck(x, y, w, h, o){
      const d = this.doc, opt = o || {};
      if(opt.fuell) d.setFillColor(...opt.fuell);
      if(opt.rand !== false){ d.setDrawColor(...(opt.rand || FARBE.rahmen)); d.setLineWidth(opt.dicke || 0.2); }
      const stil = opt.fuell ? (opt.rand === false ? 'F' : 'FD') : 'S';
      if(opt.radius) d.roundedRect(x, y, w, h, opt.radius, opt.radius, stil); else d.rect(x, y, w, h, stil);
    }
    linie(x1, y1, x2, y2, o){
      const d = this.doc, opt = o || {};
      d.setDrawColor(...(opt.farbe || FARBE.rahmen)); d.setLineWidth(opt.dicke || 0.2);
      if(opt.gestrichelt) d.setLineDashPattern([0.6, 0.8], 0);
      d.line(x1, y1, x2, y2);
      if(opt.gestrichelt) d.setLineDashPattern([], 0);
    }
    /* Ankreuzkästchen, x/y = linke obere Ecke; an = Kreuz */
    kaestchen(x, y, g, an, farbe){
      this.rechteck(x, y, g, g, { rand:FARBE.rahmenDunkel, dicke:0.25, fuell:FARBE.weiss });
      if(!an) return;
      const f = farbe || FARBE.text, e = g * 0.2;
      this.linie(x + e, y + e, x + g - e, y + g - e, { farbe:f, dicke:0.35 });
      this.linie(x + g - e, y + e, x + e, y + g - e, { farbe:f, dicke:0.35 });
    }

    /* ---- Auswahl als Ankreuzkästchen (Leerformular UND ausgefüllt gleich) ----
       optionen: [{ wert, text }], gewaehlt: wert · Umbruch, wenn die Breite nicht reicht.
       Rückgabe: benötigte Höhe. zeichnen=false → nur messen. */
    wahl(x, y, maxW, optionen, gewaehlt, zeichnen, s){
      const g = 2.3, luft = 0.9, abst = 2.6, sg = s || SCHRIFT.wahl, zh = Math.max(g, kap(sg)) + 1.2;
      let cx = x, cy = y;
      optionen.forEach(o=>{
        const an = gewaehlt != null && gewaehlt !== '' && o.wert === gewaehlt;
        const w = g + luft + this.breite(o.text, sg, an);
        if(cx > x && cx + w > x + maxW){ cx = x; cy += zh; }
        if(zeichnen !== false){
          const farbe = an && o.farbe ? FARBE[o.farbe] : FARBE.text;
          this.kaestchen(cx, cy, g, an, farbe);
          this.text(o.text, cx + g + luft, cy + g / 2 + kap(sg) / 2, { s:sg, fett:an, farbe: an ? farbe : FARBE.label });
        }
        cx += w + abst;
      });
      return cy - y + g;
    }

    /* ---- Seite ---- */
    seiteNeu(){
      if(this.seiteBegonnen) this.doc.addPage('a4', 'portrait');
      this.seiteBegonnen = true;
      this.y = this.kopf(this.kopfDaten);
      return this.y;
    }
    platz(){ return SEITE.inhaltEnde - this.y; }

    /* Seitenkopf: Titel links, Info-Kasten rechts (Seitenzahl wird am Ende eingesetzt) */
    kopf(k){
      const L = SEITE.links, R = SEITE.b - SEITE.rechts, boxW = 62, boxX = R - boxW, top = SEITE.oben;
      this.text(k.titel, L, top + kap(SCHRIFT.titel), { s:SCHRIFT.titel, fett:true, farbe:FARBE.primaer });
      let uy = top + kap(SCHRIFT.titel) + 4.2;
      this.umbrechen(k.untertitel, boxX - L - 4, SCHRIFT.untertitel).forEach(z=>{
        this.text(z, L, uy, { s:SCHRIFT.untertitel, farbe:FARBE.label }); uy += zeile(SCHRIFT.untertitel);
      });
      const boxH = 15;
      this.rechteck(boxX, top, boxW, boxH, { radius:1, rand:FARBE.primaer, dicke:0.3 });
      const zeilen = [['Protokoll-Nr.', k.nummer, true], [k.infoLabel || 'Anlage / Objekt', k.info, false], ['Seite', '', false]];
      const lx = boxX + 2.2, vx = boxX + 20;
      zeilen.forEach(([lab, wert, fett], i)=>{
        const by = top + 3.9 + i * 4.3;
        this.text(lab, lx, by, { s:SCHRIFT.label + 0.4, farbe:FARBE.label });
        if(this.leer && i < 2) this.linie(vx, by + 0.6, boxX + boxW - 2.2, by + 0.6, { farbe:FARBE.hell, gestrichelt:true });
        else if(wert){
          const maxW = boxX + boxW - 2.2 - vx; let t = String(wert), s = fett ? SCHRIFT.info + 0.5 : SCHRIFT.info;
          while(this.breite(t, s, fett) > maxW && t.length > 3) t = t.slice(0, -2) + '…';
          this.text(t, vx, by, { s, fett });
        }
      });
      const linieY = Math.max(uy - zeile(SCHRIFT.untertitel) + 2.4, top + boxH + 2);
      this.linie(L, linieY, R, linieY, { farbe:FARBE.primaer, dicke:0.5 });
      this.seitenInfoY = top + 3.9 + 2 * 4.3; this.seitenInfoX = vx;
      return linieY + ABSTAND.box;
    }

    /* Seitenzahlen + Fußzeile auf allen Seiten (am Ende aufrufen) */
    abschliessen(fussLinks){
      const n = this.doc.getNumberOfPages();
      for(let i = 1; i <= n; i++){
        this.doc.setPage(i);
        this.text(i + ' von ' + n, this.seitenInfoX, this.seitenInfoY, { s:SCHRIFT.info, fett:true });
        this.linie(SEITE.links, SEITE.fussY - 3, SEITE.b - SEITE.rechts, SEITE.fussY - 3, { farbe:FARBE.rahmen });
        this.text(fussLinks, SEITE.links, SEITE.fussY, { s:SCHRIFT.fuss, farbe:FARBE.grau });
        this.text('Seite ' + i + ' von ' + n, SEITE.b - SEITE.rechts, SEITE.fussY, { s:SCHRIFT.fuss, farbe:FARBE.grau, ausr:'rechts' });
      }
      return n;
    }

    /* ---- Kasten: Titelleiste; Inhalt zeichnet der Aufrufer unter `innen` ---- */
    kastenTitel(y, titel, rechts){
      const L = SEITE.links, W = SEITE.breite;
      this.rechteck(L, y, W, ABSTAND.titel, { fuell:FARBE.titelBg, rand:FARBE.rahmen });
      this.rechteck(L, y, 1.2, ABSTAND.titel, { fuell:FARBE.primaer, rand:false });
      const by = y + ABSTAND.titel / 2 + kap(SCHRIFT.boxTitel) / 2;
      this.text(titel, L + 3, by, { s:SCHRIFT.boxTitel, fett:true, farbe:FARBE.primaer });
      if(rechts) this.text(rechts, L + W - 2, by, { s:SCHRIFT.label + 0.6, farbe:FARBE.label, ausr:'rechts' });
      return y + ABSTAND.titel;
    }

    /* ---- Zellenzeile (Formular-Stil: Label oben klein, Wert darunter) ----
       zellen: [{ b, label, wert, einheit, wahl:[{wert,text,farbe}], status:'rot'|'gelb'|'aus' }]
       Rückgabe: Höhe. zeichnen=false → nur messen. */
    zellenMessen(zellen, hMin){
      const breiten = gewichte(zellen.map(z=>z.b || 1), SEITE.breite);
      let h = hMin;
      zellen.forEach((z, i)=>h = Math.max(h, this.zelle(0, 0, breiten[i], hMin, z, false)));
      return h;
    }
    zellenZeile(y, zellen, hMin){
      const h = this.zellenMessen(zellen, hMin);
      const breiten = gewichte(zellen.map(z=>z.b || 1), SEITE.breite);
      let x = SEITE.links;
      zellen.forEach((z, i)=>{ this.zelle(x, y, breiten[i], h, z, true); x += breiten[i]; });
      return h;
    }
    zelle(x, y, w, h, z, zeichnen){
      const P = ABSTAND.pad, innenW = w - 2 * P;
      const labY = y + 1.1 + kap(SCHRIFT.label), wertTop = y + 3.6;
      if(zeichnen){
        const fuell = z.status === 'rot' ? FARBE.rotBg : z.status === 'gelb' ? FARBE.gelbBg : null;
        this.rechteck(x, y, w, h, { fuell, rand:FARBE.rahmen });
        this.text(this.passend(z.label, innenW, SCHRIFT.label), x + P, labY, { s:SCHRIFT.label, farbe:FARBE.label });
      }
      if(z.wahl){
        const bh = this.wahl(x + P, wertTop + 0.6, innenW, z.wahl, this.leer ? null : z.wert, false);
        const frei = h - (wertTop - y) - 0.9;
        const off = zeichnen ? Math.max(0.6, (frei - bh) / 2) : 0.6;
        if(zeichnen) this.wahl(x + P, wertTop + off, innenW, z.wahl, this.leer ? null : z.wert, true);
        return (wertTop - y) + bh + 1.5;
      }
      const einheit = z.einheit ? ' ' + z.einheit : '';
      if(this.leer || z.wert === '' || z.wert == null){
        if(zeichnen && z.einheit) this.text(z.einheit, x + w - P, y + h - 1.6, { s:SCHRIFT.label + 0.6, farbe:FARBE.hell, ausr:'rechts' });
        if(zeichnen && !this.leer && z.status === 'aus') this.text('–', x + P, y + h - 1.9, { s:SCHRIFT.wert, farbe:FARBE.hell });
        return h;
      }
      const farbe = z.status === 'rot' ? FARBE.rotText : z.status === 'gelb' ? FARBE.gelbText : FARBE.text;
      const fett = z.status === 'rot' || z.fett;
      let s = SCHRIFT.wert, zeilen = [String(z.wert) + einheit];
      while(this.breite(zeilen[0], s, fett) > innenW && s > 6.3) s -= 0.3;
      if(this.breite(zeilen[0], s, fett) > innenW) zeilen = this.umbrechen(String(z.wert) + einheit, innenW, s, fett);
      const hoehe = (wertTop - y) + zeilen.length * zeile(s) + 1.2;
      if(zeichnen){
        const block = zeilen.length * zeile(s), top = wertTop + Math.max(0, (h - (wertTop - y) - block) / 2 - 0.3);
        zeilen.forEach((t, i)=>this.text(t, x + P, top + i * zeile(s) + kap(s) + 0.35, { s, fett, farbe }));
      }
      return Math.max(h, hoehe);
    }
    /* Einzeiliges Label kürzen, falls es nicht passt (Labels kommen aus dem Plan, sollten passen) */
    passend(t, maxW, s){
      let x = String(t || '');
      if(this.breite(x, s) <= maxW) return x;
      while(x.length > 3 && this.breite(x + '…', s) > maxW) x = x.slice(0, -1);
      return x + '…';
    }

    /* ---- Checklisten nebeneinander (Besichtigen, Erproben …) ----
       spalten: [{ titel, optionen:[text], punkte:[{ text, wert }] }] · Rückgabe: Höhe */
    checklisten(y, spalten, zh, zeichnen){
      const n = spalten.length, W = SEITE.breite / n, optW = 8.4, kopfH = 4.6;
      const zeilenMax = Math.max(...spalten.map(s=>s.punkte.length));
      const h = kopfH + zeilenMax * zh;
      if(zeichnen === false) return h;
      spalten.forEach((sp, si)=>{
        const x0 = SEITE.links + si * W, labW = W - sp.optionen.length * optW;
        this.rechteck(x0, y, W, kopfH, { fuell:FARBE.kopfBg, rand:FARBE.rahmen });
        this.text(sp.titel || '', x0 + ABSTAND.pad, y + kopfH / 2 + kap(SCHRIFT.tabKopf) / 2, { s:SCHRIFT.tabKopf, fett:true, farbe:FARBE.primaer });
        sp.optionen.forEach((o, oi)=>this.text(o, x0 + labW + oi * optW + optW / 2, y + kopfH / 2 + kap(SCHRIFT.tabKopf) / 2, { s:SCHRIFT.tabKopf, fett:true, farbe:FARBE.label, ausr:'mitte' }));
        for(let r = 0; r < zeilenMax; r++){
          const ry = y + kopfH + r * zh, p = sp.punkte[r];
          this.rechteck(x0, ry, W, zh, { fuell: r % 2 ? FARBE.zebra : null, rand:FARBE.rahmen });
          if(!p) continue;
          const mangel = !this.leer && p.wert === 'n.i.O.';
          let s = SCHRIFT.wahl + 0.2;
          while(this.breite(p.text, s, mangel) > labW - 2 * ABSTAND.pad && s > 5.4) s -= 0.2;
          this.text(p.text, x0 + ABSTAND.pad, ry + zh / 2 + kap(s) / 2, { s, fett:mangel, farbe: mangel ? FARBE.rotText : FARBE.text });
          if(mangel) this.rechteck(x0 + labW, ry, W - labW, zh, { fuell:FARBE.rotBg, rand:FARBE.rahmen });
          sp.optionen.forEach((o, oi)=>{
            const g = 2.5, cx = x0 + labW + oi * optW + optW / 2 - g / 2, cy = ry + zh / 2 - g / 2;
            const an = !this.leer && p.wert === o;
            this.kaestchen(cx, cy, g, an, an && o === 'n.i.O.' ? FARBE.rotText : FARBE.text);
          });
        }
        if(si) this.linie(x0, y, x0, y + h, { farbe:FARBE.rahmenDunkel, dicke:0.35 });
      });
      return h;
    }

    /* ---- Tabelle mit Gruppenkopf ----
       spalten: [{ kopf, gruppe, b, ausr }] · zeilen: [{ zellen:[{ text, status, fett }], verbunden?:{ von, bis, text, status } }]
       Zeilenhöhe = max. Textzeilen (Umbruch je Zelle). */
    tabelleVorbereiten(spalten){
      return gewichte(spalten.map(s=>s.b || 1), SEITE.breite);
    }
    tabelleKopfHoehe(spalten){
      const breiten = this.tabelleVorbereiten(spalten);
      const zeilenMax = Math.max(...spalten.map((s, i)=>this.umbrechen(s.kopf, breiten[i] - 1, SCHRIFT.tabKopf, true).length));
      return (spalten.some(s=>s.gruppe) ? 4 : 0) + Math.max(5, zeilenMax * zeile(SCHRIFT.tabKopf) + 2);
    }
    tabelleKopf(y, spalten){
      const breiten = this.tabelleVorbereiten(spalten);
      const gH = spalten.some(s=>s.gruppe) ? 4 : 0, kH = this.tabelleKopfHoehe(spalten) - gH;
      let x = SEITE.links;
      /* Gruppenzeile: gleiche aufeinanderfolgende Gruppen verbinden */
      for(let i = 0; i < spalten.length;){
        let j = i, w = 0;
        while(j < spalten.length && spalten[j].gruppe === spalten[i].gruppe){ w += breiten[j]; j++; }
        if(gH){
          this.rechteck(x, y, w, gH, { fuell:FARBE.titelBg, rand:FARBE.rahmen });
          if(spalten[i].gruppe) this.text(this.passend(spalten[i].gruppe, w - 1.5, SCHRIFT.tabKopf), x + w / 2, y + gH / 2 + kap(SCHRIFT.tabKopf) / 2, { s:SCHRIFT.tabKopf, fett:true, farbe:FARBE.primaer, ausr:'mitte' });
        }
        x += w; i = j;
      }
      x = SEITE.links;
      spalten.forEach((s, i)=>{
        const w = breiten[i];
        this.rechteck(x, y + gH, w, kH, { fuell:FARBE.kopfBg, rand:FARBE.rahmen });
        const zl = this.umbrechen(s.kopf, w - 1, SCHRIFT.tabKopf, true);
        const top = y + gH + (kH - zl.length * zeile(SCHRIFT.tabKopf)) / 2;
        zl.forEach((t, k)=>this.text(t, x + w / 2, top + k * zeile(SCHRIFT.tabKopf) + kap(SCHRIFT.tabKopf) + 0.3, { s:SCHRIFT.tabKopf, fett:true, farbe:FARBE.text, ausr:'mitte' }));
        x += w;
      });
      return gH + kH;
    }
    tabelleZeileHoehe(spalten, z, hMin){
      const breiten = this.tabelleVorbereiten(spalten), s = SCHRIFT.tabelle;
      let n = 1;
      spalten.forEach((sp, i)=>{
        if(z.verbunden && i >= z.verbunden.von && i <= z.verbunden.bis) return;
        const c = z.zellen[i]; if(!c || !c.text) return;
        n = Math.max(n, this.zellLayout(c.text, breiten[i] - 1.4, s, c.fett || c.status === 'rot').zeilen.length);
      });
      if(z.verbunden){
        const w = breiten.slice(z.verbunden.von, z.verbunden.bis + 1).reduce((a, b)=>a + b, 0);
        n = Math.max(n, this.umbrechen(z.verbunden.text, w - 2 * ABSTAND.pad, s, true).length);
      }
      return Math.max(hMin, n * zeile(s) + 2.3);
    }
    tabelleZeile(y, spalten, z, h, zebra){
      const breiten = this.tabelleVorbereiten(spalten), s = SCHRIFT.tabelle;
      let x = SEITE.links;
      const zellText = (text, cx, w, ausr, fett, farbe)=>{
        const { s:g, zeilen:zl } = this.zellLayout(text, w - 1.4, s, fett);
        const top = y + (h - zl.length * zeile(g)) / 2;
        zl.forEach((t, k)=>{
          const by = top + k * zeile(g) + kap(g) + 0.35;
          if(ausr === 'links') this.text(t, cx + 1, by, { s:g, fett, farbe });
          else this.text(t, cx + w / 2, by, { s:g, fett, farbe, ausr:'mitte' });
        });
      };
      spalten.forEach((sp, i)=>{
        const w = breiten[i];
        if(z.verbunden && i > z.verbunden.von && i <= z.verbunden.bis){ x += w; return; }
        if(z.verbunden && i === z.verbunden.von){
          const vw = breiten.slice(z.verbunden.von, z.verbunden.bis + 1).reduce((a, b)=>a + b, 0);
          const v = z.verbunden;
          this.rechteck(x, y, vw, h, { fuell: v.status === 'rot' ? FARBE.rotBg : (zebra ? FARBE.zebra : null), rand:FARBE.rahmen });
          zellText(v.text, x + ABSTAND.pad - 1, vw - 2 * ABSTAND.pad + 2, 'links', true, v.status === 'rot' ? FARBE.rotText : FARBE.text);
          x += w; return;
        }
        const c = z.zellen[i] || {};
        const fuell = c.status === 'rot' ? FARBE.rotBg : c.status === 'gruen' ? FARBE.gruenBg : (zebra ? FARBE.zebra : null);
        this.rechteck(x, y, w, h, { fuell, rand:FARBE.rahmen });
        if(c.text){
          const farbe = c.status === 'rot' ? FARBE.rotText : c.status === 'gruen' ? FARBE.gruenText : c.status === 'aus' ? FARBE.hell : FARBE.text;
          zellText(c.text, x, w, sp.ausr, c.fett || c.status === 'rot', farbe);
        }
        x += w;
      });
    }

    /* ---- Freitextfeld (Bemerkung) mit fester Höhe; leer → Schreiblinien ----
       Rückgabe: { passt, rest } – rest = Text, der nicht mehr hineinpasst */
    /* opt.einSeite: nie Folgeseite – Schrift bis 5,6 pt verkleinern, notfalls kürzen (mit Hinweis) */
    textFeld(y, h, label, text, status, opt){
      const L = SEITE.links, W = SEITE.breite, P = ABSTAND.pad + 0.6;
      const fuell = status === 'rot' ? FARBE.rotBg : status === 'gelb' ? FARBE.gelbBg : null;
      this.rechteck(L, y, W, h, { fuell, rand:FARBE.rahmen });
      this.text(label, L + ABSTAND.pad, y + 1.1 + kap(SCHRIFT.label), { s:SCHRIFT.label, farbe:FARBE.label });
      const top = y + 3.8;
      if(this.leer){
        for(let ly = top + 6.2; ly < y + h - 1.5; ly += 6.8) this.linie(L + P, ly, L + W - P, ly, { farbe:FARBE.rahmen, gestrichelt:true });
        return { rest:'' };
      }
      let s = SCHRIFT.bemerkung, zl, max;
      const messen = ()=>{ zl = this.umbrechen(text || '', W - 2 * P, s); max = Math.max(1, Math.floor((y + h - top - 1) / zeile(s))); };
      messen();
      if(opt && opt.einSeite) while(zl.length > max && s > 5.6){ s = Math.max(5.6, s - 0.3); messen(); }
      const farbe = status === 'rot' ? FARBE.rotText : status === 'gelb' ? FARBE.gelbText : FARBE.text;
      const zu = zl.length > max, gekuerzt = zu && opt && opt.einSeite;
      if(gekuerzt) zl[max - 1] = this.passend(zl[max - 1] + ' …', W - 2 * P - 1, s);
      zl.slice(0, max).forEach((t, i)=>this.text(t, L + P, top + i * zeile(s) + kap(s) + 0.4, { s, farbe }));
      if(zu) this.text(gekuerzt ? 'Text gekürzt – vollständig in der App gespeichert' : 'Fortsetzung auf Folgeseite →', L + W - ABSTAND.pad, y + 1.1 + kap(SCHRIFT.label), { s:SCHRIFT.label + 0.4, fett:true, farbe, ausr:'rechts' });
      return { rest: zu && !gekuerzt ? zl.slice(max).join('\n') : '' };
    }
    textFeldHoehe(text, minZeilen){
      const s = SCHRIFT.bemerkung, n = Math.max(minZeilen || 1, this.umbrechen(text || '', SEITE.breite - 2 * (ABSTAND.pad + 0.6), s).length);
      return 3.8 + n * zeile(s) + 1.6;
    }

    /* ---- Unterschriften nebeneinander ----
       felder: [{ titel, bild (PNG-Data-URL), ortDatum, name }] */
    unterschriften(y, felder, h){
      const W = SEITE.breite / felder.length, P = ABSTAND.pad + 0.6;
      felder.forEach((f, i)=>{
        const x = SEITE.links + i * W;
        this.rechteck(x, y, W, h, { rand:FARBE.rahmen });
        this.text(f.titel, x + ABSTAND.pad, y + 1.1 + kap(SCHRIFT.label), { s:SCHRIFT.label, farbe:FARBE.label });
        const ly = y + h - 4.6;
        const mitte = x + W * 0.42;
        this.linie(x + P, ly, mitte - 2, ly, { farbe:FARBE.rahmenDunkel, dicke:0.25 });
        this.linie(mitte + 2, ly, x + W - P, ly, { farbe:FARBE.rahmenDunkel, dicke:0.25 });
        this.text('Ort, Datum', x + P, ly + 2.8, { s:SCHRIFT.label, farbe:FARBE.grau });
        this.text(f.unterzeile || 'Unterschrift', mitte + 2, ly + 2.8, { s:SCHRIFT.label, farbe:FARBE.grau });
        if(this.leer) return;
        if(f.ortDatum) this.text(this.passend(f.ortDatum, mitte - 2 - x - P, SCHRIFT.wert - 0.5), x + P, ly - 1.4, { s:SCHRIFT.wert - 0.5 });
        if(f.bild && /^data:image\/(png|jpe?g)/i.test(f.bild)){
          try{
            const maxW = Math.min(38, x + W - P - mitte - 2), maxH = Math.min(12, ly - y - 4.2);
            const m = this.bildMasse(f.bild, maxW, maxH);
            this.doc.addImage(f.bild, /png/i.test(f.bild.slice(0, 20)) ? 'PNG' : 'JPEG', mitte + 2, ly - 0.6 - m.h, m.w, m.h, undefined, 'FAST');
          }catch(e){ console.warn('Unterschrift nicht lesbar', e); }
        }
      });
      return h;
    }

    /* object-fit: contain – Seitenverhältnis bleibt, nie verzerrt */
    bildMasse(src, maxW, maxH){
      const p = this.doc.getImageProperties(src);
      const k = Math.min(maxW / p.width, maxH / p.height);
      return { w:p.width * k, h:p.height * k };
    }
    /* Foto in ein Feld einpassen, zentriert, mit Bildunterschrift */
    foto(x, y, w, h, src, unterschrift){
      const capH = 4.2;
      this.rechteck(x, y, w, h, { rand:FARBE.rahmen });
      try{
        const m = this.bildMasse(src, w - 2, h - capH - 2);
        this.doc.addImage(src, /png/i.test(src.slice(0, 20)) ? 'PNG' : 'JPEG', x + (w - m.w) / 2, y + 1 + (h - capH - 2 - m.h) / 2, m.w, m.h, undefined, 'FAST');
      }catch(e){ this.text('Foto nicht lesbar', x + w / 2, y + h / 2, { s:SCHRIFT.tabelle, farbe:FARBE.grau, ausr:'mitte' }); }
      this.linie(x, y + h - capH, x + w, y + h - capH, { farbe:FARBE.rahmen });
      this.text(this.passend(unterschrift, w - 3, SCHRIFT.tabelle), x + 1.5, y + h - capH / 2 + kap(SCHRIFT.tabelle) / 2, { s:SCHRIFT.tabelle, farbe:FARBE.label });
    }

    /* ---- Prüfablauf in zwei Spalten (Zeitungssatz): Abschnitte laufen links oben → links unten → rechts oben.
       abschnitte: [{ titel, zeilen:[{ nr, text, hinweis, teile:[Teil], ergebnis:'i.O.'|'n.i.O.'|'', aus, ohneErgebnis }] }]
       Teil:   { label, wert, einheit, status, leerBreite }   Messwert (leer → Schreiblinie)
               { wahl:[{ wert, text, farbe }], gewaehlt }      Ankreuzen
               { text, status, fett }                           fester Text
       Aufteilung so, dass beide Spalten möglichst gleich hoch sind (nur zwischen Zeilen, Abschnitt läuft
       mit „(Fortsetzung)“ weiter). Die kürzere Spalte wird gleichmäßig gestreckt. Rückgabe: Höhe. */
    ablauf(y, abschnitte, opt, zeichnen){
      const o = Object.assign({ zeileMin:6, luft:3 }, opt || {});
      const W = (SEITE.breite - o.luft) / 2, kopfH = 4.4, abH = 4.4;
      const sp = { nr:5, erg:5.8 };
      sp.text = Math.round(W * 0.36 * 10) / 10; sp.werte = W - sp.nr - sp.text - 2 * sp.erg;
      const sT = SCHRIFT.tabelle, sH = SCHRIFT.legende - 0.3, sW = SCHRIFT.tabelle - 0.3;
      /* Zeilenhöhe natürlich */
      const textH = z => {
        const n1 = this.umbrechen(z.text, sp.text - 2, sT, true).length, n2 = z.hinweis ? this.umbrechen(z.hinweis, sp.text - 2, sH).length : 0;
        return n1 * zeile(sT) + n2 * zeile(sH) + 1.6;
      };
      const zeileH = z => Math.max(o.zeileMin, textH(z), this.teile(0, 0, sp.werte - 2 * ABSTAND.pad, z.teile || [], false, sW) + 2);
      /* flache Liste → beste Trennstelle */
      const flach = [];
      abschnitte.forEach((ab, ai)=>ab.zeilen.forEach((z, zi)=>flach.push({ ai, zi, h:zeileH(z) })));
      const hoehe = teil => teil.length ? kopfH + teil.reduce((a, r, i)=>a + r.h + (i === 0 || teil[i - 1].ai !== r.ai ? abH : 0), 0) : 0;
      let best = flach.length, bestH = Infinity;
      for(let k = 1; k < flach.length; k++){ const m = Math.max(hoehe(flach.slice(0, k)), hoehe(flach.slice(k))); if(m < bestH){ bestH = m; best = k; } }
      const seiten = [flach.slice(0, best), flach.slice(best)].map((teil, si)=>{
        const abs = [];
        teil.forEach((r, i)=>{
          if(i === 0 || teil[i - 1].ai !== r.ai) abs.push({ titel: abschnitte[r.ai].titel + (si && r.zi > 0 ? ' (Fortsetzung)' : ''), zeilen:[] });
          abs[abs.length - 1].zeilen.push(abschnitte[r.ai].zeilen[r.zi]);
        });
        return { abschnitte:abs };
      });
      const natur = seiten.map(sd=>sd.abschnitte.length ? kopfH + sd.abschnitte.reduce((a, ab)=>a + abH + ab.zeilen.reduce((b, z)=>b + zeileH(z), 0), 0) : 0);
      const H = Math.max(...natur);
      if(zeichnen === false) return H;
      seiten.forEach((sd, si)=>{
        const x0 = SEITE.links + si * (W + o.luft);
        const nZeilen = sd.abschnitte.reduce((a, ab)=>a + ab.zeilen.length, 0);
        const plus = nZeilen ? (H - natur[si]) / nZeilen : 0;
        const xs = [x0, x0 + sp.nr, x0 + sp.nr + sp.text, x0 + sp.nr + sp.text + sp.werte, x0 + W - sp.erg, x0 + W];
        /* Spaltenkopf */
        const kopf = ['Nr.', 'Prüfschritt · Grenzwert', 'Einstellung / Messwerte', 'i.O.', 'n.i.O.'];
        kopf.forEach((t, k)=>{
          this.rechteck(xs[k], y, xs[k + 1] - xs[k], kopfH, { fuell:FARBE.kopfBg, rand:FARBE.rahmen });
          this.text(t, k === 1 || k === 2 ? xs[k] + 1 : (xs[k] + xs[k + 1]) / 2, y + kopfH / 2 + kap(SCHRIFT.tabKopf) / 2,
            { s: k >= 3 ? SCHRIFT.tabKopf - 0.4 : SCHRIFT.tabKopf, fett:true, ausr: k === 1 || k === 2 ? 'links' : 'mitte' });
        });
        let cy = y + kopfH;
        sd.abschnitte.forEach(ab=>{
          this.rechteck(x0, cy, W, abH, { fuell:FARBE.titelBg, rand:FARBE.rahmen });
          this.rechteck(x0, cy, 0.9, abH, { fuell:FARBE.primaer, rand:false });
          this.text(this.passend(ab.titel, W - 3, SCHRIFT.tabKopf + 0.3), x0 + 2, cy + abH / 2 + kap(SCHRIFT.tabKopf + 0.3) / 2, { s:SCHRIFT.tabKopf + 0.3, fett:true, farbe:FARBE.primaer });
          cy += abH;
          ab.zeilen.forEach((z, zi)=>{
            const h = zeileH(z) + plus, mangel = !this.leer && z.ergebnis === 'n.i.O.';
            const fuell = zi % 2 ? FARBE.zebra : null;
            for(let k = 0; k < 5; k++){
              const rot = mangel && k === 4;
              this.rechteck(xs[k], cy, xs[k + 1] - xs[k], h, { fuell: rot ? FARBE.rotBg : fuell, rand:FARBE.rahmen });
            }
            /* Nr. */
            this.text(z.nr || '', (xs[0] + xs[1]) / 2, cy + h / 2 + kap(sT) / 2, { s:sT, fett:true, farbe:FARBE.primaer, ausr:'mitte' });
            /* Prüfschritt + Grenzwert */
            const t1 = this.umbrechen(z.text, sp.text - 2, sT, true), t2 = z.hinweis ? this.umbrechen(z.hinweis, sp.text - 2, sH) : [];
            let ty = cy + (h - (t1.length * zeile(sT) + t2.length * zeile(sH))) / 2;
            t1.forEach(t=>{ this.text(t, xs[1] + 1, ty + kap(sT) + 0.3, { s:sT, fett:true, farbe: z.aus ? FARBE.grau : FARBE.text }); ty += zeile(sT); });
            t2.forEach(t=>{ this.text(t, xs[1] + 1, ty + kap(sH) + 0.3, { s:sH, farbe:FARBE.grau }); ty += zeile(sH); });
            /* Werte */
            const th = this.teile(0, 0, sp.werte - 2 * ABSTAND.pad, z.teile || [], false, sW);
            this.teile(xs[2] + ABSTAND.pad, cy + (h - th) / 2, sp.werte - 2 * ABSTAND.pad, z.teile || [], true, sW);
            /* Ergebnis */
            if(z.aus){ [3, 4].forEach(k=>this.text('–', (xs[k] + xs[k + 1]) / 2, cy + h / 2 + kap(sT) / 2, { s:sT, farbe:FARBE.hell, ausr:'mitte' })); }
            else if(!z.ohneErgebnis) [['i.O.', 3], ['n.i.O.', 4]].forEach(([e, k])=>{
              const g = 2.6, an = !this.leer && z.ergebnis === e;
              this.kaestchen((xs[k] + xs[k + 1]) / 2 - g / 2, cy + h / 2 - g / 2, g, an, e === 'n.i.O.' ? FARBE.rotText : FARBE.gruenText);
            });
            cy += h;
          });
        });
        this.rechteck(x0, y, W, H, { rand:FARBE.rahmenDunkel, dicke:0.35 });
      });
      return H;
    }
    /* Inline-Teile (Messwerte mit Label/Einheit, Ankreuzen, Text) mit Zeilenumbruch. Rückgabe: Höhe */
    teile(x, y, maxW, teile, zeichnen, s){
      const zh = this.leer ? 4.3 : 3.5, g = 2.2, luft = 2.6;
      let cx = x, zeilenN = teile.length ? 1 : 0;
      const setze = w => { if(cx > x && cx + w > x + maxW){ cx = x; zeilenN++; } const px = cx; cx += w + luft; return { px, py: y + (zeilenN - 1) * zh }; };
      teile.forEach(t=>{
        if(t.wahl){
          t.wahl.forEach(op=>{
            const an = !this.leer && t.gewaehlt != null && t.gewaehlt !== '' && op.wert === t.gewaehlt;
            const w = g + 0.8 + this.breite(op.text, s, an);
            const p = setze(w);
            if(zeichnen){
              const by = p.py + zh / 2;
              this.kaestchen(p.px, by - g / 2 - 0.3, g, an, an && op.farbe ? FARBE[op.farbe] : FARBE.text);
              this.text(op.text, p.px + g + 0.8, by + kap(s) / 2 - 0.3, { s, fett:an, farbe: an ? (op.farbe ? FARBE[op.farbe] : FARBE.text) : FARBE.label });
            }
          });
          return;
        }
        if(t.text != null && t.label == null){
          const w = this.breite(t.text, s, t.fett);
          const p = setze(Math.min(w, maxW));
          if(zeichnen) this.text(this.passend(t.text, maxW, s), p.px, p.py + zh / 2 + kap(s) / 2 - 0.3, { s, fett:t.fett, farbe: t.status === 'aus' ? FARBE.hell : t.status === 'rot' ? FARBE.rotText : FARBE.text });
          return;
        }
        const lab = t.label ? t.label + ' ' : '', ein = t.einheit ? ' ' + t.einheit : '';
        const leerW = this.leer || !t.wert ? (t.leerBreite || 8) : 0;
        const wertW = this.leer || !t.wert ? leerW : this.breite(String(t.wert), s + 0.4, true);
        const w = this.breite(lab, s - 0.6) + wertW + this.breite(ein, s - 0.6);
        const p = setze(w);
        if(!zeichnen) return;
        const by = p.py + zh / 2 + kap(s) / 2 - 0.3;
        let px = p.px;
        if(lab){ this.text(lab, px, by, { s:s - 0.6, farbe:FARBE.label }); px += this.breite(lab, s - 0.6); }
        if(this.leer || !t.wert){
          this.linie(px, by + 0.7, px + leerW, by + 0.7, { farbe: this.leer ? FARBE.rahmenDunkel : FARBE.rahmen, gestrichelt:!this.leer, dicke:0.2 });
        } else {
          const rot = t.status === 'rot';
          if(rot) this.rechteck(px - 0.5, p.py + 0.4, wertW + 1, zh - 0.8, { fuell:FARBE.rotBg, rand:false });
          this.text(String(t.wert), px, by, { s:s + 0.4, fett:true, farbe: rot ? FARBE.rotText : FARBE.text });
        }
        px += wertW;
        if(ein) this.text(ein, px, by, { s:s - 0.6, farbe:FARBE.label });
      });
      return zeilenN * zh;
    }

    /* Hinweisband (z. B. UNVOLLSTÄNDIG) über die ganze Breite */
    band(y, text, art){
      const h = 5;
      this.rechteck(SEITE.links, y, SEITE.breite, h, { fuell: art === 'rot' ? FARBE.rotBg : FARBE.gelbBg, rand: art === 'rot' ? FARBE.rotText : FARBE.gelbText, dicke:0.3 });
      this.text(this.passend(text, SEITE.breite - 4, SCHRIFT.tabelle + 0.5), SEITE.links + 2, y + h / 2 + kap(SCHRIFT.tabelle + 0.5) / 2, { s:SCHRIFT.tabelle + 0.5, fett:true, farbe: art === 'rot' ? FARBE.rotText : FARBE.gelbText });
      return h;
    }

    /* Legende / Kleintext unter einer Tabelle, Rückgabe: Höhe */
    kleintext(y, text, zeichnen){
      const zl = this.umbrechen(text, SEITE.breite - 2, SCHRIFT.legende);
      if(zeichnen !== false) zl.forEach((t, i)=>this.text(t, SEITE.links + 1, y + 1.2 + kap(SCHRIFT.legende) + i * zeile(SCHRIFT.legende), { s:SCHRIFT.legende, farbe:FARBE.grau }));
      return 1.2 + zl.length * zeile(SCHRIFT.legende) + 0.6;
    }

    blob(){ return this.doc.output('blob'); }
  }

  /* Gewichte → mm, Summe exakt = gesamt (Rundungsrest in die letzte Spalte) */
  function gewichte(liste, gesamt){
    const summe = liste.reduce((a, b)=>a + b, 0) || 1;
    const out = liste.map(b=>Math.round(b / summe * gesamt * 100) / 100);
    out[out.length - 1] += gesamt - out.reduce((a, b)=>a + b, 0);
    return out;
  }

  return { laden, neu: opt=>new Dok(opt), SEITE, ABSTAND, SCHRIFT, FARBE, ohneMarken };
})();
