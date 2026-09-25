/* =========================================================================
   ZIP-Erzeugung ohne Fremdbibliothek (Methode „stored“ = ohne Kompression –
   PDFs sind bereits komprimiert, so bleibt es klein und schnell).
   Dateinamen in UTF-8 (Umlaute), doppelte Namen werden durchnummeriert.

   Zip.erstellen([{ name, blob }]) → Promise<Blob application/zip>
   ========================================================================= */
const Zip = (function(){
  'use strict';

  const CRC_TABELLE = (()=>{
    const t = new Uint32Array(256);
    for(let n = 0; n < 256; n++){
      let c = n;
      for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes){
    let c = 0xFFFFFFFF;
    for(let i = 0; i < bytes.length; i++) c = CRC_TABELLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function dosZeit(d){
    return { zeit: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
             datum: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
  }
  function eindeutig(namen){
    const gesehen = new Map();
    return namen.map(n=>{
      const basis = String(n || 'datei').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
      const k = basis.toLowerCase();
      const z = (gesehen.get(k) || 0) + 1; gesehen.set(k, z);
      if(z === 1) return basis;
      const m = /^(.*?)(\.[^.]*)?$/.exec(basis);
      return m[1] + '_' + z + (m[2] || '');
    });
  }

  async function erstellen(dateien){
    const enc = new TextEncoder();
    const { zeit, datum } = dosZeit(new Date());
    const namen = eindeutig(dateien.map(d=>d.name));
    const teile = [], zentral = [];
    let offset = 0;
    for(let i = 0; i < dateien.length; i++){
      const daten = new Uint8Array(await dateien[i].blob.arrayBuffer());
      const name = enc.encode(namen[i]);
      const crc = crc32(daten);
      const lokal = new DataView(new ArrayBuffer(30));
      lokal.setUint32(0, 0x04034b50, true); lokal.setUint16(4, 20, true); lokal.setUint16(6, 0x0800, true);  /* Bit 11: UTF-8 */
      lokal.setUint16(8, 0, true); lokal.setUint16(10, zeit, true); lokal.setUint16(12, datum, true);
      lokal.setUint32(14, crc, true); lokal.setUint32(18, daten.length, true); lokal.setUint32(22, daten.length, true);
      lokal.setUint16(26, name.length, true); lokal.setUint16(28, 0, true);
      teile.push(lokal, name, daten);

      const z = new DataView(new ArrayBuffer(46));
      z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true);
      z.setUint16(10, 0, true); z.setUint16(12, zeit, true); z.setUint16(14, datum, true);
      z.setUint32(16, crc, true); z.setUint32(20, daten.length, true); z.setUint32(24, daten.length, true);
      z.setUint16(28, name.length, true); z.setUint32(42, offset, true);
      zentral.push(z, name);
      offset += 30 + name.length + daten.length;
    }
    const zentralGroesse = zentral.reduce((s, t)=>s + t.byteLength, 0);
    const ende = new DataView(new ArrayBuffer(22));
    ende.setUint32(0, 0x06054b50, true);
    ende.setUint16(8, dateien.length, true); ende.setUint16(10, dateien.length, true);
    ende.setUint32(12, zentralGroesse, true); ende.setUint32(16, offset, true);
    return new Blob([...teile, ...zentral, ende], { type:'application/zip' });
  }

  return { erstellen, crc32 };
})();
