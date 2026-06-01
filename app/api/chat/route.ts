import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const COMPANY_NAMES: Record<string, string> = {
  "2330.TW": "台積電 (TSMC)", "0700.HK": "騰訊控股 (Tencent)", "TSLA": "特斯拉 (Tesla)",
  "NVDA": "英偉達 (NVIDIA)", "AAPL": "蘋果 (Apple)", "MSFT": "微軟 (Microsoft)",
  "AMZN": "亞馬遜 (Amazon)", "GOOGL": "谷歌 (Google)", "META": "Meta", "AMD": "超微半導體 (AMD)",
  "CVX": "雪佛龍 (Chevron)", "XOM": "埃克森美孚 (Exxon Mobil)",
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

// Fetch URL content with better headers
async function fetchUrlContent(url: string): Promise<{ content: string; success: boolean }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });
    
    if (!res.ok) {
      return { content: `HTTP ${res.status}: 無法訪問此連結 (${url})`, success: false };
    }
    
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    return { 
      content: `標題: ${title}\n摘要: ${text.substring(0, 1500)}`,
      success: true 
    };
  } catch (err) {
    console.error('URL fetch error:', err);
    return { content: `無法獲取內容: ${err}`, success: false };
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
        return data.slice(0, 3).map((item: any) => item.headline).join('\n');
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function buildPrompt(symbol: string, companyName: string, price: number, changePercent: number, rsi: number | null, news: string, urlData: { content: string; success: boolean } | null, language: string): string {
  const isChinese = language === '简体中文' || language === 'Cantonese';
  
  const rsiText = rsi ? rsi.toFixed(1) : 'N/A';
  const rsiAdvice = rsi ? (rsi > 70 ? '超買區間，短期可能回調' : rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '';
  
  let urlSection = '';
  if (urlData) {
    if (urlData.success) {
      urlSection = `
═══════════════════════════════════════════════════════════
【用戶提供的新聞連結 - 請重點分析此新聞對股價的影響】
新聞內容:
${urlData.content}
═══════════════════════════════════════════════════════════

【分析此新聞的具體要求】
請務必按照以下結構分析用戶提供的新聞:

1. 新聞核心摘要: (用1-2句話總結這則新聞)
2. 對${symbol} ($companyName)的影響評估:
   - 短期影響 (1-4週): 正面/負面/中性? 為什麼?
   - 長期影響 (3-12個月): 正面/負面/中性? 為什麼?
3. AI獨立判斷: 
   - 這則新聞是否真的會影響股價? 影響程度多大? (高/中/低)
   - 如果影響較小,請說明為什麼市場可能不會對此新聞有強烈反應
4. 給用戶的具體建議: 基於這則新聞,用戶應該如何調整投資決策?

⚠️ 重要: 用戶專門提供了這個新聞連結,表示用戶認為這個資訊很重要。請務必詳細分析,不要忽略!
`;
    } else {
      urlSection = `
═══════════════════════════════════════════════════════════
【用戶提供的新聞連結 - 無法獲取內容】
用戶提供的連結: ${urlData.content.split(':')[1] || '無法訪問'}
狀態: ${urlData.content}
═══════════════════════════════════════════════════════════

請注意: 用戶提供了這個新聞連結,但系統無法直接獲取內容。請根據連結的性質(如來源網站是香港經濟日報/信報等),推測這類新聞可能涉及的議題,並給予一般性的分析建議。

請告知用戶: 由於無法訪問該連結,建議用戶手動查看新聞內容後再次提問。
`;
    }
  }

  return `你是一位頂尖的金融分析師。請對${symbol} (${companyName}) 進行專業的股票分析。

【市場數據】
${companyName} (${symbol}) 股價: $${price.toFixed(2)}
日漲跌幅: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%
RSI(14): ${rsiText} - ${rsiAdvice}

【市場其他新聞】
${news || '無其他重大新聞'}

${urlSection}

請嚴格按照以下格式輸出分析:

【1. 技術分析】
RSI(14)為${rsiText}，${rsiAdvice}。趨勢方向及技術面解讀。

【2. 基本面分析】
分析公司估值、每股盈利、業績表現、成長動能。

【3. 用戶提供新聞的分析】
${urlData ? '請在此部分詳細分析用戶提供的新聞,包括新聞摘要、對股價的影響評估、以及AI的獨立判斷。' : '分析近期新聞對股價的影響。'}

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

請用${isChinese ? '繁體中文' : '英文'}回答,專業詳細。`;
}

export async function POST(req: Request) {
  try {
    const { message, language = 'EN', url } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    console.log(`🔗 URL: ${url || 'none'}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: TSLA, 0700.HK, CVX, AMZN`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    let urlData = null;
    if (url) {
      console.log(`🌐 Fetching URL: ${url}`);
      urlData = await fetchUrlContent(url);
      console.log(`📄 URL fetch success: ${urlData.success}`);
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
      marketData.changePercent, marketData.rsi, news, urlData, language
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
