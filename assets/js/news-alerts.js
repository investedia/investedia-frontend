// Quiet in-page "new headline" alerts. No browser notification permission, no provider calls.
// Phone: slim pill under the menu (design A). PC: article card with image or logo (design B).
(() => {
  const assetsURL = new URL('.', document.currentScript.src);
  const BF = '1idNJqyfpKbma454ae4';
  let seen = null, timer, current;
  const phone = () => matchMedia('(max-width:760px)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const style = document.createElement('style');
  style.textContent = `
  .news-alert[hidden]{display:none}
  .news-alert{position:fixed;z-index:1200;color:#fafafa;font:14px/1.45 Inter,Arial,sans-serif;text-decoration:none;cursor:pointer;animation:na-in .35s cubic-bezier(.2,.8,.2,1) both}
  .news-alert .na-x{border:0;background:transparent;color:#a1a1aa;font:20px/1 Arial;cursor:pointer;border-radius:6px;padding:0}
  .news-alert .na-x:hover{color:#fff;background:rgba(255,255,255,.1)}
  .news-alert :focus-visible{outline:2px solid #FF7A1A;outline-offset:3px}
  @keyframes na-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  /* B: card (PC) */
  .news-alert.na-card{right:18px;bottom:18px;width:min(284px,calc(100vw - 32px));border-radius:13px;overflow:hidden;background:#111113;border:1px solid rgba(255,255,255,.09);box-shadow:0 20px 60px rgba(0,0,0,.6)}
  .na-card .na-im{position:relative;height:78px;background:radial-gradient(90% 120% at 80% 0%,rgba(255,122,26,.3),transparent 60%),linear-gradient(135deg,#1b1b1e,#0b0b0d) center/cover}
  .na-card .na-lg{position:absolute;left:12px;bottom:-14px;width:30px;height:30px;border-radius:8px;background:#fff;padding:4px;box-sizing:border-box;object-fit:contain;box-shadow:0 4px 14px rgba(0,0,0,.4)}
  .na-card .na-x{position:absolute;right:8px;top:8px;width:24px;height:24px;background:rgba(10,10,11,.6);backdrop-filter:blur(6px)}
  .na-card .na-bd{padding:20px 13px 12px}
  .na-card .na-t{font:500 9.5px/1.4 'Geist Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#FF7A1A}
  .na-card h3{margin:4px 0 7px;font-size:13.5px;line-height:1.35;font-weight:600;letter-spacing:-.01em}
  .na-card .na-m{font-size:11px;color:#8b8b94}
  /* A: pill (phone) */
  .news-alert.na-pill{left:50%;top:calc(66px + env(safe-area-inset-top));transform:translateX(-50%);max-width:calc(100vw - 24px);display:flex;align-items:center;gap:10px;padding:7px 8px 7px 8px;border-radius:999px;background:rgba(20,20,22,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.12);box-shadow:0 10px 40px rgba(0,0,0,.55);animation-name:na-pill}
  @keyframes na-pill{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}
  .na-pill .na-dot{flex:none;width:26px;height:26px;border-radius:50%;background:rgba(255,122,26,.16);display:grid;place-items:center}
  .na-pill .na-dot i{width:8px;height:8px;border-radius:50%;background:#FF7A1A;box-shadow:0 0 10px #FF7A1A}
  .na-pill .na-tx{min-width:0;display:flex;flex-direction:column}
  .na-pill b{font-weight:550;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .na-pill .na-m{font-size:11.5px;color:#8b8b94;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .na-pill .na-view{flex:none;font-size:12.5px;font-weight:550;background:rgba(255,255,255,.1);padding:6px 11px;border-radius:999px}
  .na-pill .na-x{flex:none;width:26px;height:26px}
  .na-link{display:contents}.na-link:focus-visible::after{content:'';position:absolute;inset:0;outline:3px solid #FF7A1A;outline-offset:3px;border-radius:inherit;pointer-events:none}
  .na-illustration{position:absolute;left:6px;bottom:4px;font:10px/1.4 system-ui;color:#fff;background:#111e;padding:2px 4px;border-radius:3px}
  @media(pointer:coarse){.na-pill .na-x{width:44px;height:44px;min-width:44px}.na-pill .na-view{display:none}}
  @media(prefers-reduced-motion:reduce){.news-alert{animation:none}}
  `;
  document.head.append(style);
  function close() { if (current) current.hidden = true; clearTimeout(timer); }
  const logoOf = story => { if (!window.InvConsent?.allows('images')) return ''; const e = (story.entities || []).find(x => x.ticker && !/[\^=]/.test(x.ticker)); return e ? `https://cdn.brandfetch.io/${/-USD$/.test(e.ticker) ? 'crypto/' + encodeURIComponent(e.ticker.split('-')[0]) : 'ticker/' + encodeURIComponent(e.ticker)}/w/128/h/128/fallback/404?c=${BF}` : ''; };
  function show(story, count = 1, href) {
    close();
    const link = href || new URL('assets/globe/news.html?story=' + encodeURIComponent(story.id), location.origin + '/').href;
    const place = [story.location?.place?.split(',')[0], story.location?.country && story.location.country !== 'United States of America' ? story.location.country : story.location?.country && 'United States'].filter(Boolean).join(', ');
    const more = count > 1 ? `${count} new headlines` : 'New headline';
    if (!current) {
      current = document.createElement('div'); current.setAttribute('role','region'); current.setAttribute('aria-live','polite');
      current.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      document.body.append(current);
    }
    current.hidden = false;
    current.setAttribute('aria-label', more + ': ' + story.headline);
    current.onclick = e => { if (e.target.closest('.na-x')) { e.preventDefault(); close(); } };
    if (phone()) {
      current.className = 'news-alert na-pill';
      current.innerHTML = `<span class="na-dot"><i></i></span><span class="na-tx"><b>${esc(story.headline)}</b><span class="na-m">${esc(more)}${place ? ' · ' + esc(place) : ''}</span></span><span class="na-view">View</span><button type="button" class="na-x" aria-label="Dismiss">×</button>`;
      timer = setTimeout(close, 10000);  // the pill goes away by itself on phones
    } else {
      current.className = 'news-alert na-card';
      const photo = story.image?.file ? new URL('globe/' + story.image.file, assetsURL).href : '', lg = logoOf(story);
      current.innerHTML = `<div class="na-im"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '<span class="na-illustration">Illustration</span>' : ''}${lg ? `<img class="na-lg" src="${esc(lg)}" alt="" onerror="this.remove()">` : ''}<button type="button" class="na-x" aria-label="Dismiss">×</button></div>
        <div class="na-bd"><div class="na-t">${esc(more)} · ${esc(story.category || 'news')}</div><h3>${esc(story.headline)}</h3><div class="na-m">${esc(place)}${place ? ' · ' : ''}just now</div></div>`;
    }
    // Keep the dismiss action outside the article link for keyboard/screen-reader access.
    const dismiss=current.querySelector('.na-x'); dismiss.remove();
    const article=document.createElement('a');article.className='na-link';article.href=link;article.setAttribute('aria-label',more+': '+story.headline);
    while(current.firstChild)article.append(current.firstChild);
    current.append(article,dismiss);
  }
  function observe(stories, hrefFor) {
    if (!seen) { seen = new Set(stories.map(s => s.id)); return; }
    const fresh = stories.filter(s => !seen.has(s.id));
    for (const s of stories) seen.add(s.id);
    if (fresh.length) {
      fresh.sort((a, b) => b.importance - a.importance || Date.parse(b.published_at) - Date.parse(a.published_at));
      show(fresh[0], fresh.length, hrefFor?.(fresh[0]));
    }
  }
  window.NewsAlerts = { observe, show, close };
  // Every page checks the live feed quietly (once a minute, only while the tab is visible).
  {
    let polling = false;
    async function check() {
      if (document.hidden || polling) return;
      polling = true;
      try {
        const response = await fetch(new URL('globe/news-live.json', assetsURL), { cache: 'no-cache' });
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.stories)) observe(data.stories);
      } catch { /* Quiet retry while offline. */ }
      finally { polling = false; }
    }
    check(); setInterval(check, 60000);
  }
})();
