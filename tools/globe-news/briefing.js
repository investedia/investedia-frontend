// Briefing (owner 16 Nov 2026): a short spoken market briefing on the globe. Button states: Briefing (waiting) → playing → Briefed.
// Text is built only from data already on the page: closing index moves (markets.json), the top articles, the next calendar release.
// Voice: the browser's built-in speech for now (no account, no cost). An Azure voice can replace speak() later without UI changes.
(()=>{
 const synth=window.speechSynthesis;if(!synth)return;
 if(document.documentElement.classList.contains('embed')||/[?&]embed=1/.test(location.search)||window.top!==window.self)return; // full Globe page only, never the homepage frame
 const st=document.createElement('style');st.textContent=`
 .bf-btn{position:fixed;z-index:31;display:inline-flex;align-items:center;gap:10px;background:rgba(12,12,15,.95);border:1px solid #5a3214;border-radius:999px;padding:5px 14px 5px 5px;color:#ececef;font:600 13.5px Inter,sans-serif;cursor:pointer}
 .bf-btn small{font:500 12.5px Inter,sans-serif;color:#8a8a92}.bf-btn.play small{color:#ff9d5c}
 .bf-ic{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1d130b;box-shadow:0 0 0 5px #ff7a1a1c,0 0 22px #ff7a1a44;flex:none}
 .bf-btn.done{border-color:#2a2a2f;color:#d4d4d8}.bf-btn.done .bf-ic{background:#18181b;box-shadow:none}
 .bf-card{position:fixed;z-index:32;width:min(500px,calc(100vw - 24px));background:rgba(12,12,15,.98);border:1px solid #3a2414;border-radius:22px;padding:16px 18px;box-shadow:0 30px 80px #000c;color:#ececef;font:14px/1.45 Inter,sans-serif}
 .bf-card[hidden]{display:none}
 .bf-h{display:flex;align-items:center;gap:12px}.bf-h .bf-ic{width:50px;height:50px}.bf-h small{display:block;color:#8a8a92;font-size:11px;letter-spacing:.08em;text-transform:uppercase}.bf-h b{font-size:19px}
 .bf-pp{width:40px;height:40px;border-radius:50%;background:#fff;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-left:auto;flex:none}
 .bf-eq{display:inline-flex;gap:2px;align-items:flex-end;height:12px}.bf-eq b{width:2px;background:#ff9d5c;border-radius:1px;animation:bfq .9s ease-in-out infinite}.bf-eq b:nth-child(2){animation-delay:.2s}.bf-eq b:nth-child(3){animation-delay:.4s}@keyframes bfq{0%,100%{height:3px}50%{height:12px}}
 .bf-x{background:none;border:0;color:#8a8a92;font-size:18px;cursor:pointer;padding:4px 6px}
 .bf-list{max-height:min(46vh,340px);overflow:auto;margin-top:8px}
 .bf-b{background:#141417;border:1px solid #232327;border-radius:16px 16px 16px 4px;padding:10px 12px;margin:8px 0;cursor:pointer}.bf-b.on{border-color:#5a3214;background:#1a120b;color:#fff}.bf-b.past{opacity:.55}
 .bf-ctl{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.bf-ctl button{border:1px solid #232327;border-radius:999px;padding:5px 12px;font:13px Inter,sans-serif;color:#ddd;background:#141417;cursor:pointer}
 .bf-note{color:#77777f;font-size:11.5px;margin-top:10px}
 @media(max-width:760px){.bf-card{left:0!important;right:0;bottom:calc(var(--dock-h,78px) + 12px);top:auto!important;max-height:60vh;overflow:auto;z-index:60;width:auto;border-radius:22px 22px 0 0}.bf-btn{padding:4px;gap:0}.bf-btn b,.bf-btn small{display:none}}`;
 document.head.append(st);
 const RING='<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="#ff7a1a" stroke-width="1.6"/></svg>';
 const DONE='<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="#8a8a92" stroke-width="1.6"/><path d="m8 12.2 2.6 2.6L16 9.4" fill="none" stroke="#ececef" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const PLAY='<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="#111"/></svg>',PAUSE='<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="#111"/></svg>';
 const store=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{return null}};
 const firstName=()=>{if(store('inv-brief-name')==='off')return '';try{const u=window.invUser||(()=>{for(const k of Object.keys(localStorage))if(/^sb-.*-auth-token$/.test(k)){const v=JSON.parse(localStorage.getItem(k));return v?.user||v?.currentSession?.user;}})();const md=u?.user_metadata||{};return String(md.first_name||md.given_name||md.name||md.full_name||'').trim().split(/\s+/)[0]||'';}catch{return ''}};
 const pct=v=>`${Math.abs(v).toFixed(Math.abs(v)>=1?1:2)} percent`;
 const mv=(n,v)=>!Number.isFinite(v)?'':Math.abs(v)<0.05?`${n} was flat`:`${n} ${v>0?'rose':'fell'} ${pct(v)}`;
 const join=a=>{a=a.filter(Boolean);return a.length<2?a[0]||'':a.slice(0,-1).join(', ')+' and '+a.at(-1)};
 let CH=[],day='',cur=0,playing=false,utt=null;
 function build(){
  const by=MKT.by||{},q=s=>by[s]?.d,asof=Date.parse(MKT.asof||'');day=Number.isFinite(asof)?new Date(asof).toISOString().slice(0,10):'';
  const wd=Number.isFinite(asof)?new Date(asof).toLocaleDateString('en-GB',{weekday:'long'}):'the last session';
  const nm=firstName(),hr=new Date().getHours(),hi=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
  CH=[{t:`${nm?`Hey ${nm}. `:''}Here’s what moved markets.`,h:nm?`${hi}, ${nm}`:hi}];
  const us=join([mv('the S&P 500',q('^GSPC')),mv('the Nasdaq',q('^IXIC')),mv('the Dow',q('^DJI'))]);if(us)CH.push({t:`In the United States on ${wd}, ${us}.`,f:[-98,38]});
  const eu=join([mv('the DAX',q('^GDAXI')),mv('the FTSE 100',q('^FTSE')),mv('the Euro Stoxx 50',q('^STOXX50E'))]);if(eu)CH.push({t:`In Europe, ${eu}.`,f:[8,49]});
  const as=join([mv('the Nikkei',q('^N225')),mv('the Hang Seng',q('^HSI'))]);if(as)CH.push({t:`In Asia, ${as}.`,f:[125,30]});
  const cm=join([Number.isFinite(q('BZ=F'))?`Brent crude ${Math.abs(q('BZ=F'))<0.05?'was flat':(q('BZ=F')>0?'rose ':'fell ')+(Math.abs(q('BZ=F'))<0.05?'':pct(q('BZ=F')))}${by['BZ=F']?.p?` at ${by['BZ=F'].p.toFixed(2)} dollars`:''}`:'',mv('gold',q('GC=F'))]);if(cm)CH.push({t:`${cm[0].toUpperCase()+cm.slice(1)}.`});
  const top=(stories||[]).filter(s=>Date.now()-s.t<48*36e5).sort((a,b)=>(b.market_moving?1:0)-(a.market_moving?1:0)||(b.importance||0)-(a.importance||0)||b.t-a.t).slice(0,3);
  top.forEach((s,i)=>CH.push({t:`${i?'Also':'In the news'}${s.location?.country?`, ${nm2(s.location.country)}`:''}: ${s.headline.replace(/\.$/,'')}.`,f:Number.isFinite(s.location?.lon)?[s.location.lon,s.location.lat]:null,id:s.id}));
  const nx=(typeof CAL!=='undefined'?CAL:[]).filter(e=>Date.parse(e.at)>Date.now()).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0];
  if(nx)CH.push({t:`Coming up: ${nx.t}, ${new Date(nx.at).toLocaleDateString('en-GB',{weekday:'long'})}.`});
  CH.push({t:'That’s your Briefing. Not investment advice.'});
 }
 const nm2=c=>typeof nm==='function'?nm(c):c;
 const total=()=>CH.reduce((s,c)=>s+c.t.length,0),secs=n=>Math.round(n/14),fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
 const done=()=>store('inv-briefed')===day&&day;
 const btn=document.createElement('button');btn.type='button';btn.className='bf-btn';btn.setAttribute('aria-label','Briefing');document.body.append(btn);
 const card=document.createElement('div');card.className='bf-card';card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label','Briefing');document.body.append(card);
 function paintBtn(){const el=CH.slice(0,cur).reduce((s,c)=>s+c.t.length,0);
  if(playing){btn.className='bf-btn play';btn.innerHTML=`<span class=bf-ic>${RING}</span><b>Briefing</b>${card.hidden?'<i class=bf-eq><b></b><b></b><b></b></i>':`<small>${fmt(secs(el))} / ${fmt(secs(total()))}</small>`}`;}
  else if(done()){btn.className='bf-btn done';btn.innerHTML=`<span class=bf-ic>${DONE}</span><b>Briefed</b><small>${day?new Date(day).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):''}</small>`;}
  else{btn.className='bf-btn';btn.innerHTML=`<span class=bf-ic>${RING}</span><b>Briefing</b>`;}
  const b=document.querySelector('.brand')?.getBoundingClientRect(),phone=matchMedia('(max-width:760px)').matches;
  if(phone){const m=document.querySelector('.m-actions')?.getBoundingClientRect();btn.style.top=((m?.top||12))+'px';btn.style.left='';btn.style.right=((m?innerWidth-m.left:12)+8)+'px';}
  else{btn.style.right='';btn.style.top=((b?.bottom||60)+10)+'px';btn.style.left=((document.getElementById('act')?.getBoundingClientRect().left)||(b?.right||400)+20)+'px';}
  const r=btn.getBoundingClientRect();card.style.top=(r.bottom+10)+'px';card.style.left=r.left+'px';}
 function paintCard(){const h=CH[0]?.h||'Briefing';
  card.innerHTML=`<div class=bf-h><span class=bf-ic>${done()&&!playing?DONE:RING}</span><div><small>Briefing${day?' · '+new Date(day).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):''}${playing||cur?' · '+fmt(secs(CH.slice(0,cur).reduce((a,c)=>a+c.t.length,0)))+' / '+fmt(secs(total())):''}</small><b>${h}</b></div><button type=button class=bf-pp aria-label="${playing?'Pause':'Play'}">${playing?PAUSE:PLAY}</button><button type=button class=bf-x aria-label=Close>✕</button></div>
  <div class=bf-list>${CH.map((c,i)=>`<div class="bf-b ${i===cur&&(playing||cur)?'on':i<cur?'past':''}" data-i="${i}">${c.t.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`).join('')}</div>
  <div class=bf-ctl><button type=button data-bf=prev>⏮ Previous</button><button type=button data-bf=next>Next ⏭</button><button type=button data-bf=name>${store('inv-brief-name')==='off'?'Greet me by name':'Don’t use my name'}</button></div>
  <div class=bf-note>Read by your browser’s voice from Investedia’s market data and articles. Delayed prices. Not investment advice.</div>`;
  card.querySelector('.bf-b.on')?.scrollIntoView({block:'nearest'});}
 function speak(i){synth.cancel();if(i>=CH.length){playing=false;store('inv-briefed',day);paintBtn();paintCard();return;}
  cur=i;playing=true;const c=CH[i];if(c.f&&typeof flyTo==='function')try{flyTo(c.f[0],Math.max(-60,Math.min(60,c.f[1])),1.6,1200)}catch{}
  utt=new SpeechSynthesisUtterance(c.t);utt.lang='en-GB';const v=synth.getVoices().find(v=>/en-GB/i.test(v.lang)&&/natural|neural|google|daniel|serena|sonia/i.test(v.name))||synth.getVoices().find(v=>/^en/i.test(v.lang));if(v)utt.voice=v;utt.rate=1;
  utt.onend=()=>{if(playing&&utt&&utt.text===c.t){if(i>=Math.floor(CH.length*.9)-1)store('inv-briefed',day);speak(i+1);}};synth.speak(utt);paintBtn();paintCard();}
 function stop(){playing=false;synth.cancel();paintBtn();paintCard();}
 btn.onclick=()=>{if(!CH.length)build();card.hidden=!card.hidden;if(!card.hidden){if(!playing)speak(done()?0:cur>=CH.length-1?0:cur);}paintCard();paintBtn();};
 card.addEventListener('click',e=>{const t=e.target;if(t.closest('.bf-x')){card.hidden=true;stop();return;}if(t.closest('.bf-pp')){playing?stop():speak(cur);return;}
  const b=t.closest('[data-i]');if(b){speak(+b.dataset.i);return;}const k=t.closest('[data-bf]')?.dataset.bf;
  if(k==='prev')speak(Math.max(0,cur-1));if(k==='next')speak(cur+1);if(k==='name'){store('inv-brief-name',store('inv-brief-name')==='off'?'on':'off');build();paintCard();}});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&!card.hidden){card.hidden=true;stop();}});
 addEventListener('resize',paintBtn);
 const ready=setInterval(()=>{if(typeof MKT!=='undefined'&&MKT.all&&MKT.all.length&&typeof stories!=='undefined'){clearInterval(ready);build();paintBtn();}},500);
 setInterval(()=>{if(!playing&&CH.length)paintBtn();},5000);
})();
