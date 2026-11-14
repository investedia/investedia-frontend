// Investedia app: offline support and instant repeat visits.
// Pages and market data: network first, saved copy when offline. Code, images, fonts: saved copy first, refreshed in the background.
const VERSION = '3197d2cb8b', CACHE = 'inv-' + VERSION;
// Clean URLs: the host now redirects /page.html to /page (308). A redirected response must never be cached or served for a
// navigation (Safari refuses it: "Response served by service worker has redirections"), so only final URLs are listed here.
const CORE = ['/', '/dashboard', '/markets', '/watchlist', 'assets/app.css', 'assets/ui.js', 'assets/mock.js', 'assets/quotes.js', 'assets/profiles.js', 'assets/favicon.svg', 'assets/app/icon-192.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('inv-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

const isData = u => /\/assets\/(quotes\.js|intraday\.json|news\.js|hist\/|news\/|globe\/[^/]+\.(json|html)|calendar-live\.json)/.test(u.pathname); // news, globe page and data JSON: network first, never stale-while-revalidate
async function networkFirst(req, fallback) {
  const c = await caches.open(CACHE);
  try {
    const r = await fetch(req, { cache: 'no-cache' });
    if (r.redirected) return req.mode === 'navigate' ? Response.redirect(r.url, 302) : r;  // let the browser follow it; never cache it
    if (r.ok) c.put(req, r.clone()); return r;
  }
  catch {
    const hit = (await c.match(req, { ignoreSearch: true })) || (fallback && await c.match(fallback));
    return hit && !hit.redirected ? hit : Response.error();
  }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const net = fetch(req).then(r => { if ((r.ok || r.type === 'opaque') && !r.redirected) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === 'navigate') return e.respondWith(networkFirst(req, '/'));
    if (isData(u)) return e.respondWith(networkFirst(req));
    return e.respondWith(staleWhileRevalidate(req));
  }
  // Optional third-party responses are never persisted in the offline cache.
});
// Push alerts (12 Nov 2026): show the notification the news service sent; tapping it opens the article.
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch {}
  const title = d.title || 'Investedia', opts = { body: d.body || '', tag: d.tag || 'inv-alert', icon: '/assets/app/icon-192.png', badge: '/assets/app/icon-192.png', data: { url: d.url || '/' } };
  e.waitUntil(self.registration.showNotification(title, opts));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) if (c.url === url && 'focus' in c) return c.focus(); return self.clients.openWindow(url); }));
});

