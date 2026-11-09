// Preview-only layer on the existing globe. No quotes, registry, or trade datasets.
const MARKET_LINKS_ENABLED = false, RISING_ATTENTION_ENABLED = false;
const marketPhone=()=>innerWidth<=900;
const MARKET = {on:true, selected:null, selectedVenue:null, selectedConnection:null, markers:[],
  labels:[], hits:[], drawnLines:[], lineHits:[], occlusions:[], ready:false};
const marketNotify = data => parent.postMessage({type:'investedia-market-preview', ...data}, location.origin);
function marketInit() {
  if (MARKET.promise) return MARKET.promise;
  const read = url => fetch(url,{cache:'no-cache'}).then(r => {if(!r.ok)throw Error(url);return r.json();});
  const requested=new URLSearchParams(location.search).get('snapshot');
  MARKET.promise = (requested?Promise.resolve({source_file:requested}):read('market-focus.json')).then(async index=>{
      if(!/^market-focus-source-[a-f0-9]{12}\.json$/.test(index.source_file))throw Error('Invalid snapshot');
      const snapshot=await read(index.source_file),focus=snapshot.globe_focus,exchanges=snapshot.exchanges,connections=snapshot.connections;
      if(snapshot.updated_at!==focus.updated_at)throw Error('Invalid snapshot date');
      MARKET.focus=focus;MARKET.exchanges=exchanges;
      MARKET.connections=connections||[];
      MARKET.markers=Object.entries(exchanges).map(([id,e])=>({id,...e,countryName:focus.countries[e.country]?.name,
        phi:e.coordinates.latitude*rad,lam:e.coordinates.longitude*rad}));
      MARKET.ready=true; marketNotify({ready:true});
    }).catch(()=>{MARKET.promise=null;marketNotify({error:true});});
  return MARKET.promise;
}
function marketSetMode(mode,notify=true) {
  MARKET.on=mode==='markets';document.documentElement.classList.toggle('market-mode',MARKET.on);
  if(MARKET.on){sel=null;selCountry=null;hideHover();marketInit();}else marketClose(notify);
}
function marketSelect(name,venue=null,notify=true) {
  const code=ISO[name]; if(!code)return;
  MARKET.selected=name;MARKET.selectedVenue=venue||MARKET.focus?.countries[code]?.exchange;
  MARKET.selectedConnection=null;selCountry=byName[name];sel=null;spin=null;hideHover();
  // Opening a panel never moves, zooms, or resizes the globe.
  if(notify)marketNotify({country:code,venue,open:true});
}
function marketClose(notify=true) {
  MARKET.selected=null;MARKET.selectedVenue=null;MARKET.selectedConnection=null;selCountry=null;
  if(notify)marketNotify({open:false});
}
function marketTap(x,y) {
  const marker=[...MARKET.hits].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).find(h=>Math.hypot(h.x-x,h.y-y)<(marketPhone()?22:18));
  if(marker)return marketSelect(marker.e.countryName,marker.e.id);
  const line=MARKET.lineHits.find(h=>h.points.some(p=>Math.hypot(p[0]-x,p[1]-y)<9));
  if(line){MARKET.selectedConnection=line.id;marketNotify({connection:line.id,open:true});return;}
  const g=inv(x,y),country=g&&countryAt(g[0],g[1]);
  country?marketSelect(country.name):marketClose();
}
function drawMarketMode() {
  MARKET.labels=[];MARKET.hits=[];MARKET.drawnLines=[];MARKET.lineHits=[];
  if(!MARKET.ready)return;
  const code=ISO[MARKET.selected],ids=new Set(MARKET.focus.countries[code]?.connections||[]);
  let links=MARKET.connections.filter(c=>ids.has(c.id));
  links.sort((a,b)=>Number(b.id===MARKET.selectedConnection)-Number(a.id===MARKET.selectedConnection)||(b.score||0)-(a.score||0));
  for(const link of links){
    if(MARKET.drawnLines.length>=(marketPhone()?3:5))break;
    const a=link.origin,b=link.dest,p=proj(a.lat*rad,a.lon*rad),q=proj(b.lat*rad,b.lon*rad);
    if(p[2]<=.04||q[2]<=.04)continue;
    const points=arcGeom({phi:a.lat*rad,lam:a.lon*rad},{phi:b.lat*rad,lam:b.lon*rad},56,0)
      .map(([phi,lam,h])=>proj(phi,lam,h));
    ctx.beginPath();let pen=false;
    for(const[x,y,z]of points){if(z<=0){pen=false;continue;}pen?ctx.lineTo(x,y):ctx.moveTo(x,y);pen=true;}
    ctx.strokeStyle=link.id===MARKET.selectedConnection?'#FF7A1A':'rgba(255,122,26,.24)';
    ctx.lineWidth=link.id===MARKET.selectedConnection?1.8:.8;ctx.stroke();
    MARKET.drawnLines.push(link.id);MARKET.lineHits.push({id:link.id,points:points.filter(p=>p[2]>0)});
  }
  const markerBoxes=[];
  for(const e of MARKET.markers){const[x,y,z]=proj(e.phi,e.lam);if(z<=.04)continue;
    const selected=e.id===MARKET.selectedVenue,active=!!MARKET.focus.countries[e.country]?.counts.articles_48h;
    ctx.strokeStyle=selected?'#fff':active?'#c7c7cb':'#73737b';ctx.lineWidth=selected?1.5:1;
    ctx.strokeRect(x-3,y-3,6,6);
    if(!active||selected){ctx.beginPath();ctx.arc(x,y,selected?10:6,0,7);ctx.strokeStyle=selected?'#FF7A1A':'#55555d';ctx.stroke();}
    MARKET.hits.push({x,y,e});markerBoxes.push({x:x-8,y:y-8,w:16,h:16});
  }
  const boxes=[],overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const candidates=Object.entries(MARKET.focus.countries).filter(([,c])=>c.labels.length)
    .sort((a,b)=>b[1].counts.important-a[1].counts.important);
  ctx.font='500 11px Inter,sans-serif';ctx.textBaseline='middle';
  for(const[iso,c]of candidates){
    if(boxes.length>=(marketPhone()?5:9))break;
    const country=byName[c.name],venue=MARKET.markers.find(m=>m.id===c.exchange);
    if(!country&&!venue)continue;
    const[x,y,z]=venue?proj(venue.phi,venue.lam):proj(country.c[1]*rad,country.c[0]*rad);if(z<=.1)continue;
    const text=c.name+' · '+c.labels[0],w=ctx.measureText(text).width+12,h=21;
    let box=null;
    for(const[dx,dy]of [[12,-26],[12,10],[-w-12,-26],[-w-12,10]]){
      const b={x:x+dx,y:y+dy,w,h,text,country:iso};
      if(b.x<8||b.y<8||b.x+w>W-8||b.y+h>H-8)continue;
      if([...boxes,...markerBoxes,...MARKET.occlusions].some(a=>overlap(a,b)))continue;
      box=b;break;
    }
    if(!box)continue;
    ctx.fillStyle='rgba(10,10,12,.84)';ctx.fillRect(box.x,box.y,box.w,box.h);
    ctx.fillStyle='#ededf0';ctx.fillText(text,box.x+6,box.y+box.h/2);
    boxes.push(box);
  }
  // Zoomed-in venue names use the same collision rules and count limit.
  if(Z>1.4)for(const h of MARKET.hits){
    if(boxes.length>=(marketPhone()?5:9))break;
    const text=h.e.short,w=ctx.measureText(text).width+12,b={x:h.x+12,y:h.y-11,w,h:21,text};
    if(b.x+w>W-8||b.y<8||b.y+b.h>H-8||[...boxes,...markerBoxes,...MARKET.occlusions].some(a=>overlap(a,b)))continue;
    ctx.fillStyle='#dddde3';ctx.fillText(text,b.x+6,b.y+10);boxes.push(b);
  }
  MARKET.labels=boxes;
}
addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='investedia-mode')return;
  if(Array.isArray(e.data.occlusions))MARKET.occlusions=e.data.occlusions.filter(b=>['x','y','w','h'].every(k=>Number.isFinite(b[k])));
  // Parent commands already updated its panel. Echoing them can reopen a
  // just-closed sheet when an older message arrives after X/Escape.
  if(e.data.mode)marketSetMode(e.data.mode,false);
  if(e.data.close)marketClose(false);
  if(e.data.country)marketSelect(e.data.country,e.data.exchange,false);
  if(e.data.connection)MARKET.selectedConnection=e.data.connection;
});
addEventListener('keydown',e=>{if(e.key==='Escape')marketClose();});
window.InvMarketGlobe={state:()=>({ready:MARKET.ready,camera:{cx,cy,R,Z,lon0,lat0},labels:MARKET.labels,
  markers:MARKET.hits.map(h=>({x:h.x,y:h.y,id:h.e.id})),lines:MARKET.drawnLines,news:{articles:stories.length,lines:network.length}})};
marketSetMode('markets');
