import { NextResponse } from 'next/server';

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

function calculateMACD(prices: number[]): string {
  if (prices.length < 26) return 'Neutral';
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  const signal = prices.slice(-9).reduce((a, b) => a + b, 0) / 9;
  if (macd > signal) return 'Bullish';
  if (macd < signal) return 'Bearish';
  return 'Neutral';
}

function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Uptrend';
  if (currentPrice < sma20 * 0.98) return 'Downtrend';
  return 'Sideways';
}

// Fetch real stock data including historical prices for chart
async function fetchRealStockData(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
    
    // Build historical data for chart
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] && closes[i] > 0) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: closes[i],
          volume: volumes[i] || 0,
        });
      }
    }
    
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    return { price, changePercent, rsi, macd, trend, currency, historical };
  } catch (err) {
    return null;
  }
}

function getCompanyName(symbol: string): string {
  const names: Record<string, string> = {
    '0700.HK': '騰訊控股有限公司',
    '2330.TW': '台灣積體電路製造股份有限公司',
    'TSLA': '特斯拉公司',
  };
  return names[symbol] || symbol;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
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
    
    const companyName = getCompanyName(symbol);
    const isPositive = stockData.changePercent >= 0;
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    const rsiInterpret = stockData.rsi ? (stockData.rsi > 70 ? '超買區間，短期可能回調' : stockData.rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '';
    const macdInterpret = stockData.macd === 'Bullish' ? '看漲信號，多頭動能增強' : stockData.macd === 'Bearish' ? '看跌信號，空頭動能增強' : '中性信號，方向未明';
    
    const analysis = `## 📊 ${companyName} (${symbol}) 投資分析

### 1. 摘要
${companyName} (${symbol}) 目前股價為 ${stockData.currency}${stockData.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%。RSI為${rsiText}，處於${stockData.rsi ? (stockData.rsi > 70 ? '超買' : stockData.rsi < 30 ? '超賣' : '中性') : '中性'}水平。整體趨勢${stockData.trend === 'Uptrend' ? '看好' : stockData.trend === 'Downtrend' ? '看淡' : '橫向整理'}。

### 2. 技術分析
- **RSI(14)**: ${rsiText} - ${rsiInterpret}
- **MACD**: ${stockData.macd} - ${macdInterpret}
- **趨勢**: ${stockData.trend === 'Uptrend' ? '上升通道 📈' : stockData.trend === 'Downtrend' ? '下降通道 📉' : '區間震盪 ➡️'}

### 3. 基本面分析
${companyName}作為${symbol.includes('TW') ? '全球晶圓代工龍頭' : symbol.includes('HK') ? '互聯網巨頭' : '科技龍頭'}，財務狀況穩健。建議關注即將公布的業績報告。

### 4. 新聞與風險分析
近期市場關注全球經濟走勢及行業政策變化。主要風險包括宏觀經濟不確定性、市場競爭加劇及監管政策變化。

### 5. 看好因素
1. 行業龍頭地位穩固
2. 技術領先優勢明顯
3. 長期增長趨勢不變

### 6. 看淡因素
1. 市場競爭加劇
2. 宏觀經濟不確定性
3. 短線漲多可能回調

### 7. 買賣建議
- **理想買入區間**: ${stockData.currency}${(stockData.price * 0.95).toFixed(2)} - ${stockData.currency}${stockData.price.toFixed(2)}
- **短期目標價**: ${stockData.currency}${(stockData.price * 1.08).toFixed(2)}
- **中期目標價**: ${stockData.currency}${(stockData.price * 1.15).toFixed(2)}
- **止蝕位**: ${stockData.currency}${(stockData.price * 0.92).toFixed(2)}

### 8. 最終建議及信心評分
**建議**: ${stockData.rsi && stockData.rsi < 35 ? '分批買入' : stockData.rsi && stockData.rsi > 65 ? '分批獲利' : '持有觀望'}
**信心評分**: ${stockData.rsi ? (stockData.rsi < 35 ? 75 : stockData.rsi > 65 ? 65 : 70) : 70}%

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      price: stockData.price,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi,
      macd: stockData.macd,
      trend: stockData.trend,
      historical: stockData.historical,
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
