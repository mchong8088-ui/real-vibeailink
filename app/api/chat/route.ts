import { NextResponse } from 'next/server';
import { detectMarket, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language, url, attachments } = body;
    
    // Determine what we're analyzing
    let stockSymbol = '';
    let userQuery = message || '';
    
    // If it's a natural language question, extract the stock symbol
    if (userQuery && isQuestion(userQuery)) {
      const extractedSymbol = extractStockFromQuestion(userQuery);
      if (extractedSymbol) {
        stockSymbol = extractedSymbol;
        console.log(`📝 Question detected. Extracted symbol: ${stockSymbol}`);
      } else {
        // If no symbol found, treat as general query
        stockSymbol = '';
      }
    } else if (userQuery) {
      // Direct stock symbol input
      const detection = detectMarket(userQuery);
      stockSymbol = detection.symbol;
    }
    
    console.log(`🔍 Analyzing: ${userQuery}`);
    console.log(`📊 Stock symbol: ${stockSymbol}`);
    console.log(`🌐 Language: ${language}`);
    
    // Here you would call your AI service (DeepSeek, OpenAI, etc.)
    // For now, return a mock response
    const response = {
      success: true,
      symbol: stockSymbol || userQuery.toUpperCase(),
      price: stockSymbol ? "$426.01" : "N/A",
      rsi: "61.5",
      macd: "Bullish",
      marketCap: "$850B",
      peRatio: "65.2",
      volume: "46,104,710",
      historical: [],
      summary: `Analysis for ${stockSymbol || userQuery} completed. ${userQuery.includes('Should I buy') ? 'Based on current market conditions...' : ''}`,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
