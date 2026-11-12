// Alerts in the bell panel (alerts v2, 12 Nov 2026).
//  Alerts: email when a new article is about something you follow (watchlist stars). Unlimited.
//  Smart alerts: price move / market-moving only / sector news (more types soon). Free: 3 per 7 days from your first one, email only.
//  Pro: unlimited, push and/or email per alert (locked until Pro launches). Everything is saved to the member's account (Supabase).
(() => {
  const api = () => ((window.INV_CONFIG && window.INV_CONFIG.apiBaseUrl) || '').replace(/\/$/, '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATS = ['companies', 'economy', 'markets', 'commodities', 'technology', 'geopolitics', 'crypto'];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const ICON = { price: '<path d="M4 19V5M4 19h16M7 15l4-5 3 3 5-7"/>', market_moving: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>', sector: '<path d="M4 20V9l5 3V9l5 3V6l6 4v10z"/>', country_price: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/>', release: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', combined: '<path d="M4 7h7v7H4zM13 10h7v7h-7z"/>' };
  const TYPES = [['price', 'Price move', 'An asset moves more than you set'], ['market_moving', 'Market-moving only', 'Only articles marked market-moving'], ['sector', 'Sector news', 'Articles in a sector you pick'],
    ['country_price', 'Country + price', 'Coming soon'], ['release', 'Before a release', 'Coming soon'], ['combined', 'Combine', 'Coming soon']];
  const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  let cfg = null, S = { contact: null, smart: [], quota: null, plan: 'free', view: 'list', draft: null, busy: false, error: '', assets: null };
  const config = () => cfg ? Promise.resolve(cfg) : fetch(api() + '/v1/alerts/config').then(r => r.json()).then(j => (cfg = j.data)).catch(() => (cfg = { enabled: false, freeSmartAlerts: 3 }));
  const sbc = () => window.invSB();
  async function load() {
    const u = window.invUser; if (!u) return paint();
    try { const sb = await sbc();
      const [c, s, q, p] = await Promise.all([sb.from('alert_contacts').select('alerts_on,muted,unsubscribed_at').eq('user_id', u.id).maybeSingle(), sb.from('smart_alerts').select('id,type,params,channels,active,created_at').eq('user_id', u.id).order('created_at'),
        sb.from('smart_alert_quota').select('period_start,used').eq('user_id', u.id).maybeSingle(), sb.from('member_plans').select('plan').eq('user_id', u.id).maybeSingle()]);
      S.contact = c.data || null; S.smart = s.data || []; S.quota = q.data || null; S.plan = (p.data && p.data.plan) || 'free';
    } catch {}
    paint();
  }
  // Free quota: 3 per 7-day period starting at the first smart alert (the database enforces it; this only shows it).
  function quota() { const max = (cfg && cfg.freeSmartAlerts) || 3, q = S.quota; if (!q) return { used: 0, left: max, renews: null, max };
    let start = Date.parse(q.period_start), used = q.used; const wk = 7 * 864e5; if (Date.now() >= start + wk) { start += Math.floor((Date.now() - start) / wk) * wk; used = 0; }
    return { used, left: Math.max(0, max - used), renews: new Date(start + wk), max }; }
  const on = () => !!S.contact && S.contact.alerts_on !== false && !S.contact.unsubscribed_at;
  async function setAlerts(v) {
    S.busy = true; S.error = ''; paint();
    try { const c = await config(); if (!c.enabled) throw Error('Email alerts are not switched on yet. Please try again soon.');
      const sb = await sbc(), u = window.invUser; const { error } = await sb.from('alert_contacts').upsert({ user_id: u.id, email: u.email, alerts_on: v, unsubscribed_at: null, updated_at: new Date().toISOString() });
      if (error) throw Error('Could not save. Please try again.'); S.contact = { ...(S.contact || {}), alerts_on: v, unsubscribed_at: null };
    } catch (e) { S.error = e.message; }
    S.busy = false; paint();
  }
  async function toggleMute(key) {
    const m = new Set((S.contact && S.contact.muted) || []); m.has(key) ? m.delete(key) : m.add(key);
    try { const sb = await sbc(); await sb.from('alert_contacts').update({ muted: [...m], updated_at: new Date().toISOString() }).eq('user_id', window.invUser.id); S.contact = { ...S.contact, muted: [...m] }; } catch {}
    paint();
  }
  async function createSmart() {
    const d = S.draft; S.busy = true; S.error = ''; paint();
    try { if (!(await config()).enabled) throw Error('Smart alerts are not switched on yet. Please try again soon.');
      if (!on()) await setAlerts(true);
      const sb = await sbc(); const { error } = await sb.from('smart_alerts').insert({ user_id: window.invUser.id, type: d.type, params: d.params, channels: S.plan === 'pro' ? d.channels : ['email'] });
      if (error) throw Error(/quota/.test(error.message || '') ? 'You have used your 3 free smart alerts for this week.' : 'Could not save. Please try again.');
      S.view = 'list'; S.draft = null; await load();
    } catch (e) { S.error = e.message; }
    S.busy = false; paint();
  }
  async function removeSmart(id) { try { const sb = await sbc(); await sb.from('smart_alerts').delete().eq('id', id); S.smart = S.smart.filter(x => x.id !== id); } catch {} paint(); }
  const describe = a => { const p = a.params || {};
    if (a.type === 'price') return [`${p.name || p.symbol} ${p.dir === 'up' ? 'rises' : p.dir === 'down' ? 'falls' : 'moves'} more than ${p.pct}%`, 'Price move · 1 day'];
    if (a.type === 'market_moving') return [p.scope === 'follows' ? 'Market-moving news on what I follow' : 'All market-moving news', 'Market-moving only'];
    if (a.type === 'sector') return [cap(p.category || '') + (p.market_moving_only ? ' · market-moving only' : ''), 'Sector news'];
    return [a.type, '']; };
  async function assets() { if (S.assets) return S.assets;
    try { const [m, p] = await Promise.all([fetch('assets/globe/markets.json').then(r => r.json()), fetch(api() + '/v1/prices?group=all').then(r => r.json()).catch(() => ({ data: {} }))]);
      const live = new Set(Object.keys(p.data || {})); S.assets = (m.assets || []).filter(a => a.t !== 'fx' && (!live.size || live.has(a.s))).map(a => ({ s: a.s, n: a.n }));
    } catch { S.assets = []; } return S.assets; }
  function chips(name, opts, val) { return `<span class="al-chips">${opts.map(([v, l]) => `<button type="button" class="al-chip${String(v) === String(val) ? ' on' : ''}" data-set="${name}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</span>`; }
  function newView() {
    const d = S.draft || (S.draft = { type: 'price', params: { dir: 'either', pct: 5 }, channels: ['email'] }), p = d.params, q = quota(), pro = S.plan === 'pro';
    const cards = TYPES.map(([k, t, desc]) => { const soon = desc === 'Coming soon'; return `<button type="button" class="al-type${d.type === k ? ' on' : ''}" data-type="${k}"${soon ? ' disabled' : ''}>${svg(k)}<b>${t}</b><span>${desc}</span></button>`; }).join('');
    let opts = '';
    if (d.type === 'price') { const follows = ((window.INVWATCH && window.INVWATCH.all()) || []).filter(x => x.kind === 'asset');
      opts = `<div class="al-row"><span>Asset</span><span class="al-asset"><input id="al-asset" list="al-assets" placeholder="Search an asset" value="${esc(p.name || '')}" autocomplete="off"><datalist id="al-assets">${follows.map(a => `<option value="${esc(a.n || a.s)}">`).join('')}</datalist></span></div>
        <div class="al-row"><span>Moves</span>${chips('dir', [['up', 'up'], ['down', 'down'], ['either', 'either']], p.dir)}</div>
        <div class="al-row"><span>By more than</span>${chips('pct', [[2, '2%'], [3, '3%'], [5, '5%'], [10, '10%']], p.pct)}</div><div class="al-row"><span>Within</span><span class="al-t">1 day</span></div>`; }
    if (d.type === 'market_moving') opts = `<div class="al-row"><span>Which news</span>${chips('scope', [['all', 'All'], ['follows', 'What I follow']], p.scope || 'all')}</div>`;
    if (d.type === 'sector') opts = `<div class="al-row"><span>Sector</span><select id="al-cat">${CATS.map(c => `<option value="${c}"${p.category === c ? ' selected' : ''}>${cap(c)}</option>`).join('')}</select></div>
        <div class="al-row"><span>Only market-moving</span><button type="button" class="al-sw${p.market_moving_only ? ' on' : ''}" data-set="market_moving_only" data-v="${p.market_moving_only ? '' : '1'}" role="switch" aria-checked="${!!p.market_moving_only}"></button></div>`;
    const send = pro ? chips('ch', [['email', 'Email'], ['push', 'Push'], ['both', 'Both']], d.channels.length > 1 ? 'both' : d.channels[0]) : `<span class="al-chips"><span class="al-chip on">Email</span><span class="al-chip lock">Push · PRO</span></span>`;
    const ready = d.type === 'price' ? !!p.symbol : d.type === 'sector' ? !!p.category : true;
    return `<div class="al-top"><b>New smart alert</b><button type="button" class="al-x" data-al="back" aria-label="Back">×</button></div><p class="al-t">Choose what should trigger it.</p>
      <div class="al-types">${cards}</div>${opts}<div class="al-row"><span>Send to</span>${send}</div>
      <div class="al-actions"><button type="button" class="al-btn pri" data-al="create"${!ready || S.busy || (!pro && !q.left) ? ' disabled' : ''}>${pro ? 'Create' : q.left ? `Create · uses 1 of ${q.left} left` : 'No free smart alerts left this week'}</button><button type="button" class="al-btn" data-al="back">Cancel</button></div>${S.error ? `<p class="al-err">${esc(S.error)}</p>` : ''}`;
  }
  function listView() {
    const u = window.invUser, follows = (window.INVWATCH && window.INVWATCH.all()) || [], q = quota(), pro = S.plan === 'pro', muted = new Set((S.contact && S.contact.muted) || []);
    if (!u) return `<div class="al-top"><b>Alerts</b></div><p class="al-t">Get an email when news lands on what you follow, plus smart alerts for price moves and market-moving news.</p><button type="button" class="al-btn pri" data-al="login">Log in to turn on alerts</button>`;
    const fl = follows.slice(0, 6).map(x => { const key = x.kind === 'country' ? 'c:' + x.k : 'a:' + String(x.s || '').toUpperCase(), name = x.kind === 'country' ? x.k : (x.n || x.s), act = on() && !muted.has(key);
      return `<div class="al-row"><div><b>${esc(name)}</b><div class="al-t">Every new article · ${pro ? 'Push + email' : 'Email'}</div></div><button type="button" class="al-sw${act ? ' on' : ''}" role="switch" aria-checked="${act}" aria-label="Alerts for ${esc(name)}" data-mute="${esc(key)}"${on() ? '' : ' disabled'}></button></div>`; }).join('');
    const main = `<div class="al-top"><b>Alerts</b><button type="button" class="al-sw${on() ? ' on' : ''}" role="switch" aria-checked="${on()}" aria-label="Email alerts" data-al="${on() ? 'off' : 'on'}"${S.busy ? ' disabled' : ''}></button></div>
      <p class="al-t">New articles about what you follow. Unlimited${pro ? '' : ', by email'}.</p>${follows.length ? fl + (follows.length > 6 ? `<div class="al-row"><span class="al-t">+${follows.length - 6} more</span><a class="al-t" href="watchlist.html">Manage</a></div>` : '') : `<div class="al-row"><span class="al-t">Tap ☆ on a country or asset to follow it.</span></div>`}`;
    const sm = S.smart.map(a => { const [t, d] = describe(a); return `<div class="al-row"><div><b>${esc(t)}</b><div class="al-t">${esc(d)} · ${pro ? esc((a.channels || ['email']).map(cap).join(' + ')) : 'Email'}</div></div><button type="button" class="al-x" data-del="${esc(a.id)}" aria-label="Delete smart alert">×</button></div>`; }).join('');
    const counter = pro ? 'Unlimited' : q.renews ? `${q.used} of ${q.max} used · renews ${q.renews.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : `${q.max} free`;
    return main + `<div class="al-top al-smart"><b>Smart alerts</b><span class="al-t">${counter}</span></div><p class="al-t">Only when it really matters.</p>${sm}
      <div class="al-row"><button type="button" class="al-btn pri" data-al="new"${!pro && !q.left ? ' disabled' : ''}>+ New smart alert</button><span class="al-t">${pro ? '' : q.left ? q.left + ' left' : 'Next on ' + q.renews.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
      ${pro ? '' : `<div class="al-row al-pro"><div><b>Push, and unlimited smart alerts</b> <span class="al-pro-tag">PRO</span></div><a class="al-unlock" href="pricing.html#waitlist">Unlock</a></div>`}${S.error ? `<p class="al-err">${esc(S.error)}</p>` : ''}`;
  }
  function paint() { const nd = document.getElementById('notif-dd'); if (!nd) return; let el = nd.querySelector('.al-wrap'); if (!el) { el = document.createElement('div'); el.className = 'al-wrap'; nd.prepend(el); } el.innerHTML = `<div class="al-box">${S.view === 'new' ? newView() : listView()}</div>`; }
  document.addEventListener('click', async e => {
    const t = e.target.closest('.al-wrap [data-al], .al-wrap [data-mute], .al-wrap [data-del], .al-wrap [data-type], .al-wrap [data-set]'); if (!t) return; e.stopPropagation();
    if (t.dataset.mute) return toggleMute(t.dataset.mute);
    if (t.dataset.del) return removeSmart(t.dataset.del);
    if (t.dataset.type) { S.draft = { type: t.dataset.type, params: t.dataset.type === 'price' ? { dir: 'either', pct: 5 } : t.dataset.type === 'sector' ? { category: 'economy' } : { scope: 'all' }, channels: ['email'] }; return paint(); }
    if (t.dataset.set) { const k = t.dataset.set, v = t.dataset.v; if (k === 'ch') S.draft.channels = v === 'both' ? ['push', 'email'] : [v]; else S.draft.params[k] = k === 'pct' ? Number(v) : k === 'market_moving_only' ? !!v : v; return paint(); }
    const a = t.dataset.al; if (a === 'on') setAlerts(true); else if (a === 'off') setAlerts(false); else if (a === 'login') document.getElementById('hdr-login')?.click();
    else if (a === 'new') { S.view = 'new'; S.error = ''; assets(); paint(); } else if (a === 'back') { S.view = 'list'; S.error = ''; paint(); } else if (a === 'create') createSmart();
  });
  document.addEventListener('change', async e => {
    if (e.target.id === 'al-cat') { S.draft.params.category = e.target.value; paint(); }
    if (e.target.id === 'al-asset') { const list = await assets(), v = e.target.value.trim().toLowerCase(), a = list.find(x => x.n.toLowerCase() === v || x.s.toLowerCase() === v) || ((window.INVWATCH && window.INVWATCH.all()) || []).find(x => (x.n || '').toLowerCase() === v);
      if (a) { S.draft.params.symbol = a.s; S.draft.params.name = a.n || a.s; S.error = ''; } else { delete S.draft.params.symbol; S.draft.params.name = e.target.value; S.error = 'Pick an asset from the list (price alerts work for assets with live prices).'; } paint(); }
  });
  const watchPanel = () => { const el = document.getElementById('notif-dd'); if (!el) return setTimeout(watchPanel, 300); new MutationObserver(() => { if (!el.querySelector('.al-wrap')) paint(); }).observe(el, { childList: true }); paint(); };
  window.addEventListener('inv-user', () => { config().then(load); });
  if (window.INVWATCH && window.INVWATCH.on) window.INVWATCH.on(paint);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchPanel); else watchPanel();
  config().then(load);
})();
