/* Share an article: the phone share sheet when available, otherwise copy the link.
   Uses the per-article preview page (assets/share/<id>.html, made by update_share_cards.py) so chats show the image card;
   articles without one share the plain article address. */
(function () {
  let ids = null;
  const base = () => new URL('assets/share/', document.querySelector('script[src*="share-link.js"]').src.replace(/assets\/share-link\.js.*$/, '')).href;
  async function listed() { if (!ids) { try { ids = new Set(await (await fetch(base() + 'index.json', { cache: 'no-cache' })).json()); } catch { ids = new Set(); } } return ids; }
  // Owner 25 Nov 2026: one clean address for every article; the server writes the preview card (functions/story.js).
  async function urlFor(id) { return 'https://www.investedia.com/story?id=' + encodeURIComponent(id); }
  async function share(id, title, btn) {
    const url = await urlFor(id), label = btn && btn.textContent;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {}
    if (btn) { btn.textContent = ok ? 'Link copied' : url; setTimeout(() => { btn.textContent = label; }, 2200); }
  }
  window.ShareLink = { share, urlFor };
})();
