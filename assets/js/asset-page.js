// Asset page: ?s=SYMBOL. Price, chart, volatility, big-move analysis, related articles. Crypto streams through our live relay when it is configured.
(() => {
  const root = document.getElementById('ap'), qs = new URLSearchParams(location.search), EMB = qs.get('embed') === '1';
  const ALIAS = { XAU: 'GC=F', XAG: 'SI=F', WTI: 'CL=F', BRENT: 'BZ=F', NG: 'NG=F', HG: 'HG=F', PL: 'PL=F', ZW: 'ZW=F', ZC: 'ZC=F', ZS: 'ZS=F', KC: 'KC=F', SB: 'SB=F', BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD', XRP: 'XRP-USD', SPX: '^GSPC', NDX: '^NDX', DJI: '^DJI', FTSE: '^FTSE', DAX: '^GDAXI', N225: '^N225' };
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = v => v == null || !isFinite(v) ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: Math.abs(v) >= 1 ? 2 : 4, minimumFractionDigits: Math.abs(v) >= 1 ? 2 : 4 });
  const money = v => window.InvPrefs ? InvPrefs.fmt(v, S.a) : nf(v);
  const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(Math.abs(v) >= 10 ? 1 : 2) + '%';
  const cls = v => v > 0.005 ? 'u' : v < -0.005 ? 'd' : 'o', arrow = v => v > 0.005 ? '↑' : v < -0.005 ? '↓' : '↔', col = v => v > 0.005 ? '#34d399' : v < -0.005 ? '#f87171' : '#8b8b94';
  const pc = (a, b) => b ? (a / b - 1) * 100 : 0;
  const S = { win: 'd', a: null, intra: {}, live: null, hist: null };
  const std = sp => { const r = (sp || []).slice(-22).map((x, i, v) => i ? (x / v[i - 1] - 1) * 100 : null).slice(1); if (r.length < 8) return null; const m = r.reduce((t, x) => t + x, 0) / r.length; return Math.sqrt(r.reduce((t, x) => t + (x - m) ** 2, 0) / r.length); };
  const series = (a, k) => k === 'd' ? (S.intra[a.s]?.d1?.c?.length > 3 ? S.intra[a.s].d1.c : (a.sp || []).slice(-6)) : k === 'w' ? (a.sp || []).slice(-6) : (a.sp || []);
  const chg = (a, k) => k === 'd' ? a.d : k === 'w' ? a.w : pc((a.sp || [])[a.sp.length - 1], (a.sp || [])[0]);
  const area = (v, c, w = 600, h = 220) => { if (!v || v.length < 2) return ''; const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, pts = v.map((y, i) => [i / (v.length - 1) * w, h - 6 - (y - lo) / r * (h - 12)]), d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(''); return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}L${w} ${h}L0 ${h}Z" fill="${c}" opacity=".12"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`; };
  // Chart (2026-11 design): price axis left, time axis below, soft gradient fill, glowing line, news markers with an article card
  const NEWS_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>';
  function chart(a, v, c, rel) {
    if (!v || v.length < 2) return '';
    const W = 600, H = 220, lo = Math.min(...v), hi = Math.max(...v), pad = (hi - lo) * .08 || hi * .002 || 1, room = rel && rel.length ? (hi - lo + 2 * pad) * .3 : 0, L0 = lo - pad - (MK === 'c' ? room : 0), H0 = hi + pad + (MK === 'b' ? room : 0), r = H0 - L0;  // free lane for the news markers (top for b, bottom for c)
    const X = i => i / (v.length - 1) * W, Y = y => H - (y - L0) / r * H;
    const d = v.map((y, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1)).join(''), gid = 'apg' + Math.random().toString(36).slice(2, 7);
    const dec = r < 2 ? 2 : r < 20 ? 1 : 0, tick = k => (L0 + r * k / 4);
    const yl = [4, 3, 2, 1, 0].map(k => `<span style="top:${(100 - k * 25).toFixed(1)}%">${money(tick(k))}</span>`).join('');
    const grid = [1, 2, 3].map(k => `<line x1="0" x2="${W}" y1="${H * k / 4}" y2="${H * k / 4}"/>`).join('');
    const t = S.intra[a.s]?.d1?.t, now = Date.now(), win = S.win;
    const tOk = win === 'd' && t?.length > 1 && t[t.length - 1] - t[0] > 1800;  // real intraday times
    const t0 = tOk ? t[0] * 1000 : now - (win === 'd' ? 864e5 : (win === 'w' ? 7 : 30) * 864e5), t1 = tOk ? t[t.length - 1] * 1000 : now;
    const xl = Array.from({ length: 6 }, (_, k) => { const ts = t0 + (t1 - t0) * k / 5; const lab = win === 'd' ? new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); return `<span style="left:${k * 20}%">${lab}</span>`; }).join('');
    return `<div class="ap-yax">${yl}</div><div class="ap-plot"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="color:${c}"><defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><g class="ap-grid">${grid}</g><path d="${d}L${W} ${H}L0 ${H}Z" fill="url(#${gid})"/><path class="ap-ln" d="${d}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>${pins(a, rel, v, L0, r)}</div><div class="ap-xax">${xl}</div>`;
  }
  // News pins on the chart: each article that names the asset sits on the line at its publication time; same numbers as the list below
  const MK = (new URLSearchParams(location.search).get('mk') || 'b').replace(/[^abc]/g, '') || 'a';
  // marker glyph options (?ic=): 1 article sheet, 2 newspaper, 3 source initials, 4 direction arrow, 5 article number
  const IC = (new URLSearchParams(location.search).get('ic') || '2').replace(/[^1-5]/g, '') || '1';
  const PAPER_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h11v13a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2z"/><path d="M16 9h3v9a2 2 0 0 1-2 2"/><path d="M8 9h5M8 12h5M8 15h3"/></svg>';
  const pinGlyph = x => { const dir = x.i.direction;
    if (IC === '2') return PAPER_IC;
    if (IC === '3') return `<b>${esc((x.s.source?.name || 'N').replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'N')}</b>`;
    if (IC === '4') return `<b>${dir === 'up' ? '↑' : dir === 'down' ? '↓' : '↔'}</b>`;
    if (IC === '5') return `<b>${x.num}</b>`;
    return NEWS_IC; };
  function pins(a, rel, v, L0, rr) {
    if (!v || v.length < 2 || !rel.length) return '';
    const t = S.intra[a.s]?.d1?.t, end = S.win === 'd' && t?.length ? t[t.length - 1] * 1000 : Date.now(), start = S.win === 'd' ? (t?.length ? t[0] * 1000 : end - 864e5) : end - (S.win === 'w' ? 7 : 30) * 864e5;
    const lo = L0 ?? Math.min(...v), r = rr ?? (Math.max(...v) - lo || 1), big = a.m === 1 || a.t !== 'stocks' || a.g === 'Index', max = innerWidth < 700 ? 5 : 7, gap = innerWidth < 700 ? 12 : 7, used = [];
    const L = rel.map(({ s, i }, n) => ({ s, i, num: rel.length - n })).filter(x => { const ts = Date.parse(x.s.published_at); return ts >= start && ts <= end + 36e5; }).slice(0, max).map(x => ({ ...x, f: Math.round(Math.max(0, Math.min(1, (Date.parse(x.s.published_at) - start) / (end - start))) * (v.length - 1)) / (v.length - 1) })).sort((p, q) => p.f - q.f);
    let prev = -99; for (const x of L) { x.left = Math.max(x.f * 100, prev + gap); prev = x.left; }
    for (let k = L.length - 1, lim = 96; k >= 0; k--) { if (L[k].left > lim) L[k].left = lim; lim = L[k].left - gap; }
    return L.map(x => { x.left = Math.max(1, x.left); const fi = Math.min(v.length - 1, x.left / 100 * (v.length - 1)), i0 = Math.floor(fi), y = v[i0] + ((v[Math.min(v.length - 1, i0 + 1)] - v[i0]) * (fi - i0)), top = 100 - (y - lo) / r * 100;
      return `<button type="button" class="ap-pin n" style="left:${Math.max(1, x.left).toFixed(1)}%;top:${top.toFixed(1)}%;--y:${top.toFixed(1)}%;--yv:${top.toFixed(2)}" data-n="${x.num}" aria-label="Article ${x.num}: ${esc(x.s.headline)}"><i class="ap-pin-ic ic-${IC}">${pinGlyph(x)}</i></button>`;
    }).join('');
  }
  let HQ = {};  // verified head-office cities (company-hq.json), filled when the page data loads
  const find = (by, s) => by[s] || by[ALIAS[s]] || by[s + '-USD'] || by[s + '=F'] || by['^' + s] || Object.values(by).find(a => a.n && a.n.toLowerCase() === s.toLowerCase());
  function related(a, stories) {
    const sym = a.s.toUpperCase(), base = sym.replace('-USD', '').replace('=X', ''), name = (a.n || '').toLowerCase(), out = [];
    for (const s of stories) { const i = (s.impacts || []).find(i => { const t = String(i.ticker || '').toUpperCase(); return t === sym || t === base || (name.length > 3 && String(i.name || '').toLowerCase() === name); }); if (i) out.push({ s, i }); }
    const seen = new Set(out.map(x => x.s.id));
    for (const e of (S.an2?.by?.[sym] || S.an2?.by?.[base] || [])) if (!seen.has(e.id)) { seen.add(e.id); out.push({ s: { id: e.id, headline: e.h, published_at: e.at, source: { name: e.src }, url: e.url, image: e.img ? { file: e.img } : null, event_type: e.fam, old: !e.lib }, i: { direction: e.dir === 'up' ? 'up' : e.dir === 'down' ? 'down' : 'mixed' } }); }
    return out.sort((x, y) => Date.parse(y.s.published_at) - Date.parse(x.s.published_at)).slice(0, 25);
  }
  if (window.InvPrefs) InvPrefs.onChange(() => { if (S.a) render(); });
  function render() {
    const a = S.a, live = S.live, price = live?.p ?? a.p, m = S.win === 'd' && live?.o ? pc(live.p, live.o) : chg(a, S.win), sd = std(a.sp), z = sd ? a.d / sd : null, rel = S.rel, an = S.an?.[a.s];
    const level = z == null ? null : Math.abs(z) >= 2 ? ['Unusually large move', 'big'] : Math.abs(z) >= 1.3 ? ['Notable move', 'mid'] : ['Within normal range', 'ok'];
    const lo = Math.min(...(a.sp || [a.p])), hi = Math.max(...(a.sp || [a.p])), pos = hi === lo ? 50 : (price - lo) / (hi - lo) * 100;
    const sym = a.s.replace(/=F$/, '').replace(/^\^/, '').replace(/=X$/, '').replace('-USD', '');
    const base = z == null ? '' : `${a.n} is ${a.d > 0 ? 'up' : a.d < 0 ? 'down' : 'flat'} ${Math.abs(a.d).toFixed(2)}% today, ${Math.abs(z).toFixed(1)}× its typical daily move (21-day volatility: ${sd.toFixed(2)}%).`;
    const cell = (l, v, bar, sub, tip) => `<div><small>${l}</small><b class="mono">${v}</b>${bar != null ? `<div class="mh-rg ap-rgb"><s style="width:${bar}%"></s><i style="left:${bar}%"></i></div>` : ''}${tip ? `<em class="ap-rgt">${tip}<span>Current price</span></em>` : ''}${sub ? `<span class="ap-rgs">${sub}</span>` : ''}</div>`;
    const rgc = (l, lo, hi, cur, kind) => { if (!(isFinite(lo) && isFinite(hi) && hi > lo)) return ''; const f = Math.max(0, Math.min(1, (cur - lo) / (hi - lo))), bar = (f * 100).toFixed(0);
      const sub = kind === 'd' ? (f >= .8 ? 'Near day high' : f <= .2 ? 'Near day low' : 'Mid day range') : kind === 'y' ? `${Math.round(f * 100)}% through 52W range` : (f <= .5 ? `${Math.round((cur / lo - 1) * 100)}% above monthly low` : `${Math.round((1 - cur / hi) * 100)}% below monthly high`);
      return cell(l, `${money(lo)} – ${money(hi)}`, bar, sub, kind === 'd' ? money(cur) : ''); };
    const d1 = (S.intra[a.s]?.d1?.c || []).filter(isFinite), H = S.hist, lastD = H?.daily?.[H.daily.length - 1];
    const vd = (H?.daily || []).slice(-21, -1).map(r => r[5]).filter(v => v > 0), volAvg = !live?.v && lastD?.[5] && vd.length >= 10 ? `${(lastD[5] / (vd.reduce((x, y) => x + y, 0) / vd.length)).toFixed(2)}× 20D avg` : '';
    const dayLo = live?.l ?? (d1.length > 3 ? Math.min(...d1) : null), dayHi = live?.h ?? (d1.length > 3 ? Math.max(...d1) : null);
    const vol = live?.v ? (window.InvPrefs ? InvPrefs.compact(live.v, { t: 'crypto' }) : null) : (lastD && lastD[5] ? new Intl.NumberFormat(window.InvPrefs ? undefined : 'en', { notation: 'compact', maximumFractionDigits: 1 }).format(lastD[5]) : null);
    const figs = [rgc('Day range', dayLo, dayHi, price, 'd'), rgc('52-week range', H?.lo52, H?.hi52, price, 'y'), rgc('1-month range', lo, hi, price, 'm'), vol ? cell('Volume', vol, null, volAvg) : '', cell('Week', `<span class="${cls(a.w)}">${arrow(a.w)} ${fmt(a.w || 0)}</span>`), cell('Month', `<span class="${cls(chg(a, 'm'))}">${arrow(chg(a, 'm'))} ${fmt(chg(a, 'm'))}</span>`)].filter(Boolean);
    document.title = `${a.n} (${sym}) · Investedia`;
    root.innerHTML = `<a class="ap-back" href="markets.html">← Markets</a>
      <header class="ap-h"><span class="ap-ic">${window.AssetIcons ? AssetIcons.icon(a) : ''}</span><div><h1>${esc(a.n)}</h1><small>${esc(sym)} · ${({ stocks: a.g === 'Index' ? 'Index' : 'Stock', crypto: 'Crypto', cmd: 'Commodity', fx: 'Currency pair' })[a.t] || ''}${a.t === 'stocks' && a.g !== 'Index' ? '<span class="ap-co-slot"></span>' : ''}</small></div><span class="ap-st ${live ? 'live' : ''}"><i></i>${live ? 'Live' : 'Delayed'}</span></header>
      <div class="ap-px"><span class="ap-p mono" data-k="p">${money(price)}</span><span class="ap-chip ${cls(m)}" data-k="c">${arrow(m)} ${fmt(m)}</span></div>
      <div class="ap-seg">${[['d', 'Today'], ['w', 'Week'], ['m', 'Month']].map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${k === S.win}">${l}</button>`).join('')}</div>
      <div class="ap-ch"><div class="ap-cv mk-${MK}">${chart(a, series(a, S.win), col(m), rel)}<div class="ap-tip" hidden></div></div></div>
      <div class="ap-fig">${figs.join('')}</div>
      <div class="ap-act">${tvSym(a) ? (EMB ? `<a class="ap-btn p" href="asset.html?s=${encodeURIComponent(a.s)}&chart=1#ap-chart" target="_top">Full chart <span aria-hidden="true">↗</span></a>` : '<button type="button" class="ap-btn p" id="ap-full">Full chart</button>') : ''}<button type="button" class="ap-btn" id="ap-watch" aria-pressed="false"><svg class="ap-star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg><span>Watch</span></button>${EMB ? '' : `<button type="button" class="ap-btn" data-alert-kind="asset" data-alert-ref="${esc(a.s)}" data-alert-label="${esc(a.n)}"></button>`}${HQ[a.s] ? `<a class="ap-btn" href="assets/globe/news.html?hq=${encodeURIComponent(a.s)}" target="_top">Headquarters · ${esc(HQ[a.s].hq_city)} ↗</a>` : ''}</div>
      <section class="ap-card ${level ? level[1] : ''}"><div class="ap-ch2 ap-ma-h"><i class="ap-ma-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg></i><h3>Move Analysis</h3>${level ? `<span class="ap-lv"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${level[1] === 'ok' ? '<path d="m5 12.5 4.5 4.5L19 7.5"/>' : '<path d="M12 7v6M12 17h.01"/>'}</svg>${level[0]}</span>` : ''}</div>
        <p class="ap-tx">${esc(an ? an.text : (base || 'Not enough price history to measure volatility yet.')).replace(/\b(up|down) (\d+(?:\.\d+)?%)/, (_, w, v) => `${w} <span class="ap-hl ${w === 'up' ? 'up' : 'dn'}">${w === 'up' ? '+' : '−'}${v}</span>`).replace(/(volatility:? )(\d+(?:\.\d+)?%)/, '$1<b>$2</b>')}</p>
        ${an ? `<small class="ap-meta">${an.ai ? 'Written with AI from the price data and the linked articles' : 'Generated from the price data and the linked articles'} · updated ${new Date(S.anAsof).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</small>` : ''}
        <div class="ap-pro"><b>Live analysis is coming to Investedia Pro.</b> Real-time alerts the moment ${esc(a.n)} makes an unusual move, and deeper analysis of every catalyst. Free analysis refreshes about every 15 minutes.</div></section>
      <section class="ap-sec ap-rc"><div class="ap-rc-h"><i class="ap-rc-ic">${NEWS_IC}</i><h2>Related Coverage</h2>${rel.length ? `<a class="ap-rc-all" href="news.html?asset=${encodeURIComponent(a.s)}"${EMB ? ' target="_top"' : ''}>View all <span aria-hidden="true">→</span></a>` : ''}</div>${rel.length ? `<ol class="ap-rc-list">${rel.slice(0, EMB ? 3 : 20).map(({ s, i }, n) => { const tag = ({ earnings: 'Earnings', capital: 'Capital', 'macro-data': 'Macro', regulation: 'Policy', 'm&a': 'M&A', geopolitics: 'Geopolitics', rates: 'Rates', 'energy-supply': 'Energy', 'commodity-prices': 'Commodities', guidance: 'Guidance', labor: 'Labor', trade: 'Trade' })[s.event_type] || (s.category ? s.category[0].toUpperCase() + s.category.slice(1) : '');
        return `<li id="ap-a${rel.length - n}"><a href="${s.old ? esc(s.url) : 'story.html?id=' + encodeURIComponent(s.id)}"${s.old ? ' target="_blank" rel="noopener"' : EMB ? ' target="_top"' : ''}>${s.image?.file ? `<img src="assets/globe/${esc(s.image.file)}" alt="" loading="lazy">` : '<span class="ap-rc-noimg"></span>'}<span class="ap-rc-tx"><small>${new Date(s.published_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} · ${esc(s.source?.name || '')}</small><b>${esc(s.headline)}</b></span>${tag ? `<span class="ap-rc-tag">${esc(tag)}</span>` : ''}</a></li>`; }).join('')}</ol><a class="ap-more" href="news.html?asset=${encodeURIComponent(a.s)}"${EMB ? ' target="_top"' : ''}>See all articles on the News page →</a>` : '<p class="ap-none">No article in our feed names this asset right now. Coverage appears here as soon as it is published.</p>'}</section>
      <p class="mv-note">Prices are delayed by 15 to 30 minutes unless marked Live. Analysis describes the news around a move, not proof it caused it. Not investment advice.</p>`;
  }
  const paintWatch = () => { const b = document.getElementById('ap-watch'); if (!b || !window.INVWATCH) return; const on = INVWATCH.has({ kind: 'asset', src: 'site', s: S.a.s }); b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = on ? 'Watching' : 'Watch'; };
  // TradingView symbol for the free chart widget; null = no valid mapping, the button is hidden
  const TV = { '^GSPC': 'FOREXCOM:SPXUSD', '^IXIC': 'NASDAQ:IXIC', '^NDX': 'NASDAQ:NDX', '^DJI': 'TVC:DJI', '^RUT': 'TVC:RUT', '^VIX': 'TVC:VIX', '^FTSE': 'TVC:UKX', '^GDAXI': 'XETR:DAX', '^FCHI': 'TVC:CAC40', '^STOXX50E': 'TVC:SX5E', '^N225': 'TVC:NI225', '^HSI': 'TVC:HSI', 'GC=F': 'OANDA:XAUUSD', 'SI=F': 'OANDA:XAGUSD', 'PL=F': 'OANDA:XPTUSD', 'HG=F': 'COMEX:HG1!', 'CL=F': 'TVC:USOIL', 'BZ=F': 'TVC:UKOIL', 'NG=F': 'NYMEX:NG1!', 'ZW=F': 'CBOT:ZW1!', 'ZC=F': 'CBOT:ZC1!', 'ZS=F': 'CBOT:ZS1!', 'KC=F': 'ICEUS:KC1!', 'SB=F': 'ICEUS:SB1!', 'CC=F': 'ICEUS:CC1!', 'CT=F': 'ICEUS:CT1!' };
  const tvSym = a => TV[a.s] || (a.t === 'crypto' ? 'COINBASE:' + a.s.replace('-USD', '') + 'USD' : a.t === 'fx' ? 'FX:' + a.s : a.t === 'stocks' && /^[A-Z]{1,5}(-[A-Z])?$/.test(a.s) && a.cc === 'us' ? a.s.replace('-', '.') : null);
  function fullChart() {
    const box = root.querySelector('.ap-ch'); if (!box || box.dataset.tv) return; box.dataset.tv = '1'; box.style.height = 'auto';
    box.innerHTML = '<p class="ap-tvn">The full chart is provided by TradingView. Loading it connects your browser to TradingView, which receives your IP address and may set its own cookies. Nothing loads until you press the button.</p><button type="button" class="ap-btn p" id="ap-tvgo">Load TradingView chart</button>';
    box.querySelector('#ap-tvgo').onclick = () => { box.style.height = 'clamp(460px, 72vh, 760px)'; box.id = 'ap-chart'; box.scrollIntoView({ block: 'start', behavior: 'smooth' }); box.innerHTML = '<div class="tradingview-widget-container" style="height:100%"><div class="tradingview-widget-container__widget" style="height:calc(100% - 22px)"></div><div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" target="_blank" rel="noopener">Chart by TradingView</a> · data may be delayed</div></div>'; const sc = document.createElement('script'); sc.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; sc.async = true; sc.text = JSON.stringify({ autosize: true, symbol: tvSym(S.a), interval: 'D', theme: 'dark', style: '1', locale: 'en', backgroundColor: '#0e0e10', hide_side_toolbar: true, allow_symbol_change: false, withdateranges: true, details: false, calendar: false }); box.querySelector('.tradingview-widget-container').append(sc); };
  }
  const poll = () => { if (!window.INV_LIVE_URL || S.a.t !== 'crypto') return; const t = async () => { if (!window.InvConsent?.allows('live')) return; try { const j = await (await fetch(INV_LIVE_URL, { cache: 'no-store' })).json(), v = j.p?.[S.a.s]; if (v) { const first = !S.live; S.live = { p: v.p, o: v.o || v.p / (1 + (v.pc || 0) / 100), h: v.h, l: v.l, v: v.v }; if (first) render(); else { const p = root.querySelector('[data-k=p]'), c = root.querySelector('[data-k=c]'); if (p) { p.textContent = money(v.p); p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); } const m = S.win === 'd' ? pc(S.live.p, S.live.o) : null; if (c && m != null) { c.className = 'ap-chip ' + cls(m); c.textContent = `${arrow(m)} ${fmt(m)}`; } } } } catch {} }; t(); setInterval(() => { if (!document.hidden) t(); }, 3000); };
  const s = qs.get('s') || qs.get('asset') || '';
  Promise.all([AssetIcons.ready, fetch('assets/globe/company-hq.json').then(r => r.ok ? r.json() : null).catch(() => null), fetch('assets/globe/markets.json').then(r => r.json()), fetch('assets/globe/news-prices.json').then(r => r.json()).catch(() => ({ assets: {} })), fetch('assets/intraday.json').then(r => r.json()).catch(() => ({ s: {} })), fetch('assets/globe/news-archive.json').then(r => r.ok ? r.json() : null).catch(() => null), fetch('assets/globe/analysis.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null), fetch('assets/globe/asset-news.json').then(r => r.ok ? r.json() : null).catch(() => null)])
    .then(async ([, hqd, m, np, i, arc, an, an2]) => {
      HQ = (hqd && hqd.companies) || {};
      const by = Object.fromEntries((m.assets || []).map(a => [a.s, a])); Object.assign(by, np.assets || {});
      const a = s && find(by, s); if (!a) { root.innerHTML = `<a class="ap-back" href="markets.html">← Markets</a><div class="nb-none">We couldn’t find “${esc(s)}”. Try the search in the News menu.</div>`; return; }
      try { S.hist = await (await fetch('assets/hist/' + encodeURIComponent(a.s.replace(/-USD$|=F$|^\^/g, '')) + '.json')).json(); } catch { S.hist = null; }
      S.a = a; S.an2 = an2; S.intra = i.s || {}; S.an = an?.items || {}; S.anAsof = an?.asof; S.rel = related(a, (arc && arc.stories) || []); render(); poll(); if (qs.get('chart') === '1' && !EMB) setTimeout(() => { fullChart(); root.querySelector('.ap-ch')?.scrollIntoView({ block: 'start' }); }, 50);
      root.addEventListener('click', e => { const b = e.target.closest('.ap-seg button'); if (b) { S.win = b.dataset.k; render(); return; }
        if (e.target.closest('#ap-watch') && window.INVWATCH) { INVWATCH.toggle({ kind: 'asset', src: 'site', s: S.a.s }); paintWatch(); return; }
        if (e.target.closest('#ap-full')) { fullChart(); return; }
        const pin = e.target.closest('.ap-pin'); const tip = root.querySelector('.ap-tip');
        if (e.target.closest('.ap-tip[data-id]')) { openArt(root.querySelector('.ap-tip').dataset.id); return; }
        if (pin && tip) { const it = S.rel.find((x, n) => S.rel.length - n === +pin.dataset.n); if (!it) return; if (matchMedia('(hover: hover)').matches || (!tip.hidden && tip.dataset.n === pin.dataset.n)) { openArt(it.s.id); return; }
          showTip(pin); return; }
        if (tip && !e.target.closest('.ap-tip')) tip.hidden = true; });
      const showTip = pin => { const tip = root.querySelector('.ap-tip'), it = S.rel.find((x, n) => S.rel.length - n === +pin.dataset.n); if (!tip || !it) return;
        const s = it.s, img = s.image?.file ? `<img src="assets/globe/${esc(s.image.file)}" alt="" loading="lazy">` : '';
        tip.dataset.n = pin.dataset.n; tip.dataset.id = s.id;
        tip.innerHTML = `${img}<div><span class="nf-eb">${esc(s.source?.name || '')} · ${new Date(s.published_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span><b>${esc(s.headline)}</b></div><span class="ap-tip-go" aria-hidden="true">↗</span>`; tip.hidden = false;
        const box = root.querySelector('.ap-cv').getBoundingClientRect(), pb = pin.getBoundingClientRect(), w = Math.min(330, box.width - 8);
        tip.style.width = w + 'px'; tip.style.left = Math.max(4, Math.min(box.width - w - 4, pb.left - box.left + pb.width / 2 - w / 2)) + 'px';
        const above = pb.top - box.top > 96; tip.classList.toggle('below', !above); tip.style.top = (above ? pb.top - box.top - 84 : pb.bottom - box.top + 10) + 'px'; };
      const openArt = id => { const o = S.rel.find(x => x.s.id === id)?.s; if (o?.old && o.url) { window.open(o.url, '_blank', 'noopener'); return; } const u = 'story.html?id=' + encodeURIComponent(id); if (EMB) { try { top.location.href = u; return; } catch {} } location.href = u; };
      root.addEventListener('mouseover', e => { const pin = e.target.closest('.ap-pin'); if (pin && matchMedia('(hover: hover)').matches) showTip(pin); });
      root.addEventListener('mouseout', e => { const pin = e.target.closest('.ap-pin'); if (pin && matchMedia('(hover: hover)').matches && !e.relatedTarget?.closest?.('.ap-tip,.ap-pin')) root.querySelector('.ap-tip').hidden = true; });
      // in the pop-up sheet, Escape closes the sheet in one press (the key goes to this frame, not the page behind)
      if (EMB) addEventListener('keydown', e => { if (e.key === 'Escape') { try { parent.postMessage({ inv: 'peek-close' }, location.origin); } catch {} } });
      // "View in Companies": shown once the company directory page is published (it lives on its own page)
      const coLink = () => { const slot = root.querySelector('.ap-co-slot'); if (!slot) return; (window.__invCo ??= fetch('data/companies.json').then(r => r.ok ? r.json() : null).catch(() => null)).then(d => { const c = d?.companies?.find(c => (c.listings || []).some(l => l.s === S.a.s)); if (c && slot.isConnected) slot.innerHTML = `<a class="ap-co" href="companies/${encodeURIComponent(c.slug)}.html" ${EMB ? 'target="_top"' : ''}><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6"/></svg>Company profile</a>`; }); };
      coLink(); new MutationObserver(coLink).observe(root, { childList: true });
      paintWatch();
    }).catch(e => { console.error('asset', e); root.innerHTML = '<div class="nb-none">Asset data could not load. Please refresh.</div>'; });
})();
