// News page: what the news touches, ranked, with filters. Reads assets/globe/news-live.json (helpers come from home-news.js).
(() => {
  const $ = id => document.getElementById(id);
  const MODES = [['aff', 'Most affected', 'Ranked by how many articles touch it.'], ['vol', 'Most volatile', 'Ranked by <b>conflicting forces</b>: the more articles push it both up and down, the more volatile the news around it. This is a news measure, not a price measure.'], ['one', 'Most one-sided', 'Ranked by how strongly the news points <b>one way</b>.'], ['new', 'Newest', 'Ranked by the latest article that touches it.']];
  const CATS = [['all', 'All'], ['markets', 'Markets'], ['companies', 'Companies'], ['economy', 'Economy'], ['technology', 'Technology'], ['crypto', 'Crypto'], ['commodities', 'Commodities'], ['geopolitics', 'Geopolitics']];
  const CN = { US: 'United States', GB: 'United Kingdom', DE: 'Germany', CN: 'China', JP: 'Japan', IN: 'India', FR: 'France', AU: 'Australia', CA: 'Canada', BR: 'Brazil', SA: 'Saudi Arabia', AE: 'United Arab Emirates', RU: 'Russia', KR: 'South Korea', MX: 'Mexico', IT: 'Italy', NL: 'Netherlands', CH: 'Switzerland', TR: 'Turkey', NG: 'Nigeria', ZA: 'South Africa', ES: 'Spain', ID: 'Indonesia', TW: 'Taiwan', SG: 'Singapore', IL: 'Israel', IE: 'Ireland', SE: 'Sweden', NO: 'Norway', BE: 'Belgium', EG: 'Egypt', AR: 'Argentina', CL: 'Chile', PL: 'Poland', EU: 'Euro area' };
  const S = { mode: 'vol', cat: 'all', region: 'all', days: 7, dir: 'any', stories: [], shown: 12, q: null };
  const nbFlag = c => c ? `<img class="nb-fl" src="assets/globe/flags/${c.toLowerCase()}.svg" alt="" onerror="this.remove()">` : '';
  const nbLogo = t => window.InvConsent?.allows('images') && t && !/[\^=]/.test(t) ? `<img class="nb-lg" src="https://cdn.brandfetch.io/${/-USD$/.test(t) ? 'crypto/' + encodeURIComponent(t.split('-')[0]) : 'ticker/' + encodeURIComponent(t)}/w/96/h/96/fallback/404?c=${BF}" alt="" onerror="this.remove()">` : '';
  const ico = i => i.kind === 'country' || !i.ticker ? nbFlag(i.country) : nbLogo(i.ticker) || nbFlag(i.country);
  const arr = d => `<span class="nb-dir ${d}">${d === 'up' ? '↑' : d === 'down' ? '↓' : d === 'mixed' ? '↔' : '–'}</span>`;
  const net = e => e.u > e.d * 1.5 ? 'up' : e.d > e.u * 1.5 ? 'down' : 'mixed';
  const link = s => `story.html?id=${encodeURIComponent(s.id)}`;
  const pick = (list, key, label, icon) => {
    const m = new Map();
    for (const s of list) for (const i of s.impacts || []) { const k = key(i); if (!k) continue; const e = m.get(k) || { k, label: label(i), ic: icon(i), u: 0, d: 0, o: 0, t: 0, last: 0, items: [] }; e[i.direction === 'up' ? 'u' : i.direction === 'down' ? 'd' : 'o']++; e.t++; e.last = Math.max(e.last, Date.parse(s.published_at)); e.items.push({ s, i }); if (i.ticker) e.sym = i.ticker; m.set(k, e); }
    const L = [...m.values()].filter(e => e.t >= 2).map(e => ({ ...e, vol: 2 * Math.min(e.u, e.d) / ((e.u + e.d) || 1) * Math.min(1, (e.u + e.d) / 6), one: Math.abs(e.u - e.d) / ((e.u + e.d) || 1) }));
    const f = { any: () => true, up: e => e.u > e.d * 1.5, down: e => e.d > e.u * 1.5, mixed: e => e.u && e.d && e.vol > .25 }[S.dir];
    return L.filter(f).sort((a, b) => ({ aff: e => e.t, vol: e => e.vol, one: e => e.one, new: e => e.last })[S.mode](b) - ({ aff: e => e.t, vol: e => e.vol, one: e => e.one, new: e => e.last })[S.mode](a)).slice(0, 7);
  };
  const px = e => { const M = window.MV, a = e.sym && M.S.by && M.S.by[e.sym]; if (!a) return ''; const w = S.days <= 1 ? 'd' : S.days <= 3 ? 'd' : 'w', v = M.move(a, w); return ` · <b class="nb-px ${M.cls(v)}">${M.fmt(v)}</b> ${w === 'd' ? '24h' : 'week'}`; };
  const pxChart = e => { const M = window.MV, a = e.sym && M.S.by && M.S.by[e.sym]; if (!a) return ''; const w = S.days <= 3 ? 'd' : 'w'; return `<div class="mv-d" style="display:block;padding:0 0 10px">${M.chart(a, w, M.storiesFor(a, w === 'd' ? 1 : 7))}</div>`; };
  const rows = L => L.length ? L.map((e, n) => `<div class="nb-r${n === 0 ? ' open' : ''}"><button class="nb-rh" type="button" aria-expanded="${n === 0}"><span>${e.ic}</span><span><b>${esc(e.label)}</b><small>${e.t} ${e.t === 1 ? 'article' : 'articles'}${px(e)}</small></span>
    <span class="bw"><span class="nb-bar">${e.u ? `<i class="u" style="flex:${e.u}"></i>` : ''}${e.d ? `<i class="d" style="flex:${e.d}"></i>` : ''}${e.o ? `<i class="o" style="flex:${e.o}"></i>` : ''}</span><span class="nb-cnt">${e.u ? `<span class="u">↑ ${e.u}</span>` : ''}${e.d ? `<span class="d">↓ ${e.d}</span>` : ''}${e.o ? `<span>↔ ${e.o}</span>` : ''}</span>${S.mode === 'vol' ? `<span class="nb-vol">Volatility <b>${e.vol > .55 ? 'High' : e.vol > .25 ? 'Medium' : 'Low'}</b></span>` : ''}</span>${arr(net(e))}<span class="nb-chev">›</span></button>
    <div class="nb-det">${pxChart(e)}${e.items.sort((a, b) => rank(a.s, b.s)).slice(0, 3).map(({ s, i }) => `<a class="nb-st" href="${link(s)}">${arr(i.direction)}<span><b>${esc(s.headline)}</b><p>${esc(i.why)}</p></span></a>`).join('')}</div></div>`).join('') : '<div class="nb-none">Nothing matches these filters yet. Try a wider time window or another category.</div>';
  const th = s => { const e = (s.entities || []).find(company); const f = flagSrc(s.location.country); return s.image ? `<img src="assets/globe/${esc(s.image.file)}" alt="" loading="lazy">` : e ? `<img class="nb-lg" src="${logoSrc(e)}" alt="" onerror="this.remove()">` : f ? `<img class="nb-lg" style="padding:0;background:none;border-radius:4px" src="${f}" alt="">` : ''; };
  const hits = (s, q) => (s.impacts || []).some(i => q.t === 'c' ? i.country === q.k : i.kind !== 'country' && i.name.toLowerCase() === q.k);
  const index = () => { const m = new Map(); for (const s of S.stories) for (const i of s.impacts || []) { const c = i.kind === 'country' || !i.ticker && i.kind === 'country'; const t = i.kind === 'country' ? 'c' : 'a', k = t === 'c' ? i.country : i.name.toLowerCase(); if (!k) continue; const id = t + k, e = m.get(id) || { t, k, label: t === 'c' ? (CN[i.country] || i.country) : i.name, ic: t === 'c' ? nbFlag(i.country) : ico(i), ids: new Set(), sub: t === 'c' ? 'Country' : (i.ticker || 'Asset') }; e.ids.add(s.id); m.set(id, e); } return [...m.values()].map(e => ({ ...e, n: e.ids.size })); };
  let IDX = [], dd = $('nb-dd'), qi = $('nb-q');
  const norm = x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const ddShow = () => { const v = norm(qi.value.trim()); const r = IDX.filter(e => !v || norm(e.label).includes(v) || norm(e.sub).includes(v)).sort((a, b) => (norm(b.label).startsWith(v) - norm(a.label).startsWith(v)) || b.n - a.n).slice(0, 7); dd.innerHTML = r.length ? r.map((e, n) => `<button type="button" data-id="${e.t}${esc(e.k)}"${n === 0 ? ' class="on"' : ''}>${e.ic}<span>${esc(e.label)}</span><small>${esc(e.sub)} · ${e.n} ${e.n === 1 ? 'article' : 'articles'}</small></button>`).join('') : '<div class="nb-no">No match yet. Try a country or a company name.</div>'; dd.hidden = false; };
  const choose = id => { const e = IDX.find(x => x.t + x.k === id); if (!e) return; S.q = { t: e.t, k: e.k, label: e.label }; S.shown = 12; qi.value = ''; dd.hidden = true; $('nb-chip').hidden = false; $('nb-chip').innerHTML = `<button type="button" aria-label="Clear search">${esc(e.label)} <span aria-hidden="true">×</span></button>`; draw(); $('nb-ls').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  qi.addEventListener('focus', ddShow); qi.addEventListener('input', ddShow);
  qi.addEventListener('keydown', e => { const b = [...dd.querySelectorAll('button')], c = b.findIndex(x => x.classList.contains('on')); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); b.forEach(x => x.classList.remove('on')); const n = b[(c + (e.key === 'ArrowDown' ? 1 : -1) + b.length) % b.length]; n && n.classList.add('on'); } else if (e.key === 'Enter') { const on = dd.querySelector('button.on'); if (on) choose(on.dataset.id); } else if (e.key === 'Escape') { dd.hidden = true; qi.blur(); } });
  dd.addEventListener('mousedown', e => { const b = e.target.closest('button'); if (b) { e.preventDefault(); choose(b.dataset.id); } });
  qi.addEventListener('blur', () => setTimeout(() => dd.hidden = true, 120));
  $('nb-chip').onclick = () => { S.q = null; $('nb-chip').hidden = true; draw(); };
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); qi.focus(); } });
  function draw() {
    const cut = Date.now() - S.days * 864e5;
    const list = S.stories.filter(s => (S.q ? hits(s, S.q) : Date.parse(s.published_at) >= cut) && (S.cat === 'all' || s.category === S.cat) && (S.region === 'all' || s.location.region === S.region));
    $('nb-def').innerHTML = MODES.find(x => x[0] === S.mode)[2];
    $('nb-co').innerHTML = rows(pick(list, i => i.country, i => CN[i.country] || i.country, i => nbFlag(i.country)));
    $('nb-as').innerHTML = rows(pick(list, i => i.kind !== 'country' ? (i.ticker || i.name.toLowerCase()) : null, i => i.name, ico));
    document.querySelectorAll('#nb-seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.mode));
    document.querySelectorAll('#nb-cats button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.cat));
    const latest = [...list].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
    $('nb-n').textContent = latest.length + (latest.length === 1 ? ' story' : ' articles');
    $('nb-ls').innerHTML = latest.slice(0, S.shown).map(s => `<a class="nb-li" href="${link(s)}"><span class="th">${th(s)}</span><span><span class="nb-eb">${esc(CAT[s.category] || '')} · ${esc(s.location.place.split(',')[0])}</span><h3>${esc(s.headline)}</h3><span class="m">${ago(s.published_at)} · ${esc(s.source?.name || '')}${s.impacts?.length ? ' · touches ' + esc(s.impacts.slice(0, 2).map(i => i.name).join(', ')) : ''}</span></span></a>`).join('') || '<div class="nb-none">No articles in this window.</div>';
    $('nb-more').hidden = latest.length <= S.shown;
  }
  $('nb-seg').innerHTML = MODES.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('');
  $('nb-cats').innerHTML = CATS.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('');
  $('nb-seg').onclick = e => { const b = e.target.closest('button'); if (b) { S.mode = b.dataset.k; draw(); } };
  $('nb-cats').onclick = e => { const b = e.target.closest('button'); if (b) { S.cat = b.dataset.k; S.shown = 12; draw(); } };
  $('nb-region').onchange = e => { S.region = e.target.value; draw(); }; $('nb-time').onchange = e => { S.days = +e.target.value; S.shown = 12; draw(); }; $('nb-dir').onchange = e => { S.dir = e.target.value; draw(); };
  $('nb-more').onclick = () => { S.shown += 12; draw(); };
  document.addEventListener('click', e => { const r = e.target.closest('.nb-rh'); if (r) { const p = r.parentElement; p.classList.toggle('open'); r.setAttribute('aria-expanded', p.classList.contains('open')); } });
  const tabs = v => { document.querySelectorAll('#nb-tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); $('nb-v-exp').hidden = v !== 'exp'; $('nb-v-mv').hidden = v !== 'mv'; $('nb-find').hidden = v !== 'exp'; if (v === 'mv') history.replaceState(null, '', '#movers'); else history.replaceState(null, '', location.pathname + location.search); };
  $('nb-tabs').onclick = e => { const b = e.target.closest('button'); if (b) tabs(b.dataset.v); };
  if (location.hash === '#movers') tabs('mv');
  Promise.all([loadNews(), window.MV.ready.catch(() => {})]).then(([d]) => { S.stories = d.stories; IDX = index(); $('nb-up').textContent = 'Updated ' + new Date(d.updated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); draw(); })
    .catch(() => { $('nb-co').innerHTML = '<div class="nb-none">News could not load. Please refresh.</div>'; });
})();
