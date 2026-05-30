async function fetchYahooFinance(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    const timestamps = result.timestamp || [];
    
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote?.close?.[i]) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
          high: quote.high?.[i] || 0,
          low: quote.low?.[i] || 0,
        });
      }
    }
    
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol,
      price: price,
      previousClose: previousClose,
      change: change,
      changePercent: changePercent,
      volume: meta.regularMarketVolume,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      historical: historical.reverse(),
    };
  } catch (err) {
    console.error('Yahoo fetch error:', err);
    return null;
  }
}

export async function getMarketData(symbol: string) {
  console.log(`📊 Fetching market data for ${symbol}`);
  const data = await fetchYahooFinance(symbol);
  if (data) {
    console.log(`✅ Market data fetched for ${symbol}: $${data.price}`);
    return data;
  }
  console.log(`❌ No market data for ${symbol}`);
  return null;
}
