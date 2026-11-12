// First-party display Settings. Convert USD quotes only; local quotes and percentages retain their units.
(() => {
  const KEY='inv-prefs', ROOT=new URL('../',document.currentScript.src).href;
  const LANGS={en:'English',fr:'Français',nl:'Nederlands',de:'Deutsch',es:'Español',it:'Italiano',pt:'Português'};
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
  const fiat=new Set(Intl.supportedValuesOf?Intl.supportedValuesOf('currency'):['USD','EUR','GBP','JPY','CHF','CAD','AUD','NGN','ZAR','INR','BRL']);
  const P={cur:/^[A-Z]{3}$/.test(saved.cur||'')?saved.cur:'USD',lang:LANGS[saved.lang]?saved.lang:'en'};
  const rates={USD:1},subs=[];
  const cur=()=>P.cur;
  const convertible=a=>!a||a.cur==='USD'||a.currency==='USD'||a.t==='crypto'||a.c==='crypto'||a.t==='cmd'||(a.t==='stocks'&&a.g!=='Index'&&!/[.^=]/.test(a.s||''));
  function ownCurrency(a){if(a&&(a.g==='Index'||a.t==='fx'||['indices','currencies','bonds'].includes(a.c)))return null;return a?.cur||a?.currency||(convertible(a)?'USD':null);}
  function value(v,a){let own=ownCurrency(a);if(own==='GBp'){v/=100;own='GBP';}if(own==='ZAc'){v/=100;own='ZAR';}if(own==='USX'){v/=100;own='USD';}const c=own==='USD'&&rates[cur()]>0?cur():own;return {v:own==='USD'&&c?v*rates[c]:v,c};}
  function format(v,a,compact=false){if(v==null||!Number.isFinite(+v))return '—';const q=value(+v,a),digits=compact?2:q.c==='JPY'?0:Math.abs(q.v)>=1?(q.c?new Intl.NumberFormat('en',{style:'currency',currency:q.c}).resolvedOptions().maximumFractionDigits:2):Math.abs(q.v)>=.01?4:6;try{return new Intl.NumberFormat(P.lang,{...(q.c?{style:'currency',currency:q.c,currencyDisplay:'narrowSymbol'}:{}),...(compact?{notation:'compact'}:{}),maximumFractionDigits:digits,minimumFractionDigits:compact?0:digits}).format(q.v)+(q.c&&['USD','USX'].includes(ownCurrency(a))&&q.c!=='USD'?' '+q.c:'');}catch{return String(q.v);}}
  const fmt=(v,a)=>format(v,a),compact=(v,a)=>format(v,a,true);
  addEventListener('storage',e=>{if(e.key!==KEY)return;try{const p=JSON.parse(e.newValue||'{}');if(/^[A-Z]{3}$/.test(p.cur))P.cur=p.cur;if(LANGS[p.lang])P.lang=p.lang;emit();}catch{}});
  let btn,dd,settingsTrigger;
  function emit(){for(const f of subs)try{f();}catch{};paintOptions();}
  function setRates(R){for(const [c,r]of Object.entries(R||{}))if(fiat.has(c)&&Number.isFinite(+r)&&+r>0)rates[c]=+r;rates.USD=1;emit();}
  fetch(ROOT+'assets/globe/markets.json').then(r=>r.json()).then(m=>{const R={};for(const a of m.assets||[])if(a.t==='fx'&&a.g==='vs US dollar'&&a.p>0){if(a.s.startsWith('USD'))R[a.s.slice(3)]=a.p;else if(a.s.endsWith('USD'))R[a.s.slice(0,3)]=1/a.p;}setRates(R);}).catch(()=>{});
  function paintOptions(){if(!dd)return;const el=dd.querySelector('[data-setting=currency]'),selected=el.value||cur();for(const c of Object.keys(rates).sort())if(![...el.options].some(o=>o.value===c))el.add(new Option(c,c));el.value=selected;}
  function open(on=true){if(!dd)return;dd.hidden=!on;btn.setAttribute('aria-expanded',String(on));if(on){paintOptions();(dd.querySelector('.csel-btn')||dd.querySelector('select')).focus();}else (settingsTrigger?.isConnected?settingsTrigger:btn).focus();}
  window.InvPrefs={fmt,compact,cur,convertible,rates,setRates,onChange:f=>subs.push(f),openSettings:trigger=>{settingsTrigger=trigger;open();},mount(host){if(btn||!host)return;
    const w=document.createElement('div');w.className='pf-wrap';w.innerHTML=`<button class="icon-btn pf-btn" type="button" aria-label="Settings" aria-haspopup="dialog" aria-expanded="false" aria-controls="display-settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.7 2.2-2 .9L4 5.6 2.5 8l1.6 1.8-.2 2.3L2.5 14 4 16.4l2.3-.5 2 .9L9 19h3l.7-2.2 2-.9 2.3.5 1.5-2.4-1.6-1.9.2-2.3L18.5 8 17 5.6l-2.3.5-2-.9L12 3Z"/><circle cx="10.5" cy="11" r="3"/></svg></button><div id="display-settings" class="pf-dd" role="dialog" aria-label="Display settings" hidden><b>Settings</b><label>Currency<select class="select" data-setting="currency" aria-label="Currency">${['USD','EUR','GBP','JPY','CHF','CAD','AUD','NGN','ZAR','INR','BRL'].map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label><label>Language<select class="select" data-setting="language" aria-label="Language">${Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><small>USD quotes convert when a rate is available. Local quotes keep their currency.</small><p role="status" class="pf-status"></p></div>`;
    host.prepend(w);btn=w.querySelector('button');dd=w.querySelector('.pf-dd');dd.querySelector('[data-setting=currency]').value=cur();
    const lang=dd.querySelector('[data-setting=language]');lang.value=window.InvLocale?.language||'en';
    btn.onclick=()=>open(dd.hidden);document.addEventListener('click',e=>{if(!w.contains(e.target)&&!e.target.closest('.csel-menu,.csel-scrim')&&!dd.hidden){dd.hidden=true;btn.setAttribute('aria-expanded','false');}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dd.hidden)open(false);});
    dd.querySelector('[data-setting=currency]').onchange=e=>{P.cur=e.target.value;try{localStorage.setItem(KEY,JSON.stringify(P));}catch{};emit();dd.querySelector('.pf-status').textContent=rates[P.cur]?'':'No conversion rate yet. Original values are shown.';};
    lang.onchange=async()=>{const want=lang.value;try{await window.InvLocale.setLanguage(want);P.lang=want;localStorage.setItem(KEY,JSON.stringify(P));emit();}catch{lang.value=window.InvLocale?.language||'en';dd.querySelector('.pf-status').textContent='Language could not load. Please try again.';}};
    addEventListener('inv-language-change',e=>{P.lang=e.detail.language;lang.value=P.lang;emit();});paintOptions();
  }};
})();
