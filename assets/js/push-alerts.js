// Alerts box at the top of the bell panel (12 Nov 2026). Free: instant push, 3 alerts a week (reset Monday 00:00 UTC).
// Follows come from the watchlist (stars). The browser subscription is saved to the member's account (Supabase), never to local storage.
(() => {
  const api = () => ((window.INV_CONFIG && window.INV_CONFIG.apiBaseUrl) || '').replace(/\/$/, '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const week = t => { const d = new Date(t); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7)); const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return d.getUTCFullYear() + '-W' + String(1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7)).padStart(2, '0'); };
  const b64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const iosNeedsInstall = () => /iP(hone|ad|od)/.test(navigator.userAgent) && !(window.navigator.standalone || matchMedia('(display-mode: standalone)').matches);
  let cfg = null, state = { on: false, sent: 0, busy: false, error: '' };
  const config = () => cfg ? Promise.resolve(cfg) : fetch(api() + '/v1/alerts/config').then(r => r.json()).then(j => (cfg = j.data)).catch(() => (cfg = { enabled: false, freePerWeek: 3 }));
  async function refresh() {
    const u = window.invUser; if (!u || !supported()) return paint();
    try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); state.on = !!sub && Notification.permission === 'granted'; } catch {}
    try { const sb = await window.invSB(); const { data } = await sb.from('alert_log').select('sent').eq('user_id', u.id).eq('week', week(Date.now())).maybeSingle(); state.sent = (data && data.sent) || 0; } catch {}
    paint();
  }
  async function turnOn() {
    state.busy = true; state.error = ''; paint();
    try {
      const c = await config(); if (!c.enabled || !c.vapidPublicKey) throw Error('Alerts are not switched on yet. Please try again soon.');
      if (await Notification.requestPermission() !== 'granted') throw Error('Notifications are blocked for this site. Allow them in your browser settings.');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(c.vapidPublicKey) }), j = sub.toJSON();
      const sb = await window.invSB(); const { error } = await sb.from('push_subscriptions').upsert({ endpoint: j.endpoint, user_id: window.invUser.id, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) });
      if (error) throw Error('Could not save your alert settings. Please try again.');
      state.on = true;
    } catch (e) { state.error = e.message || 'Something went wrong.'; }
    state.busy = false; paint();
  }
  async function turnOff() {
    state.busy = true; paint();
    try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (sub) { const sb = await window.invSB(); await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); } state.on = false; } catch {}
    state.busy = false; paint();
  }
  function box() {
    const u = window.invUser, n = (window.INVWATCH && window.INVWATCH.all().length) || 0, max = (cfg && cfg.freePerWeek) || 3, left = Math.max(0, max - state.sent);
    if (!u) return `<div class="al-box"><div class="al-top"><b>Alerts</b></div><p class="al-t">Get a notification the moment news lands on what you follow. Free: ${max} alerts a week.</p><button type="button" class="al-btn pri" data-al="login">Log in to turn on alerts</button></div>`;
    if (!supported()) return `<div class="al-box"><div class="al-top"><b>Alerts</b></div><p class="al-t">This browser does not support notifications.</p></div>`;
    if (iosNeedsInstall()) return `<div class="al-box"><div class="al-top"><b>Alerts</b></div><p class="al-t">On iPhone, first tap Share, then "Add to Home Screen", and open Investedia from there to turn on alerts.</p></div>`;
    const bar = `<div class="al-bar"><i style="width:${Math.min(100, state.sent / max * 100)}%"></i></div>`;
    const err = state.error ? `<p class="al-err">${esc(state.error)}</p>` : '';
    const follows = n ? `${n} followed ${n === 1 ? 'item' : 'items'}` : 'Nothing followed yet: tap ☆ on a country or asset';
    return `<div class="al-box"><div class="al-top"><b>Alerts</b><span class="al-t">${state.on ? `${state.sent} of ${max} free alerts sent this week` : `Free: ${max} a week`}</span></div>${state.on ? bar : ''}
      <div class="al-row"><div><b>Instant alerts</b><div class="al-t">${esc(follows)}</div></div><button type="button" class="al-sw${state.on ? ' on' : ''}" role="switch" aria-checked="${state.on}" aria-label="Instant alerts" data-al="${state.on ? 'off' : 'on'}"${state.busy ? ' disabled' : ''}></button></div>
      ${state.on ? `<div class="al-row"><span class="al-t">Resets Monday 00:00 UTC · ${left} left</span><a class="al-t" href="watchlist.html">Edit follows</a></div>` : ''}
      <div class="al-row al-pro"><div><b>Choose when and where</b> <span class="al-pro-tag">PRO</span><div class="al-t">Unlimited, email or push, quiet hours</div></div><button type="button" class="al-sw" disabled aria-label="Pro setting"></button></div>
      <a class="al-unlock" href="pricing.html#waitlist">Unlock with Pro</a>${err}</div>`;
  }
  function paint() { const nd = document.getElementById('notif-dd'); if (!nd) return; let el = nd.querySelector('.al-wrap'); if (!el) { el = document.createElement('div'); el.className = 'al-wrap'; nd.prepend(el); } el.innerHTML = box(); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-al]'); if (!b) return; e.stopPropagation(); const a = b.dataset.al; if (a === 'on') turnOn(); else if (a === 'off') turnOff(); else if (a === 'login') document.getElementById('hdr-login')?.click(); });
  const nd = () => document.getElementById('notif-dd');
  const watchPanel = () => { const el = nd(); if (!el) return setTimeout(watchPanel, 300); new MutationObserver(() => { if (!el.querySelector('.al-wrap')) paint(); }).observe(el, { childList: true }); paint(); };
  window.addEventListener('inv-user', () => { config().then(refresh); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchPanel); else watchPanel();
  config().then(refresh);
})();
