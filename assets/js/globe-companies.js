// Companies on the globe (owner, 17 Nov 2026): a "Companies" tab next to Latest activity / Upcoming / My watchlist
// (PC) and in the news sheet tabs (phone). Browse companies with a sourced head office, filter by country or
// "In the news", and select one to fly to its HQ. Only the companies in the current list are pinned on the globe,
// as logo badges in style D "Tint" (assets/logos/badges.json). Company pages link here with ?company=SYMBOL.
// Loaded after the globe's main script, whose globals it uses: proj, rad, ctx, flyTo, stories, render, renderAct, phone.
(() => {
  const ROOT = new URL('../../', location.href).href;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = { ready: false, list: [], q: '', country: '', news: false, sel: null, open: false, img: {} };
  const MAXPINS = 40;
  const css = document.createElement('style');
  css.textContent = `
  .co-wrap{display:block}.co-tools{display:flex;gap:8px;align-items:center;margin:2px 0 12px;flex-wrap:wrap}
  .co-s{flex:1;min-width:170px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 12px;color:#fafafa;font:inherit;font-size:13.5px;outline:none}
  .co-s::placeholder{color:#8e8e96}.co-s:focus{border-color:rgba(255,122,26,.6)}
  .co-chip{border:1px solid rgba(255,255,255,.12);border-radius:99px;padding:6px 11px;font:inherit;font-size:12.5px;color:#c9c9cf;background:none;white-space:nowrap;cursor:pointer}
  .co-chip[aria-pressed=true]{background:#FF7A1A;color:#000;border-color:#FF7A1A;font-weight:600}
  select.co-chip{appearance:none;-webkit-appearance:none;padding-right:24px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23c9c9cf' fill='none'/%3E%3C/svg%3E") no-repeat right 10px center}
  select.co-chip option{color:#000}
  .co-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
  .co-i{display:flex;gap:10px;align-items:center;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);color:inherit;font:inherit;text-align:left;cursor:pointer;min-width:0}
  .co-i:hover{border-color:rgba(255,255,255,.18)}.co-i b{display:block;font-size:13.5px;color:#fafafa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.co-i small{display:block;color:#8e8e96;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .co-b{width:34px;height:34px;border-radius:10px;flex:none;display:grid;place-items:center;overflow:hidden;font-weight:700;color:#fafafa;font-size:14px}
  .co-b img{max-width:70%;max-height:62%;object-fit:contain}
  .co-card{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:start}.co-card .co-b{width:58px;height:58px;border-radius:16px;font-size:22px}
  .co-card h3{font-size:20px;letter-spacing:-.02em;color:#fafafa;margin:0}.co-kv{display:flex;gap:22px;flex-wrap:wrap;margin-top:10px}
  .co-kv small{display:block;color:#8e8e96;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.co-kv b{color:#fafafa;font-size:14px}
  .co-act{display:flex;flex-direction:column;gap:8px}.co-btn{border-radius:99px;padding:9px 14px;font-size:13.5px;font-weight:600;text-align:center;border:1px solid rgba(255,255,255,.14);color:#fafafa;text-decoration:none;white-space:nowrap;background:none;font-family:inherit;cursor:pointer}
  .co-btn.p{background:#FF7A1A;color:#000;border-color:#FF7A1A}
  .co-back{color:#8e8e96;font-size:13px;margin:0 0 10px;background:none;border:0;font-family:inherit;cursor:pointer;padding:0}
  .co-zt{position:fixed;z-index:60;pointer-events:none;background:rgba(14,14,17,.96);border:1px solid #2c2c31;border-radius:10px;padding:7px 10px;font:13px Inter,sans-serif;color:#ececef}.co-zt small{display:block;color:#8a8a92;font-size:11.5px;margin-top:2px}
  .co-note{color:#6e6e76;font-size:11.5px;margin-top:10px}.co-empty{color:#8e8e96;font-size:13.5px;padding:10px 2px}
  .act-c.co-c{display:block!important;grid-template-columns:none!important;max-height:none!important;overflow:auto!important;flex:1;min-height:0}
  #act:has(.co-c){height:min(380px,48vh)!important;display:flex!important;flex-direction:column}
  #act:has(.co-card){height:auto!important}
  .mkd-a.co-on{height:min(380px,46vh)!important;display:flex!important;flex-direction:column}.mkd-a.co-on .mkd-cs{display:block;overflow:auto;flex:1;min-height:0}.mkd-a:has(.co-card){height:auto!important}
  .act-h,.mkd-th{flex-wrap:nowrap;min-width:0}.act-h button,.mkd-th button{white-space:nowrap;flex:none}.act-r,.mkd-th em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.act-r>*{flex:none}
  .co-float{position:fixed;left:10px;right:10px;bottom:96px;z-index:60;background:rgba(14,14,16,.97);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);backdrop-filter:blur(18px)}
  .co-float .co-card{grid-template-columns:auto 1fr}.co-float .co-card .co-b{width:46px;height:46px;border-radius:13px}.co-float h3{font-size:18px}.co-float .co-kv{gap:14px;margin-top:6px}.co-float .co-note{display:none}
  @media(max-width:760px){.co-card{grid-template-columns:auto 1fr}.co-act{grid-column:1/-1;flex-direction:row;flex-wrap:wrap}.co-list{grid-template-columns:1fr 1fr;max-height:none}}`;
  document.head.append(css);

  const load = Promise.all(['data/companies.json', 'assets/globe/company-hq.json', 'assets/logos/badges.json']
    .map(u => fetch(ROOT + u).then(r => r.ok ? r.json() : null).catch(() => null))).then(([dir, hq, badges]) => {
    const H = hq?.companies || {}, B = badges || {}, seen = new Set();
    for (const c of dir?.companies || []) {
      const l = c.listings.find(x => H[x.s]) || (H['co:' + c.slug] && { s: 'co:' + c.slug, exchange: null, tracked: false, unlisted: true }); if (!l) continue;  // unlisted companies: HQ keyed co:<slug>
      const h = H[l.s], id = h.qid || h.lei || c.slug; if (seen.has(id)) continue; seen.add(id);  // one entry per company (duplicate directory rows share a Wikidata item or LEI)
      // short name: Wikidata's label, or ours for GLEIF rows (their names are legal names in capitals)
      S.list.push({ slug: c.slug, name: c.name, short: h.qid ? (h.company_label || c.name) : c.name, country: c.country, cc: c.cc, region: c.region, listed: !l.unlisted, sym: l.s, ex: l.exchange, tracked: l.tracked !== false,
        syms: c.listings.map(x => x.s), hq: h, badge: B[c.slug] || null });
    }
    S.list.sort((a, b) => a.name.localeCompare(b.name));
    S.ready = true;
    const want = new URLSearchParams(location.search).get('company');
    if (want) select(want, true); else refresh();
  });

  // ---- data helpers ----
  const inNews = () => { const set = new Set(); for (const s of (typeof stories !== 'undefined' ? stories : [])) for (const e of s.entities || []) if (e.ticker) set.add(String(e.ticker).toUpperCase()); return set; };
  function filtered() {
    const q = S.q.trim().toLowerCase(), N = S.news ? inNews() : null;
    return S.list.filter(c => (!S.country || c.country === S.country) && (!q || (c.name + ' ' + c.short + ' ' + c.syms.join(' ') + ' ' + c.hq.hq_city).toLowerCase().includes(q))
      && (!N || c.syms.some(s => N.has(s.toUpperCase()) || N.has(s.split('.')[0].toUpperCase()))));
  }
  const countries = () => Object.entries(S.list.reduce((m, c) => (m[c.country] = (m[c.country] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
  const find = sym => S.list.find(c => c.syms.includes(sym) || c.slug === sym);

  // ---- badge (style D: grey tile, soft brand-colour wash, thin brand ring) ----
  const tint = c => c.badge?.c || '#9a9aa3';
  function badgeHTML(c) {
    const t = tint(c), bg = `background:linear-gradient(160deg,${t}38,${t}12),#1e1e22;box-shadow:inset 0 0 0 1.5px ${t}99`;
    return `<span class="co-b" style="${bg}">${c.badge ? `<img src="${esc(ROOT + c.badge.f)}" alt="" loading="lazy">` : esc(c.short[0] || '?')}</span>`;
  }
  function img(c) {
    if (!c.badge) return null;
    let i = S.img[c.slug]; if (!i) { i = S.img[c.slug] = new Image(); i.src = ROOT + c.badge.f; }
    return i.complete && i.naturalWidth ? i : null;
  }

  // ---- panel ----
  function panelHTML() {
    if (!S.ready) return '<div class="co-empty">Loading companies…</div>';
    if (S.sel) {
      const c = S.sel;
      return `<div class="co-wrap"><button type="button" class="co-back" data-co-back>‹ ${S.country ? esc(S.country) + ' · ' : ''}${filtered().length} companies</button>
        <div class="co-card">${badgeHTML(c)}<div><h3>${esc(c.name)}</h3><div class="co-kv"><div><small>Headquarters</small><b>${esc(c.hq.hq_city)}, ${esc(c.country)}</b></div><div><small>${c.listed ? 'Listed on' : 'Stock exchange'}</small><b>${c.listed ? esc(c.ex || '') + ' · ' + esc(c.sym.replace(/^[A-Z]+:/, '').replace(/^[A-Z0-9]+:/, '')) : 'Not listed'}</b></div><div><small>Region</small><b>${esc(c.region || '')}</b></div></div>
        <p class="co-note">HQ source: <a href="${esc(c.hq.source_url)}" target="_blank" rel="noopener" style="color:inherit">${/gleif/.test(c.hq.method || '') ? 'GLEIF LEI register (CC0)' : 'Wikidata (CC0)'}</a>, checked ${esc(c.hq.checked_at)}.</p></div>
        <div class="co-act"><a class="co-btn p" href="${esc(ROOT)}${c.tracked ? 'asset.html?s=' + encodeURIComponent(c.sym) : 'companies/' + encodeURIComponent(c.slug)}" target="_top">Company page</a><a class="co-btn" href="${esc(ROOT)}news.html?q=${encodeURIComponent(c.short)}" target="_top">Articles about ${esc(c.short)}</a></div></div></div>`;
    }
    const L = filtered();
    return `<div class="co-wrap"><div class="co-tools"><input class="co-s" type="search" placeholder="Search ${S.list.length} companies" value="${esc(S.q)}" data-co-q aria-label="Search companies">
      <button type="button" class="co-chip" aria-pressed="${S.news}" data-co-news>In the news</button>
      <select class="co-chip" data-co-country aria-label="Country"><option value="">All countries</option>${countries().map(([n, k]) => `<option value="${esc(n)}"${n === S.country ? ' selected' : ''}>${esc(n)} · ${k}</option>`).join('')}</select></div>
      ${L.length ? `<div class="co-list">${L.slice(0, 120).map(c => `<button type="button" class="co-i" data-co="${esc(c.slug)}">${badgeHTML(c)}<span style="min-width:0"><b>${esc(c.name)}</b><small>${esc(c.hq.hq_city)} · ${c.listed ? esc(c.sym.replace(/^[A-Z]+:/, '').replace(/^[A-Z0-9]+:/, '')) : 'Not listed'}</small></span></button>`).join('')}</div>`
        : '<div class="co-empty">No company matches. Companies appear here once their head office is sourced.</div>'}
      <p class="co-note">${L.length} companies. Zoomed out, deeper orange means more companies (compared with other countries); click a country to list them, or zoom in for logos.</p></div>`;
  }
  const isPhone = () => typeof phone === 'function' && phone();
  function floatCard() {  // phone: the sheet closes so the globe shows the pin; the company sits in a compact card above the dock
    let f = document.querySelector('.co-float');
    if (!isPhone() || !S.sel) { f?.remove(); return; }
    if (!f) { f = document.createElement('div'); f.className = 'co-float'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Company'); document.body.append(f); }
    f.innerHTML = panelHTML().replace('data-co-back>‹', 'data-co-list>‹');
  }
  const inMarkets = () => typeof MARKET !== 'undefined' && MARKET.on;
  function refresh() {
    if (inMarkets() && typeof mkdRender === 'function') mkdRender();
    else if (typeof renderAct === 'function') renderAct();
    if (typeof render === 'function' && isPhone()) render();
    floatCard();
  }
  function fitTo(L) {  // centre on the companies and zoom so their spread fills the view (wide countries zoom out more)
    const la = L.map(c => c.hq.hq_lat), lo = L.map(c => c.hq.hq_lon), span = Math.max(Math.max(...la) - Math.min(...la), (Math.max(...lo) - Math.min(...lo)) * .7, 2);
    const z = Math.max(1.6, Math.min(7, 22 / span));
    flyTo((Math.max(...lo) + Math.min(...lo)) / 2, (Math.max(...la) + Math.min(...la)) / 2 - span * .45, z);  // aim lower: the open panel covers the bottom of the globe
  }
  function select(sym, open) {
    const c = typeof sym === 'string' ? find(sym) : sym; if (!c) return false;
    S.sel = c; S.open = true;
    if (open) { try { if (!inMarkets()) document.querySelector('#gswitch [data-m=markets]')?.click(); mkTab = 'co'; } catch {} }
    if (isPhone()) { try { setSheet('closed'); } catch {} }
    if (typeof flyTo === 'function') flyTo(c.hq.hq_lon, c.hq.hq_lat - (isPhone() ? 1.2 : 2.2), 5.5);
    refresh(); return true;
  }
  document.addEventListener('click', e => {
    const it = e.target.closest('[data-co]'); if (it) { select(it.dataset.co); return; }
    if (e.target.closest('[data-co-back]')) { S.sel = null; refresh(); return; }
    if (e.target.closest('[data-co-list]')) { S.sel = null; refresh(); try { setSheet('full'); } catch {} return; }
    if (e.target.closest('[data-co-news]')) { S.news = !S.news; S.sel = null; refresh(); }
  });
  document.addEventListener('change', e => { if (e.target.matches('[data-co-country]')) { S.country = e.target.value; S.sel = null; const L = filtered(); refresh(); if (L.length && typeof flyTo === 'function') fitTo(L); } });
  let qt; document.addEventListener('input', e => { if (!e.target.matches('[data-co-q]')) return; S.q = e.target.value; S.sel = null; clearTimeout(qt); qt = setTimeout(() => { const pos = e.target.selectionStart; refresh(); const n = document.querySelector('[data-co-q]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 180); });

  // ---- globe pins: only the current list (or the selected company), spaced out when they overlap ----
  const circ = (x, y, r, f) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = f; ctx.fill(); };
  function draw() {
    if (!S.ready) return;
    S.hits = []; S.zones = null; if (!active()) return;
    const narrowed = S.country || S.q.trim() || S.news;
    if (!narrowed && !S.sel && typeof Z !== 'undefined' && Z < ZONE_Z) return zones();
    const all = filtered(), L = narrowed && all.length <= MAXPINS ? all : [];
    const list = S.sel ? [S.sel, ...L.filter(c => c !== S.sel)] : L;
    const placed = [], pos = [];
    if (!L.length || S.sel) {  // the whole list: every company is a dot, and a logo badge wherever one fits without covering another
      const rest = all.filter(c => c !== S.sel).sort((a, b) => (b.tracked - a.tracked) || (!!b.badge - !!a.badge));
      const dots = [], bad = [];
      if (S.sel) { const q = proj(S.sel.hq.hq_lat * rad, S.sel.hq.hq_lon * rad); if (q[2] > 0) placed.push({ x: q[0], y: q[1], r: 60 }); }
      for (const c of rest) {
        const q = proj(c.hq.hq_lat * rad, c.hq.hq_lon * rad); if (q[2] <= 0) continue;
        dots.push(q); S.hits.push({ c, x: q[0], y: q[1], r: 7 });
        if (S.sel || placed.some(p => Math.hypot(p.x - q[0], p.y - q[1]) < p.r + 13 + 3)) continue;
        placed.push({ x: q[0], y: q[1], r: 13 }); bad.push({ c, x: q[0], y: q[1], r: 13, ax: q[0], ay: q[1], fade: Math.min(1, q[2] * 3) });
      }
      ctx.save(); ctx.fillStyle = 'rgba(255,170,110,.85)';
      for (const q of dots) { ctx.globalAlpha = Math.min(1, q[2] * 3); ctx.beginPath(); ctx.arc(q[0], q[1], 2.2, 0, 7); ctx.fill(); }
      ctx.restore(); pos.push(...bad.reverse());
      for (const p of bad) S.hits.push({ c: p.c, x: p.x, y: p.y, r: 15 });
    }
    for (const c of list) {
      const q = proj(c.hq.hq_lat * rad, c.hq.hq_lon * rad); if (q[2] <= 0) continue;
      const sel = c === S.sel, r = sel ? 22 : 16; let x = q[0], y = q[1];
      if (!sel) for (let k = 0; k < 24 && placed.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + 4); k++) { const a = -Math.PI / 2 + k * .9, d = r * 2.3 * (1 + Math.floor(k / 7) * .6); x = q[0] + Math.cos(a) * d; y = q[1] + Math.sin(a) * d; }
      S.hits.push({ c, x, y, r: r + 2 });
      placed.push({ x, y, r }); if (sel) for (let d = 60; d <= 220; d += 35) placed.push({ x: x + (x > innerWidth - 260 ? -d : d), y, r: 22 });
      pos.push({ c, x, y, r, ax: q[0], ay: q[1], sel, fade: Math.min(1, q[2] * 3) });
    }
    ctx.save();
    for (const p of pos) if (Math.hypot(p.x - p.ax, p.y - p.ay) > 2) { ctx.globalAlpha = p.fade; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.x, p.y); ctx.stroke(); circ(p.ax, p.ay, 2.4, '#fff'); }
    for (const p of [...pos].reverse()) {
      const { c, x, y, r, sel } = p, t = tint(c); ctx.globalAlpha = p.fade;
      if (sel) { const g = ctx.createRadialGradient(x, y, 0, x, y, 54); g.addColorStop(0, 'rgba(255,122,26,.5)'); g.addColorStop(1, 'rgba(255,122,26,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 54, 0, 7); ctx.fill(); circ(x, y, r + 3, '#FF7A1A'); }
      else circ(x, y, r + 2, 'rgba(0,0,0,.6)');
      circ(x, y, r, '#1e1e22'); circ(x, y, r, t + '38'); ctx.strokeStyle = t + 'aa'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r - .8, 0, 7); ctx.stroke();
      const im = img(c);
      if (im) { const s = Math.min(r * 1.25 / im.width, r * 1.25 / im.height); ctx.drawImage(im, x - im.width * s / 2, y - im.height * s / 2, im.width * s, im.height * s); }
      else { ctx.fillStyle = '#fafafa'; ctx.font = `700 ${Math.round(r * .8)}px Inter,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.short[0] || '?', x, y + 1); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic'; }
      if (sel) {
        const txt = c.short + ' · HQ ' + c.hq.hq_city; ctx.font = '600 14px Inter,sans-serif'; const w = ctx.measureText(txt).width + 22, left = x + r + 12 + w > innerWidth - 8;
        let bx = left ? x - r - 12 - w : x + r + 12, by = y - 16;
        if (bx < 8) { bx = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)); by = y + r + 10; }  // no room either side: label below the pin
        ctx.fillStyle = 'rgba(12,12,14,.94)'; ctx.strokeStyle = 'rgba(255,122,26,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, w, 32, 16); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fafafa'; ctx.fillText(txt, bx + 11, by + 21);
      }
    }
    ctx.restore();
  }

  function active() {
    return inMarkets() && typeof mkTab !== 'undefined' && mkTab === 'co';  // Markets globe only (owner, 19 Nov 2026)
  }
  // ---- colour zones (owner 19 Nov 2026): zoomed out, each country is filled by how many companies are based there.
  // The shade comes from the country's RANK among countries with companies (not the raw count), so the map always uses
  // the full range: it reads as full today and stays balanced as the directory grows to thousands. Zoom in for logos.
  const ZONE_Z = 2.4;
  function zones() {
    if (!S.iso && typeof ISO !== 'undefined') { S.iso = {}; for (const [n, k] of Object.entries(ISO)) if (byName[n]) S.iso[k] = n; }  // globe country name by ISO code
    const G = {}; for (const c of S.list) { const n = (S.iso && c.cc && S.iso[c.cc.toUpperCase()]) || c.country; (G[n] = G[n] || []).push(c); }
    const rows = Object.entries(G).filter(([n]) => typeof byName !== 'undefined' && byName[n]).sort((a, b) => a[1].length - b[1].length);
    const rank = new Map(rows.map(([n], i) => [n, rows.length > 1 ? i / (rows.length - 1) : 1]));
    S.zones = { G, rank };
    ctx.save();
    for (const [n] of rows) { const c = byName[n], k = rank.get(n);
      ctx.fillStyle = `rgba(255,${Math.round(165 - 85 * k)},${Math.round(70 - 50 * k)},${(.22 + .6 * k).toFixed(2)})`; ctx.beginPath();
      for (const ring of c.rings) { let on = false; for (const [lo, la] of ring) { const q = proj(la * rad, lo * rad); if (q[2] <= 0) { on = false; continue; } on ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); on = true; } ctx.closePath(); }
      ctx.fill(); }
    const B = []; ctx.font = '600 12px Inter,sans-serif'; ctx.textBaseline = 'middle';
    for (const [n, L] of [...rows].reverse().slice(0, 16)) { const c = byName[n], q = proj(c.c[1] * rad, c.c[0] * rad); if (q[2] < .3 || B.some(b => Math.hypot(b[0] - q[0], b[1] - q[1]) < 74)) continue; B.push(q);
      const t = nmC(n), s = String(L.length), w = ctx.measureText(t).width + ctx.measureText(s).width + 22;
      ctx.fillStyle = 'rgba(12,12,14,.9)'; ctx.beginPath(); ctx.roundRect(q[0] - w / 2, q[1] - 10, w, 20, 10); ctx.fill(); ctx.strokeStyle = 'rgba(255,122,26,.35)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ececef'; ctx.fillText(t, q[0] - w / 2 + 8, q[1] + 1); ctx.fillStyle = '#ff9d5c'; ctx.fillText(s, q[0] + w / 2 - 8 - ctx.measureText(s).width, q[1] + 1); }
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }
  const nmC = n => (typeof nm === 'function' ? nm(n) : n);
  function zoneAt(x, y) { if (!S.zones || typeof inv !== 'function' || typeof countryAt !== 'function') return null; const g = inv(x, y), c = g && countryAt(g[0], g[1]); return c && S.zones.G[c.name] ? c.name : null; }
  let zt; addEventListener('mousemove', e => { const n = active() && e.target.tagName === 'CANVAS' ? zoneAt(e.clientX, e.clientY) : null; let t = document.querySelector('.co-zt');
    if (!n) { t?.remove(); return; } if (!t) { t = document.createElement('div'); t.className = 'co-zt'; document.body.append(t); }
    const L = S.zones.G[n], top = L.filter(c => c.tracked).concat(L.filter(c => !c.tracked)).slice(0, 3).map(c => esc(c.short)).join(', ');
    t.innerHTML = `<b>${esc(nmC(n))}</b> · ${L.length} ${L.length === 1 ? 'company' : 'companies'}<small>${top}${L.length > 3 ? '…' : ''}</small><small>Click to see them</small>`; t.style.left = (e.clientX + 16) + 'px'; t.style.top = (e.clientY + 12) + 'px'; });
  function tap(x, y) {  // a click on a company pin or dot opens it; true if handled
    if (!active()) return false;
    const z = zoneAt(x, y); if (z) { S.country = z; S.sel = null; document.querySelector('.co-zt')?.remove(); refresh(); fitTo(filtered()); return true; }  // zones: click a country to list its companies
    if (!S.hits?.length) return false;
    const h = [...S.hits].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!h || Math.hypot(h.x - x, h.y - y) > Math.max(h.r, 9)) return false;
    select(h.c); return true;
  }

  // ---- search: "Company HQs" section on the globe ----
  function searchHits(q) {
    q = (q || '').trim().toLowerCase(); if (!S.ready || q.length < 2) return [];
    return S.list.filter(c => (c.name + ' ' + c.short + ' ' + c.syms.join(' ')).toLowerCase().includes(q)).slice(0, 5);
  }

  window.InvCompanies = { ready: load, panelHTML, draw, tap, active, select, searchHits, badgeHTML, open: () => { S.open = true; }, state: S };
  if (window.InvGlobeNav) window.InvGlobeNav.company = sym => select(sym, true);
})();
