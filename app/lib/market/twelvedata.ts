// app/lib/market/twelvedata.ts
export interface TwelveDataQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export async function getTwelveDataQuote(symbol: string): Promise<TwelveDataQuote | null> {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
      console.warn("TWELVE_DATA_API_KEY not set");
      return null;
    }
    
    // Format symbol for Twelve Data
    let formattedSymbol = symbol;
    // Handle Hong Kong stocks - they need .HK suffix
    if (symbol === '0700.HK' || symbol === '0700') {
      formattedSymbol = '0700.HK';
    } else if (symbol === '9988.HK') {
      formattedSymbol = '9988.HK';
    } else if (symbol === '1299.HK') {
      formattedSymbol = '1299.HK';
    } else if (symbol === '0005.HK') {
      formattedSymbol = '0005.HK';
    }
    
    console.log(`Fetching quote for: ${formattedSymbol}`);
    
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${formattedSymbol}&apikey=${apiKey}`
    );
    
    const data = await response.json();
    console.log("Twelve Data raw response:", data);
    
    // Check for successful response
    if (data && data.close) {
      return {
        symbol: data.symbol,
        price: parseFloat(data.close),
        change: parseFloat(data.change || 0),
        changePercent: parseFloat(data.percent_change || 0),
        volume: parseInt(data.volume || 0),
        high: parseFloat(data.high || data.close),
        low: parseFloat(data.low || data.close),
        open: parseFloat(data.open || data.close),
        previousClose: parseFloat(data.previous_close || data.close),
      };
    }
    
    if (data.code && data.message) {
      console.error(`Twelve Data API error: ${data.code} - ${data.message}`);
    }
    
    return null;
  } catch (error) {
    console.error("Twelve Data quote error:", error);
    return null;
  }
}

export async function getTwelveDataHistorical(symbol: string, days: number = 120) {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) return null;
    
    // Format symbol for Twelve Data
    let formattedSymbol = symbol;
    if (symbol === '0700.HK' || symbol === '0700') {
      formattedSymbol = '0700.HK';
    }
    
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=1day&outputsize=${days}&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.values && Array.isArray(data.values)) {
      return data.values.map((v: any) => ({
        date: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume),
      }));
    }
    return null;
  } catch (error) {
    console.error("Twelve Data historical error:", error);
    return null;
  }
}