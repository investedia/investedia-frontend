// First-party connection snapshots. No inference, article re-dating or third-party data.
(() => {
 'use strict';
 const TYPES=new Set(['direct','acquisition','supply-chain','partnership','central-bank','currency','market','commodity','regulatory','named-peer']);
 const validRow=c=>c&&typeof c.id==='string'&&typeof c.event==='string'&&Number.isFinite(Date.parse(c.published_at))&&c.origin&&c.dest&&[c.origin.lat,c.origin.lon,c.dest.lat,c.dest.lon].every(Number.isFinite)&&Math.abs(c.origin.lat)<=90&&Math.abs(c.dest.lat)<=90&&Math.abs(c.origin.lon)<=180&&Math.abs(c.dest.lon)<=180&&typeof c.dest.asset==='string'&&c.evidence&&typeof c.evidence.impact==='string'&&Number.isFinite(c.confidence)&&c.confidence>=.25&&c.confidence<=1&&TYPES.has(c.type);
 function dedupe(rows){const map=new Map();for(const row of rows)if(validRow(row)&&!map.has(row.id))map.set(row.id,row);return [...map.values()];}
 function validate(d){if(d?.schema!=='investedia.connections.v1'||!Number.isFinite(Date.parse(d.generated_at))||!Array.isArray(d.connections)||!d.connections.every(validRow))throw Error('Invalid connections snapshot');return {...d,connections:dedupe(d.connections)};}
 async function read(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);try{const response=await fetch(url,{cache:'no-cache',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('Connections unavailable');return validate(await response.json());}finally{clearTimeout(timer);}}
 async function load(staticUrl='connections.json'){
  const configured=window.INV_CONFIG?.apiBaseUrl||window.INV_LIVE_URL||'https://api.investedia.com';
  try{const base=new URL(configured);if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['localhost','127.0.0.1'].includes(base.hostname)))throw Error('Invalid API URL');const d=await read(new URL('/v1/connections',base));return {...d,connectionSource:'api'};}
  catch{const d=await read(staticUrl);return {...d,connectionSource:'static'};}
 }
 window.InvConnectionsSource={load,dedupe,validate};
})();
