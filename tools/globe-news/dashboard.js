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
 }`;
 document.head.append(css);
 // the globe re-measures its free space when the layout changes
 requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
})();
