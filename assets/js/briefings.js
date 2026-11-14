// Country briefings: briefing.html?c=br (one country, last complete week) and briefings.html (all countries).
// Data: assets/globe/briefs/*.json, written on every build by tools/country_briefs.py (real articles, World Bank, ECB).
(function () {
  const B = 'assets/globe/briefs/', $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n).toLocaleString('en-US'), cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
  const FKEY = 'inv-follow-items', followed = () => { try { return JSON.parse(localStorage.getItem(FKEY)) || []; } catch { return []; } };
  const toggle = n => { const f = followed(), i = f.indexOf(n); i < 0 ? f.push(n) : f.splice(i, 1); try { localStorage.setItem(FKEY, JSON.stringify(f)); } catch {} };
  const nm = n => ({ 'United States of America': 'United States' }[n] || n);
  const range = (a, b) => { const o = { day: 'numeric', month: 'short' }; return new Date(a + 'T12:00Z').toLocaleDateString('en-GB', o) + ' – ' + new Date(b + 'T12:00Z').toLocaleDateString('en-GB', { ...o, year: 'numeric' }); };
  const wk = a => { const d = new Date(a + 'T12:00Z'), t = new Date(d); t.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t - y) / 864e5 - 3 + (y.getUTCDay() + 6) % 7) / 7); };
  const get = f => fetch(B + f, { cache: 'no-cache' }).then(r => { if (!r.ok) throw Error(f); return r.json(); });
  const PRO = 'projects.html#waitlist', pro = l => `<a class="br-btn" href="${PRO}" title="Pro · join the waitlist">${l}<span class="br-pro">PRO</span></a>`;
  function spark(pts) {
    const v = pts.map(p => p[1]), lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
    return `<svg class="br-spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${v.map((x, i) => (i * 100 / (v.length - 1)).toFixed(2) + ',' + (93 - (x - lo) / r * 86).toFixed(2)).join(' ')}"/></svg>`;
  }
  function page(root, d) {
    const name = nm(d.country), w = wk(d.from), f = d.fx, e = d.eco, mx = d.cats[0] ? d.cats[0][1] : 1;
    document.title = `${name} weekly briefing · week ${w} · Investedia`;
    const fxCard = f ? (() => { const last = f.pts[f.pts.length - 1][1], ch = f.week, weak = f.inverse ? ch < 0 : ch > 0;
      return `<div class="br-card"><h3>${f.inverse ? 'Euro' : esc(f.cur)} vs US dollar <span>ECB reference · ${f.pts.length} days</span></h3><div class="br-big">${last.toFixed(last < 10 ? 3 : 2)} ${ch != null ? `<span class="${weak ? 'br-dn' : 'br-up'}">${ch > 0 ? '+' : ''}${ch.toFixed(1)}% in week ${w}</span>` : ''}</div>${spark(f.pts)}<div class="br-mu">${f.inverse ? 'US dollars per 1 euro; a rise means a stronger euro.' : `${esc(f.cur)} per 1 US dollar; a rise means a weaker ${esc(f.cur)}.`}</div></div>`; })() : '';
    const kv = (l, x, s) => x && Number.isFinite(x[1]) ? `<div class="br-kv"><span>${l}</span><b>${s(x[1])}</b></div>` : '';
    const yr = e && (e.growth || e.infl || [])[0];
    const ecoCard = e ? `<div class="br-card"><h3>Economy <span>World Bank${yr ? ' · ' + yr : ''}</span></h3>${kv('GDP growth', e.growth, v => v.toFixed(1) + '%')}${kv('Inflation', e.infl, v => v.toFixed(1) + '%')}${kv('Unemployment', e.unemp, v => v.toFixed(1) + '%')}${kv('GDP per person', e.gdppc, v => '$' + fmt(Math.round(v)))}</div>` : '';
    const on = () => followed().includes(d.country);
    root.innerHTML = `<div class="br-eb">Weekly country briefing · week ${w} · ${range(d.from, d.to)}</div>
      <h1><img src="assets/globe/flags/${esc(d.cc)}.svg" alt="">${esc(name)}</h1>
      <div class="br-mu">Updated every Monday · from ${fmt(d.n)} Investedia articles and official data</div>
      <div class="br-act"><button type="button" class="br-btn pri" id="br-f"></button>${pro('Email me every week')}${pro('Download PDF')}${pro('Past weeks')}${pro('Compare economies')}</div>
      <div class="br-stats"><div><b>${fmt(d.n)}</b><span class="br-mu">articles this week</span></div><div><b>${fmt(d.mm)}</b><span class="br-mu">market-moving</span></div><div><b>${fmt(d.sources)}</b><span class="br-mu">news sources</span></div></div>
      <div class="br-g"><div>
        <div class="br-card"><h3>The week in ${d.lines.length} lines</h3><ul class="br-lines">${d.lines.map(l => `<li><a href="story.html?id=${encodeURIComponent(l.id)}">${esc(l.x)}</a></li>`).join('')}</ul><div class="br-mu">From the summaries of this week's top articles; tap a line to read its article.</div></div>
        <div class="br-card"><h3>Top articles <span>by importance</span></h3>${d.top.slice(0, 6).map(t => `<a class="br-ar" href="story.html?id=${encodeURIComponent(t.id)}"><i${t.i ? ` style="background-image:url('assets/globe/${esc(t.i)}')"` : ''}></i><div><div class="br-ct">${esc(t.c)} · ${new Date(t.t).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}${t.mm ? ' · market-moving' : ''}</div><b>${esc(t.h)}</b><div class="br-mu">${esc(t.s || '')}</div></div></a>`).join('')}</div>
      </div><div>${fxCard}${ecoCard}
        <div class="br-card"><h3>What the news was about</h3>${d.cats.map(([c, n]) => `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between"><span>${esc(cap(c))}</span><span class="br-mu">${fmt(n)}</span></div><div class="br-bar"><i style="width:${(n / mx * 100).toFixed(0)}%"></i></div></div>`).join('')}</div>
      </div></div>
      <p class="br-note">Sources: Investedia articles (each links to its publisher)${f ? ', ECB euro reference rates' : ''}${e ? ', World Bank WDI' : ''}. <a href="briefings.html">All country briefings</a>. Not investment advice.</p>`;
    const b = $('br-f'), paint = () => { b.textContent = on() ? '★ Following' : '☆ Follow ' + name; };
    paint(); b.onclick = () => { toggle(d.country); paint(); };
  }
  function list(root, ix) {
    const f = followed(), cs = [...ix.countries].sort((a, b) => f.includes(b.country) - f.includes(a.country));
    root.innerHTML = `<div class="br-eb">Weekly country briefings · week ${wk(ix.from)} · ${range(ix.from, ix.to)}</div><h1>Briefings</h1>
      <div class="br-mu">One page per country, every Monday, for every country with 10+ articles that week. Countries you follow come first.</div>
      <div class="br-grid">${cs.map(c => `<a class="br-card br-cc" href="briefing.html?c=${esc(c.cc)}"><img src="assets/globe/flags/${esc(c.cc)}.svg" alt=""><b>${esc(nm(c.country))}</b><span class="br-mu">${fmt(c.n)} articles · ${fmt(c.mm)} market-moving</span>${f.includes(c.country) ? '<div class="br-ct" style="margin-top:6px">Following</div>' : ''}</a>`).join('')}</div>
      <p class="br-note">Built from Investedia articles, ECB rates and World Bank data. Not investment advice.</p>`;
  }
  function init() {
    const root = $('br-root'); if (!root) return;
    const c = (new URLSearchParams(location.search).get('c') || '').toLowerCase();
    if (root.dataset.view === 'list' || !/^[a-z]{2}$/.test(c)) get('index.json').then(ix => list(root, ix)).catch(() => { root.textContent = 'Briefings could not load.'; });
    else get(c + '.json').then(d => page(root, d)).catch(() => { root.innerHTML = 'No briefing for this country this week (it needs 10+ articles). <a href="briefings.html">All briefings</a>'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
