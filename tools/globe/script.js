<script>
const DOTS = __DOTS__;
const MK = /*MK*/__MARKETS__/*MK*/, ASOF = /*ASOF*/'2026-10-16T21:00:00Z'/*ASOF*/;
const SEC = [['all', 'All assets'], ['stocks', 'Stocks'], ['fx', 'Currencies'], ['cmd', 'Commodities'], ['crypto', 'Stablecoins']];
const SECN = Object.fromEntries(SEC);
const CONT_ALL = ['North America', 'Central America & Caribbean', 'South America', 'Europe', 'Middle East', 'Africa', 'Asia', 'Oceania'];
// only regions that have assets in the current section
const conts = () => CONT_ALL.filter(c => MK.some(m => m.r === c && inSec(m)));
const VIEW = { 'North America': [-95, 35], 'Central America & Caribbean': [-78, 15], 'South America': [-62, -18], Europe: [12, 48], 'Middle East': [45, 25], Africa: [20, 2], Asia: [105, 25], Oceania: [150, -30] };
const $ = id => document.getElementById(id);
const rad = Math.PI / 180;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmtP = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = d => (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(2) + '%';
const dir = m => m.t === 'bonds' ? (m.d < 0 ? 'u' : 'd') : m.d >= 0 ? 'u' : 'd';
const chg = m => { if (m.t === 'bonds') { const bp = (m.p - m.p / (1 + m.d / 100)) * 100; return (bp >= 0 ? '+' : '−') + Math.abs(bp).toFixed(0) + ' bp'; } return pct(m.d); };
const val = m => m.t === 'bonds' ? m.p.toFixed(2) + '%' : m.t === 'fx' ? m.p.toLocaleString('en-US', { minimumFractionDigits: m.p < 20 ? 4 : 2, maximumFractionDigits: m.p < 20 ? 4 : 2 }) : m.t === 'crypto' ? '$' + m.p.toLocaleString('en-US', { maximumFractionDigits: m.p < 1 ? 6 : 2, minimumFractionDigits: 2 }) : fmtP(m.p) + (m.u ? ' ' + m.u : '');
const RGB = { u: '34,197,94', d: '240,68,68' };
const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6l4 4 4-4"/></svg>';

// ---------- settings ----------
const QP = new URLSearchParams(location.search);
if (window.parent !== window) document.documentElement.classList.add('embedded');
let store = {}; try { store = JSON.parse(localStorage.getItem('globe-tweak6') || '{}'); } catch (e) {}
const hashLook = location.hash.slice(1), qLook = new URLSearchParams(location.search).get('look');
const T = Object.assign({ look: 'spikes', speed: 3, labels: 'main', dots: 'grey', menu: 'mega' }, store, ['list', 'search', 'mega'].includes(hashLook) ? { menu: hashLook } : {}, qLook ? { look: qLook } : {});
const save = () => { try { localStorage.setItem('globe-tweak6', JSON.stringify(T)); } catch (e) {} };
const TW = [['look', 'Style', [['spikes', 'Spikes'], ['glow', 'Glow'], ['dots', 'Dots']]], ['menu', 'Menus', [['list', 'List'], ['search', 'Search'], ['mega', 'One menu']]], ['labels', 'Labels', [['main', 'Main'], ['all', 'All'], ['none', 'Off']]], ['dots', 'Land', [['grey', 'Grey'], ['white', 'White'], ['orange', 'Orange']]], ['speed', 'Rotation', [[0, 'Off'], [3, 'Slow'], [8, 'Fast']]]];
$('tgrid').innerHTML = TW.map(([k, n, os]) => `<span>${n}</span><div class="seg" data-k="${k}">${os.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(T[k]) === String(v)}">${l}</button>`).join('')}</div>`).join('');
$('tgrid').onclick = e => { const b = e.target.closest('button'); if (!b) return; const g = b.parentNode, k = g.dataset.k; T[k] = k === 'speed' ? +b.dataset.v : b.dataset.v; save(); g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); if (k === 'menu') buildPickers(); };

// ---------- filters ----------
let sec = 'all', cont = 'all', country = 'all';
const inSec = m => sec === 'all' || m.t === sec;
const inCont = m => cont === 'all' || m.r === cont;

// ---------- one marker per country ----------
const LOGOS = __LOGOS__;
// Logos only in lists and windows, never on the globe: flags for countries, indices and currencies, brand logos where we have them, otherwise a monogram tile with a small flag
const LSRC = k => LOGOS ? LOGOS[k] : '/assets/logos/' + k;
const BRAND = __BRAND__, CCYISO = {};
MK.forEach(m => { if (m.t === 'fx' && m.g === 'vs US dollar') CCYISO[m.s.startsWith('USD') ? m.s.slice(3) : m.s.slice(0, 3)] = m.cc; }); CCYISO.USD = 'us'; CCYISO.EUR = 'european_union';
const CMDI = { bar: '<path d="M3.5 17.5h17l-2.6-6.5H6.1z"/><path d="M7.6 11l1.3-4h6.2l1.3 4"/>', drop: '<path d="M12 3.5c3 4.3 5.8 7.4 5.8 10.7a5.8 5.8 0 0 1-11.6 0c0-3.3 2.8-6.4 5.8-10.7z"/>', flame: '<path d="M12 3c.8 3.4 5 5.3 5 10.2a5 5 0 0 1-10 0c0-2.5 1.2-4 2.6-5.2.2 1.7.9 2.7 2 3.1-.1-3 .1-5.6.4-8.1z"/>', grain: '<path d="M12 21V8"/><path d="M12 10.5c-2-.8-3.2-2.6-3.2-4.8 2.1.2 3.2 1.8 3.2 3.9 0-2.1 1.1-3.7 3.2-3.9 0 2.2-1.2 4-3.2 4.8z"/><path d="M12 15.5c-2-.8-3.2-2.4-3.2-4.4 2.1.2 3.2 1.6 3.2 3.6 0-2 1.1-3.4 3.2-3.6 0 2-1.2 3.6-3.2 4.4z"/>', bean: '<ellipse cx="12" cy="12" rx="6" ry="8.5"/><path d="M12 3.5c-2.2 3 2.2 5.5 0 8.5s2.2 5.5 0 8.5"/>', leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>', fruit: '<circle cx="12" cy="13" r="7"/><path d="M12 6c0-1.5 1-2.5 2.5-2.5"/>', herd: '<path d="M5 9l2-3h10l2 3"/><rect x="6" y="9" width="12" height="9" rx="3"/><path d="M10 13h.01M14 13h.01"/>' };
const CMDOF = { 'GC=F': 'bar', 'SI=F': 'bar', 'PL=F': 'bar', 'PA=F': 'bar', 'HG=F': 'bar', 'ALI=F': 'bar', 'CL=F': 'drop', 'BZ=F': 'drop', 'HO=F': 'drop', 'RB=F': 'drop', 'NG=F': 'flame', 'ZW=F': 'grain', 'ZC=F': 'grain', 'ZS=F': 'grain', 'ZO=F': 'grain', 'ZR=F': 'grain', 'KC=F': 'bean', 'CC=F': 'bean', 'SB=F': 'leaf', 'CT=F': 'leaf', 'OJ=F': 'fruit', 'LE=F': 'herd', 'HE=F': 'herd', 'GF=F': 'herd' };
const flagImg = cc => `<img src="${LSRC('flags/' + cc + '.svg')}" alt="" decoding="async">`;
const mono = m => { const w = m.n.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || m.s).slice(0, 2)).toUpperCase(); };
function ico(m) {
  if (m.t === 'fx' && m.g === 'Cross pair') return `<span class="ic ic-fx">${flagImg(CCYISO[m.s.slice(0, 3)])}${flagImg(CCYISO[m.s.slice(3)])}</span>`;
  if (m.t === 'fx' || m.g === 'Index' || m.g === 'Country ETF') return `<span class="ic ic-flag">${flagImg(m.cc)}</span>`;
  if (m.t === 'cmd') return `<span class="ic ic-cmd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CMDI[CMDOF[m.s]] || CMDI.bar}</svg></span>`;
  const b = BRAND[m.site] || BRAND[m.s];
  if (b) return `<span class="ic ic-brand"><img src="${LSRC(b)}" alt="" decoding="async"></span>`;
  return `<span class="ic ic-mono">${m.t === 'crypto' ? m.s.slice(0, 3) : mono(m)}<i>${flagImg(m.cc)}</i></span>`;
}
const ORDER = { stocks: 0, bonds: 1, fx: 2, cmd: 3, crypto: 4 };
const headOf = items => [...items].sort((a, b) => ((b.g === 'Index') - (a.g === 'Index')) || b.m - a.m || ORDER[a.t] - ORDER[b.t])[0];
let groups = [];
const labels = $('labels');
function regroup() {
  labels.innerHTML = '';
  const geo = MK.filter(m => m.la != null && inSec(m) && inCont(m));
  if (sec === 'cmd') groups = geo.map(m => ({ k: m.k, key: m.s, items: [m], head: m, la: m.la, lo: m.lo, r: m.r, main: !!m.m, name: m.n, single: true }));
  else { const by = {}; geo.forEach(m => (by[m.k] = by[m.k] || []).push(m));
    groups = Object.entries(by).map(([k, items]) => { const head = headOf(items), anchor = items.find(m => m.g === 'Index') || head; return { k, key: k, items, head, la: anchor.la, lo: anchor.lo, r: head.r, main: items.some(m => m.m), name: k }; }); }
  groups.forEach(g => { const el = document.createElement('div'); el.className = 'lb'; el.innerHTML = `<b>${esc(g.name)}</b><span class="${dir(g.head)}">${chg(g.head)}</span>`; labels.append(el); g.el = el; });
  const xs = MK.filter(m => inSec(m) && (sec === 'crypto' || inCont(m))), up = xs.filter(m => dir(m) === 'u').length, best = xs.filter(m => m.t !== 'bonds').sort((a, b) => b.d - a.d)[0];
  $('nUp').textContent = up; $('nDn').textContent = xs.length - up; $('best').textContent = best ? best.n + ' ' + chg(best) : '–';
  $('hint').hidden = QP.get('hint') === '0'; $('hint').textContent = sec === 'crypto' ? 'Each stablecoin sits in the country of the currency it tracks.' : (matchMedia('(pointer: coarse)').matches ? 'Tap a country. Pinch to zoom.' : 'Click a country to open it. Scroll to zoom.');
}
$('asof').textContent = `World markets · ${MK.length} assets · ${new Set(MK.filter(m => m.k !== 'Global').map(m => m.k)).size} countries`;

// ---------- globe ----------
const cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');
let W = 0, H = 0, R = 0, R0 = 0, cx = 0, cy = 0, fly = null, ping = null, Z = 1;
// Zoom (globe page only; the homepage hero keeps scrolling the page): wheel, pinch, double-tap, +/- buttons
const HERO = QP.get('mode') === 'hero', ZMAX = 3, setZ = z => { Z = Math.max(1, Math.min(ZMAX, z)); if (!fly) R = R0 * Z; };
// Homepage embeds can size and place the globe: ?rs= radius as a share of width, ?cyf= / ?cxf= centre as a share of height / width
const qn = k => QP.has(k) ? +QP.get(k) : null;
function size() { const dpr = Math.min(2, devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); R = qn('rs') ? W * qn('rs') : Math.min(W, H) * .4; R0 = R; R = R0 * Z; cx = qn('cxf') != null ? W * qn('cxf') : W / 2; cy = qn('cyf') != null ? H * qn('cyf') : H / 2 + 10; }
new ResizeObserver(size).observe(stage); size();
const pts = []; for (let i = 0; i < DOTS.length; i += 2) pts.push([DOTS[i] / 10 * rad, DOTS[i + 1] / 10 * rad]);
let lon0 = -15, lat0 = 22, target = null, hover = null, dragging = null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function proj(phi, lam, h = 1) { const c0 = Math.cos(lat0 * rad), s0 = Math.sin(lat0 * rad), d = lam - lon0 * rad, cp = Math.cos(phi); return [cx + R * h * cp * Math.sin(d), cy - R * h * (c0 * Math.sin(phi) - s0 * cp * Math.cos(d)), s0 * Math.sin(phi) + c0 * cp * Math.cos(d)]; }
const touches = new Map(); let pinch = null;
const pdist = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
if (!HERO) {
  cv.addEventListener('wheel', e => { e.preventDefault(); target = null; setZ(Z * Math.exp(-e.deltaY * .0015)); }, { passive: false });
  cv.addEventListener('dblclick', () => { target = null; setZ(Z < ZMAX ? Z * 1.8 : 1); });
  cv.addEventListener('pointerdown', e => { touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (touches.size === 2) { pinch = { d: pdist(), z: Z }; dragging = null; } });
  cv.addEventListener('pointermove', e => { if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pinch && touches.size === 2) setZ(pinch.z * pdist() / pinch.d); });
  const endT = e => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
  cv.addEventListener('pointerup', endT); cv.addEventListener('pointercancel', endT);
  const zb = document.createElement('div'); zb.className = 'zoom'; zb.innerHTML = '<button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button>';
  zb.children[0].onclick = () => { target = null; setZ(Z * 1.6); }; zb.children[1].onclick = () => { target = null; setZ(Z / 1.6); }; stage.appendChild(zb);
}
cv.addEventListener('pointerdown', e => { if (pinch) return; dragging = { x: e.clientX, y: e.clientY, lon: lon0, lat: lat0, moved: false }; cv.setPointerCapture(e.pointerId); target = null; });
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect();
  if (pinch) return; if (dragging) { const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y; if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true; lon0 = dragging.lon - dx * .35 / Z; lat0 = Math.max(-75, Math.min(75, dragging.lat + dy * .3 / Z)); return; }
  hover = nearest(e.clientX - r.left, e.clientY - r.top); cv.style.cursor = hover ? 'pointer' : 'grab'; });
cv.addEventListener('pointerup', e => { const r = cv.getBoundingClientRect(); if (dragging && !dragging.moved && !pinch) { const g = nearest(e.clientX - r.left, e.clientY - r.top); if (g) openWin(g.single ? { asset: g.head } : { group: g }, e.clientX, e.clientY); } dragging = null; });
function nearest(x, y) { let best = null, bd = 20 * 20; for (const g of groups) { if (!(g.z > 0)) continue; const d = (g.tx - x) ** 2 + (g.ty - y) ** 2; if (d < bd) { bd = d; best = g; } } return best; }
const openKeys = () => new Set([...wins].map(w => w.key));
function frame(t) {
  // Fly-to: ease across the shortest way round, pulling back a little mid-flight, then ping the place
  if (!target) fly = null;
  if (target) { if (!fly || fly.to !== target) fly = { to: target, from: [lon0, lat0], dl: ((target[0] - lon0 + 540) % 360) - 180, t0: t, z0: Z, z1: HERO ? Z : Math.max(Z, 2.2), dur: reduce ? 1 : 700 + Math.min(700, Math.abs(((target[0] - lon0 + 540) % 360) - 180) * 4) };
    const k = Math.min(1, (t - fly.t0) / fly.dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    lon0 = fly.from[0] + fly.dl * e; lat0 = fly.from[1] + (target[1] - fly.from[1]) * e; Z = fly.z0 + (fly.z1 - fly.z0) * e; R = R0 * Z * (1 - .08 * Math.sin(Math.PI * k) * Math.min(1, Math.abs(fly.dl) / 60));
    if (k >= 1) { target = null; fly = null; R = R0 * Z; if (ping) ping.t0 = t; } }
  else if (!dragging && !reduce && !wins.size && Z === 1) lon0 -= T.speed * .03;
  lon0 = ((lon0 + 540) % 360) - 180;
  ctx.clearRect(0, 0, W, H);
  if (QP.get('halo') !== '0') { const halo = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.35); halo.addColorStop(0, 'rgba(255,122,26,.08)'); halo.addColorStop(1, 'rgba(255,122,26,0)'); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill(); }
  // ?rim=1: a thin orange atmosphere around the edge of the globe (homepage)
  const rim = +QP.get('rim') || 0;
  if (rim) { const rg = ctx.createRadialGradient(cx, cy, R * .98, cx, cy, R * (1 + .1 * rim)); rg.addColorStop(0, `rgba(255,122,26,${.5 * rim})`); rg.addColorStop(.3, `rgba(255,122,26,${.16 * rim})`); rg.addColorStop(1, 'rgba(255,122,26,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + .1 * rim), 0, 7); ctx.fill(); }
  const sg = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R); sg.addColorStop(0, '#1b1b1f'); sg.addColorStop(1, '#0c0c0e'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.strokeStyle = rim ? `rgba(255,150,80,${.55 * Math.min(1, rim)})` : '#26262a'; ctx.lineWidth = 1; ctx.stroke();
  const dc = T.dots === 'orange' ? '255,122,26' : T.dots === 'white' ? '255,255,255' : '161,161,170', ds = Math.max(1.1, Math.min(R0 / 210 * 1.6, R / 210));
  for (const [phi, lam] of pts) { const [x, y, z] = proj(phi, lam); if (z <= 0) continue; ctx.fillStyle = `rgba(${dc},${(.1 + z * .5).toFixed(3)})`; ctx.fillRect(x - ds / 2, y - ds / 2, ds, ds); }
  const open = openKeys(), pulse = reduce ? 0 : (t / 1600) % 1;
  if (T.look === 'glow') { ctx.globalCompositeOperation = 'lighter';
    for (const g of groups) { const [x, y, z] = proj(g.la * rad, g.lo * rad); if (z <= 0) continue; const rr = R * (.05 + Math.min(.09, Math.abs(g.head.d) * .03)) * (g.main ? 1.2 : .8), c = RGB[dir(g.head)];
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${c},${(.5 * z).toFixed(3)})`); gr.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; }
  const vis = groups.map(g => { const [x, y, z] = proj(g.la * rad, g.lo * rad); g.x = x; g.y = y; g.z = z; return g; }).filter(g => g.z > 0).sort((a, b) => a.z - b.z);
  for (const g of vis) {
    const col = RGB[dir(g.head)], on = open.has(g.key) || g === hover, z = g.z;
    if (T.look === 'spikes') {
      const [tx, ty] = proj(g.la * rad, g.lo * rad, 1 + (.04 + Math.min(.22, Math.abs(g.head.d) * .06)) * (g.main ? 1 : .6)); g.tx = tx; g.ty = ty;
      const lg = ctx.createLinearGradient(g.x, g.y, tx, ty); lg.addColorStop(0, `rgba(${col},0)`); lg.addColorStop(1, `rgba(${col},${(.35 + .6 * z).toFixed(3)})`);
      ctx.strokeStyle = lg; ctx.lineWidth = g.main ? 2 : 1.3; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${(.5 + .5 * z).toFixed(3)})`; ctx.beginPath(); ctx.arc(tx, ty, g.main ? 2.6 : 1.8, 0, 7); ctx.fill();
    } else if (T.look === 'glow') { g.tx = g.x; g.ty = g.y; ctx.fillStyle = `rgba(255,255,255,${(.6 + .4 * z).toFixed(3)})`; ctx.beginPath(); ctx.arc(g.x, g.y, g.main ? 2.2 : 1.5, 0, 7); ctx.fill(); }
    else { g.tx = g.x; g.ty = g.y; const r = 4 * (g.main ? 1 : .65) * (.7 + Math.min(1, Math.abs(g.head.d) / 2)) * (.6 + z * .4);
      if (g.main) { ctx.strokeStyle = `rgba(${col},${(.45 * (1 - pulse) * z).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(g.x, g.y, r + 2 + pulse * 9, 0, 7); ctx.stroke(); }
      ctx.fillStyle = `rgba(${col},${(.55 + z * .45).toFixed(3)})`; ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, 7); ctx.fill(); }
    if (on) { ctx.strokeStyle = '#FF7A1A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(g.tx, g.ty, 6.5, 0, 7); ctx.stroke(); }
  }
  if (ping && ping.t0 != null) { const k = (t - ping.t0) / 1400; if (k >= 1) ping = null; else { const [x, y, z] = proj(ping.la * rad, ping.lo * rad); if (z > 0) for (const d of [0, .3]) { const q = Math.max(0, Math.min(1, (k - d) / .7)); if (q > 0 && q < 1) { ctx.strokeStyle = `rgba(255,122,26,${(1 - q) * .9})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 6 + q * 30, 0, 7); ctx.stroke(); } } } }
  const placed = [], want = g => T.labels !== 'none' && (T.labels === 'all' || g.main || cont !== 'all') || open.has(g.key) || g === hover;
  groups.forEach(g => g.el.style.opacity = 0);
  [...vis].sort((a, b) => ((open.has(b.key) || b === hover) - (open.has(a.key) || a === hover)) || b.z - a.z).forEach(g => {
    if (!want(g) || g.z < .15) return; g.lw = g.lw || g.el.offsetWidth || 90; const flip = g.tx + 10 + g.lw > W - 6, bx = flip ? [g.tx - 10 - g.lw, g.ty - 11, g.tx - 10, g.ty + 11] : [g.tx + 10, g.ty - 11, g.tx + 10 + g.lw, g.ty + 11];
    if (placed.some(p => bx[0] < p[2] && bx[2] > p[0] && bx[1] < p[3] && bx[3] > p[1])) return; placed.push(bx);
    g.el.style.left = (flip ? g.tx - 20 - g.lw : g.tx) + 'px'; g.el.style.top = g.ty + 'px'; g.el.style.opacity = Math.min(1, (g.z - .15) * 3); g.el.classList.toggle('sel', open.has(g.key));
  });
  requestAnimationFrame(frame);
}

// ---------- floating windows: open several, drag, resize, compare ----------
const wins = new Set(); let zTop = 30, cascade = 0;
function spark(m) { const sp = m.sp || []; if (sp.length < 2) return ''; const mn = Math.min(...sp), mx = Math.max(...sp), xs = i => i / (sp.length - 1) * 280, ys = v => 58 - (v - mn) / ((mx - mn) || 1) * 52;
  const line = sp.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' '), good = m.t === 'bonds' ? sp[sp.length - 1] <= sp[0] : sp[sp.length - 1] >= sp[0], col = good ? 'var(--up)' : 'var(--down)';
  return `<svg viewBox="0 0 280 64" preserveAspectRatio="none" aria-hidden="true"><path d="${line} L280 64 L0 64Z" fill="${col}" opacity=".12"/><path d="${line}" fill="none" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`; }
function renderWin(w) {
  queueMicrotask(() => paintStar(w));
  const head = w.el.querySelector('.wt'), body = w.el.querySelector('.wbody');
  if (w.asset) { const m = w.asset, nt = /ETF/.test(m.n) ? 'Shown through a country ETF in US dollars' : m.note || '';
    head.innerHTML = `${ico(m)}<span class="chip">${SECN[m.t]}${m.g ? ' · ' + esc(m.g) : ''}</span><b>${esc(m.n)}</b><small>${esc(m.k === 'Global' ? m.c : m.k + ' · ' + m.c)}</small>`;
    body.innerHTML = `${w.group ? `<button class="back" type="button" data-back>← ${esc(w.group.k)}</button>` : ''}${nt ? `<small style="display:block;margin:6px 4px 0;color:var(--fg-3)">${esc(nt)}</small>` : ''}<div class="px">${val(m)}</div>
      <div class="chg"><span style="color:var(--${dir(m) === 'u' ? 'up' : 'down'})">${chg(m)} today</span><span style="color:var(--fg-3)">${m.t === 'bonds' || !m.w ? '' : pct(m.w) + ' this week'}</span></div>${spark(m)}
      <a class="cta" href="${m.site ? 'https://investedia.com/asset.html?s=' + encodeURIComponent(m.site) : 'https://investedia.com/markets.html'}" target="_blank" rel="noopener">Jump to chart →</a>`;
  } else { const g = w.group;
    head.innerHTML = `<span class="ic ic-flag">${flagImg(g.items[0].cc)}</span><span class="chip">${esc(g.r)}</span><b>${esc(g.k)}</b><small>${g.items.length} ${g.items.length === 1 ? 'asset' : 'assets'}${sec === 'all' ? '' : ' · ' + SECN[sec]}</small>`;
    body.innerHTML = '<div class="clist">' + ['stocks', 'fx', 'cmd', 'crypto'].map(t => { const rank = m => m.g === 'Index' ? 2 : m.g === 'Country ETF' ? 1 : 0; const xs = g.items.filter(m => m.t === t).sort((a, b) => (rank(b) - rank(a)) || b.m - a.m || Math.abs(b.d) - Math.abs(a.d)); if (!xs.length) return '';
      return `<h3>${SECN[t]}</h3>` + xs.map(m => `<button class="crow" type="button" data-s="${esc(m.s)}">${ico(m)}<b>${esc(m.n)}</b><span class="v">${val(m)}</span><span class="pill ${dir(m)}">${chg(m)}</span></button>`).join(''); }).join('') + '</div>'; }
}
// Watchlist: the site page that embeds the globe shares its watchlist (window.INVWATCH); on its own the globe has no stars
const WATCH = (() => { try { return window.parent !== window && window.parent.INVWATCH || null; } catch (e) { return null; } })();
const STAR = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
const logoKey = m => (m.t === 'stocks' && m.g !== 'Index' && m.g !== 'Country ETF' && (BRAND[m.site] || BRAND[m.s])) || 'flags/' + (m.t === 'fx' && m.g === 'Cross pair' ? CCYISO[m.s.slice(0, 3)] : m.cc) + '.svg';
const watchItem = w => w.asset ? { kind: 'asset', src: 'globe', s: w.asset.s, n: w.asset.n, k: w.asset.k, cc: w.asset.cc, t: w.asset.t, lg: logoKey(w.asset), site: w.asset.site || null } : w.group ? { kind: 'country', k: w.group.k, cc: w.group.items[0].cc, r: w.group.r } : null;
function paintStar(w) { const b = w.el.querySelector('.wstar'), it = watchItem(w); if (!WATCH || !it) { b.hidden = true; return; }
  const on = WATCH.has(it); b.hidden = false; b.innerHTML = STAR; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  b.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + (it.kind === 'country' ? it.k : it.n) + (on ? ' from' : ' to') + ' your watchlist'); b.title = on ? 'On your watchlist' : 'Add to watchlist'; }
if (WATCH) WATCH.on(() => wins.forEach(paintStar));
function openWin(spec, px, py) {
  const key = spec.asset ? spec.asset.s : spec.group.key;
  for (const w of wins) if (w.key === key) { front(w); return; }
  if (wins.size >= 8) { const first = wins.values().next().value; closeWin(first); }
  const el = document.createElement('div'); el.className = 'win'; el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="whead"><div class="wt"></div><button class="wbtn wstar" type="button" hidden></button><button class="wbtn wclose" type="button" aria-label="Close">×</button></div><div class="wbody"></div><div class="wsize" aria-hidden="true"></div>`;
  const wW = Math.min(300, innerWidth - 24), wH = Math.min(spec.asset ? 330 : 380, innerHeight - 100);
  const sr = stage.getBoundingClientRect(); let x = (px ?? sr.left + 24) + 18 + cascade * 8, y = (py ?? sr.top + 70) - 40 + cascade * 8; cascade = (cascade + 1) % 6;
  x = Math.max(8, Math.min(innerWidth - wW - 8, x)); y = Math.max(8, Math.min(innerHeight - wH - 8, y));
  Object.assign(el.style, { left: x + 'px', top: y + 'px', width: wW + 'px', height: wH + 'px' });
  const w = { el, key, group: spec.group || null, asset: spec.asset || null, home: spec.asset ? null : spec.group };
  $('wins').append(el); wins.add(w); renderWin(w); front(w);
  if (spec.group || spec.asset.la != null) { const s = spec.group || spec.asset; if (s.la != null) { target = [s.lo, Math.max(-35, Math.min(45, s.la))]; ping = { la: s.la, lo: s.lo, t0: null }; } }
  el.addEventListener('pointerdown', () => front(w));
  el.querySelector('.wclose').onclick = () => closeWin(w);
  el.querySelector('.wstar').onclick = () => { const it = watchItem(w); if (it) WATCH.toggle(it); };
  el.querySelector('.wbody').addEventListener('click', e => { const r = e.target.closest('.crow'); if (r) { w.asset = MK.find(m => m.s === r.dataset.s); renderWin(w); } if (e.target.closest('[data-back]')) { w.asset = null; renderWin(w); } });
  drag(el.querySelector('.whead'), (dx, dy, o) => { el.style.left = Math.max(-el.offsetWidth + 60, Math.min(innerWidth - 60, o.l + dx)) + 'px'; el.style.top = Math.max(0, Math.min(innerHeight - 40, o.t + dy)) + 'px'; }, () => ({ l: el.offsetLeft, t: el.offsetTop }));
  drag(el.querySelector('.wsize'), (dx, dy, o) => { el.style.width = Math.max(240, Math.min(innerWidth - el.offsetLeft - 4, o.w + dx)) + 'px'; el.style.height = Math.max(180, Math.min(innerHeight - el.offsetTop - 4, o.h + dy)) + 'px'; }, () => ({ w: el.offsetWidth, h: el.offsetHeight }));
}
function front(w) { wins.forEach(x => x.el.classList.toggle('front', x === w)); w.el.style.zIndex = ++zTop; }
function closeWin(w) { w.el.remove(); wins.delete(w); }
function drag(handle, move, origin) { let s = null;
  handle.addEventListener('pointerdown', e => { if (e.target.closest('button,a')) return; s = { x: e.clientX, y: e.clientY, o: origin() }; handle.setPointerCapture(e.pointerId); e.preventDefault(); });
  handle.addEventListener('pointermove', e => { if (s) move(e.clientX - s.x, e.clientY - s.y, s.o); });
  const end = () => s = null; handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end); }
addEventListener('keydown', e => { if (e.key === 'Escape' && wins.size) { let top = null; wins.forEach(w => { if (!top || +w.el.style.zIndex > +top.el.style.zIndex) top = w; }); closeWin(top); } });

// ---------- custom dropdowns ----------
let openDD = null;
function closeDD() { if (openDD) { openDD.pop.remove(); openDD.btn.setAttribute('aria-expanded', 'false'); openDD = null; } }
document.addEventListener('pointerdown', e => { if (openDD && !openDD.root.contains(e.target)) closeDD(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDD(); });
// opts: [{v, l, n (count), g (group)}]
function dropdown(root, { label, value, opts, search, onPick, align }) {
  root.className = 'dd' + (align === 'right' ? ' right' : ''); const cur = opts.find(o => o.v === value) || opts[0];
  root.innerHTML = `<button class="dd-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${label}"><span>${esc(cur.l)}</span>${CHEV}</button>`;
  const btn = root.firstChild;
  btn.onclick = () => { if (openDD && openDD.root === root) return closeDD(); closeDD();
    const pop = document.createElement('div'); pop.className = 'dd-pop'; pop.setAttribute('role', 'listbox');
    pop.innerHTML = (search ? `<input class="dd-search" type="search" placeholder="Search ${label.toLowerCase()}…" aria-label="Search ${label}">` : '') + '<div class="dd-list"></div>';
    root.append(pop); btn.setAttribute('aria-expanded', 'true'); openDD = { root, pop, btn };
    const list = pop.querySelector('.dd-list'), inp = pop.querySelector('input'); let act = -1;
    const draw = q => { let g0 = null; const xs = opts.filter(o => !q || o.l.toLowerCase().includes(q.toLowerCase()));
      list.innerHTML = xs.map((o, i) => (o.g && o.g !== g0 ? `<div class="dd-g">${esc(g0 = o.g)}</div>` : '') + `<button type="button" class="dd-opt" role="option" data-i="${opts.indexOf(o)}" aria-selected="${o.v === value}"><span>${esc(o.l)}</span>${o.n != null ? `<small>${o.n}</small>` : ''}</button>`).join('') || '<div class="dd-g">No match</div>'; act = -1; };
    draw(''); if (inp) { inp.oninput = () => draw(inp.value); setTimeout(() => inp.focus(), 10); }
    list.onclick = e => { const b = e.target.closest('.dd-opt'); if (!b) return; const o = opts[+b.dataset.i]; closeDD(); onPick(o.v); };
    pop.onkeydown = e => { const bs = [...list.querySelectorAll('.dd-opt')]; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, Math.min(bs.length - 1, act + (e.key === 'ArrowDown' ? 1 : -1))); bs.forEach((b, i) => b.classList.toggle('act', i === act)); bs[act]?.scrollIntoView({ block: 'nearest' }); } if (e.key === 'Enter' && bs[act]) bs[act].click(); };
  };
}
// one combined menu: continents on the left, countries on the right
function megaMenu(root) {
  root.className = 'dd'; const lbl = country !== 'all' ? country : cont !== 'all' ? cont : 'Whole world';
  root.innerHTML = `<button class="dd-btn" type="button" aria-haspopup="true" aria-expanded="false"><span>${esc(lbl)}</span>${CHEV}</button>`;
  const btn = root.firstChild;
  btn.onclick = () => { if (openDD && openDD.root === root) return closeDD(); closeDD();
    const pop = document.createElement('div'); pop.className = 'dd-pop'; root.append(pop); btn.setAttribute('aria-expanded', 'true'); openDD = { root, pop, btn };
    let hc = cont === 'all' ? 'Europe' : cont;
    const draw = () => { const ks = countriesIn(hc);
      pop.innerHTML = `<div class="mega"><div class="dd-list">${[['all', 'Whole world'], ...conts().map(c => [c, c])].map(([v, l]) => `<button type="button" class="dd-opt${v === hc ? ' act' : ''}" data-c="${esc(v)}" aria-selected="${v === cont}"><span>${esc(l)}</span></button>`).join('')}</div>
        <div class="dd-list">${hc === 'all' ? '<div class="dd-g">Pick a continent</div>' : `<button type="button" class="dd-opt" data-k="all" aria-selected="${cont === hc && country === 'all'}"><span>All of ${esc(hc)}</span></button>` + ks.map(([k, n]) => `<button type="button" class="dd-opt" data-k="${esc(k)}" aria-selected="${k === country}"><span class="ic ic-flag sm">${flagImg(MK.find(m => m.k === k).cc)}</span><span>${esc(k)}</span><small>${n}</small></button>`).join('')}</div></div>`; };
    draw();
    pop.addEventListener('mouseover', e => { const b = e.target.closest('[data-c]'); if (b && b.dataset.c !== hc && b.dataset.c !== 'all') { hc = b.dataset.c; draw(); } });
    pop.onclick = e => { const c = e.target.closest('[data-c]'), k = e.target.closest('[data-k]');
      if (c) { if (c.dataset.c === 'all') { closeDD(); setCont('all'); } else { hc = c.dataset.c; draw(); } }
      if (k) { closeDD(); k.dataset.k === 'all' ? setCont(hc) : setCountry(k.dataset.k); } };
  };
}
const countriesIn = c => { const n = {}; MK.filter(m => m.k !== 'Global' && (c === 'all' || m.r === c) && inSec(m)).forEach(m => n[m.k] = (n[m.k] || 0) + 1); return Object.entries(n).sort((a, b) => a[0].localeCompare(b[0])); };
function buildPickers() {
  const p = $('pick'); closeDD();
  if (T.menu === 'mega') { p.className = 'pick one'; p.innerHTML = '<div class="fld"><span>Region</span><div id="ddM"></div></div>'; megaMenu($('ddM')); return; }
  p.className = 'pick'; p.innerHTML = '<div class="fld"><span>Continent</span><div id="ddC"></div></div><div class="fld"><span>Country</span><div id="ddK"></div></div>';
  const cs = countriesIn(cont).map(([k, n]) => ({ v: k, l: k, n, g: cont === 'all' ? (MK.find(m => m.k === k).r) : null })).sort((a, b) => CONT_ALL.indexOf(a.g) - CONT_ALL.indexOf(b.g) || a.l.localeCompare(b.l));
  dropdown($('ddC'), { label: 'Continent', value: cont, opts: [{ v: 'all', l: 'All continents' }, ...conts().map(c => ({ v: c, l: c, n: MK.filter(m => m.r === c && inSec(m)).length }))], onPick: setCont });
  dropdown($('ddK'), { label: 'Country', value: country, search: T.menu === 'search', align: 'right', opts: [{ v: 'all', l: cont === 'all' ? 'All countries' : 'All of ' + cont }, ...cs], onPick: setCountry });
}
function setCont(c) { cont = c; country = 'all'; if (VIEW[c]) target = VIEW[c]; regroup(); buildPickers(); drawList(); }
function setCountry(k) { if (k === 'all') { country = 'all'; buildPickers(); drawList(); return; }
  const r = MK.find(m => m.k === k).r; if (cont !== r) { cont = r; regroup(); } country = k; buildPickers(); drawList();
  const g = groups.find(x => x.k === k); if (g) { const sr = stage.getBoundingClientRect(); openWin(g.single ? { asset: g.head } : { group: g }, sr.left + 30, sr.top + 90); } }

// ---------- list ----------
function drawList() {
  const rows = MK.filter(inSec).filter(m => sec === 'crypto' ? true : cont === 'all' ? (country === 'all' ? m.m : m.k === country) : m.r === cont && (country === 'all' || m.k === country)).sort((a, b) => b.d - a.d);
  $('lTitle').textContent = sec === 'crypto' ? 'Crypto' : cont === 'all' && country === 'all' ? (sec === 'all' ? 'Main markets' : 'Main ' + SECN[sec].toLowerCase()) : country !== 'all' ? country : cont;
  $('lCount').textContent = rows.length + (rows.length === 1 ? ' asset' : ' assets');
  $('list').innerHTML = rows.map(m => `<button class="row" type="button" data-s="${esc(m.s)}">${ico(m)}<span class="n"><b>${esc(m.n)}</b><small>${m.k === 'Global' ? SECN[m.t] : SECN[m.t] + ' · ' + esc(m.k)}</small></span><span class="p">${val(m)}</span><span class="pill ${dir(m)}">${chg(m)}</span></button>`).join('');
}
$('list').addEventListener('click', e => { const b = e.target.closest('.row'); if (!b) return; const m = MK.find(x => x.s === b.dataset.s), r = b.getBoundingClientRect(); openWin({ asset: m }, Math.max(20, r.left - 330), r.top); });
$('list').addEventListener('mouseover', e => { const b = e.target.closest('.row'); const m = b && MK.find(x => x.s === b.dataset.s); hover = m ? groups.find(g => g.items.includes(m)) || null : null; });
$('list').addEventListener('mouseleave', () => hover = null);

// ---------- sections ----------
const secs = $('secs');
secs.innerHTML = SEC.map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${k === sec}">${n}</button>`).join('');
secs.onclick = e => { const b = e.target.closest('button'); if (!b) return; sec = b.dataset.k; secs.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));  if (cont !== 'all' && !conts().includes(cont)) { cont = 'all'; country = 'all'; } if (country !== 'all' && !MK.some(m => m.k === country && inSec(m))) country = 'all'; regroup(); buildPickers(); drawList(); };
regroup(); buildPickers(); drawList(); requestAnimationFrame(frame);
// Search: countries first, then assets by name or ticker; Enter opens the top hit
{ const q = $('gq'), box = $('gres'); let hits = [], act = 0;
  const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const countries = [...new Map(MK.map(m => [m.k, m])).values()];
  const show = () => { const t = norm(q.value.trim()); if (!t) { box.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
    const cs = countries.filter(m => norm(m.k).includes(t)).slice(0, 5).map(m => ({ c: m }));
    const as = MK.filter(m => norm(m.n).includes(t) || norm(m.s).startsWith(t)).sort((a, b) => (norm(b.n).startsWith(t) - norm(a.n).startsWith(t)) || b.m - a.m).slice(0, 12).map(m => ({ a: m }));
    hits = [...cs, ...as]; act = 0;
    box.innerHTML = hits.length ? (cs.length ? '<div class="gh">Countries</div>' : '') + hits.map((h, i) => (i === cs.length && as.length ? '<div class="gh">Assets</div>' : '') + (h.c
      ? `<button type="button" role="option" data-i="${i}"><span class="ic ic-flag">${flagImg(h.c.cc)}</span><span><b>${esc(h.c.k)}</b><small>${esc(h.c.r)} · ${MK.filter(m => m.k === h.c.k).length} assets</small></span><span></span></button>`
      : `<button type="button" role="option" data-i="${i}">${ico(h.a)}<span><b>${esc(h.a.n)}</b><small>${SECN[h.a.t]} · ${esc(h.a.k)}</small></span><span class="pill ${dir(h.a)}">${chg(h.a)}</span></button>`)).join('') : '<div class="gh">No match</div>';
    box.hidden = false; q.setAttribute('aria-expanded', 'true'); mark(); };
  const mark = () => box.querySelectorAll('[data-i]').forEach(b => b.classList.toggle('act', +b.dataset.i === act));
  const pick = i => { const h = hits[i]; if (!h) return; box.hidden = true; q.value = ''; q.blur();
    if (h.c) { if (sec !== 'all') secs.querySelector('[data-k=all]').click(); setCont(h.c.r); setCountry(h.c.k); const g = groups.find(g => g.k === h.c.k); g && openWin({ group: g }); }
    else { if (sec !== 'all') secs.querySelector('[data-k=all]').click(); setCont(h.a.r); setCountry(h.a.k); openWin({ asset: h.a }); } };
  q.addEventListener('input', show); q.addEventListener('focus', show);
  q.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); mark(); } else if (e.key === 'Enter') { e.preventDefault(); pick(act); } else if (e.key === 'Escape') { box.hidden = true; } });
  box.addEventListener('mousedown', e => { const b = e.target.closest('[data-i]'); if (b) { e.preventDefault(); pick(+b.dataset.i); } });
  q.addEventListener('blur', () => setTimeout(() => box.hidden = true, 120)); }
// Links such as globe.html?country=Japan open straight on that country
{ const qc = QP.get('country'), g = qc && groups.find(g => g.k === qc); if (g) { setCountry(qc); openWin({ group: g }); } }
{ const n = document.querySelector('.note'), d = new Date(ASOF); if (n) n.innerHTML = n.innerHTML.replace(/^Real data from [^:]+:/, 'Prices updated ' + d.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ':'); }
</script>
