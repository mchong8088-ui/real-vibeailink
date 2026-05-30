// Fundamental data fetching from multiple providers
// Returns: marketCap, peRatio, revenueGrowth, profitMargin, debtRatio

export interface FundamentalData {
  marketCap: string;
  peRatio: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
  debtRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  source: string;
}

// Fetch from Yahoo Finance (free, good coverage)
async function fetchYahooFundamentals(symbol: string): Promise<FundamentalData | null> {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    // Fetch summary profile
    const profileUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryProfile,financialData,defaultKeyStatistics`;
    const res = await fetch(profileUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const quoteSummary = data.quoteSummary?.result?.[0];
    
    if (!quoteSummary) return null;
    
    const price = quoteSummary.financialData;
    const stats = quoteSummary.defaultKeyStatistics;
    const profile = quoteSummary.summaryProfile;
    
    // Extract values
    let marketCap = stats?.marketCap?.fmt || 'N/A';
    let peRatio = stats?.trailingPE?.raw || null;
    let eps = stats?.trailingEps?.raw || null;
    let dividendYield = stats?.dividendYield?.raw ? stats.dividendYield.raw * 100 : null;
    
    // Revenue growth and profit margin from financialData
    let revenueGrowth = price?.revenueGrowth?.raw ? price.revenueGrowth.raw * 100 : null;
    let profitMargin = price?.profitMargins?.raw ? price.profitMargins.raw * 100 : null;
    
    // Debt to equity ratio (if available)
    let debtRatio = stats?.debtToEquity?.raw || null;
    
    // Format market cap
    if (typeof marketCap === 'number') {
      if (marketCap >= 1e12) marketCap = `$${(marketCap / 1e12).toFixed(2)}T`;
      else if (marketCap >= 1e9) marketCap = `$${(marketCap / 1e9).toFixed(2)}B`;
      else if (marketCap >= 1e6) marketCap = `$${(marketCap / 1e6).toFixed(2)}M`;
      else marketCap = `$${marketCap.toFixed(0)}`;
    }
    
    return {
      marketCap,
      peRatio,
      revenueGrowth,
      profitMargin,
      debtRatio,
      eps,
      dividendYield,
      source: 'Yahoo Finance',
    };
  } catch (err) {
    console.log(`Yahoo fundamentals failed for ${symbol}`);
    return null;
  }
}

// Fallback: Alpha Vantage fundamentals
async function fetchAlphaVantageFundamentals(symbol: string): Promise<FundamentalData | null> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return null;
    
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.Symbol) return null;
    
    let marketCap = data.MarketCapitalization || 'N/A';
    let peRatio = data.PERatio ? parseFloat(data.PERatio) : null;
    let revenueGrowth = data.QuarterlyRevenueGrowthYOY ? parseFloat(data.QuarterlyRevenueGrowthYOY) * 100 : null;
    let profitMargin = data.ProfitMargin ? parseFloat(data.ProfitMargin) * 100 : null;
    let debtRatio = data.DebtToEquityRatio ? parseFloat(data.DebtToEquityRatio) : null;
    
    // Format market cap
    const capNum = parseInt(marketCap);
    if (!isNaN(capNum)) {
      if (capNum >= 1e12) marketCap = `$${(capNum / 1e12).toFixed(2)}T`;
      else if (capNum >= 1e9) marketCap = `$${(capNum / 1e9).toFixed(2)}B`;
      else if (capNum >= 1e6) marketCap = `$${(capNum / 1e6).toFixed(2)}M`;
      else marketCap = `$${capNum.toFixed(0)}`;
    }
    
    return {
      marketCap,
      peRatio,
      revenueGrowth,
      profitMargin,
      debtRatio,
      eps: data.EPS ? parseFloat(data.EPS) : null,
      dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : null,
      source: 'Alpha Vantage',
    };
  } catch (err) {
    console.log(`Alpha Vantage fundamentals failed for ${symbol}`);
    return null;
  }
}

// Fallback: Twelve Data fundamentals
async function fetchTwelveDataFundamentals(symbol: string): Promise<FundamentalData | null> {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) return null;
    
    let formattedSymbol = symbol;
    if (symbol.endsWith('.HK')) formattedSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) formattedSymbol = symbol.replace('.TW', '');
    
    const url = `https://api.twelvedata.com/quote?symbol=${formattedSymbol}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.symbol) return null;
    
    let peRatio = data.pe ? parseFloat(data.pe) : null;
    let marketCap = data.market_cap || 'N/A';
    
    // Format market cap
    if (typeof marketCap === 'number') {
      if (marketCap >= 1e12) marketCap = `$${(marketCap / 1e12).toFixed(2)}T`;
      else if (marketCap >= 1e9) marketCap = `$${(marketCap / 1e9).toFixed(2)}B`;
      else if (marketCap >= 1e6) marketCap = `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    
    return {
      marketCap,
      peRatio,
      revenueGrowth: null,
      profitMargin: null,
      debtRatio: null,
      eps: data.eps ? parseFloat(data.eps) : null,
      dividendYield: data.dividend_yield ? parseFloat(data.dividend_yield) : null,
      source: 'Twelve Data',
    };
  } catch (err) {
    console.log(`Twelve Data fundamentals failed for ${symbol}`);
    return null;
  }
}

// Mock data for development/testing (when no API keys)
function getMockFundamentals(symbol: string): FundamentalData {
  const mockData: Record<string, any> = {
    '0700.HK': { marketCap: '$380B', peRatio: 18.5, revenueGrowth: 8.5, profitMargin: 22.5, debtRatio: 0.25 },
    '2330.TW': { marketCap: '$550B', peRatio: 22.0, revenueGrowth: 28.0, profitMargin: 45.0, debtRatio: 0.15 },
    'TSLA': { marketCap: '$850B', peRatio: 65.2, revenueGrowth: 18.5, profitMargin: 15.2, debtRatio: 0.35 },
    'AAPL': { marketCap: '$3.0T', peRatio: 28.5, revenueGrowth: 5.2, profitMargin: 26.0, debtRatio: 1.2 },
    'NVDA': { marketCap: '$2.2T', peRatio: 42.0, revenueGrowth: 90.0, profitMargin: 55.0, debtRatio: 0.2 },
    '0005.HK': { marketCap: '$160B', peRatio: 6.5, revenueGrowth: 3.2, profitMargin: 28.0, debtRatio: 0.8 },
  };
  
  const data = mockData[symbol] || mockData['AAPL'];
  return {
    marketCap: data.marketCap,
    peRatio: data.peRatio,
    revenueGrowth: data.revenueGrowth,
    profitMargin: data.profitMargin,
    debtRatio: data.debtRatio,
    eps: null,
    dividendYield: null,
    source: 'Mock Data',
  };
}

// ============================================
// MAIN EXPORT - Fundamental Engine
// ============================================

export async function getFundamentals(symbol: string): Promise<FundamentalData | null> {
  console.log(`📊 Fetching fundamentals for ${symbol}`);
  
  // Try Yahoo Finance first (best coverage)
  let data = await fetchYahooFundamentals(symbol);
  if (data) {
    console.log(`✅ Fundamentals from ${data.source} for ${symbol}`);
    return data;
  }
  
  // Try Alpha Vantage
  data = await fetchAlphaVantageFundamentals(symbol);
  if (data) {
    console.log(`✅ Fundamentals from ${data.source} for ${symbol}`);
    return data;
  }
  
  // Try Twelve Data
  data = await fetchTwelveDataFundamentals(symbol);
  if (data) {
    console.log(`✅ Fundamentals from ${data.source} for ${symbol}`);
    return data;
  }
  
  // Fallback to mock data for development
  console.log(`⚠️ Using mock fundamentals for ${symbol}`);
  return getMockFundamentals(symbol);
}

// Quick access functions for specific metrics
export async function getMarketCap(symbol: string): Promise<string> {
  const data = await getFundamentals(symbol);
  return data?.marketCap || 'N/A';
}

export async function getPERatio(symbol: string): Promise<number | null> {
  const data = await getFundamentals(symbol);
  return data?.peRatio || null;
}

export async function getRevenueGrowth(symbol: string): Promise<number | null> {
  const data = await getFundamentals(symbol);
  return data?.revenueGrowth || null;
}
