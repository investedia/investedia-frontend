/* Market implications: for each recent article that implied up or down for a priced asset, what the asset did afterwards.
   hit = moved the implied way by at least 0.3%, miss = moved the other way by at least 0.3%, flat = under 0.3% either way,
   pending = no price recorded after the article yet. Recorded prices (news-track.json, 72 h) are used while they exist;
   older calls come from the permanent ledger (news-ledger.json). Needs assets/since-news.js. */
(function () {
  const HR = 3600000, FLAT = 0.3, LIVE = 72 * HR;
  const verdict = (move, dir) => Math.abs(move) < FLAT ? 'flat' : ((move > 0) === (dir === 'up')) ? 'hit' : 'miss';
  function asset(markets, ticker) {
    const t = String(ticker || '').toUpperCase(); if (!t) return null;
    return markets[t] || markets[t + '-USD'] || markets[t.replace(/=X$/, '')] || null;
  }
  // -> [{story, impact, asset, dir, pub, move, res, c}] newest first; one entry per story and asset
  function collect(o) {
    const now = o.now || Date.now(), markets = {};
    for (const a of o.markets || []) if (a && a.s) markets[String(a.s).toUpperCase()] = a;
    const led = new Map(((o.ledger && o.ledger.calls) || []).map(c => [c.id + '|' + c.sym, c]));
    const series = (o.track && o.track.s) || {}, out = [];
    for (const s of o.stories || []) {
      const pub = Date.parse(s.published_at); if (!Number.isFinite(pub)) continue;
      const seen = new Set();
      for (const i of s.impacts || []) {
        if (!i || (i.direction !== 'up' && i.direction !== 'down')) continue;
        const a = asset(markets, i.ticker); if (!a || seen.has(a.s)) continue; seen.add(a.s);
        const base = { story: s, impact: i, asset: a, dir: i.direction, pub };
        const l = led.get(s.id + '|' + a.s);
        if (l) { out.push({ ...base, move: l.move, res: l.res, judged: '24h' }); continue; }
        if (now - pub <= LIVE && series[a.s] && window.SinceNews) {
          const c = SinceNews.compute(pub, series[a.s], now);
          if (c.state === 'ok') { out.push({ ...base, move: c.move, res: verdict(c.move, i.direction), c, series: series[a.s], judged: 'live' }); continue; }
        }
        if (now - pub <= LIVE) out.push({ ...base, move: null, res: 'pending' });
      }
    }
    return out.sort((x, y) => y.pub - x.pub);
  }
  const counts = calls => ({ hit: calls.filter(c => c.res === 'hit').length, miss: calls.filter(c => c.res === 'miss').length, flat: calls.filter(c => c.res === 'flat').length, pending: calls.filter(c => c.res === 'pending').length });
  window.Implications = { collect, counts, verdict, FLAT };
})();
