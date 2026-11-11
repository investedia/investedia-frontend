// Pop-up layer: any asset opens in a blurred sheet over the current page, and the header search is a search overlay with real data.
(() => {
  const EMBED = /[?&]embed=1/.test(location.search);
  const ROOT = (() => { try { return new URL('../', document.currentScript.src).href; } catch { return ''; } })();
  const css = document.createElement('style');
  css.textContent = `
  html.embed .hdr,html.embed footer,html.embed #inv-consent-panel,html.embed .palette,html.embed .ap-back,html.embed .ap-bk{display:none!important}html.embed body{padding-top:0!important}html.embed .ap-h{padding-right:210px}@media(max-width:800px){html.embed .ap-h{padding-right:0;padding-top:56px}}
  .pk{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:20px;background:rgba(6,6,8,.55);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);opacity:0;transition:opacity .22s ease}.pk.on{opacity:1}
  .pk-sheet{position:relative;width:min(600px,100%);height:min(88vh,860px);border-radius:26px;overflow:hidden;background:#0b0b0d;border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 120px rgba(0,0,0,.6);transform:translateY(14px) scale(.985);transition:transform .26s cubic-bezier(.2,.8,.2,1)}.pk.on .pk-sheet{transform:none}
  .pk-sheet iframe{width:100%;height:100%;border:0;display:block;background:transparent;opacity:0;transition:opacity .25s ease}.pk-sheet iframe.ready{opacity:1}.pk-load{position:absolute;inset:0;padding:28px 24px;display:grid;align-content:start;gap:14px;pointer-events:none;transition:opacity .25s}.pk-load.gone{opacity:0}.pk-load i{display:block;border-radius:12px;background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.11),rgba(255,255,255,.05));background-size:200% 100%;animation:pkSh 1.2s linear infinite}@keyframes pkSh{to{background-position:-200% 0}}:root[data-theme=light] .pk-sheet{background:#fff}@media(prefers-reduced-motion:reduce){.pk-load i{animation:none}}:root[data-theme=light] .pk-load i{background:linear-gradient(90deg,rgba(0,0,0,.05),rgba(0,0,0,.1),rgba(0,0,0,.05));background-size:200% 100%}
  .pk-x,.pop-x{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(30,30,34,.72);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;cursor:pointer;transition:background .15s,transform .15s}.pk-x:hover,.pop-x:hover{background:rgba(255,255,255,.16);transform:scale(1.06)}.pk-x:focus-visible,.pop-x:focus-visible{outline:2px solid #ff7a1a;outline-offset:2px}.pk-x svg,.pop-x svg{width:16px;height:16px}
  .pk-x{position:absolute;top:14px;right:14px;z-index:3}.pk-full{position:absolute;top:14px;right:64px;z-index:3;height:40px;display:inline-flex;align-items:center;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(30,30,34,.72);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;font-size:13px;text-decoration:none}.pk-full:hover{background:rgba(255,255,255,.16)}
  .pk-s{align-content:start;padding-top:9vh}.pk-sb{width:min(720px,100%);border-radius:26px;background:#0e0e11;border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 120px rgba(0,0,0,.6);overflow:hidden;transform:translateY(-8px);transition:transform .26s cubic-bezier(.2,.8,.2,1)}.pk.on .pk-sb{transform:none}
  .pk-in{display:flex;align-items:center;gap:12px;padding:0 20px;height:68px;border-bottom:1px solid rgba(255,255,255,.1)}.pk-in svg{width:20px;height:20px;opacity:.6;flex:none}.pk-in input{-webkit-appearance:none;appearance:none;outline:0!important;box-shadow:none!important;border-radius:0!important;padding:0!important;flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:500 18px/1 inherit;font-family:inherit;height:100%}.pk-in input::-webkit-search-cancel-button{display:none}.pk-in input:focus,.pk-in input:focus-visible{outline:0!important;box-shadow:none!important}.pk-in kbd{font:500 11px Inter,sans-serif;opacity:.55;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:3px 6px}
  .pk-r{max-height:min(60vh,520px);overflow:auto;padding:8px}.pk-r h6{margin:12px 12px 6px;font:600 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.45)}
  .pk-i{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;border:0;background:none;color:inherit;text-align:left;font:inherit;padding:10px 12px;border-radius:14px;cursor:pointer;min-height:56px;text-decoration:none}.pk-i:hover,.pk-i[aria-selected=true]{background:rgba(255,255,255,.08)}
  .pk-i .ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:rgba(255,255,255,.08);color:#c9c9d1}.pk-i .ic svg,.pk-i .ic img{width:100%;height:100%;object-fit:cover}.pk-i b{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pk-i small{display:block;font-size:12px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pk-i .pv{text-align:right;font:500 13px Inter,sans-serif}.pk-i .pv i{display:block;font-style:normal;font-size:12px;margin-top:2px}
  .pk-i .u{color:#34d399}.pk-i .d{color:#f87171}.pk-i .o{color:#8b8b94}.pk-r h6 em{font-style:normal;margin-left:8px;opacity:.7}.pk-i .ic img{border-radius:50%}.pk-none{padding:28px 16px;text-align:center;opacity:.6;font-size:14px}
  @media(max-width:800px){.pk{padding:0;place-items:end center}.pk-sheet{width:100%;height:94vh;border-radius:26px 26px 0 0}.pk-s{place-items:start center;padding-top:0}.pk-sb{border-radius:0 0 26px 26px;width:100%}.pk-full{right:62px}}

  .pk-sb{width:min(780px,100%)}.pk-in{height:76px;padding:0 24px}.pk-in input{font-size:22px!important;font-weight:500;letter-spacing:-.02em}.pk-in svg{width:22px;height:22px}
  .pk-fl{display:flex;gap:8px;overflow-x:auto;padding:12px 16px 4px;scrollbar-width:none}.pk-fl::-webkit-scrollbar{display:none}
  .pk-f{flex:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:inherit;font:600 13px -apple-system,"SF Pro Text",Inter,sans-serif;border-radius:999px;height:36px;padding:0 14px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:background .15s}.pk-f:hover{background:rgba(255,255,255,.1)}.pk-f.on{background:#fff;color:#000;border-color:#fff}.pk-f em{font-style:normal;font-weight:500;opacity:.55;font-size:12px}
  .pk-body{display:block}.pk-pv{display:none}
  .pk-i{grid-template-columns:44px minmax(0,1fr) auto;min-height:64px;border-radius:18px}.pk-i .ic{width:44px;height:44px}.pk-i b{font-size:16px;letter-spacing:-.01em}.pk-i .sp{display:none}
  .pk-i .pv{text-align:right;font-family:-apple-system,"SF Pro Display",Inter,sans-serif;display:grid;justify-items:end;gap:4px}.pk-i .px{font-size:17px;font-weight:650;letter-spacing:-.025em;font-variant-numeric:tabular-nums}.pk-i .pc{font-style:normal;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;font-variant-numeric:tabular-nums}.pk-i .pc.u{background:rgba(48,209,88,.16);color:#5df08a}.pk-i .pc.d{background:rgba(255,69,58,.16);color:#ff7b72}.pk-i .pc.o{background:rgba(255,255,255,.08);color:#a1a1aa}
  .pk-r h6{display:flex;align-items:center}.pk-r h6 em{font-style:normal;margin-left:8px;opacity:.7}
  .pk-i.pk-best{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}
  .pk-s.v2 .pk-sb{width:min(860px,100%)}.pk-s.v2.v3 .pk-sb{width:min(1120px,100%)}.pk-s.v2.v3 .pk-i.pk-best{grid-template-columns:56px minmax(0,1fr) 110px auto}.pk-s.v2 .pk-i.pk-best{grid-template-columns:56px minmax(0,1fr) 120px auto;min-height:92px;padding:14px 16px;background:linear-gradient(135deg,rgba(255,122,26,.16),rgba(255,255,255,.05))}.pk-s.v2 .pk-i.pk-best .ic{width:56px;height:56px}.pk-s.v2 .pk-i.pk-best b{font-size:20px}.pk-s.v2 .pk-i.pk-best .sp{display:block}.pk-s.v2 .pk-i.pk-best .sp svg{width:120px;height:40px}.pk-s.v2 .pk-i.pk-best .px{font-size:22px}
  .pk-s.v3 .pk-sb{width:min(1120px,100%)}.pk-s.v3 .pk-body{display:grid;grid-template-columns:200px minmax(0,1fr) 320px;min-height:420px}.pk-s.v3 .pk-fl{flex-direction:column;overflow:visible;padding:16px 12px;border-right:1px solid rgba(255,255,255,.08);gap:4px}.pk-s.v3 .pk-f{border:0;background:none;border-radius:12px;height:42px;justify-content:space-between;width:100%}.pk-s.v3 .pk-f.on{background:rgba(255,255,255,.12);color:#fff}.pk-s.v3 .pk-r{max-height:min(78vh,700px)}.pk-s.v3 .pk-pv{display:block;border-left:1px solid rgba(255,255,255,.08);padding:20px;background:rgba(255,255,255,.03)}
  .pv-h{display:flex;gap:12px;align-items:center}.pv-h .ic{width:48px;height:48px;border-radius:50%;overflow:hidden;display:grid;place-items:center;flex:none}.pv-h .ic svg,.pv-h .ic img{width:100%;height:100%;object-fit:cover}.pv-h b{display:block;font-size:18px;letter-spacing:-.02em}.pv-h small{opacity:.6;font-size:12px}.pv-p{font:700 38px/1.1 -apple-system,"SF Pro Display",Inter,sans-serif;letter-spacing:-.04em;margin:18px 0 8px}.pk-pv .pc{font-style:normal;font-size:13px;font-weight:700;padding:3px 10px;border-radius:999px}.pk-pv .pc.u{background:rgba(48,209,88,.16);color:#5df08a}.pk-pv .pc.d{background:rgba(255,69,58,.16);color:#ff7b72}.pk-pv .pc.o{background:rgba(255,255,255,.08)}.pv-c svg{width:100%;height:80px;margin:16px 0}.pv-r{display:grid;grid-template-columns:1fr auto;gap:8px 12px;font-size:13px}.pv-r span{opacity:.6}.pv-r b{font-variant-numeric:tabular-nums}.pv-go{margin-top:18px;width:100%;height:46px;border-radius:14px;border:0;background:#fff;color:#000;font:600 14px Inter,sans-serif;cursor:pointer}
  @media(max-width:800px){.pk-i{grid-template-columns:32px minmax(0,1fr) auto!important;gap:10px;min-height:54px;padding:8px 10px;border-radius:14px}.pk-i .ic{width:32px!important;height:32px!important}.pk-i .ic svg{width:66%;height:66%}.pk-i b{font-size:14.5px}.pk-i small{font-size:11.5px}.pk-i .px{font-size:15px}.pk-i .pc{font-size:11px;padding:1px 7px}.pk-s .pk-i.pk-best{grid-template-columns:40px minmax(0,1fr) auto!important;min-height:68px!important;padding:10px 12px!important}.pk-s .pk-i.pk-best .ic{width:40px!important;height:40px!important}.pk-s .pk-i.pk-best b{font-size:16px!important}.pk-s .pk-i.pk-best .px{font-size:17px!important}.pk-f{height:32px;font-size:12.5px;padding:0 12px}.pk-s .pk-sb{width:100%}.pk-in{height:64px;padding:0 18px}.pk-in input{font-size:18px!important}.pk-s.v3 .pk-body{display:block}.pk-s.v3 .pk-fl{flex-direction:row;overflow-x:auto;border:0;padding:12px 16px 4px}.pk-s.v3 .pk-f{width:auto;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)}.pk-s.v3 .pk-pv{display:none}.pk-s.v2 .pk-i.pk-best{grid-template-columns:48px minmax(0,1fr) auto}.pk-s.v2 .pk-i.pk-best .sp{display:none}}
  .ai-c{border-radius:28%!important}.ai-c svg{width:100%!important;height:100%!important;display:block}.pk-i .ic:has(.ai-c),.pv-h .ic:has(.ai-c){border-radius:28%!important;background:none!important}
  .ai-c{width:100%!important;height:100%!important}
  .pk-sector{width:min(780px,100%)!important;height:auto!important;max-height:88vh}.pk-pbody{max-height:88vh;overflow:auto;padding:26px 26px 22px}.pk-sector .mh-p{background:none!important;border:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;padding:0!important;border-radius:0!important}.pk-sector .mh-ph{padding-right:52px}
  /* glass: the page (globe, map, lists) stays visible, blurred, behind the panels */
  .pk{background:rgba(6,6,8,.28)!important;-webkit-backdrop-filter:blur(14px) saturate(1.2)!important;backdrop-filter:blur(14px) saturate(1.2)!important}
  .pk-sb,.pk-sheet{background:rgba(12,12,15,.46)!important;-webkit-backdrop-filter:blur(24px) saturate(1.5)!important;backdrop-filter:blur(24px) saturate(1.5)!important;border-color:rgba(255,255,255,.14)!important}
  .pk-in{border-bottom-color:rgba(255,255,255,.08)!important}.pk-s.v3 .pk-pv{background:rgba(255,255,255,.04)!important}
  @media(max-width:800px){.pk-s{padding:0}.pk-s .pk-sb{border-radius:0 0 26px 26px;border-top:0;height:auto}.pk-sheet{background:rgba(12,12,15,.62)!important}}
  .pk-s .pk-r.popular,.pk-s.v3 .pk-r.popular{max-height:min(38vh,292px);overflow-y:auto;-webkit-mask-image:linear-gradient(#000 calc(100% - 28px),transparent);mask-image:linear-gradient(#000 calc(100% - 28px),transparent);padding-bottom:22px}
  @media(min-width:801px){.pk-s .pk-r.popular,.pk-s.v3 .pk-r.popular{max-height:min(78vh,700px);-webkit-mask-image:none;mask-image:none;padding-bottom:8px}}
  .pk-s.v3 .pk-pv{overflow:auto;max-height:min(78vh,700px)}.pv-px{display:flex;align-items:baseline;gap:10px;margin:14px 0 4px}.pv-px .pv-p{margin:0!important;font-size:30px!important}.pv-c svg{height:54px!important;margin:8px 0 10px!important}
  .pv-perf{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:2px 0 14px}.pv-perf>div{padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05)}.pv-perf small{display:block;color:var(--fg3);font-size:11px;margin-bottom:3px}.pv-perf .pc{font-size:12px!important;padding:2px 7px!important}
  .pv-rg{margin:0 0 12px}.pv-rl{display:flex;justify-content:space-between;gap:8px;font-size:12px}.pv-rl span{color:var(--fg3)}.pv-rl b{font-weight:600;font-variant-numeric:tabular-nums}.pv-bar{position:relative;height:4px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:7px}.pv-bar i{position:absolute;top:50%;width:9px;height:9px;border-radius:50%;background:#fff;transform:translate(-50%,-50%)}
  .pv-vol{display:flex;justify-content:space-between;font-size:12px;margin:0 0 14px}.pv-vol span{color:var(--fg3)}
  .pv-n{margin:6px 0 12px;display:grid;gap:8px}.pv-n a{display:block;text-decoration:none;color:inherit;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05)}.pv-n a b{display:block;font-size:12.5px;line-height:1.35;font-weight:600}.pv-n a small{color:var(--fg3);font-size:11px}
  .pk-s .pv-go{position:sticky;bottom:0;box-shadow:0 -14px 18px rgba(12,12,15,.9)}
  .pv-bar{height:8px!important;border-radius:5px!important;margin-top:8px!important;background:linear-gradient(90deg,rgba(248,113,113,.38),rgba(255,255,255,.1) 50%,rgba(52,211,153,.38))!important}.pv-bar i{width:14px!important;height:14px!important;border:3px solid #17171b}
  .pv-rl b{color:#c9c9d1;font-size:12px}.pv-re{display:flex;justify-content:space-between;margin-top:6px;color:var(--fg3);font-size:11.5px;font-variant-numeric:tabular-nums}.pv-rg{margin:0 0 16px!important}
  .pv-vol{display:block!important;margin:0 0 16px!important}.pv-vol .pv-rl{font-size:12px}.pv-vb{display:flex;align-items:flex-end;gap:5px;height:34px;margin-top:8px}.pv-vb i{flex:1;border-radius:3px;background:rgba(255,255,255,.26)}
  @media(prefers-reduced-motion:reduce){.pk,.pk-sheet,.pk-sb{transition:none}}`;
  css.textContent += `
  .pk-i .ic,.pv-h .ic{background:#202024}.pk-i .ic img,.pv-h .ic img{object-fit:contain;box-sizing:border-box;padding:14%;background:transparent}.pk-i .ic .ai-c,.pk-i .ic:has(.ai-c){border-radius:50%!important}.pk-i .ic .ai-c{overflow:hidden}.pk-f{min-height:44px}.pk-i[data-nav^="story:"] b{white-space:normal;line-height:1.4}.pv-go{display:flex;align-items:center;justify-content:center;text-decoration:none}.pk-in input{font-family:Inter,sans-serif!important}
  @media(max-width:800px){.pk{backdrop-filter:blur(14px) saturate(1.4)!important}.pk-sb,.pk-sheet{background:rgba(10,10,12,.35)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.pk-x,.pk-full{backdrop-filter:none!important}.pk-in kbd{display:none}.pk-in{padding:0 12px}.pk-in input{font-size:16px!important}.pk-s .pk-r{max-height:calc(100dvh - 140px)}.pk-s.v3 .pk-f{min-height:44px}.pk-i .ic{width:36px!important;height:36px!important}}
  `;
  document.head.appendChild(css);
  if (EMBED) { document.documentElement.classList.add('embed'); const b = document.createElement('base'); b.target = '_top'; document.head.prepend(b); return; }
  const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>', SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let layer, prevFocus, onKey;
  function mount(cls, html) {
    close(true); prevFocus = document.activeElement; layer = document.createElement('div'); layer.className = 'pk ' + cls; layer.innerHTML = html; document.body.appendChild(layer); document.documentElement.style.overflow = 'hidden';
    layer.addEventListener('mousedown', e => { if (e.target === layer) close(); });
    onKey = e => { if(e.key==='Tab'){const nodes=[...layer.querySelectorAll('button,input,a[href],iframe,[tabindex]')].filter(n=>!n.disabled && n.tabIndex>=0 && n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}} if (e.key === 'Escape') { e.preventDefault(); close(); } }; document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => layer.classList.add('on')); return layer;
  }
  function close(silent) { if (!layer) return; const l = layer; layer = null; document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; l.classList.remove('on'); setTimeout(() => l.remove(), 200); if (!silent && /^#a=/.test(location.hash)) history.back(); if(!silent) try { const target=prevFocus?.closest?.('#sbox');if(target){target.tabIndex=-1;target.focus();}else prevFocus?.focus?.(); } catch {} }
  function open(sym, push = true) {
    const url = ROOT + 'asset.html?s=' + encodeURIComponent(sym);
    const l = mount('', `<div class="pk-sheet" role="dialog" aria-modal="true" aria-label="Asset details"><a class="pk-full" href="${url}">Open full page</a><button class="pk-x" type="button" aria-label="Close">${X}</button><div class="pk-load" aria-hidden="true"><i style="width:52%;height:44px"></i><i style="width:34%;height:38px"></i><i style="width:46%;height:32px"></i><i style="height:230px"></i><i style="height:64px"></i></div><iframe title="Asset details" src="${url}&embed=1"></iframe></div>`);
    const fr = l.querySelector('iframe'); fr.addEventListener('load', () => { fr.classList.add('ready'); const ld = l.querySelector('.pk-load'); ld?.classList.add('gone'); setTimeout(() => ld?.remove(), 300); }, { once: true });
    l.querySelector('.pk-x').onclick = () => close(); l.querySelector('.pk-x').focus();
    if (push && location.hash !== '#a=' + encodeURIComponent(sym)) { try { history.pushState({ pk: 1 }, '', '#a=' + encodeURIComponent(sym)); } catch {} }  // one history entry per opened asset, so one Escape / Back closes it
  }
  // the asset sheet's frame asks to close when Escape is pressed inside it (one press is enough)
  window.addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.inv === 'peek-close') close(); });
  window.addEventListener('popstate', () => { const m = /^#a=(.+)/.exec(location.hash), n = /^#s=(.+)/.exec(location.hash); if (m) open(decodeURIComponent(m[1]), false); else if (n && window.InvPeek?.onSector) InvPeek.onSector(decodeURIComponent(n[1]), false); else close(true); });
  function panel(html, hash) {
    const l = mount('', `<div class="pk-sheet pk-sector" role="dialog" aria-modal="true" aria-label="Details"><button class="pk-x" type="button" aria-label="Close">${X}</button><div class="pk-pbody">${html}</div></div>`);
    l.querySelector('.pk-x').onclick = () => close(); l.querySelector('.pk-x').focus();
    l.querySelector('.pk-pbody').addEventListener('click', e => { const r = e.target.closest('[data-s]'); if (r) { close(true); setTimeout(() => open(r.dataset.s), 30); } });
    if (hash) { try { history.pushState({ pk: 1 }, '', hash); } catch {} }
    return l;
  }
  // ---- search ----
  if (!window.AssetIcons) { const sc = document.createElement('script'); sc.src = ROOT + 'assets/asset-icons.js'; document.head.appendChild(sc); }
  let DATA = null, loading;
  const jf = u => fetch(ROOT + u).then(r => r.json());
  const load = () => loading || (loading = Promise.all([
    jf('data/asset-importance.json').catch(() => ({ranks:{}})),
    jf('assets/globe/markets.json').catch(() => ({ assets: [] })),
    jf('data/crypto-top30.json').catch(() => ({ coins: [] })),
    jf('assets/globe/iso.json').catch(() => ({})),
    jf('assets/globe/news-live.json').catch(() => ({ stories: [] })),
    jf('assets/globe/news-archive.json').catch(() => ({ stories: [] })),
    window.INV_LIVE_URL && window.InvConsent?.allows('live') ? fetch(window.INV_LIVE_URL, { cache: 'no-store' }).then(r => r.json()).catch(() => null) : Promise.resolve(null)
  ]).then(([importance, m, top30, iso, n, arc, live]) => {
    const by = new Map((m.assets || []).map(a => [a.s, a]));
    // Metadata only from the shared catalogue; prices must exist in the saved real feed.
    for (const meta of window.MOCK?.assets || []) {
      const q = window.QUOTES?.q?.[meta.s]; if (!q || meta.c !== 'crypto') continue;
      const sym=meta.s+'-USD'; by.delete(meta.s); by.set(sym,{s:sym,n:meta.n,t:'crypto',p:q.p,d:q.d,w:q.w,sp:q.sp,h:q.hi,l:q.lo,v:q.v,cur:q.cur});
    }
    if (live?.p) for (const [id, v] of Object.entries(live.p)) { const a = by.get(id); if (a) { a.p = v.p; a.d = v.pc; a.h = v.h; a.l = v.l; a.v = v.v; } else by.set(id, { s: id, n: v.n, t: 'crypto', p: v.p, d: v.pc, h: v.h, l: v.l, v: v.v }); }
    for(const a of by.values()){const q=window.QUOTES?.q?.[a.s.replace(/-USD$/, '')];if(q){a.h=q.hi;a.l=q.lo;a.v=q.v;}}
    const seen = new Set(), stories = []; for (const x of [...(n.stories || []), ...(arc.stories || [])]) if (x.id && !seen.has(x.id)) { seen.add(x.id); stories.push(x); }
    DATA = { importance: importance.ranks, cryptoRank: Object.fromEntries((top30.coins || []).map(c => [c.s, c.rank])), assets: [...by.values()], iso, countries: Object.keys(iso).filter(c => !/\bIs\.$/.test(c)), stories };
  }));
  const label = a => a.s.replace(/-USD$/, '').replace(/=F$/, '').replace(/^\^/, '');
  const money = (v, a) => window.InvPrefs ? InvPrefs.fmt(v, a) : v?.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const rank = (q, a) => { const s = label(a).toLowerCase(), n = (a.n || '').toLowerCase(); if (s === q) return 0; if (n === q) return 1; if (s.startsWith(q)) return 2; if (n.startsWith(q)) return 3; if (n.split(/[\s.-]+/).some(w => w.startsWith(q))) return 4; if (n.includes(q) || s.includes(q)) return 5; return 9; };
  const marketsSearch = () => new URLSearchParams(location.search).get('mode') === 'markets';
  const FILTERS = [['all', 'All'], ['stocks', 'Companies'], ['crypto', 'Crypto'], ['idx', 'Indices'], ['cmd', 'Commodities'], ['fx', 'Currencies'], ['countries', 'Countries'], ['exchanges', 'Exchanges'], ['articles', 'Articles']];
  const GROUPS = { stocks: ['Companies', a => a.t === 'stocks' && !['Index','Country ETF'].includes(a.g)], idx: ['Indices', a => a.t === 'stocks' && a.g === 'Index'], crypto: ['Crypto', a => a.t === 'crypto' && DATA.cryptoRank[label(a)] != null], cmd: ['Commodities', a => a.t === 'cmd'], fx: ['Currencies', a => a.t === 'fx'] };
  
  const fmtP = d => isFinite(d) ? `<i class="pc ${d > 0.005 ? 'u' : d < -0.005 ? 'd' : 'o'}"><span class="direction-arrow">${d > 0.005 ? '↑' : d < -0.005 ? '↓' : '↔'}</span> ${Math.abs(d).toFixed(2)}%</i>` : '';
  const kind = a => ({ stocks: a.g === 'Index' ? 'Index' : a.g === 'Country ETF' ? 'ETF' : 'Company', crypto: 'Crypto', cmd: 'Commodity', fx: 'Currency pair' })[a.t] || '';
  const spark = (v, w = 260, h = 70) => { v = (v || []).filter(isFinite); if (v.length < 2) return ''; const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, up = v[v.length - 1] >= v[0], c = up ? '#34d399' : '#f87171', pts = v.map((y, i) => `${(i / (v.length - 1) * w).toFixed(1)},${(h - 4 - (y - lo) / r * (h - 8)).toFixed(1)}`).join(' L'); return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M${pts}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`; };
  const row = (a, cls = '') => `<button class="pk-i ${cls}" type="button" data-a="${esc(a.s)}"><span class="ic">${window.AssetIcons ? AssetIcons.icon(a) : ''}</span><span><b>${esc(a.n)}</b><small>${esc(label(a))} · ${kind(a)}</small></span>${cls ? `<span class="sp">${spark(a.sp, 120, 40)}</span>` : ''}<span class="pv"><span class="px">${money(a.p, a)}</span>${fmtP(a.d)}</span></button>`;
  const lnk = (href, ic, t, sub, nav = '') => `<a class="pk-i" href="${esc(href)}" ${nav ? `data-nav="${esc(nav)}"` : ''}><span class="ic">${ic}</span><span><b>${esc(t)}</b><small>${esc(sub || '')}</small></span><span></span></a>`;
  function search(q) {
    const out = []; if (!DATA) return out;
    const ranked = q ? DATA.assets.map(a => [rank(q, a), a]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || (b[1].m || 0) - (a[1].m || 0)).map(x => x[1]) : [...DATA.assets].sort((a,b) => (DATA.importance[a.s] || 10000) - (DATA.importance[b.s] || 10000) || (b.v || b.m || 0) - (a.v || a.m || 0));
    // one row per company: the same name listed in several places (e.g. Berkshire BRKB and BRK-B, ADR and local line) shows once, the most important listing
    { const seen = new Set(); const keep = []; for (const x of [...ranked].sort((p, q) => (DATA.importance[p.s] || 10000) - (DATA.importance[q.s] || 10000))) { const key = (x.n || '').toLowerCase().replace(/[^a-z0-9]/g, '') + '|' + x.t; if (x.t !== 'stocks' || !seen.has(key)) { seen.add(key); keep.push(x); } } const ok = new Set(keep); ranked.splice(0, ranked.length, ...ranked.filter(x => ok.has(x))); }
    for (const k of ['stocks', 'crypto', 'idx', 'cmd', 'fx']) { const items = ranked.filter(GROUPS[k][1]); if(k === 'idx') {const major=['^GSPC','^IXIC','^DJI','^FTSE','^GDAXI','^FCHI','^N225','^HSI','000001.SS','^BSESN','^NSEI','^AXJO'];items.sort((a,b)=>(major.includes(a.s)?major.indexOf(a.s):100)-(major.includes(b.s)?major.indexOf(b.s):100));} if (k === 'crypto' && !q) items.sort((a, b) => DATA.cryptoRank[label(a)] - DATA.cryptoRank[label(b)]);
      if (items.length) out.push({ key: k, title: GROUPS[k][0], items, html: (i, c) => row(i, c), type: 'asset' }); }
    const sec = q ? (window.InvSectors ? InvSectors.list : []).filter(x => x.name.toLowerCase().includes(q)) : [];
    if (sec.length) out.push({ key: 'sectors', fk: 'stocks', title: 'Sectors', items: sec, html: x => lnk(ROOT + 'assets/globe/news.html?sector=' + encodeURIComponent(x.slug), InvSectors.icon(x.name), x.name, 'Sector · articles and sector fund move') });
    const articleCount = c => DATA.stories.filter(s => s.location?.country === c).length;
    const cs = DATA.countries.filter(c => !q || c.toLowerCase().includes(q)).sort((a,b) => articleCount(b) - articleCount(a));
    if (cs.length) out.push({ key: 'countries', title: 'Countries', items: cs, html: c => lnk(ROOT + 'assets/globe/news.html?country=' + encodeURIComponent(c) + (marketsSearch() ? '&mode=markets' : ''), DATA.iso[c] ? `<img src="${ROOT}assets/globe/flags/${DATA.iso[c].toLowerCase()}.svg" alt="">` : '', c, articleCount(c) + ' articles', 'country:' + c) });
    if(marketsSearch()){
      const exchanges=(DATA.exchanges||[]).filter(e=>!q||[e.mic,e.short,e.name,e.city,e.countryName].join(' ').toLowerCase().includes(q));
      if(exchanges.length)out.push({key:'exchanges',title:'Exchanges',items:exchanges,html:e=>lnk(ROOT+'assets/globe/news.html?mode=markets&country='+encodeURIComponent(e.countryName)+'&exchange='+encodeURIComponent(e.mic),DATA.iso[e.countryName]?`<img src="${ROOT}assets/globe/flags/${DATA.iso[e.countryName].toLowerCase()}.svg" alt="">`:'',e.short+' · '+e.name,e.city+' · '+e.currency,'market:'+e.mic+':'+e.countryName)});
    }
    const ns = DATA.stories.filter(s => !q || ((s.headline || '') + ' ' + (s.summary || '') + ' ' + (s.entities || []).map(e => e.name).join(' ')).toLowerCase().includes(q)).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)).slice(0,q ? 1000 : 20);
    if (ns.length) out.push({ key: 'articles', title: 'Articles', items: ns, html: s => lnk(ROOT + 'assets/globe/news.html?story=' + encodeURIComponent(s.id), esc((s.source?.name || 'N').slice(0,2).toUpperCase()), s.headline, (s.source?.name || '') + ' · ' + new Date(s.published_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), 'story:' + s.id), more: 'articles' });
    return out;
  }
  function searchUI() {
    const V = '3';
    const l = mount('pk-s ' + [...V].map(c => 'v' + c).join(' '), `<div class="pk-sb" role="dialog" aria-modal="true" aria-label="Search"><div class="pk-in">${SEARCH}<input type="search" autocomplete="off" spellcheck="false" placeholder="${marketsSearch()?'Search countries, exchanges, indices &amp; companies':'Search assets, countries &amp; articles'}" aria-label="Search"><kbd>esc</kbd></div><div class="pk-body"><nav class="pk-fl" aria-label="Filters"></nav><div class="pk-r"><div class="pk-none">Loading…</div></div><aside class="pk-pv" aria-live="polite"></aside></div></div>`);
    const inp = l.querySelector('input'), res = l.querySelector('.pk-r'), fl = l.querySelector('.pk-fl'), pv = l.querySelector('.pk-pv'); inp.focus(); let sel = 0, F = 'all', SEC = [];
    const items = () => [...res.querySelectorAll('.pk-i')], mark = () => { items().forEach((e, i) => e.setAttribute('aria-selected', i === sel ? 'true' : 'false')); preview(); };
    const count = k => k === 'all' ? SEC.reduce((n, s) => n + s.items.length, 0) : SEC.filter(s => s.key === k || s.fk === k).reduce((n, s) => n + s.items.length, 0);
    const HC = {}; const histFor = a => HC[a.s] || (HC[a.s] = fetch(ROOT + 'assets/hist/' + encodeURIComponent(a.s.replace(/-USD$|=F$|^\^/g, '')) + '.json').then(r => r.ok ? r.json() : null).catch(() => null));
    const newsFor = a => { const base = a.s.replace(/-USD$|=F$/, '').toUpperCase(), nm = (a.n || '').toLowerCase(); return DATA.stories.filter(s => (s.impacts || []).some(i => { const t = String(i.ticker || '').toUpperCase(); return t === a.s.toUpperCase() || t === base || (nm.length > 3 && String(i.name || '').toLowerCase() === nm); }) || (s.entities || []).some(en => nm.length > 3 && String(en.name || '').toLowerCase() === nm)).sort((x, y) => Date.parse(y.published_at) - Date.parse(x.published_at)); };
    const cell = (l, v) => `<div><small>${l}</small><b>${v}</b></div>`;
    const rg = (l, lo, hi, cur, a) => { if (!(isFinite(lo) && isFinite(hi) && hi > lo)) return ''; const f = Math.max(0, Math.min(100, (cur - lo) / (hi - lo) * 100)); return `<div class="pv-rg"><div class="pv-rl"><span>${l}</span><b>${f.toFixed(0)}% of range</b></div><div class="pv-bar"><i style="left:${f.toFixed(0)}%"></i></div><div class="pv-re"><span>${money(lo, a)}</span><span>${money(hi, a)}</span></div></div>`; };
    const preview = () => {
      const e = items()[sel], a = e && DATA?.assets.find(x => x.s === e.dataset.a);
      if (!a) {
        const nav = e?.dataset.nav || '', key = nav.slice(nav.indexOf(':')+1);
        if (nav.startsWith('country:')) {
          const arts = DATA.stories.filter(s => s.location?.country === key).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));
          pv.innerHTML = `<div class="pv-h"><span class="ic"><img src="${ROOT}assets/globe/flags/${DATA.iso[key]?.toLowerCase()}.svg" alt=""></span><b>${esc(key)}</b></div><p>${arts.length} articles</p><div class="pv-n">${arts.slice(0,3).map(s=>`<a href="${ROOT}assets/globe/news.html?story=${encodeURIComponent(s.id)}"><b>${esc(s.headline)}</b><small>${esc(s.source?.name)}</small></a>`).join('')}</div><h4>Markets</h4>${DATA.assets.filter(a => a.k === key && a.g === 'Index').slice(0,5).map(a=>row(a)).join('')}<a class="pv-go" href="${e.href}">Open ${esc(key)}</a>`;
        } else if (nav.startsWith('story:')) {
          const s = DATA.stories.find(s=>s.id === key);
          pv.innerHTML = s ? `<h3>${esc(s.headline)}</h3><small>${esc(s.source?.name)} · ${new Date(s.published_at).toLocaleString()}</small><p>${esc(s.summary)}</p><h4>Affected assets</h4>${(s.impacts || []).map(i=>`<p><span class="direction-arrow">${i.direction === 'up' ? '↑' : i.direction === 'down' ? '↓' : '↔'}</span> ${esc(i.name)}</p>`).join('')}<a class="pv-go" href="${e.href}">Open article</a>` : '';
        } else pv.innerHTML = '<div class="pk-none">Select a result to preview it.</div>'; return;
      }
      const arts = newsFor(a), w = a.w, base = () => `<div class="pv-h"><span class="ic">${window.AssetIcons ? AssetIcons.icon(a) : ''}</span><div><b>${esc(a.n)}</b><small>${esc(label(a))} · ${kind(a)}</small></div></div><div class="pv-px"><span class="pv-p">${money(a.p, a)}</span>${fmtP(a.d)}</div>`;
      const draw = (H) => {
        const d = H?.daily || [], vb = d.slice(-14).map(r => r[5]).filter(x => x > 0), closes = d.slice(-30).map(r => r[4]).filter(isFinite), sp = (closes.length > 1 ? closes : a.sp || []), m30 = sp.length > 1 ? (sp[sp.length - 1] / sp[0] - 1) * 100 : null, last = d[d.length - 1], vol = a.v ? (window.InvPrefs ? InvPrefs.compact(a.v, { t: 'crypto' }) : null) : (last && last[5] ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(last[5]) : null);
        pv.innerHTML = base() + `<div class="pv-c">${spark(sp)}</div><div class="pv-perf">${cell('Today', fmtP(a.d) || '—')}${cell('Week', isFinite(w) ? fmtP(w) : sp.length > 5 ? fmtP((sp[sp.length - 1] / sp[sp.length - 6] - 1) * 100) : '—')}${cell('Month', m30 != null ? fmtP(m30) : '—')}</div>`
          + rg('Day range', a.l, a.h, a.p, a) + rg('52-week range', H?.lo52, H?.hi52, a.p, a) + (sp.length > 1 ? rg('1-month range', Math.min(...sp), Math.max(...sp), a.p, a) : '')
          + (vol ? `<div class="pv-vol"><div class="pv-rl"><span>Volume</span><b>${vol}</b></div>${vb.length > 3 ? `<div class="pv-vb">${vb.map(x => `<i style="height:${Math.max(8, x / Math.max(...vb) * 100).toFixed(0)}%"></i>`).join('')}</div>` : ''}</div>` : '')
          + `<div class="pv-n"><div class="ttl">${arts.length ? arts.length + (arts.length === 1 ? ' article' : ' articles') + ' naming ' + esc(a.n) : 'No article naming ' + esc(a.n) + ' yet'}</div>${arts.slice(0, 2).map(s => `<a href="${ROOT}assets/globe/news.html?story=${encodeURIComponent(s.id)}" data-nav="story:${esc(s.id)}"><b>${esc(s.headline)}</b><small>${esc(s.source?.name || '')} · ${new Date(s.published_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small></a>`).join('')}</div>`
          + `<button type="button" class="pv-go" data-a="${esc(a.s)}">Open ${esc(a.n)}</button>`;
      };
      draw(null); histFor(a).then(H => { if (H && items()[sel] === e) draw(H); });
    };
    const paint = () => {
      if (!DATA) return; const q = inp.value.trim().toLowerCase(); let h = '';
      SEC = search(q);
      fl.innerHTML = FILTERS.filter(([k]) => (k !== 'exchanges' || marketsSearch()) && (!q || k === 'all' || count(k))).map(([k, t]) => `<button type="button" class="pk-f${k === F ? ' on' : ''}" data-f="${k}">${t}${q ? `<em>${count(k)}</em>` : ''}</button>`).join('');
      const shown = SEC.filter(s => F === 'all' || s.key === F || s.fk === F || (F === 'stocks' && s.key === 'sectors'));
      for (const s of shown) { const lim = s.key === 'popular' ? 20 : F === 'all' ? (s.key === 'articles' ? 5 : 4) : 40; h += `<h6>${s.title}${q ? `<em>${s.items.length}</em>` : ''}</h6>` + s.items.slice(0, lim).map((x, i) => s.html(x, i === 0 && s.type === 'asset' && F === 'all' && q ? 'pk-best' : '')).join(''); }
      res.classList.toggle('popular', false); res.scrollTop = 0;
      res.innerHTML = h || `<div class="pk-none">No result for “${esc(inp.value)}”.</div>`; sel = 0; mark();
    };
    load().then(async()=>{if(marketsSearch()&&!DATA.exchanges){try{const r=await fetch(ROOT+'data/exchanges.json',{cache:'no-cache'});if(r.ok){const ex=await r.json();DATA.exchanges=Object.entries(ex).map(([mic,e])=>({mic,...e,countryName:DATA.countries.find(c=>DATA.iso[c]===e.country)})).filter(e=>e.countryName);}}catch{}}paint();}); inp.addEventListener('input', () => { F = 'all'; paint(); });
    fl.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { F = b.dataset.f; paint(); inp.focus(); } });
    const go = s => { close(true); setTimeout(() => open(s), 30); };
    res.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { go(b.dataset.a); return; } const a = e.target.closest('[data-nav]'); if (a && window.InvGlobeNav) { const [k, v] = [a.dataset.nav.split(':')[0], a.dataset.nav.slice(a.dataset.nav.indexOf(':') + 1)]; e.preventDefault(); if (InvGlobeNav[k] && InvGlobeNav[k](v)) close(true); else location.href = a.href; } });
    res.addEventListener('mousemove', e => { const b = e.target.closest('.pk-i'); if (b) { const i = items().indexOf(b); if (i >= 0 && i !== sel) { sel = i; mark(); } } });
    pv.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) go(b.dataset.a); });
    inp.addEventListener('keydown', e => { const it = items(); if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, it.length - 1); mark(); it[sel]?.scrollIntoView({ block: 'nearest' }); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); it[sel]?.scrollIntoView({ block: 'nearest' }); } else if (e.key === 'Enter') { e.preventDefault(); it[sel]?.click(); } });
  }
  // ---- wiring ----
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const s = e.target.closest('.search-btn, [data-search], .hn-search, .gsearch, #sbox'); if (s) { e.preventDefault(); e.stopImmediatePropagation(); searchUI(); return; }
    const a = e.target.closest('a[href*="asset.html?s="]'); if (a && !a.closest('.pk')) { const m = /asset\.html\?s=([^&#]+)/.exec(a.getAttribute('href')); if (m) { e.preventDefault(); open(decodeURIComponent(m[1])); } }
  }, true);
  document.addEventListener('keydown', e => { if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !e.altKey && !e.metaKey && !e.ctrlKey && !e.target.closest('input,textarea,[contenteditable=true]'))) { e.preventDefault(); e.stopImmediatePropagation(); searchUI(); } }, true);
  window.InvPeek = { open, search: searchUI, close, panel };
  const m0 = /^#a=(.+)/.exec(location.hash); if (m0) document.addEventListener('DOMContentLoaded', () => open(decodeURIComponent(m0[1]), false));
  const n0 = /^#s=(.+)/.exec(location.hash); if (n0) window.addEventListener('load', () => setTimeout(() => window.InvPeek?.onSector?.(decodeURIComponent(n0[1]), false), 600));
})();
