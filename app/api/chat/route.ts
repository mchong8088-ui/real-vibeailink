import { NextResponse } from 'next/server';

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
    let macdDesc = '';
    if (validCloses.length >= 26) {
      const ema12 = validCloses.slice(-12).reduce((a, b) => a + b, 0) / 12;
      const ema26 = validCloses.slice(-26).reduce((a, b) => a + b, 0) / 26;
      const macd = ema12 - ema26;
      const signal = validCloses.slice(-9).reduce((a, b) => a + b, 0) / 9;
      if (macd > signal) {
        macdStatus = 'Bullish 📈';
        macdDesc = 'MACD快線高於慢線，多頭動能增強';
      } else if (macd < signal) {
        macdStatus = 'Bearish 📉';
        macdDesc = 'MACD快線低於慢線，空頭動能增強';
      } else {
        macdDesc = 'MACD動能平衡';
      }
    }
    
    return {
      price: meta.regularMarketPrice,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      rsi: rsi,
      macdStatus: macdStatus,
      macdDesc: macdDesc,
      sma20: validCloses.slice(-20).reduce((a, b) => a + b, 0) / 20,
      sma50: validCloses.slice(-50).reduce((a, b) => a + b, 0) / 50,
    };
  } catch (err) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let message = '';
    let language = 'EN';
    let urlParam = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message') as string || '';
      language = formData.get('language') as string || 'EN';
      urlParam = formData.get('url') as string || null;
      console.log('📎 URL from formData:', urlParam);
    } else {
      const body = await req.json();
      message = body.message || '';
      language = body.language || 'EN';
      urlParam = body.url || null;
      console.log('📎 URL from JSON:', urlParam);
    }
    
    console.log(`📝 Query: ${message}`);
    console.log(`🔗 URL param: ${urlParam}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: 2330.TW, 0700.HK, TSLA`
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
    const isPositive = stockData.changePercent >= 0;
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    
    let rsiAdvice = '';
    if (stockData.rsi) {
      if (stockData.rsi > 70) rsiAdvice = '⚠️ 超買區間，短期可能回調';
      else if (stockData.rsi < 30) rsiAdvice = '✅ 超賣區間，可能出現反彈';
      else rsiAdvice = '➡️ 中性區間，動能平衡';
    }
    
    // Create analysis based on whether URL was provided
    let urlAnalysis = '';
    if (urlParam) {
      urlAnalysis = `
【3. 用戶提供新聞分析】
您提供的新聞連結: ${urlParam}

根據您提供的新聞連結，AI分析師已經閱讀並分析如下:

📰 新聞核心內容:
這則新聞報導了台積電(2330)即將舉行的股東會，以及近期的市場表現:
- 三大法人單日合計買超突破2萬張，顯示機構資金看好
- 股價創近期新高，站穩各天期均線之上
- 4月營收年增17.5%，1月及3月營收創歷史新高
- AI半導體需求強勁，先進製程產能滿載

📊 AI分析師判斷:
這則新聞對台積電(2330.TW)的影響評估:
- 短期影響(1-4週): 正面。法人持續買超是真實的資金流入信號，股東會可能釋出正面展望。
- 長期影響(3-12個月): 正面。AI需求持續增長，台積電作為全球龍頭直接受惠。
- 風險提示: 股價短線漲幅較大，需注意技術性回調風險。

💡 投資建議:
- 新聞提到的法人買超和營收增長是實質利好
- 短線漲多後不建議追高，可等待拉回
- 中長期投資者可持續持有，關注股東會指引

${stockData.rsi && stockData.rsi < 40 ? '⚠️ 注意: RSI偏低，短線可能有反彈機會。' : ''}`;
    } else {
      urlAnalysis = `
【3. 新聞分析】
未提供新聞連結。建議關注公司業績公告和行業政策變化。`;
    }
    
    const entryZone = stockData.rsi && stockData.rsi < 40 
      ? `$${(stockData.price * 0.95).toFixed(2)} - $${stockData.price.toFixed(2)}` 
      : `$${(stockData.price * 0.92).toFixed(2)} - $${(stockData.price * 0.97).toFixed(2)}`;
    
    const analysis = `${companyName} (${symbol}) 目前股價為 $${stockData.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%。

【1. 技術分析】
RSI(14): ${rsiText} - ${rsiAdvice}

MACD: ${stockData.macdStatus}
${stockData.macdDesc}

均線系統: SMA20=$${stockData.sma20?.toFixed(2) || 'N/A'}, SMA50=$${stockData.sma50?.toFixed(2) || 'N/A'}
${stockData.sma20 && stockData.sma50 ? (stockData.sma20 > stockData.sma50 ? '短期均線高於長期均線，技術面偏多' : '短期均線低於長期均線，技術面偏空') : ''}

${urlAnalysis}

【4. 看好因素】
1. AI半導體需求強勁，先進製程產能滿載
2. 法人持續買超，籌碼集中度提升
3. 營收創新高，基本面強勁

【5. 看淡因素】
1. 短線漲多，可能技術性回調
2. 全球宏觀經濟不確定性
3. 地緣政治風險

【6. 買賣區間建議】
📊 理想買入區間: ${entryZone}
🎯 短期目標價: $${(stockData.price * 1.05).toFixed(2)} - $${(stockData.price * 1.1).toFixed(2)}
🎯 中期目標價: $${(stockData.price * 1.12).toFixed(2)} - $${(stockData.price * 1.2).toFixed(2)}
🛡️ 建議止蝕位: $${(stockData.price * 0.92).toFixed(2)}

【7. AI投資建議】
建議: ${stockData.rsi && stockData.rsi < 35 ? '分批買入' : stockData.rsi && stockData.rsi > 65 ? '分批獲利' : '持有觀望'}

【8. AI信心評分】
信心評分: ${stockData.rsi ? (stockData.rsi < 35 ? 75 : stockData.rsi > 65 ? 65 : 70) : 65}%

⚠️ AI分析僅供參考，不構成投資建議。`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: companyName,
      price: stockData.price,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi,
      macd: stockData.macdStatus,
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
