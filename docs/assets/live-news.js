// Live news pill (owner choice A, 13 Nov 2026): checks Investedia's own API (/v1/news) once a minute while the tab is visible.
// When new articles arrive it shows "N new articles · Show ↑" (one line on every screen); tapping it reloads the page with them.
(function () {
  'use strict';
  var api = function () { return String(window.INV_LIVE_URL || (window.INV_CONFIG && window.INV_CONFIG.apiBaseUrl) || '').replace(/\/ticker\/?$/, '').replace(/\/$/, ''); };
  if (!window.fetch) return;
  // inside the homepage's embedded globe the pill landed on the globe's own 'Updated' pill (owner 19 Nov 2026): the page around it shows it instead
  try { if (window.top !== window.self || /[?&]embed=1/.test(location.search)) return; } catch (e) { return; }
  var seen = null, pill = null, EVERY = 60000;
  function ids(j) { var d = j && j.data; var list = Array.isArray(d) ? d : (d && d.stories) || []; return list.map(function (s) { return s && s.id; }).filter(Boolean); }
  function show(n) {
    if (!pill) {
      var st = document.createElement('style');
      st.textContent = '.inv-live{position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:45;display:flex;align-items:center;gap:9px;white-space:nowrap;max-width:calc(100vw - 24px);background:var(--accent,#ff7a1a);color:#111;font:600 14px Inter,system-ui,sans-serif;padding:9px 16px;border:0;border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.45);cursor:pointer;height:auto;max-height:44px;box-sizing:border-box}.inv-live i{width:8px;height:8px;border-radius:50%;background:#111;flex:none;animation:invlp 1.6s ease-in-out infinite}@keyframes invlp{50%{opacity:.35}}@media(max-width:600px){.inv-live{top:66px;left:16px;transform:none;font-size:12.5px;gap:7px;padding:7px 12px;box-shadow:0 4px 16px rgba(0,0,0,.4)}.inv-live i{width:6px;height:6px}.inv-live.pg{top:auto;bottom:calc(20px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.inv-live i{animation:none}}';
      document.head.appendChild(st);
      pill = document.createElement('button'); pill.type = 'button'; pill.className = 'inv-live' + (/\/globe\//.test(location.pathname) ? '' : ' pg'); pill.setAttribute('aria-live', 'polite');
      pill.onclick = function () { pill.textContent = 'Loading…'; scrollTo(0, 0); location.reload(); };
      document.body.appendChild(pill);
      var hd = document.querySelector('body > header, .site-header, header.nav, .nav'); if (hd && !/\/globe\//.test(location.pathname) && !(pill.classList.contains('pg') && matchMedia('(max-width:600px)').matches)) {  /* phones with .pg use bottom only: top+bottom stretched the pill into a huge shape */ var b = hd.getBoundingClientRect().bottom; if (b > 0 && b < 200) pill.style.top = (b + 12) + 'px'; }
    }
    pill.innerHTML = '<i></i>' + n + ' new article' + (n === 1 ? '' : 's') + ' · Show ↑';
  }
  function check() {
    var base = api(); if (document.hidden || !base) return;
    fetch(base + '/v1/news', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var now = ids(j); if (!now.length) return;
      if (!seen) { seen = new Set(now); return; }
      var n = now.filter(function (id) { return !seen.has(id); }).length; if (n) show(n);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
  setInterval(check, EVERY); document.addEventListener('visibilitychange', check);
})();
