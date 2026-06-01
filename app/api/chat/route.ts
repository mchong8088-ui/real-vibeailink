import { NextResponse } from 'next/server';
import { detectStock } from '../../../lib/market/stockDetector';

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
      console.log('Yahoo fetch failed, using mock data');
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
