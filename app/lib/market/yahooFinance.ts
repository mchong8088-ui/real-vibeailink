// Yahoo Finance API - Free and works for HK/TW stocks
export async function fetchYahooFinance(symbol: string) {
  try {
    // Format symbol for Yahoo Finance
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) {
      yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    } else if (symbol.endsWith('.TW')) {
      yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    }
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    console.log(`Fetching Yahoo data for: ${yahooSymbol}`);
    
    const res = await fetch(url, { next: { revalidate: 60 } });
    
    if (!res.ok) {
      console.log(`Yahoo returned ${res.status} for ${yahooSymbol}`);
      return null;
    }
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.indicators?.quote?.[0]) {
      console.log(`No data found for ${yahooSymbol}`);
      return null;
    }
    
    const quote = result.indicators.quote[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    
    // Build historical data
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.close && quote.close[i] !== null) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
          high: quote.high?.[i] || 0,
          low: quote.low?.[i] || 0,
        });
      }
    }
    
    const closes = historical.map(h => h.close).filter(c => c > 0);
    
    if (closes.length === 0) {
      console.log(`No valid price data for ${yahooSymbol}`);
      return null;
    }
    
    return {
      symbol,
      historical,
      price: meta.regularMarketPrice || closes[closes.length - 1],
      volume: meta.regularMarketVolume || 0,
      previousClose: meta.previousClose || 0,
      change: (meta.regularMarketPrice - meta.previousClose) || 0,
      changePercent: meta.regularMarketPrice && meta.previousClose 
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 
        : 0,
    };
  } catch (err) {
    console.error("Yahoo Finance Error:", err);
    return null;
  }
}
