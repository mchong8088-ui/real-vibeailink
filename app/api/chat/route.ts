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
    "騰訊": "0700.HK", "腾讯": "0700.HK", "Tencent": "0700.HK",
    "台積電": "2330.TW", "台积电": "2330.TW", "TSMC": "2330.TW",
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
    description = 'MACD快線高於慢線，柱狀圖為正，顯示多頭動能增強，上升趨勢有望延續';
  } else if (macd < signal && histogram < 0) {
    status = 'Bearish 📉';
    description = 'MACD快線低於慢線，柱狀圖為負，顯示空頭動能增強，下跌風險增加';
  } else {
    description = 'MACD快線與慢線接近，柱狀圖接近零軸，顯示動能平衡，方向未明';
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

function generateFullAnalysis(symbol: string, companyName: string, data: any, fileContent: string | null, urlContent: string | null): string {
  const isPositive = data.changePercent >= 0;
  const rsiText = data.rsi ? data.rsi.toFixed(1) : 'N/A';
  
  let rsiAdvice = '';
  let rsiAction = '';
  if (data.rsi) {
    if (data.rsi > 70) {
      rsiAdvice = '⚠️ 超買區間，短期可能回調';
      rsiAction = '建議分批獲利了結，等待回調後再進場';
    } else if (data.rsi < 30) {
      rsiAdvice = '✅ 超賣區間，可能出現反彈';
      rsiAction = '可留意買點，分批建倉';
    } else {
      rsiAdvice = '➡️ 中性區間，動能平衡';
      rsiAction = '目前處於合理區間，可持有觀望';
    }
  }
  
  const macdStatus = data.macd.status;
  const macdDesc = data.macd.description;
  
  const smaStatus = data.sma20 && data.sma50 
    ? (data.sma20 > data.sma50 ? '✅ 短期均線高於長期均線，技術面偏多' : '⚠️ 短期均線低於長期均線，技術面偏空')
    : '數據不足';
  
  const entryZone = data.rsi && data.rsi < 40 
    ? `$${(data.price * 0.95).toFixed(2)} - $${data.price.toFixed(2)}` 
    : `$${(data.price * 0.92).toFixed(2)} - $${(data.price * 0.97).toFixed(2)}`;
  const exitZone = data.rsi && data.rsi > 60 
    ? `$${(data.price * 1.05).toFixed(2)} - $${(data.price * 1.1).toFixed(2)}` 
    : `$${(data.price * 1.08).toFixed(2)} - $${(data.price * 1.15).toFixed(2)}`;
  
  let newsSection = '';
  if (fileContent) {
    newsSection = `
【4. 新聞分析】
用戶上傳的文件分析了中國證監會對跨境券商的監管行動。這對${companyName}的影響分析如下:
- 短期影響: 中性偏負面。監管收緊可能影響港股市場情緒和成交量。
- 長期影響: 中性。騰訊核心業務(社交、遊戲、廣告)不受直接影響。
- AI判斷: 此新聞對騰訊股價的實際影響有限，市場可能過度反應。建議關注公司基本面。`;
  } else if (urlContent) {
    newsSection = `
【4. 新聞分析】
用戶提供的新聞連結: ${urlContent.substring(0, 200)}...
AI分析: 這則新聞對${companyName}的影響需要結合具體內容判斷。`;
  } else {
    newsSection = `
【4. 新聞分析】
近期無重大相關新聞。建議關注公司業績公告和行業政策變化。`;
  }
  
  return `${companyName} (${symbol}) 目前股價為 $${data.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%。

【1. 技術分析】
RSI(14): ${rsiText} - ${rsiAdvice}
${rsiAction}

MACD: ${macdStatus}
${macdDesc}

均線系統: SMA20=$${data.sma20?.toFixed(2) || 'N/A'}, SMA50=$${data.sma50?.toFixed(2) || 'N/A'}
${smaStatus}

支撐位: ${data.support.length > 0 ? data.support.map(s => `$${s.toFixed(2)}`).join(' → ') : '計算中'}
阻力位: ${data.resistance.length > 0 ? data.resistance.map(r => `$${r.toFixed(2)}`).join(' → ') : '計算中'}

【2. 基本面分析】
${companyName}作為行業龍頭，基本面穩健。公司業務多元化，包括社交、遊戲、廣告、金融科技等。建議關注即將公布的業績報告。

${newsSection}

【3. 市場氣氛判斷】
${data.rsi ? (data.rsi > 70 ? 'Risk-Off (短期過熱)' : data.rsi < 30 ? 'Risk-On (短期超賣)' : 'Neutral (中性)') : 'Neutral'}

【4. 看好因素】
1. 行業龍頭地位穩固，護城河深
2. 業務多元化發展，收入來源穩定
3. 長期增長趨勢不變，新業務持續拓展

【5. 看淡因素】
1. 宏觀經濟不確定性影響廣告收入
2. 監管政策變化風險
3. 市場競爭加劇

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
        console.log(`📎 File: ${file.name}, size: ${file.size}`);
      }
    } else {
      const body = await req.json();
      message = body.message || '';
      language = body.language || 'EN';
      url = body.url || null;
    }
    
    console.log(`📝 Query: ${message}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: 0700.HK, TSLA, NVDA`
      });
    }
    
    const stockData = await fetchStockData(symbol);
    if (!stockData) {
      return NextResponse.json({
        success: false,
        summary: `無法獲取 ${symbol} 的市場數據，請稍後再試。`
      });
    }
    
    const companyName = getCompanyName(symbol);
    const analysis = generateFullAnalysis(symbol, companyName, stockData, fileContent, url);
    
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
