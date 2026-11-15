/* Shared data downloads (owner, 15 Nov 2026: the homepage globe appeared too slowly).
   The homepage and its globe frame asked for the same data files many times over while loading
   (news-live.json 5x, markets.json 4x, the news API 2x), which delayed the globe.
   A GET for one of the files below, made again within 15 s by this page or by the homepage
   that embeds it, now reuses the download already made instead of starting a new one.
   Only these public read-only files are shared; everything else goes straight to the network. */
(function () {
  if (!window.fetch || window.__invFetchShared) return;
  window.__invFetchShared = true;
  var SHARE = /\/assets\/(globe\/(news-live|markets|news-prices|countries-50m)\.json|intraday\.json)(\?|$)|^https:\/\/api\.investedia\.com\/v1\/(news|connections)(\?|$)/;
  var TTL = 15000, orig = window.fetch.bind(window), memo;
  try { memo = window.top.__invFetchMemo || (window.top.__invFetchMemo = new Map()); } catch (e) { memo = new Map(); } // same-origin parent only
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : input instanceof URL ? input.href : null, method = (init && init.method) || (input && input.method) || 'GET';
      if (!url || method.toUpperCase() !== 'GET' || (init && init.body)) return orig(input, init);
      var abs = new URL(url, location.href).href;
      if (!SHARE.test(abs)) return orig(input, init);
      var hit = memo.get(abs), now = Date.now();
      if (!hit || now - hit.t > TTL) {
        var own = {}; for (var k in init || {}) if (k !== 'signal') own[k] = init[k]; // the shared download is not cancelled by one caller's timeout
        hit = { t: now, p: orig(input, own).then(function (r) { if (!r.ok) memo.delete(abs); return r; }, function (e) { memo.delete(abs); throw e; }) };
        memo.set(abs, hit);
      }
      var sig = init && init.signal, out = hit.p.then(function (r) { return r.clone(); });
      if (!sig) return out;
      if (sig.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
      return new Promise(function (res, rej) { sig.addEventListener('abort', function () { rej(new DOMException('Aborted', 'AbortError')); }, { once: true }); out.then(res, rej); });
    } catch (e) { return orig(input, init); }
  };
})();
