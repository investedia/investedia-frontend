// One source for Globe and standalone Projects. Never derive a stage from a missing date.
(() => {
 const script=document.currentScript?.src||new URL('assets/projects-data.js',location.href).href;
 const base=new URL('globe/',script),url=u=>{try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:null;}catch{return null;}};
 const valid=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180;
 function milestoneStatus(m,now=new Date()){
  if(!m?.source?.url||!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(m.date||''))return null;
  const a=m.date.split('-').map(Number),b=[now.getFullYear(),now.getMonth()+1,now.getDate()];
  for(let i=0;i<a.length;i++){if(a[i]<b[i])return 'Completed';if(a[i]>b[i])return 'Planned';}
  return m.status==='In progress'&&m.status_source?.url?'In progress':null;
 }
 function merge(raw,featured){
  const byId=new Map();
  const v2=raw.schema==='investedia.projects.v2';
  if(raw.schema&&!['investedia.projects.v1','investedia.projects.v2'].includes(raw.schema))throw Error('Unsupported projects schema');
  const has=(r,f)=>(r.src||[]).some(s=>s.licence&&s.checked_at&&url(s.url)&&(s.field_list||[]).includes(f));
  for(const r of raw.projects||[]){
   // Verified rows need evidence for every core field; the inherited 10 Nov Wikidata snapshot (CC0) stays visible, marked unverified.
   if(v2&&(!['verified','retained_unverified'].includes(r.validation_status)||!['k','n','lo','la','c','cc','t'].every(f=>has(r,f))))continue;
   if(!v2&&/decommission|cancelled|canceled|demolish|closed|retired/i.test(r.s||''))continue;
   const p={id:r.k,wikidata_id:/^Q[1-9]\d*$/.test(r.k)?r.k:null,name:r.n,country:r.c,location:r.c,lat:r.la,lon:r.lo,type:r.t,stage:(!v2||has(r,'s'))?r.s||null:null,start_year:!v2?r.y||null:null,status_year:v2&&has(r,'y')?r.y||null:null,milestones:[],figures:[],sources:v2?(r.src||[]).filter(s=>url(s.url)&&s.licence&&s.checked_at):[{name:'Wikidata (CC0)',url:'https://www.wikidata.org/wiki/'+r.k,checked_at:'2026-11-10'},...(url(r.wiki)?[{name:'Wikipedia',url:url(r.wiki)}]:[])],wiki:url(r.wiki),featured:false,verified:!v2||r.validation_status==='verified',cc:r.cc||null,capacity:v2&&has(r,'cap')?r.cap:null,cost:v2&&has(r,'cost')?r.cost:null,owners:v2&&has(r,'own')?r.own||[]:[],aliases:v2&&has(r,'aliases')?r.aliases||[]:[]};
   if(valid(p))byId.set(p.id,p);
  }
  for(const f of featured.projects||[]){if(!valid(f)||v2&&!['reviewed','inherited_preview'].includes(f.review_status))continue;const existing=f.wikidata_id?byId.get(f.wikidata_id):null;if(existing)byId.delete(f.wikidata_id);
   byId.set(f.id,{...existing,...f,featured:true,stage:f.stage&&f.stage_source?.url?f.stage:existing?.stage||null,milestones:(f.milestones||[]).filter(m=>m.title&&m.date&&url(m.source?.url)),figures:(f.figures||[]).filter(x=>x.label&&x.value!=null&&url(x.source?.url)),sources:[...(f.sources||[]),...(existing?.sources||[])].filter((x,i,a)=>x.url&&a.findIndex(y=>y.url===x.url)===i)});
  }
  return [...byId.values()];
 }
 // Energy: every power project sits under the sector "Energy" with a specific kind (solar, wind, ...).
 const WD_KIND={'Hydro energy':'Hydropower','Wind energy':'Wind','Solar energy':'Solar','Nuclear energy':'Nuclear'};
 // Owner rule (12 Nov 2026): energy shows only the investable pipeline, so older energy rows without a planned or construction stage are hidden.
 function withSector(list){return list.filter(p=>{const k=WD_KIND[p.type];p.sector=k?'Energy':p.type;if(k&&!p.energy)p.energy=k;return !k||p.featured||/proposed|approved|construction|planned/i.test(p.stage||'');});}
 // GEM Global Integrated Power Tracker plants (CC BY 4.0), converted by tools/gem_power.py. Real rows only.
 function energy(doc){if(doc?.schema!=='investedia.energy.v1')return [];const out=[];
  for(const r of doc.plants||[]){const [id,name,country,cc,lat,lon,kind,stage,mw,year,owner,wiki,units,listed,sat,before]=r;
   const p={id,name,country,location:country,lat,lon,type:{Solar:'Solar energy',Wind:'Wind energy',Hydropower:'Hydro energy',Nuclear:'Nuclear energy',Coal:'Coal power','Oil & gas':'Oil & gas power',Bioenergy:'Bioenergy',Geothermal:'Geothermal energy'}[kind]||kind,sector:'Energy',energy:kind,stage,start_year:null,status_year:year||null,milestones:[],figures:[],
    sources:[{name:doc.credit,url:url(wiki)||doc.source_url,licence:doc.licence,checked_at:'2026-11-12'}],wiki:url(wiki),featured:false,verified:true,cc:cc||null,
    capacity:Number.isFinite(mw)?{unit:'megawatt',value:mw}:null,cost:null,owners:owner?[owner]:[],aliases:[],units,gem:true,listed:listed?{ticker:listed[0],name:listed[1],stake:listed[2]||null}:null,
    satellite:sat&&doc.satellite?{date:sat[0],url:doc.satellite.url.replace('{d}',sat[0]).replace('{r}',sat[2]).replace('{c}',sat[1]),before:before&&before[1]>=(doc.satellite.min_change??Infinity)?{date:before[0],url:doc.satellite.url.replace('{d}',before[0]).replace('{r}',sat[2]).replace('{c}',sat[1])}:null,x:((lon+180)/doc.satellite.tile_deg)-sat[1],y:((90-lat)/doc.satellite.tile_deg)-sat[2],credit:doc.satellite.credit}:null};
   if(valid(p))out.push(p);}
  return out;}
 // Verified investment layer (owner decisions 12 Nov 2026): only projects whose link to a listed company is
 // proven by a company publication (A) or by regulator and registry records (B). Built by the backend batch
 // engine (tools/projects/invest). Stakes appear only when the source states them; otherwise the note says so.
 const KIND_LABEL={Solar:'Solar energy',Wind:'Wind energy',Hydropower:'Hydro energy',Nuclear:'Nuclear energy',Coal:'Coal power','Oil & gas':'Gas power','Battery storage':'Battery storage',Bioenergy:'Bioenergy',Geothermal:'Geothermal energy'};
 const CAT={A:'Company-confirmed',B:'Regulator-confirmed'};
 function invest(doc){if(doc?.schema!=='investedia.projects.invest.v1')return [];const out=[];
  for(const r of doc.projects||[]){
   const ex=(r.exposures||[]).map(e=>{const v=e.verification||{};return {ticker:v.listing?.ticker||null,exchange:v.listing?.exchange||null,name:e.company?.name||v.identity?.legal_name||e.listed_name,legal_name:v.identity?.legal_name||null,sym:e.company?.symbol||null,exchange_short:e.company?.exchange_short||null,
     category:v.category,category_label:CAT[v.category]||null,direct:v.exposure_type==='direct',path:e.path_names||[],stake:v.stake?.value??null,stake_note:v.stake?.note||null,
     hq:e.hq&&Number.isFinite(e.hq.lat)&&Number.isFinite(e.hq.lon)?e.hq:null,
     evidence:(v.link||[]).filter(l=>url(l.url)).map(l=>({url:l.url,publisher:l.publisher||'',date:l.document_date||l.edition||null,proves:l.proves||'',quote:l.quote||null}))};}).filter(e=>e.ticker&&e.evidence.length);
   if(!ex.length)continue;
   const p={id:r.id,name:r.name,country:r.country,location:r.country,lat:r.lat,lon:r.lon,type:KIND_LABEL[r.kind]||r.kind,sector:'Energy',energy:r.kind,stage:r.stage||null,
    start_year:null,status_year:r.expected_year||null,milestones:[],figures:[],sources:ex.flatMap(e=>e.evidence).filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i).map(x=>({name:x.publisher,url:x.url,checked_at:x.date})),
    wiki:null,featured:false,verified:true,cc:r.cc||null,capacity:Number.isFinite(r.mw)?{unit:'megawatt',value:r.mw}:null,
    cost:r.cost&&Number.isFinite(r.cost.amount)?{value:r.cost.amount,currency:r.cost.currency,quote:r.cost.quote,source:url(r.cost.source)}:null,
    owners:[],aliases:[],invest:{exposures:ex,other_owners:(r.other_owners||[]).map(o=>o.name).filter(Boolean),stage_note:r.stage_note||null,precision:r.precision||null,location_note:r.location_note||null},
    listed:{ticker:ex[0].ticker,name:ex[0].name,sym:ex[0].sym,stake:ex[0].stake!=null?ex[0].stake+'%':null}};
   const im=r.images,img=f=>new URL('../img/projects/sat/'+encodeURIComponent(f),base).href;
   if((r.precision==='exact'||r.precision==='site')&&im?.now?.file)p.satellite={url:img(im.now.file),date:im.now.date,before:im.before?.file?{url:img(im.before.file),date:im.before.date}:null,x:.5,y:.5,s2:true,km:im.now.width_km||3,credit:im.now.credit};
   if(valid(p))out.push(p);}
  return out;}
 let pending;
 async function load(){if(!pending)pending=Promise.resolve().then(async()=>{
  const inv=await fetch(new URL('projects-invest.json',base),{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);
  // Owner decision 13 Nov 2026: only verified investment links are shown. Unverified Wikidata/GEM records are never a fallback.
  if(inv?.schema!=='investedia.projects.invest.v1')throw Error('Verified projects unavailable');
  return {projects:invest(inv),verified:true,curation:'Verified investment links only',curation_target:null,energy_credit:(inv.credit||[]).join(' · ')};}).catch(e=>{pending=null;throw e;});return pending;}
 window.InvProjectsData={load,merge,valid,milestoneStatus,energy,withSector,invest};
})();
