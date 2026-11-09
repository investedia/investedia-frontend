// Markets page: live board. Sectors heatmap, indices by region, commodities, crypto (live via Coinbase when allowed), currencies.
(() => {
  const $ = id => document.getElementById(id);
  const WIN = [['d', 'Today'], ['w', 'Week'], ['m', 'Month']];
  const VIEW = [['sec', 'Sectors'], ['idx', 'Indices'], ['cmd', 'Commodities'], ['cry', 'Crypto'], ['fx', 'FX'], ['tv', 'Live charts']];
  const S = { win: 'd', view: 'sec', region: 'Americas', cgrp: 'All', sel: null, by: {}, intra: {}, ready: false, live: {}, liveOn: false, relay: {} };
  const money = (v, a) => window.InvPrefs ? InvPrefs.fmt(v, a) : nf(v);
  const nf = v => v == null || !isFinite(v) ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: Math.abs(v) >= 1000 ? 2 : Math.abs(v) >= 1 ? 2 : 4, minimumFractionDigits: Math.abs(v) >= 1 ? 2 : 4 });
  const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(Math.abs(v) >= 10 ? 1 : 2) + '%';
  const cls = v => v > 0.005 ? 'u' : v < -0.005 ? 'd' : 'o';
  const arrow = v => v > 0.005 ? '↑' : v < -0.005 ? '↓' : '↔';
  const col = v => v > 0.005 ? '#34d399' : v < -0.005 ? '#f87171' : '#8b8b94';
  const tint = v => v > 0.005 ? `rgba(52,211,153,${Math.min(.6, .12 + Math.abs(v) * .09).toFixed(2)})` : v < -0.005 ? `rgba(248,113,113,${Math.min(.6, .12 + Math.abs(v) * .09).toFixed(2)})` : 'rgba(255,255,255,.07)';
  const pc = (a, b) => b ? (a / b - 1) * 100 : 0;
  const move = (a, k) => k === 'd' ? a.d : k === 'w' ? a.w : (a.sp && a.sp.length > 1 ? pc(a.sp[a.sp.length - 1], a.sp[0]) : 0);
  const series = (a, k) => k === 'd' ? (S.intra[a.s]?.d1?.c && S.intra[a.s].d1.c.length > 3 ? S.intra[a.s].d1.c : (a.sp || []).slice(-6)) : k === 'w' ? (a.sp || []).slice(-6) : (a.sp || []);
  const path = (v, w, h, fill) => { if (!v || v.length < 2) return ''; const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, pts = v.map((y, i) => [i / (v.length - 1) * w, h - 2 - (y - lo) / r * (h - 4)]); const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(''); return { d, area: d + `L${w} ${h}L0 ${h}Z` }; };
  const chart = (v, c, w = 100, h = 32, area = false) => { const p = path(v, w, h); if (!p) return ''; return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${area ? `<path d="${p.area}" fill="${c}" opacity=".12"/>` : ''}<path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`; };
  const flag = c => c ? `<img class="mh-fl" src="assets/globe/flags/${c === 'european_union' ? 'eu' : c}.svg" alt="" onerror="this.remove()">` : '';
  const icon = a => window.AssetIcons ? AssetIcons.icon(a) : '';
  const rangeBar = (a, cur) => { const v = a.sp || []; if (v.length < 2) return ''; const lo = Math.min(...v, cur), hi = Math.max(...v, cur), pos = hi === lo ? 50 : (cur - lo) / (hi - lo) * 100; return `<div class="mh-rg" title="1-month range"><i style="left:${pos.toFixed(0)}%"></i></div><div class="mh-rgl"><span>${money(lo, a)}</span><span>1M range</span><span>${money(hi, a)}</span></div>`; };
  // Exchange sessions (weekdays, local time) for the open/closed dot.
  const SESS = { us: ['America/New_York', 570, 960], ca: ['America/Toronto', 570, 960], br: ['America/Sao_Paulo', 600, 1075], gb: ['Europe/London', 480, 990], de: ['Europe/Berlin', 540, 1050], fr: ['Europe/Paris', 540, 1050], european_union: ['Europe/Paris', 540, 1050], es: ['Europe/Madrid', 540, 1050], nl: ['Europe/Amsterdam', 540, 1050], ch: ['Europe/Zurich', 540, 1040], jp: ['Asia/Tokyo', 540, 930], hk: ['Asia/Hong_Kong', 570, 960], cn: ['Asia/Shanghai', 570, 900], kr: ['Asia/Seoul', 540, 930], in: ['Asia/Kolkata', 555, 930], au: ['Australia/Sydney', 600, 960] };
  const isOpen = cc => { const z = SESS[cc]; if (!z) return null; try { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: z[0], weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value])); if (p.weekday === 'Sat' || p.weekday === 'Sun') return false; const m = (+p.hour % 24) * 60 + +p.minute; return m >= z[1] && m < z[2]; } catch { return null; } };
  const dot = cc => { const o = isOpen(cc); return o == null ? '' : `<span class="mh-od ${o ? 'on' : ''}" title="${o ? 'Market open' : 'Market closed'}"></span>`; };

  // ---------- Shared table: price, change, range, volume, chart (same layout for every view) ----------
  function tbl(L, o = {}) {
    const chg = o.chg || (a => move(a, S.win)), hasV = L.some(a => a.v) && o.range !== false, noR = o.range === false, dayRg = L.length && L.every(a => a.h && a.l && a.h > a.l), rk = o.rank !== false && o.rank;
    const lab = o.chgLabel || { d: 'Today', w: 'Week', m: 'Month' }[S.win];
    const rng = (a, cur) => { let lo = a.l, hi = a.h; if (!(dayRg)) { const v = a.sp || []; if (v.length < 2) return '—'; lo = Math.min(...v, cur); hi = Math.max(...v, cur); } if (!(hi > lo)) return '—'; return `<span class="mh-dr"><small class="mono">${money(lo, a)}</small><span class="mh-ms"><i style="left:${Math.max(0, Math.min(100, (cur - lo) / (hi - lo) * 100)).toFixed(0)}%"></i></span><small class="mono">${money(hi, a)}</small></span>`; };
    return `<div class="mh-tbl${hasV ? '' : ' nv'}${rk ? '' : ' nr'}${noR ? ' nrg' : ''}"><div class="mh-th">${rk ? '<span>#</span>' : ''}<span>${o.first || 'Name'}</span><span>Price</span><span>${lab}</span>${noR ? '' : `<span class="mh-hide">${dayRg ? 'Day range' : '1-month range'}</span>`}${hasV ? '<span class="mh-hide">Volume</span>' : ''}<span class="mh-hide">${S.win === 'd' ? 'Week' : lab}</span></div>${L.map((a, i) => { const m = chg(a), cur = S.live[a.s]?.p ?? a.p; return `<div class="mh-tr" data-s="${a.s}">${rk ? `<span class="mh-rk">${i + 1}</span>` : ''}<span class="mh-co">${o.id ? o.id(a) : `<span class="mh-ic2">${icon(a)}</span><b>${a.n}</b><small>${String(a.s).replace(/-USD$|=F$/, '').replace(/^\^/, '')}</small>`}</span><span class="mono" data-k="p">${money(cur, a)}</span><span class="mono ${cls(m)}" data-k="c">${isFinite(m) ? arrow(m) + ' ' + fmt(m) : '—'}</span>${noR ? '' : `<span class="mh-hide">${rng(a, cur)}</span>`}${hasV ? `<span class="mono mh-hide">${a.v ? InvPrefs.compact(a.v, a) : '—'}</span>` : ''}<span class="mh-sp mh-hide">${chart(S.win === 'd' ? (a.sp || []).slice(-6) : series(a, S.win), col(move(a, 'w')))}</span></div>`; }).join('')}</div>`;
  }
  // ---------- Sectors ----------
  const SGRP = { 'Technology': [['Technology'], null], 'Semiconductors': [['Technology'], /nvidia|amd|intel|tsm|asml|micron|broadcom|qualcomm|semi|lam research|applied materials|arm holdings/i], 'Energy': [['Energy'], null], 'Banks & Finance': [['Finance'], null], 'Healthcare': [['Healthcare'], null], 'Consumer & Retail': [['Consumer'], null], 'Autos': [['Consumer', 'Industrials'], /motor|auto|tesla|ford|toyota|volkswagen|byd|ferrari|stellantis|bmw|mercedes|general motors|hyundai|honda|porsche|rivian|lucid|nio\b|xpeng|li auto|mercedes|general motors/i], 'Industrials': [['Industrials'], null], 'Aerospace & Defence': [['Industrials'], /boeing|airbus|rheinmetall|lockheed|raytheon|bae|safran|defen|northrop|aerospace|general dynamics|l3harris|huntington|transdigm|thales|\brtx\b/i], 'Materials & Mining': [['Materials'], null], 'Utilities': [['Utilities'], null], 'Real estate': [['Real Estate'], null], 'Insurance': [['Finance'], /insur|allianz|axa|zurich|aig|chubb|prudential|munich|berkshire|progressive|metlife|allstate|travelers|aflac|hartford|american international/i], 'Communication': [['Communication'], null] };
  const known = a => a && isFinite(a.d) && Math.abs(a.d) < 25 && !/[.\d]/.test(String(a.s).replace(/[=^-]/g, '')) ;
  function sectorMovers(name) {
    if (name === 'Crypto') return CRY.map(s => S.by[s]).filter(Boolean);
    const [g, re] = SGRP[name] || [[], null];
    return Object.values(S.by).filter(a => a.t === 'stocks' && a.g !== 'Index' && a.g !== 'Country ETF' && !a.sector && known(a) && (re ? re.test(a.n) : g.includes(a.g)) && (!re || g.includes(a.g) || /Company/.test(a.g))).filter((a, i, arr) => arr.findIndex(b => b.n === a.n) === i || /-/.test(a.s) === false && false).sort((x, y) => Math.abs(move(y, S.win)) - Math.abs(move(x, S.win)));
  }
  function sectors() {
    const L = InvSectors.list.map(x => ({ x, a: S.by[x.etf] })).filter(o => o.a);
    const w = o => Math.abs(move(o.a, S.win));
    L.sort((a, b) => w(b) - w(a));
    const max = w(L[0]) || 1;
    $('mh-body').innerHTML = `<div class="mh-grid">${L.map((o, i) => { const m = move(o.a, S.win), big = i < 2 ? ' w2 r2' : i < 6 ? ' w2' : ''; return `<button type="button" class="mh-t${big}" data-n="${o.x.name}" aria-pressed="${S.sel === o.x.name}" style="background:${tint(m)}"><span><b><span class="mh-ic">${InvSectors.icon(o.x.name)}</span>${o.x.name}</b><small>${o.x.etf.replace('-USD', '')}</small></span><span class="mono ${cls(m)}">${arrow(m)} ${fmt(m)}</span></button>`; }).join('')}</div>`;
  }
  function sectorHtml(name) {
    const x = InvSectors.list.find(s => s.name === name), a = S.by[x.etf], all = sectorMovers(name), mv = all.slice(0, 14);
    return `<section class="mh-p"><div class="mh-ph"><span class="mh-ic lg">${InvSectors.icon(x.name)}</span><div><b>${x.name}</b><small>Sector fund ${x.etf.replace('-USD', '')} · ${all.length} tracked ${all.length === 1 ? 'company' : name === 'Crypto' ? 'coins' : 'companies'}</small></div></div>
      <div class="mh-ps">${['d', 'w', 'm'].map(k => `<div><small>${{ d: 'Today', w: 'Week', m: 'Month' }[k]}</small><span class="mono ${cls(move(a, k))}">${arrow(move(a, k))} ${fmt(move(a, k))}</span></div>`).join('')}<div class="mh-pc">${chart(a.sp, col(move(a, 'm')), 200, 48, true)}</div></div>
      <div class="mh-lab">Largest movers · ${{ d: 'today', w: 'this week', m: 'this month' }[S.win]}${all.length > mv.length ? ` · top ${mv.length} of ${all.length}` : ''}</div>
      ${mv.length ? tbl(mv, { first: 'Company', range: false }) : '<div class="nb-none">No tracked names for this sector yet.</div>'}
      <a class="mh-link" href="news.html?sector=${encodeURIComponent(x.slug)}">See articles on the News page →</a></section>`;
  }
  function openSector(name) {
    const x = InvSectors.list.find(s => s.name === name || s.slug === name); if (!x) return;
    if (window.InvPeek) InvPeek.panel(sectorHtml(x.name), '#s=' + x.slug);
  }
  if (window.InvPeek) InvPeek.onSector = (slug, push) => { const x = InvSectors.list.find(s => s.slug === slug); if (x && S.ready) openSector(x.name); };
  function panel() {}

  // ---------- Indices ----------
  const IDX = [['Americas', ['^GSPC', '^IXIC', '^NDX', '^DJI', '^RUT', '^VIX', '^GSPTSE', '^BVSP']], ['Europe', ['^FTSE', '^GDAXI', '^FCHI', '^STOXX50E', '^IBEX', '^AEX', '^SSMI']], ['Asia-Pacific', ['^N225', '^HSI', '000001.SS', '^KS11', '^NSEI', '^BSESN', '^AXJO']]];
  function card(a, sub) { const m = move(a, S.win), cur = S.live[a.s]?.p ?? a.p, v = series(a, S.win); return `<article class="mh-ic3" data-s="${a.s}"><div class="mh-c1">${flag(a.cc)}<span class="mh-cn"><b>${a.n}</b><small>${sub || ''}</small></span>${dot(a.cc)}</div><div class="mh-big mono" data-k="p">${money(cur, a)}</div><div class="mh-c2"><span class="mh-chip ${cls(m)}" data-k="c">${arrow(m)} ${fmt(m)}</span></div><div class="mh-ch">${chart(v, col(m), 160, 56, true)}</div>${rangeBar(a, cur)}</article>`; }
  // Region switch: one compact button with ‹ › on wide screens, tabs on phones. "All" shows every region stacked.
  const REGSHORT = { 'Asia-Pacific': 'Asia' };
  const regionList = () => IDX.map(([r, list]) => ({ r, rows: list.map(s => S.by[s]).filter(Boolean) })).filter(x => x.rows.length);
  const regAvg = rows => rows.reduce((t, a) => t + move(a, S.win), 0) / rows.length;
  const idxTable = (r, rows, hideH) => `<section class="mh-sec"><h2${hideH ? ' class="mh-vh"' : ''}>${r}</h2>${tbl(rows, { first: 'Index', id: a => `${flag(a.cc)}<b>${a.n}</b><small>${a.site || ''}</small>` })}</section>`;
  function indices() {
    const regs = regionList(); if (!regs.length) { $('mh-body').innerHTML = ''; return; }
    if (S.region !== 'All' && !regs.some(x => x.r === S.region)) S.region = regs[0].r;
    const sel = regs.find(x => x.r === S.region), pill = v => `<span class="mh-chip ${cls(v)}">${arrow(v)} ${fmt(v)}</span>`;
    const sum = sel ? `${sel.rows.length} ${sel.rows.length === 1 ? 'index' : 'indices'} · average ${pill(regAvg(sel.rows))}` : `${regs.reduce((n, x) => n + x.rows.length, 0)} indices in ${regs.length} regions`;
    const pc_ = `<div class="mh-rgc mh-rg-pc"><button type="button" class="mh-rstep" data-rstep="-1" aria-label="Previous region">‹</button><div class="mh-menu"><button type="button" class="mh-rbtn" aria-haspopup="true" aria-expanded="false" aria-controls="mh-rmenu">Region: ${sel ? sel.r : 'All regions'} <span aria-hidden="true">▾</span></button><div id="mh-rmenu" role="menu" hidden>${regs.map(x => `<button type="button" role="menuitem" data-region="${x.r}" aria-current="${x.r === S.region}"><b>${x.r}</b><span class="mh-rm">${chart(x.rows[0].sp || [], col(regAvg(x.rows)), 50, 18, false)}${pill(regAvg(x.rows))}</span></button>`).join('')}<button type="button" role="menuitem" data-region="All" aria-current="${S.region === 'All'}"><b>All regions</b></button></div></div><button type="button" class="mh-rstep" data-rstep="1" aria-label="Next region">›</button><span class="mh-rsum">${sum}</span></div>`;
    const ph_ = `<div class="mh-rtabs mh-rg-ph" role="group" aria-label="Region">${[...regs.map(x => x.r), 'All'].map(r => `<button type="button" data-region="${r}" aria-pressed="${r === S.region}">${REGSHORT[r] || r}</button>`).join('')}</div>`;
    $('mh-body').innerHTML = pc_ + ph_ + (sel ? idxTable(sel.r, sel.rows, true) : regs.map(x => idxTable(x.r, x.rows)).join(''));
  }
  const setRegion = r => { S.region = r; const u = new URL(location.href); u.searchParams.set('region', r); history.replaceState(null, '', u); draw(); };
  const closeRegionMenu = () => { const m = document.getElementById('mh-rmenu'); if (m && !m.hidden) { m.hidden = true; document.querySelector('.mh-rbtn')?.setAttribute('aria-expanded', 'false'); return true; } return false; };
  $('mh-body').addEventListener('click', e => {
    const btn = e.target.closest('.mh-rbtn'), pick = e.target.closest('[data-region]'), step = e.target.closest('[data-rstep]');
    if (btn) { const m = document.getElementById('mh-rmenu'), open = m.hidden; m.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) m.querySelector('[aria-current=true]')?.focus(); return; }
    if (pick) { setRegion(pick.dataset.region); return; }
    if (step) { const order = [...regionList().map(x => x.r), 'All'], k = order.indexOf(S.region); setRegion(order[(k + Number(step.dataset.rstep) + order.length) % order.length]); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.mh-menu')) closeRegionMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && closeRegionMenu()) document.querySelector('.mh-rbtn')?.focus(); });
  // ---------- Commodities ----------
  const CMD = ['GC=F', 'SI=F', 'HG=F', 'PL=F', 'BZ=F', 'CL=F', 'NG=F', 'HO=F', 'RB=F', 'ZW=F', 'ZC=F', 'ZS=F', 'KC=F', 'SB=F', 'CC=F', 'CT=F'];
  // Scoreboard on wide screens (group cards with the biggest mover), grouped list with chips on phones.
  const GRP = [['Energy', ['BZ=F', 'CL=F', 'NG=F', 'HO=F', 'RB=F']], ['Metals', ['GC=F', 'SI=F', 'HG=F', 'PL=F']], ['Agriculture', ['ZW=F', 'ZC=F', 'ZS=F', 'KC=F', 'SB=F', 'CC=F', 'CT=F']]];
  const GSHORT = { Agriculture: 'Agri' };
  function commodities() {
    const groups = GRP.map(([g, l]) => ({ g, rows: l.map(s => S.by[s]).filter(Boolean) })).filter(x => x.rows.length);
    const pill = v => `<span class="mh-chip ${cls(v)}">${arrow(v)} ${fmt(v)}</span>`, avg = rows => rows.reduce((t, a) => t + move(a, S.win), 0) / rows.length;
    const rowBtn = a => `<div class="mh-cr" data-s="${a.s}" role="button" tabindex="0"><span>${a.n}</span><span class="mh-crs">${chart(series(a, S.win), col(move(a, S.win)), 46, 16, false)}<span class="mono ${cls(move(a, S.win))}">${fmt(move(a, S.win))}</span></span></div>`;
    const score = groups.map(({ g, rows }) => { const L = [...rows].sort((a, b) => move(b, S.win) - move(a, S.win)), top = L[0], m = move(top, S.win);
      return `<article class="mh-cg"><div class="mh-cgh"><b>${g}</b>${pill(avg(rows))}</div><small class="mh-cgs">average ${{ d: 'today', w: 'this week', m: 'this month' }[S.win]} · ${rows.length} markets</small><div class="mh-cbig" data-s="${top.s}" role="button" tabindex="0"><span class="mh-lab">Biggest mover</span><div><b>${top.n}</b><strong class="mono ${cls(m)}">${arrow(m)} ${Math.abs(m).toFixed(2)}%</strong></div></div>${L.slice(1).map(rowBtn).join('')}</article>`; }).join('');
    const g = S.cgrp, shown = g === 'All' ? groups : groups.filter(x => x.g === g);
    const chips = `<div class="mh-rtabs mh-cm-chips" role="group" aria-label="Commodity group">${['All', ...groups.map(x => x.g)].map(x => `<button type="button" data-cgrp="${x}" aria-pressed="${x === g}">${GSHORT[x] || x}</button>`).join('')}</div>`;
    const list = shown.map(({ g: n, rows }) => (g === 'All' ? `<div class="mh-lab">${n}</div>` : '') + rows.map(a => { const m = move(a, S.win), cur = S.live[a.s]?.p ?? a.p; return `<div class="mh-cl" data-s="${a.s}" role="button" tabindex="0"><span><b>${a.n}</b><small class="mono">${money(cur, a)}</small></span>${chart(series(a, S.win), col(m), 52, 22, false)}${pill(m)}</div>`; }).join('')).join('');
    $('mh-body').innerHTML = `<div class="mh-cm-pc"><div class="mh-cs">${score}</div></div><div class="mh-cm-ph">${chips}<div class="mh-cll">${list}</div></div>`;
  }
  $('mh-body').addEventListener('click', e => { const b = e.target.closest('[data-cgrp]'); if (b) { S.cgrp = b.dataset.cgrp; draw(); } });
  $('mh-body').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-s][role=button]')) { e.preventDefault(); e.target.click(); } });
  // ---------- Crypto ----------
  const CRY = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD', 'DOGE-USD', 'ADA-USD', 'TRX-USD', 'AVAX-USD', 'LINK-USD', 'DOT-USD', 'LTC-USD'];
  function crypto() {
    const R = S.relay, haveRelay = Object.keys(R).length > 20;
    const mk = (id, v) => ({ s: id, n: v.n, t: 'crypto', p: v.p, d: v.pc, w: S.by[id]?.w ?? null, sp: S.by[id]?.sp || [], mc: v.mc, v: v.v, h: v.h, l: v.l });
    const L = haveRelay ? Object.entries(R).map(([id, v]) => mk(id, v)).sort((a, b) => (b.mc || b.v) - (a.mc || a.v)).slice(0, 50) : CRY.map(s => S.by[s]).filter(Boolean);
    const big = L.slice(0, 1), liveChg = a => { const l = S.live[a.s]; return l && l.o ? pc(l.p, l.o) : null; };
    const dayM = a => (S.win === 'd' && liveChg(a) != null) ? liveChg(a) : (S.win === 'd' ? a.d : move(a, S.win));
    const sorted = [...L].filter(a => isFinite(dayM(a))).sort((a, b) => dayM(b) - dayM(a)), useMc = L.some(a => a.mc > 0), key = a => useMc ? a.mc : a.v;
    const bigCard = a => { const m = dayM(a), cur = S.live[a.s]?.p ?? a.p, sp = S.by[a.s]?.sp || a.sp; return `<article class="mh-bt" data-s="${a.s}"><div class="mh-c1"><span class="mh-ic2">${icon(a)}</span><span class="mh-cn"><b>${a.n}</b><small>${a.s.replace('-USD', '')}</small></span></div><div class="mh-big mono" data-k="p">${money(cur, a)}</div><span class="mh-chip ${cls(m)}" data-k="c">${arrow(m)} ${fmt(m)}</span><div class="mh-ch tall">${chart(S.win === 'd' ? sp.slice(-8) : series({ ...a, sp }, S.win), col(m), 200, 90, true)}</div></article>`; };
    const mini = a => `<div class="mh-mini"><b>${a.s.replace('-USD', '')}</b><span class="mono ${cls(dayM(a))}">${arrow(dayM(a))} ${fmt(dayM(a))}</span></div>`,
      movers = `<article class="mh-bt mh-gl2"><div><div class="mh-lab">Top gainers · top 3</div>${sorted.slice(0, 3).map(mini).join('')}</div><div><div class="mh-lab">Top losers · top 3</div>${sorted.slice(-3).reverse().map(mini).join('')}</div></article>`;
    $('mh-body').innerHTML = `<div class="mh-big2">${big.map(bigCard).join('')}${movers}</div>
      <div class="mh-tbl"><div class="mh-th"><span>#</span><span>Coin</span><span>Price</span><span>${{ d: '24h', w: '7d', m: '30d' }[S.win]}</span><span class="mh-hide">24h range</span><span class="mh-hide">24h volume</span><span class="mh-hide">7d</span></div>${L.map((a, i) => { const m = dayM(a), cur = S.live[a.s]?.p ?? a.p, rg = (a.h && a.l && a.h > a.l) ? `<span class="mh-dr"><small class="mono">${money(a.l, a)}</small><span class="mh-ms"><i style="left:${Math.max(0, Math.min(100, (cur - a.l) / (a.h - a.l) * 100)).toFixed(0)}%"></i></span><small class="mono">${money(a.h, a)}</small></span>` : '—'; return `<div class="mh-tr" data-s="${a.s}"><span class="mh-rk">${i + 1}</span><span class="mh-co"><span class="mh-ic2">${icon(a)}</span><b>${a.n}</b><small>${a.s.replace('-USD', '')}</small></span><span class="mono" data-k="p">${money(cur, a)}</span><span class="mono ${cls(m)}" data-k="c">${isFinite(m) ? arrow(m) + ' ' + fmt(m) : '—'}</span><span class="mh-hide">${rg}</span><span class="mono mh-hide">${a.v ? InvPrefs.compact(a.v, a) : '—'}</span><span class="mh-sp mh-hide">${chart(S.by[a.s]?.sp || a.sp, col(S.by[a.s] ? move(S.by[a.s], 'w') : dayM(a)))}</span></div>`; }).join('')}</div>`;
  }
  // ---------- FX ----------
  const CUR = [['USD', 'us'], ['EUR', 'eu'], ['GBP', 'gb'], ['JPY', 'jp'], ['CHF', 'ch'], ['AUD', 'au'], ['CAD', 'ca'], ['NZD', 'nz']];
  const PAIR = { EUR: ['EURUSD', 1], GBP: ['GBPUSD', 1], AUD: ['AUDUSD', 1], NZD: ['NZDUSD', 1], JPY: ['USDJPY', -1], CHF: ['USDCHF', -1], CAD: ['USDCAD', -1] };
  const vsUsd = (c, k) => { if (c === 'USD') return 0; const [s, dir] = PAIR[c], a = S.by[s]; if (!a) return null; const m = move(a, k); return dir === 1 ? m : (1 / (1 + m / 100) - 1) * 100; };
  function fx() {
    const k = S.win, v = CUR.map(([c]) => vsUsd(c, k));
    const cell = (i, j) => { if (v[i] == null || v[j] == null) return '<td></td>'; if (i === j) return '<td class="mh-dg">—</td>'; const m = ((1 + v[i] / 100) / (1 + v[j] / 100) - 1) * 100; return `<td style="background:${tint(m * 3)}" class="${cls(m)}">${fmt(m)}</td>`; };
    const MAJ = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD'], FC = { EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', CHF: 'ch', AUD: 'au', CAD: 'ca' };
    $('mh-body').innerHTML = `<section class="mh-sec"><h2>Currency strength</h2><p class="mh-sub">Change of the row currency against the column currency, ${{ d: 'today', w: 'this week', m: 'this month' }[k]}.</p><div class="mh-mx"><table><thead><tr><th></th>${CUR.map(([c, f]) => `<th><img class="mh-fl" src="assets/globe/flags/${f}.svg" alt=""><span>${c}</span></th>`).join('')}</tr></thead><tbody>${CUR.map(([c, f], i) => `<tr><th><img class="mh-fl" src="assets/globe/flags/${f}.svg" alt=""><span>${c}</span></th>${CUR.map((_, j) => cell(i, j)).join('')}</tr>`).join('')}</tbody></table></div></section>
      <section class="mh-sec"><h2>Major pairs</h2>${tbl(MAJ.map(s => S.by[s]).filter(Boolean), { first: 'Pair', id: a => { const b = a.s.slice(0, 3), q = a.s.slice(3); return `<span class="mh-pr"><img class="mh-fl" src="assets/globe/flags/${FC[q]}.svg" alt=""><img class="mh-fl mid" src="assets/globe/flags/${FC[b]}.svg" alt=""></span><b>${b}/${q}</b><small>${a.n}</small>`; } })}</div></section>`;
  }
  // ---------- Live charts: TradingView free widgets, loaded only after a click ----------
  function liveCharts() {
    $('mh-body').innerHTML = `<section class="mh-tvbox"><div class="mh-tvh"><div><b>Live charts</b><small>Free real-time-style charts by TradingView. Real-time or delayed depends on each exchange.</small></div><button type="button" class="mh-tvbtn" id="mh-tv-go">Load live charts</button></div><div id="mh-tv" class="mh-tv"><p>These charts are provided by TradingView. Loading them connects your browser to TradingView, which receives your IP address and may set its own cookies. Nothing loads until you press the button.</p></div></section>`;
    $('mh-tv-go').onclick = () => { $('mh-tv-go').hidden = true;
      const host = $('mh-tv'); host.innerHTML = '<div class="tradingview-widget-container mh-tvw wide"><div class="tradingview-widget-container__widget"></div></div><div class="tradingview-widget-container mh-tvw"><div class="tradingview-widget-container__widget" style="height:100%"></div></div><div class="mh-tvact"><button type="button" class="mh-tvfs" id="mh-tv-fs">Full screen chart</button></div><p class="mh-tvc">Charts and quotes by <a href="https://www.tradingview.com/" target="_blank" rel="noopener">TradingView</a>.</p>';
      const add = (box, src, cfg) => { const sc = document.createElement('script'); sc.src = 'https://s3.tradingview.com/external-embedding/' + src; sc.async = true; sc.text = JSON.stringify(cfg); box.append(sc); };
      $('mh-tv-fs').onclick = () => { const el = host.querySelectorAll('.tradingview-widget-container')[1]; (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); };
      const [t, c] = host.querySelectorAll('.tradingview-widget-container');
      add(t, 'embed-widget-ticker-tape.js', { symbols: [{ proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' }, { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' }, { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' }, { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' }, { proName: 'FX:EURUSD', title: 'EUR/USD' }, { proName: 'OANDA:XAUUSD', title: 'Gold' }], colorTheme: 'dark', isTransparent: false, displayMode: 'adaptive', locale: 'en' });
      add(c, 'embed-widget-advanced-chart.js', { autosize: true, symbol: 'BITSTAMP:BTCUSD', interval: '15', theme: 'dark', style: '1', locale: 'en', backgroundColor: '#101012', hide_side_toolbar: false, allow_symbol_change: true, details: false, calendar: false, withdateranges: true });
    };
  }
  // ---------- Render and live ----------
  const skeleton = () => { $('mh-body').innerHTML = '<div class="mh-cards">' + Array(6).fill('<div class="mh-sk"></div>').join('') + '</div>'; };
  if (window.InvPrefs) InvPrefs.onChange(() => { if (S.ready) draw(); });
  function draw() {
    document.querySelectorAll('#mh-win button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.win));
    document.querySelectorAll('#mh-view button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.view));
    if (!S.ready) return skeleton();
    ({ sec: sectors, idx: indices, cmd: commodities, cry: crypto, fx, tv: liveCharts })[S.view]();
    $('mh-live-note').hidden = !(S.view === 'cry' && !S.liveOn);
    status();
  }
  function status() { const el = $('mh-status'); el.className = 'mh-status' + (S.view === 'cry' && S.liveOn ? ' live' : ''); el.lastChild.textContent = S.view === 'cry' && S.liveOn ? 'Live' : 'Delayed'; }
  // Live crypto: Coinbase public WebSocket, only after the visitor allows "Live prices".
  let ws, retry = 0, pend = {}, raf = 0, rt;
  const PROD = CRY.map(s => s);
  function flush() { raf = 0; for (const [id, l] of Object.entries(pend)) { document.querySelectorAll(`[data-s="${id}"]`).forEach(row => { const p = row.querySelector('[data-k=p]'), c = row.querySelector('[data-k=c]'); if (p) { const prev = p.textContent; p.textContent = money(l.p, S.by[id]); if (prev !== p.textContent && !matchMedia('(prefers-reduced-motion: reduce)').matches) { p.classList.remove('up', 'dn'); void p.offsetWidth; p.classList.add(l.dir > 0 ? 'up' : 'dn'); } } if (c && S.win === 'd' && l.o) { const m = pc(l.p, l.o); c.className = (c.className.replace(/\b(u|d|o)\b/g, '') + ' ' + cls(m)).replace(/\s+/g, ' '); c.textContent = `${arrow(m)} ${fmt(m)}`; } }); } pend = {}; }
  // Preferred path: our own relay (no third party sees the visitor), polled every 3 s. Fallback: direct Coinbase socket with consent.
  let poll;
  function relay() {
    const tick = async () => { try { const r = await fetch(window.INV_LIVE_URL, { cache: 'no-store' }); if (!r.ok) throw 0; const j = await r.json(); let any = false; for (const [id, v] of Object.entries(j.p || {})) { const prev = S.live[id]?.p; S.relay[id] = v; S.live[id] = { p: v.p, o: v.o || v.p / (1 + (v.pc || 0) / 100) }; pend[id] = { ...S.live[id], dir: prev == null ? 0 : v.p - prev }; any = true; } if (any) { if (!S.liveOn) { S.liveOn = true; if (S.ready) draw(); } else if (!S.fullDrawn && S.view === 'cry' && S.ready && Object.keys(S.relay).length > 20) { S.fullDrawn = true; draw(); } if (!raf) raf = requestAnimationFrame(flush); } } catch { if (S.liveOn) { S.liveOn = false; if (S.ready) draw(); } } };
    tick(); poll = setInterval(() => { if (!document.hidden) tick(); }, 3000);
  }
  function connect() {
    if (!(window.InvConsent && InvConsent.allows('live'))) return;
    if (window.INV_LIVE_URL) { if (!poll) relay(); return; }
    if (ws) return;
    try { ws = new WebSocket('wss://ws-feed.exchange.coinbase.com'); } catch { return; }
    ws.onopen = () => { retry = 0; S.liveOn = true; ws.send(JSON.stringify({ type: 'subscribe', product_ids: PROD, channels: ['ticker'] })); if (S.ready) draw(); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } if (m.type !== 'ticker' || !m.price) return; const p = +m.price, prev = S.live[m.product_id]?.p; S.live[m.product_id] = { p, o: +m.open_24h || S.live[m.product_id]?.o }; pend[m.product_id] = { ...S.live[m.product_id], dir: prev == null ? 0 : p - prev }; if (!raf) raf = requestAnimationFrame(flush); };
    ws.onclose = () => { ws = null; S.liveOn = false; if (S.ready) status(); if (window.InvConsent && InvConsent.allows('live')) { clearTimeout(rt); rt = setTimeout(connect, Math.min(30000, 1500 * 2 ** retry++)); } };
    ws.onerror = () => { try { ws.close(); } catch {} };
  }
  function disconnect() { if (window.INV_LIVE_URL) { clearInterval(poll); poll = null; S.liveOn = false; S.live = {}; S.relay = {}; if (S.ready) draw(); return; } clearTimeout(rt); if (ws) { ws.onclose = null; try { ws.close(); } catch {} ws = null; } S.liveOn = false; S.live = {}; if (S.ready) draw(); }
  window.addEventListener('inv-consent-change', () => (window.InvConsent && InvConsent.allows('live')) ? connect() : disconnect());
  $('mh-live-on').onclick = () => window.InvConsent && InvConsent.open();
  // ---------- Events ----------
  $('mh-win').innerHTML = WIN.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('');
  $('mh-view').innerHTML = VIEW.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('');
  $('mh-win').onclick = e => { const b = e.target.closest('button'); if (b) { S.win = b.dataset.k; draw(); } };
  $('mh-view').onclick = e => { const b = e.target.closest('button'); if (b) { S.view = b.dataset.k; S.sel = null; draw(); } };
  $('mh-body').addEventListener('click', e => { const card = e.target.closest('[data-s]'); if (card && !e.target.closest('a,button,.mh-t')) { window.InvPeek ? InvPeek.open(card.dataset.s) : (location.href = 'asset.html?s=' + encodeURIComponent(card.dataset.s)); return; } const t = e.target.closest('.mh-t'); if (t) openSector(t.dataset.n); });
  const params = new URLSearchParams(location.search); if (VIEW.some(v => v[0] === params.get('view'))) S.view = params.get('view'); { const r = (params.get('region') || '').toLowerCase(), hit = [...IDX.map(x => x[0]), 'All'].find(x => x.toLowerCase() === r || (REGSHORT[x] || '').toLowerCase() === r); if (hit) S.region = hit; }
  draw();
  const refresh = () => Promise.all([AssetIcons.ready, fetch('assets/globe/markets.json', { cache: 'no-cache' }).then(r => r.json()), fetch('assets/globe/news-prices.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ assets: {} })), fetch('assets/intraday.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ s: {} }))])
    .then(([, m, np, i]) => { S.by = Object.fromEntries((m.assets || []).map(a => [a.s, a])); Object.assign(S.by, np.assets || {}); S.intra = i.s || {}; $('mh-up').textContent = 'Updated ' + new Date(m.asof).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); S.ready = true; draw(); })
    .catch(e => { console.error('markets', e); $('mh-body').innerHTML = '<div class="nb-none">Market data could not load. Please refresh.</div>'; });
  refresh().then(connect); setInterval(() => { if (!document.hidden) refresh().then(() => { if (!S.sel) { /* keep selection panel stable */ } }); }, 60000);
})();
