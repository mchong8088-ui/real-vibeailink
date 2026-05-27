import { NextResponse } from 'next/server';
import { detectMarket, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language, url, attachments } = body;
    
    let stockSymbol = '';
    let userQuery = message || '';
    
    // Extract stock symbol (generic - works for any symbol user enters)
    if (userQuery && isQuestion(userQuery)) {
      const extractedSymbol = extractStockFromQuestion(userQuery);
      if (extractedSymbol) {
        stockSymbol = extractedSymbol;
      }
    } else if (userQuery) {
      // Direct stock symbol input - works for ANY format: 0001.HK, TSLA, 2330.TW
      const detection = detectMarket(userQuery);
      stockSymbol = detection.symbol;
    }
    
    console.log(`🔍 Analyzing: ${userQuery}`);
    console.log(`📊 Stock symbol: ${stockSymbol}`);
    console.log(`🌐 Language: ${language}`);
    
    // If no stock symbol found, guide the user
    if (!stockSymbol && userQuery) {
      return NextResponse.json({
        success: true,
        symbol: "N/A",
        summary: `## Please enter a stock symbol

I couldn't identify a stock symbol in your request.

**Please try:**
- Direct stock symbol: TSLA, 0700.HK, 2330.TW, 0001.HK
- Company name: 特斯拉, 台積電, Tencent

**Example:** "Should I buy TSLA?" or "分析 0700.HK"`
      });
    }
    
    // Here you would call your AI service (DeepSeek, OpenAI, etc.)
    // For now, return a response
    const response = {
      success: true,
      symbol: stockSymbol || userQuery.toUpperCase(),
      price: stockSymbol ? "$N/A" : "N/A",
      rsi: "N/A",
      macd: "N/A",
      marketCap: "N/A",
      peRatio: "N/A",
      volume: "N/A",
      historical: [],
      summary: `## Analysis for ${stockSymbol || userQuery}

Analysis is being processed. Our AI system will provide detailed insights based on the stock symbol you entered.

**Note:** For complete analysis including technical indicators, fundamentals, and investment recommendations, please ensure you've entered a valid stock symbol.

*Analysis powered by AI - for reference only.*`,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', summary: 'Analysis temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
