// Simple market data using Yahoo Finance with proper error handling

export async function getMarketData(symbol: string) {
  console.log(`📊 Fetching market data for ${symbol}`);
  
  try {
    // Format symbol for Yahoo
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) {
      yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    } else if (symbol.endsWith('.TW')) {
      yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    }
    
    // Use Yahoo Finance API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    console.log(`🌐 Fetching: ${url}`);
    
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.log(`❌ HTTP ${res.status} for ${symbol}`);
      return null;
    }
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.meta || !result.meta.regularMarketPrice) {
      console.log(`❌ No price data for ${symbol}`);
      return null;
    }
    
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    console.log(`✅ ${symbol}: $${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    
    return {
      symbol,
      price,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume || 0,
      high: meta.regularMarketDayHigh || price,
      low: meta.regularMarketDayLow || price,
      historical: [],
    };
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err);
    return null;
  }
}
