// Market data fetching from multiple providers with proper fallback chain

async function fetchAlphaVantage(symbol: string, apiKey: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const series = data["Time Series (Daily)"];
    if (!series) return null;
    
    const historical = Object.keys(series).map((date) => ({
      date,
      close: parseFloat(series[date]["4. close"]),
      volume: parseFloat(series[date]["5. volume"]),
    }));
    
    return {
      symbol,
      price: historical[0]?.close,
      volume: historical[0]?.volume,
      historical: historical,
      source: 'Alpha Vantage',
    };
  } catch (err) {
    console.log(`Alpha Vantage failed for ${symbol}`);
    return null;
  }
}

async function fetchTwelveData(symbol: string, apiKey: string) {
  try {
    let formattedSymbol = symbol;
    if (symbol.endsWith('.HK')) formattedSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) formattedSymbol = symbol.replace('.TW', '');
    
    const url = `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=1day&outputsize=60&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.values) return null;
    
    const historical = data.values.map((v: any) => ({
      date: v.datetime,
      close: parseFloat(v.close),
      volume: parseFloat(v.volume || 0),
    }));
    
    return {
      symbol,
      price: historical[0]?.close,
      volume: historical[0]?.volume,
      historical: historical,
      source: 'Twelve Data',
    };
  } catch (err) {
    console.log(`Twelve Data failed for ${symbol}`);
    return null;
  }
}

async function fetchFinnhub(symbol: string, apiKey: string) {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (60 * 60 * 24 * 90);
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.c || data.s !== "ok") return null;
    
    const historical = data.c.map((close: number, i: number) => ({
      date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
      close: close,
      volume: data.v[i] || 0,
    }));
    
    return {
      symbol,
      price: historical[0]?.close,
      volume: historical[0]?.volume,
      historical: historical,
      source: 'Finnhub',
    };
  } catch (err) {
    console.log(`Finnhub failed for ${symbol}`);
    return null;
  }
}

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
        });
      }
    }
    
    return {
      symbol,
      price: meta.regularMarketPrice,
      volume: meta.regularMarketVolume,
      historical: historical.reverse(),
      source: 'Yahoo Finance',
    };
  } catch (err) {
    console.log(`Yahoo Finance failed for ${symbol}`);
    return null;
  }
}

// ============================================
// MAIN EXPORT - Proper fallback chain
// ============================================

export async function getMarketData(symbol: string) {
  console.log(`📊 Fetching market data for ${symbol}`);
  
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const twelveKey = process.env.TWELVE_DATA_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;
  
  // For HK/TW stocks, try Yahoo Finance first (best coverage)
  if (symbol.endsWith('.HK') || symbol.endsWith('.TW')) {
    try {
      const data = await fetchYahooFinance(symbol);
      if (data) {
        console.log(`✅ Yahoo Finance success for ${symbol}`);
        return data;
      }
    } catch (err) {
      console.log(`Yahoo Finance failed, trying next provider...`);
    }
  }
  
  // Fallback chain for all stocks
  try {
    const data = await fetchFinnhub(symbol, finnhubKey || '');
    if (data) {
      console.log(`✅ Finnhub success for ${symbol}`);
      return data;
    }
  } catch (err) {
    console.log(`Finnhub failed, trying next provider...`);
  }
  
  try {
    const data = await fetchTwelveData(symbol, twelveKey || '');
    if (data) {
      console.log(`✅ Twelve Data success for ${symbol}`);
      return data;
    }
  } catch (err) {
    console.log(`Twelve Data failed, trying next provider...`);
  }
  
  try {
    const data = await fetchAlphaVantage(symbol, apiKey || '');
    if (data) {
      console.log(`✅ Alpha Vantage success for ${symbol}`);
      return data;
    }
  } catch (err) {
    console.log(`Alpha Vantage failed`);
  }
  
  console.log(`❌ All data providers failed for ${symbol}`);
  return null;
}

// Legacy export for compatibility with existing route.ts
export async function fetchStockData(symbol: string) {
  return getMarketData(symbol);
}
