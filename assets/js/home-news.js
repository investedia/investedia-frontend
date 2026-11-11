// News-first homepage: live news (assets/globe/news-live.json) rendered as cards, rows and "why it moved" explainers.
const BF = '1idNJqyfpKbma454ae4';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAME = { 'United States of America': 'United States', 'Dem. Rep. Congo': 'DR Congo', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Dominican Rep.': 'Dominican Republic' };
const nm = c => NAME[c] || c;
const CAT = { markets: 'Markets', companies: 'Companies', economy: 'Economy', technology: 'Technology', crypto: 'Crypto', commodities: 'Commodities', geopolitics: 'Geopolitics' };
const FLAG = { breaking: 'Breaking', trending: 'Trending', moving: 'Market moving' };
let ISO = {}, ENTITY_LOGOS = {}, TRACK = null, LEDGER = null;
function ago(t) { const m = Math.round((Date.parse(t)-Date.now())/60000), r = new Intl.RelativeTimeFormat(undefined,{numeric:'auto'}); return Math.abs(m)<60 ? r.format(m,'minute') : Math.abs(m)<1440 ? r.format(Math.round(m/60),'hour') : r.format(Math.round(m/1440),'day'); }
const flagSrc = c => ISO[c] ? `assets/globe/flags/${ISO[c].toLowerCase()}.svg` : '';
const company = e => e.ticker && !/[\^=]/.test(e.ticker) && !/-USD$/.test(e.ticker);
const localLogo = e => ENTITY_LOGOS[e.sym] || ENTITY_LOGOS[e.ticker] || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#f4f4f5"/><text x="32" y="39" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#18181b">' + esc((e.name || e.ticker || 'I').slice(0,2).toUpperCase()) + '</text></svg>');
const logoSrc = e => !window.InvConsent?.allows('images') ? localLogo(e) : company(e) ? `https://cdn.brandfetch.io/ticker/${encodeURIComponent(e.ticker)}/w/256/h/256/fallback/404?c=${BF}` : '';
const url = s => `assets/globe/news.html?story=${encodeURIComponent(s.id)}`;
const tags = s => `${s.flag ? `<span class="hn-tag">${FLAG[s.flag]}</span>` : ''}<span class="hn-eyebrow">${esc(CAT[s.category] || '')} · ${esc(s.location.place.split(',')[0])}</span>`;
const hideBad = `onerror="this.remove()"`;
function entityImage(e, country) {
  const asset = /[\^=]/.test(e.ticker || '') || ['index', 'currency', 'future'].includes(e.type);
  if (asset) { const f = flagSrc(country); return f ? `<img src="${f}" alt="" ${hideBad}>` : ''; }
  const local = ENTITY_LOGOS[e.sym] || ENTITY_LOGOS[e.ticker];
  const remote = !window.InvConsent?.allows('images') ? '' : company(e) ? logoSrc(e) : /-USD$/.test(e.ticker || '') ? `https://cdn.brandfetch.io/crypto/${encodeURIComponent(e.ticker.split('-')[0])}/w/256/h/256/fallback/404?c=${BF}` : '';
  const src = local?.endsWith('.svg') ? local : remote || local;
  if (!src) return '';
  const fb = remote && local && src !== local ? ` data-fb="${esc(local)}"` : '';
  return `<img src="${esc(src)}" alt=""${fb} onerror="if(this.dataset.fb){this.src=this.dataset.fb;delete this.dataset.fb}else{this.remove()}" loading="lazy">`;
}


function img(s) {
  const e = (s.entities || []).find(company), f = flagSrc(s.location.country);
  if (s.image) return `<div class="hn-img"><img class="hn-ph" src="assets/globe/${esc(s.image.file)}" alt="${esc(s.image.alt || '')}" loading="lazy"><span class="hn-il"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-9 9"/></svg>${s.image.kind === 'place' ? 'Photo' : 'Illustration'} · ${esc(s.image.source || '')}</span>${e ? `<img class="hn-lg" src="${logoSrc(e)}" alt="" ${hideBad}>` : ''}${f ? `<img class="hn-fl" src="${f}" alt="">` : ''}</div>`;
  if (e) return `<div class="hn-img"><img class="hn-big" src="${logoSrc(e)}" alt="${esc(e.name)}" style="background:rgba(255,255,255,.07);border-radius:16px;padding:10px" ${hideBad}>${f ? `<img class="hn-fl" src="${f}" alt="">` : ''}</div>`;
  return `<div class="hn-img">${f ? `<img class="hn-bigfl" src="${f}" alt="${esc(nm(s.location.country))}">` : ''}</div>`;
}
const card = (s, sum = true) => `<a class="hn-card" href="${url(s)}">${img(s)}<div>${tags(s)}</div><h3>${esc(s.headline)}</h3>${sum ? `<p>${esc(s.summary)}</p>` : ''}<span class="hn-meta">${ago(s.published_at)} · <b>${esc(s.source?.name || '')}</b>${s.sources?.length > 1 ? ` + ${s.sources.length - 1} more` : ''}</span></a>`;
function thumb(s) {
  const e = (s.entities || []).find(company), f = flagSrc(s.location.country);
  return s.image ? `<img src="assets/globe/${esc(s.image.file)}" alt="${esc(s.image.alt || 'Topic photograph')}"><span class="hn-thumb-label">Illustration</span>` : e ? `<img class="hn-lgo" src="${logoSrc(e)}" alt="" ${hideBad}>` : f ? `<img class="hn-flg" src="${f}" alt="">` : '';
}
const row = s => `<a class="hn-row hn-news-card" href="${url(s)}"><span class="hn-source">${esc((s.source?.name || 'N').slice(0,2).toUpperCase())}</span><span><h4>${esc(s.headline)}</h4>${impactChips(s)}<span class="hn-meta">${esc(s.source?.name || '')} · ${ago(s.published_at)}</span></span></a>`;
function impactChips(s) {
  const rows = (Array.isArray(s.impacts) ? s.impacts : []).filter(i => i && typeof i.name === 'string' && ['up', 'down', 'mixed', 'unclear'].includes(i.direction) && Object.values(ISO).includes(i.country)).slice(0, 2);
  const arrow = { up: '↑', down: '↓', mixed: '↔', unclear: '↔' };
  return rows.length ? `<div class="hn-ents hn-impacts" aria-label="AI-assisted analysis">${rows.map(i => `<span class="hn-ent"><img src="assets/globe/flags/${i.country.toLowerCase()}.svg" alt="" ${hideBad}><span class="hn-impact-${i.direction}">${arrow[i.direction]}</span>${esc(i.name)}</span>`).join('')}</div>` : '';
}
// "Why it moved": real price moves next to what the article implies. Numbers come from assets/globe/markets.json only.
let MARKETS = [];
const mkOf = i => i && MARKETS.find(a => a.s === i.ticker || a.site === i.ticker);
const primary = s => { for (const i of Array.isArray(s.impacts) ? s.impacts : []) { const a = mkOf(i); if (a && Number.isFinite(a.d)) return { a, i }; } return null; };
const pctPill = v => `<span class="hn-pct ${v > 0 ? 'up' : v < 0 ? 'down' : 'flat'}">${v > 0 ? '↑' : v < 0 ? '↓' : '↔'} ${Math.abs(v).toFixed(2)}%</span>`;
const IMPLIES = { up: '↑ up', down: '↓ down', mixed: '↔ mixed', unclear: 'unclear' };
const implies = i => `<span class="hn-impl">Article implies ${IMPLIES[i.direction] || 'unclear'}</span>`;
const sign = v => (v > 0 ? '+' : '') + v.toFixed(2) + '%';
function spark(a, mark, up) {
  const sp = a.sp || []; if (sp.length < 2) return '';
  const mn = Math.min(...sp), mx = Math.max(...sp), X = k => k / (sp.length - 1) * 420, Y = v => 92 - (v - mn) / ((mx - mn) || 1) * 84;
  const d = sp.map((v, k) => `${k ? 'L' : 'M'}${X(k).toFixed(1)} ${Y(v).toFixed(1)}`).join(''), c = up ? '#34d399' : '#f87171';
  return `<div class="hn-chart" aria-hidden="true"><svg viewBox="0 0 420 96" preserveAspectRatio="none"><path d="${d}L420 96L0 96Z" fill="${c}" opacity=".12"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><i class="hn-mark" style="left:${(X(mark) / 4.2).toFixed(1)}%"></i><b class="hn-dot" style="left:${(X(mark) / 4.2).toFixed(1)}%;top:${(Y(sp[mark]) / 96 * 100).toFixed(1)}%"></b></div>`;
}
const markIndex = (s, a, asof) => { const days = Math.max(0, (Date.parse(asof) - Date.parse(s.published_at)) / 864e5); return Math.max(0, Math.min(a.sp.length - 1, a.sp.length - 1 - Math.round(days * 5 / 7))); };
// Since-the-news card (chart option B) when we recorded prices after the article; otherwise the older today / 7-day view.
const sinceOf = (s, m) => { if (!m || !window.SinceNews || !TRACK || !TRACK.s) return ''; const series = TRACK.s[m.a.s], st = SinceNews.compute(Date.parse(s.published_at), series, Date.now()).state; return st === 'ok' ? SinceNews.card({ story: s, impact: m.i, asset: m.a, series, now: Date.now() }) : ''; };
const whyFeatured = (s, asof) => { const m = primary(s), t = s.why_moved || s.summary;
  const since = sinceOf(s, m), body = since || (m ? `<div class="hn-wrow"><div class="hn-wbig"><span class="hn-wl">${esc(m.a.n)} · today</span><strong class="${m.a.d > 0 ? 'up' : m.a.d < 0 ? 'down' : 'flat'}">${m.a.d > 0 ? '↑' : m.a.d < 0 ? '↓' : '↔'} ${Math.abs(m.a.d).toFixed(2)}%</strong><span class="hn-wl">7 days ${sign(m.a.w)}</span></div><div class="hn-wchart">${spark(m.a, markIndex(s, m.a, asof), m.a.w >= 0)}<div class="hn-wcap"><span>22 sessions ago</span><span class="hn-wmk">● article published</span><span>now</span></div></div></div>` : '');
  return `<a class="hn-wf" href="${url(s)}"><div class="hn-wtop">${tags(s)}${m ? implies(m.i) : ''}</div><h3>${esc(s.headline)}</h3><p>${esc(t)}</p>${body}${impactChips(s)}</a>`; };
const whySmall = s => { const m = primary(s); return `<a class="hn-wc" href="${url(s)}"><div class="hn-wtop">${tags(s)}</div><h4>${esc(s.headline)}</h4>${m ? `<div class="hn-wasset"><b>${esc(m.a.n)}</b>${pctPill(m.a.d)}${implies(m.i)}</div>` : ''}${impactChips(s)}</a>`; };
const whySection = (list, asof) => list.length ? whyFeatured(list[0], asof) + `<div class="hn-wside">${list.slice(1, 3).map(whySmall).join('')}</div>` : '';
function countries(list) {
  const c = {}; for (const s of list) c[s.location.country] = (c[s.location.country] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => `<a class="hn-cty" href="assets/globe/news.html?country=${encodeURIComponent(k)}">${flagSrc(k) ? `<img src="${flagSrc(k)}" alt="">` : ''}<span><b>${esc(nm(k))}</b><small>${n} ${n === 1 ? 'article' : 'articles'}</small></span></a>`).join('');
}
// rank: importance, then priority score (stored, never shown), then sources, then recency
const rank = (a, b) => (b.importance - a.importance) || ((b.score || 0) - (a.score || 0)) || ((b.sources?.length || 1) - (a.sources?.length || 1)) || (Date.parse(b.published_at) - Date.parse(a.published_at));
async function loadNews() {
  const [n, iso, logos, mk, trk, led] = await Promise.all([window.InvNewsSource.load('assets/globe/news-live.json'), fetch('assets/globe/iso.json').then(r => r.json()).catch(() => ({})), fetch('assets/globe/logos.json').then(r => r.json()).catch(() => ({})), fetch('assets/globe/markets.json').then(r => r.json()).catch(() => ({ assets: [] })), window.SinceNews ? SinceNews.load('assets/globe/news-track.json') : null, fetch('assets/globe/v5-ledger.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => null)]);
  MARKETS = mk.assets || []; TRACK = trk; LEDGER = led;
  ISO = iso; ENTITY_LOGOS = Object.fromEntries(Object.entries(logos).map(([k, v]) => [k, v.replace('../logos/', 'assets/logos/')])); const stories = n.stories || [];
  return { stories, stats: n.stats || null, top: [...stories].sort(rank), latest: [...stories].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)), updated: n.updated_at,
    moved: (() => { const all = [...stories].filter(s => s.market_moving || s.importance === 3).sort(rank), seen = new Set(), out = []; for (const s of all) { const m = primary(s); if (m && !seen.has(m.a.s)) { seen.add(m.a.s); out.push(s); } } for (const s of all) if (!out.includes(s) && !primary(s)) out.push(s); return out; })(), asof: mk.asof, calls: window.Implications ? Implications.collect({ stories, markets: MARKETS, track: TRACK, ledger: LEDGER }) : [] };
}
const freshAgo = t => { const m = Math.max(0, Math.round((Date.now() - Date.parse(t)) / 60000)); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.floor(m / 60) + 'h ago' : Math.floor(m / 1440) + 'd ago'; };
const updatedText = t => 'Updated ' + freshAgo(t);

// "Articles the market confirmed" (homepage): only calls the market bore out are featured; every other call is one click away on implications.html.
const sgn = v => (v > 0 ? '↑ ' : v < 0 ? '↓ ' : '↔ ') + Math.abs(v).toFixed(2) + '%';
const confirmedChip = c => `<span class="hn-conf">✓ Said ${c.dir} · went ${c.dir}</span>`;
function confirmedFeatured(c) {
  const s = c.story, card = window.SinceNews ? SinceNews.card({ story: s, impact: c.impact, asset: c.asset, series: c.series, now: Date.now() }) : '';
  return `<a class="hn-wf" href="${url(s)}"><div class="hn-wtop">${tags(s)}</div>${confirmedChip(c)}<h3>${esc(s.headline)}</h3><p>${esc(s.why_moved || s.summary)}</p>${card}${impactChips(s)}</a>`;
}
const confirmedSmall = c => `<a class="hn-wc" href="${url(c.story)}"><div class="hn-wtop">${tags(c.story)}</div><h4>${esc(c.story.headline)}</h4><div class="hn-wasset"><span class="hn-conf sm">✓ ${esc(c.asset.n)} ${sgn(c.move)}</span></div>${impactChips(c.story)}</a>`;
function confirmedSection(d) {
  const calls = d.calls || [], C = window.Implications ? Implications.counts(calls) : { hit: 0, miss: 0, flat: 0 }, judged = C.hit + C.miss + C.flat;
  const hits = calls.filter(c => c.res === 'hit' && c.judged === 'live').sort((a, b) => (b.story.importance - a.story.importance) || (b.pub - a.pub));
  const seen = new Set(), list = hits.filter(c => !seen.has(c.story.id) && seen.add(c.story.id));
  const more = `<div class="hn-wmore"><a class="hn-btn" href="implications.html">Recent market implications →</a><span class="hn-meta">${judged ? `${C.hit} of ${judged} confirmed · ` : ''}misses included · <a href="track-record.html">Track record</a></span></div>`;
  const body = list.length ? confirmedFeatured(list[0]) + `<div class="hn-wside">${list.slice(1, 3).map(confirmedSmall).join('')}</div>` : `<p class="hn-meta" style="grid-column:1/-1">No recent article has been borne out by its price yet. Calls are listed as they resolve.</p>`;
  return { body, more };
}
