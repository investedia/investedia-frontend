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
 let pending;
 async function load(){if(!pending)pending=Promise.all(['projects.json','projects-featured.json'].map(name=>fetch(new URL(name,base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Projects unavailable');return r.json();}))).then(([raw,featured])=>({projects:merge(raw,featured),curation:featured.curation_status,curation_target:featured.curation_target})).catch(e=>{pending=null;throw e;});return pending;}
 window.InvProjectsData={load,merge,valid,milestoneStatus};
})();
