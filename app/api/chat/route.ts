// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { detectStock, isQuestion } from '@/app/lib/market/stockDetector';

// ============================================
// AI GATEWAY - Multiple provider fallback
// ============================================
const AI_PROVIDERS = [
  {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    enabled: !!process.env.OPENAI_API_KEY,
  },
  {
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    key: process.env.GEMINI_API_KEY,
    enabled: !!process.env.GEMINI_API_KEY,
  },
  {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/v1/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    enabled: !!process.env.DEEPSEEK_API_KEY,
  },
];

async function callAIFallback(messages: any[]): Promise<string> {
  const enabledProviders = AI_PROVIDERS.filter(p => p.enabled);
  
  if (enabledProviders.length === 0) {
    throw new Error('No AI providers configured');
  }
  
  for (const provider of enabledProviders) {
    try {
      console.log(`🤖 Trying ${provider.name}...`);
      
      let response;
      if (provider.name === 'Gemini') {
        response = await fetch(`${provider.url}?key=${provider.key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: messages[messages.length - 1].content }] }],
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`✅ ${provider.name} succeeded`);
            return text;
          }
        }
      } else {
        // OpenAI & DeepSeek (same API format)
        response = await fetch(provider.url!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.key}`,
          },
          body: JSON.stringify({
            model: provider.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            console.log(`✅ ${provider.name} succeeded`);
            return text;
          }
        }
      }
      
      console.log(`⚠️ ${provider.name} failed, trying next...`);
    } catch (error) {
      console.error(`❌ ${provider.name} error:`, error);
    }
  }
  
  throw new Error('All AI providers failed');
}

// ============================================
// COMPANY NAME LOOKUP
// ============================================
async function fetchCompanyName(symbol: string): Promise<string> {
  const commonNames: Record<string, string> = {
    '2330.TW': '台積電', '2454.TW': '聯發科', '2317.TW': '鴻海',
    '0700.HK': '騰訊', '0388.HK': '香港交易所', '1211.HK': '比亞迪',
    '1810.HK': '小米', '3690.HK': '美團', '9988.HK': '阿里巴巴',
    '0005.HK': '滙豐', '1928.HK': '金沙中國',
    'TSLA': '特斯拉', 'AAPL': '蘋果', 'MSFT': '微軟',
    'GOOGL': '谷歌', 'AMZN': '亞馬遜', 'NVDA': '英偉達',
    'META': 'Meta', 'AMD': 'AMD',
  };
  
  if (commonNames[symbol]) return commonNames[symbol];
  
  // Try Yahoo Finance
  try {
    let yahooSymbol = symbol.replace('.HK', '').replace('.TW', '');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      const longName = data.chart?.result?.[0]?.meta?.longName;
      if (longName) return longName;
    }
  } catch (error) {}
  
  return symbol;
}

// ============================================
// TECHNICAL INDICATORS
// ============================================
function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  
  let gains = 0, losses = 0;
  const recentPrices = prices.slice(-period - 1);
  
  for (let i = 1; i < recentPrices.length; i++) {
    const change = recentPrices[i] - recentPrices[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(1));
}

function calculateMACD(prices: number[]): string {
  if (prices.length < 26) return 'Neutral';
  
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  const signalLine = prices.slice(-9).reduce((a, b) => a + b, 0) / 9;
  
  if (macd > signalLine) return 'Bullish';
  if (macd < signalLine) return 'Bearish';
  return 'Neutral';
}

function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  const threshold = 0.02;
  
  if (currentPrice > sma20 * (1 + threshold)) return 'Uptrend';
  if (currentPrice < sma20 * (1 - threshold)) return 'Downtrend';
  return 'Sideways';
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  if (prices.length < period) {
    return { upper: [], middle: [], lower: [] };
  }
  
  const upper = [];
  const middle = [];
  const lower = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    middle.push(sma);
    upper.push(sma + (stdDev * std));
    lower.push(sma - (stdDev * std));
  }
  
  return { upper, middle, lower };
}

// ============================================
// YAHOO FINANCE DATA FETCHING
// ============================================
async function fetchRealStockData(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) yahooSymbol = symbol.replace('.TW', '');
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const opens = quotes.open || [];
    
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    const currentPrice = meta.regularMarketPrice || validCloses[validCloses.length - 1] || 0;
    const previousClose = meta.previousClose || currentPrice;
    const changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
    
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    const timestamps = result.timestamp || [];
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] && closes[i] > 0) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: opens[i] || closes[i],
          high: highs[i] || closes[i],
          low: lows[i] || closes[i],
          close: closes[i],
          volume: volumes[i] || 0,
        });
      }
    }
    
    // Calculate Bollinger Bands
    const prices = historical.map(h => h.close);
    const { upper, middle, lower } = calculateBollingerBands(prices);
    
    const historicalWithBands = historical.map((item, index) => {
      const bandIndex = index - (prices.length - upper.length);
      return {
        ...item,
        upper: bandIndex >= 0 ? upper[bandIndex] : null,
        middle: bandIndex >= 0 ? middle[bandIndex] : null,
        lower: bandIndex >= 0 ? lower[bandIndex] : null,
      };
    });
    
    return { 
      price: currentPrice, 
      changePercent, 
      rsi, 
      macd, 
      trend, 
      currency,
      historical: historicalWithBands,
      meta: {
        currency: meta.currency || 'USD',
        exchange: meta.exchangeName || 'N/A',
        fullName: meta.longName || meta.shortName || symbol,
      }
    };
    
  } catch (err) {
    console.error('Yahoo Finance fetch error:', err);
    return null;
  }
}

// ============================================
// CHAT RESPONSE GENERATION (Fallback when AI fails)
// ============================================
function generateFallbackAnalysis(
  companyName: string, 
  symbol: string, 
  stockData: NonNullable<Awaited<ReturnType<typeof fetchRealStockData>>>
): string {
  const isPositive = stockData.changePercent >= 0;
  const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
  const rsiStatus = stockData.rsi ? (stockData.rsi > 70 ? '超買' : stockData.rsi < 30 ? '超賣' : '中性') : '中性';
  const trendText = stockData.trend === 'Uptrend' ? '上升通道' : stockData.trend === 'Downtrend' ? '下降通道' : '區間震盪';
  
  let recommendation = '持有觀望';
  if (stockData.rsi && stockData.rsi < 35) recommendation = '分批買入';
  else if (stockData.rsi && stockData.rsi > 65) recommendation = '分批獲利';
  
  return `${companyName} (${symbol}) 即時分析

目前股價: ${stockData.currency}${stockData.price.toFixed(2)}
日漲跌幅: ${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%
RSI(14): ${rsiText} (${rsiStatus})
趨勢: ${trendText}

建議: ${recommendation}

數據更新時間: ${new Date().toLocaleString('zh-TW')}
以上分析僅供參考，不構成投資建議。`;
}

// ============================================
// MAIN API HANDLER
// ============================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.prompt || '';
    
    if (!message || message.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: '請輸入股票代號或名稱',
        summary: '請輸入股票代號或名稱，例如：台積電、TSLA、0700.HK'
      });
    }
    
    // Detect stock using existing module
    const symbol = detectStock(message);
    if (!symbol || symbol === '') {
      return NextResponse.json({ 
        success: false, 
        error: '無法識別股票',
        summary: `無法識別「${message}」為有效的股票代號或名稱。\n\n請嘗試輸入：\n- 台灣股票：台積電、聯發科、2330.TW\n- 香港股票：騰訊、0700.HK\n- 美國股票：TSLA、AAPL、NVDA`
      });
    }
    
    // Fetch stock data and company name
    const [stockData, companyName] = await Promise.all([
      fetchRealStockData(symbol),
      fetchCompanyName(symbol)
    ]);
    
    if (!stockData) {
      return NextResponse.json({ 
        success: false, 
        error: '無法獲取數據',
        summary: `暫時無法獲取 ${symbol} 的即時數據。請稍後再試。`
      });
    }
    
    let aiResponse = null;
    let usedFallback = false;
    
    // Try AI providers first
    try {
      const systemPrompt = `你是一個專業的股票分析師。根據以下數據分析 ${companyName} (${symbol})：

股價: ${stockData.currency}${stockData.price.toFixed(2)}
漲跌幅: ${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%
RSI: ${stockData.rsi || 'N/A'}
MACD: ${stockData.macd || 'Neutral'}
趨勢: ${stockData.trend || 'Sideways'}

請提供專業的投資分析（繁體中文），包括：技術分析、基本面看法、買賣建議。保持簡潔專業。`;
      
      aiResponse = await callAIFallback([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]);
    } catch (aiError) {
      console.log('⚠️ AI failed, using fallback analysis');
      usedFallback = true;
    }
    
    const finalSummary = aiResponse || generateFallbackAnalysis(companyName, symbol, stockData);
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: companyName,
      price: stockData.price,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi,
      macd: stockData.macd,
      trend: stockData.trend,
      currency: stockData.currency,
      historical: stockData.historical,
      meta: stockData.meta,
      summary: finalSummary,
      text: finalSummary,
      isQuestion: isQuestion(message),
      usedFallback: usedFallback, // So frontend knows if AI was used
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '服務錯誤',
      summary: '服務暫時不可用，請稍後再試。'
    });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Chat API running", 
    version: "2.0.0",
    aiProviders: AI_PROVIDERS.filter(p => p.enabled).map(p => p.name),
    timestamp: new Date().toISOString()
  });
}