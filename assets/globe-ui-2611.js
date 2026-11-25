// Globe clean-up (owner, 25 Nov 2026). PC layout only (>= 1180 px); phones are unchanged.
//  - Sector overview: one compact list instead of six big tiles. Minimising it (−) now really hides it, so it no
//    longer shows twice (panel + "Sector overview +" chip).
//  - Top articles: pin, minimise and close share one tidy button row.
//  - Briefing: never on the Markets globe (no top-right button, no strip tab), so Markets overview moves up.
//    News keeps it in ONE place: the strip tab (default) or the top-right button (?bf=top).
//  - Search bar: glass styles to choose from (?sb=a|b|c; preview only until the owner picks one).
(() => {
  const H = document.documentElement, Q = new URLSearchParams(location.search);
  const pick = (k, ok, d) => { const v = Q.get(k); if (ok.includes(v)) { try { localStorage.setItem('inv-ui-' + k, v); } catch {} return v; } try { const s = localStorage.getItem('inv-ui-' + k); if (ok.includes(s)) return s; } catch {} return d; };
  const bf = pick('bf', ['tab', 'top'], 'tab'), sb = pick('sb', ['a', 'b', 'c', 'off'], 'off');
  H.classList.toggle('bf-top', bf === 'top'); if (sb !== 'off') H.dataset.sb = sb;
  const css = document.createElement('style');
  css.textContent = `
@media(min-width:1180px){
 html #sideSec.gp-hid:not([hidden]),html #sideImp.gp-hid:not([hidden]),html #presets.gp-hid:not([hidden]){display:none!important}
 /* Sector overview as a list */
 html #sideSec:not([hidden]){display:flex!important;flex-direction:column;gap:2px;padding:14px 10px 10px!important}
 html #sideSec .sd-h{padding:0 6px 8px;margin:0!important}
 html #sideSec .sd-r{display:grid!important;grid-template-columns:1fr auto 64px 10px;grid-template-areas:"n c p i" "b b b b";column-gap:10px;row-gap:5px;align-items:center;padding:8px 8px 9px!important;border:0!important;border-radius:10px!important;background:none!important}
 html #sideSec .sd-r:hover{background:rgba(255,255,255,.04)!important}
 html #sideSec .sd-r[aria-pressed=true]{background:rgba(255,122,26,.09)!important}
 html #sideSec .sd-r>span:first-child{font:500 13.5px Inter,sans-serif}
 html #sideSec .sd-r>small{grid-area:c;font:500 11.5px Inter,sans-serif;color:#6f6f78}
 html #sideSec .sd-r>em{grid-area:p;justify-self:end;font:600 13px 'Geist Mono',ui-monospace,monospace!important;margin:0!important}
 html #sideSec .sd-r>i{grid-area:i;font-size:11px}
 html #sideSec .sd-r .gf-sector-bar{grid-area:b;height:2px!important;margin:0!important;background:#1a1a1e!important}
 /* Top articles: one row of equal buttons */
 html.dash #panel .sheet-actions #sheet-close{min-width:0!important;min-height:0!important;padding:0!important;width:24px!important;height:24px!important;border-radius:7px!important;font-size:13px!important;color:#aaa!important;border:1px solid #2c2c31!important;background:#141417!important}
 html.dash #panel .sheet-actions{top:15px!important;right:16px!important}
 /* Briefing: Markets never; News in one place */
 html.market-mode .bf-btn,html.mkd-on .bf-btn,html:not(.bf-top) .bf-btn{display:none!important}
 html.mkd-on .mkd-o{top:22px!important}
 /* Search bar glass styles (preview) */
 html[data-sb] #sbox{-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%);transition:border-color .2s,box-shadow .2s,background .2s}
 html[data-sb=a] #sbox{background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 30px rgba(0,0,0,.35)!important}
 html[data-sb=a] #sbox:focus-within{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.28)!important}
 html[data-sb=b] #sbox{background:rgba(16,16,20,.42)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important}
 html[data-sb=b] #sbox:focus-within{border-color:rgba(255,122,26,.6)!important;box-shadow:0 0 0 4px rgba(255,122,26,.14),inset 0 1px 0 rgba(255,255,255,.06)!important}
 html[data-sb=c] #sbox{border-radius:999px!important;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.03))!important;border:1px solid rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 1px rgba(255,255,255,.25),inset 0 -1px 1px rgba(0,0,0,.3),0 10px 34px rgba(0,0,0,.45)!important;-webkit-backdrop-filter:blur(28px) saturate(180%);backdrop-filter:blur(28px) saturate(180%)}
 html[data-sb=c] #sbox:focus-within{border-color:rgba(255,157,92,.55)!important}
}`;
  document.head.append(css);
  setTimeout(() => dispatchEvent(new Event('resize')), 0);  // strips re-render with the chosen Briefing place
})();
