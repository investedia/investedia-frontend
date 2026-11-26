// Globe layout clean-up (owner, 19 Nov 2026), PC only:
//  - Filters fold into one dropdown row (region, time, layers, saved views); article filters removed from the column
//  - region menu: names, bar and count on one clean line
//  - Sector overview as compact tiles
//  - Market impact takes only the height it needs; Top articles grows into the rest
(() => {
  const H = document.documentElement, KEY = 'inv-strip';
  const css = document.createElement('style');
  css.textContent = `
@media(min-width:1180px){
 html.dash.lcol-on #news-details-filters{display:none!important}
 html.dash.lcol-on #ddrow{padding:0 14px!important;border-radius:18px!important;border-bottom:1px solid var(--dln)!important;cursor:default}
 html.dash.lcol-on #ddrow:before{display:none}
 html.dash.lcol-on #ddrow>#fb-reset{top:10px}
 .nl-ft{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;height:46px;cursor:pointer;font:600 15px Inter,sans-serif;color:#ececef;grid-column:1/-1}
 .nl-ft small{font:500 12.5px Inter,sans-serif;color:#8a8a92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
 .nl-ft i{font-style:normal;color:#8a8a92;font-size:12px;margin-left:auto;margin-right:52px;transition:transform .2s}
 html.nl-fopen .nl-ft i{transform:rotate(180deg)}
 html.dash.lcol-on:not(.nl-fopen) #ddrow>.dd,html.dash.lcol-on:not(.nl-fopen) #lcol #layers,html.dash.lcol-on:not(.nl-fopen) #presets{display:none!important}
 html.dash.lcol-on.nl-fopen #ddrow{border-radius:18px 18px 0 0!important;border-bottom:0!important;padding-bottom:10px!important}
 html.dash.lcol-on #ddrow .dd-btn{height:34px!important;font-size:13px!important}
 html.dash.lcol-on #presets{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 14px 10px!important;font-size:12px}
 html.dash.lcol-on #presets>b{font:500 12px Inter,sans-serif;color:#8a8a92;margin-right:4px}
 html.dash.lcol-on #presets>small{display:none}
 html.dash.lcol-on #presets .add{font-size:12px;padding:2px 8px;border:1px solid #2a2a2f;border-radius:99px}
 html.dash.lcol-on #sideSec{margin-top:var(--dg)!important}
 #regions .reg{grid-template-columns:1fr 64px 44px!important;min-height:34px!important;padding:6px 10px!important;font-size:13px!important;gap:10px!important}
 #regions .reg .rg-sp{display:none!important}
 #regions .reg .rg-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 #regions .reg em{justify-self:end;padding:2px 8px!important;font-size:12px!important}
 #regions.dd-menu{padding:6px!important}
 html.dash #panel .sheet-actions{top:6px!important;right:12px!important;gap:0!important;background:none!important;border:0!important;padding:0!important;box-shadow:none!important;width:auto!important;height:auto!important}html.dash #panel .sheet-actions #sheet-expand{display:none!important}html.dash #panel #sheet-close{width:26px!important;height:26px!important;border-radius:8px!important;border:1px solid #2c2c31!important;background:#141417!important;font-size:15px!important;line-height:1}
 html.dash #panel .pbody>.eyebrow{display:none}html.dash #panel .pbody h2{margin:0 0 12px!important;line-height:26px!important;padding-top:0!important}html.dash #panel .pbody{padding-top:14px!important}
 .compact-country{position:relative;display:grid!important;grid-template-columns:22px 1fr auto;align-items:center;gap:10px;width:100%;padding:9px 10px!important;border-radius:10px;font:500 14px Inter,sans-serif!important;color:#ececef!important;overflow:hidden}
 .compact-country:before{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--sh);background:linear-gradient(90deg,rgba(255,122,26,.16),rgba(255,122,26,.04));border-radius:10px;z-index:0}.compact-country>*{position:relative;z-index:1}
 .compact-country small{font:600 12.5px var(--sans,Inter,system-ui,sans-serif)!important;color:#ff9d5c!important}.compact-country:hover{background:rgba(255,255,255,.04)}
 html:has(#ddrow .dd-menu:not([hidden])) .gp-ctl,html:has(.tf-dd.open) .gp-ctl{display:none!important}
 #sideSec:not([hidden]){display:grid!important;grid-template-columns:1fr 1fr;gap:8px;padding:14px!important}
 #sideSec .sd-h{grid-column:1/-1;margin-bottom:2px}
 #sideSec .gf-sector.expanded{grid-column:1/-1}
 #sideSec .sd-r{display:grid!important;grid-template-columns:1fr auto;grid-template-areas:"n i" "p p" "c c" "b b";align-items:center;gap:2px;width:100%;padding:10px 11px!important;border-radius:12px;background:#111114;border:1px solid #1d1d21;text-align:left;cursor:pointer}
 #sideSec .sd-r:hover{border-color:#2c2c32}
 #sideSec .sd-r[aria-pressed=true]{border-color:rgba(255,122,26,.55);background:#16110c}
 #sideSec .sd-r>span:first-child{grid-area:n;font:500 13px Inter,sans-serif;color:#ececef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #sideSec .sd-r>i{grid-area:i;font-style:normal;color:#5c5c64}
 #sideSec .sd-r>em{grid-area:p;font:600 17px var(--sans,Inter,system-ui,sans-serif);font-style:normal;margin-top:2px}
 #sideSec .sd-r>small{grid-area:c;color:#77777f;font-size:12px}
 #sideSec .sd-r .gf-sector-bar{grid-area:b;position:static!important;display:block;height:3px;margin-top:6px;border-radius:2px;background:#1d1d21;overflow:hidden}
 #sideSec .sd-r .gf-sector-bar i{display:block;height:100%;background:#FF7A1A}
}`;
  document.head.append(css);

  // ---- 1. Filters dropdown ----
  function filters() {
    const d = document.getElementById('ddrow'); if (!d) return;
    let b = d.querySelector('.nl-ft');
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'nl-ft'; b.setAttribute('aria-expanded', 'false'); d.prepend(b);
      b.onclick = () => { const o = !H.classList.contains('nl-fopen'); H.classList.toggle('nl-fopen', o); b.setAttribute('aria-expanded', String(o)); try { size(); } catch {} }; }
    const reg = (document.getElementById('reg-label')?.textContent || '').replace(/^Region:\s*/, '') || 'All regions';
    const tf = document.querySelector('.tf-l')?.textContent?.replace(/^Last /, '') || '';
    const lay = document.getElementById('lay-n')?.textContent?.replace(/\D/g, '') || '0';
    const t = `Filters <small>${reg} · ${tf} · ${lay} layer${lay === '1' ? '' : 's'}</small><i aria-hidden="true">▾</i>`;
    if (b.innerHTML !== t) b.innerHTML = t;
  }

  // ---- Market impact sits under Top articles at its own height (no empty band) ----
  function imp() { const s = document.getElementById('sideImp'); if (!s || s.hidden) return; const v = Math.ceil(s.getBoundingClientRect().height) + 'px'; if (H.style.getPropertyValue('--imph') !== v) H.style.setProperty('--imph', v); }
  let ah = ''; setInterval(() => { filters(); imp(); const v = H.style.getPropertyValue('--acth'); if (v !== ah) { ah = v; try { size(); placeLoc(); } catch {} } }, 400);  // the strip changed height: globe and zoom buttons follow
})();
