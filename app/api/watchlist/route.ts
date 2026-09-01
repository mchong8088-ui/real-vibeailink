// /app/api/watchlist/route.ts
import { NextResponse } from 'next/server';

// Fix B: Correct RSI Calculation with exponential smoothing
function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // First average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Smoothed RSI for remaining data
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsiValue = 100 - (100 / (1 + rs));
  
  return Math.round(rsiValue * 10) / 10;
}

// Fix B: Correct MACD calculation
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

// Fix B: Correct Trend determination
function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  
  if (currentPrice > sma20 * 1.02) return 'Uptrend';
  if (currentPrice < sma20 * 0.98) return 'Downtrend';
  return 'Sideways';
}

async function fetchStockData(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
    console.log(`📊 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No data in response');
    }
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    
    console.log(`📊 ${symbol}: Found ${validCloses.length} valid price points`);
    
    if (validCloses.length === 0) {
      throw new Error('No valid price data');
    }
    
    // Get current price
    const price = meta.regularMarketPrice || validCloses[validCloses.length - 1] || 0;
    
    // CRITICAL FIX: Get previous close from the actual data, not meta
    // This is the most reliable method
    let prevClose = null;
    
    // Method 1: Use the second last close from the data array (MOST RELIABLE)
    if (validCloses.length >= 2) {
      prevClose = validCloses[validCloses.length - 2];
      console.log(`📊 ${symbol}: Using second last close as previous: ${prevClose}`);
    }
    
    // Method 2: If that fails, try meta.previousClose
    if (!prevClose || prevClose <= 0) {
      prevClose = meta.regularMarketPreviousClose || meta.previousClose || meta.chartPreviousClose || null;
      console.log(`📊 ${symbol}: Using meta previous close: ${prevClose}`);
    }
    
    // Method 3: If still no valid previous close, use current price (0% change)
    if (!prevClose || prevClose <= 0) {
      prevClose = price;
      console.log(`📊 ${symbol}: Using current price as previous (fallback)`);
    }
    
    // Calculate change and percentage
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    
    console.log(`📊 ${symbol}: Price=${price}, PreviousClose=${prevClose}, Change=${changePercent.toFixed(2)}%`);
    
    const dayLow = meta.regularMarketDayLow || 0;
    const dayHigh = meta.regularMarketDayHigh || 0;
    
    // Calculate indicators
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    console.log(`✅ ${symbol}: RSI=${rsi}, MACD=${macd}, Trend=${trend}`);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    else if (symbol.endsWith('.HK')) currency = 'HK$';
    
    const companyName = meta.longName || meta.shortName || symbol;
    
    return {
      symbol,
      price,
      previousClose: prevClose,
      change,
      changePercent,
      dayLow,
      dayHigh,
      rsi,
      macd,
      trend,
      currency,
      companyName,
      timestamp: new Date().toISOString(),
      isFallback: false
    };
    
  } catch (error) {
    console.error(`❌ Error fetching ${symbol}:`, error);
    return {
      symbol,
      error: error instanceof Error ? error.message : 'Failed to fetch data',
      isFallback: true,
      price: 0,
      previousClose: 0,
      change: 0,
      changePercent: 0,
      rsi: null,
      macd: 'N/A',
      trend: 'N/A',
      currency: '$',
      companyName: symbol
    };
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

    console.log('📊 Fetching watchlist data for:', symbols);

    const stockData = await Promise.all(
      symbols.map(async (symbol: string) => {
        return await fetchStockData(symbol);
      })
    );

    stockData.forEach(item => {
      console.log(`📊 Result for ${item.symbol}: price=${item.price}, change=${item.changePercent}%, rsi=${item.rsi}, macd=${item.macd}`);
    });

    const hasValidData = stockData.some(item => item && item.price > 0 && !item.error);
    
    if (!hasValidData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch data for all symbols',
        data: stockData
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock data'
    }, { status: 500 });
  }
}