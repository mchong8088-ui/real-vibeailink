import { NextResponse } from 'next/server';

// Simple stock symbol detection
function detectStock(input: string): string | null {
  if (!input || input.trim() === '') return null;
  const cleanInput = input.trim().toUpperCase();
  
  // Direct symbol with suffix
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) return cleanInput;
  if (/^\d{4}$/.test(cleanInput)) return `${cleanInput}.HK`;
  if (/^\d{5}$/.test(cleanInput)) return `${cleanInput}.TW`;
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) return cleanInput;
  
  // Chinese name mappings
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

export async function POST(req: Request) {
  try {
    const { message, language = 'EN' } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    
    // Detect stock symbol
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `Unable to detect stock symbol. Try: TSLA, 0700.HK, or 台積電`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    // Try to fetch real data from Yahoo Finance
    let price = null;
    let changePercent = null;
    
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
      }
    } catch (err) {
      console.log('Yahoo fetch failed');
    }
    
    // Build analysis response
    const priceDisplay = price ? `$${price.toFixed(2)}` : 'N/A';
    const changeDisplay = changePercent ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` : 'N/A';
    
    const analysis = `
## 📊 ${symbol} Analysis

### 📈 Price Information
- **Current Price**: ${priceDisplay}
- **Change**: ${changeDisplay}
- **Time**: ${new Date().toLocaleString()}

### 🔬 Technical Indicators
- **RSI**: Calculating...
- **MACD**: Calculating...
- **Trend**: Analyzing...

### 📰 Market Summary
${symbol} is currently being analyzed. Market data shows ${changeDisplay !== 'N/A' ? `a ${changePercent > 0 ? 'positive' : 'negative'} movement of ${changeDisplay}` : 'stable trading conditions'}.

### 🎯 Recommendation
Based on current market conditions, please check back for a complete technical and fundamental analysis.

---
*Data source: Yahoo Finance | Analysis for informational purposes only.*
`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      price: price || "N/A",
      change: changePercent || 0,
      changePercent: changePercent || 0,
      volume: 0,
      rsi: null,
      macd: "N/A",
      sma20: null,
      sma50: null,
      trend: "N/A",
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

export async function GET() {
  return NextResponse.json({ status: "API is running", timestamp: new Date().toISOString() });
}
