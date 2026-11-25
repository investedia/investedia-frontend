/* Article share bar (owner 25 Nov 2026, design C): copy link, WhatsApp, X, LinkedIn, Telegram, Email, Investedia QR code, phone share sheet.
   Brand glyphs: Simple Icons (CC0); LinkedIn drawn here. QR: qrcode-generator (MIT, assets/qrcode.js), drawn in the reader's browser: no service, no cost. */
(function () {
  const P = {"wa":"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z","x":"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z","tg":"M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"};
  const svg = (d, vb = '0 0 24 24') => '<svg viewBox="' + vb + '" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>';
  const IN = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="3" y="9" width="4" height="12" fill="currentColor"/><circle cx="5" cy="4.6" r="2.3" fill="currentColor"/><path fill="currentColor" d="M10 9h3.8v1.7c.6-1 1.9-2 4-2 3.6 0 4.2 2.3 4.2 5.4V21h-4v-6c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H10z"/></svg>';
  const LINK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
  const MAIL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>';
  const QR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h4v-4"/></svg>';
  const MORE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>';
  const logo = light => '<rect width="1086" height="1086" rx="200" fill="' + (light ? '#F4F4F2' : '#000') + '"/><polyline points="128,686 335,536 497,640 727,410" fill="none" stroke="' + (light ? '#080808' : '#fff') + '" stroke-width="70"/><circle cx="842" cy="318" r="83" fill="#EE8538"/>';
  const isLight = () => document.documentElement.dataset.theme === 'light';
  function qrSvg(url, light, size = 200) {
    const q = qrcode(0, 'H'); q.addData(url); q.make();
    const n = q.getModuleCount(), m = 2, u = size / (n + 2 * m), dot = light ? '#0A0A0B' : '#F2F2F3', o = [];
    const fin = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7), c0 = n / 2, lw = n * .22;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!q.isDark(r, c) || fin(r, c) || (Math.abs(r + .5 - c0) < lw / 2 + 1 && Math.abs(c + .5 - c0) < lw / 2 + 1)) continue;
      o.push('<circle cx="' + ((c + m + .5) * u).toFixed(2) + '" cy="' + ((r + m + .5) * u).toFixed(2) + '" r="' + (u * .43).toFixed(2) + '"/>');
    }
    let eyes = '';
    for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) { const x = (c + m) * u, y = (r + m) * u;
      eyes += '<rect x="' + (x + u / 2) + '" y="' + (y + u / 2) + '" width="' + 6 * u + '" height="' + 6 * u + '" rx="' + 2 * u + '" fill="none" stroke="' + dot + '" stroke-width="' + u + '"/><rect x="' + (x + 2 * u) + '" y="' + (y + 2 * u) + '" width="' + 3 * u + '" height="' + 3 * u + '" rx="' + u + '" fill="#FF7A1A"/>'; }
    const s = lw * u;
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="QR code for this article"><g fill="' + dot + '">' + o.join('') + '</g>' + eyes + '<svg x="' + (size / 2 - s / 2) + '" y="' + (size / 2 - s / 2) + '" width="' + s + '" height="' + s + '" viewBox="0 0 1086 1086">' + logo(light) + '</svg></svg>';
  }
  // QR as a PNG image (owner 25 Nov 2026): copy it, or send it with the phone share sheet / download it.
  function qrPng(url) {
    return new Promise((ok, no) => {
      const light = isLight(), pad = 48, size = 720, W = size + pad * 2;
      const img = new Image(); img.onload = () => {
        const c = document.createElement('canvas'); c.width = W; c.height = W + 70; const x = c.getContext('2d');
        x.fillStyle = light ? '#fff' : '#0A0A0B'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, pad, pad, size, size);
        x.fillStyle = light ? '#111' : '#f2f2f3'; x.font = '600 30px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText('Scan to read on Investedia', W / 2, W + 30);
        c.toBlob(b => b ? ok(b) : no(Error('png')), 'image/png'); };
      img.onerror = no; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg(url, light, size).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    });
  }
  async function qrAction(k, url, title, say) {
    let png; try { png = await qrPng(url); } catch { say('Could not make the image'); return; }
    if (k === 'copy') { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]); say('QR code copied'); } catch { say('Copy not supported here, use Download'); } return; }
    const file = new File([png], 'investedia-qr.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title, text: title + ' ' + url }); } catch {} return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(png); a.download = 'investedia-qr.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); say('QR code downloaded');
  }
  function mount(el, story) {
    if (!el) return;
    const title = story.headline || 'Investedia', id = story.id; let url = location.href;
    if (window.ShareLink) ShareLink.urlFor(id).then(u => { url = u; }).catch(() => {});
    const B = [['copy', 'Copy link', LINK], ['wa', 'Share on WhatsApp', svg(P.wa)], ['x', 'Share on X', svg(P.x)], ['in', 'Share on LinkedIn', IN], ['tg', 'Share on Telegram', svg(P.tg)], ['mail', 'Share by email', MAIL], ['qr', 'Show QR code', QR]];
    if (navigator.share) B.push(['more', 'More ways to share', MORE]);
    el.className = 'sb'; el.innerHTML = '<span class="sb-l">Share</span>' + B.map(([k, l, i]) => '<button type="button" class="sb-b sb-' + k + '" data-k="' + k + '" aria-label="' + l + '" title="' + l + '">' + i + '</button>').join('') + '<div class="sb-pop" hidden></div><span class="sb-toast" role="status" aria-live="polite"></span>';
    const pop = el.querySelector('.sb-pop'), toast = el.querySelector('.sb-toast');
    const say = t => { toast.textContent = t; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('on'), 1800); };
    const open = u => window.open(u, '_blank', 'noopener,width=620,height=560');
    const e = encodeURIComponent;
    el.addEventListener('click', async ev => {
      const q = ev.target.closest('[data-q]'); if (q) { qrAction(q.dataset.q, url, title, say); return; }
      const b = ev.target.closest('.sb-b'); if (!b) return;
      if (window.ShareLink) { try { url = await ShareLink.urlFor(id); } catch {} }
      switch (b.dataset.k) {
        case 'copy': try { await navigator.clipboard.writeText(url); say('Link copied'); } catch { say(url); } break;
        case 'wa': open('https://wa.me/?text=' + e(title + ' ' + url)); break;
        case 'x': open('https://twitter.com/intent/tweet?text=' + e(title) + '&url=' + e(url)); break;
        case 'in': open('https://www.linkedin.com/sharing/share-offsite/?url=' + e(url)); break;
        case 'tg': open('https://t.me/share/url?url=' + e(url) + '&text=' + e(title)); break;
        case 'mail': location.href = 'mailto:?subject=' + e(title) + '&body=' + e(title + '\n\n' + url); break;
        case 'more': try { await navigator.share({ title, url }); } catch {} break;
        case 'qr': if (!pop.hidden) { pop.hidden = true; b.setAttribute('aria-expanded', 'false'); break; }
          pop.innerHTML = '<div class="sb-qc"><b>Share this article</b>' + qrSvg(url, isLight()) + '<span>Scan to read on your phone</span><div class="sb-qa"><button type="button" data-q="copy">Copy QR code</button><button type="button" data-q="send">' + (navigator.canShare ? 'Send QR code' : 'Download') + '</button></div></div>';
          pop.hidden = false; b.setAttribute('aria-expanded', 'true'); break;
      }
    });
    document.addEventListener('click', ev => { if (!pop.hidden && !el.contains(ev.target)) pop.hidden = true; });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') pop.hidden = true; });
  }
  window.ShareBar = { mount, qrSvg };
})();
