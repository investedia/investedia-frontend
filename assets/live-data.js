// Investedia data loader. One place that decides where frequently changing data comes from.
//   INV_DATA_MODE = 'static' (default): GitHub Pages files only, exactly as before. This script then does nothing.
//   'shadow': also asks the Cloudflare Worker (/v1/...) in the background and compares it with the static data. Users see no change.
//   'worker': the Worker is the primary source; the static file is the fallback when the Worker is slow (> 3 s), down, or returns nothing.
// Owner testing without a deploy: open any page with ?inv_data=shadow (or worker, or static to reset); it is remembered in this browser only.
(function () {
  'use strict';
  var TIMEOUT = 3000, MEM_MS = 15000;
  var mode = (function () {
    try { var q = new URLSearchParams(location.search).get('inv_data'); if (q) localStorage.setItem('inv.data', q); var s = localStorage.getItem('inv.data'); if (s) return s; } catch (e) {}
    return window.INV_DATA_MODE || 'static';
  })();
  if (mode !== 'static' && mode !== 'shadow' && mode !== 'worker') mode = 'static';
  var base = (window.INV_LIVE_URL || '').replace(/\/ticker\/?$/, '');
  var mem = {};

  function withTimeout(url, ms) {
    var c = typeof AbortController === 'function' ? new AbortController() : null, t = c && setTimeout(function () { c.abort(); }, ms);
    return fetch(url, { cache: 'no-store', signal: c && c.signal }).then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('http ' + r.status); return r.json(); }, function (e) { clearTimeout(t); throw e; });
  }
  function ssGet(k) { try { return JSON.parse(sessionStorage.getItem('inv.d.' + k)); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem('inv.d.' + k, JSON.stringify(v)); } catch (e) {} }

  // get('prices?group=indices') -> Promise<{ data, meta, source }>; source is 'worker', 'memory' or 'session' (last good copy). Rejects when nothing is available: the caller then keeps its static file.
  function get(path) {
    var hit = mem[path]; if (hit && Date.now() - hit.t < MEM_MS) return Promise.resolve({ data: hit.v.data, meta: hit.v.meta, source: 'memory' });
    if (!base) return Promise.reject(new Error('no worker url'));
    if (window.InvConsent && !window.InvConsent.allows('live') && !window.INV_CONFIG?.localSnapshot) return Promise.reject(new Error('live data not allowed by the visitor'));  // same consent switch as the crypto relay: static files only
    return withTimeout(base + '/v1/' + path, TIMEOUT).then(function (j) {
      if (!j || !j.data || !Object.keys(j.data).length) throw new Error('empty'); // never replace good data with nothing
      mem[path] = { t: Date.now(), v: j }; ssSet(path, j); return { data: j.data, meta: j.meta, source: window.INV_CONFIG?.localSnapshot ? 'snapshot' : 'worker' };
    }).catch(function (e) {
      var last = (mem[path] && mem[path].v) || ssGet(path);
      if (last && last.data) return { data: last.data, meta: Object.assign({}, last.meta, { state: 'cached' }), source: 'session' };
      throw e;
    });
  }

  // Worker rows are [price, change_pct, provider_time_ms, fetched_at_ms]; the static file has richer fields. Only price and change are taken from the Worker.
  function overlayQuotes(q, rows) {
    var n = 0; for (var s in rows) { var t = q[s], r = rows[s]; if (!t || !(r[0] > 0)) continue; t.p = r[0]; t.d = r[1]; n++; } return n;
  }

  function staticQuotes() {
    if (window.QUOTES && window.QUOTES.q) return Promise.resolve(window.QUOTES);
    return fetch('assets/quotes.js?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); });
  }

  // Shadow comparison: Worker prices vs the static GitHub prices. Nothing on the page changes.
  function shadow() {
    if (!base) return;
    Promise.all([get('prices'), staticQuotes()]).then(function (res) {
      var w = res[0], q = res[1].q, diffs = [], missing = 0, compared = 0, big = [];
      for (var s in q) { var r = w.data[s]; if (!r) { missing++; continue; } var p = q[s].p; if (!(p > 0)) continue; compared++; var d = Math.abs(r[0] / p - 1) * 100; diffs.push(d); if (d > 2) big.push(s + ' ' + d.toFixed(1) + '%'); }
      diffs.sort(function (a, b) { return a - b; });
      var out = { at: new Date().toISOString(), compared: compared, missing_in_worker: missing, median_diff_pct: +(diffs[diffs.length >> 1] || 0).toFixed(3), p95_diff_pct: +(diffs[Math.floor(diffs.length * .95)] || 0).toFixed(3),
        over_2pct: big.slice(0, 12), worker_state: w.meta && w.meta.state, worker_age_s: w.meta && w.meta.age_s, static_updated: res[1].updated, source: w.source };
      InvData.shadow = out;
      if (window.console && console.info) console.info('[InvData shadow]', out);
    }).catch(function (e) { InvData.shadow = { at: new Date().toISOString(), error: String(e && e.message || e) }; if (window.console && console.info) console.info('[InvData shadow] Worker unavailable, static data stays in use:', InvData.shadow.error); });
  }

  var InvData = window.InvData = { mode: mode, get: get, overlayQuotes: overlayQuotes, shadow: null, base: base };
  if (mode === 'shadow') setTimeout(shadow, 4000); // after the page has settled, so it never competes with first paint
})();
