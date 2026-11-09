// Investedia education library content. Add courses, lessons, tutorials and glossary terms here.
window.LEARN = (function () {
  const topics = [
    { k: 'start', t: 'Getting started', d: 'Your first steps with money and markets', i: 'book' },
    { k: 'stocks', t: 'Stocks', d: 'Owning a piece of a company', i: 'stocks' },
    { k: 'funds', t: 'ETFs & funds', d: 'Diversify with one purchase', i: 'funds' },
    { k: 'bonds', t: 'Bonds', d: 'Lending money for interest', i: 'bonds' },
    { k: 'crypto', t: 'Crypto', d: 'Blockchains, coins and risk', i: 'crypto' },
    { k: 'currencies', t: 'Currencies', d: 'How forex markets work', i: 'currencies' },
    { k: 'commodities', t: 'Commodities', d: 'Gold, oil and raw materials', i: 'commodities' },
    { k: 'realestate', t: 'Real estate', d: 'Property, mortgages and REITs', i: 'building' },
    { k: 'charts', t: 'Charts & technicals', d: 'Reading price action', i: 'indices' },
    { k: 'fundamentals', t: 'Fundamentals', d: 'Valuing companies', i: 'calc' },
    { k: 'personal', t: 'Personal finance', d: 'Budgeting, saving, goals', i: 'compound' },
    { k: 'accounts', t: 'Accounts & taxes', d: 'Brokers, account types, tax basics', i: 'shield' },
  ];

  // Lessons with `body` are fully written; the rest show their outline until published.
  const courses = [
    { id: 'basics', topic: 'start', t: 'Investing from zero', d: 'What investing is, why it works and how to start safely.', level: 'Beginner', min: 45, lessons: [
      { t: 'What does “investing” actually mean?', min: 6, body: [
        'Investing means putting money into something you expect to be worth more later: a share of a company, a loan to a government, a building, or a fund that holds hundreds of these at once.',
        'Saving keeps your money safe but it slowly loses buying power to inflation. Investing accepts some ups and downs in exchange for growth that has historically beaten inflation over long periods.',
        '## The three ways investments make money',
        'Growth: the thing you own becomes more valuable, like a company that earns more each year. Income: it pays you along the way, through dividends, interest or rent. Compounding: you reinvest that income, so your returns start earning returns of their own.',
        '> The earlier you start, the more time compounding has to work. Time in the market matters more than timing the market.',
        '## Risk and return go together',
        'Investments that can grow faster usually swing more in the short term. A savings account barely moves; a single stock can drop 30% in a month. Spreading your money across many investments, called diversification, smooths the ride.',
      ], takeaways: ['Investing trades short-term ups and downs for long-term growth.', 'Returns come from growth, income and compounding.', 'Higher potential return usually means higher short-term risk.'], quiz: { q: 'What is diversification?', a: ['Putting all your money in the best stock', 'Spreading money across many different investments', 'Selling when prices fall'], ok: 1 } },
      { t: 'Saving vs. investing: when to do which', min: 7, body: [
        'Before investing, most people keep an emergency fund: three to six months of essential expenses in an easy-to-reach savings account. This money is for surprises, not for growth.',
        '## A simple rule of thumb',
        'Money you need within about three years usually belongs in savings. Money you won’t touch for five years or more is a candidate for investing, because you have time to ride out the bad years.',
        '> Never invest money you might need next month. Being forced to sell during a dip is how temporary losses become permanent.',
        'Paying off expensive debt, like credit cards, also comes first. Clearing a 20% interest debt is a guaranteed 20% “return” that no investment can reliably beat.',
      ], takeaways: ['Build an emergency fund first.', 'Short-term money: save. Long-term money: invest.', 'Pay off high-interest debt before investing.'], quiz: { q: 'Where should money you need in the next 6 months usually go?', a: ['A savings account', 'A single stock', 'Bitcoin'], ok: 0 } },
      { t: 'How compound growth works', min: 8, body: [
        'Compounding is earning returns on your returns. If €1,000 grows 7% in a year, you have €1,070. The next year, 7% is calculated on €1,070, not €1,000.',
        '## Why time beats amount',
        'Someone who invests €100 a month from age 25 to 35 and then stops can end up with more at 65 than someone who invests €100 a month from 35 to 65, because the early money compounds for longer.',
        '> Try it yourself in the compound interest calculator: change only the number of years and watch the final balance.',
        'Compounding works against you too. Fees of 1–2% a year compound just like returns, which is why low-cost index funds matter so much.',
      ], takeaways: ['Returns earn returns of their own.', 'Starting early matters more than investing a lot.', 'Fees compound too, so keep them low.'], quiz: { q: 'Why do low fees matter so much over decades?', a: ['They don’t really matter', 'Fees compound, just like returns', 'Fees are only charged once'], ok: 1 } },
      { t: 'Stocks, bonds and funds in plain English', min: 8 },
      { t: 'Choosing a broker', min: 7 },
      { t: 'Your first investment, step by step', min: 9 },
    ] },
    { id: 'etfs', topic: 'funds', t: 'ETFs and index funds', d: 'Why most people should start with low-cost funds.', level: 'Beginner', min: 30, lessons: [{ t: 'What is an ETF?', min: 5 }, { t: 'Index funds vs. active funds', min: 6 }, { t: 'Reading an ETF factsheet', min: 7 }, { t: 'Accumulating vs. distributing', min: 5 }, { t: 'Building a two-fund portfolio', min: 7 }] },
    { id: 'charts', topic: 'charts', t: 'Reading a stock chart', d: 'Candles, trends, support, resistance and volume.', level: 'Intermediate', min: 40, lessons: [{ t: 'Line vs. candlestick charts', min: 6 }, { t: 'Trends and moving averages', min: 7 }, { t: 'Support and resistance', min: 7 }, { t: 'Volume: confirming a move', min: 6 }, { t: 'Common patterns and their limits', min: 8 }, { t: 'Using the Investedia dashboard', min: 6 }] },
    { id: 'crypto101', topic: 'crypto', t: 'Crypto without the hype', d: 'How blockchains, wallets and risk really work.', level: 'Beginner', min: 35, lessons: [{ t: 'What is a blockchain?', min: 6 }, { t: 'Bitcoin vs. Ethereum', min: 7 }, { t: 'Wallets, keys and exchanges', min: 8 }, { t: 'Stablecoins and DeFi', min: 7 }, { t: 'Managing crypto risk', min: 7 }] },
    { id: 'valuation', topic: 'fundamentals', t: 'Valuing a company', d: 'P/E, cash flow and what “cheap” really means.', level: 'Advanced', min: 60, lessons: [{ t: 'Reading an income statement', min: 9 }, { t: 'P/E, P/S and other ratios', min: 8 }, { t: 'Free cash flow', min: 9 }, { t: 'Moats and quality', min: 8 }, { t: 'A simple DCF', min: 12 }, { t: 'Putting it together', min: 10 }] },
    { id: 'bonds101', topic: 'bonds', t: 'Bonds and interest rates', d: 'Yields, prices and why they move in opposite directions.', level: 'Intermediate', min: 35, lessons: [{ t: 'What a bond is', min: 6 }, { t: 'Yield vs. price', min: 7 }, { t: 'The yield curve', min: 8 }, { t: 'Government vs. corporate bonds', min: 7 }, { t: 'Bonds in a portfolio', min: 7 }] },
    { id: 'property', topic: 'realestate', t: 'Real estate investing basics', d: 'Mortgages, rental yields and REITs.', level: 'Beginner', min: 40, lessons: [{ t: 'How mortgages work', min: 8 }, { t: 'The real cost of owning', min: 7 }, { t: 'Rental yield, gross and net', min: 7 }, { t: 'Leverage: the double-edged sword', min: 8 }, { t: 'REITs: property on the stock market', min: 7 }] },
    { id: 'money', topic: 'personal', t: 'Money foundations', d: 'Budgeting, emergency funds and goals.', level: 'Beginner', min: 30, lessons: [{ t: 'A budget that actually works', min: 6 }, { t: 'Your emergency fund', min: 5 }, { t: 'Paying off debt', min: 6 }, { t: 'Setting money goals', min: 6 }, { t: 'Automating your finances', min: 6 }] },
    { id: 'forex', topic: 'currencies', t: 'How currency markets work', d: 'Pairs, pips and what moves exchange rates.', level: 'Intermediate', min: 30, lessons: [{ t: 'Reading a currency pair', min: 5 }, { t: 'What moves exchange rates', min: 7 }, { t: 'Central banks and rates', min: 7 }, { t: 'Currency risk for investors', min: 6 }] },
    { id: 'gold', topic: 'commodities', t: 'Gold, oil and commodities', d: 'Why raw materials move and how people invest in them.', level: 'Intermediate', min: 30, lessons: [{ t: 'What drives commodity prices', min: 7 }, { t: 'Gold as a safe haven', min: 6 }, { t: 'Oil and the economy', min: 7 }, { t: 'Ways to invest in commodities', min: 6 }] },
  ];

  const tutorials = [
    ['How to open a brokerage account', 'accounts', 6, 'What you’ll need, which account type to pick and what to check before you sign up.'],
    ['How to buy your first ETF', 'funds', 5, 'Find the ticker, check the fees, place the order and confirm it went through.'],
    ['How to set up monthly investing', 'start', 4, 'Automate a fixed amount every month, the strategy behind our POV videos.'],
    ['How to read a candlestick', 'charts', 4, 'Open, high, low and close in one shape, with real examples.'],
    ['How to buy Bitcoin safely', 'crypto', 7, 'Choosing an exchange, securing your account and storing coins.'],
    ['How to build a watchlist', 'start', 3, 'Track the assets you care about on the Investedia dashboard.'],
    ['How to use the stock screener', 'stocks', 5, 'Filter thousands of stocks down to a shortlist in minutes.'],
    ['How to calculate a mortgage', 'realestate', 4, 'Use the mortgage calculator to see payments and total interest.'],
  ];

  const glossary = [
    ['Asset', 'Anything you own that has value, such as shares, bonds, property or cash.'],
    ['Bear market', 'A fall of 20% or more from a recent high, usually lasting months.'],
    ['Bond', 'A loan you make to a government or company in exchange for interest.'],
    ['Broker', 'A company that lets you buy and sell investments.'],
    ['Bull market', 'A long period of rising prices.'],
    ['Candlestick', 'A chart shape showing a period’s open, high, low and close prices.'],
    ['Compound interest', 'Earning returns on both your money and your past returns.'],
    ['Diversification', 'Spreading money across many investments to lower risk.'],
    ['Dividend', 'A share of a company’s profit paid to shareholders.'],
    ['DCA', 'Dollar-cost averaging: investing a fixed amount at regular intervals.'],
    ['ETF', 'Exchange-traded fund: a basket of investments that trades like a single stock.'],
    ['Expense ratio', 'The yearly fee a fund charges, as a percentage of your investment.'],
    ['Index', 'A list of investments that tracks part of a market, like the S&P 500.'],
    ['Inflation', 'The rate at which prices rise, reducing what money can buy.'],
    ['Liquidity', 'How quickly something can be sold without lowering its price.'],
    ['Market cap', 'A company’s total value: share price times number of shares.'],
    ['P/E ratio', 'Share price divided by earnings per share. A rough measure of how expensive a stock is.'],
    ['Portfolio', 'All the investments a person holds.'],
    ['REIT', 'Real estate investment trust: a company that owns property and trades on the stock market.'],
    ['Stablecoin', 'A cryptocurrency designed to stay at a fixed price, usually $1.'],
    ['Volatility', 'How much and how fast a price moves up and down.'],
    ['Yield', 'The income an investment pays, as a percentage of its price.'],
  ];

  const paths = [
    { t: 'Beginner path', d: 'From zero to your first investment.', steps: ['Money foundations', 'Investing from zero', 'ETFs and index funds', 'How to open a brokerage account', 'How to set up monthly investing'], done: 1 },
    { t: 'Long-term investor', d: 'Build and understand a lasting portfolio.', steps: ['ETFs and index funds', 'Bonds and interest rates', 'Valuing a company', 'Real estate investing basics'], done: 0 },
    { t: 'Crypto explorer', d: 'Understand digital assets before you buy.', steps: ['Crypto without the hype', 'How to buy Bitcoin safely', 'Managing crypto risk'], done: 0 },
  ];

  return { topics, courses, tutorials, glossary, paths };
})();
