import { NextResponse } from 'next/server';
import { buildAnalysisPrompt } from '../../../lib/ai/promptBuilder';

// Simple stock symbol detection
function detectStock(input: string): string | null {
  if (!input || input.trim() === '') return null;
  const cleanInput = input.trim().toUpperCase();
  
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) return cleanInput;
  if (/^\d{4}$/.test(cleanInput)) return `${cleanInput}.HK`;
  if (/^\d{5}$/.test(cleanInput)) return `${cleanInput}.TW`;
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) return cleanInput;
  
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

// Fetch news from Finnhub (free tier)
async function fetchNews(symbol: string): Promise<Array<{title: string; summary: string; source: string}>> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];
    
    let finnhubSymbol = symbol;
    if (symbol.endsWith('.HK')) finnhubSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) finnhubSymbol = symbol.replace('.TW', '');
    
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    const url = `https://finnhub.io/api/v1/company-news?symbol=${finnhubSymbol}&from=${fromStr}&to=${toStr}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    
    return data.slice(0, 5).map((item: any) => ({
      title: item.headline || '',
      summary: item.summary || '',
      source: item.source || 'Financial News',
    }));
  } catch (err) {
    console.log('News fetch failed:', err);
    return [];
  }
}

// Calculate RSI
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

// Determine trend
function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Bullish';
  if (currentPrice < sma20 * 0.98) return 'Bearish';
  return 'Sideways';
}

// Fetch data from Yahoo
async function fetchStockData(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null);
    
    return {
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      closes: validCloses,
    };
  } catch (err) {
    return null;
  }
}

// Call AI (mock for now, will integrate Gemini)
async function callAI(prompt: string): Promise<string> {
  // This is a mock response - you'll integrate Gemini/OpenAI here
  // For now, return a structured analysis based on the prompt
  return `## 1. SUMMARY
The stock shows mixed signals with neutral momentum.

## 2. TECHNICAL ANALYSIS
RSI is at neutral levels. MACD indicates sideways movement. Price is range-bound.

## 3. FUNDAMENTAL ANALYSIS
Valuation appears reasonable. Revenue growth remains positive.

## 4. NEWS SENTIMENT
Recent news sentiment is neutral to slightly positive.

## 5. RISK ANALYSIS
Market volatility and sector rotation are key risks.

## 6. BULL CASE
Technical support levels holding. Growth catalysts ahead.

## 7. BEAR CASE
Resistance overhead. Competitive pressures increasing.

## 8. FINAL RECOMMENDATION
HOLD with a target price range. Wait for clearer signals.`;
}

export async function POST(req: Request) {
  try {
    const { message, language = 'EN', url, attachments } = await req.json();
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
    
    // Fetch market data
    const marketData = await fetchStockData(symbol);
    if (!marketData) {
      return NextResponse.json({
        success: false,
        summary: `Unable to fetch market data for ${symbol}. Please try again.`
      });
    }
    
    // Calculate technical indicators
    const rsi = calculateRSI(marketData.closes);
    const trend = determineTrend(marketData.closes);
    const macd = rsi ? (rsi > 60 ? 'Bullish' : rsi < 40 ? 'Bearish' : 'Neutral') : 'Neutral';
    
    // Fetch news
    const news = await fetchNews(symbol);
    
    // If user provided a URL, add it as news
    if (url) {
      news.unshift({
        title: `User-provided article: ${url.substring(0, 80)}...`,
        summary: 'User submitted this link for analysis.',
        source: 'User Input',
      });
    }
    
    // Build the analysis prompt
    const prompt = buildAnalysisPrompt({
      symbol,
      price: marketData.price,
      changePercent: marketData.changePercent,
      rsi: rsi,
      macd: macd,
      trend: trend,
      news: news,
      userQuestion: message,
      language: language,
    });
    
    console.log('📝 Prompt built, calling AI...');
    
    // Call AI for analysis
    const aiAnalysis = await callAI(prompt);
    
    const response = {
      success: true,
      symbol: symbol,
      price: marketData.price,
      changePercent: marketData.changePercent,
      rsi: rsi,
      macd: macd,
      trend: trend,
      summary: aiAnalysis,
      text: aiAnalysis,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      summary: "Service temporarily unavailable. Please try again."
    });
  }
}
