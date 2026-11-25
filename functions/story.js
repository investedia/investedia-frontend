// Cloudflare Pages Function (owner 25 Nov 2026): link previews for articles.
// Chats (Discord, WhatsApp, X, LinkedIn, iMessage…) read the page's meta tags without running JavaScript, so /story?id=…
// gets the article's own headline, summary and picture written into the HTML here. Everything else stays the static page.
import { pickTopicPhoto } from './_lib/topic-photo.js';

const SITE = 'https://www.investedia.com';
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

async function findStory(origin, id, env) {
  const get = async path => { try { const r = await fetch(new URL(path, origin), { cf: { cacheTtl: 300 } }); return r.ok ? await r.json() : null; } catch { return null; } };
  let s = await get('/assets/globe/library/' + encodeURIComponent(id) + '.json');
  if (s && s.headline) return s;
  const ids = await get('/assets/globe/library-days/ids.json');
  const day = ids && ids[id];
  if (day) { const b = await get('/assets/globe/library-days/' + day + '.json'); if (b && b[id]) return b[id]; }
  for (const f of ['/assets/globe/news-live.json', '/assets/globe/news-48h.json']) {
    const d = await get(f); const hit = d && (d.stories || []).find(x => x && x.id === id); if (hit) return hit;
  }
  return null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url), id = url.searchParams.get('id') || '';
  const page = await context.next();
  if (!/^[\w-]{4,80}$/.test(id) || !(page.headers.get('Content-Type') || '').includes('text/html')) return page;
  const s = await findStory(url.origin, id, env);
  if (!s) return page;
  const title = clip(s.headline, 110), desc = clip(s.summary || s.why || '', 200) || 'What happened, why it matters, and which markets it moves.';
  let img = s.image && s.image.file ? s.image.file : (pickTopicPhoto(s.id, [s.headline, s.summary].join(' '), s.category) || {}).file;
  const clean = img ? img.replace(/^\/+/, '') : '';
  // Topic photos go through /og/ (functions/og), which adds the small logo (owner's option B1).
  const image = !clean ? SITE + '/assets/og-default.png'
    : /^photos\/[^/]+$/.test(clean) ? SITE + '/og/' + clean.slice(7) : SITE + '/assets/globe/' + clean;
  const link = SITE + '/story?id=' + encodeURIComponent(id);
  const set = v => ({ element(e) { e.setAttribute('content', v); } });
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title + ' · Investedia'); } })
    .on('meta[name="description"]', set(desc))
    .on('meta[property="og:title"]', set(title)).on('meta[name="twitter:title"]', set(title))
    .on('meta[property="og:description"]', set(desc)).on('meta[name="twitter:description"]', set(desc))
    .on('meta[property="og:image"]', set(image)).on('meta[name="twitter:image"]', set(image))
    .on('meta[property="og:image:alt"]', set(title))
    .on('meta[property="og:image:width"]', { element(e) { e.remove(); } }).on('meta[property="og:image:height"]', { element(e) { e.remove(); } })
    .on('meta[property="og:type"]', set('article'))
    .on('meta[property="og:url"]', set(link))
    .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', link); } })
    .transform(page);
  const h = new Headers(res.headers); h.set('Cache-Control', 'public, max-age=300');
  return new Response(res.body, { status: res.status, headers: h });
}
