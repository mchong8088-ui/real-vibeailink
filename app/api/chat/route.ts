import { NextResponse } from 'next/server';

// Stock symbol to company name mapping
const COMPANY_NAMES: Record<string, string> = {
  // Taiwan stocks
  "2330.TW": "台灣積體電路製造股份有限公司 (TSMC)",
  "2454.TW": "聯發科技股份有限公司 (MediaTek)",
  "2317.TW": "鴻海精密工業股份有限公司 (Foxconn)",
  
  // Hong Kong stocks
  "0700.HK": "騰訊控股有限公司 (Tencent Holdings)",
  "1211.HK": "比亞迪股份有限公司 (BYD)",
  "0388.HK": "香港交易及結算所有限公司 (HKEX)",
  "0005.HK": "滙豐控股有限公司 (HSBC Holdings)",
  "9988.HK": "阿里巴巴集團控股有限公司 (Alibaba Group)",
  "3690.HK": "美團 (Meituan)",
  "1810.HK": "小米集團 (Xiaomi)",
  
  // US stocks
  "TSLA": "特斯拉公司 (Tesla, Inc.)",
  "AAPL": "蘋果公司 (Apple Inc.)",
  "NVDA": "英偉達公司 (NVIDIA Corporation)",
  "MSFT": "微軟公司 (Microsoft Corporation)",
  "AMZN": "亞馬遜公司 (Amazon.com, Inc.)",
  "GOOGL": "谷歌公司 (Alphabet Inc.)",
  "META": "Meta Platforms, Inc.",
  "AMD": "超微半導體公司 (Advanced Micro Devices, Inc.)",
};

function getCompanyName(symbol: string): string {
  return COMPANY_NAMES[symbol] || symbol;
}

// Simple stock symbol detection
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
    "比亞迪": "1211.HK", "比亚迪": "1211.HK", "BYD": "1211.HK",
  };
  
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (input.includes(name)) return symbol;
  }
  return null;
}

// Fetch news from Finnhub
async function fetchNews(symbol: string): Promise<Array<{title: string; summary: string; source: string}>> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];
    
    let finnhubSymbol = symbol;
    if (symbol.endsWith('.HK')) finnhubSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) finnhubSymbol = symbol.replace('.TW', '');
    
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    const url = `https://finnhub.io/api/v1/company-news?symbol=${finnhubSymbol}&from=${fromStr}&to=${toStr}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    
    return data.slice(0, 5).map((item: any) => ({
      title: item.headline || '',
      summary: item.summary || '',
      source: item.source || 'Financial News',
    }));
  } catch (err) {
    return [];
  }
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

// Determine trend
function determineTrend(prices: number[]): string {
  if (prices.length < 20) return 'Sideways';
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 * 1.02) return 'Bullish 📈';
  if (currentPrice < sma20 * 0.98) return 'Bearish 📉';
  return 'Sideways ➡️';
}

// Generate structured analysis with company name
function generateAnalysis(symbol: string, price: number, changePercent: number, rsi: number | null, trend: string, news: any[], userQuestion: string, language: string): string {
  const isCantonese = language === 'Cantonese';
  const isChinese = language === '简体中文';
  const companyName = getCompanyName(symbol);
  
  const rsiValue = rsi ? rsi.toFixed(1) : 'N/A';
  const rsiStatus = rsi ? (rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral') : 'N/A';
  const changeDirection = changePercent > 0 ? 'gain' : changePercent < 0 ? 'loss' : 'stable';
  const changeText = `${Math.abs(changePercent).toFixed(2)}%`;
  
  const newsText = news.length > 0 
    ? news.map(n => `- **${n.source}**: ${n.title.substring(0, 100)}`).join('\n')
    : 'No significant news for this stock recently.';
  
  if (isCantonese) {
    return `## 📊 ${symbol} - ${companyName}

### 1. 摘要
${companyName} (${symbol}) 目前股價為 $${price.toFixed(2)}，${changePercent > 0 ? '上升' : changePercent < 0 ? '下跌' : '持平'} ${changeText}。RSI 為 ${rsiValue}，處於 ${rsiStatus === 'Overbought' ? '超買' : rsiStatus === 'Oversold' ? '超賣' : '中性'} 水平。整體趨勢 ${trend === 'Bullish 📈' ? '看好' : trend === 'Bearish 📉' ? '看淡' : '橫向整理'}。

### 2. 技術分析
- **RSI(14)**: ${rsiValue} - ${rsiStatus === 'Overbought' ? '超買區間，可能出現回調' : rsiStatus === 'Oversold' ? '超賣區間，可能出現反彈' : '中性區間，動能平衡'}
- **趨勢**: ${trend}
- **解讀**: 股價目前處於${trend === 'Bullish 📈' ? '上升通道' : trend === 'Bearish 📉' ? '下降通道' : '區間震盪'}。

### 3. 基本面分析
需要關注公司即將公佈嘅業績報告同行業趨勢。投資者應留意收入增長、利潤率同估值水平。

### 4. 新聞情緒
${newsText}

### 5. 風險分析
- 市場整體波動風險
- 行業競爭加劇
- 宏觀經濟不確定性
- 監管政策變化

### 6. 看好理由
- ${rsi && rsi < 40 ? 'RSI處於超賣區間，技術性反彈可期' : '技術指標顯示中性，等待明確信號'}
- ${trend !== 'Bearish 📉' ? '趨勢未有明顯轉差' : '需等待趨勢改善'}

### 7. 看淡理由
- ${rsi && rsi > 60 ? 'RSI處於偏高水平，短期可能受壓' : '動能有待確認'}
- 市場情緒波動

### 8. 最終建議
**短期 (1-3個月)**: ${rsi && rsi < 30 ? '超賣區間，可小注博反彈' : rsi && rsi > 70 ? '超買區間，謹慎追高' : '中性觀望'}
**中期 (3-12個月)**: 關注業績表現，等待更好入市時機
**目標價區間**: $${(price * 0.95).toFixed(2)} - $${(price * 1.1).toFixed(2)}

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
  } else {
    return `## 📊 ${symbol} - ${companyName}

### 1. SUMMARY
${companyName} (${symbol}) is trading at $${price.toFixed(2)} with a ${changeDirection} of ${changeText}. RSI is at ${rsiValue} (${rsiStatus}). The overall trend is ${trend}.

### 2. TECHNICAL ANALYSIS
- **RSI(14)**: ${rsiValue} - ${rsiStatus === 'Overbought' ? 'Overbought territory, potential pullback' : rsiStatus === 'Oversold' ? 'Oversold territory, potential bounce' : 'Neutral zone, balanced momentum'}
- **Trend**: ${trend}
- **Interpretation**: Price is currently in ${trend === 'Bullish 📈' ? 'an uptrend' : trend === 'Bearish 📉' ? 'a downtrend' : 'a range-bound consolidation'}.

### 3. FUNDAMENTAL ANALYSIS
Monitor upcoming earnings reports and industry trends. Pay attention to revenue growth, profit margins, and valuation metrics.

### 4. NEWS SENTIMENT
${newsText}

### 5. RISK ANALYSIS
- Overall market volatility
- Increasing industry competition
- Macroeconomic uncertainty
- Regulatory changes

### 6. BULL CASE
- ${rsi && rsi < 40 ? 'RSI in oversold territory suggests potential technical bounce' : 'Technical indicators showing neutral, waiting for clear signals'}
- ${trend !== 'Bearish 📉' ? 'Trend remains constructive' : 'Wait for trend improvement'}

### 7. BEAR CASE
- ${rsi && rsi > 60 ? 'RSI at elevated levels, potential short-term pressure' : 'Momentum yet to confirm direction'}
- Market sentiment fluctuations

### 8. FINAL RECOMMENDATION
**Short-term (1-3 months)**: ${rsi && rsi < 30 ? 'Oversold - consider small position' : rsi && rsi > 70 ? 'Overbought - be cautious' : 'Neutral - watch'}
**Medium-term (3-12 months)**: Monitor earnings, wait for better entry points
**Price Target Range**: $${(price * 0.95).toFixed(2)} - $${(price * 1.1).toFixed(2)}

*⚠️ This analysis is for reference only. Not investment advice.*`;
  }
}

// Fetch stock data from Yahoo
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
    
    return {
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      closes: validCloses,
    };
  } catch (err) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message, language = 'EN', url } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    
    const symbol = detectStock(message);
    if (!symbol) {
      return NextResponse.json({
        success: false,
        summary: `Unable to detect stock symbol. Try: TSLA, 0700.HK, or 台積電`
      });
    }
    
    console.log(`📊 Symbol: ${symbol}`);
    
    const marketData = await fetchStockData(symbol);
    if (!marketData) {
      return NextResponse.json({
        success: false,
        summary: `Unable to fetch market data for ${symbol}. Please try again.`
      });
    }
    
    const rsi = calculateRSI(marketData.closes);
    const trend = determineTrend(marketData.closes);
    let news = await fetchNews(symbol);
    
    if (url) {
      news.unshift({
        title: `User-provided article for analysis`,
        summary: `URL: ${url.substring(0, 100)}...`,
        source: 'User Input',
      });
    }
    
    const analysis = generateAnalysis(symbol, marketData.price, marketData.changePercent, rsi, trend, news, message, language);
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: getCompanyName(symbol),
      price: marketData.price,
      changePercent: marketData.changePercent,
      rsi: rsi,
      trend: trend,
      summary: analysis,
      text: analysis,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      summary: "Service temporarily unavailable. Please try again."
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "API is running", timestamp: new Date().toISOString() });
}
