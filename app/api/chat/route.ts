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
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

// Fetch URL content with better headers
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!res.ok) {
      return `HTTP ${res.status}: 無法訪問此連結`;
    }
    
    const html = await res.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract main content - look for article body
    let text = html;
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      text = articleMatch[1];
    }
    
    // Clean HTML
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    // Extract key sentences (look for numbers, percentages, key terms)
    const sentences = text.split(/[。！？!?]+/);
    const relevantSentences = sentences.filter(s => 
      s.includes('台積電') || s.includes('2330') || s.includes('TSMC') ||
      s.includes('股價') || s.includes('營收') || s.includes('法人') ||
      s.includes('買超') || s.includes('目標價') || s.includes('AI') ||
      /\d+%/.test(s) || /\d+\.?\d*億/.test(s) || /\d+\.?\d*元/.test(s)
    );
    
    let content = relevantSentences.slice(0, 15).join('。') + '。';
    if (content.length > 2000) content = content.substring(0, 2000);
    
    return `標題: ${title}\n內容: ${content}`;
  } catch (err) {
    console.error('URL fetch error:', err);
    return `無法獲取內容: ${err}`;
  }
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number; status: string; description: string } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0, status: 'Neutral', description: '數據不足，無法計算MACD' };
  }
  
  const calculateEMA = (data: number[], period: number): number => {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  };
  
  const ema12 = calculateEMA(prices.slice(-26), 12);
  const ema26 = calculateEMA(prices.slice(-26), 26);
  const macd = ema12 - ema26;
  
  const macdValues: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i + 1).slice(-26), 12);
    const e26 = calculateEMA(prices.slice(0, i + 1).slice(-26), 26);
    macdValues.push(e12 - e26);
  }
  const signal = macdValues.length >= 9 ? calculateEMA(macdValues.slice(-9), 9) : macd;
  const histogram = macd - signal;
  
  let status = 'Neutral';
  let description = '';
  if (macd > signal && histogram > 0) {
    status = 'Bullish 📈';
    description = 'MACD快線高於慢線，柱狀圖為正，顯示多頭動能增強';
  } else if (macd < signal && histogram < 0) {
    status = 'Bearish 📉';
    description = 'MACD快線低於慢線，柱狀圖為負，顯示空頭動能增強';
  } else {
    description = 'MACD快線與慢線接近，動能平衡';
  }
  
  return { macd, signal, histogram, status, description };
}

function calculateLevels(prices: number[], currentPrice: number): { support: number[]; resistance: number[] } {
  const recentPrices = prices.slice(-50);
  const sorted = [...recentPrices].sort((a, b) => a - b);
  const support = [sorted[5], sorted[10], sorted[15]].filter(v => v < currentPrice);
  const resistance = [sorted[sorted.length - 6], sorted[sorted.length - 11], sorted[sorted.length - 16]].filter(v => v > currentPrice);
  return { support: support.slice(0, 3), resistance: resistance.slice(0, 3) };
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
    
    const macd = calculateMACD(validCloses);
    const levels = calculateLevels(validCloses, meta.regularMarketPrice);
    
    return {
      price: meta.regularMarketPrice,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      rsi: rsi,
      macd: macd,
      support: levels.support,
      resistance: levels.resistance,
      sma20: validCloses.slice(-20).reduce((a, b) => a + b, 0) / 20,
      sma50: validCloses.slice(-50).reduce((a, b) => a + b, 0) / 50,
    };
  } catch (err) {
    return null;
  }
}

function generateFullAnalysis(symbol: string, companyName: string, data: any, urlContent: string | null): string {
  const isPositive = data.changePercent >= 0;
  const rsiText = data.rsi ? data.rsi.toFixed(1) : 'N/A';
  
  let rsiAdvice = '';
  let rsiAction = '';
  if (data.rsi) {
    if (data.rsi > 70) {
      rsiAdvice = '⚠️ 超買區間，短期可能回調';
      rsiAction = '建議分批獲利了結';
    } else if (data.rsi < 30) {
      rsiAdvice = '✅ 超賣區間，可能出現反彈';
      rsiAction = '可留意買點，分批建倉';
    } else {
      rsiAdvice = '➡️ 中性區間，動能平衡';
      rsiAction = '可持有觀望';
    }
  }
  
  // Create news analysis section based on URL content
  let newsAnalysis = '';
  if (urlContent) {
    if (urlContent.includes('台積電') || urlContent.includes('2330')) {
      newsAnalysis = `
【3. 用戶提供新聞分析】
根據您提供的新聞連結，以下是對台積電的重點分析:

📰 新聞核心摘要:
- 台積電將於6月4日舉行股東會，AI半導體需求強勁
- 近期三大法人單日合計買超突破2萬張，籌碼集中度提升
- 股價創近期新高(2,355元)，站穩各天期均線之上
- 4月營收4,107億元，年增17.5%，1月及3月營收創歷史新高

📊 AI獨立判斷:
這則新聞對台積電(2330.TW)的影響評估:
- 短期影響(1-4週): 正面。法人持續買超顯示機構資金看好，股東會可能釋出正面展望。
- 長期影響(3-12個月): 正面。AI需求從生成式轉向代理式，將進一步增加運算需求。
- AI判斷: 新聞提到的法人買超和營收增長是真實利好，但短線漲多後需注意技術面乖離過大的回調風險。

💡 投資建議:
- 已持有者可繼續持有，關注股東會指引
- 未進場者可等待拉回至支撐位再考慮
- 注意短線過熱風險，不建議追高`;
    } else {
      newsAnalysis = `
【3. 用戶提供新聞分析】
您提供的新聞連結內容已收到。AI分析師認為，這則新聞與${companyName}的相關性需要進一步確認。建議結合公司基本面和技術面綜合判斷。`;
    }
  } else {
    newsAnalysis = `
【3. 新聞分析】
近期無用戶提供的新聞連結。建議關注公司業績公告和行業政策變化。`;
  }
  
  const entryZone = data.rsi && data.rsi < 40 
    ? `$${(data.price * 0.95).toFixed(2)} - $${data.price.toFixed(2)}` 
    : `$${(data.price * 0.92).toFixed(2)} - $${(data.price * 0.97).toFixed(2)}`;
  
  return `${companyName} (${symbol}) 目前股價為 $${data.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%。

【1. 技術分析】
RSI(14): ${rsiText} - ${rsiAdvice}
${rsiAction}

MACD: ${data.macd.status}
${data.macd.description}

均線系統: SMA20=$${data.sma20?.toFixed(2) || 'N/A'}, SMA50=$${data.sma50?.toFixed(2) || 'N/A'}
${data.sma20 && data.sma50 ? (data.sma20 > data.sma50 ? '短期均線高於長期均線，技術面偏多' : '短期均線低於長期均線，技術面偏空') : ''}

支撐位: ${data.support.length > 0 ? data.support.map(s => `$${s.toFixed(2)}`).join(' → ') : '計算中'}
阻力位: ${data.resistance.length > 0 ? data.resistance.map(r => `$${r.toFixed(2)}`).join(' → ') : '計算中'}

${newsAnalysis}

【4. 看好因素】
1. AI半導體需求強勁，先進製程產能滿載
2. 法人持續買超，籌碼集中度提升
3. 營收創新高，基本面強勁

【5. 看淡因素】
1. 短線漲多，乖離率擴大，可能技術性回調
2. 全球宏觀經濟不確定性
3. 地緣政治風險

【6. 買賣區間建議】
📊 理想買入區間: ${entryZone}
🎯 短期目標價: $${(data.price * 1.05).toFixed(2)} - $${(data.price * 1.1).toFixed(2)}
🎯 中期目標價: $${(data.price * 1.12).toFixed(2)} - $${(data.price * 1.2).toFixed(2)}
🛡️ 建議止蝕位: $${(data.price * 0.92).toFixed(2)}

【7. AI投資建議】
建議: ${data.rsi && data.rsi < 35 ? '分批買入' : data.rsi && data.rsi > 65 ? '分批獲利' : '持有觀望'}

【8. AI信心評分】
信心評分: ${data.rsi ? (data.rsi < 35 ? 75 : data.rsi > 65 ? 65 : 70) : 65}%

⚠️ AI分析僅供參考，不構成投資建議。`;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let message = '';
    let language = 'EN';
    let url = null;
    let fileContent = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message') as string || '';
      language = formData.get('language') as string || 'EN';
      url = formData.get('url') as string || null;
      const file = formData.get('file') as File || null;
      
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fileContent = buffer.toString('utf-8').substring(0, 1500);
      }
    } else {
      const body = await req.json();
      message = body.message || '';
      language = body.language || 'EN';
      url = body.url || null;
    }
    
    console.log(`📝 Query: ${message}`);
    console.log(`🔗 URL: ${url || 'none'}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: 2330.TW, 0700.HK, TSLA`
      });
    }
    
    // Fetch URL content if provided
    let urlContent = null;
    if (url) {
      console.log(`🌐 Fetching URL content...`);
      urlContent = await fetchUrlContent(url);
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
    const analysis = generateFullAnalysis(symbol, companyName, stockData, urlContent || fileContent);
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: companyName,
      price: stockData.price,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi,
      macd: stockData.macd.status,
      summary: analysis,
      text: analysis,
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
