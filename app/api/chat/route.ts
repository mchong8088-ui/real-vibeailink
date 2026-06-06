// /app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { detectStock, extractStockFromQuestion, isQuestion, STOCK_ALIASES } from '@/app/lib/market/stockDetector';
import { getFundamentals } from '@/app/lib/market/fundamentals';
import { getNews } from '@/app/lib/market/news';
import { getSentiment, analyzeTextSentiment } from '@/app/lib/market/sentiment';

// Get Chinese name from STOCK_ALIASES dynamically
function getChineseNameFromSymbol(symbol: string): string | null {
  for (const [name, sym] of Object.entries(STOCK_ALIASES)) {
    if (sym === symbol && !name.match(/^[A-Z]+$/)) {
      return name;
    }
  }
  return null;
}

async function fetchCompanyInfo(symbol: string): Promise<{ name: string; chineseName: string }> {
  const chineseNameFromAlias = getChineseNameFromSymbol(symbol);
  
  // First, try to get from Yahoo Finance
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) {
      yahooSymbol = symbol.replace('.HK', '');
    }
    if (symbol.endsWith('.TW')) {
      yahooSymbol = symbol.replace('.TW', '');
    }
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      const result = data.chart?.result?.[0];
      const meta = result?.meta;
      let longName = meta?.longName || meta?.shortName || null;
      
      if (longName) {
        let chineseName = chineseNameFromAlias;
        if (!chineseName && longName) {
          chineseName = longName;
        }
        console.log(`✅ Found company: ${longName} (${symbol})`);
        return { 
          name: longName, 
          chineseName: chineseName || longName
        };
      }
    }
  } catch (err) {
    console.log('Error fetching company info from Yahoo:', err);
  }
  
  // Fallback: Try quoteSummary
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) yahooSymbol = symbol.replace('.TW', '');
    
    const quoteUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=price,summaryProfile`;
    const quoteRes = await fetch(quoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (quoteRes.ok) {
      const quoteData = await quoteRes.json();
      const longName = quoteData?.quoteSummary?.result?.[0]?.price?.longName ||
                       quoteData?.quoteSummary?.result?.[0]?.price?.shortName;
      
      if (longName) {
        console.log(`✅ Found company via quoteSummary: ${longName} (${symbol})`);
        return { 
          name: longName, 
          chineseName: chineseNameFromAlias || longName
        };
      }
    }
  } catch (err) {
    console.log('Error fetching from quoteSummary:', err);
  }
  
  return { 
    name: symbol, 
    chineseName: chineseNameFromAlias || symbol 
  };
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
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`;
    console.log(`📊 Fetching: ${url}`);
    
    const res = await fetch(url, { 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 60 } 
    });
    
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
    const previousClose = meta.previousClose || validCloses[validCloses.length - 2] || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    const dayLow = meta.regularMarketDayLow || null;
    const dayHigh = meta.regularMarketDayHigh || null;
    
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    const sma20 = validCloses.length >= 20 
      ? validCloses.slice(-20).reduce((a, b) => a + b, 0) / 20 
      : null;
    const sma50 = validCloses.length >= 50 
      ? validCloses.slice(-50).reduce((a, b) => a + b, 0) / 50 
      : null;
    
    let volatility = null;
    if (validCloses.length > 1) {
      const returns = [];
      for (let i = 1; i < validCloses.length; i++) {
        returns.push((validCloses[i] - validCloses[i - 1]) / validCloses[i - 1]);
      }
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      volatility = Math.sqrt(variance) * Math.sqrt(252);
    }
    
    const volumes_data = result.indicators?.quote?.[0]?.volume || [];
    const validVolumes = volumes_data.filter((v: number) => v !== null && v > 0);
    const avgVolume = validVolumes.length > 0 
      ? validVolumes.reduce((a: number, b: number) => a + b, 0) / validVolumes.length 
      : null;
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    const timestamps = result.timestamp || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
    const opens = result.indicators?.quote?.[0]?.open || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];
    
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] && closes[i] && closes[i] > 0) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: closes[i],
          open: opens[i] || null,
          high: highs[i] || null,
          low: lows[i] || null,
          volume: volumes[i] || 0,
        });
      }
    }
    
    console.log(`✅ ${symbol}: ${currency}${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%) - ${historical.length} data points`);
    
    return { 
      price, 
      changePercent,
      previousClose,
      dayLow,
      dayHigh,
      rsi, 
      macd, 
      trend, 
      currency, 
      historical,
      sma20,
      sma50,
      volatility,
      avgVolume,
      volume: meta.regularMarketVolume || 0
    };
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err);
    return null;
  }
}

// Function to extract and clean content from URL
async function extractUrlContent(url: string): Promise<{ title: string; content: string; cleanText: string }> {
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const html = await res.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&[a-z]+;/gi, ' ');
    text = text.trim();
    
    const sentences = text.split(/[.!?]+/);
    const meaningfulSentences = sentences.filter(s => 
      s.trim().length > 50 && 
      !s.includes('cookie') && 
      !s.includes('privacy') &&
      !s.includes('subscribe') &&
      !s.includes('newsletter')
    );
    
    const cleanText = meaningfulSentences.slice(0, 10).join('. ') + '.';
    
    return { title, content: text.substring(0, 3000), cleanText: cleanText.substring(0, 1000) };
  } catch (err) {
    console.error('Error extracting URL content:', err);
    return { title: 'Unable to fetch content', content: '', cleanText: '' };
  }
}

// Simple translation function
function simpleTranslate(text: string, targetLang: string): string {
  if (targetLang === 'English') return text;
  
  const translations: Record<string, Record<string, string>> = {
    'Cantonese': {
      'Stock': '股票',
      'share': '股份',
      'price': '股價',
      'market': '市場',
      'AI': '人工智能',
      'IPO': '首次公開募股',
      'target': '目標',
      'billion': '十億',
      'trillion': '萬億',
      'Tesla': '特斯拉',
      'SpaceX': '太空探索',
      'race': '競賽',
      'heat up': '升溫',
      'rally': '反彈',
      'surge': '急升',
      'decline': '下跌',
      'profit': '利潤',
      'revenue': '收入',
      'growth': '增長',
      'forecast': '預測',
      'analysis': '分析',
    },
    '简体中文': {
      'Stock': '股票',
      'share': '股份',
      'price': '股价',
      'market': '市场',
      'AI': '人工智能',
      'IPO': '首次公开募股',
      'target': '目标',
      'billion': '十亿',
      'trillion': '万亿',
      'Tesla': '特斯拉',
      'SpaceX': '太空探索',
      'race': '竞赛',
      'heat up': '升温',
      'rally': '反弹',
      'surge': '急升',
      'decline': '下跌',
      'profit': '利润',
      'revenue': '收入',
      'growth': '增长',
      'forecast': '预测',
      'analysis': '分析',
    }
  };
  
  let translated = text;
  const dict = translations[targetLang];
  if (dict) {
    for (const [eng, chn] of Object.entries(dict)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      translated = translated.replace(regex, chn);
    }
  }
  
  return translated;
}

// Generate a summary of the content
function generateSummary(content: string, maxLength: number = 300): string {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  let summary = '';
  
  for (const sentence of sentences) {
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence;
    } else {
      break;
    }
  }
  
  return summary.trim() || content.substring(0, maxLength);
}

// Function to extract user content
async function extractUserContent(userContent: string, targetLang: string): Promise<{ 
  type: string; 
  originalContent: string; 
  translatedContent: string; 
  summary: string;
  title: string;
  sentiment: any;
}> {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  
  let title = '';
  let originalContent = '';
  let cleanText = '';
  
  if (urlPattern.test(userContent)) {
    const extracted = await extractUrlContent(userContent);
    title = extracted.title;
    originalContent = extracted.cleanText || extracted.content;
    cleanText = extracted.cleanText;
  } else {
    title = 'User Provided Text';
    originalContent = userContent;
    cleanText = userContent;
  }
  
  const summary = generateSummary(cleanText, 300);
  
  let translatedContent = originalContent;
  if (targetLang !== 'English') {
    translatedContent = simpleTranslate(originalContent, targetLang);
  }
  
  const sentiment = analyzeTextSentiment(originalContent);
  
  return {
    type: urlPattern.test(userContent) ? 'url' : 'text',
    originalContent,
    translatedContent,
    summary,
    title,
    sentiment
  };
}

// Generate specific, honest analysis based on actual stock data
function generateSpecificAnalysis(stockData: any, fundamentals: any, symbol: string, language: string): {
  stockQuality: 'excellent' | 'good' | 'average' | 'poor' | 'very-poor';
  qualityReason: string;
  specificBullishFactors: string[];
  specificBearishFactors: string[];
  specificRecommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  targetPrice: number;
  stopLoss: number;
  confidenceScore: number;
  confidenceRating: string;
  confidenceEmoji: string;
} {
  const price = stockData.price;
  const rsi = stockData.rsi;
  const trend = stockData.trend;
  const macd = stockData.macd;
  const volatility = stockData.volatility;
  const pe = fundamentals?.peRatio;
  const revenueGrowth = fundamentals?.revenueGrowth;
  const profitMargin = fundamentals?.profitMargin;
  const debtRatio = fundamentals?.debtRatio;
  
  let stockQuality: 'excellent' | 'good' | 'average' | 'poor' | 'very-poor' = 'average';
  let qualityReason = '';
  const specificBullishFactors: string[] = [];
  const specificBearishFactors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'medium';
  
  // Analyze based on price (penny stock detection - ONLY for HK stocks)
  if (symbol.endsWith('.HK') && price < 0.5) {
    stockQuality = 'very-poor';
    riskLevel = 'extreme';
    qualityReason = language === 'Cantonese' ? '仙股，股價低於0.5港元，風險極高' :
                    language === '简体中文' ? '仙股，股价低于0.5港元，风险极高' :
                    'Penny stock below HKD 0.5, extremely high risk';
    
    specificBearishFactors.push(
      language === 'Cantonese' ? '• 股價處於仙股水平，存在除牌風險' : 
      language === '简体中文' ? '• 股价处于仙股水平，存在退市风险' :
      '• Stock price at penny stock level, delisting risk'
    );
    specificBearishFactors.push(
      language === 'Cantonese' ? '• 流動性極差，買賣差價大，難以成交' :
      language === '简体中文' ? '• 流动性极差，买卖差价大，难以成交' :
      '• Extremely poor liquidity, wide bid-ask spread'
    );
  } else if (symbol.endsWith('.HK') && price < 1) {
    stockQuality = 'poor';
    riskLevel = 'high';
    qualityReason = language === 'Cantonese' ? '低價股，股價低於1港元，風險較高' :
                    language === '简体中文' ? '低价股，股价低于1港元，风险较高' :
                    'Low-priced stock below HKD 1, high risk';
    
    specificBearishFactors.push(
      language === 'Cantonese' ? '• 低價股波動性大，適合短線投機' :
      language === '简体中文' ? '• 低价股波动性大，适合短线投机' :
      '• Low-priced stocks have high volatility, suitable for speculation'
    );
  }
  
  // Analyze based on RSI
  if (rsi !== null) {
    if (rsi < 25) {
      specificBullishFactors.push(
        language === 'Cantonese' ? `• RSI處於${rsi.toFixed(1)}極度超賣水平，技術性反彈機會增加` :
        language === '简体中文' ? `• RSI处于${rsi.toFixed(1)}极度超卖水平，技术性反弹机会增加` :
        `• RSI at ${rsi.toFixed(1)} - extremely oversold, technical rebound likely`
      );
    } else if (rsi > 75) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• RSI處於${rsi.toFixed(1)}超買水平，短期回調風險增加` :
        language === '简体中文' ? `• RSI处于${rsi.toFixed(1)}超买水平，短期回调风险增加` :
        `• RSI at ${rsi.toFixed(1)} - overbought, pullback risk increasing`
      );
    }
  }
  
  // Analyze based on trend and MACD
  if (trend === 'Downtrend' && macd === 'Bearish') {
    specificBearishFactors.push(
      language === 'Cantonese' ? '• 技術面雙重看淡信號（下降通道 + MACD看淡）' :
      language === '简体中文' ? '• 技术面双重看淡信号（下降通道 + MACD看淡）' :
      '• Double bearish technical signals (Downtrend + Bearish MACD)'
    );
    if (stockQuality !== 'very-poor') stockQuality = 'poor';
  } else if (trend === 'Uptrend' && macd === 'Bullish') {
    specificBullishFactors.push(
      language === 'Cantonese' ? '• 技術面雙重看好信號（上升通道 + MACD看好）' :
      language === '简体中文' ? '• 技术面双重看好信号（上升通道 + MACD看好）' :
      '• Double bullish technical signals (Uptrend + Bullish MACD)'
    );
  }
  
  // Analyze based on fundamentals
  if (pe !== null) {
    if (pe > 50) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 市盈率${pe.toFixed(1)}倍，估值過高，泡沫風險` :
        language === '简体中文' ? `• 市盈率${pe.toFixed(1)}倍，估值过高，泡沫风险` :
        `• P/E ratio of ${pe.toFixed(1)}x - overvalued, bubble risk`
      );
    } else if (pe < 8 && pe > 0) {
      specificBullishFactors.push(
        language === 'Cantonese' ? `• 市盈率${pe.toFixed(1)}倍，估值偏低，價值吸引` :
        language === '简体中文' ? `• 市盈率${pe.toFixed(1)}倍，估值偏低，价值吸引` :
        `• P/E ratio of ${pe.toFixed(1)}x - undervalued, attractive valuation`
      );
    } else if (pe < 0) {
      specificBearishFactors.push(
        language === 'Cantonese' ? '• 公司錄得虧損，盈利能力成疑' :
        language === '简体中文' ? '• 公司录得亏损，盈利能力成疑' :
        '• Company is loss-making, profitability questionable'
      );
    }
  }
  
  // Analyze revenue growth
  if (revenueGrowth !== null) {
    if (revenueGrowth > 20) {
      specificBullishFactors.push(
        language === 'Cantonese' ? `• 收入增長${revenueGrowth.toFixed(1)}%，增長強勁` :
        language === '简体中文' ? `• 收入增长${revenueGrowth.toFixed(1)}%，增长强劲` :
        `• Revenue growth of ${revenueGrowth.toFixed(1)}% - strong growth`
      );
    } else if (revenueGrowth < 0) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 收入負增長${Math.abs(revenueGrowth).toFixed(1)}%，業務收縮` :
        language === '简体中文' ? `• 收入负增长${Math.abs(revenueGrowth).toFixed(1)}%，业务收缩` :
        `• Negative revenue growth of ${Math.abs(revenueGrowth).toFixed(1)}% - business contraction`
      );
    }
  }
  
  // Analyze profit margin
  if (profitMargin !== null) {
    if (profitMargin > 30) {
      specificBullishFactors.push(
        language === 'Cantonese' ? `• 利潤率${profitMargin.toFixed(1)}%，盈利能力優秀` :
        language === '简体中文' ? `• 利润率${profitMargin.toFixed(1)}%，盈利能力优秀` :
        `• Profit margin of ${profitMargin.toFixed(1)}% - excellent profitability`
      );
    } else if (profitMargin < 5 && profitMargin > 0) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 利潤率僅${profitMargin.toFixed(1)}%，盈利能力薄弱` :
        language === '简体中文' ? `• 利润率仅${profitMargin.toFixed(1)}%，盈利能力薄弱` :
        `• Profit margin of only ${profitMargin.toFixed(1)}% - weak profitability`
      );
    } else if (profitMargin < 0) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 處於虧損狀態，利潤率${profitMargin.toFixed(1)}%` :
        language === '简体中文' ? `• 处于亏损状态，利润率${profitMargin.toFixed(1)}%` :
        `• In loss position with margin of ${profitMargin.toFixed(1)}%`
      );
    }
  }
  
  // Analyze debt
  if (debtRatio !== null) {
    if (debtRatio > 100) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 負債權益比${debtRatio.toFixed(1)}%，負債水平偏高，財務風險大` :
        language === '简体中文' ? `• 负债权益比${debtRatio.toFixed(1)}%，负债水平偏高，财务风险大` :
        `• Debt/Equity ratio of ${debtRatio.toFixed(1)}% - high debt level, significant financial risk`
      );
    } else if (debtRatio < 20 && debtRatio > 0) {
      specificBullishFactors.push(
        language === 'Cantonese' ? `• 負債權益比${debtRatio.toFixed(1)}%，負債水平健康` :
        language === '简体中文' ? `• 负债权益比${debtRatio.toFixed(1)}%，负债水平健康` :
        `• Debt/Equity ratio of ${debtRatio.toFixed(1)}% - healthy debt level`
      );
    }
  }
  
  // Analyze volatility
  if (volatility !== null) {
    if (volatility > 0.6) {
      riskLevel = 'high';
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 年化波動率${(volatility * 100).toFixed(1)}%，股價波動劇烈` :
        language === '简体中文' ? `• 年化波动率${(volatility * 100).toFixed(1)}%，股价波动剧烈` :
        `• Annualized volatility of ${(volatility * 100).toFixed(1)}% - extremely volatile`
      );
    } else if (volatility > 0.4) {
      specificBearishFactors.push(
        language === 'Cantonese' ? `• 波動率${(volatility * 100).toFixed(1)}%，風險中等偏高` :
        language === '简体中文' ? `• 波动率${(volatility * 100).toFixed(1)}%，风险中等偏高` :
        `• Volatility of ${(volatility * 100).toFixed(1)}% - moderately high risk`
      );
    }
  }
  
  // If no specific factors found, add generic ones
  if (specificBullishFactors.length === 0) {
    if (trend === 'Uptrend') {
      specificBullishFactors.push(
        language === 'Cantonese' ? '• 處於上升通道，技術面偏強' :
        language === '简体中文' ? '• 处于上升通道，技术面偏强' :
        '• In uptrend channel, technical outlook positive'
      );
    }
  }
  
  if (specificBearishFactors.length === 0) {
    if (trend === 'Downtrend') {
      specificBearishFactors.push(
        language === 'Cantonese' ? '• 處於下降通道，技術面偏弱' :
        language === '简体中文' ? '• 处于下降通道，技术面偏弱' :
        '• In downtrend channel, technical outlook negative'
      );
    }
  }
  
  // Calculate quality score for excellent/good classification
  let qualityScore = 0;
  if (pe !== null && pe >= 10 && pe <= 40) qualityScore += 1;
  if (revenueGrowth !== null && revenueGrowth > 15) qualityScore += 2;
  if (profitMargin !== null && profitMargin > 15) qualityScore += 2;
  if (debtRatio !== null && debtRatio < 40) qualityScore += 1;
  if (trend === 'Uptrend') qualityScore += 1;
  if (macd === 'Bullish') qualityScore += 1;
  
  if (qualityScore >= 6) {
    stockQuality = 'excellent';
  } else if (qualityScore >= 4) {
    stockQuality = 'good';
  } else if (qualityScore >= 2) {
    stockQuality = 'average';
  } else if (qualityScore >= 1) {
    stockQuality = 'poor';
  } else {
    stockQuality = 'very-poor';
  }
  
  // Override for penny stocks
  if (symbol.endsWith('.HK') && price < 0.5) {
    stockQuality = 'very-poor';
  } else if (symbol.endsWith('.HK') && price < 1) {
    stockQuality = 'poor';
  }
  
  // Determine recommendation
  let specificRecommendation = '';
  let targetPrice = price;
  let stopLoss = price;
  
  if (stockQuality === 'very-poor') {
    specificRecommendation = language === 'Cantonese' ? '強烈建議：避開此股票，風險極高，不適合長線持有' :
                              language === '简体中文' ? '强烈建议：避开此股票，风险极高，不适合长线持有' :
                              'STRONG AVOID: Extremely high risk, not suitable for long-term holding';
    targetPrice = price * 0.9;
    stopLoss = price * 0.85;
  } else if (stockQuality === 'poor') {
    specificRecommendation = language === 'Cantonese' ? '建議：謹慎操作，僅適合短線投機，嚴格控制止蝕' :
                              language === '简体中文' ? '建议：谨慎操作，仅适合短线投机，严格控制止损' :
                              'CAUTION: Speculative only, strict stop loss required';
    targetPrice = price * 1.05;
    stopLoss = price * 0.92;
  } else if (rsi !== null && rsi < 30) {
    specificRecommendation = language === 'Cantonese' ? '建議：超賣區間，可小注買入博反彈，嚴守止蝕' :
                              language === '简体中文' ? '建议：超卖区间，可小注买入博反弹，严守止损' :
                              'BUY on dips: Oversold zone, accumulate gradually with stop loss';
    targetPrice = price * 1.12;
    stopLoss = price * 0.92;
  } else if (rsi !== null && rsi > 70) {
    specificRecommendation = language === 'Cantonese' ? '建議：超買區間，分批獲利，不宜追高' :
                              language === '简体中文' ? '建议：超买区间，分批获利，不宜追高' :
                              'TAKE PROFIT: Overbought zone, reduce position gradually';
    targetPrice = price * 1.03;
    stopLoss = price * 0.96;
  } else if (stockQuality === 'excellent' || stockQuality === 'good') {
    specificRecommendation = language === 'Cantonese' ? '建議：基本面良好，可長期持有，逢低買入' :
                              language === '简体中文' ? '建议：基本面良好，可长期持有，逢低买入' :
                              'ACCUMULATE: Strong fundamentals, suitable for long-term holding';
    targetPrice = price * 1.15;
    stopLoss = price * 0.92;
  } else {
    specificRecommendation = language === 'Cantonese' ? '建議：持有觀望，等待更明確信號' :
                              language === '简体中文' ? '建议：持有观望，等待更明确信号' :
                              'HOLD: Wait for clearer signals';
    targetPrice = price * 1.08;
    stopLoss = price * 0.94;
  }
  
  // CONFIDENCE SCORE CALCULATION
  let confidenceScore = 50;
  
  // Technical factors
  let technicalScore = 0;
  if (trend === 'Uptrend' && macd === 'Bullish') {
    technicalScore += 30;
  } else if (trend === 'Uptrend' && macd === 'Bearish') {
    technicalScore += 5;
  } else if (trend === 'Downtrend' && macd === 'Bearish') {
    technicalScore -= 25;
  } else if (trend === 'Downtrend' && macd === 'Bullish') {
    technicalScore -= 5;
  } else if (trend === 'Uptrend') {
    technicalScore += 15;
  } else if (trend === 'Downtrend') {
    technicalScore -= 15;
  }
  
  // RSI adjustment
  if (rsi !== null) {
    if (rsi >= 40 && rsi <= 60) {
      technicalScore += 10;
    } else if (rsi >= 30 && rsi <= 70) {
      technicalScore += 5;
    } else if (rsi < 25) {
      technicalScore -= 15;
    } else if (rsi > 75) {
      technicalScore -= 15;
    } else if (rsi < 30) {
      technicalScore -= 5;
    } else if (rsi > 70) {
      technicalScore -= 10;
    }
  }
  
  confidenceScore += technicalScore;
  
  // Fundamental factors
  let fundamentalScore = 0;
  
  if (pe !== null) {
    if (pe >= 10 && pe <= 20) {
      fundamentalScore += 15;
    } else if (pe > 20 && pe <= 30) {
      fundamentalScore += 10;
    } else if (pe > 30 && pe <= 45) {
      fundamentalScore += 0;
    } else if (pe > 45 && pe <= 60) {
      fundamentalScore -= 10;
    } else if (pe > 60) {
      fundamentalScore -= 15;
    } else if (pe < 10 && pe > 0) {
      fundamentalScore += 10;
    } else if (pe < 0) {
      fundamentalScore -= 20;
    }
  }
  
  if (revenueGrowth !== null) {
    if (revenueGrowth > 25) {
      fundamentalScore += 20;
    } else if (revenueGrowth > 15) {
      fundamentalScore += 12;
    } else if (revenueGrowth > 8) {
      fundamentalScore += 5;
    } else if (revenueGrowth > 0) {
      fundamentalScore += 0;
    } else if (revenueGrowth < 0 && revenueGrowth >= -10) {
      fundamentalScore -= 10;
    } else if (revenueGrowth < -10) {
      fundamentalScore -= 20;
    }
  }
  
  if (profitMargin !== null) {
    if (profitMargin > 25) {
      fundamentalScore += 15;
    } else if (profitMargin > 15) {
      fundamentalScore += 10;
    } else if (profitMargin > 8) {
      fundamentalScore += 5;
    } else if (profitMargin > 0) {
      fundamentalScore -= 5;
    } else if (profitMargin < 0) {
      fundamentalScore -= 20;
    }
  }
  
  if (debtRatio !== null) {
    if (debtRatio < 30) {
      fundamentalScore += 10;
    } else if (debtRatio < 50) {
      fundamentalScore += 5;
    } else if (debtRatio > 70) {
      fundamentalScore -= 15;
    } else if (debtRatio > 50) {
      fundamentalScore -= 5;
    }
  }
  
  confidenceScore += fundamentalScore;
  
  // Volatility adjustment
  if (volatility !== null) {
    if (volatility > 0.6) {
      confidenceScore -= 15;
    } else if (volatility > 0.45) {
      confidenceScore -= 8;
    } else if (volatility > 0.3) {
      confidenceScore -= 3;
    } else if (volatility < 0.2) {
      confidenceScore += 5;
    }
  }
  
  // Quality adjustment
  if (stockQuality === 'excellent') {
    confidenceScore += 5;
  } else if (stockQuality === 'good') {
    confidenceScore += 0;
  } else if (stockQuality === 'average') {
    confidenceScore -= 5;
  } else if (stockQuality === 'poor') {
    confidenceScore -= 15;
  } else if (stockQuality === 'very-poor') {
    confidenceScore -= 25;
  }
  
  confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));
  
  // Map confidence score to rating
  let confidenceRating = '';
  let confidenceEmoji = '';
  if (confidenceScore >= 80) {
    confidenceRating = language === 'Cantonese' ? '非常高' : language === '简体中文' ? '非常高' : 'Very High';
    confidenceEmoji = '⭐⭐⭐⭐⭐';
  } else if (confidenceScore >= 65) {
    confidenceRating = language === 'Cantonese' ? '高' : language === '简体中文' ? '高' : 'High';
    confidenceEmoji = '⭐⭐⭐⭐';
  } else if (confidenceScore >= 50) {
    confidenceRating = language === 'Cantonese' ? '中等' : language === '简体中文' ? '中等' : 'Medium';
    confidenceEmoji = '⭐⭐⭐';
  } else if (confidenceScore >= 35) {
    confidenceRating = language === 'Cantonese' ? '低' : language === '简体中文' ? '低' : 'Low';
    confidenceEmoji = '⭐⭐';
  } else {
    confidenceRating = language === 'Cantonese' ? '極低' : language === '简体中文' ? '极低' : 'Very Low';
    confidenceEmoji = '⭐';
  }
  
  return {
    stockQuality,
    qualityReason,
    specificBullishFactors,
    specificBearishFactors,
    specificRecommendation,
    riskLevel,
    targetPrice,
    stopLoss,
    confidenceScore,
    confidenceRating,
    confidenceEmoji
  };
}

export async function POST(req: Request) {
  try {
    const { message, language = 'English', userContent = null } = await req.json();
    console.log(`Query: ${message}, Language: ${language}, UserContent: ${userContent ? 'Yes' : 'No'}`);
    
    const symbol = detectStock(message);
    
    if (!symbol || symbol === '') {
      let errorMsg = '';
      if (language === 'Cantonese') {
        errorMsg = '無法識別股票代號。請嘗試: 台積電, 騰訊, 特斯拉, 或直接輸入代號如 2330.TW, 0700.HK, TSLA';
      } else if (language === '简体中文') {
        errorMsg = '无法识别股票代码。请尝试: 台积电, 腾讯, 特斯拉, 或直接输入代码如 2330.TW, 0700.HK, TSLA';
      } else {
        errorMsg = 'Unable to recognize stock symbol. Please try: 2330.TW, 0700.HK, TSLA';
      }
      return NextResponse.json({
        success: false,
        summary: errorMsg,
        text: errorMsg
      });
    }
    
    console.log(`Detected symbol: ${symbol}`);
    
    const isUserQuestion = isQuestion(message);
    
    // Fetch stock data and company info first
    const [stockData, companyInfo] = await Promise.all([
      fetchRealStockData(symbol),
      fetchCompanyInfo(symbol)
    ]);
    
    if (!stockData) {
      let errorMsg = '';
      if (language === 'Cantonese') {
        errorMsg = `無法獲取 ${symbol} 的即時數據，請稍後再試。`;
      } else if (language === '简体中文') {
        errorMsg = `无法获取 ${symbol} 的实时数据，请稍后再试。`;
      } else {
        errorMsg = `Unable to fetch real-time data for ${symbol}. Please try again.`;
      }
      return NextResponse.json({
        success: false,
        summary: errorMsg,
        text: errorMsg
      });
    }
    
    // Then fetch fundamentals and news with company name
    const [fundamentals, news] = await Promise.all([
      getFundamentals(symbol),
      getNews(symbol, companyInfo.name || symbol, language)
    ]);
    
    // Process user-provided content if any
    let userContentAnalysis = null;
    let newsSentiment = null;
    
    if (userContent) {
      userContentAnalysis = await extractUserContent(userContent, language);
      console.log(`User content analyzed: ${userContentAnalysis.type}, Title: ${userContentAnalysis.title}`);
    }
    
    // Analyze news sentiment
    if (news && news.length > 0) {
      newsSentiment = getSentiment(news);
      console.log(`News sentiment: ${newsSentiment.sentiment}, Score: ${newsSentiment.score}`);
    }
    
    // Generate specific analysis based on actual data
    const specificAnalysis = generateSpecificAnalysis(stockData, fundamentals, symbol, language);
    
    // Adjust confidence score based on news sentiment
    if (newsSentiment) {
      if (newsSentiment.sentiment === 'Positive') {
        specificAnalysis.confidenceScore = Math.min(100, specificAnalysis.confidenceScore + 5);
      } else if (newsSentiment.sentiment === 'Negative') {
        specificAnalysis.confidenceScore = Math.max(0, specificAnalysis.confidenceScore - 10);
      }
    }
    
    const isPositive = stockData.changePercent >= 0;
    const changePercentText = stockData.changePercent ? `${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%` : 'N/A';
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    
    // Language-specific text with numbered sections
    let rsiStatus = '';
    let rsiInterpret = '';
    let macdText = '';
    let macdInterpret = '';
    let trendText = '';
    let analysisTitle = '';
    let summaryTitle = '';
    let technicalTitle = '';
    let fundamentalsTitle = '';
    let newsTitle = '';
    let bullishTitle = '';
    let bearishTitle = '';
    let tradingAdviceTitle = '';
    let finalAdviceTitle = '';
    let disclaimer = '';
    let userContentTitle = '';
    let sentimentTitle = '';
    let summaryOfContent = '';
    let keyPointsTitle = '';
    let riskLevelTitle = '';
    
    // Summary section labels
    let currentPriceLabel = '';
    let dailyChangeLabel = '';
    let dayRangeLabel = '';
    let rsiLabel = '';
    let overallTrendLabel = '';
    
    // Technical section labels
    let macdLabel = '';
    let trendLabel = '';
    let sma20Label = '';
    let sma50Label = '';
    let volatilityLabel = '';
    let avgVolumeLabel = '';
    
    if (language === 'Cantonese') {
      rsiStatus = stockData.rsi ? (stockData.rsi > 70 ? '超買' : stockData.rsi < 30 ? '超賣' : '中性') : '中性';
      rsiInterpret = stockData.rsi ? (stockData.rsi > 70 ? '超買區間，短期可能回調' : stockData.rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '';
      macdText = stockData.macd === 'Bullish' ? '看好' : stockData.macd === 'Bearish' ? '看淡' : '中性';
      macdInterpret = stockData.macd === 'Bullish' ? '看好信號，多頭動能增強' : stockData.macd === 'Bearish' ? '看淡信號，空頭動能增強' : '中性信號，方向未明';
      trendText = stockData.trend === 'Uptrend' ? '上升通道' : stockData.trend === 'Downtrend' ? '下降通道' : '區間震盪';
      
      analysisTitle = '投資分析';
      summaryTitle = '1. 摘要';
      technicalTitle = '2. 技術分析';
      fundamentalsTitle = '3. 基本面分析';
      newsTitle = '4. 新聞與風險分析';
      bullishTitle = '5. 看好因素';
      bearishTitle = '6. 看淡因素';
      tradingAdviceTitle = '7. 買賣建議';
      finalAdviceTitle = '8. 最終建議及風險評級';
      disclaimer = '⚠️ 以上分析僅供參考，不構成投資建議。';
      userContentTitle = '用戶提供的新聞/內容分析';
      sentimentTitle = '市場情緒分析';
      summaryOfContent = '內容摘要';
      keyPointsTitle = '關鍵要點';
      riskLevelTitle = '風險評級';
      
      currentPriceLabel = '目前股價';
      dailyChangeLabel = '日漲跌幅';
      dayRangeLabel = '日內波幅';
      rsiLabel = 'RSI';
      overallTrendLabel = '整體趨勢';
      
      macdLabel = 'MACD';
      trendLabel = '趨勢';
      sma20Label = 'SMA20';
      sma50Label = 'SMA50';
      volatilityLabel = '波動率';
      avgVolumeLabel = '平均成交量';
      
    } else if (language === '简体中文') {
      rsiStatus = stockData.rsi ? (stockData.rsi > 70 ? '超买' : stockData.rsi < 30 ? '超卖' : '中性') : '中性';
      rsiInterpret = stockData.rsi ? (stockData.rsi > 70 ? '超买区间，短期可能回调' : stockData.rsi < 30 ? '超卖区间，可能出现反弹' : '中性区间，动能平衡') : '';
      macdText = stockData.macd === 'Bullish' ? '看好' : stockData.macd === 'Bearish' ? '看淡' : '中性';
      macdInterpret = stockData.macd === 'Bullish' ? '看好信号，多头动能增强' : stockData.macd === 'Bearish' ? '看淡信号，空头动能增强' : '中性信号，方向未明';
      trendText = stockData.trend === 'Uptrend' ? '上升通道' : stockData.trend === 'Downtrend' ? '下降通道' : '区间震荡';
      
      analysisTitle = '投资分析';
      summaryTitle = '1. 摘要';
      technicalTitle = '2. 技术分析';
      fundamentalsTitle = '3. 基本面分析';
      newsTitle = '4. 新闻与风险分析';
      bullishTitle = '5. 看好因素';
      bearishTitle = '6. 看淡因素';
      tradingAdviceTitle = '7. 买卖建议';
      finalAdviceTitle = '8. 最终建议及风险评级';
      disclaimer = '⚠️ 以上分析仅供参考，不构成投资建议。';
      userContentTitle = '用户提供的内容分析';
      sentimentTitle = '市场情绪分析';
      summaryOfContent = '内容摘要';
      keyPointsTitle = '关键要点';
      riskLevelTitle = '风险评级';
      
      currentPriceLabel = '目前股价';
      dailyChangeLabel = '日涨跌幅';
      dayRangeLabel = '日内波幅';
      rsiLabel = 'RSI';
      overallTrendLabel = '整体趋势';
      
      macdLabel = 'MACD';
      trendLabel = '趋势';
      sma20Label = 'SMA20';
      sma50Label = 'SMA50';
      volatilityLabel = '波动率';
      avgVolumeLabel = '平均成交量';
      
    } else {
      rsiStatus = stockData.rsi ? (stockData.rsi > 70 ? 'Overbought' : stockData.rsi < 30 ? 'Oversold' : 'Neutral') : 'Neutral';
      rsiInterpret = stockData.rsi ? (stockData.rsi > 70 ? 'Overbought zone, potential pullback' : stockData.rsi < 30 ? 'Oversold zone, potential rebound' : 'Neutral zone, balanced momentum') : '';
      macdText = stockData.macd === 'Bullish' ? 'Bullish' : stockData.macd === 'Bearish' ? 'Bearish' : 'Neutral';
      macdInterpret = stockData.macd === 'Bullish' ? 'Bullish signal, bullish momentum increasing' : stockData.macd === 'Bearish' ? 'Bearish signal, bearish momentum increasing' : 'Neutral signal, direction unclear';
      trendText = stockData.trend === 'Uptrend' ? 'Uptrend' : stockData.trend === 'Downtrend' ? 'Downtrend' : 'Sideways';
      
      analysisTitle = 'Investment Analysis';
      summaryTitle = '1. Summary';
      technicalTitle = '2. Technical Analysis';
      fundamentalsTitle = '3. Fundamental Analysis';
      newsTitle = '4. News & Risk Analysis';
      bullishTitle = '5. Bullish Factors';
      bearishTitle = '6. Bearish Factors';
      tradingAdviceTitle = '7. Trading Advice';
      finalAdviceTitle = '8. Final Recommendation & Risk Rating';
      disclaimer = '⚠️ This analysis is for reference only and does not constitute investment advice.';
      userContentTitle = 'User-Provided Content Analysis';
      sentimentTitle = 'Market Sentiment Analysis';
      summaryOfContent = 'Content Summary';
      keyPointsTitle = 'Key Points';
      riskLevelTitle = 'Risk Rating';
      
      currentPriceLabel = 'Current Price';
      dailyChangeLabel = 'Daily Change';
      dayRangeLabel = 'Day Range';
      rsiLabel = 'RSI';
      overallTrendLabel = 'Overall Trend';
      
      macdLabel = 'MACD';
      trendLabel = 'Trend';
      sma20Label = 'SMA20';
      sma50Label = 'SMA50';
      volatilityLabel = 'Volatility';
      avgVolumeLabel = 'Average Volume';
    }
    
    // Use the best available name
    const displayName = companyInfo.chineseName || companyInfo.name || symbol;
    const overallTrend = stockData.trend === 'Uptrend' ? (language === 'Cantonese' ? '看好' : language === '简体中文' ? '看好' : 'Bullish') : 
                         stockData.trend === 'Downtrend' ? (language === 'Cantonese' ? '看淡' : language === '简体中文' ? '看淡' : 'Bearish') : 
                         (language === 'Cantonese' ? '橫向整理' : language === '简体中文' ? '横向整理' : 'Sideways');
    
    // Risk level text
    let riskText = '';
    if (language === 'Cantonese') {
      riskText = specificAnalysis.riskLevel === 'extreme' ? '⚠️ 極高風險' :
                 specificAnalysis.riskLevel === 'high' ? '⚠️ 高風險' :
                 specificAnalysis.riskLevel === 'medium' ? '⚠️ 中等風險' : '✅ 低風險';
    } else if (language === '简体中文') {
      riskText = specificAnalysis.riskLevel === 'extreme' ? '⚠️ 极高风险' :
                 specificAnalysis.riskLevel === 'high' ? '⚠️ 高风险' :
                 specificAnalysis.riskLevel === 'medium' ? '⚠️ 中等风险' : '✅ 低风险';
    } else {
      riskText = specificAnalysis.riskLevel === 'extreme' ? '⚠️ EXTREME RISK' :
                 specificAnalysis.riskLevel === 'high' ? '⚠️ HIGH RISK' :
                 specificAnalysis.riskLevel === 'medium' ? '⚠️ MEDIUM RISK' : '✅ LOW RISK';
    }
    
    // Generate fundamentals text
    let fundamentalsText = '';
    if (fundamentals && fundamentals.marketCap !== 'N/A') {
      const pe = fundamentals.peRatio;
      const eps = fundamentals.eps;
      const revenueGrowth = fundamentals.revenueGrowth;
      const profitMargin = fundamentals.profitMargin;
      const debtRatio = fundamentals.debtRatio;
      const dividendYield = fundamentals.dividendYield;
      
      if (language === 'Cantonese') {
        fundamentalsText = `${fundamentalsTitle}
市值: ${fundamentals.marketCap} | 市盈率: ${pe?.toFixed(2) || 'N/A'}倍 | EPS: ${eps?.toFixed(2) || 'N/A'}
收入增長: ${revenueGrowth?.toFixed(2) || 'N/A'}% | 利潤率: ${profitMargin?.toFixed(2) || 'N/A'}%
負債權益比: ${debtRatio?.toFixed(2) || 'N/A'} | 股息率: ${dividendYield?.toFixed(2) || 'N/A'}%
${specificAnalysis.qualityReason ? `⚠️ ${specificAnalysis.qualityReason}` : ''}`;
      } else if (language === '简体中文') {
        fundamentalsText = `${fundamentalsTitle}
市值: ${fundamentals.marketCap} | 市盈率: ${pe?.toFixed(2) || 'N/A'}倍 | EPS: ${eps?.toFixed(2) || 'N/A'}
收入增长: ${revenueGrowth?.toFixed(2) || 'N/A'}% | 利润率: ${profitMargin?.toFixed(2) || 'N/A'}%
负债权益比: ${debtRatio?.toFixed(2) || 'N/A'} | 股息率: ${dividendYield?.toFixed(2) || 'N/A'}%
${specificAnalysis.qualityReason ? `⚠️ ${specificAnalysis.qualityReason}` : ''}`;
      } else {
        fundamentalsText = `${fundamentalsTitle}
Market Cap: ${fundamentals.marketCap} | P/E: ${pe?.toFixed(2) || 'N/A'}x | EPS: ${eps?.toFixed(2) || 'N/A'}
Revenue Growth: ${revenueGrowth?.toFixed(2) || 'N/A'}% | Profit Margin: ${profitMargin?.toFixed(2) || 'N/A'}%
Debt/Equity: ${debtRatio?.toFixed(2) || 'N/A'} | Dividend Yield: ${dividendYield?.toFixed(2) || 'N/A'}%
${specificAnalysis.qualityReason ? `⚠️ ${specificAnalysis.qualityReason}` : ''}`;
      }
    } else {
      if (language === 'Cantonese') {
        fundamentalsText = `${fundamentalsTitle}
⚠️ 暫無詳細財務數據。${specificAnalysis.qualityReason || '請參考技術面分析。'}`;
      } else if (language === '简体中文') {
        fundamentalsText = `${fundamentalsTitle}
⚠️ 暂无详细财务数据。${specificAnalysis.qualityReason || '请参考技术面分析。'}`;
      } else {
        fundamentalsText = `${fundamentalsTitle}
⚠️ No detailed financial data available. ${specificAnalysis.qualityReason || 'Please refer to technical analysis.'}`;
      }
    }
    
    // Build bullish factors section
    let bullishText = `${bullishTitle}\n`;
    if (specificAnalysis.specificBullishFactors.length > 0) {
      bullishText += specificAnalysis.specificBullishFactors.join('\n');
    } else {
      bullishText += language === 'Cantonese' ? '• 暫無明顯看好因素' :
                     language === '简体中文' ? '• 暂无明显看好因素' :
                     '• No significant bullish factors identified';
    }
    
    // Build bearish factors section
    let bearishText = `${bearishTitle}\n`;
    if (specificAnalysis.specificBearishFactors.length > 0) {
      bearishText += specificAnalysis.specificBearishFactors.join('\n');
    } else {
      bearishText += language === 'Cantonese' ? '• 暫無明顯看淡因素' :
                     language === '简体中文' ? '• 暂无明显看淡因素' :
                     '• No significant bearish factors identified';
    }
    
    // Generate user content analysis section
    let userContentText = '';
    if (userContentAnalysis && userContentAnalysis.originalContent) {
      const sentimentEmoji = userContentAnalysis.sentiment?.sentiment === 'Positive' ? '📈' : 
                             userContentAnalysis.sentiment?.sentiment === 'Negative' ? '📉' : '📊';
      const sentimentText = userContentAnalysis.sentiment?.sentiment === 'Positive' ? 
                           (language === 'Cantonese' ? '正面' : language === '简体中文' ? '正面' : 'Positive') :
                           userContentAnalysis.sentiment?.sentiment === 'Negative' ?
                           (language === 'Cantonese' ? '負面' : language === '简体中文' ? '負面' : 'Negative') :
                           (language === 'Cantonese' ? '中性' : language === '简体中文' ? '中性' : 'Neutral');
      
      let aiContentAnalysis = '';
      if (userContentAnalysis.sentiment?.sentiment === 'Positive') {
        aiContentAnalysis = language === 'Cantonese' ? '這份資料包含利好因素，可能支持股價向上。但建議結合技術面確認入市時機。' :
                            language === '简体中文' ? '这份资料包含利好因素，可能支持股价向上。但建议结合技术面确认入市时机。' :
                            'This content contains positive factors that may support upward price movement. However, combine with technical analysis for entry timing.';
      } else if (userContentAnalysis.sentiment?.sentiment === 'Negative') {
        aiContentAnalysis = language === 'Cantonese' ? '這份資料包含負面因素，可能對股價構成壓力。建議審慎評估風險。' :
                            language === '简体中文' ? '这份资料包含负面因素，可能对股价构成压力。建议审慎评估风险。' :
                            'This content contains negative factors that may pressure the stock price. Carefully assess risks.';
      } else {
        aiContentAnalysis = language === 'Cantonese' ? '這份資料影響中性，沒有明確方向。建議等待更多催化劑。' :
                            language === '简体中文' ? '这份资料影响中性，没有明确方向。建议等待更多催化剂。' :
                            'This content has neutral impact with no clear direction. Wait for more catalysts.';
      }
      
      userContentText = `
${userContentTitle}

文章標題: ${userContentAnalysis.title}

${summaryOfContent}:
${userContentAnalysis.summary}

${keyPointsTitle}:
• 情緒傾向: ${sentimentEmoji} ${sentimentText} (分數: ${userContentAnalysis.sentiment?.score || 0})
• 內容類型: ${userContentAnalysis.type === 'url' ? '網頁連結' : '用戶輸入文字'}

AI內容分析:
${aiContentAnalysis}`;
    } else if (news && news.length > 0 && newsSentiment) {
      const sentimentText = newsSentiment.sentiment === 'Positive' ? 
                           (language === 'Cantonese' ? '正面' : language === '简体中文' ? '正面' : 'Positive') :
                           newsSentiment.sentiment === 'Negative' ?
                           (language === 'Cantonese' ? '負面' : language === '简体中文' ? '負面' : 'Negative') :
                           (language === 'Cantonese' ? '中性' : language === '简体中文' ? '中性' : 'Neutral');
      
      let aiNewsAnalysis = '';
      let newsSummary = '';
      
      const headlines = news.slice(0, 3).map((item: any) => item.title).filter(Boolean);
      if (headlines.length > 0) {
        newsSummary = language === 'Cantonese' ? `近期主要新聞包括：${headlines.join('；')}` :
                      language === '简体中文' ? `近期主要新闻包括：${headlines.join('；')}` :
                      `Recent key news includes: ${headlines.join('; ')}`;
      } else {
        newsSummary = language === 'Cantonese' ? '暫無具體新聞標題' :
                      language === '简体中文' ? '暂无具体新闻标题' :
                      'No specific news headlines available';
      }
      
      // Only apply penny stock warning for ACTUAL HK penny stocks
      const isPennyStock = (symbol.endsWith('.HK') && stockData.price < 0.5);
      const isLowQualityStock = (symbol.endsWith('.HK') && stockData.price < 1);
      const isNormalStock = stockData.price > 10;
      
      if ((isPennyStock || isLowQualityStock) && !isNormalStock) {
        if (newsSentiment.sentiment === 'Positive') {
          aiNewsAnalysis = language === 'Cantonese' ? 
            `⚠️ 謹慎解讀：雖然近期新聞情緒正面，但此股票屬於低價股/仙股，風險極高。正面新聞可能是短期炒作，不建議作為投資依據。請優先關注基本面和流動性風險。` :
            language === '简体中文' ? 
            `⚠️ 谨慎解读：虽然近期新闻情绪正面，但此股票属于低价股/仙股，风险极高。正面新闻可能是短期炒作，不建议作为投资依据。请优先关注基本面和流动性风险。` :
            `⚠️ CAUTION: Despite positive news sentiment, this is a penny/low-priced stock with extreme risk. Positive news may be short-term speculation. Prioritize fundamental and liquidity risks.`;
        } else if (newsSentiment.sentiment === 'Negative') {
          aiNewsAnalysis = language === 'Cantonese' ? 
            `⚠️ 風險警告：負面新聞加上此股票本身風險極高（低價股/仙股），建議避開。此類股票容易受消息影響大幅波動，不適合長線持有。` :
            language === '简体中文' ? 
            `⚠️ 风险警告：负面新闻加上此股票本身风险极高（低价股/仙股），建议避开。此类股票容易受消息影响大幅波动，不适合长线持有。` :
            `⚠️ RISK WARNING: Negative news combined with extremely high risk (penny stock). Avoid this stock as it's highly volatile and unsuitable for long-term holding.`;
        } else {
          aiNewsAnalysis = language === 'Cantonese' ? 
            `⚠️ 注意：此股票屬於高風險低價股，即使新聞情緒中性，仍需謹慎。建議關注成交量變化，避免流動性陷阱。` :
            language === '简体中文' ? 
            `⚠️ 注意：此股票属于高风险低价股，即使新闻情绪中性，仍需谨慎。建议关注成交量变化，避免流动性陷阱。` :
            `⚠️ NOTE: This is a high-risk low-priced stock. Even with neutral news sentiment, exercise caution. Monitor volume changes to avoid liquidity traps.`;
        }
      } else {
        if (newsSentiment.sentiment === 'Positive') {
          aiNewsAnalysis = language === 'Cantonese' ? 
            `詳細分析：近期新聞整體正面，${newsSummary}。這些消息對公司基本面有正面影響，可能支持股價繼續向好。建議關注後續業績表現。` :
            language === '简体中文' ? 
            `详细分析：近期新闻整体正面，${newsSummary}。这些消息对公司基本面有正面影响，可能支持股价继续向好。建议关注后续业绩表现。` :
            `Detailed Analysis: Recent news is overall positive. ${newsSummary}. These developments positively impact fundamentals and may support continued price appreciation. Monitor upcoming earnings.`;
        } else if (newsSentiment.sentiment === 'Negative') {
          aiNewsAnalysis = language === 'Cantonese' ? 
            `詳細分析：近期新聞整體負面，${newsSummary}。這些消息可能對公司構成壓力，需警惕下行風險。建議等待負面因素消化後再作部署。` :
            language === '简体中文' ? 
            `详细分析：近期新闻整体负面，${newsSummary}。这些消息可能对公司构成压力，需警惕下行风险。建议等待负面因素消化后再作部署。` :
            `Detailed Analysis: Recent news is overall negative. ${newsSummary}. These developments may pressure the company. Be aware of downside risk. Wait for negative factors to be priced in.`;
        } else {
          aiNewsAnalysis = language === 'Cantonese' ? 
            `詳細分析：近期新聞情緒中性，${newsSummary}。市場觀望氣氛濃厚，等待更多催化劑。建議關注公司公告和行業政策變化。` :
            language === '简体中文' ? 
            `详细分析：近期新闻情绪中性，${newsSummary}。市场观望气氛浓厚，等待更多催化剂。建议关注公司公告和行业政策变化。` :
            `Detailed Analysis: Recent news sentiment is neutral. ${newsSummary}. Market is waiting for more catalysts. Monitor company announcements and industry policy changes.`;
        }
      }
      
      userContentText = `${newsTitle}
最新新聞情緒分析 (共${news.length}篇):
• 整體情緒: ${sentimentText} (分數: ${newsSentiment.score})
• 正面新聞: ${newsSentiment.positiveCount}篇 | 負面新聞: ${newsSentiment.negativeCount}篇 | 中性: ${newsSentiment.neutralCount}篇

新聞摘要:
${newsSummary}

AI新聞分析:
${aiNewsAnalysis}`;
    } else {
      userContentText = `${newsTitle}
近期暫無重大相關新聞。建議關注公司公告和行業動態。`;
    }
    
    // Generate trading advice
    let tradingAdviceText = '';
    if (language === 'Cantonese') {
      tradingAdviceText = `${tradingAdviceTitle}
目標價: ${stockData.currency}${specificAnalysis.targetPrice.toFixed(2)}
止蝕位: ${stockData.currency}${specificAnalysis.stopLoss.toFixed(2)}
風險回報比: 1:${((specificAnalysis.targetPrice - stockData.price) / (stockData.price - specificAnalysis.stopLoss)).toFixed(1)}`;
    } else if (language === '简体中文') {
      tradingAdviceText = `${tradingAdviceTitle}
目标价: ${stockData.currency}${specificAnalysis.targetPrice.toFixed(2)}
止损位: ${stockData.currency}${specificAnalysis.stopLoss.toFixed(2)}
风险回报比: 1:${((specificAnalysis.targetPrice - stockData.price) / (stockData.price - specificAnalysis.stopLoss)).toFixed(1)}`;
    } else {
      tradingAdviceText = `${tradingAdviceTitle}
Target Price: ${stockData.currency}${specificAnalysis.targetPrice.toFixed(2)}
Stop Loss: ${stockData.currency}${specificAnalysis.stopLoss.toFixed(2)}
Risk/Reward Ratio: 1:${((specificAnalysis.targetPrice - stockData.price) / (stockData.price - specificAnalysis.stopLoss)).toFixed(1)}`;
    }
    
    // Generate confidence score display
    let confidenceDisplay = '';
    if (language === 'Cantonese') {
      if (specificAnalysis.confidenceScore >= 80) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 五顆星 (非常高)`;
      } else if (specificAnalysis.confidenceScore >= 65) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 四顆星 (高)`;
      } else if (specificAnalysis.confidenceScore >= 50) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 三顆星 (中等)`;
      } else if (specificAnalysis.confidenceScore >= 35) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 兩顆星 (低)`;
      } else {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 一顆星 (極低)`;
      }
    } else if (language === '简体中文') {
      if (specificAnalysis.confidenceScore >= 80) {
        confidenceDisplay = `信心评分: ${specificAnalysis.confidenceScore}% 五颗星 (非常高)`;
      } else if (specificAnalysis.confidenceScore >= 65) {
        confidenceDisplay = `信心评分: ${specificAnalysis.confidenceScore}% 四颗星 (高)`;
      } else if (specificAnalysis.confidenceScore >= 50) {
        confidenceDisplay = `信心评分: ${specificAnalysis.confidenceScore}% 三颗星 (中等)`;
      } else if (specificAnalysis.confidenceScore >= 35) {
        confidenceDisplay = `信心评分: ${specificAnalysis.confidenceScore}% 两颗星 (低)`;
      } else {
        confidenceDisplay = `信心评分: ${specificAnalysis.confidenceScore}% 一颗星 (极低)`;
      }
    } else {
      confidenceDisplay = `Confidence Score: ${specificAnalysis.confidenceScore}% ${specificAnalysis.confidenceEmoji} (${specificAnalysis.confidenceRating})`;
    }
    
    // Generate complete analysis
    const analysis = `${displayName} (${symbol}) ${analysisTitle}

${summaryTitle}
${currentPriceLabel}: ${stockData.currency}${stockData.price ? stockData.price.toFixed(2) : 'N/A'}, ${dailyChangeLabel}: ${changePercentText}
${dayRangeLabel}: ${stockData.dayLow ? `${stockData.currency}${stockData.dayLow.toFixed(2)}` : 'N/A'} - ${stockData.dayHigh ? `${stockData.currency}${stockData.dayHigh.toFixed(2)}` : 'N/A'}
${rsiLabel}: ${rsiText} (${rsiStatus}). ${overallTrendLabel}: ${overallTrend}

${technicalTitle}
RSI(14): ${rsiText} - ${rsiInterpret}
${macdLabel}: ${macdText} - ${macdInterpret}
${trendLabel}: ${trendText}
${sma20Label}: ${stockData.sma20 ? `${stockData.currency}${stockData.sma20.toFixed(2)}` : 'N/A'}
${sma50Label}: ${stockData.sma50 ? `${stockData.currency}${stockData.sma50.toFixed(2)}` : 'N/A'}
${volatilityLabel}: ${stockData.volatility ? `${(stockData.volatility * 100).toFixed(2)}%` : 'N/A'}
${avgVolumeLabel}: ${stockData.avgVolume ? stockData.avgVolume.toLocaleString() : 'N/A'}

${fundamentalsText}

${userContentText}

${bullishText}

${bearishText}

${tradingAdviceText}

${finalAdviceTitle}
${specificAnalysis.specificRecommendation}
${riskLevelTitle}: ${riskText}
${confidenceDisplay}

${disclaimer}`;
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      companyName: displayName,
      price: stockData.price,
      changePercent: stockData.changePercent,
      dayLow: stockData.dayLow,
      dayHigh: stockData.dayHigh,
      rsi: stockData.rsi,
      macd: stockData.macd,
      trend: stockData.trend,
      historical: stockData.historical,
      isQuestion: isUserQuestion,
      detectedFrom: message,
      summary: analysis,
      text: analysis,
      sma20: stockData.sma20,
      sma50: stockData.sma50,
      volatility: stockData.volatility,
      avgVolume: stockData.avgVolume,
      currency: stockData.currency,
      specificAnalysis: specificAnalysis
    });
    
  } catch (error) {
    console.error('API Error:', error);
    const errorMsg = 'Service temporarily unavailable. Please try again later.';
    return NextResponse.json({
      success: false,
      summary: errorMsg,
      text: errorMsg
    });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Stock Analysis API running", 
    timestamp: new Date().toISOString(),
    version: "4.0",
    features: {
      stockDetection: true,
      multiMarket: "HK/TW/US",
      technicalIndicators: ["RSI", "MACD", "Trend", "SMA20", "SMA50", "Volatility"],
      newsAnalysis: true,
      sentimentAnalysis: true,
      userContentIntegration: true,
      contentSummarization: true,
      specificAnalysis: true,
      confidenceScoring: true
    }
  });
}