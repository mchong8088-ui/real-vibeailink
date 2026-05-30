import { NextResponse } from 'next/server';
import { detectStock } from '../../../lib/market/stockDetector';
import { getMarketData } from '../../../lib/market/marketData';
import { calculateIndicators } from '../../../lib/market/indicators';
import { getFundamentals } from '../../../lib/market/fundamentals';
import { getNews } from '../../../lib/market/news';
import { getSentiment } from '../../../lib/market/sentiment';
import { buildPrompt } from '../../../lib/ai/promptBuilder';
import { callAI } from '../../../lib/ai/gateway';

// ============================================
// Main API Handler
// ============================================

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const { message, language = 'EN' } = await req.json();
    
    if (!message || message.trim() === '') {
      return NextResponse.json({
        success: false,
        text: 'Please enter a stock symbol or question (e.g., "0700.HK", "Should I buy TSLA?", "台積電")'
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] User query: "${message}"`);
    console.log(`🌐 Language: ${language}`);

    // ============================================
    // Step 1: Detect Stock Symbol
    // ============================================
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        text: 'Unable to detect stock symbol. Try: 0700.HK, TSLA, 2330.TW, or company names like 騰訊, 台積電, Tesla'
      });
    }
    console.log(`📊 Detected symbol: ${symbol}`);

    // ============================================
    // Step 2: Fetch Market Data (Price, Volume, Historical)
    // ============================================
    const marketData = await getMarketData(symbol);
    if (!marketData || !marketData.price) {
      return NextResponse.json({
        success: false,
        text: `Live market data unavailable for ${symbol}. Possible reasons:\n- The symbol may be invalid\n- Market may be closed\n- Please try another symbol like TSLA, 0700.HK, or 2330.TW`
      });
    }
    console.log(`💰 Price: $${marketData.price}, Change: ${marketData.changePercent?.toFixed(2)}%`);

    // ============================================
    // Step 3: Calculate Technical Indicators (RSI, MACD, SMA)
    // ============================================
    const closes = marketData.historical?.map((h: any) => h.close).filter((c: number) => c > 0) || [];
    const indicators = calculateIndicators(closes);
    console.log(`📈 RSI: ${indicators.rsi.value}, MACD: ${indicators.macd.status}, Trend: ${indicators.trend}`);

    // ============================================
    // Step 4: Fetch Fundamental Data (Market Cap, P/E, Growth)
    // ============================================
    const fundamentals = await getFundamentals(symbol);
    if (fundamentals) {
      console.log(`💼 Market Cap: ${fundamentals.marketCap}, P/E: ${fundamentals.peRatio}`);
    }

    // ============================================
    // Step 5: Fetch News & Analyze Sentiment
    // ============================================
    const news = await getNews(symbol);
    const sentiment = getSentiment(news);
    console.log(`📰 News: ${news.length} articles, Sentiment: ${sentiment.sentiment} (${sentiment.score})`);

    // ============================================
    // Step 6: Build AI Prompt
    // ============================================
    const promptData = {
      symbol,
      price: marketData.price,
      change: marketData.change || 0,
      changePercent: marketData.changePercent || 0,
      volume: marketData.volume || 0,
      technical: {
        rsi: indicators.rsi.value,
        rsiStatus: indicators.rsi.status,
        macd: {
          value: indicators.macd.value,
          signal: indicators.macd.signal,
          histogram: indicators.macd.histogram,
          status: indicators.macd.status,
        },
        sma: {
          short: indicators.sma.sma20,
          long: indicators.sma.sma50,
        },
        trend: indicators.trend,
      },
      fundamentals: {
        marketCap: fundamentals?.marketCap || 'N/A',
        peRatio: fundamentals?.peRatio || null,
        revenueGrowth: fundamentals?.revenueGrowth || null,
        profitMargin: fundamentals?.profitMargin || null,
        debtRatio: fundamentals?.debtRatio || null,
      },
      news: news.slice(0, 5).map(n => ({
        title: n.title,
        source: n.source,
        date: n.date,
        sentiment: n.sentiment,
      })),
      sentiment: {
        score: sentiment.score,
        overall: sentiment.sentiment,
      },
      userQuestion: message,
      language: language as 'EN' | 'ZH' | 'HK',
    };
    
    const prompt = buildPrompt(promptData);
    console.log(`📝 Prompt built (${prompt.length} chars)`);

    // ============================================
    // Step 7: Call AI Gateway (Gemini → OpenAI → DeepSeek → Mock)
    // ============================================
    const aiAnalysis = await callAI(prompt);
    console.log(`🤖 AI response received (${aiAnalysis.length} chars)`);

    // ============================================
    // Step 8: Return Response
    // ============================================
    const duration = Date.now() - startTime;
    console.log(`✅ Complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      symbol,
      price: marketData.price,
      change: marketData.change,
      changePercent: marketData.changePercent,
      volume: marketData.volume,
      high: marketData.high,
      low: marketData.low,
      previousClose: marketData.previousClose,
      rsi: indicators.rsi.value,
      rsiStatus: indicators.rsi.status,
      macd: indicators.macd.status,
      sma20: indicators.sma.sma20,
      sma50: indicators.sma.sma50,
      trend: indicators.trend,
      marketCap: fundamentals?.marketCap,
      peRatio: fundamentals?.peRatio,
      revenueGrowth: fundamentals?.revenueGrowth,
      profitMargin: fundamentals?.profitMargin,
      newsCount: news.length,
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.score,
      summary: aiAnalysis,
      text: aiAnalysis,
      processingTime: `${duration}ms`,
    });

  } catch (error) {
    console.error('❌ Route Error:', error);
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      text: 'System temporarily unavailable. Please try again in a moment.',
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${duration}ms`,
    });
  }
}

// ============================================
// Health Check Endpoint
// ============================================

export async function GET() {
  const { getAvailableProviders } = await import('../../../lib/ai/gateway');
  const providers = getAvailableProviders();
  
  return NextResponse.json({
    status: 'online',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      analyze: 'POST /api/chat - Send stock symbol or question',
      health: 'GET /api/chat - This status page',
    },
    providers: {
      gemini: providers.gemini,
      openai: providers.openai,
      deepseek: providers.deepseek,
    },
    examples: {
      symbol: 'TSLA, 0700.HK, 2330.TW',
      question: '"Should I buy Tesla?"',
      chinese: '"台積電點睇？"',
    },
  });
}