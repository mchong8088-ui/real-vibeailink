import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const COMPANY_NAMES: Record<string, string> = {
  "0700.HK": "騰訊控股 (Tencent Holdings)",
  "2330.TW": "台積電 (TSMC)",
  "TSLA": "特斯拉 (Tesla)",
  "NVDA": "英偉達 (NVIDIA)",
  "AAPL": "蘋果 (Apple)",
  "MSFT": "微軟 (Microsoft)",
  "AMZN": "亞馬遜 (Amazon)",
  "GOOGL": "谷歌 (Google)",
  "META": "Meta",
  "AMD": "超微半導體 (AMD)",
  "CVX": "雪佛龍 (Chevron)",
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
    "雪佛龍": "CVX", "Chevron": "CVX",
    "富途": "FUTU",
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

async function fetchUrlContent(url: string): Promise<{ content: string; success: boolean; title: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    if (!res.ok) {
      return { content: `無法訪問 (HTTP ${res.status})`, success: false, title: '' };
    }
    
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract main content (simplified)
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    return { 
      content: text.substring(0, 2000),
      success: true,
      title: title
    };
  } catch (err) {
    return { content: `獲取失敗: ${err}`, success: false, title: '' };
  }
}

async function fetchNews(symbol: string): Promise<string> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (apiKey) {
      let finnhubSymbol = symbol;
      if (symbol.endsWith('.HK')) finnhubSymbol = symbol.replace('.HK', '');
      if (symbol.endsWith('.TW')) finnhubSymbol = symbol.replace('.TW', '');
      
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const to = new Date();
      const url = `https://finnhub.io/api/v1/company-news?symbol=${finnhubSymbol}&from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}&token=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.slice(0, 3).map((item: any) => item.headline).join('\n');
        }
      }
    }
  } catch (err) {}
  return '近期無重大新聞';
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
    
    return {
      price: meta.regularMarketPrice,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      rsi: rsi,
    };
  } catch (err) {
    return null;
  }
}

async function callAI(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err: any) {
    console.error('Gemini error:', err.message);
    // Fallback response when AI fails
    return `【1. 技術分析】
RSI數據無法獲取，請稍後再試。

【2. 基本面分析】
目前無法獲取完整分析，請檢查網絡連接後重試。

【3. 用戶提供新聞的分析】
由於AI服務暫時忙碌，無法完整分析您提供的新聞連結。建議您稍後再試，或自行查看新聞內容評估對股價的影響。

【4. 市場氣氛判斷】
Neutral

【5. 看好因素】
請稍後再試獲取完整分析

【6. 看淡因素】
請稍後再試獲取完整分析

【7. AI投資建議及信心評分】
建議: 持有
信心評分: 50%
目標價區間: 待更新`;
  }
}

function buildPrompt(symbol: string, companyName: string, price: number, changePercent: number, rsi: number | null, news: string, urlData: any, language: string): string {
  const isChinese = true; // Force Chinese for HK stocks
  
  const rsiText = rsi ? rsi.toFixed(1) : 'N/A';
  const rsiAdvice = rsi ? (rsi > 70 ? '超買區間，短期可能回調' : rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '數據不足';
  
  let urlSection = '';
  if (urlData && urlData.url) {
    urlSection = `
═══════════════════════════════════════════════════════════
【用戶提供的新聞連結 - 請重點分析此新聞對${symbol}的影響】
新聞來源: ${urlData.url}
標題: ${urlData.title || '無法獲取標題'}
${urlData.success ? `內容摘要: ${urlData.content.substring(0, 1000)}` : `狀態: ${urlData.content}`}
═══════════════════════════════════════════════════════════

請分析:
1. 這則新聞的核心內容是什麼?
2. 這則新聞對${companyName} (${symbol})的股價有什麼影響? 短期(1-4週)和長期(3-12個月)分別如何?
3. 作為AI分析師,你認為這則新聞的重要性有多大? 投資者應該如何應對?
`;
  }

  return `你是一位專業的金融分析師。請分析${symbol} (${companyName})。

【市場數據】
股價: $${price.toFixed(2)}
漲跌幅: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%
RSI(14): ${rsiText} - ${rsiAdvice}

【其他新聞】
${news || '無'}

${urlSection}

請輸出以下格式(純文字,不用markdown):

1. 技術分析: (RSI解讀和趨勢判斷)

2. 基本面分析: (估值和業績)

3. 新聞分析: ${urlData && urlData.url ? '請重點分析用戶提供的新聞連結' : '分析近期新聞影響'}

4. 市場氣氛: (Risk-On/Risk-Off/Neutral)

5. 看好因素: (2-3點)

6. 看淡因素: (2-3點)

7. 投資建議: (買入/賣出/持有)
信心評分: (0-100%)
目標價區間: $${(price * 0.9).toFixed(2)} - $${(price * 1.1).toFixed(2)}

請用繁體中文回答。`;
}

export async function POST(req: Request) {
  try {
    const { message, language = 'EN', url } = await req.json();
    console.log(`📝 Query: ${message}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: 0700.HK, TSLA, NVDA, CVX`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    let urlData = null;
    if (url) {
      console.log(`🌐 Fetching URL: ${url}`);
      const fetched = await fetchUrlContent(url);
      urlData = { ...fetched, url };
    }
    
    const marketData = await fetchStockData(symbol);
    if (!marketData) {
      return NextResponse.json({
        success: false,
        summary: `無法獲取 ${symbol} 的市場數據，請稍後再試。`
      });
    }
    
    const news = await fetchNews(symbol);
    const companyName = getCompanyName(symbol);
    
    const prompt = buildPrompt(symbol, companyName, marketData.price, marketData.changePercent, marketData.rsi, news, urlData, language);
    
    console.log('🤖 Calling AI...');
    const aiAnalysis = await callAI(prompt);
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: companyName,
      price: marketData.price,
      changePercent: marketData.changePercent,
      rsi: marketData.rsi,
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
