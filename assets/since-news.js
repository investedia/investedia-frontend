/* "Since the news": how an asset moved after an article appeared (option B: grey before the article, red or green after).
   Data: assets/globe/news-track.json, written by update_news_track.py ({"s":{"SYMBOL":[[epoch_minute, price], ...]}}).
   Never draws an invented curve: with no recorded price after the article it says so and shows today's move instead. */
(function () {
  const MIN = 60000, HR = 3600000, BEFORE = 3 * HR, LATE = 90 * MIN, FLAT = 0.3;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hhmm = ms => { const d = new Date(ms); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
  const arrow = v => v > 0 ? '↑' : v < 0 ? '↓' : '↔';
  const cls = v => v > 0 ? 'up' : v < 0 ? 'dn' : 'flat';
  const pct = v => Math.abs(v).toFixed(v !== 0 && Math.abs(v) < 0.1 ? 2 : 2) + '%';
  function span(ms) {
    const m = Math.max(1, Math.round(ms / MIN));
    if (m < 90) return m + (m === 1 ? ' minute' : ' minutes');
    const h = Math.round(m / 60); return h + (h === 1 ? ' hour' : ' hours');
  }
  // Pure calculation, tested on its own.
  function compute(publishedMs, series, nowMs) {
    const pts = (Array.isArray(series) ? series : []).filter(p => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[1] > 0).map(p => [p[0] * MIN, p[1]]).sort((a, b) => a[0] - b[0]);
    const after = pts.filter(p => p[0] >= publishedMs);
    if (!after.length) return { state: 'none' };
    const base = after[0], lateMs = base[0] - publishedMs;
    const before = pts.filter(p => p[0] < publishedMs && p[0] >= publishedMs - BEFORE);
    if (lateMs > LATE && !before.length) return { state: 'none' };
    const cur = after[after.length - 1];
    if (cur[0] === base[0]) return { state: 'first', at: base[0] };
    const rel = p => (p / base[1] - 1) * 100;
    const out = { state: 'ok', base, cur, lateMs, move: rel(cur[1]), after: after.map(p => [p[0], rel(p[1])]), before: before.length >= 2 ? before.map(p => [p[0], rel(p[1])]) : [], now: Math.max(nowMs, cur[0]) };
    out.beforeMove = out.before.length ? (before[before.length - 1][1] / before[0][1] - 1) * 100 : null;
    out.beforeSpan = out.before.length ? before[before.length - 1][0] - before[0][0] : 0;
    return out;
  }
  let chartN = 0;
  function chart(c, published) {
    const W = 560, H = 130, P = 8, t0 = c.before.length ? c.before[0][0] : published, t1 = c.after[c.after.length - 1][0];
    const all = [...c.before, ...c.after, [0, 0]].map(p => p[1]), lo = Math.min(...all), hi = Math.max(...all), r = hi - lo || 1;
    const X = t => P + (t - t0) / ((t1 - t0) || 1) * (W - 2 * P), Y = v => P + (hi - v) / r * (H - 2 * P);
    const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    const gid = 'snf' + (++chartN), col = c.move < 0 ? '#f87171' : c.move > 0 ? '#34d399' : '#a1a1aa', mx = X(Math.max(published, t0)), last = c.after[c.after.length - 1];
    const lxn = mx / W * 100, lx = lxn.toFixed(1), pos = lxn < 24 ? 'left:0;transform:none' : lxn > 76 ? 'left:auto;right:0;transform:none' : `left:${lx}%`, lab = `<span class="sn-mark" style="${pos}">Article posted here · ${hhmm(published)}</span>`;
    const gap = X(c.after[0][0]) - mx > .5 ? `<path d="M${mx.toFixed(1)} ${Y(0).toFixed(1)}L${X(c.after[0][0]).toFixed(1)} ${Y(0).toFixed(1)}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>` : '';
    return `<div class="sn-chart" data-mark="${window.SinceNewsMark || 'pill'}">${lab}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Price chart from ${c.before.length ? span(c.beforeSpan) + ' before the article' : 'the article'} to now: ${c.move < 0 ? 'down' : c.move > 0 ? 'up' : 'unchanged'} ${pct(c.move)} since the article"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><path d="${path(c.after)}L${X(last[0]).toFixed(1)} ${H}L${X(c.after[0][0]).toFixed(1)} ${H}Z" fill="url(#${gid})"/>${gap}${c.before.length ? `<path d="${path([...c.before, [Math.max(published, t0), 0]])}" fill="none" stroke="#8b8b94" stroke-width="2.2" stroke-linejoin="round"/>` : ''}<path d="${path(c.after)}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linejoin="round"/><line x1="${mx.toFixed(1)}" x2="${mx.toFixed(1)}" y1="0" y2="${H}" stroke="#ff7a1a" stroke-dasharray="3 3"/><circle cx="${mx.toFixed(1)}" cy="${Y(0).toFixed(1)}" r="5" fill="#ff7a1a"/><circle cx="${X(last[0]).toFixed(1)}" cy="${Y(last[1]).toFixed(1)}" r="5" fill="${col}"/></svg></div>`;
  }
  function verdict(direction, move) {
    if (direction !== 'up' && direction !== 'down') return '';
    if (Math.abs(move) < FLAT) return `<span class="sn-v na">the article said ${direction} · it barely moved</span>`;
    const went = move > 0 ? 'up' : 'down';
    return went === direction ? `<span class="sn-v ok">✓ the article said ${direction} · it went ${went}</span>` : `<span class="sn-v no">✗ the article said ${direction} · it went ${went}</span>`;
  }
  // card({story, impact, asset, series, now}) -> HTML string
  function card(o) {
    const s = o.story, a = o.asset, name = esc(a.n || o.impact?.name || ''), published = s.t || Date.parse(s.published_at), now = o.now || Date.now();
    const c = compute(published, o.series, now);
    const head = `<div class="sn-eb">${name} · since the article</div>`;
    if (c.state === 'none' || c.state === 'first') {
      const msg = c.state === 'first' ? `Tracking started at ${hhmm(c.at)} UTC. The chart appears after the next price update (about 15 minutes).` : `We started recording this article's price after it was published, so the since-the-news chart is not available.${Number.isFinite(a.d) ? ' Showing today\'s move instead.' : ''}`;
      return `<section class="sn" aria-label="Since the article: ${name}">${head}${Number.isFinite(a.d) ? `<div class="sn-row"><div class="sn-big ${cls(a.d)}">${arrow(a.d)} ${pct(a.d)}</div><div class="sn-ba"><span>today</span></div></div>` : ''}<p class="sn-na">${esc(msg)}</p></section>`;
    }
    const ba = (c.before.length ? `<span>Before:</span> <b class="${cls(c.beforeMove)}">${arrow(c.beforeMove)} ${pct(c.beforeMove)}</b> · ${span(c.beforeSpan)}<br>` : '') + `<span>After:</span> <b class="${cls(c.move)}">${arrow(c.move)} ${pct(c.move)}</b> · ${span(c.now - published)}`;
    const lateNote = c.lateMs > 15 * MIN ? ` The first price was recorded ${span(c.lateMs)} after the article, so the change is measured from ${hhmm(c.base[0])} UTC.` : '';
    return `<section class="sn" aria-label="Since the article: ${name}">${head}<div class="sn-row"><div class="sn-big ${cls(c.move)}">${arrow(c.move)} ${pct(c.move)}</div><div class="sn-ba">${ba}</div></div>${chart(c, published)}<div class="sn-axis"><span>${c.before.length ? span(c.beforeSpan) + ' before' : ''}</span><span>now</span></div>${verdict(o.impact?.direction, c.move)}<p class="sn-note">Since ${hhmm(c.base[0])} UTC${c.lateMs > 15 * MIN ? ` (first price ${span(c.lateMs)} after the article)` : ''}. Stocks delayed 15–30 min. Not investment advice.</p></section>`;
  }
  async function load(url) { try { const r = await fetch(url, { cache: 'no-cache' }); return r.ok ? await r.json() : null; } catch { return null; } }
  window.SinceNews = { compute, card, load, _span: span };
})();
