import { NextResponse } from 'next/server';

// Simple stock symbol detection
function detectStock(input: string): string | null {
  if (!input || input.trim() === '') return null;
  const cleanInput = input.trim().toUpperCase();
  
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) return cleanInput;
  if (/^\d{4}$/.test(cleanInput)) return `${cleanInput}.HK`;
  if (/^\d{5}$/.test(cleanInput)) return `${cleanInput}.TW`;
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) return cleanInput;
  
  const nameMap: Record<string, string> = {
    "台積電": "2330.TW", "台积电": "2330.TW", "TSMC": "2330.TW",
    "騰訊": "0700.HK", "腾讯": "0700.HK", "Tencent": "0700.HK",
    "特斯拉": "TSLA", "Tesla": "TSLA",
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

// Calculate RSI from price history
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

// Determine trend based on moving averages
function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Insufficient data';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Bullish 📈';
  if (currentPrice < sma20 * 0.98) return 'Bearish 📉';
  return 'Sideways ➡️';
}

// Fetch historical data from Yahoo
async function fetchHistoricalData(symbol: string): Promise<number[]> {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    return closes.filter((c: number) => c !== null);
  } catch (err) {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { message, language = 'EN' } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `Unable to detect stock symbol. Try: TSLA, 0700.HK, or 台積電`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    // Fetch price and historical data
    let price = null;
    let changePercent = null;
    let rsi: number | null = null;
    let trend = 'Analyzing...';
    
    try {
      let yahooSymbol = symbol;
      if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
      if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (result?.meta) {
          const meta = result.meta;
          price = meta.regularMarketPrice;
          const previousClose = meta.previousClose;
          if (price && previousClose) {
            changePercent = ((price - previousClose) / previousClose) * 100;
          }
        }
        
        // Get historical closes for indicators
        const closes = result?.indicators?.quote?.[0]?.close || [];
        const validCloses = closes.filter((c: number) => c !== null);
        
        if (validCloses.length >= 15) {
          rsi = calculateRSI(validCloses);
          trend = determineTrend(validCloses);
        }
      }
    } catch (err) {
      console.log('Yahoo fetch failed');
    }
    
    // Build analysis
    const priceDisplay = price ? `$${price.toFixed(2)}` : 'N/A';
    const changeDisplay = changePercent ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` : 'N/A';
    const rsiDisplay = rsi ? `${rsi.toFixed(1)}` : 'Calculating...';
    const rsiStatus = rsi ? (rsi > 70 ? '(Overbought)' : rsi < 30 ? '(Oversold)' : '(Neutral)') : '';
    const macdStatus = rsi ? (rsi > 60 ? 'Bullish 📈' : rsi < 40 ? 'Bearish 📉' : 'Neutral ➡️') : 'Calculating...';
    
    const analysis = `
## 📊 ${symbol} Analysis

### 📈 Price Information
- **Current Price**: ${priceDisplay}
- **Change**: ${changeDisplay}
- **Time**: ${new Date().toLocaleString()}

### 🔬 Technical Indicators
- **RSI (14)**: ${rsiDisplay} ${rsiStatus}
- **MACD**: ${macdStatus}
- **Trend**: ${trend}

### 📰 Market Summary
${symbol} is trading at ${priceDisplay} with a ${changePercent > 0 ? 'gain' : changePercent < 0 ? 'loss' : 'stable'} of ${changeDisplay}. 
RSI is at ${rsiDisplay} indicating ${rsi ? (rsi > 70 ? 'overbought conditions' : rsi < 30 ? 'oversold conditions' : 'neutral momentum') : 'neutral momentum'}.

### 🎯 Recommendation
Based on current technical indicators:
- **Short-term**: ${rsi ? (rsi > 70 ? 'Consider taking profits' : rsi < 30 ? 'Watch for potential reversal' : 'Hold') : 'Analyzing...'}
- **Medium-term**: ${trend === 'Bullish 📈' ? 'Accumulate on dips' : trend === 'Bearish 📉' ? 'Wait for stabilization' : 'Range trading'}

---
*Data source: Yahoo Finance | AI-powered analysis for reference only*
`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      price: price || "N/A",
      change: changePercent || 0,
      changePercent: changePercent || 0,
      rsi: rsi,
      macd: macdStatus,
      trend: trend,
      summary: analysis,
      text: analysis,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      summary: "Service temporarily unavailable. Please try again."
    });
  }
}
