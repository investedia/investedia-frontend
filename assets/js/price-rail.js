// Price reaction block for an article: chart with numbered pins + article rail with the gain or loss around each article.
// Used by the article page. Needs home-news.js (esc, ago, BF) and asset-icons.js (AssetIcons).
(() => {
  const DAY = 864e5, WIN = [['d', '24h', 1], ['w', 'Week', 7], ['m', 'Month', 30]];
  const pc = (a, b) => b ? (a / b - 1) * 100 : 0;
  const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(Math.abs(v) >= 10 ? 1 : 2) + '%';
  const cls = v => v > 0.005 ? 'u' : v < -0.005 ? 'd' : 'o';
  const col = v => v > 0.005 ? '#34d399' : v < -0.005 ? '#f87171' : '#8b8b94';
  const S = { by: {}, intra: {}, stories: [] };
  const find = t => t && (S.by[t] || S.by[t.replace(/-USD$/, '')] || S.by[t.replace(/=X$/, '')]) || null;
  const move = (a, k) => k === 'd' ? a.d : k === 'w' ? a.w : (a.sp && a.sp.length > 1 ? pc(a.sp[a.sp.length - 1], a.sp[0]) : 0);
  const series = (a, k) => k === 'd' ? (S.intra[a.s]?.d1?.c || (a.sp || []).slice(-2)) : k === 'w' ? (a.sp || []).slice(-6) : (a.sp || []);
  const line = (v, c) => { if (v.length < 2) return ''; const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1; return `<svg viewBox="0 0 300 120" preserveAspectRatio="none"><path d="${v.map((y, i) => (i ? 'L' : 'M') + (i / (v.length - 1) * 300).toFixed(1) + ' ' + (117 - (y - lo) / r * 114).toFixed(1)).join('')}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`; };
  const dates = (a, n) => { const out = []; let d = new Date(); d.setUTCHours(12, 0, 0, 0); const wk = x => x.getUTCDay() % 6 === 0; if (a.t !== 'crypto') while (wk(d)) d = new Date(d - DAY); while (out.length < n) { out.unshift(d.toISOString().slice(0, 10)); d = new Date(d - DAY); if (a.t !== 'crypto') while (wk(d)) d = new Date(d - DAY); } return out; };
  function steps(a, k) {
    const days = WIN.find(w => w[0] === k)[2], v = series(a, k), intra = k === 'd' && S.intra[a.s]?.d1, ds = intra ? null : dates(a, (a.sp || []).length).slice(-v.length);
    return S.stories.filter(st => Date.now() - Date.parse(st.published_at) <= days * DAY && (st.impacts || []).some(i => find(i.ticker) === a)).sort((x, y) => Date.parse(x.published_at) - Date.parse(y.published_at)).map((st, n) => {
      const t = Date.parse(st.published_at); let x, m, unit;
      if (intra) { const [t0, t1] = intra.t.map(z => z * 1000); x = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))); m = pc(v[v.length - 1], v[Math.round(x * (v.length - 1))]); unit = 'since'; }
      else { const d = new Date(t).toISOString().slice(0, 10); let j = ds.findIndex(z => z >= d); if (j < 0) j = v.length - 1; if (j < 1) j = 1; x = j / (v.length - 1); m = pc(v[j], v[j - 1]); unit = 'that day'; }
      return { st, x, m, unit, n: n + 1, i: st.impacts.find(i => find(i.ticker) === a) };
    });
  }
  function body(a, k, cur) {
    const m = move(a, k), v = series(a, k), st = steps(a, k), lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, mx = Math.max(0.01, ...st.map(z => Math.abs(z.m)));
    const pins = st.map(z => `<span class="pr-pin ${cls(z.m)}${z.st.id === cur ? ' me' : ''}" style="left:${(z.x * 100).toFixed(1)}%;top:${((1 - (v[Math.round(z.x * (v.length - 1))] - lo) / r) * 88 + 6).toFixed(1)}%">${z.n}</span>`).join('');
    return `<div class="pr-tot"><span class="m ${cls(m)}">${fmt(m)}</span><div class="pr-seg">${WIN.map(([kk, l]) => `<button type="button" data-k="${kk}" aria-pressed="${kk === k}">${l}</button>`).join('')}</div></div>
      <div class="pr-ch">${line(v, col(m))}${pins}</div>
      <ol class="pr-rail">${st.length ? st.map(z => `<li class="${cls(z.m)}${z.st.id === cur ? ' me' : ''}"><span class="pr-dot">${z.n}</span><div><span class="pr-eb">${new Date(z.st.published_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}${z.st.id === cur ? ' · this article' : ''}</span>${z.st.id === cur ? `<b>${esc(z.st.headline)}</b>` : `<a href="story.html?id=${encodeURIComponent(z.st.id)}"><b>${esc(z.st.headline)}</b></a>`}<div class="pr-bar"><i style="width:${Math.max(4, Math.abs(z.m) / mx * 100).toFixed(0)}%"></i><span class="m ${cls(z.m)}">${fmt(z.m)}<small> ${z.unit}</small></span></div></div></li>`).join('') : '<li class="pr-none">No article in our feed names this asset in this window.</li>'}</ol>`;
  }
  async function mount(el, story) {
    if (!el) return;
    const [m, np, i, arc] = await Promise.all([fetch('assets/globe/markets.json').then(r => r.json()).catch(() => ({ assets: [] })), fetch('assets/globe/news-prices.json').then(r => r.json()).catch(() => ({ assets: {} })), fetch('assets/intraday.json').then(r => r.json()).catch(() => ({ s: {} })), fetch('assets/globe/news-archive.json').then(r => r.ok ? r.json() : null).catch(() => null)]);
    S.by = Object.fromEntries((m.assets || []).map(a => [a.s, a])); Object.assign(S.by, np.assets || {}); S.intra = i.s || {}; S.stories = (arc && arc.stories) || [story];
    if (!S.stories.some(s => s.id === story.id)) S.stories.push(story);
    const seen = new Set(), list = []; for (const x of story.impacts || []) { const a = find(x.ticker); if (a && !seen.has(a.s)) { seen.add(a.s); list.push({ a, x }); } }
    if (!list.length) { el.hidden = true; return; }
    let cur = 0, k = 'w';
    const paint = () => { const { a } = list[cur]; el.innerHTML = `<h2>Price reaction</h2><p>What the price did around this article, step by step.</p><div class="pr">${list.length > 1 ? `<div class="pr-tabs">${list.map((z, n) => `<button type="button" data-n="${n}" aria-pressed="${n === cur}"><span class="pr-ic">${AssetIcons.icon(z.a)}</span>${esc(z.a.n)}</button>`).join('')}</div>` : `<div class="pr-hd"><span class="pr-ic">${AssetIcons.icon(a)}</span><b>${esc(a.n)}</b></div>`}${body(a, k, story.id)}<p class="pr-note">Moves show the price change on the day of each article (or since it, for 24h). They show the news around a move, not proof it caused it. Not investment advice.</p></div>`; };
    el.addEventListener('click', e => { const t = e.target.closest('.pr-tabs button'); if (t) { cur = +t.dataset.n; paint(); } const w = e.target.closest('.pr-seg button'); if (w) { k = w.dataset.k; paint(); } });
    if (window.AssetIcons) await AssetIcons.ready; el.hidden = false; paint();
  }
  window.PriceRail = { mount };
})();
