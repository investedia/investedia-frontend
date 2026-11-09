// Shared sector list for the News menu search and the Markets page: name, sector fund (ETF) used for the price move, keyword rule, line icon.
window.InvSectors = (() => {
  const P = {
    tech: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',
    energy: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    bank: '<path d="m4 9 8-5 8 5H4Zm1 12h14M7 11v7m5-7v7m5-7v7"/>',
    health: '<rect x="4" y="6" width="16" height="15" rx="3"/><path d="M8 6V3h8v3m-4 5v6m-3-3h6"/>',
    retail: '<path d="M6 8h12l2 13H4L6 8Zm3 0V6a3 3 0 0 1 6 0v2"/>',
    auto: '<path d="M4 16v-4l2-5h12l2 5v4M3 16h18M7 19v-3M17 19v-3M6 12h12"/>',
    industry: '<path d="M3 21V9l6 4V8l6 4V3h5v18H3Zm3-4h2m3 0h2m3 0h2"/>',
    aero: '<path d="M12 3c3 2 5 5 5 9l-3 3h-4l-3-3c0-4 2-7 5-9ZM9 15l-3 4 4-1M15 15l3 4-4-1"/><circle cx="12" cy="10" r="1.6"/>',
    gem: '<path d="M6 4h12l3 5-9 11L3 9l3-5ZM3 9h18M9 4l3 5 3-5M12 9v11"/>',
    util: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>',
    home: '<path d="M3 11 12 3l9 8M5 10v10h14V10M10 20v-6h4v6"/>',
    shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M10 8v8m3-8v8M9 9h4.5a1.5 1.5 0 0 1 0 3H9m0 0h5a1.5 1.5 0 0 1 0 3H9"/>'
  };
  const list = [
    ['Technology', 'XLK', /technolog|software|cloud|internet|cyber|saas|\bai\b|artificial intelligence|data cent/i, 'tech'],
    ['Semiconductors', 'SMH', /semiconductor|chip|nvidia|micron|\bamd\b|asml|tsmc|lam research|wafer/i, 'chip'],
    ['Energy', 'XLE', /\boil\b|\bgas\b|energy|opec|crude|petrol|lng|refin|pipeline/i, 'energy'],
    ['Banks & Finance', 'XLF', /\bbank|lender|financ|fed\b|central bank|interest rate|credit|loan|mortgage/i, 'bank'],
    ['Healthcare', 'XLV', /health|pharma|drug|biotech|medic|hospital|vaccine/i, 'health'],
    ['Consumer & Retail', 'XLY', /retail|consumer|luxury|e-?commerce|restaurant|shopping|apparel/i, 'retail'],
    ['Autos', 'CARZ', /\bauto|\bcar\b|vehicle|\bev\b|tesla|ford\b|general motors|toyota|hyundai/i, 'auto'],
    ['Industrials', 'XLI', /industrial|manufactur|machinery|logistic|shipping|rail|freight/i, 'industry'],
    ['Aerospace & Defence', 'ITA', /aerospace|defen[cs]e|spacex|boeing|airbus|rheinmetall|missile|airline/i, 'aero'],
    ['Materials & Mining', 'XLB', /mining|miner|steel|copper|lithium|gold\b|silver|chemical|materials/i, 'gem'],
    ['Utilities', 'XLU', /utilit|electric|power|renewable|solar|wind/i, 'util'],
    ['Real estate', 'XLRE', /real estate|housing|property|reit|home price|mortgage rate/i, 'home'],
    ['Insurance', 'KIE', /insur/i, 'shield'],
    ['Communication', 'XLC', /media|stream|telecom|social network|netflix|meta platforms|advertis/i, 'chat'],
    ['Crypto', 'BTC-USD', /crypto|bitcoin|ethereum|stablecoin|blockchain/i, 'coin']
  ].map(([name, etf, re, ic]) => ({ name, etf, re, ic, slug: name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
  const icon = (name, cls = 'sec-ic') => { const s = list.find(x => x.name === name || x.slug === name); return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[s ? s.ic : 'tech']}</svg>`; };
  return { list, icon };
})();
