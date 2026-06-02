import { NextResponse } from 'next/server';

function detectStock(input: string): string | null {
  if (!input || input.trim() === '') return null;
  const cleanInput = input.trim().toUpperCase();
  
  // Direct symbol with suffix
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) return cleanInput;
  
  // 4-digit number -> Taiwan stock
  if (/^\d{4}$/.test(cleanInput)) return `${cleanInput}.TW`;
  
  // 5-digit number -> Taiwan stock  
  if (/^\d{5}$/.test(cleanInput)) return `${cleanInput}.TW`;
  
  // US stock symbols (1-5 letters)
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) return cleanInput;
  
  // Chinese name mapping
  const nameMap: Record<string, string> = {
    "台積電": "2330.TW", "台积电": "2330.TW", "TSMC": "2330.TW",
    "騰訊": "0700.HK", "腾讯": "0700.HK", "Tencent": "0700.HK",
    "特斯拉": "TSLA", "Tesla": "TSLA",
    "英偉達": "NVDA", "輝達": "NVDA", "NVIDIA": "NVDA",
    "蘋果": "AAPL", "苹果": "AAPL", "Apple": "AAPL",
    "微軟": "MSFT", "微软": "MSFT", "Microsoft": "MSFT",
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

async function fetchCompanyInfo(symbol: string): Promise<{ name: string; chineseName: string }> {
  // Common names mapping
  const commonNames: Record<string, { name: string; chineseName: string }> = {
    'LSCC': { name: 'Lattice Semiconductor Corporation', chineseName: '萊迪思半導體' },
    'NVDA': { name: 'NVIDIA Corporation', chineseName: '英偉達' },
    'AAPL': { name: 'Apple Inc.', chineseName: '蘋果' },
    'MSFT': { name: 'Microsoft Corporation', chineseName: '微軟' },
    'AMZN': { name: 'Amazon.com, Inc.', chineseName: '亞馬遜' },
    'GOOGL': { name: 'Alphabet Inc.', chineseName: '谷歌' },
    'TSLA': { name: 'Tesla, Inc.', chineseName: '特斯拉' },
    'META': { name: 'Meta Platforms, Inc.', chineseName: 'Meta' },
    'AMD': { name: 'Advanced Micro Devices, Inc.', chineseName: '超微半導體' },
    'INTC': { name: 'Intel Corporation', chineseName: '英特爾' },
    '0700.HK': { name: 'Tencent Holdings Limited', chineseName: '騰訊控股' },
    '2330.TW': { name: 'Taiwan Semiconductor Manufacturing Company Limited', chineseName: '台積電' },
  };
  
  if (commonNames[symbol]) return commonNames[symbol];
  
  // Try to fetch from Yahoo
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.TW')) yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = symbol;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const longName = data.chart?.result?.[0]?.meta?.longName;
      if (longName) {
        return { name: longName, chineseName: symbol };
      }
    }
  } catch (err) {
    // Fallback to symbol
  }
  
  return { name: symbol, chineseName: symbol };
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

async function fetchRealStockData(symbol: string) {
  try {
    let yahooSymbol = symbol;
    // Handle Taiwan stocks - keep as is
    if (symbol === '2330.TW') {
      yahooSymbol = '2330.TW';
    } else if (symbol.endsWith('.TW')) {
      yahooSymbol = symbol;
    } else if (symbol.endsWith('.HK')) {
      yahooSymbol = symbol;
    }
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    console.log(`📊 Fetching: ${url}`);
    
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.log(`❌ HTTP ${res.status} for ${symbol}`);
      return null;
    }
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      console.log(`❌ No result for ${symbol}`);
      return null;
    }
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    
    if (validCloses.length === 0) {
      console.log(`❌ No valid closes for ${symbol}`);
      return null;
    }
    
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    const timestamps = result.timestamp || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
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
    
    console.log(`✅ ${symbol}: ${currency}${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    
    return { price, changePercent, rsi, macd, trend, currency, historical };
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
        summary: `無法識別股票代號。請嘗試: 2330.TW, 0700.HK, TSLA`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    const [stockData, companyInfo] = await Promise.all([
      fetchRealStockData(symbol),
      fetchCompanyInfo(symbol)
    ]);
    
    if (!stockData) {
      return NextResponse.json({
        success: false,
        summary: `無法獲取 ${symbol} 的即時數據，請稍後再試。`
      });
    }
    
    const isPositive = stockData.changePercent >= 0;
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    const rsiStatus = stockData.rsi ? (stockData.rsi > 70 ? '超買' : stockData.rsi < 30 ? '超賣' : '中性') : '中性';
    const rsiInterpret = stockData.rsi ? (stockData.rsi > 70 ? '超買區間，短期可能回調' : stockData.rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '';
    const macdInterpret = stockData.macd === 'Bullish' ? '看漲信號，多頭動能增強' : stockData.macd === 'Bearish' ? '看跌信號，空頭動能增強' : '中性信號，方向未明';
    const trendText = stockData.trend === 'Uptrend' ? '上升通道' : stockData.trend === 'Downtrend' ? '下降通道' : '區間震盪';
    
    // Use Chinese name for display, avoid repetition
    const displayName = companyInfo.chineseName || companyInfo.name;
    
    // Plain text analysis - NO repetition of company name in section 1
    const analysis = `${displayName} (${symbol}) 投資分析

1. 摘要
目前股價為 ${stockData.currency}${stockData.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%。RSI為${rsiText}，處於${rsiStatus}水平。整體趨勢${stockData.trend === 'Uptrend' ? '看好' : stockData.trend === 'Downtrend' ? '看淡' : '橫向整理'}。

2. 技術分析
RSI(14): ${rsiText} - ${rsiInterpret}
MACD: ${stockData.macd} - ${macdInterpret}
趨勢: ${trendText}

3. 基本面分析
${displayName}作為${symbol.includes('TW') ? '全球晶圓代工龍頭' : symbol.includes('HK') ? '互聯網巨頭' : '科技公司'}，財務狀況穩健。

4. 新聞與風險分析
近期市場關注全球經濟走勢及行業政策變化。主要風險包括宏觀經濟不確定性、市場競爭加劇及監管政策變化。

5. 看好因素
1. 行業龍頭地位穩固
2. 技術領先優勢明顯
3. 長期增長趨勢不變

6. 看淡因素
1. 市場競爭加劇
2. 宏觀經濟不確定性
3. 短線漲多可能回調

7. 買賣建議
理想買入區間: ${stockData.currency}${(stockData.price * 0.95).toFixed(2)} - ${stockData.currency}${stockData.price.toFixed(2)}
短期目標價: ${stockData.currency}${(stockData.price * 1.08).toFixed(2)}
中期目標價: ${stockData.currency}${(stockData.price * 1.15).toFixed(2)}
止蝕位: ${stockData.currency}${(stockData.price * 0.92).toFixed(2)}

8. 最終建議及信心評分
建議: ${stockData.rsi && stockData.rsi < 35 ? '分批買入' : stockData.rsi && stockData.rsi > 65 ? '分批獲利' : '持有觀望'}
信心評分: ${stockData.rsi ? (stockData.rsi < 35 ? 75 : stockData.rsi > 65 ? 65 : 70) : 70}%

以上分析僅供參考，不構成投資建議。`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: displayName,
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
