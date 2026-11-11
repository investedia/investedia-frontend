// P19 non-visual marker budget. Does not fetch, filter entitlement or change card layouts.
(()=>{
 'use strict';
 const vectors=new WeakMap();
 function project(points,camera){
  const d=Math.PI/180,cl=Math.cos(camera.lon*d),sl=Math.sin(camera.lon*d),cp=Math.cos(camera.lat*d),sp=Math.sin(camera.lat*d),out=[];
  for(const p of points){let v=vectors.get(p);if(!v){const la=p.lat*d,lo=p.lon*d,c=Math.cos(la);v=[c*Math.sin(lo),Math.sin(la),c*Math.cos(lo),{p,x:0,y:0}];vectors.set(p,v);}
   const x=v[0]*cl-v[2]*sl,along=v[2]*cl+v[0]*sl,z=sp*v[1]+cp*along;
   if(z<=.04)continue;const sx=camera.cx+camera.radius*x,sy=camera.cy-camera.radius*(cp*v[1]-sp*along);
   if(sx<0||sy<0||sx>camera.width||sy>camera.height)continue;const node=v[3];node.x=sx;node.y=sy;out.push(node);
  }return out;
 }
 function cluster(nodes,{width,height,zoom=1,selected=null,phone=false}={}){
  const limit=phone?60:200,picked=nodes.find(n=>n.p.id===selected),budget=limit-(picked?1:0);
  // A bounded grid needs one pass, rather than repeatedly re-bucketing thousands of points.
  // Projection already changes the screen grid membership at each globe zoom level.
  const aspect=Math.max(.1,width/Math.max(1,height)),cols=Math.max(1,Math.min(budget,Math.floor(Math.sqrt(budget*aspect)))),rows=Math.max(1,Math.floor(budget/cols));
  const cellW=Math.max(24/Math.max(1,zoom),width/cols),cellH=Math.max(24/Math.max(1,zoom),height/rows),buckets=new Map();
  for(const n of nodes){if(n===picked)continue;const ix=Math.min(cols-1,Math.max(0,Math.floor(n.x/cellW))),iy=Math.min(rows-1,Math.max(0,Math.floor(n.y/cellH))),key=iy*cols+ix;let g=buckets.get(key);if(!g)buckets.set(key,g={x:0,y:0,group:[],p:n.p});g.x+=n.x;g.y+=n.y;g.group.push(n);}
  const groups=[...buckets.values()];
  for(const g of groups){g.x/=g.group.length;g.y/=g.group.length;if(g.group.length===1){g.p=g.group[0].p;delete g.group;}}
  if(picked)groups.push(picked);
  return groups;
 }
 window.InvProjectsCluster={cluster,project};
})();
