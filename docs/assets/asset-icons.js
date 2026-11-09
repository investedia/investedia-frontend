// One place for asset logos: local logo file -> Brandfetch -> flag -> clean glyph/initial tile. Never a white box.
(() => {
  const BASE = (() => { try { return new URL('.', document.currentScript.src).href; } catch { return ''; } })() || 'assets/';
  const BFID = typeof BF !== 'undefined' ? BF : '1idNJqyfpKbma454ae4';
  let LOGOS = {}; const ready = fetch(BASE + 'globe/logos.json').then(r => r.json()).then(j => { LOGOS = j; }).catch(() => {});
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = d => `<svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const G = {
    barrel: svg("<path d=\"M7.278 4h9.444a2 2 0 0 1 1.841 1.22c.958 2.26 1.437 4.52 1.437 6.78c0 2.26 -.479 4.52 -1.437 6.78a2 2 0 0 1 -1.841 1.22h-9.444a2 2 0 0 1 -1.841 -1.22c-.958 -2.26 -1.437 -4.52 -1.437 -6.78c0 -2.26 .479 -4.52 1.437 -6.78a2 2 0 0 1 1.841 -1.22z\" /> <path d=\"M14 4c.667 2.667 1 5.333 1 8s-.333 5.333 -1 8\" /> <path d=\"M10 4c-.667 2.667 -1 5.333 -1 8s.333 5.333 1 8\" /> <path d=\"M4.5 16h15\" /> <path d=\"M19.5 8h-15\" />"),
    flame: svg("<path d=\"M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z\" />"),
    fuel: svg("<path d=\"M14 11h1a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0v-7l-3 -3\" /> <path d=\"M4 20v-14a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v14\" /> <path d=\"M3 20l12 0\" /> <path d=\"M18 7v1a1 1 0 0 0 1 1h1\" /> <path d=\"M4 11l10 0\" />"),
    coin: svg("<path d=\"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\" /> <path d=\"M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1\" /> <path d=\"M12 7v10\" />"),
    box: svg("<path d=\"m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.95 8.41a2 2 0 0 0-.95 1.7v5.82a2 2 0 0 0 .88 1.66l6.05 4.07a2 2 0 0 0 2.17.05l9.95-6.12a2 2 0 0 0 .95-1.7V8.06a2 2 0 0 0-.88-1.66Z\" /> <path d=\"M10 22v-8L2.25 9.15\" /> <path d=\"m10 14 11.77-6.87\" />"),
    wheat: svg("<path d=\"M2 22 16 8\" /> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\" /> <path d=\"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\" /> <path d=\"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\" /> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\" /> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\" /> <path d=\"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\" /> <path d=\"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\" />"),
    cup: svg("<path d=\"M3 14c.83 .642 2.077 1.017 3.5 1c1.423 .017 2.67 -.358 3.5 -1c.83 -.642 2.077 -1.017 3.5 -1c1.423 -.017 2.67 .358 3.5 1\" /> <path d=\"M8 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2\" /> <path d=\"M12 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2\" /> <path d=\"M3 10h14v5a6 6 0 0 1 -6 6h-2a6 6 0 0 1 -6 -6v-5z\" /> <path d=\"M16.746 16.726a3 3 0 1 0 .252 -5.555\" />"),
    beef: svg("<circle cx=\"12.5\" cy=\"8.5\" r=\"2.5\" /> <path d=\"M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z\" /> <path d=\"m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.49 6.49 0 0 1-2.6 5.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5\" />"),
    drop: svg("<path d=\"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z\" />")
  };
  const CG = {
    ingot: '<g transform="translate(2.471 2.074) scale(0.7941)" stroke-width="2.141"><path d="M3.5 18l2.2-7.5h12.6L20.5 18z"/><path d="M8.5 10.5L9.7 7h4.6l1.2 3.5"/><path d="M9 14.5h6"/></g>',
    cyl: '<g transform="translate(2.471 2.471) scale(0.7941)" stroke-width="2.141"><ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v11c0 1.7 3.1 3 7 3s7-1.3 7-3v-11"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g>',
    barrel: '<g transform="translate(1.875 1.875) scale(0.8438)" stroke-width="2.015"><path d="M7 4h10a2 2 0 0 1 1.8 1.2c.8 2.1 1.2 4.2 1.2 6.8s-.4 4.7-1.2 6.8A2 2 0 0 1 17 20H7a2 2 0 0 1-1.8-1.2C4.4 16.7 4 14.6 4 12s.4-4.7 1.2-6.8A2 2 0 0 1 7 4z"/><path d="M4.4 9h15.2M4.4 15h15.2"/></g>',
    flame: '<g transform="translate(2.743 2.550) scale(0.7714)" stroke-width="2.204"><path d="M12 21a6 6 0 0 0 6-6c0-1.6-1-4-2-5-1.8 3-2.8 3-3.5 2.5C12 11.5 12.5 7 11 3.5 11 6.5 9.2 8.200 8 9.500 6.800 10.800 6 12.800 6 15a6 6 0 0 0 6 6z"/></g>',
    pump: '<g transform="translate(1.977 2.182) scale(0.8182)" stroke-width="2.078"><path d="M5 20V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14"/><path d="M4 20h11M5 10h9M14 9h1.500a2 2 0 0 1 2 2v4a1.500 1.500 0 0 0 3 0V9l-3-3"/></g>',
    wheat: '<g transform="translate(3.000 3.000) scale(0.7500)" stroke-width="2.267"><path d="M12 21V8"/><path d="M12 8c-2.500-.5-3.500-2.500-3.500-5 2.500.5 3.500 2.500 3.500 5zM12 8c2.500-.5 3.500-2.500 3.500-5-2.500.5-3.500 2.500-3.500 5z"/><path d="M12 14c-2.500-.5-3.500-2.500-3.500-5M12 14c2.500-.5 3.500-2.500 3.500-5M12 19c-2.500-.5-3.500-2.500-3.500-5M12 19c2.500-.5 3.500-2.500 3.500-5"/></g>',
    corn: '<g transform="translate(3.000 3.000) scale(0.7500)" stroke-width="2.267"><path d="M12 3c3.200 2 4.500 5.500 4.500 9.500S15.200 19 12 21c-3.200-2-4.500-4.500-4.500-8.500S8.800 5 12 3z"/><path d="M7.700 10h8.600M7.500 14h9M12 3v18"/><path d="M7 21c0-3 1.500-5 5-6M17 21c0-3-1.500-5-5-6"/></g>',
    soy: '<g transform="translate(2.528 1.979) scale(0.8584)" stroke-width="1.981"><path d="M8 4.500c3-1.800 8 0 9.500 4.500s-1.500 10-6 10.500S3 15.500 4.500 10C5 7.500 6.200 5.600 8 4.500z"/><path d="M8.500 11.500c1.200 1.300 3.500 1.300 4.700 0"/></g>',
    coffee: '<g transform="translate(4.153 4.153) scale(0.6540)" stroke-width="2.600"><ellipse cx="12" cy="12" rx="6" ry="8.500" transform="rotate(28 12 12)"/><path d="M9.800 5.800c3.200 3-3 8 2.400 12.400" transform="rotate(0 12 12)"/></g>',
    sugar: '<g transform="translate(3.000 3.000) scale(0.7500)" stroke-width="2.267"><path d="M12 3l8 4.500v9L12 21l-8-4.500v-9z"/><path d="M4 7.500l8 4.500 8-4.500M12 12v9"/></g>',
    cocoa: '<g transform="translate(3.000 3.000) scale(0.7500)" stroke-width="2.267"><path d="M12 3c4 1 7 5 7 9s-3 8-7 9c-4-1-7-5-7-9s3-8 7-9z"/><path d="M12 3v18M8 6c-1.200 4-1.200 8 0 12M16 6c1.200 4 1.200 8 0 12"/></g>',
    cotton: '<g transform="translate(2.636 2.363) scale(0.7803)" stroke-width="2.179"><circle cx="8.500" cy="11" r="3.500"/><circle cx="15.500" cy="11" r="3.500"/><circle cx="12" cy="7.200" r="3.500"/><path d="M9 14.500L12 21l3-6.500"/></g>',
    oj: '<g transform="translate(2.743 2.936) scale(0.7714)" stroke-width="2.204"><circle cx="12" cy="13.500" r="7"/><path d="M12 6.500c0-2 1.200-3.200 3.500-3.500 0 2.200-1.200 3.500-3.500 3.500z"/><path d="M12 9v9M8.200 13.500h7.600"/></g>',
    cow: '<g transform="translate(3.000 3.000) scale(0.7500)" stroke-width="2.267"><path d="M5 8L3 4.500M19 8l2-3.500"/><path d="M6 8h12v6c0 3-2.200 5.500-6 5.500S6 17 6 14z"/><path d="M9.500 12.500h.01M14.500 12.500h.01M10 16.500h4"/></g>',
    pig: '<g transform="translate(2.743 2.936) scale(0.7714)" stroke-width="2.204"><path d="M7.500 6L6 3M16.500 6L18 3"/><circle cx="12" cy="12.500" r="8"/><ellipse cx="12" cy="14.500" rx="3.200" ry="2.200"/><path d="M10.800 14.500h.01M13.200 14.500h.01M9 10.500h.01M15 10.500h.01"/></g>',
    rice: '<g transform="translate(2.471 1.876) scale(0.7941)" stroke-width="2.141"><path d="M3.500 12h17a8.500 8.500 0 0 1-17 0z"/><path d="M8.500 8.500l1-2.500M12 8V5M15.500 8.500l-1-2.500"/></g>'
  };
  // Commodity icons: colour tile, white glyph (dark glyph on pale tiles)
  const CB = { 'GC=F': ['ingot', '#F5B301'], 'SI=F': ['ingot', '#C9CED6', 1], 'PL=F': ['ingot', '#9FB0C6'], 'PA=F': ['ingot', '#8FA6C2'], 'HG=F': ['cyl', '#E0803F'], 'ALI=F': ['cyl', '#B8C2CF'], 'CL=F': ['barrel', '#FF9F0A'], 'BZ=F': ['barrel', '#FF7A1A'], 'NG=F': ['flame', '#3AA0FF'], 'HO=F': ['pump', '#FF6B2C'], 'RB=F': ['pump', '#FF453A'], 'ZW=F': ['wheat', '#E8B73F'], 'ZC=F': ['corn', '#FFD60A'], 'ZS=F': ['soy', '#8DC24B'], 'ZO=F': ['wheat', '#D4A96A'], 'ZR=F': ['rice', '#E6DFC9', 1], 'KC=F': ['coffee', '#B9774A'], 'CC=F': ['cocoa', '#9C6B45'], 'SB=F': ['sugar', '#F2F2F7', 1], 'CT=F': ['cotton', '#7FB8FF'], 'OJ=F': ['oj', '#FF9F0A'], 'LE=F': ['cow', '#C2A07A'], 'HE=F': ['pig', '#FF8FA3'], 'GF=F': ['cow', '#B08968'] };
  const cIcon = sym => { const d = CB[sym]; if (!d) return ''; return `<span class="ai-t ai-c" style="background:linear-gradient(145deg,color-mix(in srgb,${d[1]} 100%,#fff 18%),color-mix(in srgb,${d[1]} 78%,#000));color:${d[2] ? '#1c1c1e' : '#fff'};border-radius:28%!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35)"><svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CG[d[0]]}</svg></span>`; };
  const COMM = { 'GC=F': 'coin', 'SI=F': 'coin', 'PL=F': 'coin', 'PA=F': 'coin', 'HG=F': 'box', 'ALI=F': 'box', 'CL=F': 'barrel', 'BZ=F': 'barrel', 'NG=F': 'flame', 'HO=F': 'fuel', 'RB=F': 'fuel',
    'ZW=F': 'wheat', 'ZC=F': 'wheat', 'ZS=F': 'wheat', 'ZO=F': 'wheat', 'ZR=F': 'wheat', 'KC=F': 'cup', 'CC=F': 'cup', 'SB=F': 'box', 'CT=F': 'wheat', 'OJ=F': 'drop', 'LE=F': 'beef', 'HE=F': 'beef', 'GF=F': 'beef' };
  const tile = (inner, style = '') => `<span class="ai-t" style="${style}">${inner}</span>`;
  const initial = n => tile(`<b>${esc((n || '?').trim()[0].toUpperCase())}</b>`);
  // sym: site symbol, name, type, cc (country code) -> HTML (26px tile; size set by CSS .ai-t / .ai-i)
  function icon(a) {
    const sym = a.s || a.ticker || '', n = a.n || a.name || '', c = COMM[sym];
    if (a.t === 'fx') {
      const cc={USD:'us',EUR:'eu',GBP:'gb',JPY:'jp',CNY:'cn',CHF:'ch',CAD:'ca',AUD:'au',NZD:'nz',INR:'in',BRL:'br',ZAR:'za',KRW:'kr',MXN:'mx'};
      const pair=sym.replace('=X','').match(/[A-Z]{3}/g) || [], codes=pair.map(c=>cc[c]).filter(Boolean);
      if(codes.length===2)return `<span class="ai-pair">${codes.map(c=>`<img src="${BASE}globe/flags/${c}.svg" alt="">`).join('')}</span>`;
    }
    if (CB[sym]) return cIcon(sym);
    if (c) return tile(G[c], 'color:#c8c8cf');
    const base = sym.replace(/-USD$/, '');
    const srcs = [];
    if (LOGOS[base]) srcs.push(BASE + 'globe/' + LOGOS[base]);
    if (window.InvConsent?.allows('images') && (a.t === 'crypto' || /-USD$/.test(sym))) srcs.push(`https://cdn.brandfetch.io/crypto/${encodeURIComponent(base)}/w/96/h/96/fallback/404?c=${BFID}`);
    else if (window.InvConsent?.allows('images') && !/[\^=]/.test(sym) && a.t !== 'fx') srcs.push(`https://cdn.brandfetch.io/ticker/${encodeURIComponent(sym)}/w/96/h/96/fallback/404?c=${BFID}`);
    const flag = a.cc && !(a.t === 'stocks' && a.g !== 'Index' && a.g !== 'Country ETF') ? `${BASE}globe/flags/${String(a.cc).toLowerCase()}.svg` : '';

    if (flag) srcs.push(flag);
    if (!srcs.length) return initial(n);
    return `<img class="ai-i" src="${esc(srcs[0])}" alt="" data-q="${esc(JSON.stringify(srcs.slice(1)))}" data-f="${esc(initial(n))}" onerror="window.AssetIcons.next(this)">`;
  }
  function next(img) { let q = []; try { q = JSON.parse(img.dataset.q || '[]'); } catch {} if (!window.InvConsent?.allows('images')) q = q.filter(src => !src.startsWith('https://cdn.brandfetch.io/')); if (q.length) { img.dataset.q = JSON.stringify(q.slice(1)); img.src = q[0]; } else img.outerHTML = img.dataset.f; }
  window.AssetIcons = { icon, next, ready };
})();
