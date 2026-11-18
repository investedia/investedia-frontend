// One dashboard (owner 18 Nov 2026): on PC every mode (News, Markets, Projects) shares the same frame.
// A single top bar holds the logo, the mode switch, search and the Briefing. Below it: a left column, a right column
// and a bottom strip between them, all with the same card style, so the page reads as one dashboard, not loose panels.
// Layout only: every feature and button keeps working as before. Phones keep their own layout.
(()=>{
 if(document.documentElement.classList.contains('embed')||/[?&]embed=1/.test(location.search)||window.top!==window.self)return;
 const H=document.documentElement;H.classList.add('dash');
 const bar=document.createElement('div');bar.id='dashbar';bar.setAttribute('aria-hidden','true');document.body.prepend(bar);
 const css=document.createElement('style');css.textContent=`
 @media(min-width:1180px){
 html.dash{--pw:360px;--dtop:84px;--dg:12px;--dcard:rgba(12,12,15,.94);--dln:#222226}
 #dashbar{position:fixed;left:16px;right:16px;top:12px;height:60px;z-index:2;border-radius:18px;background:var(--dcard);border:1px solid var(--dln);backdrop-filter:blur(14px);pointer-events:none}
 html.dash .top{top:var(--dtop)!important;left:16px!important;right:auto!important;width:340px!important}
 html.dash .top::before{display:none}
 html.dash .brand{position:fixed;left:32px;top:24px;height:36px;z-index:6;align-items:center}
 html.dash #sbox{position:fixed!important;top:22px;left:50%;transform:translateX(-50%);width:min(480px,32vw)!important;height:40px!important;z-index:6;margin:0!important;background:#111114!important}
 html.dash .bf-btn{top:20px!important;left:auto!important;right:28px!important;z-index:7}
 html.dash #badge{position:fixed;top:30px;left:calc(50% + min(240px,16vw) + 14px);z-index:6}
 html.dash .pjq-btn{display:none!important}
 html.dash .gswitch button{padding:7px 16px!important;font-size:13.5px!important}
 /* columns */
 html.dash :is(#panel,.mkd-o:not([hidden]),#projPanel){top:var(--dtop)!important;right:16px!important;width:var(--pw)!important}
 html.dash #panel{bottom:calc(16px + 224px + var(--dg))!important;height:auto!important;max-height:none!important}
 html.dash:not(.side-on) #panel{bottom:16px!important}
 html.dash #sideImp{right:16px!important;width:var(--pw)!important}
 html.dash :is(.mkd-o:not([hidden]),#projPanel){bottom:16px!important}
 html.dash :is(.mkd-l,#pjList){top:var(--dtop)!important;left:16px!important;width:340px!important}
 html.dash #pjList{bottom:16px!important}
 html.dash .mkd-l{max-height:calc(100vh - var(--dtop) - 76px)!important}
 html.dash #layers[style*=fixed],html.dash.mkd-on #layers{left:16px!important;bottom:16px!important}
 /* bottom strip between the columns */
 html.dash :is(#act,.mkd-a,#pjStats,#sideBar){left:372px!important;right:calc(var(--pw) + 32px)!important;bottom:16px!important;width:auto!important}
 html.dash :is(.zoom){right:calc(var(--pw) + 44px)!important}html.dash #zloc{right:calc(var(--pw) + 45px)!important;left:auto!important}
 /* one card style */
 html.dash :is(#panel,#sideImp,#sideSec,#presets,#layers .lay-btn,#ddrow .dd-btn,.mkd-l,.mkd-o,.mkd-a,#act,#pjList,#projPanel,#pjStats,#sideBar,#lcol>*){background:var(--dcard)!important;border:1px solid var(--dln)!important;border-radius:18px!important;box-shadow:none!important}
 html.dash #lcol{gap:var(--dg)!important}html.dash #ddrow{margin-bottom:var(--dg)!important}
 html.dash #panel h2,html.dash .mkd-o h2,html.dash #pjList h2{font-size:18px!important;letter-spacing:-.01em}

 /* one Filters card (owner 18 Nov 2026): region, time, article filters, map layers and saved views read as one box */
 html.dash.lcol-on:not(.mkd-on):not(.proj-mode){--dtop:112px}
 html.dash.lcol-on #ddrow{position:relative!important;background:var(--dcard);border:1px solid var(--dln);border-bottom:0;border-radius:18px 18px 0 0;padding:48px 14px 10px!important;margin:0!important}
 html.dash.lcol-on #ddrow .dd-btn{background:#111114!important;border:1px solid #2a2a2f!important;border-radius:11px!important;height:38px}
 html.dash.lcol-on #ddrow:before{content:'Filters';position:absolute;left:16px;top:15px;font:600 15px Inter,sans-serif;color:#ececef}
 #fb-reset{display:none}
 html.dash.lcol-on #ddrow>#fb-reset{display:block;position:absolute;right:12px;top:11px;background:none;border:0;color:#ff9d5c;font:500 12.5px Inter,sans-serif;cursor:pointer;padding:4px 6px;width:auto;height:auto}
 html.dash.lcol-on #lcol{width:100%!important}
 html.dash .gp-ctl:has([aria-label='Pin Saved views']){display:none!important}
 html.dash.lcol-on #lcol{gap:0!important;margin-top:0!important}
 html.dash.lcol-on #news-details-filters{order:1}html.dash.lcol-on #lcol #layers{order:2}html.dash.lcol-on #presets{order:3}html.dash.lcol-on #sideSec{order:4;margin-top:var(--dg)!important}
 html.dash.lcol-on :is(#news-details-filters,#lcol #layers,#presets){background:var(--dcard)!important;border:1px solid var(--dln)!important;border-top:1px solid #1c1c20!important;border-bottom:0!important;border-radius:0!important;padding:4px 14px!important;margin:0!important}
 html.dash.lcol-on #presets{border-bottom:1px solid var(--dln)!important;border-radius:0 0 18px 18px!important;padding:10px 16px 12px!important}
 html.dash.lcol-on #news-details-filters>details{background:none!important;border:0!important}
 html.dash.lcol-on #news-details-filters{position:relative;z-index:35}
 html.dash:has(#news-details-filters details[open]) .gp-ctl{display:none!important}
 html.dash.lcol-on #news-details-filters summary{padding:10px 2px!important;font:500 13.5px Inter,sans-serif!important;color:#ddd}
 html.dash.lcol-on #lcol .lay-btn{background:none!important;border:0!important;padding:0 2px!important;height:42px;font:500 13.5px Inter,sans-serif;color:#ddd}
 /* one line per mode saying what it is for */
 #mdesc{display:none}
 html.dash #mdesc{display:flex;position:fixed;left:32px;top:86px;z-index:6;gap:8px;align-items:center;font:13px Inter,sans-serif;color:#9a9aa2;pointer-events:none}
 #mdesc b{color:#ececef;font-weight:600}#mdesc i{width:6px;height:6px;border-radius:50%;background:#ff7a1a}
 html.dash.mkd-on,html.dash.proj-mode{--dtop:112px}
 /* Projects: zoom sits above the stats strip; the news status pill belongs to News only */
 html.dash.proj-mode .zoom{top:auto!important;bottom:112px!important}html.dash.proj-mode #zloc{top:auto!important;bottom:198px!important}
 html.dash.proj-mode #badge{display:none!important}
 }`;
 document.head.append(css);

 const D={news:['News','What happened, and what it moved'],markets:['Markets','Where money is moving today'],projects:['Projects','Big builds, tracked by satellite']};
 const md=document.createElement('div');md.id='mdesc';document.body.append(md);
 const rs=document.createElement('button');rs.type='button';rs.id='fb-reset';rs.textContent='Reset';rs.onclick=()=>document.getElementById('fs-reset')?.click();
 const mode=()=>H.classList.contains('proj-mode')?'projects':H.classList.contains('mkd-on')?'markets':'news';
 let last='';const tick=()=>{const m=mode();if(m!==last){last=m;md.innerHTML=`<i></i><span><b>${D[m][0]}</b> · ${D[m][1]}</span>`;dispatchEvent(new Event('resize'));}
  const dd=document.getElementById('ddrow');if(dd&&rs.parentNode!==dd)dd.append(rs);};
 tick();setInterval(tick,400);
 // the globe re-measures its free space when the layout changes
 requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
})();
