import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {runSmoke} from '../scripts/smoke-deployed.mjs';
const root=new URL('../',import.meta.url);
const news=JSON.parse(await fs.readFile(new URL('assets/globe/news-live.json',root),'utf8'));
const quotes=JSON.parse((await fs.readFile(new URL('assets/quotes.js',root),'utf8')).replace(/^[^=]*=/,'').replace(/;\s*$/,''));
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}/`;}
async function close(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

test('browser smoke passes healthy targets and exposes errors, overflow, leaked files and API failures',async()=>{
 let broken=false;
 const worker=http.createServer((request,response)=>{
  response.setHeader('Access-Control-Allow-Origin',request.headers.origin||'*');
  response.setHeader('Content-Type','application/json');
  if(broken&&request.url==='/v1/news'){response.writeHead(503);response.end('{}');return;}
  response.end(JSON.stringify({data:request.url==='/v1/news'?{stories:news.stories}:quotes.q}));
 });
 const api=await listen(worker);
 const website=http.createServer((request,response)=>{
  if(['/.env','/config.local.json','/AGENTS.md'].includes(request.url)){
   if(broken&&request.url==='/.env'){response.setHeader('Content-Type','text/plain');response.end('FIXTURE_ONLY=true');}
   else{response.writeHead(404);response.end();}
   return;
  }
  response.setHeader('Content-Type','text/html');
  const errors=broken&&request.url==='/news.html'?'<script>throw new Error("fixture exception")</script><div style="width:2000px">overflow fixture</div>':'';
  const name=request.url==='/assets/globe/news.html'?'Globe':request.url==='/news.html'?'News':request.url==='/profile.html'?'Profile':'Home';
  const marker=broken&&name==='Profile'?'home':name.toLowerCase();
  response.end(`<!doctype html><html><head><title>Investedia ${name}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body data-page="${marker}"><main><h1>Smoke fixture</h1></main><script>window.INV_CONFIG={apiBaseUrl:${JSON.stringify(api)}}</script>${errors}</body></html>`);
 });
 const base=await listen(website);
 try{
  const healthy=await runSmoke({baseUrl:base,settleMs:20,timeoutMs:5000});
  assert.equal(healthy.length,13);
  assert.deepEqual(healthy.filter(row=>!row.pass),[]);
  broken=true;
  const failed=await runSmoke({baseUrl:base,settleMs:20,timeoutMs:5000});
  for(const check of ['News 1440px','News 390px','Profile 1440px','Profile 390px','Not served: .env','Worker /v1/news']){
   assert.equal(failed.find(row=>row.check===check)?.pass,false,check);
  }
  assert.match(failed.find(row=>row.check==='News 390px').detail,/horizontal overflow/);
  assert.match(failed.find(row=>row.check==='News 390px').detail,/1 console\/runtime errors/);
 }finally{await close(website);await close(worker);}
});
