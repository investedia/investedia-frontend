// Shared news reads: real API articles merged with the last saved feed, without invented timestamps.
(function(){
 'use strict';
 const valid=s=>s&&typeof s.id==='string'&&typeof s.headline==='string'&&s.location&&typeof s.location.country==='string'&&Number.isFinite(+s.location.lat)&&Math.abs(+s.location.lat)<=90&&Number.isFinite(+s.location.lon)&&Math.abs(+s.location.lon)<=180&&s.source&&typeof s.source.name==='string'&&Number.isFinite(Date.parse(s.published_at));
 function merge(base,remote){
  const old=!base?.demo&&Array.isArray(base?.stories)?base.stories.filter(valid):[],fresh=Number.isFinite(Date.parse(remote?.meta?.generated_at||remote?.meta?.fetched_at))&&Array.isArray(remote?.data?.stories)?remote.data.stories.filter(valid):[];
  if(!old.length&&!fresh.length)throw Error('No valid articles available');
  const t=remote?.meta?.generated_at||remote?.meta?.fetched_at,newer=Number.isFinite(Date.parse(t))&&(!Number.isFinite(Date.parse(base?.updated_at))||Date.parse(t)>=Date.parse(base.updated_at));
  const byId=new Map(old.map(s=>[s.id,s]));for(const s of fresh)if(!byId.has(s.id)||newer)byId.set(s.id,s);
  const dated=Array.from(byId.values(),story=>({story,time:Date.parse(story.published_at)}));
  dated.sort((a,b)=>b.time-a.time);
  return {...(base||{}),demo:false,updated_at:newer?t:base?.updated_at||t,stories:dated.map(entry=>entry.story),newsSource:fresh.length?'api-and-saved':'saved',newsState:fresh.length?remote.meta?.state:'saved'};
 }
 async function api(){if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));if(!window.InvData||window.InvData.mode!=='worker')throw Error('Saved-data mode');return window.InvData.get('news');}
 async function load(url){const[a,b]=await Promise.allSettled([fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Saved feed unavailable');return r.json()}),api()]);const r=merge(a.status==='fulfilled'?a.value:null,b.status==='fulfilled'?b.value:null);window.InvNewsSource.last={source:r.newsSource,state:r.newsState,updated_at:r.updated_at,count:r.stories.length};return r;}
 window.InvNewsSource={load,merge,last:null};
})();
