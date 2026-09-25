/* =========================================================================
   Service Worker der VDE-Prüf-App V2 – Offline-Betrieb.
   Version, Cache-Name und Dateiliste kommen aus js/app-config.js
   (importScripts) – dadurch ist der Worker nachweisbar synchron mit der App.

   Strategie: Precache aller App-Dateien inkl. Icons beim Installieren,
   danach Cache zuerst, Netz nur als Rückfall. Prüfdaten liegen NICHT hier,
   sondern in IndexedDB/localStorage und bleiben bei jedem Cache-Reset erhalten.
   ========================================================================= */
importScripts('js/app-config.js');

/* Ohne diese Dateien ist die App nicht lauffähig → Installation schlägt fehl (alte Version bleibt aktiv).
   Icons sind optional: fehlt eines, funktioniert die App weiter (Platzhalter). */
const OPTIONAL = url => url.startsWith('icons/');

/* Alle Apps unter <name>.github.io teilen sich EINEN Cache-Speicher. Andere Apps können unseren
   Offline-Cache löschen – deshalb füllt sich der Cache selbst wieder auf (nurFehlende = true). */
async function precache(nurFehlende){
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(PRECACHE_DATEIEN.map(async url => {
    try {
      if (nurFehlende && await cache.match(url)) return;
      const antwort = await fetch(new Request(url, { cache: 'reload' }));
      if (!antwort.ok) throw new Error(url + ' → HTTP ' + antwort.status);
      await cache.put(new Request(url), antwort);
    } catch (e) {
      if (!nurFehlende && !OPTIONAL(url)) throw e;
    }
  }));
}
/* Absolute Adressen der App-Dateien (ohne ?…) – nur diese werden nachgeladen und gespeichert */
const APP_URLS = new Set(PRECACHE_DATEIEN.map(u => new URL(u, self.registration.scope).href));

self.addEventListener('install', event => {
  /* KEIN skipWaiting: Die neue Version wartet, bis der Nutzer auf der Hauptseite
     „jetzt neu laden" wählt (Nachricht SKIP_WAITING). Erstinstallation aktiviert sich selbst. */
  event.waitUntil(precache(false));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    /* NUR eigene alte Caches löschen (Präfix) – Caches anderer Apps bleiben unangetastet */
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.typ === 'SKIP_WAITING') self.skipWaiting();
  if (d.typ === 'VERSION' && event.source) event.source.postMessage({ typ:'VERSION', appVersion:APP_VERSION, swVersion:SW_VERSION, cache:CACHE_NAME });
  if (d.typ === 'CACHE_PRUEFEN') event.waitUntil(precache(true).catch(() => {}));
});

/* Ersatzseite, falls offline und der Cache fehlt – statt einer Fehlermeldung des Systems */
function offlineSeite(){
  const html = '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>' + APP_NAME + ' – offline</title><style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px;}'
    + '.k{max-width:460px;margin:40px auto;background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:20px;}h1{color:#003366;font-size:1.2rem;}'
    + 'button{background:#003366;color:#fff;border:0;border-radius:6px;padding:12px 16px;font-size:1rem;}</style></head><body><div class="k">'
    + '<h1>' + APP_NAME + ' ist gerade offline</h1><p>Die App-Dateien sind auf diesem Gerät nicht (mehr) gespeichert. '
    + 'Bitte einmal <b>mit Internet</b> öffnen – danach funktioniert die App wieder offline. Deine Prüfdaten sind davon nicht betroffen.</p>'
    + '<button onclick="location.reload()">Erneut versuchen</button></div></body></html>';
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  const appDatei = APP_URLS.has(url.origin + url.pathname);
  if (req.mode === 'navigate') event.waitUntil(precache(true).catch(() => {}));   /* Cache bei jedem Seitenaufruf still vervollständigen */
  event.respondWith((async () => {
    /* ignoreSearch: index.html?entwurf=… und ähnliche Aufrufe treffen den gleichen Cache-Eintrag */
    const treffer = await caches.match(req, { ignoreSearch: true, cacheName: CACHE_NAME });
    if (treffer) return treffer;
    try {
      const antwort = await fetch(req);
      if (appDatei && antwort.ok) {                                                  /* fehlende App-Datei nachtragen */
        const kopie = antwort.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(c => c.put(new Request(url.origin + url.pathname), kopie)).catch(() => {}));
      }
      return antwort;
    } catch (e) {
      if (req.mode === 'navigate') {
        const start = await caches.match('index.html', { cacheName: CACHE_NAME });
        return start || offlineSeite();
      }
      return Response.error();
    }
  })());
});
