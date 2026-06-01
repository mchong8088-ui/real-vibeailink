import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Stock symbol to company name mapping
const COMPANY_NAMES: Record<string, string> = {
  "2330.TW": "台積電 (TSMC)",
  "0700.HK": "騰訊控股 (Tencent)",
  "TSLA": "特斯拉 (Tesla)",
  "NVDA": "英偉達 (NVIDIA)",
  "AAPL": "蘋果 (Apple)",
  "MSFT": "微軟 (Microsoft)",
  "AMZN": "亞馬遜 (Amazon)",
  "GOOGL": "谷歌 (Google)",
  "META": "Meta",
  "AMD": "超微半導體 (AMD)",
  "CVX": "雪佛龍 (Chevron)",
  "XOM": "埃克森美孚 (Exxon Mobil)",
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
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

// Fetch and extract content from URL
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    // Simple extraction - look for title and article content
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    // Take first 2000 characters
    const content = text.substring(0, 2000);
    return `標題: ${title}\n摘要: ${content.substring(0, 1000)}`;
  } catch (err) {
    console.error('URL fetch error:', err);
    return '無法獲取文章內容';
  }
}

async function fetchNews(symbol: string): Promise<string> {
  const newsItems: string[] = [];
  
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
        data.slice(0, 3).forEach((item: any) => {
          newsItems.push(`${item.headline}`);
        });
      }
    }
  } catch (err) {
    console.log('News fetch error:', err);
  }
  
  return newsItems.join('\n') || '近期無重大新聞';
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
      previousClose: meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      rsi: rsi,
    };
  } catch (err) {
    return null;
  }
}

async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key missing');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAI(prompt: string): Promise<string> {
  try {
    console.log('🤖 Trying Gemini...');
    return await callGemini(prompt);
  } catch (err: any) {
    console.log('Gemini failed:', err.message);
  }
  
  try {
    console.log('🤖 Trying OpenAI...');
    return await callOpenAI(prompt);
  } catch (err: any) {
    console.log('OpenAI failed:', err.message);
  }
  
  throw new Error('All AI providers failed');
}

function buildPrompt(symbol: string, companyName: string, price: number, changePercent: number, rsi: number | null, news: string, urlContent: string | null, language: string): string {
  const isChinese = language === '简体中文' || language === 'Cantonese';
  
  const rsiText = rsi ? rsi.toFixed(1) : 'N/A';
  const rsiAdvice = rsi ? (rsi > 70 ? '超買區間，短期可能回調' : rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '';
  
  const urlSection = urlContent ? `
═══════════════════════════════════════
【用戶提供的新聞連結 - 必須重點分析】
新聞內容:
${urlContent}
═══════════════════════════════════════

重要指示:
1. 請先摘要這則新聞的核心內容 (2-3句話)
2. 分析這則新聞對 ${symbol} (${companyName}) 股價的具體影響
3. 給出AI的獨立判斷: 這則新聞是否真的會影響股價? 影響程度多大?
4. 不要只是複述新聞，要提供有價值的分析觀點
5. 如果用戶提供的新聞與市場主流觀點不同，請說明你的看法

⚠️ 用戶提供了這個新聞連結，表示用戶關心這個資訊。請務必詳細分析!
` : '';

  return `你是一位頂尖的金融分析師。請對${symbol} (${companyName}) 進行專業的股票分析。

【市場數據】
股價: $${price.toFixed(2)}
日漲跌幅: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%
RSI(14): ${rsiText} - ${rsiAdvice}

【市場其他新聞】
${news || '無其他重大新聞'}

${urlSection}

請嚴格按照以下格式輸出分析（不要使用markdown符號如##或**）：

【1. 技術分析】
RSI(14)為${rsiText}，${rsiAdvice}。
趨勢方向及技術面解讀。

【2. 基本面分析】
分析公司估值、每股盈利、業績表現、成長動能。

【3. 新聞分析】
${urlContent ? '請在此部分重點分析用戶提供的新聞連結，包括新聞摘要、對股價影響、AI獨立判斷。' : '分析近期新聞對股價的影響。'}

【4. 市場氣氛判斷】
Risk-On / Risk-Off / Neutral

【5. 看好因素】
列出2-3個支撐股價的理由

【6. 看淡因素】
列出2-3個壓制股價的風險

【7. AI投資建議及信心評分】
建議: 買入/賣出/持有
信心評分: (0-100%)
目標價區間: $${(price * 0.9).toFixed(2)} - $${(price * 1.15).toFixed(2)}

請用${isChinese ? '繁體中文' : '英文'}回答，專業詳細。`;
}

export async function POST(req: Request) {
  try {
    const { message, language = 'EN', url } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    console.log(`🔗 URL provided: ${url || 'none'}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: TSLA, 0700.HK, CVX, 或 台積電`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    // Fetch URL content if provided
    let urlContent = null;
    if (url) {
      console.log(`🌐 Fetching URL content: ${url}`);
      urlContent = await fetchUrlContent(url);
      console.log(`📄 URL content fetched, length: ${urlContent?.length || 0}`);
    }
    
    const marketData = await fetchStockData(symbol);
    if (!marketData) {
      return NextResponse.json({
        success: false,
        summary: `無法獲取 ${symbol} 的市場數據。請稍後再試。`
      });
    }
    
    const news = await fetchNews(symbol);
    const companyName = getCompanyName(symbol);
    
    const prompt = buildPrompt(
      symbol, companyName, marketData.price, 
      marketData.changePercent, marketData.rsi, news, urlContent, language
    );
    
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
  return NextResponse.json({ status: "API is running", timestamp: new Date().toISOString() });
}
