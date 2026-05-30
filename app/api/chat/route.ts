import { NextResponse } from 'next/server';
import { detectStock, isQuestion } from '@/app/lib/market/stockDetector';
import { getMarketData } from '@/app/lib/market/marketData';
import { calculateIndicators } from '@/app/lib/market/indicators';
import { buildPrompt } from '@/app/lib/ai/promptBuilder';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function callAI(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("AI Error:", err);
    return "Analysis temporarily unavailable.";
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    console.log(`📝 User query: "${message}"`);
    
    // Step 1: Detect stock symbol
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        text: "Unable to detect stock symbol. Please try a valid symbol like 0700.HK, TSLA, or 台積電."
      });
    }
    
    console.log(`📊 Detected symbol: ${symbol}`);
    
    // Step 2: Fetch market data
    const marketData = await getMarketData(symbol);
    if (!marketData) {
      return NextResponse.json({
        success: false,
        text: `Live market data unavailable for ${symbol}. Please try another symbol.`
      });
    }
    
    // Step 3: Calculate technical indicators
    const closes = marketData.historical?.map((h: any) => h.close) || [];
    const technical = calculateIndicators(closes);
    
    // Step 4: Build AI prompt
    const prompt = buildPrompt(symbol, marketData, technical, message);
    
    // Step 5: Call AI
    const aiAnalysis = await callAI(prompt);
    
    // Step 6: Return response
    return NextResponse.json({
      success: true,
      symbol: symbol,
      price: marketData.price,
      change: marketData.change,
      changePercent: marketData.changePercent,
      volume: marketData.volume,
      rsi: technical.rsi,
      macd: technical.macd.status,
      sma20: technical.sma.short,
      sma50: technical.sma.long,
      trend: technical.trend,
      summary: aiAnalysis,
      text: aiAnalysis,
    });
    
  } catch (err) {
    console.error("Route Error:", err);
    return NextResponse.json({
      success: false,
      text: "System temporarily unavailable. Please try again."
    });
  }
}
