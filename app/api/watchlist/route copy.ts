// /app/api/watchlist/route.ts
import { NextResponse } from 'next/server';

// Reuse the existing functions from chat/route.ts
// We need to import them or duplicate them here

// Calculate RSI (14)
function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - (prices[i-1] || prices[i]);
    if (change >= 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate MACD
function calculateMACD(prices: number[]): string {
  if (prices.length < 26) return 'Neutral';
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  const signal = prices.slice(-9).reduce((a, b) => a + b, 0) / 9;
  if (macd > signal) return 'Bullish';
  if (macd < signal) return 'Bearish';
  return 'Neutral';
}

// Determine trend
function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Uptrend';
  if (currentPrice < sma20 * 0.98) return 'Downtrend';
  return 'Sideways';
}

// Fetch real stock data (lightweight version for watchlist)
async function fetchWatchlistStockData(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
    console.log(`📊 Watchlist fetching: ${url}`);
    
    const res = await fetch(url, { 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) {
      console.log(`❌ HTTP ${res.status} for ${symbol}`);
      return null;
    }
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      console.log(`❌ No result for ${symbol}`);
      return null;
    }
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    
    if (validCloses.length === 0) {
      console.log(`❌ No valid closes for ${symbol}`);
      return null;
    }
    
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || validCloses[validCloses.length - 2] || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    // Get company name
    let companyName = symbol;
    try {
      const companyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const companyRes = await fetch(companyUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        const metaData = companyData.chart?.result?.[0]?.meta;
        if (metaData) {
          companyName = metaData.longName || metaData.shortName || symbol;
        }
      }
    } catch (e) {
      // Ignore, use symbol as fallback
    }
    
    console.log(`✅ Watchlist ${symbol}: ${currency}${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    
    return { 
      price, 
      changePercent,
      rsi, 
      macd, 
      trend, 
      currency,
      companyName,
      dayLow: meta.regularMarketDayLow || null,
      dayHigh: meta.regularMarketDayHigh || null,
      volume: meta.regularMarketVolume || 0
    };
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No symbols provided'
      }, { status: 400 });
    }
    
    console.log(`📊 Watchlist API: Fetching ${symbols.length} symbols`);
    
    // Fetch all stocks in parallel
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await fetchWatchlistStockData(symbol);
        if (data) {
          return {
            symbol: symbol,
            ...data
          };
        }
        return null;
      })
    );
    
    // Filter out null results
    const validResults = results.filter(r => r !== null);
    
    return NextResponse.json({
      success: true,
      data: validResults,
      total: validResults.length
    });
    
  } catch (error) {
    console.error('❌ Watchlist API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch watchlist data'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Watchlist API running", 
    timestamp: new Date().toISOString()
  });
}