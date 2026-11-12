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
 let pending;
 async function load(){if(!pending)pending=Promise.all(['projects.json','projects-featured.json'].map(name=>fetch(new URL(name,base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Projects unavailable');return r.json();}))).then(async([raw,featured])=>{const gem=await fetch(new URL('projects-energy.json',base),{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);
  return {projects:[...withSector(merge(raw,featured)),...energy(gem)],curation:featured.curation_status,curation_target:featured.curation_target,energy_credit:gem?.credit||null};}).catch(e=>{pending=null;throw e;});return pending;}
 window.InvProjectsData={load,merge,valid,milestoneStatus,energy,withSector};
})();
