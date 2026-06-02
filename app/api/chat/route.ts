import { NextResponse } from 'next/server';

// Stock symbol detection
function detectStock(input: string): string | null {
  if (!input || input.trim() === '') return null;
  const cleanInput = input.trim().toUpperCase();
  
  // Direct symbol with suffix
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) return cleanInput;
  if (/^\d{4}$/.test(cleanInput)) return `${cleanInput}.HK`;
  if (/^\d{5}$/.test(cleanInput)) return `${cleanInput}.TW`;
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) return cleanInput;
  
  // Chinese name mapping
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

// Calculate MACD
function calculateMACD(prices: number[]): string {
  if (prices.length < 26) return 'Neutral';
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  const signal = prices.slice(-9).reduce((a, b) => a + b, 0) / 9;
  if (macd > signal) return 'Bullish 📈';
  if (macd < signal) return 'Bearish 📉';
  return 'Neutral';
}

// Determine trend
function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Bullish 📈';
  if (currentPrice < sma20 * 0.98) return 'Bearish 📉';
  return 'Sideways ➡️';
}

// Fetch real stock data from Yahoo Finance
async function fetchRealStockData(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    console.log(`📊 Fetching: ${url}`);
    
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    
    if (validCloses.length === 0) return null;
    
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    // Determine currency
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    console.log(`✅ ${symbol}: ${currency}${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    
    return {
      price,
      changePercent,
      rsi,
      macd,
      trend,
      currency,
    };
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    console.log(`📝 Query: ${message}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `無法識別股票代號。請嘗試: 0700.HK, 2330.TW, TSLA`
      });
    }
    
    const stockData = await fetchRealStockData(symbol);
    if (!stockData) {
      return NextResponse.json({
        success: false,
        summary: `無法獲取 ${symbol} 的即時數據，請稍後再試。`
      });
    }
    
    const companyName = symbol === '0700.HK' ? '騰訊控股' : 
                        symbol === '2330.TW' ? '台積電' : 
                        symbol === 'TSLA' ? '特斯拉' : symbol;
    
    const isPositive = stockData.changePercent >= 0;
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    const rsiStatus = stockData.rsi ? (stockData.rsi > 70 ? '超買區間' : stockData.rsi < 30 ? '超賣區間' : '中性區間') : '';
    
    const entryPrice = stockData.price * 0.96;
    const targetPrice = stockData.price * 1.05;
    const stopLoss = stockData.price * 0.94;
    
    const analysis = `${companyName} (${symbol}) 目前股價為 ${stockData.currency}${stockData.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%。

【1. 技術分析】
RSI(14): ${rsiText} - ${rsiStatus}
MACD: ${stockData.macd}
趨勢: ${stockData.trend}

【2. 基本面分析】
${companyName}作為${symbol.includes('TW') ? '全球晶圓代工龍頭' : symbol.includes('HK') ? '互聯網巨頭' : '科技龍頭'}，基本面穩健。

【3. 市場氣氛判斷】
${stockData.rsi ? (stockData.rsi > 65 ? 'Risk-Off (短期過熱)' : stockData.rsi < 35 ? 'Risk-On (短期超賣)' : '中性') : '中性'}

【4. 看好因素】
1. 行業龍頭地位穩固
2. 技術領先優勢
3. 長期需求增長

【5. 看淡因素】
1. 市場競爭加劇
2. 宏觀經濟不確定性
3. 短線漲多可能回調

【6. 買賣建議】
📊 理想買入區間: ${stockData.currency}${entryPrice.toFixed(2)} - ${stockData.currency}${stockData.price.toFixed(2)}
🎯 短期目標價: ${stockData.currency}${targetPrice.toFixed(2)}
🛡️ 止蝕位: ${stockData.currency}${stopLoss.toFixed(2)}

【7. AI信心評分】
${stockData.rsi ? (stockData.rsi < 35 ? 75 : stockData.rsi > 65 ? 65 : 70) : 70}%

⚠️ 以上分析僅供參考，不構成投資建議。`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      price: stockData.price,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi,
      macd: stockData.macd,
      trend: stockData.trend,
      summary: analysis,
      text: analysis,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      summary: "服務暫時不可用，請稍後再試。"
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "API running", timestamp: new Date().toISOString() });
}
