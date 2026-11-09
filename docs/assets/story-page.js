// Article page: ?id=STORY_ID. Chain of cause and effect, how the article developed, and next steps.
(() => {
  const root = document.getElementById('sp'), id = new URLSearchParams(location.search).get('id');
  const arr = d => `<span role="img" aria-label="${d==='up'?'up':d==='down'?'down':'mixed or neutral'}" class="sp-dir ${d}">${d === 'up' ? '↑' : d === 'down' ? '↓' : d === 'mixed' ? '↔' : '–'}</span>`;
  const fl = c => c ? `<img class="sp-fl" src="assets/globe/flags/${c.toLowerCase()}.svg" alt="" onerror="this.remove()">` : '';
  const lg = t => window.InvConsent?.allows('images') && t && !/[\^=]/.test(t) ? `<img class="sp-lg" src="https://cdn.brandfetch.io/${/-USD$/.test(t) ? 'crypto/' + encodeURIComponent(t.split('-')[0]) : 'ticker/' + encodeURIComponent(t)}/w/96/h/96/fallback/404?c=${BF}" alt="" onerror="this.remove()">` : '';
  const ic = i => i.kind === 'country' || !i.ticker ? fl(i.country) : lg(i.ticker) || fl(i.country);
  const link = s => `story.html?id=${encodeURIComponent(s.id)}`;
  const FKEY = 'inv-follow-items';
  const followed = () => { try { return JSON.parse(localStorage.getItem(FKEY)) || []; } catch { return []; } };
  const toggle = n => { const f = followed(), i = f.indexOf(n); i < 0 ? f.push(n) : f.splice(i, 1); try { localStorage.setItem(FKEY, JSON.stringify(f)); } catch {} return i < 0; };
  loadNews().then(async d => {
    const all = d.stories; let s = all.find(x => x.id === id);
    if (!s && id && /^[\w-]+$/.test(id)) { try { const r = await fetch('assets/globe/library/' + encodeURIComponent(id) + '.json'); if (r.ok) { s = await r.json(); all.push(s); } } catch {} }
    if (!s) { root.innerHTML = '<div class="sp-none">We couldn’t find that article. <a href="news.html">Back to the news</a></div>'; return; }
    document.title = s.headline + ' · Investedia';
    const names = new Set([...(s.entities || []).map(e => e.name), ...(s.impacts || []).map(i => i.name)].filter(Boolean));
    const rel = all.filter(x => x.id !== s.id && ([...(x.entities || []).map(e => e.name), ...(x.impacts || []).map(i => i.name)].some(n => names.has(n))));
    const thread = [s, ...rel].sort((a, b) => Date.parse(a.published_at) - Date.parse(b.published_at)).slice(-6);
    const others = i => all.filter(x => x.id !== s.id && (x.impacts || []).some(z => z.name === i.name)).slice(0, 2).map(x => ({ x, z: x.impacts.find(z => z.name === i.name) }));
    const imp = s.impacts || [], e0 = imp[0], follow = (s.entities?.[0]?.name) || (e0 && e0.name) || nm(s.location.country);
    const photo = s.image ? `<div class="sp-im"><img class="ph" src="assets/globe/${esc(s.image.file)}" alt="${esc(s.image.alt || '')}"><span class="cr">${s.image.kind === 'place' ? 'Photo' : 'Illustration'} · ${esc(s.image.credit || '')} · ${esc(s.image.source || '')}</span></div>` : '';
    root.innerHTML = `<a class="sp-back" href="news.html">← News</a>
    <div class="sp-pg"><div><div class="sp-m">${fl(ISO[s.location.country])}<b>${esc(s.location.place.split(',')[0])}</b><span>· ${esc(CAT[s.category] || '')} · ${ago(s.published_at)}</span></div><h1>${esc(s.headline)}</h1><button type="button" class="sp-share" id="sp-share">Share</button>${photo}<p class="sp-sum">${esc(s.summary)}</p>
    <section class="sp-sec mi" id="sp-mi"><h2>Market implications</h2><p>What changed, which assets are exposed, and what investors are watching.</p>
     <div class="mi-seg" role="tablist" aria-label="Section"><button type="button" role="tab" data-p="event" aria-selected="false">Event</button><button type="button" role="tab" data-p="why" aria-selected="false">Rationale</button><button type="button" role="tab" data-p="exp" aria-selected="true">Exposure${imp.length ? ' · ' + Math.min(imp.length, 6) : ''}</button></div>
     <div class="mi-p mi-event" data-p="event"><span class="mi-eb">Event</span><p>${esc(s.summary)}</p></div>
     <div class="mi-p mi-why on-pc" data-p="why"><span class="mi-eb">Thesis</span><p class="mi-th">${esc(s.why_moved || s.why || '')}</p></div>
     <div class="mi-p mi-exp on-pc" data-p="exp">${imp.length ? imp.slice(0, 6).map(i => { const o = others(i), t = (i.ticker || '').toUpperCase(); return `<div class="mi-row" data-t="${esc(i.ticker || '')}"><div class="mi-n">${ic(i)}<span><b>${esc(i.name)}</b><small>${esc(i.kind)}</small></span></div><div class="mi-m"><div class="mi-bar ${esc(i.direction)}"><i></i></div><p>${esc(i.why)}</p><div class="mi-px"></div>${o.length ? `<div class="sp-also"><div class="t">Related coverage</div>${o.map(({ x, z }) => `<a href="${link(x)}">${arr(z.direction)}<span>${esc(x.headline)}</span></a>`).join('')}</div>` : ''}</div><span class="mi-a">${arr(i.direction)}</span></div>`; }).join('') : '<p class="mi-none">No direct knock-on effects identified for this article yet.</p>'}</div>
    </section>
    <section class="sp-sec pr-sec" id="sp-px" hidden></section>
    ${thread.length > 1 ? `<section class="sp-sec"><h2>How this article developed</h2><p>Reports on the same thread, oldest first.</p><div class="sp-tl">${thread.map((x, n) => `<div class="sp-ev${x.id === s.id ? ' now' : ''}"><div class="d">${new Date(x.published_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${new Date(x.published_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div><a href="${link(x)}">${esc(x.headline)}</a><p>${esc(x.summary)}</p>${(x.impacts || []).length ? `<div class="eff">${x.impacts.slice(0, 3).map(i => `<span>${ic(i)}${esc(i.name)} ${arr(i.direction)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div></section>` : ''}
    <div class="sp-src"><span>Source: ${(s.sources || [s.source]).slice(0, 3).map(x => x ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : '').join(', ')}</span><span><a href="assets/globe/news.html?story=${encodeURIComponent(s.id)}">Open on the globe →</a></span></div></div>
    <aside class="sp-side"><div class="sp-card"><h3>What you can do next</h3>
      <div class="sp-act"><span class="ic">◉</span><span><b>Follow ${esc(follow)}</b><small>Keep an eye on new articles that touch it</small></span><button class="sp-b p" type="button" id="sp-f"></button></div>
      <div class="sp-act"><span class="ic">☰</span><span><b>Add to my morning briefing</b><small>This thread, summarised each morning</small></span><button class="sp-b" type="button" data-auth="up">Add</button></div>
      <div class="sp-act"><span class="ic">?</span><span><b>Market primers</b><small>Transmission channels from news to prices</small></span><a class="sp-b" href="education.html">Read</a></div></div>
    ${e0 ? `<div class="sp-card"><h3>Two scenarios to watch</h3><div class="sp-sc"><div><b>${arr('up')} If it continues</b>More articles like this keep pushing ${esc(e0.name)} ${e0.direction === 'down' ? 'down' : e0.direction === 'up' ? 'up' : 'both ways'}; watch ${esc((imp[1] || e0).name)} next.</div><div><b>${arr('down')} If it fades</b>The effect on ${esc(e0.name)} usually eases once the news stops repeating.</div></div><p class="sp-note">Scenarios describe what could happen, not what you should do. Investedia is media, not advice: nothing here is a recommendation to buy or sell.</p></div>` : ''}
    <p class="sp-note">Summaries are written with the help of AI from each source's own reporting. Every article links to its source.</p></aside></div>`;
    { const mi = document.getElementById('sp-mi'), show = p => { mi.querySelectorAll('.mi-seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.p === p)); mi.querySelectorAll('.mi-p').forEach(el => el.classList.toggle('on', el.dataset.p === p)); }; show('exp'); mi.querySelector('.mi-seg').onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.p); };
      Promise.all([fetch('assets/globe/markets.json').then(r => r.json()).catch(() => ({ assets: [] })), fetch('assets/globe/news-prices.json').then(r => r.json()).catch(() => ({ assets: {} }))]).then(([m, np]) => { const by = Object.fromEntries((m.assets || []).map(a => [a.s, a])); Object.assign(by, np.assets || {});
        mi.querySelectorAll('.mi-row').forEach(r => { const t = r.dataset.t, a = t && (by[t] || by[t.replace(/-USD$/, '')] || by[t.replace(/=X$/, '')]); if (!a || typeof a.w !== 'number') return; const v = a.w, c = v > 0.005 ? 'u' : v < -0.005 ? 'd' : 'o'; r.querySelector('.mi-px').innerHTML = `<span class="mi-chip ${c}">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(Math.abs(v) >= 10 ? 1 : 2)}% <small>week</small></span>`; }); }); }
    // Since the news (chart option B): first exposed asset that has prices recorded after the article.
    if (window.SinceNews) Promise.all([fetch('assets/globe/markets.json').then(r => r.json()).catch(() => ({ assets: [] })), SinceNews.load('assets/globe/news-track.json')]).then(([m, trk]) => {
      const by = Object.fromEntries((m.assets || []).map(a => [a.s, a])), pub = Date.parse(s.published_at);
      for (const i of imp) {
        const t = String(i.ticker || '').toUpperCase(), a = t && (by[t] || by[t + '-USD'] || by[t.replace(/=X$/, '')]);
        const series = a && trk && trk.s && trk.s[a.s];
        if (!series || SinceNews.compute(pub, series, Date.now()).state !== 'ok') continue;
        const seg = document.querySelector('#sp-mi .mi-seg'); if (seg) seg.insertAdjacentHTML('beforebegin', SinceNews.card({ story: s, impact: i, asset: a, series, now: Date.now() }));
        break;
      }
    });
    const px = document.getElementById('sp-px'); if (px && window.PriceRail) PriceRail.mount(px, s);
    const sh = document.getElementById('sp-share'); if (sh) sh.onclick = () => window.ShareLink && ShareLink.share(s.id, s.headline, sh);
    const b = document.getElementById('sp-f'), paint = () => { const on = followed().includes(follow); b.textContent = on ? 'Following' : 'Follow'; b.classList.toggle('on', on); b.classList.toggle('p', !on); };
    paint(); b.onclick = () => { toggle(follow); paint(); };
  }).catch(() => { root.innerHTML = '<div class="sp-none">News could not load. Please refresh.</div>'; });
})();
