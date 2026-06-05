// app/api/social/auto-post/route.ts - Facebook Only Version
import { NextResponse } from 'next/server';

// Stock of the Day configurations
const STOCKS_TO_MONITOR = [
  { symbol: "0700.HK", name: "Tencent", market: "HK" },
  { symbol: "2330.TW", name: "TSMC", market: "TW" },
  { symbol: "TSLA", name: "Tesla", market: "US" },
  { symbol: "NVDA", name: "NVIDIA", market: "US" },
  { symbol: "AAPL", name: "Apple", market: "US" },
  { symbol: "9988.HK", name: "Alibaba", market: "HK" },
  { symbol: "1211.HK", name: "BYD", market: "HK" },
  { symbol: "3690.HK", name: "Meituan", market: "HK" },
  { symbol: "INTC", name: "Intel", market: "US" },
  { symbol: "AMD", name: "AMD", market: "US" },
  { symbol: "MSFT", name: "Microsoft", market: "US" },
  { symbol: "GOOGL", name: "Google", market: "US" },
];

// Generate Facebook post content
function generateFacebookPost(stockData: any, language: string = 'English'): string {
  const isPositive = stockData.changePercent > 0;
  const sentiment = isPositive ? '🚀' : '📉';
  const changeText = `${isPositive ? '+' : ''}${stockData.changePercent?.toFixed(2)}%`;
  const companyName = stockData.companyName || stockData.symbol;
  
  // Get recommendation emoji
  let recommendationEmoji = '📊';
  const recommendation = stockData.specificAnalysis?.specificRecommendation || '';
  if (recommendation.includes('BUY') || recommendation.includes('買入')) recommendationEmoji = '💚';
  else if (recommendation.includes('SELL') || recommendation.includes('賣出')) recommendationEmoji = '🔴';
  else if (recommendation.includes('HOLD') || recommendation.includes('持有')) recommendationEmoji = '🟡';
  
  const hashtags = '#StockAnalysis #Investing #vibeAiLink #MarketUpdate';
  const website = 'vibeailink.com';
  
  if (language === 'Cantonese') {
    return `${sentiment} 【${companyName} 股票分析】
💰 現價: ${stockData.currency}${stockData.price}
📊 漲跌幅: ${changeText}
🎯 RSI: ${stockData.rsi}
${recommendationEmoji} 建議: ${recommendation.substring(0, 100)}

🔗 詳細分析: ${website}
${hashtags}`;
  } else if (language === '简体中文') {
    return `${sentiment} 【${companyName} 股票分析】
💰 现价: ${stockData.currency}${stockData.price}
📊 涨跌幅: ${changeText}
🎯 RSI: ${stockData.rsi}
${recommendationEmoji} 建议: ${recommendation.substring(0, 100)}

🔗 详细分析: ${website}
${hashtags}`;
  } else {
    return `${sentiment} 【${companyName} Stock Analysis】
💰 Price: ${stockData.currency}${stockData.price}
📊 Change: ${changeText}
🎯 RSI: ${stockData.rsi}
${recommendationEmoji} Recommendation: ${recommendation.substring(0, 100)}

🔗 Full analysis: ${website}
${hashtags}`;
  }
}

// Fetch stock analysis
async function fetchStockAnalysis(symbol: string, language: string = 'English') {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: symbol, language }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch analysis for ${symbol}:`, error);
    return null;
  }
}

// Post to Facebook Page
async function postToFacebook(content: string) {
  const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  
  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    console.log('❌ Facebook API keys not configured');
    return { success: false, error: 'Missing Facebook credentials' };
  }
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Posted to Facebook successfully!');
      return { success: true, data };
    } else {
      console.error('❌ Facebook API error:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Facebook post failed:', error);
    return { success: false, error: String(error) };
  }
}

// Save to log file (simple logging)
async function saveToLog(postData: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...postData,
  };
  console.log('📝 Post log:', logEntry);
  // In production, you could save to a database
  return true;
}

// Get today's stock (rotates daily)
function getTodaysStock() {
  const today = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % STOCKS_TO_MONITOR.length;
  return STOCKS_TO_MONITOR[index];
}

export async function POST(req: Request) {
  try {
    const { language = 'English', testMode = false, customSymbol = null } = await req.json();
    
    // Determine which stock to analyze
    let stockToAnalyze;
    if (customSymbol) {
      stockToAnalyze = { symbol: customSymbol, name: customSymbol, market: 'Custom' };
    } else if (testMode) {
      // For testing, use first stock
      stockToAnalyze = STOCKS_TO_MONITOR[0];
    } else {
      stockToAnalyze = getTodaysStock();
    }
    
    console.log(`📊 Analyzing ${stockToAnalyze.symbol} for Facebook post...`);
    
    // Fetch analysis
    const analysis = await fetchStockAnalysis(stockToAnalyze.symbol, language);
    
    if (!analysis || !analysis.success) {
      console.log(`❌ Failed to get analysis for ${stockToAnalyze.symbol}`);
      return NextResponse.json({
        success: false,
        error: `Failed to analyze ${stockToAnalyze.symbol}`,
      }, { status: 500 });
    }
    
    // Generate post content
    const postContent = generateFacebookPost(analysis, language);
    
    console.log('📝 Generated post content:', postContent.substring(0, 200) + '...');
    
    // Post to Facebook
    const result = await postToFacebook(postContent);
    
    // Save to log
    await saveToLog({
      symbol: stockToAnalyze.symbol,
      name: stockToAnalyze.name,
      date: new Date().toISOString(),
      success: result.success,
      contentLength: postContent.length,
    });
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Successfully posted to Facebook!' : 'Failed to post to Facebook',
      stock: stockToAnalyze.symbol,
      postContent: postContent.substring(0, 200) + '...',
      facebookResponse: result.data || null,
      error: result.error || null,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Auto-post error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Facebook Auto-Post API ready",
    instructions: {
      test: "POST with { testMode: true } to test with first stock",
      custom: "POST with { customSymbol: 'AAPL' } to analyze specific stock",
      auto: "POST with {} for daily stock rotation",
    },
    features: {
      stocks_monitored: STOCKS_TO_MONITOR.length,
      languages: ["English", "Cantonese", "简体中文"],
      daily_rotation: true,
    },
  });
}