// Smart alerts: follow a country, asset or topic and get matching articles in the bell and by email.
// Free accounts can follow 5 things; Pro members have no limit. The database enforces the limit too.
// Data lives in Supabase tables alert_follows / alert_events / alert_settings (see backend emails/smart-alerts-setup.sql).
(() => {
  if (window.INVALERTS) return;
  const FREE = 5, KEY = 'inv-alert-follows', subs = new Set();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let user = null, follows = [], events = [], settings = { instant_email: true }, pro = false, ready = false;
  try { follows = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
  const ping = () => { try { localStorage.setItem(KEY, JSON.stringify(follows)); } catch {} subs.forEach(f => { try { f(); } catch {} }); paintButtons(); };
  const sb = () => window.invSB ? window.invSB() : Promise.reject(new Error('Accounts are not available here.'));
  const norm = (kind, ref) => kind === 'asset' ? String(ref).toUpperCase() : kind === 'topic' ? String(ref).toLowerCase() : String(ref).toUpperCase();
  const has = (kind, ref) => follows.some(f => f.kind === kind && f.ref === norm(kind, ref));

  async function load() {
    if (!user) { follows = []; events = []; pro = false; ready = true; ping(); return; }
    try {
      const c = await sb();
      const [f, e, s, p] = await Promise.all([
        c.from('alert_follows').select('id,kind,ref,label,created_at').order('created_at'),
        c.from('alert_events').select('id,article_id,kind,ref,label,headline,source,url,published_at,seen_at,created_at').order('created_at', { ascending: false }).limit(50),
        c.from('alert_settings').select('instant_email,digest').maybeSingle(),
        c.from('pro_members').select('user_id').maybeSingle()]);
      if (!f.error) follows = f.data || [];
      if (!e.error) events = e.data || [];
      if (!s.error && s.data) settings = s.data;
      pro = !p.error && !!p.data;
    } catch {}
    ready = true; ping();
  }

  async function toggle(kind, ref, label) {
    if (!user) { window.openAuth && openAuth('up'); return null; }
    ref = norm(kind, ref);
    const c = await sb();
    if (has(kind, ref)) {
      const { error } = await c.from('alert_follows').delete().eq('kind', kind).eq('ref', ref);
      if (error) throw error;
      follows = follows.filter(f => !(f.kind === kind && f.ref === ref)); ping(); return false;
    }
    if (!pro && follows.length >= FREE) { limitCard(); return null; }
    const { data, error } = await c.from('alert_follows').insert({ user_id: user.id, kind, ref, label: label || ref }).select('id,kind,ref,label,created_at').single();
    if (error) { if (/free_follow_limit/.test(error.message || '')) { limitCard(); return null; } throw error; }
    follows = [...follows, data]; ping(); if (window.invTrack) invTrack('alert', kind + ':' + ref); return true;
  }

  async function markSeen(ids) {
    const now = new Date().toISOString(), want = new Set(ids || events.filter(e => !e.seen_at).map(e => e.id));
    if (!want.size || !user) return;
    events = events.map(e => want.has(e.id) ? { ...e, seen_at: now } : e); ping();
    try { const c = await sb(); await c.from('alert_events').update({ seen_at: now }).in('id', [...want]); } catch {}
  }

  async function setEmail(mode) {
    if (!user) return; settings = { ...settings, instant_email: mode === 'instant' }; ping();
    const c = await sb(); await c.from('alert_settings').upsert({ user_id: user.id, instant_email: mode === 'instant', updated_at: new Date().toISOString() });
  }

  // ---------- Pro mark: a small spark plus the word Pro ----------
  const SPARK = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>';
  const proMark = () => `<span class="pro-spark">${SPARK}Pro</span>`;

  // ---------- "you have used your 5 free alerts" card ----------
  function limitCard() {
    document.querySelector('.sa-limit')?.remove();
    const d = document.createElement('div'); d.className = 'sa-limit'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Free alert limit reached');
    d.innerHTML = `<div class="sa-limit-card"><button type="button" class="sa-x" aria-label="Close">×</button>
      <h2>You’re following ${FREE} of ${FREE} free alerts</h2>
      <p>Remove one on <a href="alerts.html">Manage alerts</a> to add another, or join the ${proMark()} waitlist for unlimited alerts.</p>
      <div class="sa-limit-act"><a class="btn" href="alerts.html">Manage alerts</a><a class="btn btn-pri" href="pricing.html#pro">Join the Pro waitlist</a></div></div>`;
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.sa-x')) d.remove(); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') d.remove(); });
    document.body.append(d); d.querySelector('.sa-x').focus();
  }

  // ---------- "Alert me" buttons anywhere: <button data-alert-kind="asset" data-alert-ref="NVDA" data-alert-label="Nvidia"> ----------
  const BELL = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>';
  function paintButtons() {
    document.querySelectorAll('[data-alert-kind][data-alert-ref]').forEach(b => {
      const on = has(b.dataset.alertKind, b.dataset.alertRef);
      b.classList.add('sa-btn'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      const nm = b.dataset.alertKind === 'topic' ? (b.dataset.alertLabel || b.dataset.alertRef) : (on ? 'Alerts on' : 'Alert me');
      b.innerHTML = `${BELL}<span>${nm}</span>`;
      b.title = on ? 'You get an alert when a new article matches. Click to stop.' : 'Get an alert when a new article matches';
    });
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-alert-kind][data-alert-ref]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); b.disabled = true;
    try { await toggle(b.dataset.alertKind, b.dataset.alertRef, b.dataset.alertLabel); } catch { b.title = 'Could not save. Please try again.'; }
    b.disabled = false; paintButtons();
  });
  new MutationObserver(() => { if (document.querySelector('[data-alert-kind]:not(.sa-btn)')) paintButtons(); }).observe(document.documentElement, { childList: true, subtree: true });

  // ---------- Manage alerts page (alerts.html) ----------
  const KIND = { country: 'Country', asset: 'Asset', topic: 'Topic' };
  const TOPICS = [['markets', 'Markets'], ['companies', 'Companies'], ['economy', 'Economy'], ['technology', 'Technology'], ['crypto', 'Crypto'], ['commodities', 'Commodities'], ['geopolitics', 'Geopolitics']];
  const when = t => { const m = Math.round((Date.now() - Date.parse(t)) / 60000); return m < 60 ? Math.max(m, 1) + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(); };
  function paintPage() {
    const root = document.getElementById('alerts-root'); if (!root) return;
    if (!user) { root.innerHTML = `<div class="sa-empty"><p>Log in to follow countries, assets and topics. Free accounts get ${FREE} alerts.</p><button class="btn btn-pri" type="button" data-auth="up">Create a free account</button></div>`;
      root.querySelector('[data-auth]').onclick = () => window.openAuth && openAuth('up'); return; }
    if (!ready) { root.innerHTML = '<p class="muted">Loading your alerts…</p>'; return; }
    const used = follows.length;
    root.innerHTML = `
      <section class="sa-card"><div class="sa-head"><h2>Following</h2><span class="sa-count">${pro ? `${used} followed · ${proMark()} unlimited` : `${used} of ${FREE} free alerts used`}</span></div>
        ${pro ? '' : `<div class="sa-meter" aria-hidden="true"><i style="width:${Math.min(100, used / FREE * 100)}%"></i></div>`}
        ${used ? `<ul class="sa-list">${follows.map(f => `<li><span class="sa-kind">${KIND[f.kind] || f.kind}</span><b>${esc(f.label || f.ref)}</b><button type="button" class="link" data-unf="${esc(f.kind)}|${esc(f.ref)}">Remove</button></li>`).join('')}</ul>`
          : '<p class="muted">You don’t follow anything yet. Press <b>Alert me</b> on an asset page or a country on the Globe, or pick a topic below.</p>'}
        <div class="sa-topics"><span>Topics:</span>${TOPICS.map(([k, n]) => `<button type="button" data-alert-kind="topic" data-alert-ref="${k}" data-alert-label="${n}"></button>`).join('')}</div>
        <p class="sa-note">Price-move alerts (for example “Nvidia moves 5%”) ${proMark()} need licensed live prices and are not available yet.</p></section>
      <section class="sa-card"><div class="sa-head"><h2>Email</h2></div>
        <div class="sa-seg" role="radiogroup" aria-label="Email alerts">${[['instant', 'Each article (max 10 a day)'], ['off', 'No emails, bell only']].map(([k, n]) => `<button type="button" role="radio" aria-checked="${(settings.instant_email ? 'instant' : 'off') === k}" data-em="${k}">${n}</button>`).join('')}</div>
        <p class="sa-note">A daily digest is part of ${proMark()}.</p></section>
      <section class="sa-card"><div class="sa-head"><h2>Recent alerts</h2>${events.some(e => !e.seen_at) ? '<button type="button" class="link" id="sa-seen">Mark all read</button>' : ''}</div>
        ${events.length ? `<ul class="sa-ev">${events.map(e => `<li class="${e.seen_at ? '' : 'unread'}"><a href="${e.article_id ? 'story.html?id=' + encodeURIComponent(e.article_id) : esc(e.url)}" data-eid="${esc(e.id)}"><b>${esc(e.headline)}</b><small>${esc(e.source || '')} · ${esc(e.label || e.ref || '')} · ${when(e.created_at)}</small></a></li>`).join('')}</ul>`
          : '<p class="muted">No alerts yet. New matching articles appear here and in the bell.</p>'}</section>`;
    root.querySelectorAll('[data-unf]').forEach(b => b.onclick = () => { const [k, r] = b.dataset.unf.split('|'); toggle(k, r).catch(() => {}); });
    root.querySelectorAll('[data-em]').forEach(b => b.onclick = () => setEmail(b.dataset.em).catch(() => {}));
    root.querySelector('#sa-seen')?.addEventListener('click', () => markSeen());
    root.querySelectorAll('[data-eid]').forEach(a => a.addEventListener('click', () => markSeen([a.dataset.eid])));
    paintButtons();
  }
  subs.add(paintPage);

  // Links like alerts.html?add=country&ref=FR&label=France (from the Globe) add a follow once the person is logged in
  const pending = (() => { const q = new URLSearchParams(location.search), k = q.get('add'), r = q.get('ref'); return k && r && KIND[k] ? { k, r, l: q.get('label') || r } : null; })();
  let pendingDone = false;
  subs.add(() => { if (!pending || pendingDone || !user || !ready) return; pendingDone = true; history.replaceState(null, '', location.pathname);
    if (!has(pending.k, pending.r)) toggle(pending.k, pending.r, pending.l).catch(() => {}); });
  window.addEventListener('inv-user', e => { const u = e.detail || null; if ((u && u.id) === (user && user.id)) return; user = u; ready = false; paintPage(); load(); });
  if (window.invUser) { user = window.invUser; load(); }
  document.addEventListener('DOMContentLoaded', () => { paintPage(); paintButtons(); });
  setInterval(() => { if (user && !document.hidden) load(); }, 120000);

  window.INVALERTS = { has, toggle, markSeen, setEmail, on: f => subs.add(f), limit: FREE, proMark,
    get follows() { return follows; }, get events() { return events; }, get unseen() { return events.filter(e => !e.seen_at).length; },
    get pro() { return pro; }, get user() { return user; } };
})();
