// Investedia shared UI: icons, header + dropdowns, mobile drawer, search palette, ticker, footer, charts, tables.
(function () {
  const M = window.MOCK;
  const page = document.body.dataset.page || '';
  const isLegalPage = ['legal','terms','privacy','cookies','disclaimer','ai-disclosure','sources','copyright','editorial-policy','corrections','affiliate-disclosure','accessibility','contact'].includes(page);
  document.addEventListener('DOMContentLoaded', () => {
 const skip=document.querySelector('.skip-link');if(skip)document.body.prepend(skip);
 window.InvConsent?.mount();
 const labelScroll = root => root.querySelectorAll('.tbl-wrap,.legal-table,#sessions').forEach(e=>{e.tabIndex=0;e.setAttribute('role','region');e.setAttribute('aria-label','Scrollable data table');});
 labelScroll(document);new MutationObserver(()=>labelScroll(document)).observe(document.body,{childList:true,subtree:true});
 });

  // ---------- icons (24px stroke set) ----------
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    stocks: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    indices: '<rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="17" rx="1"/>',
    crypto: '<path d="M9 7h5a2.5 2.5 0 0 1 0 5H9zM9 12h6a2.5 2.5 0 0 1 0 5H9zM9 5v14M12 5v2M12 17v2"/>',
    currencies: '<circle cx="8" cy="8" r="5"/><circle cx="16" cy="16" r="5"/>',
    commodities: '<path d="M4 20h16M6 20l2-8h8l2 8M9 12l1.5-5h3L15 12"/>',
    bonds: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5M15 4v4h4"/>',
    funds: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/>',
    screener: '<path d="M3 5h18M6 12h12M10 19h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>', logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/>', heat: '<rect x="3" y="3" width="10" height="10" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="15" y="11" width="6" height="10" rx="1"/><rect x="3" y="15" width="10" height="6" rx="1"/>',
    compound: '<path d="M3 20c6 0 9-4 12-10 1.5-3 3-5 6-6"/><path d="M16 4h5v5"/>',
    earnings: '<path d="M4 4h16v16H4z"/><path d="M8 15v-3M12 15V9M16 15v-5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    home: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    trend: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5M8 17h3"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v14h-7"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>',
    yt: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    xlogo: '<path d="M4 4l16 16M20 4 4 20"/>',
    in: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  };
  const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- design studio (studio.html): saved look, applied on this device only ----------
  const STUDIO_DEF = { accent: '#FF7A1A', corners: 'soft', size: 'default', font: 'inter', icons: 'box', motion: 'full', cards: 'bordered', numbers: 'mono', dropdown: 'sheet' };
  function applyStudio(c) {
    const h = document.documentElement, cfg = Object.assign({}, STUDIO_DEF, c || {});
    [...h.classList].filter(k => k.startsWith('st-')).forEach(k => h.classList.remove(k));
    h.style.setProperty('--accent', cfg.accent); h.style.setProperty('--accent-hi', `color-mix(in srgb, ${cfg.accent} 82%, #fff)`);
    ['corners', 'size', 'font', 'icons', 'motion', 'cards', 'numbers', 'dropdown'].forEach(k => cfg[k] !== STUDIO_DEF[k] && h.classList.add(`st-${k}-${cfg[k]}`));
    if (window.InvConsent?.allows('images') && cfg.font === 'geist' && !document.getElementById('st-geist')) document.head.insertAdjacentHTML('beforeend', '<link id="st-geist" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap">');
  }
  let studio = null; try { studio = JSON.parse(localStorage.getItem('inv-studio') || 'null'); } catch {}
  if (studio && studio.apply) applyStudio(studio);
  const ACC = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FF7A1A';
  // ---------- formatters ----------
  const fmtP = (a, v = a.p) => {
    if (a.y) return v.toFixed(3) + '%';
    if (window.InvPrefs && (a.c === 'crypto' || a.cur === 'USD' && !['indices','currencies','bonds'].includes(a.c))) return InvPrefs.fmt(v, { t: 'crypto' });
    const d = v >= 1000 ? 2 : v >= 10 ? 2 : v >= 1 ? 4 : 4;
    return (a.c === 'currencies' || a.c === 'indices' || a.c === 'bonds' ? '' : ({ EUR: '€', GBP: '£', JPY: '¥', USD: '$', CHF: 'CHF ', CAD: 'C$', AUD: 'A$', NZD: 'NZ$', HKD: 'HK$', SGD: 'S$', KRW: '₩', INR: '₹', CNY: '¥', ZAR: 'R ', EGP: 'E£', SAR: 'SAR ', AED: 'AED ', QAR: 'QAR ', BRL: 'R$', MXN: 'MX$', ILS: '₪' }[a.cur] || (a.x === 'XETRA' || a.x === 'EURONEXT' ? '€' : a.x === 'LSE' ? '£' : '$'))) + v.toLocaleString('en-US', { minimumFractionDigits: a.c === 'currencies' ? 4 : d, maximumFractionDigits: a.c === 'currencies' ? 4 : d });
  };
  const fmtC = (v, bps) => bps ? `${v > 0 ? '+' : ''}${(v * 1).toFixed(1)} bp` : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`;
  const cls = v => v > 0 ? 'up' : v < 0 ? 'down' : 'muted';
  const cap = b => b == null ? '—' : `<span data-usd-value="${b*1e9}">${window.InvPrefs?InvPrefs.compact(b*1e9,{cur:'USD'}):'$'+b+'B'}</span>`;
  // Asset logos, all round and self-hosted in assets/logos: coin logos (CC0 set), brand marks (simple-icons CC0, svgl MIT), company icons
  // and round flags (circle-flags, MIT) for indices, bonds and currencies. Anything else gets a coloured ticker tile.
  const COIN = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'UNI', 'AAVE', 'USDT', 'USDC', 'TRX', 'ZEC', 'XMR', 'LEO', 'XLM', 'BCH', 'DAI', 'LTC', 'QNT', 'HYPE', 'NEAR', 'HBAR', 'PYUSD', 'SHIB', 'CRO', 'ENA', 'RLUSD', 'SUI']);
  const COIN_PNG = new Set(['HYPE', 'NEAR', 'HBAR', 'PYUSD', 'SHIB', 'CRO', 'ENA', 'RLUSD', 'SUI']);
  const GLYPH = new Set(['NVDA', 'AAPL', 'GOOGL', 'META', 'TSLA', 'AVGO', 'V', 'DELL', 'INTC', 'NFLX', 'AMD', 'BA', 'SAP', 'KO', 'BAC', 'HSBA', 'SHEL', 'TM', 'BABA', 'SHOP', 'NU', 'MSFT', 'ADBE', 'CRM', 'MELI', 'ULVR', 'SIE', 'AIR', 'RACE', 'SMSN', 'HYMTF', 'SONY', 'XIACY', 'INFY', 'HDB']);
  const ICON = new Set(['ALV', 'AMZN', 'ARKK', 'ARMCO', 'ASML', 'AZN', 'BHP', 'BNP', 'CBA', 'CHKP', 'COMI', 'COST', 'CRWV', 'CVX', 'DBS', 'EMAAR', 'ENB', 'ENBD', 'ENEL', 'ENPH', 'FMX', 'FXAIX', 'GLD', 'GS', 'ITUB', 'ITX', 'JNJ', 'JPM', 'LLY', 'MEL', 'MQG', 'MTN', 'MUFG', 'NAB', 'NESN', 'NTDOY', 'NVO', 'OR', 'ORCL', 'PBR', 'PEP', 'PFE', 'QNBK', 'QQQ', 'RIO', 'RJHI', 'ROG', 'RY', 'SAN', 'SBK', 'SCHD', 'SHP', 'STC', 'TCEHY', 'TD', 'TEVA', 'TSM', 'VALE', 'VTI', 'WFC', 'WMT', 'WULF', 'XOM', 'UNH', 'RHM', 'RELI', 'FMG', 'BYDDY', 'CNQ']), ICON_ALIAS = { VOO: 'VTI', VFIAX: 'VTI', VWCE: 'VTI', VGK: 'VTI' };
  const FLAG = { SPX: 'us', NDX: 'us', DJI: 'us', RUT: 'us', ES1: 'us', YM1: 'us', NQ1: 'us', DAX: 'de', CAC: 'fr', UKX: 'gb', NKY: 'jp', SX5E: 'eu', HSI: 'hk', TSX: 'ca', IBOV: 'br', MXX: 'mx', XJO: 'au', NZ50: 'nz', J203: 'za', EGX30: 'eg', NGSE: 'ng', SENSEX: 'in', KOSPI: 'kr', SSEC: 'cn',
    US02Y: 'us', US10Y: 'us', US30Y: 'us', USIG: 'us', USHY: 'us', DE10Y: 'de', FR10Y: 'fr', JP10Y: 'jp', UK10Y: 'gb', IT10Y: 'it', DXY: 'us' };
  const CCY = { EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', CHF: 'ch', AUD: 'au', TRY: 'tr', MXN: 'mx', ZAR: 'za', CAD: 'ca', CNY: 'cn', BRL: 'br', INR: 'in', KRW: 'kr', NZD: 'nz', ILS: 'il', EGP: 'eg' };
  const CMD = {
    bar: '<path d="M3.5 17.5h17l-2.6-6.5H6.1z"/><path d="M7.6 11l1.3-4h6.2l1.3 4"/>',
    drop: '<path d="M12 3.5c3 4.3 5.8 7.4 5.8 10.7a5.8 5.8 0 0 1-11.6 0c0-3.3 2.8-6.4 5.8-10.7z"/>',
    flame: '<path d="M12 3c.8 3.4 5 5.3 5 10.2a5 5 0 0 1-10 0c0-2.5 1.2-4 2.6-5.2.2 1.7.9 2.7 2 3.1-.1-3 .1-5.6.4-8.1z"/>',
    grain: '<path d="M12 21V8"/><path d="M12 10.5c-2-.8-3.2-2.6-3.2-4.8 2.1.2 3.2 1.8 3.2 3.9 0-2.1 1.1-3.7 3.2-3.9 0 2.2-1.2 4-3.2 4.8z"/><path d="M12 15.5c-2-.8-3.2-2.4-3.2-4.4 2.1.2 3.2 1.6 3.2 3.6 0-2 1.1-3.4 3.2-3.6 0 2-1.2 3.6-3.2 4.4z"/>',
    bean: '<ellipse cx="12" cy="12" rx="6" ry="8.5"/><path d="M12 3.5c-2.2 3 2.2 5.5 0 8.5s2.2 5.5 0 8.5"/>' };
  const CMD_OF = { XAU: 'bar', XAG: 'bar', PL: 'bar', HG: 'bar', WTI: 'drop', BRENT: 'drop', NG: 'flame', ZW: 'grain', ZC: 'grain', ZS: 'grain', KC: 'bean' };
  const img = (src, cls) => `<img src="${src}" alt="" width="48" height="48" decoding="async"${cls ? ` class="${cls}"` : ''}>`;
  const logo = (a, size = '') => {
    const s = a.s, icon = ICON_ALIAS[s] || s;
    if (COIN.has(s)) return `<span class="logo ${size} logo-img">${img(`assets/logos/${s}.${COIN_PNG.has(s) ? 'png' : 'svg'}`)}</span>`;
    const fc = FLAG[s] || ((a.c === 'indices' || a.c === 'bonds') && a.place && a.place !== 'Global' ? (a.place === 'UK' ? 'gb' : a.place.toLowerCase()) : null);
    if (fc) return `<span class="logo ${size} logo-img">${img(`assets/logos/flags/${fc}.svg`)}</span>`;
    if (a.c === 'currencies' && CCY[s.slice(0, 3)] && CCY[s.slice(3)]) return `<span class="logo ${size} logo-fx">${img(`assets/logos/flags/${CCY[s.slice(0, 3)]}.svg`)}${img(`assets/logos/flags/${CCY[s.slice(3)]}.svg`)}</span>`;
    if (GLYPH.has(s)) return `<span class="logo ${size} logo-tile">${img(`assets/logos/${s}.svg`)}</span>`;
    if (ICON.has(icon)) return `<span class="logo ${size} logo-tile">${img(`assets/logos/${icon}.png`)}</span>`;
    if (CMD_OF[s]) return `<span class="logo ${size}" style="background:#29292d"><svg class="logo-cmd" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CMD[CMD_OF[s]]}</svg></span>`;
    const t = s.length > 4 ? s.slice(0, 3) : s; return `<span class="logo ${size} ${t.length === 4 && !size ? 'l4' : ''}" style="background:#29292d">${t}</span>`;
  };
  const href = a => `asset.html?s=${a.s}`;
  // Real headlines open the publisher's article in a new tab; our own stories open on the site
  const nhref = n => n.url ? `href="${n.url}" target="_blank" rel="noopener"` : 'href="article.html"';

  // One update per display frame, whatever the screen's refresh rate
  const rafMove = fn => { let last = null; return e => { if (last === null) requestAnimationFrame(() => { const ev = last; last = null; fn(ev); }); last = e; }; };

  // ---------- brand ----------
  const mark = `<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="#000"/><path d="M0 31 11 24.5l7 4.5 10-10 12 6.5V40H0z" fill="#1e1e21"/><path d="M0 28 11 21.5l7 4.5 10-10 12 6.5" fill="none" stroke="#FF7A1A" stroke-width="4"/></svg>`;
  const brand = `<a class="brand notranslate" translate="no" href="index.html" aria-label="Investedia home">${mark}<b>Invested<span class="i">i</span>a</b></a>`;

  // ---------- header ----------
  // Mega-menu content per market category: link columns + popular assets
  const MENU = {
    stocks: { cols: [
      ['Discover', [['Stock Screener', 'screener.html'], ['Trending Stocks', 'stocks.html#trending'], ['Most Active', 'stocks.html#active'], ['Top Gainers', 'stocks.html#gainers'], ['Top Losers', 'stocks.html#losers']]],
      ['Opportunities', [['Undervalued Stocks', 'screener.html?preset=undervalued'], ['Overvalued Stocks', 'screener.html?preset=overvalued'], ['52-Week Highs', 'screener.html?preset=highs'], ['52-Week Lows', 'screener.html?preset=lows'], ['Top Bank Stocks', 'screener.html?preset=banks'], ['Renewable Energy Stocks', 'screener.html?preset=renewable']]],
      ['Markets and events', [['United States', 'stocks.html#region-us'], ['Americas', 'stocks.html#region-americas'], ['Europe', 'stocks.html#region-europe'], ['Pre-Market', 'stocks.html#premarket'], ['After Hours', 'stocks.html#afterhours'], ['Earnings Calendar', 'calendar.html#earnings'], ['World ADRs', 'stocks.html#adrs']]],
    ], pop: ['AAPL', 'TSLA', 'META', 'AMZN', 'MSFT', 'NVDA', 'NFLX', 'AMD', 'BA', 'GME'] },
    indices: { cols: [
      ['Indices', [['Major Indices', 'markets.html'], ['Real-Time Indices', 'markets.html'], ['World Indices', 'markets.html'], ['Global Indices', 'markets.html']]],
      ['Futures', [['Indices Futures', 'markets.html'], ['Dow Jones Futures', 'asset.html?s=YM1'], ['S&P 500 Futures', 'asset.html?s=ES1'], ['Nasdaq Futures', 'asset.html?s=NQ1']]],
    ], pop: ['SPX', 'DJI', 'NDX', 'DAX', 'UKX', 'SX5E', 'NKY'] },
    crypto: { cols: [
      ['Explore', [['Crypto Overview', 'markets.html'], ['Trending Crypto', 'markets.html'], ['Crypto Screener', 'markets.html'], ['Top Gainers', 'markets.html'], ['Top Losers', 'markets.html']]],
      ['Market data', [['Most Active', 'markets.html'], ['Crypto Market Cap', 'markets.html'], ['Bitcoin Dominance', 'markets.html'], ['DeFi', 'markets.html'], ['Stablecoins', 'markets.html']]],
    ], pop: ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'] },
    currencies: { cols: [
      ['Pairs', [['Major Pairs', 'markets.html'], ['Minor Pairs', 'markets.html'], ['Exotic Pairs', 'markets.html'], ['Currency Converter', 'converter.html']]],
      ['Analytics', [['Currency Heatmap', 'markets.html'], ['Currency Strength', 'markets.html'], ['Forex Volatility', 'markets.html'], ['Economic Events', 'calendar.html']]],
    ], pop: ['EURUSD', 'GBPUSD', 'USDJPY', 'EURGBP', 'AUDUSD'] },
    commodities: { cols: [
      ['Energy', [['Crude Oil', 'asset.html?s=WTI'], ['Brent Oil', 'asset.html?s=BRENT'], ['Natural Gas', 'asset.html?s=NG']]],
      ['Metals', [['Gold', 'asset.html?s=XAU'], ['Silver', 'asset.html?s=XAG'], ['Copper', 'asset.html?s=HG'], ['Platinum', 'asset.html?s=PL']]],
      ['Agriculture', [['Wheat', 'asset.html?s=ZW'], ['Corn', 'asset.html?s=ZC'], ['Coffee', 'asset.html?s=KC'], ['Soybeans', 'asset.html?s=ZS']]],
    ], pop: ['XAU', 'WTI', 'XAG', 'NG', 'HG'] },
    bonds: { cols: [
      ['Government', [['Government Bonds', 'markets.html'], ['US Treasuries', 'markets.html'], ['European Bonds', 'markets.html'], ['UK Gilts', 'markets.html']]],
      ['Corporate & yields', [['Corporate Bonds', 'markets.html'], ['High-Yield Bonds', 'asset.html?s=USHY'], ['US 10-Year Yield', 'asset.html?s=US10Y'], ['US 2-Year Yield', 'asset.html?s=US02Y'], ['Yield Curve', 'markets.html']]],
    ], pop: ['US10Y', 'US02Y', 'US30Y', 'DE10Y', 'UK10Y'] },
    funds: { cols: [
      ['Fund types', [['ETFs', 'markets.html'], ['Mutual Funds', 'markets.html'], ['Index Funds', 'markets.html'], ['Dividend ETFs', 'markets.html']]],
      ['Discover', [['Top ETFs', 'markets.html'], ['Trending ETFs', 'markets.html'], ['ETF Screener', 'markets.html'], ['Fund Comparison', 'compare.html?type=funds'], ['Fund Flows', 'markets.html']]],
    ], pop: ['SPY', 'VOO', 'QQQ', 'VTI', 'SCHD', 'IBIT'] },
  };
  const megaPanel = k => {
    const m = MENU[k], c = M.categories.find(x => x.k === k);
    return `<div class="mega-panel" data-panel="${k}" ${k === 'stocks' ? '' : 'hidden'}>
      <div class="mega-cols" style="grid-template-columns:repeat(${m.cols.length},minmax(0,1fr))">${m.cols.map(([h, links]) => `<div><h6>${h}</h6>${links.map(([t, u]) => `<a class="mega-link" role="menuitem" href="${u}">${t}</a>`).join('')}</div>`).join('')}</div>
      <div class="mega-pop"><h6>Popular ${c.t.toLowerCase()}</h6>${m.pop.map(s => M.bySym[s]).map(a => `<a class="dd-row" href="${href(a)}"><span class="ident">${logo(a)}<span><b>${a.c === 'indices' ? a.n : a.s}</b><small>${a.c === 'indices' ? a.x : a.n}</small></span></span><span class="num" data-lp="${a.s}">${fmtP(a)}</span><span class="num ${cls(a.d)}" data-lc="${a.s}">${fmtC(a.d, a.y)}</span></a>`).join('')}</div>
      <div class="dd-foot"><span class="preview-flag"><i></i>Delayed prices · crypto live</span><a href="${c.page}">Open ${c.t} overview →</a></div>
    </div>`;
  };
  const megaMarkets = `<div class="dd dd-mega" id="dd-markets" role="menu">
    <div class="mega-rail" role="tablist">${M.categories.map((c, i) => `<a class="mega-cat" href="${c.page}" data-cat="${c.k}" ${i === 0 ? 'aria-current="true"' : ''}><span class="dd-ic">${icon(c.k)}</span><span><b>${c.t}</b><small>${c.d}</small></span><svg class="mega-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></a>`).join('')}
      <a class="mega-all" href="markets.html">All markets overview →</a><a class="mega-all" href="globe.html">World map →</a></div>
    <div class="mega-body">${M.categories.map(c => megaPanel(c.k)).join('')}</div>
  </div>`;
  const TOOL_GROUPS = [
    ['Market tools', [
      ['screener', 'Stock Screener', 'Filter thousands of stocks', 'screener.html'],
      ['heat', 'Market Heatmaps', 'Every sector at a glance', 'stocks.html#heatmap'],
      ['indices', 'Stock Comparison', 'Up to four side by side', 'compare.html'],
      ['calendar', 'Economic Calendar', 'Rates, jobs, inflation', 'calendar.html'],
      ['earnings', 'Earnings Calendar', 'Who reports this week', 'calendar.html#earnings'],
      ['currencies', 'Currency Converter', 'Major world currencies', 'converter.html'],
    ]],
    ['Calculators', [
      ['stocks', 'POV Calculator', '“What if I had invested…”', 'calculator.html#pov'],
      ['compound', 'Compound Interest', 'Project long-term growth', 'calculator.html#compound'],
      ['calc', 'Investment Returns', 'Annualised return', 'calculator.html#returns'],
      ['funds', 'Dividend Calculator', 'Income and reinvesting', 'calculator.html#dividend'],
    ]],
  ];
  const tools = TOOL_GROUPS.flatMap(g => g[1]);
  const ddTools = `<div class="dd dd-tools" id="dd-tools" role="menu">${TOOL_GROUPS.map(([h, items]) => `<div class="tools-col"><h6>${h}</h6>${items.map(([i, t, d, u]) => `<a class="dd-item" role="menuitem" href="${u}"><span class="dd-ic">${icon(i)}</span><span><b>${t}</b><small>${d}</small></span></a>`).join('')}</div>`).join('')}</div>`;
  // News-first navigation (markets, dashboard and screener pages are no longer in the menu)
  const nav = [
    ['home', 'Home', 'index.html'],
    ['globe', 'Globe', 'assets/globe/news.html'],
    ['news', 'News', 'news.html', `<div class="dd dd-news" id="dd-news">${InvNewsMenu.html('nn-desktop')}</div>`],
    ['markets', 'Markets', 'markets.html'],
    ['education', 'Learn', 'education.html'],
    ['pricing', 'Pricing', 'pricing.html'],
    ['tools', 'Tools', null, ddTools],
    ['about', 'About', 'about.html'],
  ];
  const hdr = document.createElement('header');
  hdr.className = 'hdr';
  hdr.innerHTML = `<div class="wrap">${brand}
    <ul class="nav">${nav.map(([k, t, h, dd, isNew]) => dd
      ? `<li><button class="nav-link" type="button" aria-expanded="false" aria-haspopup="true" data-dd="dd-${k}" ${page === k || (k === 'tools' && ['screener', 'calendar', 'calc', 'compare', 'converter', 'realestate'].includes(page)) || (k === 'education' && page === 'lesson') ? 'aria-current="page"' : ''}>${t}${icon('chev', 'chev')}</button>${dd}</li>`
      : `<li><a class="nav-link" href="${h}" ${page === k || (k === 'news' && ['analysis', 'article'].includes(page)) || (k === 'dashboard' && page === 'ai') || (k === 'education' && page === 'lesson') ? 'aria-current="page"' : ''}>${t}${isNew ? '<span class="badge-new">NEW</span>' : ''}</a></li>`).join('')}</ul>
    <div class="hdr-tools">
      ${page === 'home' ? '' : `<a class="search-btn" href="assets/globe/news.html" aria-label="Search assets, countries and articles">${icon('search')}<span>Search assets, countries &amp; articles</span></a>`}
      <div class="notif-wrap"><button class="icon-btn" type="button" id="notif-btn" aria-label="Notifications" aria-expanded="false" aria-haspopup="true" title="Notifications">${icon('bell')}<span class="dot" id="notif-dot"></span></button>
        <div class="dd notif-dd" id="notif-dd" role="dialog" aria-label="Notifications"></div></div>
      <a class="icon-btn hide-sm owner-only" href="admin.html" aria-label="Analytics dashboard" title="Analytics dashboard">${icon('heat')}</a>
      <div class="notif-wrap acct-wrap hide-sm"><button class="avatar" type="button" id="hdr-avatar" aria-label="Your account" aria-haspopup="true" aria-expanded="false" title="Your account">AK</button><div class="dd acct-dd" id="acct-dd" role="menu" aria-label="Your account"></div></div>
      <button class="icon-btn" type="button" id="theme-btn" aria-label="Switch light or dark mode" title="Light / dark mode"></button>
      <button class="icon-btn menu-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span class="burger" aria-hidden="true"><i></i><i></i><i></i></span></button>
    </div></div>`;
  document.body.prepend(hdr);
  if (window.InvPrefs) InvPrefs.mount((hdr.querySelector('.hdr-tools .search-btn') || hdr.querySelector('.hdr-tools')?.firstElementChild)?.insertAdjacentElement(hdr.querySelector('.hdr-tools .search-btn') ? 'afterend' : 'beforebegin', Object.assign(document.createElement('span'), { className: 'pf-slot' })));
  // profile (stored on this device until accounts exist)
  const getProfile = () => { try { return JSON.parse(localStorage.getItem('inv-profile') || '{}'); } catch { return {}; } };
  const paintAvatar = () => { const u = window.invUser; if (!u) return; const md = u.user_metadata || {}, av = hdr.querySelector('#hdr-avatar'), nm = md.name || md.full_name || u.email || '', pic = md.avatar || md.avatar_url || md.picture, ini = nm.split(/[\s@.]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    av.innerHTML = pic ? `<img src="${String(pic).replace(/"/g, '&quot;')}" alt="" referrerpolicy="no-referrer">` : ini;
    const esc2 = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    hdr.querySelector('#acct-dd').innerHTML = `<div class="acct-head"><b>${esc2(md.name || md.full_name || 'Your account')}</b><small>${esc2(u.email || '')}</small></div><a class="acct-item" role="menuitem" href="profile.html">${icon('user')}Profile &amp; settings</a><a class="acct-item" role="menuitem" href="watchlist.html">${icon('star')}My watchlist</a><a class="acct-item owner-only" role="menuitem" href="admin.html">${icon('heat')}Analytics</a><button class="acct-item acct-out" role="menuitem" type="button" data-logout>${icon('logout')}Log out</button>`; };
  window.addEventListener('profile-change', paintAvatar);
  { const ab = hdr.querySelector('#hdr-avatar'), ad = hdr.querySelector('#acct-dd');
    const close = () => { ad.classList.remove('open'); ab.setAttribute('aria-expanded', 'false'); };
    ab.addEventListener('click', e => { e.stopPropagation(); if (!window.invUser) { location.href = 'profile.html'; return; } const o = !ad.classList.contains('open'); ad.classList.toggle('open', o); ab.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', e => { if (!e.target.closest('#acct-dd')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }); }
  // Real article notifications. IDs stay read across feed refreshes.
  let NOTIFS = [], notifFilter = 'all', readIds = new Set();
  try { readIds = new Set(JSON.parse(localStorage.getItem('inv-notif-ids') || '[]')); } catch {}
  const nb = hdr.querySelector('#notif-btn'), nd = hdr.querySelector('#notif-dd');
  const ne = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const relative = t => { const minutes = Math.min(0, Math.round((Date.parse(t)-Date.now())/60000)), r = new Intl.RelativeTimeFormat(undefined,{numeric:'auto'}); return Math.abs(minutes)<60 ? r.format(minutes,'minute') : Math.abs(minutes)<1440 ? r.format(Math.round(minutes/60),'hour') : r.format(Math.round(minutes/1440),'day'); };
  const mine = s => (s.impacts || []).some(i => window.INVWATCH?.all().some(a => a.kind === 'asset' && a.s === i.ticker || a.kind === 'country' && a.k === s.location?.country));
  // Notification icon: logo of the main affected company or coin, else the flag of its country, else a category glyph
  if (!window.AssetIcons && !window.__aiLoad) { window.__aiLoad = 1; const sc = document.createElement('script'); sc.src = 'assets/asset-icons.js'; sc.onload = () => { try { paintNotif(); } catch {} }; document.head.appendChild(sc); }
  const GL = { markets: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>', companies: '<path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6M8 11h.01M12 11h.01M16 11h.01"/>', economy: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>', technology: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>', crypto: '<circle cx="12" cy="12" r="8"/><path d="M10 8v8m3-8v8M9 9h4.5a1.5 1.5 0 0 1 0 3H9m0 0h5a1.5 1.5 0 0 1 0 3H9"/>', commodities: '<path d="M7 4h10a2 2 0 0 1 1.8 1.2c.8 2.1 1.2 4.2 1.2 6.8s-.4 4.7-1.2 6.8A2 2 0 0 1 17 20H7a2 2 0 0 1-1.8-1.2C4.4 16.700 4 14.600 4 12s.4-4.700 1.200-6.800A2 2 0 0 1 7 4zM4.400 9h15.200M4.400 15h15.200"/>', geopolitics: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/>' };
  const GC = { markets: '#3AA0FF', companies: '#8E8E93', economy: '#FF9F0A', technology: '#8B5CF6', crypto: '#F7931A', commodities: '#E0803F', geopolitics: '#FF453A' };
  let ISO = {}; fetch('assets/globe/iso.json').then(r => r.json()).then(j => { ISO = j; try { paintNotif(); } catch {} }).catch(() => {});
  const notifIcon = s => {
    const i = (s.impacts || []).find(x => x.ticker && x.kind !== 'country') || (s.impacts || [])[0];
    const cc = String(i?.country || ISO[s.location?.country] || '').toLowerCase();
    if (window.AssetIcons && i && i.kind !== 'country' && (i.ticker || i.name)) return `<span class="notif-ic">${AssetIcons.icon({ s: i.ticker || i.name, n: i.name, t: /-USD$/.test(i.ticker || '') ? 'crypto' : 'stocks', g: 'Country ETF', cc })}</span>`; // g keeps the flag as the last fallback instead of a lone letter
    if (cc.length === 2) return `<span class="notif-ic"><img src="assets/globe/flags/${ne(cc)}.svg" alt="" onerror="this.remove()"></span>`;
    return `<span class="notif-ic notif-gl" style="--c:${GC.geopolitics}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GL.geopolitics}</svg></span>`;
  };
  const paintNotif = () => {
    const unread = NOTIFS.filter(s=>!readIds.has(s.id)).length;
    hdr.querySelector('#notif-dot').hidden = !unread;
    const list = NOTIFS.filter(s=>notifFilter === 'high' ? s.importance === 3 : notifFilter === 'mine' ? mine(s) : true);
    nd.innerHTML = `<div class="notif-head"><b>Notifications</b><button type="button" class="link" id="notif-read">Mark all read</button></div><nav class="notif-filters" aria-label="Notification filters">${[['all','All'],['high','High impact'],['mine','My assets']].map(([k,n])=>`<button type="button" data-nf="${k}" aria-pressed="${notifFilter===k}">${n}</button>`).join('')}</nav><div class="notif-list">${list.slice(0,20).map(s=>`<a class="notif-item ${readIds.has(s.id)?'':'unread'}" data-nid="${ne(s.id)}" href="story.html?id=${encodeURIComponent(s.id)}">${notifIcon(s)}<span><span class="notif-msg">${ne(s.headline)}</span><span class="notif-assets">${(s.impacts || []).slice(0,3).map(i=>`<span title="${ne(i.ticker || '')}">${ne(i.name)} <i class="${i.direction==='up'?'up':i.direction==='down'?'down':''}">${i.direction==='up'?'↑':i.direction==='down'?'↓':'↔'}</i></span>`).join('')}</span><small class="dim">${ne(s.source?.name)} · ${relative(s.published_at)}</small></span></a>`).join('') || '<p class="notif-empty">No articles match this filter.</p>'}</div>`;
    nd.querySelector('#notif-read').onclick = e => { e.stopPropagation(); NOTIFS.forEach(s=>readIds.add(s.id)); saveRead(); paintNotif(); };
    nd.querySelectorAll('[data-nf]').forEach(b=>b.onclick=e=>{e.stopPropagation();notifFilter=b.dataset.nf;paintNotif();});
    nd.querySelectorAll('[data-nid]').forEach(a=>a.addEventListener('click',()=>{readIds.add(a.dataset.nid);saveRead();}));
  };
  const saveRead = () => { try { localStorage.setItem('inv-notif-ids',JSON.stringify([...readIds].slice(-1000))); } catch {} };
  paintNotif();
  fetch('assets/globe/news-live.json').then(r=>r.json()).then(n=>{NOTIFS=(n.stories || []).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));paintNotif();}).catch(()=>{});
  window.addEventListener('inv-user',paintNotif);
  nb.onclick = e => { e.stopPropagation(); const o = !nd.classList.contains('open'); closeAll(); paintNotif(); nd.classList.toggle('open', o); nb.setAttribute('aria-expanded', o); };
  document.addEventListener('click', e => { if (!e.target.closest('.notif-wrap')) { nd.classList.remove('open'); nb.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nd.classList.contains('open')) { nd.classList.remove('open'); nb.setAttribute('aria-expanded', 'false'); nb.focus(); } });
  const tb = hdr.querySelector('#theme-btn');
  const sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>', moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  const setTheme = t => { document.documentElement.dataset.theme = t; document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#FFFFFF' : '#0A0A0B'); tb.innerHTML = t === 'light' ? moon : sun; try { localStorage.setItem('inv-theme', t); } catch {} };
  let th = 'dark'; try { th = localStorage.getItem('inv-theme') || 'dark'; } catch {}
  // animated switch: the new theme spreads in a circle from the button that was pressed (View Transitions; GPU-composited, smooth on
  // phones). Browsers without it, and reduced motion, switch instantly.
  const switchTheme = (t, from) => {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return setTheme(t);
    const r = from?.getBoundingClientRect(), x = r ? r.left + r.width / 2 : innerWidth - 40, y = r ? r.top + r.height / 2 : 30;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => setTheme(t));
    vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  };
  setTheme(th); window.setInvTheme = setTheme; window.switchInvTheme = switchTheme;
  tb.onclick = () => switchTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', tb);

  const onScrollHdr = () => hdr.classList.toggle('scrolled', scrollY > 8); addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();
  document.addEventListener('DOMContentLoaded', () => { const m = document.querySelector('main'); if (m) { m.id = m.id || 'main'; if (!('onpagereveal' in window)) m.classList.add('enter'); } });
  // Prefetch internal pages on hover or touch so clicks open instantly
  const fetched = new Set();
  const prefetch = e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; const u = new URL(a.href, location.href); if (u.origin !== location.origin || !u.pathname.endsWith('.html') || u.pathname === location.pathname || fetched.has(u.pathname)) return; fetched.add(u.pathname); const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u.pathname; document.head.append(l); };
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });

  // dropdown behaviour: hover on desktop, click anywhere, Escape closes
  const closeAll = except => { hdr.querySelectorAll('[data-dd]').forEach(b => { if (b === except) return; b.setAttribute('aria-expanded', 'false'); document.getElementById(b.dataset.dd).classList.remove('open'); }); syncPill(); };
  // A soft highlight glides between nav items on hover (desktop only)
  const navUl = hdr.querySelector('.nav'), pill = document.createElement('li');
  pill.className = 'nav-pill'; pill.setAttribute('aria-hidden', 'true');
  let hovered = null;
  function movePill(link) {
    if (!link) { pill.classList.remove('on'); return; }
    const r = link.getBoundingClientRect(), n = navUl.getBoundingClientRect(), first = !pill.classList.contains('on');
    if (first) pill.style.transition = 'none';
    pill.style.width = r.width + 'px'; pill.style.transform = `translateX(${r.left - n.left}px)`;
    if (first) { pill.offsetWidth; pill.style.transition = ''; }
    pill.classList.add('on');
  }
  function syncPill() { if (!navUl) return; movePill(hovered || navUl.querySelector('.nav-link[aria-expanded="true"]')); }
  if (navUl && matchMedia('(hover: hover)').matches) {
    navUl.prepend(pill); navUl.classList.add('has-pill');
    navUl.querySelectorAll('.nav-link').forEach(l => l.addEventListener('pointerenter', () => { hovered = l; movePill(l); }));
    navUl.addEventListener('pointerleave', () => { hovered = null; syncPill(); });
  }
  hdr.querySelectorAll('[data-dd]').forEach(btn => {
    const dd = document.getElementById(btn.dataset.dd), li = btn.parentElement;
    const open = v => { if (v) closeAll(btn); btn.setAttribute('aria-expanded', v); dd.classList.toggle('open', v); };
    let openedByHover = false;
    btn.addEventListener('click', e => { const keepOpen = openedByHover && e.detail > 0; openedByHover = false; open(keepOpen || btn.getAttribute('aria-expanded') !== 'true'); });
    let t;
    li.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) { clearTimeout(t); openedByHover = dd.classList.contains('dd-news') && btn.getAttribute('aria-expanded') !== 'true'; open(true); } });
    li.addEventListener('mouseleave', () => { if (matchMedia('(hover:hover)').matches) t = setTimeout(() => open(false), 120); });
  });
  const rail = hdr.querySelectorAll('.mega-cat');
  const pick = k => { rail.forEach(r => r.toggleAttribute('aria-current', r.dataset.cat === k)); hdr.querySelectorAll('.mega-panel').forEach(p => p.hidden = p.dataset.panel !== k); };
  rail.forEach(r => { r.addEventListener('mouseenter', () => pick(r.dataset.cat)); r.addEventListener('focus', () => pick(r.dataset.cat)); });
  document.addEventListener('click', e => { if (!e.target.closest('.nav>li')) closeAll(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const trigger=[...hdr.querySelectorAll('[data-dd]')].find(b=>b.getAttribute('aria-expanded')==='true'); closeAll(); trigger?.focus(); closePalette(); closeDrawer(); } });

  // mobile drawer
  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.innerHTML = `${page === 'home' ? '' : `<a class="search-btn" href="assets/globe/news.html">${icon('search')}<span>Search assets, countries &amp; articles</span></a>`}
    <a href="index.html">Home</a><a href="assets/globe/news.html">Globe</a><details class="nn-drawer-news"><summary>News ${icon('chev')}</summary>${InvNewsMenu.html('nn-mobile')}</details><a href="markets.html">Markets</a><a href="education.html">Learn</a>
    <details><summary>Tools ${icon('chev')}</summary>${tools.map(([, t, , h]) => `<a href="${h}">${t}</a>`).join('')}</details><a href="about.html">About</a>
    <button class="drawer-theme" type="button"><span>Light mode</span><i aria-hidden="true"></i></button>
    <div class="drawer-cur"><span>Currency</span><span class="dc-host"></span></div>
    <div class="drawer-acct guest-only"><p>Save your watchlist and alerts on every device.</p><button class="btn btn-primary" type="button" data-auth="up">Create free account</button><button class="btn btn-ghost" type="button" data-auth="in">Log in</button></div>
    <div class="drawer-acct member-only"><a class="owner-only" href="admin.html">Analytics dashboard</a><a href="profile.html">Profile &amp; notifications</a><button class="btn btn-ghost" type="button" data-logout>Log out</button></div>`;
  hdr.after(drawer);
  const mt = hdr.querySelector('.menu-toggle');
  // light / dark switch in the phone menu (the header button is hidden on small phones); closes the menu first so the switch is seen
  const dth = drawer.querySelector('.drawer-theme'), paintDth = () => { const l = document.documentElement.dataset.theme === 'light'; dth.firstElementChild.textContent = l ? 'Dark mode' : 'Light mode'; dth.lastElementChild.innerHTML = l ? moon : sun; };
  paintDth(); new MutationObserver(paintDth).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  dth.onclick = () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; closeDrawer(); setTimeout(() => switchTheme(t, dth.lastElementChild), 200); };
  function closeDrawer() { if(drawer.classList.contains('open')) modalClose(drawer); drawer.classList.remove('open'); mt.setAttribute('aria-expanded', 'false'); mt.classList.remove('is-open'); document.body.style.overflow = ''; }
  mt.onclick = () => { const o = !drawer.classList.contains('open'); if(o)modalOpen(drawer);else modalClose(drawer); drawer.classList.toggle('open', o); mt.setAttribute('aria-expanded', o); mt.classList.toggle('is-open', o); mt.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); document.body.style.overflow = o ? 'hidden' : ''; if(o)drawer.querySelector('a').focus(); };

  // ---------- search palette (UI only, searches sample data) ----------
  const pal = document.createElement('div');
  pal.className = 'palette'; pal.hidden = true;
  pal.innerHTML = `<div class="palette-box" role="dialog" aria-label="Search"><div class="palette-in">${icon('search')}<input id="pal-q" aria-label="Search markets and news" placeholder="Search stocks, crypto, indices, news…" autocomplete="off"><button type="button" class="palette-close" aria-label="Close search">Esc</button></div><div class="palette-list" id="pal-list"></div></div>`;
  document.body.append(pal);
  const q = pal.querySelector('#pal-q'), list = pal.querySelector('#pal-list');
  function renderPal() {
    const s = q.value.trim().toLowerCase();
    const hits = M.assets.filter(a => !s || a.s.toLowerCase().includes(s) || a.n.toLowerCase().includes(s)).slice(0, s ? 8 : 6);
    const wre = s && new RegExp('(^|[^a-z0-9])' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), nh = M.news.filter(n => wre && wre.test(n.t)).slice(0, 3);
    list.innerHTML = `<h6>${s ? 'Markets' : 'Trending'}</h6>` + (hits.length ? hits.map((a, i) => `<a class="pal-item" href="${href(a)}" ${i === 0 ? 'aria-selected="true"' : ''}><span>${logo(a)}</span><span class="ident"><span><b>${a.s}</b><small>${a.n} · ${a.x}</small></span></span><span class="num" data-lp="${a.s}">${fmtP(a)}</span><span class="num ${cls(a.d)}" data-lc="${a.s}">${fmtC(a.d, a.y)}</span></a>`).join('') : `<div class="pal-item muted">No markets match “${q.value}”.</div>`)
      + (nh.length ? `<h6>News</h6>` + nh.map(n => `<a class="pal-item" ${nhref(n)} style="grid-template-columns:auto 1fr"><span class="dd-ic" style="width:28px;height:28px">${icon('news')}</span><span>${n.t}</span></a>`).join('') : '');
  }
  // Open dialogs (search, email pop-up): the page behind doesn't scroll, Tab stays inside, focus returns on close
  let lastFocus = null;
  const modalOpen = el => { lastFocus = document.activeElement; document.documentElement.style.overflow = 'hidden'; el.dataset.modal = '1'; };
  const modalClose = el => { if (!el.dataset.modal) return; delete el.dataset.modal; if (!document.querySelector('[data-modal]')) document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); };
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return; const m = [...document.querySelectorAll('[data-modal]')].find(x => !x.hidden); if (!m) return;
    const f = [...m.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]):not([hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });
  function openPalette() { closeDrawer(); if (pal.hidden) modalOpen(pal); pal.hidden = false; q.value = ''; renderPal(); setTimeout(() => q.focus(), 10); }
  function closePalette() { if (pal.hidden) return; pal.hidden = true; modalClose(pal); }
  q.oninput = renderPal;
  q.onkeydown = e => {
    const its = [...list.querySelectorAll('a.pal-item')], cur = its.findIndex(a => a.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!its.length) return; const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; its.forEach((a, i) => a.setAttribute('aria-selected', i === n)); its[n].scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter') { const a = its[cur] || its[0]; if (a) location.href = a.href; }
  };
  pal.querySelector('.palette-close').onclick = closePalette; pal.querySelector('.palette-close').style.cursor = 'pointer';
  pal.onclick = e => { if (e.target === pal) closePalette(); };
  document.querySelectorAll('[data-search]').forEach(b => b.onclick = openPalette);
  document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); } });

  // ---------- ticker ----------
  const tickSyms = ['SPX', 'NDX', 'DJI', 'BTC', 'ETH', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'TSLA', 'XAU', 'WTI', 'EURUSD', 'US10Y', 'DAX', 'NKY'];
  const tk = document.createElement('div');
  tk.className = 'ticker'; tk.setAttribute('aria-label', 'Market ticker');
  const items = tickSyms.map(s => M.bySym[s]).map(a => `<a class="tk" href="${href(a)}"><b>${a.c === 'indices' ? a.n : a.s}</b><span class="num" data-lp="${a.s}">${fmtP(a)}</span><span class="num ${cls(a.d)}" data-lc="${a.s}">${fmtC(a.d, a.y)}</span></a>`).join('');
  tk.innerHTML = `<div class="ticker-track">${items}${items}</div>`;
  // drawer.after(tk);  // price ticker removed from the news-first site (kept in code in case it comes back)

  // ---------- live prices: one helper updates every price and change shown for an asset ----------
  function setPrice(s, p, d) {
    const a = M.bySym[s]; if (!a || !isFinite(p) || p <= 0) return;
    const up = p >= a.p;
    if (d == null) { if (a.base == null) a.base = a.p / (1 + a.d / 100); d = +((p / a.base - 1) * 100).toFixed(2); }
    if (p === a.p && d === a.d) return;
    a.p = p; a.d = d;
    document.querySelectorAll(`[data-lp="${s}"]`).forEach(el => { const t = fmtP(a); if (el.textContent === t) return; el.textContent = t; el.classList.remove('tick-up', 'tick-down'); void el.offsetWidth; el.classList.add(up ? 'tick-up' : 'tick-down'); });
    document.querySelectorAll(`[data-lc="${s}"]`).forEach(el => { el.textContent = fmtC(a.d, a.y); el.classList.remove('up', 'down', 'muted'); el.classList.add(cls(a.d)); });
  }
  const repaintMoney=()=>{document.querySelectorAll('[data-lp]').forEach(el=>{const a=M.bySym[el.dataset.lp];if(a)el.textContent=fmtP(a);});document.querySelectorAll('[data-usd-value]').forEach(el=>el.textContent=InvPrefs[el.dataset.usdKind==='price'?'fmt':'compact'](+el.dataset.usdValue,{cur:'USD'}));};
  window.InvPrefs?.onChange(repaintMoney);
  const whenVisible = (fn, ms) => { let t = 0; const run = () => { clearTimeout(t); if (!document.hidden) fn(); t = setTimeout(run, ms); }; document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); }); setTimeout(run, 4000); };

  // Live currencies: Coinbase's free exchange-rate feed, every 30 seconds while the page is open
  whenVisible(() => window.InvConsent?.allows('images') && fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', { cache: 'no-store' }).then(r => r.json()).then(j => {
    const R = j.data.rates; R.USD = '1'; window.InvPrefs?.setRates(R);
    M.assets.filter(a => a.c === 'currencies' && a.s.length === 6).forEach(a => { const b = +R[a.s.slice(0, 3)], q = +R[a.s.slice(3)]; if (b && q) { a.live = true; setPrice(a.s, +(q / b).toFixed(a.p > 20 ? 3 : 5)); } });
    document.dispatchEvent(new CustomEvent('inv:tick'));
  }).catch(() => {}), 30000);

  // Everything else: pick up the robot's newest prices every 2 minutes without reloading the page
  whenVisible(() => fetch('assets/quotes.js?t=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).then(t => {
    const j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); if (!j.q || (M.updated && new Date(j.updated) <= M.updated)) return;
    if (window.InvData && InvData.mode === 'worker' && Date.now() - (InvData.workerAt || 0) < 300000) return;  // the Worker answered in the last 5 minutes: its prices stay, the static file is only the fallback
    for (const s in j.q) { const a = M.bySym[s]; if (!a || a.live) continue; a.base = null; setPrice(s, j.q[s].p, j.q[s].d); Object.assign(a, { w: j.q[s].w, m1: j.q[s].m1 }); }
    M.updated = new Date(j.updated);
    document.querySelectorAll('[data-asof]').forEach(el => el.textContent = 'Delayed · updated ' + M.updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    document.dispatchEvent(new CustomEvent('inv:tick'));
  }).catch(() => {}), 120000);

  // Prices from the Cloudflare Worker (INV_DATA_MODE = 'worker'): stocks, indices, currencies and commodities, every 30 s while the page is open.
  // Only price and change are taken; the static file keeps providing everything else and is the fallback whenever the Worker is slow, down or empty.
  whenVisible(() => { const D = window.InvData; if (!D || D.mode !== 'worker') return;
    D.get('prices').then(r => {
      D.workerAt = Date.now(); const q = window.QUOTES && window.QUOTES.q;
      for (const s in r.data) { const a = M.bySym[s]; if (!a || a.live) continue; const row = r.data[s]; a.base = null; setPrice(s, row[0], row[1]); if (q && q[s]) { q[s].p = row[0]; q[s].d = row[1]; } }
      document.dispatchEvent(new CustomEvent('inv:tick'));
    }).catch(() => {});
  }, 30000);

  // ---------- live crypto: Coinbase's free public feed, applied at most once a second ----------
  (function liveCrypto() {
    const syms = M.assets.filter(a => a.c === 'crypto' && a.real && !['BNB', 'USDC'].includes(a.s)).map(a => a.s);
    if (!('WebSocket' in window) || !syms.length) return;
    let ws = null, pending = {}, timer = 0, retry = 2000;
    const flush = () => {
      timer = 0;
      for (const s in pending) {
        const a = M.bySym[s]; a.live = true; setPrice(s, pending[s].p);
      }
      pending = {};
      document.dispatchEvent(new CustomEvent('inv:tick'));
    };
    const connect = () => {
      if (ws || document.hidden) return;
      ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      ws.onopen = () => { retry = 2000; ws.send(JSON.stringify({ type: 'subscribe', product_ids: syms.map(s => s + '-USD'), channels: ['ticker'] })); };
      ws.onmessage = e => { const m = JSON.parse(e.data); if (m.type !== 'ticker') return; pending[m.product_id.split('-')[0]] = { p: +m.price }; if (!timer) timer = setTimeout(() => requestAnimationFrame(flush), 1000); };
      ws.onclose = () => { ws = null; if (!document.hidden) setTimeout(connect, retry = Math.min(retry * 2, 60000)); };
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) { if (ws) { ws.onclose = null; ws.close(); ws = null; } } else connect(); });
    connect();
  })();

  // ---------- data freshness badges ----------
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-asof]').forEach(el => {
    const u = M.updated;
    el.textContent = u ? 'Delayed · updated ' + u.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sample data';
    el.title = u ? 'Prices refresh about every 30 minutes (crypto live). Data: Yahoo Finance, FRED, Coinbase. Last update ' + u.toLocaleString() : '';
  }));

  // ---------- footer ----------
  const ftr = document.createElement('footer');
  ftr.className = 'ftr';
  ftr.innerHTML = `<div class="wrap">
    <div class="ftr-head"><div class="ftr-brand">${brand}</div><p class="ftr-tag">Invest with clarity.</p><button type="button" class="ftr-top-btn" aria-label="Back to top">Back to top <span aria-hidden="true">↑</span></button></div>
    <div class="ftr-meta"><span class="ftr-socials"><a class="icon-btn" href="https://www.linkedin.com/company/investedia/" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1zM7.1 20.5H3.6V9h3.5v11.5z"/></svg></a><a class="icon-btn" href="https://x.com/investedia" aria-label="X" title="X"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M18.2 2H21l-6.5 7.4L22 22h-6.1l-4.8-6.3L5.6 22H2.8l7-8L2 2h6.2l4.3 5.7L18.2 2zm-1.1 18h1.7L7 3.9H5.2L17.1 20z"/></svg></a><a class="icon-btn" href="https://www.youtube.com/@investedia" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z"/></svg></a><a class="icon-btn" href="https://www.instagram.com/investedia/" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a><a class="icon-btn" href="mailto:contact@investedia.com" aria-label="Email contact@investedia.com" title="contact@investedia.com"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a></span><label class="ftr-lang"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg><select aria-label="Language"><option value="en">English</option><option value="fr">Français</option><option value="nl">Nederlands</option><option value="de">Deutsch</option><option value="es">Español</option><option value="it">Italiano</option><option value="pt">Português</option></select></label><p class="ftr-data">Market data: Yahoo Finance, FRED &amp; Coinbase. Company filings: SEC EDGAR. News summaries are written with AI from each source’s reporting. <a href="sources.html">All sources</a></p></div>
    <nav class="ftr-cols" aria-label="Footer"><details class="ftr-col" open><summary><h6>News</h6><span class="ftr-chev" aria-hidden="true"></span></summary><ul><li><a href="news.html">Latest news</a></li><li><a href="assets/globe/news.html">Globe</a></li><li><a href="implications.html">Market Implications</a></li><li><a href="track-record.html">Track Record</a></li></ul></details><details class="ftr-col" open><summary><h6>Markets</h6><span class="ftr-chev" aria-hidden="true"></span></summary><ul><li><a href="markets.html">Markets</a></li><li><a href="companies/">Companies</a></li><li><a href="calendar.html">Economic Calendar</a></li><li><a href="screener.html">Stock Screener</a></li><li><a href="movers.html">Market Heatmaps</a></li></ul></details><details class="ftr-col" open><summary><h6>Learn</h6><span class="ftr-chev" aria-hidden="true"></span></summary><ul><li><a href="education.html">Education</a></li></ul></details><details class="ftr-col" open><summary><h6>Company</h6><span class="ftr-chev" aria-hidden="true"></span></summary><ul><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li><li><a href="about.html#app">Get the app</a></li></ul></details><details class="ftr-col" open><summary><h6>Legal</h6><span class="ftr-chev" aria-hidden="true"></span></summary><ul><li><a href="terms.html">Terms</a></li><li><a href="privacy.html">Privacy</a></li><li><a href="cookies.html">Cookies</a></li><li><a href="disclaimer.html">Disclaimer</a></li><li><a href="legal.html">All legal</a></li></ul></details></nav>
    `;
  // phones: footer sections fold into tap-to-open rows; wider screens: always open
  const ftrQ = matchMedia('(max-width: 760px)'), ftrFold = () => ftr.querySelectorAll('.ftr-col').forEach(d => { d.open = !ftrQ.matches; });
  ftrFold(); ftrQ.addEventListener?.('change', ftrFold);
  // Native first-party translation (assets/locale.js + assets/locales/<lang>.json); no third-party script, no proxy.
  const ftrLang=ftr.querySelector('.ftr-lang');
  ftrLang.innerHTML='<button type="button" class="btn btn-ghost">Language</button>';
  ftrLang.querySelector('button').onclick=e=>{e.stopPropagation();window.scrollTo({top:0,behavior:'instant'});window.InvPrefs?.openSettings();};
  ftr.querySelector('.ftr-top-btn')?.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  document.addEventListener('DOMContentLoaded', () => {
    document.body.append(ftr);
  });
  // scroll reveal: sections fade and rise in once as they enter the view; grid items follow in a short stagger.
  // Only opacity/transform (GPU), each element animates once, nothing hidden without JS, and none with reduced motion.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.addEventListener('DOMContentLoaded', () => {
    const SEL = 'main section:not(.hn-hero), .hn-sec, .hn-band, .ftr .wrap, .grid3 > *, .cx-grid > *, .hn-ctys > *, .whys > *, .tr2-two > *, .tr2-kpis > *, .res-strip';
    const els = [...document.querySelectorAll(SEL)].filter(e => !e.closest('.hn-hero'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    els.forEach(e => { const r = e.getBoundingClientRect(); if (r.top < innerHeight * .92) return; e.classList.add('rv'); const i = [...(e.parentElement?.children || [])].indexOf(e); if (i > 0 && i < 8 && e.parentElement.matches('.grid3,.cx-grid,.hn-ctys,.whys,.tr2-two,.tr2-kpis')) e.style.transitionDelay = (i * 60) + 'ms'; io.observe(e); });
  });

  // ---------- charts ----------
  // Sparkline as an inline SVG string
  function spark(vals, color, w = 96, h = 28, fill = true) {
    const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 2 - (v - mn) / r * (h - 4)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${fill ? `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${w} ${h}L0 ${h}Z" fill="url(#${id})"/>` : ''}<path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  }
  const colorFor = v => v >= 0 ? '#22C55E' : '#F04444';

  // Full area chart with axes, crosshair and tooltip
  function areaChart(el, vals, opts = {}) {
    const { color = ACC(), labels, fmt = v => v.toFixed(2), height = 320, compare } = opts;
    el.classList.add('chart'); el.style.height = height + 'px';
    const draw = () => {
      const W = el.clientWidth, H = height, padL = 8, padR = 64, padT = 12, padB = 28;
      const all = compare ? vals.concat(compare) : vals;
      let mn = Math.min(...all), mx = Math.max(...all); const pad = (mx - mn) * .08 || 1; const lo0 = mn >= 0; mn -= pad; mx += pad; if (lo0 && mn < 0) mn = 0;
      const sx = i => padL + i / (vals.length - 1) * (W - padL - padR), sy = v => padT + (1 - (v - mn) / (mx - mn)) * (H - padT - padB);
      const ticks = 5, grid = [];
      for (let k = 0; k <= ticks; k++) { const v = mn + (mx - mn) * k / ticks; grid.push(`<line class="grid-l" x1="${padL}" x2="${W - padR}" y1="${sy(v)}" y2="${sy(v)}"/><text class="ax" x="${W - padR + 10}" y="${sy(v) + 4}">${fmt(v)}</text>`); }
      const xl = labels ? labels.map((l, k) => { const i = Math.round(k / (labels.length - 1) * (vals.length - 1)); return `<text class="ax" x="${sx(i)}" y="${H - 8}" text-anchor="${k === 0 ? 'start' : k === labels.length - 1 ? 'end' : 'middle'}">${l}</text>`; }).join('') : '';
      const path = vals.map((v, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(v).toFixed(1)).join('');
      const cpath = compare ? compare.map((v, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(v).toFixed(1)).join('') : '';
      const id = 'a' + Math.random().toString(36).slice(2, 8), last = vals[vals.length - 1];
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price chart"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
        ${grid.join('')}${xl}
        <path d="${path}L${sx(vals.length - 1)} ${H - padB}L${padL} ${H - padB}Z" fill="url(#${id})"/>
        ${compare ? `<path d="${cpath}" fill="none" stroke="#A1A1AA" stroke-width="1.5" stroke-dasharray="4 4"/>` : ''}
        <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line class="grid-l" x1="${padL}" x2="${W - padR}" y1="${sy(last)}" y2="${sy(last)}" stroke-dasharray="2 4" style="stroke:${color};opacity:.5"/>
        <rect x="${W - padR + 4}" y="${sy(last) - 10}" width="${padR - 6}" height="20" rx="4" fill="${color}"/><text x="${W - padR + 10}" y="${sy(last) + 4}" font-family="Geist Mono, monospace" font-size="11" font-weight="600" fill="#0A0A0B">${fmt(last)}</text>
        <g class="hover" style="display:none"><line class="xh" y1="${padT}" y2="${H - padB}"/><circle r="4.5" fill="${color}" stroke="#0A0A0B" stroke-width="2"/></g></svg><div class="tip" style="display:none"></div>`;
      const svg = el.querySelector('svg'), g = el.querySelector('.hover'), tip = el.querySelector('.tip');
      svg.addEventListener('pointermove', rafMove(e => {
        const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width;
        const i = Math.max(0, Math.min(vals.length - 1, Math.round((x - padL) / (W - padL - padR) * (vals.length - 1))));
        g.style.display = ''; g.querySelector('line').setAttribute('x1', sx(i)); g.querySelector('line').setAttribute('x2', sx(i));
        g.querySelector('circle').setAttribute('cx', sx(i)); g.querySelector('circle').setAttribute('cy', sy(vals[i]));
        tip.style.display = ''; tip.style.left = sx(i) / W * 100 + '%'; tip.style.top = sy(vals[i]) + 'px';
        tip.innerHTML = `<b>${fmt(vals[i])}</b>${opts.tipLabel ? `<div class="dim">${opts.tipLabel(i)}</div>` : ''}`;
      }), { passive: true });
      svg.addEventListener('pointerleave', () => { g.style.display = 'none'; tip.style.display = 'none'; });
    };
    draw();
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(draw, 60); }).observe(el);
  }

  // Abstract cover art for news cards (no stock photos): a chart-like composition
  function cover(key, accent = ACC()) {
    const r = M.seeded(String(key)), vals = M.series(String(key), 40, 100, (r() - .4) * 40, .04);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const d = vals.map((v, i) => `${i ? 'L' : 'M'}${(i / 39 * 400).toFixed(1)} ${(170 - (v - mn) / (mx - mn) * 120).toFixed(1)}`).join('');
    const bars = Array.from({ length: 40 }, (_, i) => `<rect x="${i * 10 + 2}" y="${200 - r() * 26}" width="6" height="30" fill="#ffffff" opacity=".05"/>`).join('');
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    return `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs><rect width="400" height="200" fill="#121214"/>${[40, 80, 120, 160].map(y => `<line x1="0" x2="400" y1="${y}" y2="${y}" stroke="#ffffff" stroke-opacity=".04"/>`).join('')}${bars}<path d="${d}L400 200L0 200Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${accent}" stroke-width="2.5"/></svg>`;
  }

  // Asset table
  function assetTable(rows, cols = ['price', 'chg', 'week', 'spark']) {
    const H = { price: 'Price', chg: '24h / 1D', week: '1W', cap: 'Market cap', vol: 'Volume', pe: 'P/E', spark: '7 days', aum: 'Assets', fee: 'Fee', sector: 'Sector' };
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th>${cols.map(c => `<th>${H[c]}</th>`).join('')}<th style="width:40px"></th></tr></thead><tbody>${rows.map(a => `<tr data-href="${href(a)}"><td><a class="ident" href="${href(a)}">${logo(a)}<span><b>${a.s}</b><small>${a.n}</small></span></a></td>${cols.map(c => {
      if (c === 'price') return `<td class="num"><span data-lp="${a.s}">${fmtP(a)}</span>${a.unit ? `<span class="dim">${a.unit}</span>` : ''}</td>`;
      if (c === 'chg') return `<td><span class="pill ${cls(a.d)}">${fmtC(a.d, a.y)}</span></td>`;
      if (c === 'week') return `<td class="num ${cls(a.w)}">${fmtC(a.w, a.y)}</td>`;
      if (c === 'cap') return `<td class="num">${cap(a.m)}</td>`;
      if (c === 'vol') return `<td class="num muted">${a.vol || '—'}</td>`;
      if (c === 'pe') return `<td class="num muted">${a.pe ? a.pe.toFixed(1) : '—'}</td>`;
      if (c === 'aum') return `<td class="num muted">${a.aum || '—'}</td>`;
      if (c === 'fee') return `<td class="num muted">${a.fee || '—'}</td>`;
      if (c === 'sector') return `<td class="muted">${a.sector || '—'}</td>`;
      if (c === 'spark') return `<td>${spark(a.spark.slice(-28), colorFor(a.w))}</td>`;
      return '<td></td>';
    }).join('')}<td><button class="star" type="button" data-s="${a.s}" aria-label="Add ${a.s} to watchlist">${icon('star')}</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  document.addEventListener('click', e => {
    const st = e.target.closest('.star');
    if (st) { e.stopPropagation(); e.preventDefault(); if (st.dataset.s && window.INVWATCH) INVWATCH.toggle({ kind: 'asset', src: 'site', s: st.dataset.s }); return; }
    const tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a,button')) location.href = tr.dataset.href;
  });

  // Tabs helper: buttons with data-tab inside a .tabs; calls fn(key)
  function tabs(el, fn) {
    el.setAttribute('role', 'tablist');
    el.setAttribute('role','tablist'); el.setAttribute('aria-label',el.id || 'View');
    el.querySelectorAll('.tab').forEach(b => { b.setAttribute('role', 'tab'); b.onclick = () => { el.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', x === b)); fn(b.dataset.tab); }; });
  }

  // Compact asset row used in lists (movers, related, mentioned)
  const row = a => `<a class="arow" href="${href(a)}"><span class="ident">${logo(a)}<span><b>${a.c === 'indices' ? a.n : a.s}</b><small>${a.c === 'indices' ? a.x : a.n}</small></span></span><span class="num" data-lp="${a.s}">${fmtP(a)}</span><span class="pill ${cls(a.d)}">${fmtC(a.d, a.y)}</span></a>`;
  // Impact bars for calendar events
  const impact = n => `<span class="impact" title="${['', 'Low', 'Medium', 'High'][n]} impact">${[1, 2, 3].map(k => `<i style="height:${6 + k * 3}px;background:${k <= n ? (n === 3 ? 'var(--accent)' : 'var(--fg-2)') : 'var(--line)'}"></i>`).join('')}</span>`;
  const sTag = s => `<span class="tag ${s === 'Bullish' ? 'bull' : s === 'Bearish' ? 'bear' : ''}">${s}</span>`;
  const analysisCard = (x, i = 0) => `<a class="card n-card" href="analysis-article.html"><div class="cover">${cover('an' + x.t.length + i, i % 3 === 1 ? '#A1A1AA' : ACC())}</div><div class="body"><div class="news-meta"><span class="tag">${x.kind}</span>${sTag(x.sentiment)}${x.tag ? `<span class="mono">${x.tag}</span>` : ''}</div><h3>${x.t}</h3><p>${x.d}</p><div class="news-meta"><span>${x.a}</span><i></i><span>${x.read} min read</span></div></div></a>`;
  // Newsletter band (UI only)
  const late = () => document.querySelectorAll('[data-newsletter]').forEach(el => {
    el.innerHTML = `<div class="panel cta-band ai-glow"><div><span class="eyebrow">The Investedia Brief</span><h2 style="margin-top:10px;font-size:26px">Markets in five minutes, every morning.</h2><p class="lede" style="font-size:15px">The moves that matter, the news behind them and one chart worth your time. Free.</p></div>
      <form class="subscribe" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed ✓'"><input class="input" type="email" placeholder="you@email.com" aria-label="Email address" required><button class="btn btn-primary" type="submit">Subscribe</button>
      <div class="chips" style="display:flex;gap:6px;flex-wrap:wrap;width:100%;margin-top:6px">${['Daily brief', 'Crypto weekly', 'Earnings alerts', 'Real estate monthly'].map((t, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" onclick="this.classList.toggle('on')">${t}</button>`).join('')}</div></form></div>`;
  });
  document.addEventListener('DOMContentLoaded', () => { late(); document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = icon(e.dataset.icon); if (!e.classList.contains('dd-ic')) e.classList.add('ic-inline'); }); document.querySelectorAll('[data-search]').forEach(b => b.onclick = openPalette); });

  // Category navigation strip shown on every market page
  function subnav(k) {
    const el = document.getElementById('subnav'); if (!el) return;
    el.innerHTML = `<a href="markets.html" ${!k ? 'aria-current="page"' : ''}>Overview</a>` + M.categories.map(c => `<a href="${c.page}" ${c.k === k ? 'aria-current="page"' : ''}>${icon(c.k)}${c.t}</a>`).join('');
  }
  // News section tabs: News · Analysis · AI brief
  function newsNav(k) {
    const el = document.getElementById('news-nav'); if (!el) return;
    el.innerHTML = [['news', 'Latest news', 'news.html'], ['analysis', 'Analysis', 'analysis.html'], ['impl', 'Market implications', 'implications.html'], ['track', 'Track record', 'track-record.html']].map(([key, t, h]) => `<a href="${h}" ${key === k ? 'aria-current="page"' : ''}>${key === 'ai' ? icon('sparkle') : ''}${t}</a>`).join('');
    const cur = el.querySelector('[aria-current]'); if (cur && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, cur.offsetLeft - (el.clientWidth - cur.offsetWidth) / 2);
  }
  // Treemap-style heatmap from [asset, colSpan, rowSpan]
  const heatColor = d => { const t = Math.min(1, Math.abs(d) / 4); return d >= 0 ? `rgba(34,197,94,${.12 + t * .30})` : `rgba(240,68,68,${.12 + t * .30})`; };
  function heatmap(el, items) { el.innerHTML = items.map(([a, w, h]) => `<a href="${a.n && M.bySym[a.s] ? href(a) : 'screener.html'}" style="grid-column:span ${w};grid-row:span ${h};background:${heatColor(a.d)}" title="${a.n || a.s}: ${fmtC(a.d)}"><b style="font-size:${Math.min(22, 10 + w * 2)}px">${a.label || a.s}</b><span>${fmtC(a.d)}</span></a>`).join(''); }
  // ---------- modern heatmap: smooth colours, period switch, hover/tap detail card ----------
  const heatVar = (d, scale = 4) => { const t = Math.max(-1, Math.min(1, d / scale)); return t >= 0 ? `color-mix(in srgb, var(--up) ${12 + t * 28}%, var(--card))` : `color-mix(in srgb, var(--down) ${12 - t * 28}%, var(--card))`; };
  let tipEl = null;
  function heatTip(html, r) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'hm-tip'; tipEl.setAttribute('role', 'status'); document.body.append(tipEl); }
    if (!html) { tipEl.classList.remove('show'); return; }
    tipEl.innerHTML = html; tipEl.classList.add('show');
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight, x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), above = r.top - h - 10 > 8;
    tipEl.style.left = x + 'px'; tipEl.style.top = (above ? r.top - h - 10 : r.bottom + 10) + 'px';
  }
  addEventListener('scroll', () => heatTip(null), { passive: true });
  function heatmap2(el, items, per = 'd') {
    const lab = { d: 'today', w: 'this week', m1: 'this month' }[per];
    el.classList.add('heat', 'heat2');
    el.innerHTML = items.map(([a, w, h], i) => { const v = a[per] || 0; return `<a href="${href(a)}" data-i="${i}" style="grid-column:span ${w};grid-row:span ${h};--hc:${heatVar(v)}" aria-label="${a.n}: ${fmtC(v)} ${lab}"><b style="font-size:${Math.min(22, 10 + w * 2)}px">${a.label || a.s}</b><span>${fmtC(v)}</span></a>`; }).join('');
    const card = a => `<div class="hm-tip-h">${logo(a)}<span><b>${a.n}</b><small>${a.s} · ${a.sector || a.x}</small></span></div><div class="hm-tip-p"><span class="num">${fmtP(a)}</span></div><div class="hm-tip-g">${[['1D', a.d], ['1W', a.w], ['1M', a.m1]].map(([k, v]) => `<span><small>${k}</small><b class="num ${cls(v)}">${fmtC(v || 0)}</b></span>`).join('')}</div>`;
    let armed = null;
    el.querySelectorAll('a').forEach(t => {
      const a = items[+t.dataset.i][0];
      t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') heatTip(card(a), t.getBoundingClientRect()); });
      t.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') heatTip(null); });
      t.addEventListener('focus', () => heatTip(card(a), t.getBoundingClientRect()));
      t.addEventListener('blur', () => heatTip(null));
      // On touch screens the first tap shows the details, the second opens the page
      t.addEventListener('click', e => { if (matchMedia('(hover: none)').matches && armed !== t) { e.preventDefault(); armed = t; el.querySelectorAll('a').forEach(x => x.classList.toggle('on', x === t)); heatTip(card(a), t.getBoundingClientRect()); } });
    });
  }
  function heatLegend2(el, scale = 4, unit = '%') { el.className = 'heat-legend2'; el.innerHTML = `<span class="num">−${scale}${unit}</span><i></i><span class="num">0</span><i class="pos"></i><span class="num">+${scale}${unit}</span>`; }
  function heatLegend(el) { el.className = 'heat-legend'; el.innerHTML = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => `<span style="background:${v === 0 ? '#29292D' : heatColor(v)}">${v > 0 ? '+' : ''}${v}%</span>`).join(''); }
  // Diverging bar row (sectors, strength)
  const divBar = (n, v, mx = 2, suffix) => `<div class="divbar"><span class="muted">${n}</span><div class="divbar-track"><i class="mid"></i><i class="bar" style="${v >= 0 ? `left:50%;width:${v / mx * 50}%;background:var(--up)` : `right:50%;width:${-v / mx * 50}%;background:var(--down)`}"></i></div><span class="num ${cls(v)}">${suffix ? (v > 0 ? '+' : '') + v.toFixed(1) + suffix : fmtC(v)}</span></div>`;
  // Email sign-up pop-up
  const pop = document.createElement('div');
  pop.className = 'palette'; pop.hidden = true;
  pop.innerHTML = `<div class="palette-box pop" role="dialog" aria-modal="true" aria-labelledby="pop-t">
    <button class="icon-btn pop-x" type="button" aria-label="Close">${icon('x')}</button>
    <div class="pop-art">${mark}</div>
    <span class="eyebrow">The Investedia Brief</span>
    <h2 id="pop-t" style="margin:10px 0 6px;font-size:24px">Markets in five minutes, every morning.</h2>
    <p class="muted" style="margin:0 0 18px">Join the list for the daily brief: the news that moved markets, in context. Free, unsubscribe anytime.</p>
    <form class="subscribe" id="pop-f"><input class="input" type="email" id="pop-email" placeholder="you@email.com" aria-label="Email address" required><button class="btn btn-primary" type="submit">Join free</button></form>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">${['Daily brief', 'Weekly charts', 'Crypto', 'Product updates'].map((t, i) => `<button type="button" class="chip ${i < 2 ? 'on' : ''}" onclick="this.classList.toggle('on')">${t}</button>`).join('')}</div>
    <p class="pop-ok up" hidden style="margin:14px 0 0;font-weight:550">You’re on the list. Check your inbox to confirm.</p>
  </div>`;
  const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch { return null; } };
  const openPop = () => { if (pop.hidden) modalOpen(pop); pop.hidden = false; store('inv-pop', '1'); setTimeout(() => pop.querySelector('input').focus(), 30); };
  const closePop = () => { if (pop.hidden) return; pop.hidden = true; modalClose(pop); };
  pop.querySelector('.pop-x').onclick = closePop;
  pop.onclick = e => { if (e.target === pop) closePop(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
  pop.querySelector('#pop-f').onsubmit = e => { e.preventDefault(); store('inv-sub', '1'); pop.querySelector('#pop-f').hidden = true; pop.querySelector('.pop-ok').hidden = false; setTimeout(closePop, 2200); };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.append(pop);
    document.querySelectorAll('[data-subscribe]').forEach(b => b.onclick = openPop);
    if (!isLegalPage && !store('inv-pop') && !store('inv-sub') && store('inv-auth-seen')) {
      const t = setTimeout(openPop, 12000);
      const onScroll = () => { if (scrollY > (document.body.scrollHeight - innerHeight) * .6) { clearTimeout(t); removeEventListener('scroll', onScroll); if (!store('inv-pop')) openPop(); } };
      addEventListener('scroll', onScroll, { passive: true });
    }
  });
  // ---------- accounts (Supabase: email + Google). Fill both values to switch accounts on. ----------
  const SB_URL = (window.INV_CONFIG && window.INV_CONFIG.supabase && window.INV_CONFIG.supabase.url) || '', SB_KEY = (window.INV_CONFIG && window.INV_CONFIG.supabase && window.INV_CONFIG.supabase.publishableKey) || '';
  const authOn = !!(SB_URL && SB_KEY);
  let sb = null;
  const sbLoad = () => !authOn ? Promise.reject(new Error('Accounts are not connected in this local version.')) : sb ? Promise.resolve(sb) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'; s.onload = () => ok(sb = window.supabase.createClient(SB_URL, SB_KEY)); s.onerror = no; document.head.append(s); });
  window.invSB = sbLoad;
  // ---------- optional first-party usage events, gated by analytics consent ----------
  // Owner accounts are recognised by a SHA-256 hash of their email, so no address appears in this public file. This only changes which buttons show; access to data is enforced by Supabase.
  const OWNER_HASHES = ["264b0fd1279e8a878bb289abf5411178fe468ea4bb1a0f87331618413d05144e", "f1b59c964027b7263946e880de371f9f61738244628d1acc3a98744be74decde"];
  const isOwnerEmail = async (e) => { try { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(e || '').toLowerCase())); return OWNER_HASHES.includes([...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('')); } catch { return false; } };
  const track = (type, detail) => { try {
    if (!authOn || !window.INV_CONFIG?.analyticsEnabled || !window.InvConsent?.allows('analytics')) return;
    if (navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || !/investedia\.com$/.test(location.hostname) || store('inv-owner') === '1') return;
    const rh = document.referrer ? new URL(document.referrer).hostname : '', own = rh === location.hostname;
    const body = { type, path: (location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/').slice(0, 200), ref: rh && !own ? rh.replace(/^www\./, '').slice(0, 200) : null, entry: !own,
      device: innerWidth < 700 ? 'phone' : innerWidth < 1100 ? 'tablet' : 'desktop', tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 64) || null, lang: (navigator.language || '').slice(0, 10) || null,
      member: document.documentElement.classList.contains('is-member') || !!store('inv-had-account'), detail: detail ? String(detail).slice(0, 120) : null };
    fetch(SB_URL + '/rest/v1/events', { method: 'POST', keepalive: true, headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) }).catch(() => {});
  } catch {} };
  window.invTrack = track;
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => track('pageview'), 400));
  const gIcon = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const au = document.createElement('div');
  au.className = 'palette auth'; au.hidden = true;
  au.innerHTML = `<div class="palette-box auth-box" role="dialog" aria-modal="true" aria-labelledby="au-t">
    <button class="icon-btn pop-x" type="button" aria-label="Close">${icon('x')}</button>
    <div class="auth-head"><span class="wm" translate="no" aria-label="Investedia">Invested<span class="i">i</span>a</span><h2 id="au-t">Create your account</h2><p class="muted" id="au-sub">Follow countries and companies, news alerts and the daily brief. Free.</p></div>
    <button class="btn auth-google" type="button">${gIcon}<span>Continue with Google</span></button>
    <div class="auth-or"><span>or with email</span></div>
    <form class="auth-f" novalidate>
      <label class="auth-l" data-only="up"><span>Name</span><input class="input" name="name" autocomplete="name" placeholder="Your name"></label>
      <label class="auth-l"><span>Email</span><input class="input" name="email" type="email" autocomplete="email" placeholder="you@email.com" required></label>
      <label class="auth-l"><span>Password <a href="#" class="auth-forgot" data-only="in">Forgot?</a></span><span class="auth-pw"><input class="input" name="pw" type="password" autocomplete="new-password" placeholder="At least 8 characters" minlength="8" required><button type="button" class="auth-eye" aria-label="Show password">Show</button></span></label>
      <label class="auth-check" data-only="up"><input type="checkbox" name="news"><span>Send me the daily brief and market news. Unsubscribe anytime.</span></label>
      <p class="auth-msg" role="status" hidden></p>
      <button class="btn btn-primary auth-go" type="submit">Create free account</button>
    </form>
    <p class="auth-legal dim" data-only="up">By continuing you agree to our <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</p>
    <p class="auth-switch"><span data-only="up">Have an account? <button type="button" data-m="in">Log in</button></span><span data-only="in">New here? <button type="button" data-m="up">Create an account</button></span></p>
    <button class="auth-guest" type="button">Continue as guest</button>
  </div>`;
  let auMode = 'up';
  const auSet = m => { auMode = m; au.querySelectorAll('[data-only]').forEach(e => e.hidden = e.dataset.only !== m);
    au.querySelector('#au-t').textContent = m === 'up' ? 'Create your account' : 'Welcome back'; au.querySelector('#au-sub').textContent = m === 'up' ? 'Follow countries and companies, news alerts and the daily brief. Free.' : 'Log in to see your watchlist and alerts.'; au.querySelector('.auth-go').textContent = m === 'up' ? 'Create free account' : 'Log in';
    au.querySelector('[name=pw]').autocomplete = m === 'up' ? 'new-password' : 'current-password'; auMsg(''); };
  const auMsg = (t, ok) => { const e = au.querySelector('.auth-msg'); e.hidden = !t; e.textContent = t; e.classList.toggle('up', !!ok); e.classList.toggle('down', !ok); };
  const openAuth = (m = 'up') => { closePop(); auSet(m); if (au.hidden) modalOpen(au); au.hidden = false; store('inv-auth-seen', '1'); store('inv-pop', '1'); };
  const closeAuth = () => { if (au.hidden) return; au.hidden = true; modalClose(au); };
  au.querySelector('.pop-x').onclick = au.querySelector('.auth-guest').onclick = () => { store('inv-guest', '1'); closeAuth(); };
  au.onclick = e => { if (e.target === au) closeAuth(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAuth(); });
  au.querySelectorAll('.auth-switch button').forEach(b => b.onclick = () => auSet(b.dataset.m));
  au.querySelector('.auth-eye').onclick = e => { const i = au.querySelector('[name=pw]'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; e.target.textContent = show ? 'Hide' : 'Show'; };
  const notYet = () => auMsg('Accounts are not connected in this local version. Continue as a guest.');
  let sbCfg; const sbSettings = () => sbCfg || (sbCfg = fetch(SB_URL + '/auth/v1/settings', { headers: { apikey: SB_KEY } }).then(r => r.json()).catch(() => ({})));
  au.querySelector('.auth-google').onclick = async () => { if (!authOn) return notYet();
    const st = await sbSettings(); if (!(st.external && st.external.google)) return auMsg('Google sign-in opens very soon. Use your email for now.'); store('inv-news-optin', au.querySelector('[name=news]').checked ? '1' : '0');
    sbLoad().then(c => c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } })).catch(() => auMsg('Could not reach Google. Try again.')); };
  au.querySelector('.auth-forgot').onclick = e => { e.preventDefault(); const em = au.querySelector('[name=email]').value.trim(); if (!em) return auMsg('Enter your email first.'); if (!authOn) return notYet();
    sbLoad().then(c => c.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/profile.html' })).then(() => auMsg('Check your inbox for a reset link.', true)); };
  au.querySelector('.auth-f').onsubmit = async e => { e.preventDefault(); const f = e.target, em = f.email.value.trim(), pw = f.pw.value;
    if (!/^\S+@\S+\.\S+$/.test(em)) return auMsg('Enter a valid email.'); if (pw.length < 8) return auMsg('Password needs at least 8 characters.');
    if (!authOn) return notYet();
    const go = au.querySelector('.auth-go'); go.disabled = true;
    try { const c = await sbLoad();
      if (auMode === 'up') { const { data, error } = await c.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: location.href.split('#')[0], data: { name: f.name.value.trim(), newsletter: f.news.checked } } }); if (error) throw error;
        track('signup'); if (data.session) { closeAuth(); paintUser(data.user); } else auMsg('Almost done. Check your inbox to confirm your email.', true); }
      else { const { data, error } = await c.auth.signInWithPassword({ email: em, password: pw }); if (error) throw error; track('login'); closeAuth(); paintUser(data.user); }
    } catch (err) { auMsg(/invalid/i.test(err.message) ? 'Wrong email or password.' : err.message); } finally { go.disabled = false; } };
  // header: "Log in" for guests, initials for members
  // members-only pages: the profile is hidden until someone is logged in
  const gated = ['profile', 'watchlist'].includes(page);
  if (gated) document.documentElement.classList.add('auth-gate');
  const paintUser = u => { if (gated && u) document.documentElement.classList.remove('auth-gate');
    const av = hdr.querySelector('#hdr-avatar'), lb = hdr.querySelector('#hdr-login'); if (!lb) return;
    lb.hidden = !!u; av.hidden = !u; document.documentElement.classList.toggle('is-member', !!u); document.documentElement.classList.remove('is-owner'); if (u) isOwnerEmail(u.email).then(owner => { document.documentElement.classList.toggle('is-owner', owner); if (owner) store('inv-owner', '1'); }); INVWATCH.login(u); window.invUser = u || null; window.dispatchEvent(new CustomEvent('inv-user', { detail: u || null })); if (!u) return; store('inv-had-account', '1'); const nm = (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || u.email;
    av.textContent = nm.split(/[\s@.]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase(); paintAvatar();
    if (u.app_metadata && u.app_metadata.provider === 'google' && store('inv-news-optin') === '1' && !u.user_metadata.newsletter) { sb.auth.updateUser({ data: { newsletter: true } }); store('inv-news-optin', '0'); } };
  {
    const av = hdr.querySelector('#hdr-avatar'), lb = document.createElement('button');
    lb.type = 'button'; lb.id = 'hdr-login'; lb.className = 'btn btn-ghost btn-sm hdr-login'; lb.textContent = 'Log in'; lb.onclick = () => openAuth('in');
    const sb2 = document.createElement('button'); sb2.type = 'button'; sb2.className = 'btn btn-primary btn-sm hdr-signup guest-only hide-sm'; sb2.textContent = 'Sign up'; sb2.onclick = () => openAuth('up');
    av.closest('.acct-wrap').after(lb); lb.after(sb2); lb.classList.add('guest-only'); av.hidden = true;
  }
  window.openAuth = openAuth;
  // ---------- watchlist: assets and whole countries, saved to the member's account (Supabase table "watchlists") ----------
  // A copy stays on the device so stars paint at once; guests who tap a star get the sign-up popup.
  var INVWATCH = window.INVWATCH = (() => {
    const KEY = 'inv-watch', subs = new Set(); let L = { a: [], c: [] }, user = null;
    try { L = Object.assign(L, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
    const id = it => it.kind === 'country' ? 'c:' + it.k : (it.src || 'site') + ':' + it.s;
    const all = () => [...L.c.map(x => ({ kind: 'country', ...x })), ...L.a.map(x => ({ kind: 'asset', ...x }))];
    const has = it => !!user && all().some(x => id(x) === id(it));
    const ping = () => subs.forEach(f => { try { f(); } catch {} });
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch {} ping();
      if (user && sb) sb.from('watchlists').upsert({ user_id: user.id, items: L, updated_at: new Date().toISOString() }).then(() => {}, () => {}); };
    const toggle = it => { if (!user) { openAuth('up'); return null; }
      const k = it.kind === 'country' ? 'c' : 'a', on = has(it); const { kind, ...rest } = it;
      L[k] = on ? L[k].filter(x => id({ kind, ...x }) !== id(it)) : [rest, ...L[k]]; save(); if (!on && window.invTrack) invTrack('watch', it.kind === 'country' ? 'country:' + it.k : it.s); return !on; };
    const login = async u => { if ((u && u.id) === (user && user.id)) return; user = u || null;
      if (!user) { L = { a: [], c: [] }; try { localStorage.removeItem(KEY); } catch {} ping(); return; }
      try { const { data } = await sb.from('watchlists').select('items').eq('user_id', user.id).maybeSingle(); const r = (data && data.items) || {};
        const merge = (a = [], b = [], f) => [...a, ...b.filter(x => !a.some(y => f(y) === f(x)))];
        L = { a: merge(r.a, L.a, x => (x.src || 'site') + ':' + x.s), c: merge(r.c, L.c, x => x.k) }; save(); } catch { ping(); } };
    return { has, toggle, all, login, on: f => subs.add(f), get user() { return user; } };
  })();
  const paintStars = () => document.querySelectorAll('.star[data-s]').forEach(b => { const on = INVWATCH.has({ kind: 'asset', src: 'site', s: b.dataset.s }); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const g = b.querySelector('svg'); g && g.setAttribute('fill', on ? 'currentColor' : 'none'); });
  INVWATCH.on(paintStars); document.addEventListener('DOMContentLoaded', paintStars);
  document.addEventListener('DOMContentLoaded', () => {
    document.body.append(au);
    if (gated) { const g = document.createElement('section'); g.className = 'gate';
      g.innerHTML = `<span class="wm" translate="no" aria-hidden="true">Invested<span class="i">i</span>a</span><h1>Log in to see your ${page === 'watchlist' ? 'watchlist' : 'profile'}</h1><p class="muted">Your profile and watchlist can be saved to your account. Country and article follows are stored on this device; email alerts are not activated by following.</p><div class="gate-btns"><button class="btn btn-primary" type="button" data-auth="in">Log in</button><button class="btn btn-ghost" type="button" data-auth="up">Create free account</button></div>`;
      document.querySelector('main').prepend(g); }
    document.querySelectorAll('[data-auth]').forEach(b => b.onclick = e => { e.preventDefault(); document.querySelector('.drawer.open') && document.querySelector('.menu-toggle').click(); openAuth(b.dataset.auth || 'up'); });
    document.addEventListener('click', e => { const b = e.target.closest('[data-logout]'); if (!b) return; e.preventDefault(); b.disabled = true; try { localStorage.removeItem('inv-owner'); } catch {} sbLoad().then(c => c.auth.signOut()).catch(() => {}).finally(() => location.href = 'index.html'); });
    const returning = /access_token|code=/.test(location.href) || (() => { try { return Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)); } catch { return false; } })();
    if (authOn && returning) sbLoad().then(c => { c.auth.onAuthStateChange((_, s) => paintUser(s && s.user)); return c.auth.getSession(); }).then(r => paintUser(r.data.session && r.data.session.user)).catch(() => {});
    const ss = (k, v) => { try { return v === undefined ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch { return '1'; } };
    if (standaloneAuthSkip()) return;
    if (!store('inv-auth-seen') && !returning && !document.documentElement.classList.contains('embed')) setTimeout(() => { if (pop.hidden) openAuth('up'); }, 4000);
    // members who come back logged out: a quiet "Welcome back" once per visit
    else if (store('inv-had-account') && !ss('inv-wb')) setTimeout(() => { ss('inv-wb', '1'); if (pop.hidden && au.hidden && hdr.querySelector('#hdr-login') && !hdr.querySelector('#hdr-login').hidden) openAuth('in'); }, 2500);
  });
  function standaloneAuthSkip() { return isLegalPage || /[?&]noauth/.test(location.search); }
  // ---------- home-screen app ----------
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) document.documentElement.classList.add('is-app');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {}));
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installEvt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  const shareIc = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  function installBanner() {
    if (standalone || innerWidth > 900 || store('inv-app-x') || !store('inv-pop') || (!isIOS && !installEvt)) return;
    const b = document.createElement('div'); b.className = 'app-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Install the Investedia app');
    b.innerHTML = `<img src="assets/app/icon-192.png" alt="" width="44" height="44"><div><b>Get the Investedia app</b><span>${isIOS ? `Tap ${shareIc} then <b>Add to Home Screen</b>` : 'Full screen, faster, works offline'}</span></div>${isIOS ? '' : '<button class="btn btn-primary btn-sm" type="button" data-install>Install</button>'}<button class="app-x" type="button" aria-label="Close">×</button>`;
    const close = () => { store('inv-app-x', '1'); b.classList.remove('show'); setTimeout(() => b.remove(), 250); };
    b.querySelector('.app-x').onclick = close;
    const ib = b.querySelector('[data-install]'); if (ib) ib.onclick = async () => { installEvt.prompt(); await installEvt.userChoice; close(); };
    document.body.append(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('show')));
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(installBanner, 4000));
  window.installApp = () => installEvt ? installEvt.prompt() : null;

  // Deep links: #hash selects a tab (routes = { hash: [tabsId, tabKey] }) or scrolls to an element id
  function routeHash(routes = {}) {
    const go = () => {
      const h = decodeURIComponent(location.hash.slice(1)); if (!h) return;
      const r = routes[h];
      if (r) { const t = document.getElementById(r[0]); const b = t && t.querySelector(`[data-tab="${r[1]}"]`); if (b) { b.click(); (t.closest('section') || t).scrollIntoView({ block: 'start' }); } }
      else { const el = document.getElementById(h); if (el) el.scrollIntoView({ block: 'start' }); }
    };
    addEventListener('hashchange', go); setTimeout(go, 60);
  }
  // Pro chart: candles / line / area with volume pane, moving averages and crosshair readout
  function proChart(el, bars, opts = {}) {
    const { type = 'candles', height = 460, labels = [], sma = [], volume = true, fmt = v => v.toFixed(2), onHover, upCol = '#22C55E', downCol = '#F04444', lineCol = ACC() } = opts;
    el.classList.add('chart'); el.style.height = height + 'px';
    const avg = (k) => bars.map((_, i) => i < k - 1 ? null : bars.slice(i - k + 1, i + 1).reduce((s, b) => s + b.c, 0) / k);
    const draw = () => {
      const W = el.clientWidth, H = height, padL = 4, padR = 68, padT = 10, volH = volume ? H * .18 : 0, padB = 26;
      const pH = H - padT - padB - volH - (volume ? 8 : 0);
      let mn = Math.min(...bars.map(b => b.l)), mx = Math.max(...bars.map(b => b.h)); const pd = (mx - mn) * .06; mn -= pd; mx += pd;
      const n = bars.length, step = (W - padL - padR) / n, bw = Math.max(1, step * .64);
      const sx = i => padL + step * i + step / 2, sy = v => padT + (1 - (v - mn) / (mx - mn)) * pH;
      const vmax = Math.max(...bars.map(b => b.v)) || 1, vy0 = padT + pH + 8 + volH;
      let g = '';
      for (let k = 0; k <= 5; k++) { const v = mn + (mx - mn) * k / 5; g += `<line class="grid-l" x1="${padL}" x2="${W - padR}" y1="${sy(v)}" y2="${sy(v)}"/><text class="ax" x="${W - padR + 8}" y="${sy(v) + 4}">${fmt(v)}</text>`; }
      g += labels.map((l, k) => { const i = Math.round(k / Math.max(1, labels.length - 1) * (n - 1)); return `<text class="ax" x="${sx(i)}" y="${H - 8}" text-anchor="${k === 0 ? 'start' : k === labels.length - 1 ? 'end' : 'middle'}">${l}</text>`; }).join('');
      let body = '';
      if (volume) body += bars.map((b, i) => `<rect x="${sx(i) - bw / 2}" y="${vy0 - b.v / vmax * volH}" width="${bw}" height="${b.v / vmax * volH}" fill="${b.c >= b.o ? upCol : downCol}" opacity=".28"/>`).join('');
      if (type === 'candles') body += bars.map((b, i) => { const up = b.c >= b.o, col = up ? upCol : downCol, y1 = sy(Math.max(b.o, b.c)), y2 = sy(Math.min(b.o, b.c)); return `<line x1="${sx(i)}" x2="${sx(i)}" y1="${sy(b.h)}" y2="${sy(b.l)}" stroke="${col}" stroke-width="1"/><rect x="${sx(i) - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(1, y2 - y1)}" fill="${up ? col : col}" ${up ? 'fill-opacity=".9"' : ''} rx="${bw > 4 ? 1 : 0}"/>`; }).join('');
      else { const d = bars.map((b, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(b.c).toFixed(1)).join(''); const id = 'p' + Math.random().toString(36).slice(2, 7);
        body += (type === 'area' ? `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${lineCol}" stop-opacity=".25"/><stop offset="1" stop-color="${lineCol}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${sx(n - 1)} ${padT + pH}L${sx(0)} ${padT + pH}Z" fill="url(#${id})"/>` : '') + `<path d="${d}" fill="none" stroke="${lineCol}" stroke-width="2" stroke-linejoin="round"/>`; }
      const maCol = { 20: '#38BDF8', 50: '#A78BFA', 200: '#F472B6' };
      sma.forEach(k => { const a = avg(k); body += `<path d="${a.map((v, i) => v == null ? '' : (a[i - 1] == null ? 'M' : 'L') + sx(i).toFixed(1) + ' ' + sy(v).toFixed(1)).join('')}" fill="none" stroke="${maCol[k] || '#fff'}" stroke-width="1.4" opacity=".9"/>`; });
      const last = bars[n - 1], lc = last.c >= last.o ? upCol : downCol;
      body += `<line x1="${padL}" x2="${W - padR}" y1="${sy(last.c)}" y2="${sy(last.c)}" stroke="${lc}" stroke-dasharray="2 3" opacity=".7"/><rect x="${W - padR + 3}" y="${sy(last.c) - 10}" width="${padR - 5}" height="20" rx="4" fill="${lc}"/><text x="${W - padR + 8}" y="${sy(last.c) + 4}" font-family="Geist Mono,monospace" font-size="11" font-weight="600" fill="#0A0A0B">${fmt(last.c)}</text>`;
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price chart">${g}${body}<g class="hover" style="display:none"><line class="xh" y1="${padT}" y2="${H - padB}"/><line class="xh yh" x1="${padL}" x2="${W - padR}"/><rect class="ytag" x="${W - padR + 3}" width="${padR - 5}" height="20" rx="4" fill="#3f3f46"/><text class="ytxt" x="${W - padR + 8}" font-family="Geist Mono,monospace" font-size="11" fill="#fff"></text></g></svg>`;
      const svg = el.querySelector('svg'), hv = el.querySelector('.hover');
      svg.addEventListener('pointermove', rafMove(e => {
        const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
        const i = Math.max(0, Math.min(n - 1, Math.floor((x - padL) / step)));
        hv.style.display = ''; const [vx, hy] = hv.querySelectorAll('line');
        vx.setAttribute('x1', sx(i)); vx.setAttribute('x2', sx(i)); const yy = Math.max(padT, Math.min(padT + pH, y)); hy.setAttribute('y1', yy); hy.setAttribute('y2', yy);
        hv.querySelector('.ytag').setAttribute('y', yy - 10); const t = hv.querySelector('.ytxt'); t.setAttribute('y', yy + 4); t.textContent = fmt(mn + (1 - (yy - padT) / pH) * (mx - mn));
        onHover && onHover(bars[i], i);
      }), { passive: true });
      svg.addEventListener('pointerleave', () => { hv.style.display = 'none'; onHover && onHover(null); });
    };
    draw();
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(draw, 60); }).observe(el);
  }
  // ---------- smooth segmented controls ----------
  // Tab groups (.tabs) and range pickers (.range) get one highlight that slides to the selected button
  function segment(el) {
    if (el._seg) return; el._seg = true;
    const th = document.createElement('span'); th.className = 'seg-thumb'; th.setAttribute('aria-hidden', 'true');
    el.classList.add('has-thumb'); el.prepend(th);
    const place = anim => {
      if (!el.contains(th)) el.prepend(th);
      const b = el.querySelector(':scope > [aria-selected="true"], :scope > [aria-pressed="true"]');
      if (!b || !b.offsetWidth) { th.style.opacity = 0; return; }
      if (!anim) th.style.transition = 'none';
      th.style.width = b.offsetWidth + 'px'; th.style.height = b.offsetHeight + 'px';
      th.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`; th.style.opacity = 1;
      if (!anim) { th.offsetWidth; th.style.transition = ''; }
    };
    let first = true;
    new MutationObserver(() => { requestAnimationFrame(() => place(!first)); }).observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected', 'aria-pressed'] });
    if ('ResizeObserver' in window) new ResizeObserver(() => place(false)).observe(el);
    place(false); requestAnimationFrame(() => { first = false; });
  }
  const segAll = root => root.querySelectorAll && root.querySelectorAll('.tabs, .range').forEach(segment);
  // Quiet line icons in front of section titles
  const H_IC = { 'Global markets': 'globe', 'World indices': 'globe', 'Global indices': 'globe', 'By region': 'globe', 'Stocks by region': 'globe', 'Rising now': 'trend', 'Trending markets': 'trend',
    'Market movers': 'heat', 'Top gainers & losers': 'trend', 'Trending stocks': 'stocks', 'Major indices': 'indices', 'Index futures': 'clock', 'Extended-hours trading': 'clock',
    'Latest news': 'news', 'Featured analysis': 'news', 'Learn to invest': 'book', 'Cryptocurrency overview': 'crypto', 'Crypto movers': 'crypto', 'Crypto screener': 'filter',
    'Currency pairs': 'currencies', 'Currency heatmap': 'heat', 'S&P 500 heatmap': 'heat', 'Central bank rates': 'building', 'Government bonds': 'bonds', 'Corporate bonds': 'bonds',
    '10-year yields by country': 'bonds', 'Top ETFs': 'funds', 'ETF screener': 'filter', 'All commodities': 'commodities', 'Energy': 'commodities', 'Metals': 'commodities', 'Agriculture': 'commodities', 'Browse by type': 'filter' };
  const headIcons = () => document.querySelectorAll('main .sec-head h2').forEach(h => { const k = H_IC[h.textContent.trim()]; if (k && !h.querySelector('.h-ic')) h.insertAdjacentHTML('afterbegin', `<span class="h-ic" aria-hidden="true">${icon(k)}</span>`); });
  document.addEventListener('DOMContentLoaded', () => {
    segAll(document); headIcons();
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.matches('.tabs, .range')) segment(n); segAll(n); }))).observe(document.body, { childList: true, subtree: true });
  });

  // ---------- modern dropdowns ----------
  // Every <select> gets a custom menu in the site's style: a popover on computers, a bottom sheet on phones.
  // The real <select> stays in the page (hidden) and keeps its value, so existing page code and change handlers keep working.
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const csMenu = document.createElement('div'), csScrim = document.createElement('div');
  csMenu.className = 'csel-menu'; csMenu.setAttribute('role', 'listbox'); csMenu.hidden = true;
  csScrim.className = 'csel-scrim'; csScrim.hidden = true;
  let csCur = null, csType = '', csTypeT = 0;
  const csOpts = () => [...csMenu.querySelectorAll('.csel-opt:not([disabled])')];
  function csLabel(sel) { const l = sel.id && document.querySelector(`label[for="${sel.id}"]`); return sel.getAttribute('aria-label') || (l && l.textContent.trim()) || 'Choose an option'; }
  function csClose(keepFocus) {
    if (!csCur) return; const { btn } = csCur; csCur = null;
    btn.setAttribute('aria-expanded', 'false'); csMenu.classList.remove('open'); csScrim.classList.remove('open'); document.documentElement.classList.remove('csel-lock');
    setTimeout(() => { if (!csCur) { csMenu.hidden = true; csScrim.hidden = true; } }, 220);
    if (keepFocus) btn.focus();
  }
  function csPlace() {
    if (!csCur || csMenu.classList.contains('sheet')) return;
    const r = csCur.btn.getBoundingClientRect(), w = Math.max(r.width, 200), below = innerHeight - r.bottom - 12, above = r.top - 12, up = below < 220 && above > below;
    csMenu.style.width = w + 'px'; csMenu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    csMenu.style.top = up ? 'auto' : r.bottom + 6 + 'px'; csMenu.style.bottom = up ? innerHeight - r.top + 6 + 'px' : 'auto';
    csMenu.style.transformOrigin = up ? 'bottom' : 'top';
    csMenu.querySelector('.csel-list').style.maxHeight = Math.min(360, up ? above : below) + 'px';
  }
  function csOpen(sel, btn) {
    if (csCur && csCur.sel === sel) return csClose(true);
    csClose(); csCur = { sel, btn, t: Date.now() };
    const sheet = innerWidth <= 600 && !document.documentElement.classList.contains('st-dropdown-popover'), check = icon('check');
    const opt = o => `<button type="button" role="option" class="csel-opt" data-i="${o.index}" aria-selected="${o.selected}" ${o.disabled ? 'disabled' : ''}><span>${esc(o.text)}</span>${check}</button>`;
    let html = '';
    [...sel.children].forEach(ch => { if (ch.tagName === 'OPTGROUP') html += `<div class="csel-group">${esc(ch.label)}</div>` + [...ch.children].map(opt).join(''); else if (ch.tagName === 'OPTION') html += opt(ch); });
    csMenu.innerHTML = (sheet ? `<div class="csel-head">${esc(csLabel(sel))}</div>` : '') + `<div class="csel-list">${html}</div>`;
    csMenu.setAttribute('aria-label', csLabel(sel)); csMenu.classList.toggle('sheet', sheet);
    if (!csMenu.isConnected) document.body.append(csScrim, csMenu);
    csMenu.hidden = false; csScrim.hidden = !sheet; if (sheet) document.documentElement.classList.add('csel-lock'); btn.setAttribute('aria-expanded', 'true');
    csMenu.style.cssText = ''; csPlace();
    requestAnimationFrame(() => { csMenu.classList.add('open'); if (sheet) csScrim.classList.add('open'); });
    const on = csMenu.querySelector('[aria-selected="true"]') || csOpts()[0];
    if (on) { const l = csMenu.querySelector('.csel-list'); l.scrollTop = Math.max(0, on.offsetTop - l.clientHeight / 2); on.focus({ preventScroll: true }); }
  }
  function csChoose(i) {
    if (!csCur) return; const { sel } = csCur;
    if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
    csClose(true);
  }
  csMenu.addEventListener('click', e => { const b = e.target.closest('.csel-opt'); if (b && !b.disabled) csChoose(+b.dataset.i); });
  csScrim.addEventListener('click', () => csClose(true));
  csMenu.addEventListener('keydown', e => {
    const list = csOpts(), i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = list[Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]; n && n.focus(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); (e.key === 'Home' ? list[0] : list[list.length - 1]).focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); csClose(true); }
    else if (e.key === 'Tab') csClose();
    else if (e.key.length === 1 && /\S/.test(e.key)) { clearTimeout(csTypeT); csType += e.key.toLowerCase(); csTypeT = setTimeout(() => csType = '', 600); const hit = list.find(o => o.textContent.trim().toLowerCase().startsWith(csType)); hit && hit.focus(); }
  });
  document.addEventListener('pointerdown', e => { if (csCur && !csMenu.contains(e.target) && !csCur.btn.contains(e.target)) csClose(); }, true);
  addEventListener('resize', () => csCur && (csMenu.classList.contains('sheet') !== (innerWidth <= 600 && !document.documentElement.classList.contains('st-dropdown-popover')) ? csClose() : csPlace()));
  addEventListener('scroll', e => { if (csCur && !csMenu.classList.contains('sheet') && Date.now() - csCur.t > 300 && !csMenu.contains(e.target)) csClose(); }, { passive: true, capture: true });
  function enhanceSelect(sel) {
    if (sel._cs || sel.multiple || sel.size > 1 || sel.closest('[data-native]')) return; sel._cs = true;
    const st = sel.getAttribute('style') || '', inline = /width:\s*auto|inline-block/.test(st) || sel.classList.contains('sel-sm') || getComputedStyle(sel).display === 'inline-block';
    const wrap = document.createElement('span'), btn = document.createElement('button');
    wrap.className = 'csel' + (inline ? ' csel-inline' : '');
    btn.type = 'button'; btn.className = sel.className + ' csel-btn'; btn.setAttribute('style', st.replace(/display:\s*inline-block;?/, ''));
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', csLabel(sel));
    sel.parentNode.insertBefore(wrap, sel); wrap.append(sel, btn);
    sel.classList.add('csel-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    if (sel.id) document.querySelectorAll(`label[for="${sel.id}"]`).forEach(l => l.addEventListener('click', e => { e.preventDefault(); btn.focus(); }));
    const refresh = () => { const o = sel.options[sel.selectedIndex]; btn.innerHTML = `<span class="csel-val">${o ? esc(o.text) : ''}</span>`; btn.disabled = sel.disabled; };
    sel._csRefresh = refresh; refresh();
    new MutationObserver(refresh).observe(sel, { childList: true, subtree: true, attributes: true, characterData: true });
    sel.addEventListener('change', refresh);
    btn.addEventListener('click', () => csOpen(sel, btn));
    btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); csOpen(sel, btn); } });
  }
  // Keep the button label right when page code sets select.value or selectedIndex directly
  ['value', 'selectedIndex'].forEach(k => { const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, k); if (d && d.set) Object.defineProperty(HTMLSelectElement.prototype, k, { ...d, set(v) { d.set.call(this, v); if (this._csRefresh) this._csRefresh(); } }); });
  const selAll = root => root.querySelectorAll && root.querySelectorAll('select').forEach(enhanceSelect);
  document.addEventListener('DOMContentLoaded', () => {
    selAll(document);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.tagName === 'SELECT') enhanceSelect(n); else selAll(n); }))).observe(document.body, { childList: true, subtree: true });
  });

  // ---------- regions ----------
  // Tabs for the regions that actually have assets in `list`; calls onChange('All' | 'Europe' | …)
  const regionLabel = r => r;
  function regionTabs(el, list, onChange, cur = 'All') {
    const have = M.REGIONS.filter(r => list.some(a => a.region === r));
    el.classList.add('tabs', 'region-tabs'); el.setAttribute('role', 'tablist'); el.setAttribute('aria-label', 'Region');
    el.innerHTML = ['All', ...have].map(r => `<button class="tab" type="button" role="tab" aria-selected="${r === cur}" data-r="${r}">${regionLabel(r)}</button>`).join('');
    el.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; el.querySelectorAll('[data-r]').forEach(x => x.setAttribute('aria-selected', x === b)); onChange(b.dataset.r); };
    return have;
  }
  const inRegion = (list, r) => !r || r === 'All' ? list : list.filter(a => a.region === r);
  // "Rising now" for a region: top gainers for a period (d = today, w = week, m1 = month) plus the region's largest companies
  function regionMovers(el, list, region = 'All', per = 'd') {
    const pool = inRegion(list, region), lab = { d: 'today', w: 'this week', m1: 'this month' }[per];
    const up = pool.filter(a => a[per] > 0).sort((x, y) => y[per] - x[per]).slice(0, 6);
    const big = pool.filter(a => a.m).sort((x, y) => y.m - x.m).slice(0, 6);
    const row = (a, v) => `<a class="arow" href="${href(a)}" style="grid-template-columns:minmax(0,1fr) auto auto"><span class="ident">${logo(a)}<span><b>${a.c === 'indices' || a.c === 'bonds' ? a.n : a.s}</b><small>${a.c === 'indices' || a.c === 'bonds' ? a.s : a.n}</small></span></span><span class="num" data-lp="${a.s}">${fmtP(a)}</span><span class="num ${cls(v)}" style="min-width:72px;text-align:right">${fmtC(v, a.y)}</span></a>`;
    el.innerHTML = `<div class="grid g-2">
      <div class="card"><div class="card-head"><h3>Rising ${lab}${region === 'All' ? '' : ' · ' + regionLabel(region)}</h3><div class="range" data-per>${[['d', '1D'], ['w', '1W'], ['m1', '1M']].map(([k, t]) => `<button type="button" aria-pressed="${k === per}" data-k="${k}">${t}</button>`).join('')}</div></div>
        <div>${up.length ? up.map(a => row(a, a[per])).join('') : `<p class="muted" style="padding:16px 18px;margin:0">Nothing in ${region} is up ${lab}.</p>`}</div></div>
      <div class="card"><div class="card-head"><h3>Largest${region === 'All' ? '' : ' in ' + regionLabel(region)}</h3><span class="meta">by market value</span></div>
        <div>${big.map(a => row(a, a.d)).join('') || `<p class="muted" style="padding:16px 18px;margin:0">No companies listed yet.</p>`}</div></div></div>`;
    el.querySelectorAll('[data-per] button').forEach(b => b.onclick = () => regionMovers(el, list, region, b.dataset.k));
  }

  window.UI = { icon, fmtP, fmtC, cls, cap, logo, href, spark, colorFor, areaChart, cover, assetTable, tabs, row, impact, sTag, analysisCard, routeHash, subnav, newsNav, heatmap, heatLegend, heatColor, divBar, proChart, nhref, heatmap2, heatLegend2, heatVar, heatTip, acc: ACC, applyStudio, STUDIO_DEF, regionTabs, inRegion, regionMovers, regionLabel };
})();
