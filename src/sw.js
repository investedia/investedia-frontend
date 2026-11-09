// Investedia app: offline support and instant repeat visits.
// Pages and market data: network first, saved copy when offline. Code, images, fonts: saved copy first, refreshed in the background.
const VERSION = '__VERSION__', CACHE = 'inv-' + VERSION;
const CORE = ['index.html', 'dashboard.html', 'markets.html', 'watchlist.html', 'assets/app.css', 'assets/ui.js', 'assets/mock.js', 'assets/quotes.js', 'assets/profiles.js', 'assets/favicon.svg', 'assets/app/icon-192.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('inv-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

const isData = u => /\/assets\/(quotes\.js|intraday\.json|news\.js|hist\/|news\/|globe\/[^/]+\.(json|html)|calendar-live\.json)/.test(u.pathname); // news, globe page and data JSON: network first, never stale-while-revalidate
async function networkFirst(req, fallback) {
  const c = await caches.open(CACHE);
  try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) c.put(req, r.clone()); return r; }
  catch { return (await c.match(req, { ignoreSearch: true })) || (fallback && await c.match(fallback)) || Response.error(); }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === 'navigate') return e.respondWith(networkFirst(req, 'index.html'));
    if (isData(u)) return e.respondWith(networkFirst(req));
    return e.respondWith(staleWhileRevalidate(req));
  }
  // Optional third-party responses are never persisted in the offline cache.
});
