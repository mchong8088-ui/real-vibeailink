// Yahoo Finance API - Free, works for HK and TW stocks
export async function fetchYahooPrice(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) {
      yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    } else if (symbol.endsWith('.TW')) {
      yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    }
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    const timestamps = result.timestamp || [];
    
    // Build historical data
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote?.close?.[i]) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
        });
      }
    }
    
    return {
      symbol,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      volume: meta.regularMarketVolume,
      historical: historical.reverse(),
    };
  } catch (err) {
    console.error("Yahoo fetch error:", err);
    return null;
  }
}
