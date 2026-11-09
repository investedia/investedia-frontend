// Homepage redesign previews: real live news (../globe/news-live.json) rendered as cards, rows and "why it moved" explainers.
const BF = '1idNJqyfpKbma454ae4';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAME = { 'United States of America': 'United States', 'Dem. Rep. Congo': 'DR Congo', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Dominican Rep.': 'Dominican Republic' };
const nm = c => NAME[c] || c;
const CAT = { markets: 'Markets', companies: 'Companies', economy: 'Economy', technology: 'Technology', crypto: 'Crypto', commodities: 'Commodities', geopolitics: 'Geopolitics' };
const FLAG = { breaking: 'Breaking', trending: 'Trending', moving: 'Market moving' };
let ISO = {};
function ago(t) { const m = Math.max(1, Math.round((Date.now() - Date.parse(t)) / 60000)); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }
const flagSrc = c => ISO[c] ? `../globe/flags/${ISO[c].toLowerCase()}.svg` : '';
const company = e => e.ticker && !/[\^=]/.test(e.ticker) && !/-USD$/.test(e.ticker);
const logoSrc = e => company(e) ? `https://cdn.brandfetch.io/ticker/${encodeURIComponent(e.ticker)}/w/256/h/256/fallback/404?c=${BF}` : '';
const url = s => `../globe/news.html?story=${encodeURIComponent(s.id)}`;
const tags = s => `${s.flag ? `<span class="tag">${FLAG[s.flag]}</span>` : ''}<span class="eyebrow">${esc(CAT[s.category] || '')} · ${esc(s.location.place.split(',')[0])}</span>`;
const hideBad = `onerror="this.remove()"`;

function img(s) {
  const e = (s.entities || []).find(company), f = flagSrc(s.location.country);
  if (s.image) return `<div class="img"><img class="ph" src="../globe/${esc(s.image.file)}" alt="${esc(s.image.alt || '')}" loading="lazy">${e ? `<img class="lg" src="${logoSrc(e)}" alt="" ${hideBad}>` : ''}${f ? `<img class="fl" src="${f}" alt="">` : ''}</div>`;
  if (e) return `<div class="img"><img class="big" src="${logoSrc(e)}" alt="${esc(e.name)}" style="background:#fff;border-radius:16px;padding:10px" ${hideBad}>${f ? `<img class="fl" src="${f}" alt="">` : ''}</div>`;
  return `<div class="img">${f ? `<img class="bigfl" src="${f}" alt="${esc(nm(s.location.country))}">` : ''}</div>`;
}
const card = (s, sum = true) => `<a class="card" href="${url(s)}">${img(s)}<div>${tags(s)}</div><h3>${esc(s.headline)}</h3>${sum ? `<p>${esc(s.summary)}</p>` : ''}<span class="meta">${ago(s.published_at)} · <b>${esc(s.source?.name || '')}</b>${s.sources?.length > 1 ? ` + ${s.sources.length - 1} more` : ''}</span></a>`;
function thumb(s) {
  const e = (s.entities || []).find(company), f = flagSrc(s.location.country);
  return s.image ? `<img src="../globe/${esc(s.image.file)}" alt="">` : e ? `<img class="lgo" src="${logoSrc(e)}" alt="" ${hideBad}>` : f ? `<img class="flg" src="${f}" alt="">` : '';
}
const row = s => `<a class="row" href="${url(s)}"><span class="th">${thumb(s)}</span><span><span>${tags(s)}</span><h4>${esc(s.headline)}</h4><span class="meta">${ago(s.published_at)} · ${esc(nm(s.location.country))}</span></span></a>`;
const why = (s, i) => `<a class="why" href="${url(s)}"><span class="n">0${i + 1}</span><div>${tags(s)}</div><h3>${esc(s.headline)}</h3><div class="wl">What happened</div><p>${esc(s.summary)}</p><div class="wl">Why it matters</div><p>${esc(s.why)}</p>
  ${(s.entities || []).length ? `<div class="ents">${s.entities.map(e => `<span class="ent">${company(e) ? `<img src="${logoSrc(e)}" alt="" ${hideBad}>` : ''}${esc(e.name)}${e.ticker ? `<code>${esc(e.ticker)}</code>` : ''}</span>`).join('')}</div>` : ''}</a>`;
function countries(list) {
  const c = {}; for (const s of list) c[s.location.country] = (c[s.location.country] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => `<a class="cty" href="../globe/news.html?country=${encodeURIComponent(k)}">${flagSrc(k) ? `<img src="${flagSrc(k)}" alt="">` : ''}<span><b>${esc(nm(k))}</b><small>${n} ${n === 1 ? 'story' : 'stories'}</small></span></a>`).join('');
}
// rank: importance, then sources, then recency
const rank = (a, b) => (b.importance - a.importance) || ((b.sources?.length || 1) - (a.sources?.length || 1)) || (Date.parse(b.published_at) - Date.parse(a.published_at));
async function loadNews() {
  const [n, iso] = await Promise.all([fetch('../globe/news-live.json', { cache: 'no-cache' }).then(r => r.json()), fetch('../globe/iso.json').then(r => r.json()).catch(() => ({}))]);
  ISO = iso; const stories = n.stories || [];
  return { stories, top: [...stories].sort(rank), latest: [...stories].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)), updated: n.updated_at,
    moved: [...stories].filter(s => s.market_moving || s.importance === 3).sort(rank) };
}
const updatedText = t => 'Live · updated ' + new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const HEADER = on => `<header class="hdr"><div class="wrap"><a class="wm" href="#">Invested<span class="i">i</span>a</a>
  <nav class="nav">${['News', 'Globe', 'Countries', 'Why it moved', 'Learn'].map(x => `<a href="#" class="${x === on ? 'on' : ''}">${x}</a>`).join('')}</nav><span class="sp"></span>
  <a class="sbtn" href="../globe/news.html"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>Search news, countries, companies</a>
  <a class="btn ghost" href="#">Log in</a><a class="btn pri" href="#">Sign up</a><button class="burger" aria-label="Menu"><svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div></header>`;
const FOOTER = `<div class="wrap"><footer class="ftr"><span>© Investedia · News and context for investors</span><span>Headlines and summaries are AI-assisted from each source's own headline and description; every story links to its source. Not investment advice.</span></footer></div>`;
