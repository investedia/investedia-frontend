// P12 check: going back in time only adds connection lines. Serve docs first: cd docs && python3 -m http.server 8767
// Run: node tests/globe-connections-window.mjs   (exit code 1 if a shorter window's line is missing from a longer one)
import { launch, base, fixtureExternal, viewport } from './browser-support.mjs';
const BASE = base;
const b = await launch(); let fail = 0; const out = {};
for (const ph of [false, true]) {
  const c = await b.newContext({ viewport: viewport(ph ? 390 : 1440), deviceScaleFactor: 1, isMobile: ph, hasTouch: ph }); await fixtureExternal(c); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(BASE + '/assets/globe/news.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  await p.evaluate(() => flyTo(10, 20, .9)); await p.waitForTimeout(1500);
  const r = {};
  for (const w of ['6h', '24h', '48h', '7d']) { await p.evaluate(w => setWin(w), w); await p.waitForTimeout(w === '7d' ? 6000 : 1800);
    r[w] = await p.evaluate(() => [...new Set(arcHits.map(h => h.article.id + '>' + h.target.phi.toFixed(2)))]); }
  const miss = (a, z) => r[a].filter(x => !r[z].includes(x)).length;
  const res = { drawn: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.length])), missing: { '6h→24h': miss('6h', '24h'), '24h→48h': miss('24h', '48h'), '48h→7d': miss('48h', '7d') }, errors: errs.length };
  if (Object.values(res.missing).some(Boolean) || res.errors || res.drawn['48h'] < res.drawn['24h'] || res.drawn['7d'] < res.drawn['48h']) fail = 1;
  out[ph ? 'phone' : 'pc'] = res; await c.close();
}
console.log(JSON.stringify(out, null, 1)); await b.close(); process.exit(fail);
