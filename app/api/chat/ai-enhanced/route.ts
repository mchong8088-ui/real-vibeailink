// /app/api/chat/ai-enhanced/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { detectStock, STOCK_ALIASES } from '@/app/lib/market/stockDetector';
import { callAI } from '@/app/lib/ai/gateway';
import { buildAnalysisPrompt } from '@/app/lib/ai/promptBuilder';
import { createServerClient } from '@supabase/ssr';

// Helper functions (same as main route but simplified)
function getChineseNameFromSymbol(symbol: string): string | null {
  for (const [name, sym] of Object.entries(STOCK_ALIASES)) {
    if (sym === symbol && !name.match(/^[A-Z]+$/)) {
      return name;
    }
  }
  return null;
}

async function fetchCompanyInfo(symbol: string): Promise<{ name: string; chineseName: string }> {
  const chineseNameFromAlias = getChineseNameFromSymbol(symbol);
  
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) yahooSymbol = symbol.replace('.TW', '');
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      const longName = data.chart?.result?.[0]?.meta?.longName;
      if (longName) {
        return { 
          name: longName, 
          chineseName: chineseNameFromAlias || longName
        };
      }
    }
  } catch (err) {
    console.log('Error fetching company info:', err);
  }
  
  return { 
    name: symbol, 
    chineseName: chineseNameFromAlias || symbol 
  };
}

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

function calculateMACD(prices: number[]): string {
  if (prices.length < 26) return 'Neutral';
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  const signal = prices.slice(-9).reduce((a, b) => a + b, 0) / 9;
  if (macd > signal) return 'Bullish';
  if (macd < signal) return 'Bearish';
  return 'Neutral';
}

function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Uptrend';
  if (currentPrice < sma20 * 0.98) return 'Downtrend';
  return 'Sideways';
}

async function fetchRealStockData(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`;
    console.log(`📊 Fetching: ${url}`);
    
    const res = await fetch(url, { 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    
    if (validCloses.length === 0) return null;
    
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || validCloses[validCloses.length - 2] || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    const dayLow = meta.regularMarketDayLow || null;
    const dayHigh = meta.regularMarketDayHigh || null;
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    return { 
      price, 
      changePercent,
      dayLow,
      dayHigh,
      rsi, 
      macd, 
      trend, 
      currency,
      sma20: null,
      sma50: null
    };
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err);
    return null;
  }
}

async function extractUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await res.text();
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.trim();
    return text.substring(0, 3000);
  } catch (err) {
    console.error('Error extracting URL:', err);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    // AUTH TEMPORARILY DISABLED FOR TESTING
    /*
    // Authentication check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        summary: 'Please login to use this feature. Create a free account at vibeailink.com',
        text: 'Please login to use this feature. Create a free account at vibeailink.com'
      }, { status: 401 });
    }

    // Check user's credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, subscription_plan')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        summary: 'User profile not found. Please contact support.',
        text: 'User profile not found. Please contact support.'
      }, { status: 403 });
    }

    if (profile.credits <= 0) {
      return NextResponse.json({
        success: false,
        summary: 'You have used all your credits. Please upgrade your plan to continue.',
        text: 'You have used all your credits. Please upgrade your plan to continue.'
      }, { status: 403 });
    }

    // Deduct 1 credit for this analysis
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', session.user.id);
    */

    const { message, language = 'English', userContent = null, useAI = true } = await req.json();
    console.log(`📝 AI-Enhanced Query: ${message}, Language: ${language}`);
    
    const symbol = detectStock(message);
    
    if (!symbol || symbol === '') {
      let errorMsg = '';
      if (language === 'Traditional Chinese') {
        errorMsg = '無法識別股票代號。請嘗試: 台積電, 騰訊, 特斯拉, 或直接輸入代號如 2330.TW, 0700.HK, TSLA';
      } else if (language === 'Simplified Chinese') {
        errorMsg = '无法识别股票代码。请尝试: 台积电, 腾讯, 特斯拉, 或直接输入代码如 2330.TW, 0700.HK, TSLA';
      } else {
        errorMsg = 'Unable to recognize stock symbol. Please try: 2330.TW, 0700.HK, TSLA';
      }
      return NextResponse.json({
        success: false,
        summary: errorMsg,
        text: errorMsg
      });
    }
    
    console.log(`📊 Detected symbol: ${symbol}`);
    
    // Fetch stock data
    const [stockData, companyInfo] = await Promise.all([
      fetchRealStockData(symbol),
      fetchCompanyInfo(symbol)
    ]);
    
    if (!stockData) {
      let errorMsg = '';
      if (language === 'Traditional Chinese') {
        errorMsg = `無法獲取 ${symbol} 的即時數據，請稍後再試。`;
      } else if (language === 'Simplified Chinese') {
        errorMsg = `无法获取 ${symbol} 的实时数据，请稍后再试。`;
      } else {
        errorMsg = `Unable to fetch real-time data for ${symbol}. Please try again.`;
      }
      return NextResponse.json({
        success: false,
        summary: errorMsg,
        text: errorMsg
      });
    }
    
    // Extract URL content if provided
    let extractedContent = null;
    if (userContent && userContent.startsWith('http')) {
      extractedContent = await extractUrlContent(userContent);
    } else if (userContent) {
      extractedContent = userContent;
    }
    
    const displayName = companyInfo.chineseName || companyInfo.name;
    const isPositive = stockData.changePercent >= 0;
    const changePercentText = stockData.changePercent ? `${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%` : 'N/A';
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    const macdStatus = stockData.macd === 'Bullish' ? (language === 'Traditional Chinese' ? '看好' : language === 'Simplified Chinese' ? '看好' : 'Bullish') : 
                       stockData.macd === 'Bearish' ? (language === 'Traditional Chinese' ? '看淡' : language === 'Simplified Chinese' ? '看淡' : 'Bearish') : 'Neutral';
    
    // Build prompt for AI
    const prompt = buildAnalysisPrompt(
      symbol,
      displayName,
      stockData.price,
      stockData.changePercent,
      stockData.rsi,
      macdStatus,
      stockData.sma20 || null,
      stockData.sma50 || null,
      extractedContent,
      null,
      language
    );
    
    // Call AI
    let aiAnalysis;
    try {
      aiAnalysis = await callAI(
        prompt,
        symbol,
        displayName,
        stockData.price,
        stockData.changePercent,
        stockData.rsi,
        !!extractedContent
      );
      console.log('✅ AI analysis generated successfully');
    } catch (err) {
      console.error('AI analysis failed:', err);
      aiAnalysis = `Unable to generate AI analysis at this time. Please try again later.`;
    }
    
    // Log credit transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: session.user.id,
        amount: -1,
        type: 'analysis',
        description: `AI-enhanced analysis for ${symbol}`,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: displayName,
      price: stockData.price,
      changePercent: stockData.changePercent,
      dayLow: stockData.dayLow,
      dayHigh: stockData.dayHigh,
      rsi: stockData.rsi,
      macd: stockData.macd,
      trend: stockData.trend,
      summary: aiAnalysis,
      text: aiAnalysis,
      currency: stockData.currency,
      aiEnhanced: true
    });
    
  } catch (error) {
    console.error('API Error:', error);
    const errorMsg = 'Service temporarily unavailable. Please try again later.';
    return NextResponse.json({
      success: false,
      summary: errorMsg,
      text: errorMsg
    });
  }
}