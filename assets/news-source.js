// Shared news reads: real API articles merged with the last saved feed, without invented timestamps.
(function(){
 'use strict';
 const valid=s=>s&&typeof s.id==='string'&&typeof s.headline==='string'&&s.location&&typeof s.location.country==='string'&&Number.isFinite(+s.location.lat)&&Math.abs(+s.location.lat)<=90&&Number.isFinite(+s.location.lon)&&Math.abs(+s.location.lon)<=180&&s.source&&typeof s.source.name==='string';
 function mergeStories(byId,stories,replaceExisting){
  if(!Array.isArray(stories))return false;
  let hasValidStory=false;
  for(const story of stories){
   if(!valid(story))continue;
   const time=Date.parse(story.published_at);
   if(!Number.isFinite(time))continue;
   hasValidStory=true;
   if(replaceExisting||!byId.has(story.id))byId.set(story.id,{story,time});
  }
  return hasValidStory;
 }
 function merge(base,remote){
  const t=remote?.meta?.generated_at||remote?.meta?.fetched_at;
  const remoteTime=Date.parse(t),baseTime=Date.parse(base?.updated_at);
  const newer=Number.isFinite(remoteTime)&&(!Number.isFinite(baseTime)||remoteTime>=baseTime);
  const byId=new Map();
  if(!base?.demo)mergeStories(byId,base?.stories,true);
  const hasApiArticles=Number.isFinite(remoteTime)&&mergeStories(byId,remote?.data?.stories,newer);
  if(!byId.size)throw Error('No valid articles available');
  const dated=[...byId.values()];
  dated.sort((a,b)=>b.time-a.time);
  return {...(base||{}),demo:false,updated_at:newer?t:base?.updated_at||t,stories:dated.map(entry=>entry.story),newsSource:hasApiArticles?'api-and-saved':'saved',newsState:hasApiArticles?remote.meta?.state:'saved'};
 }
 async function api(){if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));if(!window.InvData||window.InvData.mode!=='worker')throw Error('Saved-data mode');return window.InvData.get('news');}
 async function load(url){const[a,b]=await Promise.allSettled([fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Saved feed unavailable');return r.json()}),api()]);const r=merge(a.status==='fulfilled'?a.value:null,b.status==='fulfilled'?b.value:null);window.InvNewsSource.last={source:r.newsSource,state:r.newsState,updated_at:r.updated_at,count:r.stories.length};return r;}
 window.InvNewsSource={load,merge,last:null};
})();
