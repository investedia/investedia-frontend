// First-party consent. Optional storage and remote media are off until chosen.
(() => {
  'use strict';
  const VERSION = 1, KEY = 'inv-consent', YEAR = 365 * 24 * 60 * 60 * 1000;
  const root = new URL('../', document.currentScript.src);
  const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem;
  const preferences = new Set(['inv-theme','inv-pal','inv-studio','inv-profile','inv-notif-read','inv-learn']);
  let choice = null, panel, returnFocus;
  function read() {
    try {
      const c = JSON.parse(nativeGet.call(localStorage, KEY));
      const age = Date.now() - Date.parse(c?.date);
      return c?.version === VERSION && age >= 0 && age < YEAR && typeof c.preferences === 'boolean' && typeof c.images === 'boolean' && typeof c.analytics === 'boolean' ? c : null;
    } catch { return null; }
  }
  choice = read();
  if (!choice?.preferences) for (const k of preferences) try { nativeRemove.call(localStorage,k); nativeRemove.call(sessionStorage,k); } catch {}
  const allows = category => category === 'necessary' || !!choice?.[category];
  // Existing optional settings use the same gate on all pages. Requested account,
  // watchlist, follow and consent storage is unaffected; preferences need opt-in.
  Storage.prototype.getItem = function(k) { return preferences.has(String(k)) && !allows('preferences') ? null : nativeGet.call(this,k); };
  Storage.prototype.setItem = function(k,v) { if (!preferences.has(String(k)) || allows('preferences')) nativeSet.call(this,k,v); };
  function activate() {
    if (!allows('images')) document.getElementById('st-geist')?.remove();
    if (!allows('images')) document.querySelectorAll('img').forEach(img => { if (img.src.startsWith('https://cdn.brandfetch.io/')) { img.src = img.dataset.fb || new URL('assets/favicon.svg', root).href; delete img.dataset.fb; } });
    const fonts = document.getElementById('consent-fonts');
    if (allows('images') && !fonts) {
      const link = document.createElement('link'); link.id = 'consent-fonts'; link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&family=Geist+Mono:wght@400;500;600&display=swap';
      document.head.append(link);
    } else if (!allows('images') && fonts) fonts.remove();
  }
  function save(values) {
    choice = { version: VERSION, date: new Date().toISOString(), preferences: !!values.preferences, images: !!values.images, analytics: !!values.analytics, live: !!values.live };
    try { nativeSet.call(localStorage,KEY,JSON.stringify(choice)); } catch {}
    if (!choice.preferences) for (const k of preferences) try { nativeRemove.call(localStorage,k); nativeRemove.call(sessionStorage,k); } catch {}
    if (!choice.images && 'caches' in window) caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('inv-')).map(async k=>{const cache=await caches.open(k);for(const req of await cache.keys())if(new URL(req.url).origin!==location.origin)await cache.delete(req);}))).catch(()=>{});
    activate(); panel.hidden = true;
    window.dispatchEvent(new CustomEvent('inv-consent-change', { detail: {...choice} }));
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll:true });
  }
  function mount() {
    if (panel || new URLSearchParams(location.search).get('embed') === '1') return;
    panel = document.createElement('section'); panel.id = 'inv-consent-panel'; panel.className = 'consent-card'; panel.hidden = true;
    panel.setAttribute('aria-labelledby','consent-title'); panel.setAttribute('role','region');
    panel.innerHTML = `<div class="consent-summary"><h2 id="consent-title">Your privacy choices</h2><p>Accept all optional services, or accept only the storage needed for the site and features you request.</p><a href="${new URL('cookies.html',root)}">Read our cookie policy</a></div><details id="consent-options"><summary>What’s included</summary><div class="consent-option"><span><b>Essential</b><small>Consent choice, sign-in and features you request.</small></span><span class="consent-status" data-category="necessary">Always on</span></div><div class="consent-option"><span><b>Preferences</b><small>Theme, chart settings and learning progress.</small></span><span class="consent-status" data-category="preferences"></span></div><div class="consent-option"><span><b>Third-party images & services</b><small>Brandfetch logos, Google Fonts and live Coinbase rates. Local fallbacks work without them.</small></span><span class="consent-status" data-category="images"></span></div><div class="consent-option"><span><b>Analytics</b><small>Existing first-party usage events stored with Supabase. No advertising trackers.</small></span><span class="consent-status" data-category="analytics"></span></div><div class="consent-option"><span><b>Live prices</b><small>Streams live crypto prices from Coinbase to your browser.</small></span><span class="consent-status" data-category="live">Off</span></div></details><p class="consent-current"></p><div class="consent-actions"><button type="button" data-consent="accept">Accept all</button><button type="button" data-consent="essential">Accept essential</button></div><p class="consent-hint">You can change your choice at any time in Cookie settings.</p>`;
    document.body.append(panel);
    panel.addEventListener('click', e => {
      const action = e.target.closest('[data-consent]')?.dataset.consent;
      if (action === 'accept' || action === 'essential') save({preferences:action==='accept',images:action==='accept',analytics:action==='accept',live:action==='accept'});
    });
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') { if (choice) { panel.hidden=true; returnFocus?.focus(); } else panel.querySelector('#consent-options').open=false; } });
    if (!choice) show(false);
  }
  function show(settings = false) {
    mount(); if (!panel) return;
    if (panel.hidden) returnFocus = document.activeElement;
    panel.hidden = false;
    panel.querySelector('#consent-options').open = settings;
    const all = !!choice && ['preferences','images','analytics','live'].every(k => allows(k));
    const essential = !!choice && ['preferences','images','analytics','live'].every(k => !allows(k));
    for(const [action,current] of [['accept',all],['essential',essential]]) {
      const button = panel.querySelector('[data-consent='+action+']');
      button.setAttribute('aria-pressed',String(current));
      button.classList.toggle('is-current',current);
    }
    const current = panel.querySelector('.consent-current');
    current.hidden = !choice;
    current.textContent = choice ? 'Current choice: ' + (all ? 'Accept all' : essential ? 'Accept essential' : 'Custom preferences') : '';
    panel.querySelectorAll('[data-category]').forEach(status => {
      const category = status.dataset.category, on = allows(category);
      status.dataset.on = String(on);
      status.textContent = category === 'necessary' ? 'Always on' : on ? 'On' : 'Off';
    });
    if(settings) panel.querySelector('[data-consent='+ (essential ? 'essential' : 'accept') +']').focus({preventScroll:true});

  }
  window.InvConsent = { allows, mount, open:()=>show(true), version:VERSION, choice:()=>choice&&({...choice}) };
  document.addEventListener('click',e=>{if(e.target.closest('[data-cookie-settings]')){e.preventDefault();show(true);}});
  addEventListener('storage',e=>{if(e.key===KEY){choice=read();activate();window.dispatchEvent(new Event('inv-consent-change'));}});
  activate();
})();
