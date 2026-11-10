// Additional predicates only; original article timestamps and locations are untouched.
(()=>{
 const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 const bounds=(now,minutes)=>({min:new Date(now-minutes*60000).toISOString().slice(0,10),max:new Date(now).toISOString().slice(0,10)});
 function normalize(f,now,minutes){const {min,max}=bounds(now,minutes),clamp=s=>day(s)?s<min?min:s>max?max:s:'';let from=clamp(f.from),to=clamp(f.to);if(from&&to&&from>to)[from,to]=[to,from];return {country:typeof f.country==='string'?f.country:'',from,to};}
 function match(article,f){return (!f.country||article.location?.country===f.country)&&(!f.from||article.t>=Date.parse(f.from+'T00:00:00Z'))&&(!f.to||article.t<Date.parse(f.to+'T00:00:00Z')+864e5);}
 window.InvNewsFilters={day,bounds,normalize,match};
})();
