from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w in [390,1440]:
  page=b.new_page(viewport={'width':w,'height':844 if w==390 else 1000},is_mobile=w==390,has_touch=w==390)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),preferences:true,images:false,analytics:false,live:false}))")
  page.goto('http://localhost:8765/assets/globe/news.html?panel=c',wait_until='domcontentloaded');page.wait_for_timeout(3000);page.evaluate('stories.forEach(s=>impactsOf(s).forEach(assetForImpact))')
  for name,js in [('US',"openCountry(byName['United States of America'])"),('Brazil',"openCountry(byName.Brazil)"),('article',"openStory(stories.find(s=>impactsOf(s).some(i=>assetForImpact(i))))"),('asset',"const r=GM.registry.assets['EQ:XNAS:ACB'];assetForImpact({asset:{id:r.id,n:r.name,px:r.px,la:r.geo.la,lo:r.geo.lo,c:r.class}});selectAsset(r.px)")]:
   print(w,name,flush=True);page.evaluate(js);page.wait_for_timeout(700)
   if w==390: page.locator('#sheet-expand').click();page.wait_for_timeout(300)
   assert page.locator('.detail-header').count()==1,name
   assert 'NaN' not in page.locator('#pbody').inner_text(),name
   for scroll in [0,180,500]:
    page.evaluate('(v)=>pbody.scrollTop=v',scroll);page.wait_for_timeout(150)
    result=page.evaluate("""()=>{const h=document.querySelector('.detail-header'),r=h.getBoundingClientRect(),bs=[...h.querySelectorAll('button')].filter(b=>getComputedStyle(b).visibility!=='hidden').map(b=>b.getBoundingClientRect());return {sticky:getComputedStyle(h).position,top:r.top,container:pbody.getBoundingClientRect().top,overlap:bs.some((a,i)=>bs.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))}}""")
    assert result['sticky']=='sticky' and not result['overlap'],(name,result)
   page.evaluate('pbody.scrollTop=0');page.wait_for_timeout(200)
   page.screenshot(path=f'.github/review/phone-panel/after-{w}-{name}.png')
   page.evaluate('pbody.scrollTop=180');page.screenshot(path=f'.github/review/phone-panel/after-{w}-{name}-scrolled.png')
   prior=page.evaluate('JSON.stringify(view)')
   page.locator('[data-back]').click();page.wait_for_timeout(200)
   assert page.evaluate('JSON.stringify(view)') != prior
   page.evaluate(js);page.wait_for_timeout(200);page.locator('#sheet-close').click();page.wait_for_timeout(200)
  assert page.evaluate("SinceNews.card({story:{t:Date.now()},asset:{n:'Nvidia Corp',d:2.78}}).includes('Nvidia Corp · today')")
  assert page.evaluate("[undefined,NaN,Infinity,-Infinity].every(p=>money({p})==='—' && !pctPill(p) && fmtP(p,'ACB')==='—')")
  print(w,'PASS',json.dumps(errors));assert not errors
  page.goto('http://localhost:8765/movers.html',wait_until='domcontentloaded');page.wait_for_timeout(1000)
  page.evaluate("for(let i=0;i<8;i++)window.switchInvTheme(i%2?'light':'dark')")
  page.wait_for_timeout(1500);assert not errors,errors
 b.close()
