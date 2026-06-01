import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, language = 'EN' } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    
    // Simple response for now
    const symbol = message.trim().toUpperCase();
    
    const analysis = `
## 📊 ${symbol} Analysis

### Summary
Analysis for ${symbol} is being processed.

### Technical Indicators
- RSI: Calculating...
- MACD: Calculating...
- Trend: Analyzing...

### Recommendation
Please check back shortly for complete analysis.

---
*This is a preliminary analysis. Full technical and fundamental analysis will appear here.*
`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      price: "N/A",
      change: 0,
      changePercent: 0,
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
      symbol: "ERROR",
      summary: "Service temporarily unavailable. Please try again."
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "API is running", timestamp: new Date().toISOString() });
}
