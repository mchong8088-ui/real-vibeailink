import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAnalysisPrompt } from '../../lib/ai/promptBuilder';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const COMPANY_NAMES: Record<string, string> = {
  "0700.HK": "騰訊控股",
  "2330.TW": "台積電",
  "TSLA": "特斯拉",
  "NVDA": "英偉達",
  "AAPL": "蘋果公司",
  "MSFT": "微軟",
  "AMZN": "亞馬遜",
  "CVX": "雪佛龍",
  "GOOGL": "谷歌",
};

function getCompanyName(symbol: string): string {
  return COMPANY_NAMES[symbol] || symbol;
}

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
    "英偉達": "NVDA", "輝達": "NVDA", "NVIDIA": "NVDA",
    "蘋果": "AAPL", "苹果": "AAPL", "Apple": "AAPL",
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

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
    
    let rsi = null;
    if (validCloses.length >= 14) {
      let gains = 0, losses = 0;
      for (let i = validCloses.length - 14; i < validCloses.length; i++) {
        const change = validCloses[i] - (validCloses[i-1] || validCloses[i]);
        if (change >= 0) gains += change;
        else losses -= change;
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      if (avgLoss !== 0) {
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
      }
    }
    
    let macdStatus = 'Neutral';
    if (validCloses.length >= 26) {
      const ema12 = validCloses.slice(-12).reduce((a, b) => a + b, 0) / 12;
      const ema26 = validCloses.slice(-26).reduce((a, b) => a + b, 0) / 26;
      const macd = ema12 - ema26;
      const signal = validCloses.slice(-9).reduce((a, b) => a + b, 0) / 9;
      macdStatus = macd > signal ? 'Bullish 📈' : macd < signal ? 'Bearish 📉' : 'Neutral';
    }
    
    return {
      price: meta.regularMarketPrice,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      rsi: rsi,
      macdStatus: macdStatus,
      sma20: validCloses.slice(-20).reduce((a, b) => a + b, 0) / 20,
      sma50: validCloses.slice(-50).reduce((a, b) => a + b, 0) / 50,
    };
  } catch (err) {
    return null;
  }
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res.ok) return `無法獲取內容 (HTTP ${res.status})`;
    
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    return `標題: ${title}\n內容摘要: ${text.substring(0, 1500)}`;
  } catch (err) {
    return `無法獲取內容: ${err}`;
  }
}

async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let message = '';
    let language = 'ZH';
    let urlParam = null;
    let fileContent = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message') as string || '';
      language = formData.get('language') as string || 'ZH';
      urlParam = formData.get('url') as string || null;
      const file = formData.get('file') as File || null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fileContent = buffer.toString('utf-8').substring(0, 1500);
      }
    } else {
      const body = await req.json();
      message = body.message || '';
      language = body.language || 'ZH';
      urlParam = body.url || null;
    }
    
    console.log(`📝 Query: ${message}`);
    console.log(`🔗 URL: ${urlParam || 'none'}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: 2330.TW, 0700.HK, TSLA`
      });
    }
    
    let urlContent = null;
    if (urlParam) {
      urlContent = await fetchUrlContent(urlParam);
      console.log(`📄 URL content fetched, length: ${urlContent.length}`);
    }
    
    const stockData = await fetchStockData(symbol);
    if (!stockData) {
      return NextResponse.json({
        success: false,
        summary: `無法獲取 ${symbol} 的市場數據，請稍後再試。`
      });
    }
    
    const companyName = getCompanyName(symbol);
    
    const prompt = buildAnalysisPrompt(
      symbol, companyName,
      stockData.price, stockData.changePercent,
      stockData.rsi, stockData.macdStatus,
      stockData.sma20, stockData.sma50,
      urlContent, fileContent,
      language
    );
    
    console.log('🤖 Calling Gemini AI...');
    const aiAnalysis = await callGemini(prompt);
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: companyName,
      price: stockData.price,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi,
      macd: stockData.macdStatus,
      summary: aiAnalysis,
      text: aiAnalysis,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      summary: "服務暫時不可用。請稍後再試。"
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "API running", timestamp: new Date().toISOString() });
}
