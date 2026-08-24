// /app/api/watchlist/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No symbols provided'
      }, { status: 400 });
    }

    console.log('📊 Fetching stock data for:', symbols);

    // Fetch real data from Yahoo Finance API
    const stockData = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          // Use Yahoo Finance API (free, no API key required)
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${symbol}`);
          }
          
          const data = await response.json();
          const result = data.chart.result[0];
          const quote = result?.meta;
          const indicators = result?.indicators?.quote[0];
          const prices = indicators?.close || [];
          const lastPrice = prices[prices.length - 1] || 0;
          const previousPrice = prices[prices.length - 2] || lastPrice;
          
          // Calculate RSI (simplified)
          const rsi = calculateRSI(prices);
          
          // Determine MACD trend (simplified)
          const macd = determineMACD(prices);
          
          // Determine trend
          const trend = determineTrend(prices);
          
          return {
            symbol: symbol,
            price: lastPrice,
            changePercent: previousPrice ? ((lastPrice - previousPrice) / previousPrice) * 100 : 0,
            rsi: rsi,
            macd: macd,
            trend: trend,
            currency: quote?.currency || '$',
            companyName: quote?.longName || quote?.shortName || symbol,
            dayHigh: quote?.regularMarketDayHigh || 0,
            dayLow: quote?.regularMarketDayLow || 0,
            volume: quote?.regularMarketVolume || 0,
          };
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          // Return mock data for this symbol
          return getMockData(symbol);
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: stockData
    });

  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock data'
    }, { status: 500 });
  }
}

// Helper: Calculate RSI
function calculateRSI(prices: number[]): number | null {
  if (!prices || prices.length < 15) return null;
  
  const period = 14;
  let gain = 0;
  let loss = 0;
  
  for (let i = prices.length - period; i < prices.length - 1; i++) {
    const diff = prices[i + 1] - prices[i];
    if (diff >= 0) {
      gain += diff;
    } else {
      loss -= diff;
    }
  }
  
  const avgGain = gain / period;
  const avgLoss = loss / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Helper: Determine MACD trend
function determineMACD(prices: number[]): string {
  if (!prices || prices.length < 26) return 'Neutral';
  
  // Simple EMA calculation
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (!ema12 || !ema26) return 'Neutral';
  
  const macd = ema12 - ema26;
  if (macd > 0) return 'Bullish';
  if (macd < 0) return 'Bearish';
  return 'Neutral';
}

// Helper: Calculate EMA
function calculateEMA(prices: number[], period: number): number | null {
  if (!prices || prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices[prices.length - period];
  
  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Helper: Determine trend
function determineTrend(prices: number[]): string {
  if (!prices || prices.length < 20) return 'Sideways';
  
  const recent = prices.slice(-10);
  const older = prices.slice(-20, -10);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (diff > 3) return 'Uptrend';
  if (diff < -3) return 'Downtrend';
  return 'Sideways';
}

// Helper: Get mock data as fallback
function getMockData(symbol: string) {
  const mockData: Record<string, any> = {
    'TSLA': { price: 313.03, changePercent: -1.47, rsi: 27.3, macd: 'Bearish', trend: 'Downtrend', currency: '$', companyName: 'Tesla, Inc.' },
    'NBIS': { price: 169.69, changePercent: -9.68, rsi: 35.1, macd: 'Bearish', trend: 'Downtrend', currency: '$', companyName: 'Nebius Group' },
    'SPCX': { price: 12.45, changePercent: 3.21, rsi: 62.5, macd: 'Bullish', trend: 'Uptrend', currency: '$', companyName: 'SPAC X' },
    'AAPL': { price: 175.34, changePercent: 0.85, rsi: 48.2, macd: 'Neutral', trend: 'Sideways', currency: '$', companyName: 'Apple Inc.' },
    'NVDA': { price: 125.61, changePercent: 2.34, rsi: 52.1, macd: 'Bullish', trend: 'Uptrend', currency: '$', companyName: 'NVIDIA Corporation' },
    'MSFT': { price: 425.52, changePercent: 0.12, rsi: 46.8, macd: 'Neutral', trend: 'Sideways', currency: '$', companyName: 'Microsoft Corporation' },
    'GOOGL': { price: 172.88, changePercent: -0.56, rsi: 44.2, macd: 'Neutral', trend: 'Sideways', currency: '$', companyName: 'Alphabet Inc.' },
    'AMZN': { price: 187.45, changePercent: 1.23, rsi: 56.7, macd: 'Bullish', trend: 'Uptrend', currency: '$', companyName: 'Amazon.com, Inc.' },
  };
  
  if (mockData[symbol]) {
    return {
      symbol: symbol,
      ...mockData[symbol]
    };
  }
  
  return {
    symbol: symbol,
    price: 0,
    changePercent: 0,
    rsi: null,
    macd: 'Neutral',
    trend: 'Sideways',
    currency: '$',
    companyName: symbol,
  };
}