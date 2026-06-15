// /app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { detectStock, isQuestion, STOCK_ALIASES } from '@/app/lib/market/stockDetector';
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

// Calculate Bollinger Bands for historical data
function addBollingerBands(historical: any[], period: number = 20, multiplier: number = 2) {
  if (historical.length < period) return historical;
  
  const result = [...historical];
  const prices = result.map(d => d.close);
  
  for (let i = period - 1; i < result.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
    
    result[i].upper = sma + (multiplier * stdDev);
    result[i].middle = sma;
    result[i].lower = sma - (multiplier * stdDev);
  }
  
  return result;
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
          price: closes[i],
          close: closes[i],
          open: opens[i] || null,
          high: highs[i] || null,
          low: lows[i] || null,
          volume: volumes[i] || 0,
        });
      }
    }
    
    console.log(`✅ ${symbol}: ${currency}${price} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%) - ${historical.length} data points`);
    
    const historicalWithBands = addBollingerBands(historical);
    
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
      historical: historicalWithBands,
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

// IMPROVED: Better URL content extraction
async function extractUrlContent(url: string): Promise<{ title: string; content: string; cleanText: string }> {
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const html = await res.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    // Try to find article content - look for main content areas
    let text = '';
    
    // Look for article, main, or body content
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    
    const contentSource = articleMatch?.[1] || mainMatch?.[1] || bodyMatch?.[1] || html;
    
    // Remove scripts, styles, nav, footer
    let cleaned = contentSource.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    cleaned = cleaned.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&[a-z]+;/gi, ' ');
    cleaned = cleaned.trim();
    
    // Find meaningful sentences (longer, substantive content)
    const sentences = cleaned.split(/[.!?]+/);
    const meaningfulSentences = sentences.filter(s => 
      s.trim().length > 60 && 
      !s.toLowerCase().includes('cookie') && 
      !s.toLowerCase().includes('privacy') &&
      !s.toLowerCase().includes('subscribe') &&
      !s.toLowerCase().includes('newsletter') &&
      !s.toLowerCase().includes('sign up') &&
      !s.toLowerCase().includes('login') &&
      !s.toLowerCase().includes('menu') &&
      !s.toLowerCase().includes('search')
    );
    
    // Get first 15 meaningful sentences (or all if less)
    const cleanText = meaningfulSentences.slice(0, 15).join('. ') + '.';
    
    console.log(`📰 Extracted ${meaningfulSentences.length} meaningful sentences from ${url}`);
    
    return { title, content: cleaned.substring(0, 5000), cleanText: cleanText.substring(0, 2000) };
  } catch (err) {
    console.error('Error extracting URL content:', err);
    return { title: 'Unable to fetch content', content: '', cleanText: '' };
  }
}

function simpleTranslate(text: string, targetLang: string): string {
  if (targetLang === 'English') return text;
  
  const translations: Record<string, Record<string, string>> = {
    'Traditional Chinese': {
      'Stock': '股票',
      'share': '股份',
      'price': '股價',
      'market': '市場',
      'AI': '人工智能',
      'IPO': '首次公開募股',
      'target': '目標',
      'billion': '十億',
      'trillion': '萬億',
    },
    'Simplified Chinese': {
      'Stock': '股票',
      'share': '股份',
      'price': '股价',
      'market': '市场',
      'AI': '人工智能',
      'IPO': '首次公开募股',
      'target': '目标',
      'billion': '十亿',
      'trillion': '万亿',
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

// Function to generate AI summary of news content
// Function to generate AI summary of news content
async function generateAISummary(content: string, title: string, language: string): Promise<string> {
  try {
    // Try to use AI gateway if available, otherwise fallback to extractive summary
    const { callAI } = await import('@/app/lib/ai/gateway');
    
    const prompt = `Summarize the following news/article content in 2-3 sentences, focusing on key points that would affect the stock price. 
Title: ${title}
Content: ${content.substring(0, 2000)}

Provide a concise summary that highlights:
1. The main news/event
2. Potential positive or negative impact
3. Key numbers or announcements if any`;

    // Fix: callAI expects 7 arguments (prompt, symbol, companyName, price, changePercent, rsi, hasContent)
    const aiSummary = await callAI(prompt, 'news-summary', 'News Summary', 0, 0, 0, true);
    
    if (aiSummary && aiSummary.length > 50) {
      return aiSummary;
    }
  } catch (err) {
    console.log('AI summary not available, using extractive summary');
  }
  
  // Fallback: extractive summary
  return generateSummary(content, 250);
}

async function extractUserContent(userContent: string, targetLang: string): Promise<{ 
  type: string; 
  originalContent: string; 
  translatedContent: string; 
  summary: string;
  title: string;
  sentiment: any;
  aiSummary: string;
}> {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  
  let title = '';
  let originalContent = '';
  let cleanText = '';
  let aiSummary = '';
  
  if (urlPattern.test(userContent)) {
    const extracted = await extractUrlContent(userContent);
    title = extracted.title;
    originalContent = extracted.cleanText || extracted.content;
    cleanText = extracted.cleanText;
    
    // Generate AI summary for URL content
    if (cleanText && cleanText.length > 100) {
      aiSummary = await generateAISummary(cleanText, title, targetLang);
    }
  } else {
    title = 'User Provided Text';
    originalContent = userContent;
    cleanText = userContent;
    aiSummary = generateSummary(cleanText, 200);
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
    sentiment,
    aiSummary
  };
}

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
  
  // Penny stock detection - ONLY for HK stocks under 1 HKD
  if (symbol.endsWith('.HK') && price < 0.5) {
    stockQuality = 'very-poor';
    riskLevel = 'extreme';
    qualityReason = language === 'Traditional Chinese' ? '仙股，股價低於0.5港元，風險極高' :
                    language === 'Simplified Chinese' ? '仙股，股价低于0.5港元，风险极高' :
                    'Penny stock below HKD 0.5, extremely high risk';
    
    specificBearishFactors.push(
      language === 'Traditional Chinese' ? '• 股價處於仙股水平，存在除牌風險' : 
      language === 'Simplified Chinese' ? '• 股价处于仙股水平，存在退市风险' :
      '• Stock price at penny stock level, delisting risk'
    );
    specificBearishFactors.push(
      language === 'Traditional Chinese' ? '• 流動性極差，買賣差價大，難以成交' :
      language === 'Simplified Chinese' ? '• 流动性极差，买卖差价大，难以成交' :
      '• Extremely poor liquidity, wide bid-ask spread'
    );
  } else if (symbol.endsWith('.HK') && price < 1) {
    stockQuality = 'poor';
    riskLevel = 'high';
    qualityReason = language === 'Traditional Chinese' ? '低價股，股價低於1港元，風險較高' :
                    language === 'Simplified Chinese' ? '低价股，股价低于1港元，风险较高' :
                    'Low-priced stock below HKD 1, high risk';
    
    specificBearishFactors.push(
      language === 'Traditional Chinese' ? '• 低價股波動性大，適合短線投機' :
      language === 'Simplified Chinese' ? '• 低价股波动性大，适合短线投机' :
      '• Low-priced stocks have high volatility, suitable for speculation'
    );
  }
  
  // RSI analysis
  if (rsi !== null) {
    if (rsi < 25) {
      specificBullishFactors.push(
        language === 'Traditional Chinese' ? `• RSI處於${rsi.toFixed(1)}極度超賣水平，技術性反彈機會增加` :
        language === 'Simplified Chinese' ? `• RSI处于${rsi.toFixed(1)}极度超卖水平，技术性反弹机会增加` :
        `• RSI at ${rsi.toFixed(1)} - extremely oversold, technical rebound likely`
      );
    } else if (rsi > 75) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• RSI處於${rsi.toFixed(1)}超買水平，短期回調風險增加` :
        language === 'Simplified Chinese' ? `• RSI处于${rsi.toFixed(1)}超买水平，短期回调风险增加` :
        `• RSI at ${rsi.toFixed(1)} - overbought, pullback risk increasing`
      );
    }
  }
  
  // Trend and MACD
  if (trend === 'Downtrend' && macd === 'Bearish') {
    specificBearishFactors.push(
      language === 'Traditional Chinese' ? '• 技術面雙重看淡信號（下降通道 + MACD看淡）' :
      language === 'Simplified Chinese' ? '• 技术面双重看淡信号（下降通道 + MACD看淡）' :
      '• Double bearish technical signals (Downtrend + Bearish MACD)'
    );
    if (stockQuality !== 'very-poor') stockQuality = 'poor';
  } else if (trend === 'Uptrend' && macd === 'Bullish') {
    specificBullishFactors.push(
      language === 'Traditional Chinese' ? '• 技術面雙重看好信號（上升通道 + MACD看好）' :
      language === 'Simplified Chinese' ? '• 技术面双重看好信号（上升通道 + MACD看好）' :
      '• Double bullish technical signals (Uptrend + Bullish MACD)'
    );
  }
  
  // Fundamentals
  if (pe !== null) {
    if (pe > 50) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 市盈率${pe.toFixed(1)}倍，估值過高，泡沫風險` :
        language === 'Simplified Chinese' ? `• 市盈率${pe.toFixed(1)}倍，估值过高，泡沫风险` :
        `• P/E ratio of ${pe.toFixed(1)}x - overvalued, bubble risk`
      );
    } else if (pe < 8 && pe > 0) {
      specificBullishFactors.push(
        language === 'Traditional Chinese' ? `• 市盈率${pe.toFixed(1)}倍，估值偏低，價值吸引` :
        language === 'Simplified Chinese' ? `• 市盈率${pe.toFixed(1)}倍，估值偏低，价值吸引` :
        `• P/E ratio of ${pe.toFixed(1)}x - undervalued, attractive valuation`
      );
    } else if (pe < 0) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? '• 公司錄得虧損，盈利能力成疑' :
        language === 'Simplified Chinese' ? '• 公司录得亏损，盈利能力成疑' :
        '• Company is loss-making, profitability questionable'
      );
    }
  }
  
  if (revenueGrowth !== null) {
    if (revenueGrowth > 20) {
      specificBullishFactors.push(
        language === 'Traditional Chinese' ? `• 收入增長${revenueGrowth.toFixed(1)}%，增長強勁` :
        language === 'Simplified Chinese' ? `• 收入增长${revenueGrowth.toFixed(1)}%，增长强劲` :
        `• Revenue growth of ${revenueGrowth.toFixed(1)}% - strong growth`
      );
    } else if (revenueGrowth < 0) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 收入負增長${Math.abs(revenueGrowth).toFixed(1)}%，業務收縮` :
        language === 'Simplified Chinese' ? `• 收入负增长${Math.abs(revenueGrowth).toFixed(1)}%，业务收缩` :
        `• Negative revenue growth of ${Math.abs(revenueGrowth).toFixed(1)}% - business contraction`
      );
    }
  }
  
  if (profitMargin !== null) {
    if (profitMargin > 30) {
      specificBullishFactors.push(
        language === 'Traditional Chinese' ? `• 利潤率${profitMargin.toFixed(1)}%，盈利能力優秀` :
        language === 'Simplified Chinese' ? `• 利润率${profitMargin.toFixed(1)}%，盈利能力优秀` :
        `• Profit margin of ${profitMargin.toFixed(1)}% - excellent profitability`
      );
    } else if (profitMargin < 5 && profitMargin > 0) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 利潤率僅${profitMargin.toFixed(1)}%，盈利能力薄弱` :
        language === 'Simplified Chinese' ? `• 利润率仅${profitMargin.toFixed(1)}%，盈利能力薄弱` :
        `• Profit margin of only ${profitMargin.toFixed(1)}% - weak profitability`
      );
    } else if (profitMargin < 0) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 處於虧損狀態，利潤率${profitMargin.toFixed(1)}%` :
        language === 'Simplified Chinese' ? `• 处于亏损状态，利润率${profitMargin.toFixed(1)}%` :
        `• In loss position with margin of ${profitMargin.toFixed(1)}%`
      );
    }
  }
  
  if (debtRatio !== null) {
    if (debtRatio > 100) {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 負債權益比${debtRatio.toFixed(1)}%，負債水平偏高，財務風險大` :
        language === 'Simplified Chinese' ? `• 负债权益比${debtRatio.toFixed(1)}%，负债水平偏高，财务风险大` :
        `• Debt/Equity ratio of ${debtRatio.toFixed(1)}% - high debt level, significant financial risk`
      );
    } else if (debtRatio < 20 && debtRatio > 0) {
      specificBullishFactors.push(
        language === 'Traditional Chinese' ? `• 負債權益比${debtRatio.toFixed(1)}%，負債水平健康` :
        language === 'Simplified Chinese' ? `• 负债权益比${debtRatio.toFixed(1)}%，负债水平健康` :
        `• Debt/Equity ratio of ${debtRatio.toFixed(1)}% - healthy debt level`
      );
    }
  }
  
  if (volatility !== null) {
    if (volatility > 0.6) {
      riskLevel = 'high';
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 年化波動率${(volatility * 100).toFixed(1)}%，股價波動劇烈` :
        language === 'Simplified Chinese' ? `• 年化波动率${(volatility * 100).toFixed(1)}%，股价波动剧烈` :
        `• Annualized volatility of ${(volatility * 100).toFixed(1)}% - extremely volatile`
      );
    } else if (volatility > 0.4) {
      riskLevel = 'high';
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? `• 波動率${(volatility * 100).toFixed(1)}%，風險中等偏高` :
        language === 'Simplified Chinese' ? `• 波动率${(volatility * 100).toFixed(1)}%，风险中等偏高` :
        `• Volatility of ${(volatility * 100).toFixed(1)}% - moderately high risk`
      );
    }
  }
  
  if (specificBullishFactors.length === 0) {
    if (trend === 'Uptrend') {
      specificBullishFactors.push(
        language === 'Traditional Chinese' ? '• 處於上升通道，技術面偏強' :
        language === 'Simplified Chinese' ? '• 处于上升通道，技术面偏强' :
        '• In uptrend channel, technical outlook positive'
      );
    }
  }
  
  if (specificBearishFactors.length === 0) {
    if (trend === 'Downtrend') {
      specificBearishFactors.push(
        language === 'Traditional Chinese' ? '• 處於下降通道，技術面偏弱' :
        language === 'Simplified Chinese' ? '• 处于下降通道，技术面偏弱' :
        '• In downtrend channel, technical outlook negative'
      );
    }
  }
  
  // Quality score
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
  
  if (symbol.endsWith('.HK') && price < 0.5) {
    stockQuality = 'very-poor';
  } else if (symbol.endsWith('.HK') && price < 1) {
    stockQuality = 'poor';
  }
  
  // Recommendation
  let specificRecommendation = '';
  let targetPrice = price;
  let stopLoss = price;
  
  if (stockQuality === 'very-poor') {
    specificRecommendation = language === 'Traditional Chinese' ? '強烈建議：避開此股票，風險極高，不適合長線持有' :
                              language === 'Simplified Chinese' ? '强烈建议：避开此股票，风险极高，不适合长线持有' :
                              'STRONG AVOID: Extremely high risk, not suitable for long-term holding';
    targetPrice = price * 0.9;
    stopLoss = price * 0.85;
  } else if (stockQuality === 'poor') {
    specificRecommendation = language === 'Traditional Chinese' ? '建議：謹慎操作，僅適合短線投機，嚴格控制止蝕' :
                              language === 'Simplified Chinese' ? '建议：谨慎操作，仅适合短线投机，严格控制止损' :
                              'CAUTION: Speculative only, strict stop loss required';
    targetPrice = price * 1.05;
    stopLoss = price * 0.92;
  } else if (rsi !== null && rsi < 30) {
    specificRecommendation = language === 'Traditional Chinese' ? '建議：超賣區間，可小注買入博反彈，嚴守止蝕' :
                              language === 'Simplified Chinese' ? '建议：超卖区间，可小注买入博反弹，严守止损' :
                              'BUY on dips: Oversold zone, accumulate gradually with stop loss';
    targetPrice = price * 1.12;
    stopLoss = price * 0.92;
  } else if (rsi !== null && rsi > 70) {
    specificRecommendation = language === 'Traditional Chinese' ? '建議：超買區間，分批獲利，不宜追高' :
                              language === 'Simplified Chinese' ? '建议：超买区间，分批获利，不宜追高' :
                              'TAKE PROFIT: Overbought zone, reduce position gradually';
    targetPrice = price * 1.03;
    stopLoss = price * 0.96;
  } else if (stockQuality === 'excellent' || stockQuality === 'good') {
    specificRecommendation = language === 'Traditional Chinese' ? '建議：基本面良好，可長期持有，逢低買入' :
                              language === 'Simplified Chinese' ? '建议：基本面良好，可长期持有，逢低买入' :
                              'ACCUMULATE: Strong fundamentals, suitable for long-term holding';
    targetPrice = price * 1.15;
    stopLoss = price * 0.92;
  } else {
    specificRecommendation = language === 'Traditional Chinese' ? '建議：持有觀望，等待更明確信號' :
                              language === 'Simplified Chinese' ? '建议：持有观望，等待更明确信号' :
                              'HOLD: Wait for clearer signals';
    targetPrice = price * 1.08;
    stopLoss = price * 0.94;
  }
  
  // Confidence score - UPDATED with cap at 95%
  let confidenceScore = 50;
  
  let technicalScore = 0;
  if (trend === 'Uptrend' && macd === 'Bullish') {
    technicalScore += 25;
  } else if (trend === 'Uptrend' && macd === 'Bearish') {
    technicalScore += 5;
  } else if (trend === 'Downtrend' && macd === 'Bearish') {
    technicalScore -= 30;
  } else if (trend === 'Downtrend' && macd === 'Bullish') {
    technicalScore -= 10;
  } else if (trend === 'Uptrend') {
    technicalScore += 15;
  } else if (trend === 'Downtrend') {
    technicalScore -= 20;
  }
  
  if (rsi !== null) {
    if (rsi >= 40 && rsi <= 60) {
      technicalScore += 10;
    } else if (rsi >= 30 && rsi <= 70) {
      technicalScore += 5;
    } else if (rsi < 25) {
      technicalScore -= 20;
    } else if (rsi > 75) {
      technicalScore -= 20;
    } else if (rsi < 30) {
      technicalScore -= 10;
    } else if (rsi > 70) {
      technicalScore -= 15;
    }
  }
  
  confidenceScore += technicalScore;
  
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
      fundamentalScore -= 20;
    } else if (pe < 10 && pe > 0) {
      fundamentalScore += 10;
    } else if (pe < 0) {
      fundamentalScore -= 25;
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
      fundamentalScore -= 15;
    } else if (revenueGrowth < -10) {
      fundamentalScore -= 25;
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
      fundamentalScore -= 25;
    }
  }
  
  if (debtRatio !== null) {
    if (debtRatio < 30) {
      fundamentalScore += 10;
    } else if (debtRatio < 50) {
      fundamentalScore += 5;
    } else if (debtRatio > 70) {
      fundamentalScore -= 20;
    } else if (debtRatio > 50) {
      fundamentalScore -= 10;
    }
  }
  
  confidenceScore += fundamentalScore;
  
  if (volatility !== null) {
    if (volatility > 0.6) {
      confidenceScore -= 20;
    } else if (volatility > 0.45) {
      confidenceScore -= 12;
    } else if (volatility > 0.3) {
      confidenceScore -= 5;
    } else if (volatility < 0.2) {
      confidenceScore += 5;
    }
  }
  
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
  
  confidenceScore = Math.min(95, confidenceScore);
  confidenceScore = Math.max(15, confidenceScore);
  confidenceScore = Math.round(confidenceScore);
  
  let confidenceRating = '';
  let confidenceEmoji = '';
  if (confidenceScore >= 85) {
    confidenceRating = language === 'Traditional Chinese' ? '非常高' : language === 'Simplified Chinese' ? '非常高' : 'Very High';
    confidenceEmoji = '⭐⭐⭐⭐⭐';
  } else if (confidenceScore >= 70) {
    confidenceRating = language === 'Traditional Chinese' ? '高' : language === 'Simplified Chinese' ? '高' : 'High';
    confidenceEmoji = '⭐⭐⭐⭐';
  } else if (confidenceScore >= 50) {
    confidenceRating = language === 'Traditional Chinese' ? '中等' : language === 'Simplified Chinese' ? '中等' : 'Medium';
    confidenceEmoji = '⭐⭐⭐';
  } else if (confidenceScore >= 35) {
    confidenceRating = language === 'Traditional Chinese' ? '低' : language === 'Simplified Chinese' ? '低' : 'Low';
    confidenceEmoji = '⭐⭐';
  } else {
    confidenceRating = language === 'Traditional Chinese' ? '極低' : language === 'Simplified Chinese' ? '极低' : 'Very Low';
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
    // Get the authenticated user and check email verification
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Check if user is authenticated
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        summary: 'Please login to continue.',
        text: 'Please login to continue.'
      }, { status: 401 });
    }
    
    // CHECK: Email verification required before using credits
    if (!user.email_confirmed_at) {
      return NextResponse.json({
        success: false,
        summary: 'Please verify your email address before using the analysis feature. Check your inbox for the confirmation link.',
        text: 'Please verify your email address before using the analysis feature.'
      }, { status: 403 });
    }

    // Check user's credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        summary: 'User profile not found. Please contact support.',
        text: 'User profile not found.'
      }, { status: 403 });
    }

    if (profile.credits <= 0) {
      return NextResponse.json({
        success: false,
        summary: 'You have used all your credits. Please upgrade your plan to continue.',
        text: 'Insufficient credits.'
      }, { status: 403 });
    }

    // Deduct 1 credit for this analysis
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    const { message, language = 'English', userContent = null } = await req.json();
    console.log(`Query: ${message}, Language: ${language}, UserContent: ${userContent ? 'Yes' : 'No'}`);
    
    const symbol = detectStock(message);
    
    if (!symbol || symbol === '') {
      let errorMsg = '';
      if (language === 'Traditional Chinese') {
        errorMsg = '無法識別股票代號。請嘗試: 台積電, 騰訊, 特斯拉, 或直接輸入代號如 2330.TW, 0700.HK, TSLA';
      } else if (language === 'Simplified Chinese') {
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
    
    const [stockData, companyInfo] = await Promise.all([
      fetchRealStockData(symbol),
      fetchCompanyInfo(symbol)
    ]);
    
    if (!stockData) {
      let errorMsg = '';
      if (language === 'Traditional Chinese') {
        errorMsg = `無法獲取 ${symbol} 的即時數據，請稍後再試。`;
      } else if (language === 'Simplified Chinese') {
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
    
    const [fundamentals, news] = await Promise.all([
      getFundamentals(symbol),
      getNews(symbol, companyInfo.name || symbol, language)
    ]);
    
    let userContentAnalysis = null;
    let newsSentiment = null;
    
    if (userContent) {
      userContentAnalysis = await extractUserContent(userContent, language);
      console.log(`User content analyzed: ${userContentAnalysis.type}, Title: ${userContentAnalysis.title}`);
      console.log(`AI Summary generated: ${userContentAnalysis.aiSummary?.substring(0, 100)}...`);
    }
    
    if (news && news.length > 0) {
      newsSentiment = getSentiment(news);
      console.log(`News sentiment: ${newsSentiment.sentiment}, Score: ${newsSentiment.score}`);
    }
    
    const specificAnalysis = generateSpecificAnalysis(stockData, fundamentals, symbol, language);
    
    if (newsSentiment) {
      if (newsSentiment.sentiment === 'Positive') {
        specificAnalysis.confidenceScore = Math.min(95, specificAnalysis.confidenceScore + 5);
      } else if (newsSentiment.sentiment === 'Negative') {
        specificAnalysis.confidenceScore = Math.max(0, specificAnalysis.confidenceScore - 10);
      }
    }
    
    const isPositive = stockData.changePercent >= 0;
    const changePercentText = stockData.changePercent ? `${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%` : 'N/A';
    const rsiText = stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A';
    
    // Language-specific text
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
    let summaryOfContent = '';
    let keyPointsTitle = '';
    let riskLevelTitle = '';
    let currentPriceLabel = '';
    let dailyChangeLabel = '';
    let dayRangeLabel = '';
    let rsiLabel = '';
    let overallTrendLabel = '';
    let macdLabel = '';
    let trendLabel = '';
    let sma20Label = '';
    let sma50Label = '';
    let volatilityLabel = '';
    let avgVolumeLabel = '';
    
    if (language === 'Traditional Chinese') {
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
      
    } else if (language === 'Simplified Chinese') {
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
    
    const displayName = companyInfo.chineseName || companyInfo.name || symbol;
    const overallTrend = stockData.trend === 'Uptrend' ? (language === 'Traditional Chinese' ? '看好' : language === 'Simplified Chinese' ? '看好' : 'Bullish') : 
                         stockData.trend === 'Downtrend' ? (language === 'Traditional Chinese' ? '看淡' : language === 'Simplified Chinese' ? '看淡' : 'Bearish') : 
                         (language === 'Traditional Chinese' ? '橫向整理' : language === 'Simplified Chinese' ? '横向整理' : 'Sideways');
    
    let riskText = '';
    if (language === 'Traditional Chinese') {
      riskText = specificAnalysis.riskLevel === 'extreme' ? '⚠️ 極高風險' :
                 specificAnalysis.riskLevel === 'high' ? '⚠️ 高風險' :
                 specificAnalysis.riskLevel === 'medium' ? '⚠️ 中等風險' : '✅ 低風險';
    } else if (language === 'Simplified Chinese') {
      riskText = specificAnalysis.riskLevel === 'extreme' ? '⚠️ 极高风险' :
                 specificAnalysis.riskLevel === 'high' ? '⚠️ 高风险' :
                 specificAnalysis.riskLevel === 'medium' ? '⚠️ 中等风险' : '✅ 低风险';
    } else {
      riskText = specificAnalysis.riskLevel === 'extreme' ? '⚠️ EXTREME RISK' :
                 specificAnalysis.riskLevel === 'high' ? '⚠️ HIGH RISK' :
                 specificAnalysis.riskLevel === 'medium' ? '⚠️ MEDIUM RISK' : '✅ LOW RISK';
    }
    
    // Build fundamentals text
    let fundamentalsText = '';
    if (fundamentals && fundamentals.marketCap !== 'N/A') {
      const pe = fundamentals.peRatio;
      const eps = fundamentals.eps;
      const revenueGrowth = fundamentals.revenueGrowth;
      const profitMargin = fundamentals.profitMargin;
      const debtRatio = fundamentals.debtRatio;
      const dividendYield = fundamentals.dividendYield;
      
      if (language === 'Traditional Chinese') {
        fundamentalsText = `市值: ${fundamentals.marketCap} | 市盈率: ${pe?.toFixed(2) || 'N/A'}倍 | EPS: ${eps?.toFixed(2) || 'N/A'}\n收入增長: ${revenueGrowth?.toFixed(2) || 'N/A'}% | 利潤率: ${profitMargin?.toFixed(2) || 'N/A'}%\n負債權益比: ${debtRatio?.toFixed(2) || 'N/A'} | 股息率: ${dividendYield?.toFixed(2) || 'N/A'}%`;
      } else if (language === 'Simplified Chinese') {
        fundamentalsText = `市值: ${fundamentals.marketCap} | 市盈率: ${pe?.toFixed(2) || 'N/A'}倍 | EPS: ${eps?.toFixed(2) || 'N/A'}\n收入增长: ${revenueGrowth?.toFixed(2) || 'N/A'}% | 利润率: ${profitMargin?.toFixed(2) || 'N/A'}%\n负债权益比: ${debtRatio?.toFixed(2) || 'N/A'} | 股息率: ${dividendYield?.toFixed(2) || 'N/A'}%`;
      } else {
        fundamentalsText = `Market Cap: ${fundamentals.marketCap} | P/E: ${pe?.toFixed(2) || 'N/A'}x | EPS: ${eps?.toFixed(2) || 'N/A'}\nRevenue Growth: ${revenueGrowth?.toFixed(2) || 'N/A'}% | Profit Margin: ${profitMargin?.toFixed(2) || 'N/A'}%\nDebt/Equity: ${debtRatio?.toFixed(2) || 'N/A'} | Dividend Yield: ${dividendYield?.toFixed(2) || 'N/A'}%`;
      }
    } else {
      if (language === 'Traditional Chinese') {
        fundamentalsText = '⚠️ 暫無詳細財務數據。請參考技術面分析。';
      } else if (language === 'Simplified Chinese') {
        fundamentalsText = '⚠️ 暂无详细财务数据。请参考技术面分析。';
      } else {
        fundamentalsText = '⚠️ No detailed financial data available. Please refer to technical analysis.';
      }
    }
    
    // Build news section with AI summary
    let newsText = '';
    if (userContentAnalysis && userContentAnalysis.originalContent) {
      const sentimentText = userContentAnalysis.sentiment?.sentiment === 'Positive' ? 
                           (language === 'Traditional Chinese' ? '正面' : language === 'Simplified Chinese' ? '正面' : 'Positive') :
                           userContentAnalysis.sentiment?.sentiment === 'Negative' ?
                           (language === 'Traditional Chinese' ? '負面' : language === 'Simplified Chinese' ? '負面' : 'Negative') :
                           (language === 'Traditional Chinese' ? '中性' : language === 'Simplified Chinese' ? '中性' : 'Neutral');
      
      // Use AI summary if available
      const contentSummary = userContentAnalysis.aiSummary || userContentAnalysis.summary;
      
      let aiContentAnalysis = '';
      if (userContentAnalysis.sentiment?.sentiment === 'Positive') {
        aiContentAnalysis = language === 'Traditional Chinese' ? '這份資料包含利好因素，可能支持股價向上。' :
                            language === 'Simplified Chinese' ? '这份资料包含利好因素，可能支持股价向上。' :
                            'This content contains positive factors that may support upward price movement.';
      } else if (userContentAnalysis.sentiment?.sentiment === 'Negative') {
        aiContentAnalysis = language === 'Traditional Chinese' ? '這份資料包含負面因素，可能對股價構成壓力。' :
                            language === 'Simplified Chinese' ? '这份资料包含负面因素，可能对股价构成压力。' :
                            'This content contains negative factors that may pressure the stock price.';
      } else {
        aiContentAnalysis = language === 'Traditional Chinese' ? '這份資料影響中性，沒有明確方向。' :
                            language === 'Simplified Chinese' ? '这份资料影响中性，没有明确方向。' :
                            'This content has neutral impact with no clear direction.';
      }
      
      newsText = `文章標題: ${userContentAnalysis.title}\n\n📰 AI 智能分析:\n${contentSummary}\n\n📊 情緒分析: ${sentimentText}\n${aiContentAnalysis}`;
      
    } else if (news && news.length > 0 && newsSentiment) {
      // Choose language based on user's selected language
      if (language === 'Traditional Chinese') {
        let sentimentMessage = '';
        if (newsSentiment.sentiment === 'Positive') {
          sentimentMessage = '近期新聞整體正面，市場情緒樂觀。';
        } else if (newsSentiment.sentiment === 'Negative') {
          sentimentMessage = '近期新聞整體負面，請關注潛在風險。';
        } else {
          sentimentMessage = '近期新聞情緒中性，市場沒有明顯方向。';
        }
        
        newsText = `最新新聞情緒分析 (共${news.length}篇):
📊 整體情緒: ${newsSentiment.sentiment === 'Positive' ? '正面' : newsSentiment.sentiment === 'Negative' ? '負面' : '中性'} (分數: ${newsSentiment.score})
📈 正面新聞: ${newsSentiment.positiveCount}篇 | 📉 負面新聞: ${newsSentiment.negativeCount}篇 | 📊 中性: ${newsSentiment.neutralCount}篇

${sentimentMessage}`;
        
      } else if (language === 'Simplified Chinese') {
        let sentimentMessage = '';
        if (newsSentiment.sentiment === 'Positive') {
          sentimentMessage = '近期新闻整体正面，市场情绪乐观。';
        } else if (newsSentiment.sentiment === 'Negative') {
          sentimentMessage = '近期新闻整体负面，请关注潜在风险。';
        } else {
          sentimentMessage = '近期新闻情绪中性，市场没有明显方向。';
        }
        
        newsText = `最新新闻情绪分析 (共${news.length}篇):
📊 整体情绪: ${newsSentiment.sentiment === 'Positive' ? '正面' : newsSentiment.sentiment === 'Negative' ? '负面' : '中性'} (分数: ${newsSentiment.score})
📈 正面新闻: ${newsSentiment.positiveCount}篇 | 📉 负面新闻: ${newsSentiment.negativeCount}篇 | 📊 中性: ${newsSentiment.neutralCount}篇

${sentimentMessage}`;
        
      } else {
        let sentimentMessage = '';
        if (newsSentiment.sentiment === 'Positive') {
          sentimentMessage = 'Recent news is overall positive, market sentiment is optimistic.';
        } else if (newsSentiment.sentiment === 'Negative') {
          sentimentMessage = 'Recent news is overall negative, please be aware of potential risks.';
        } else {
          sentimentMessage = 'Recent news sentiment is neutral, market has no clear direction.';
        }
        
        newsText = `Latest News Sentiment Analysis (${news.length} articles):
📊 Overall Sentiment: ${newsSentiment.sentiment} (Score: ${newsSentiment.score})
📈 Positive: ${newsSentiment.positiveCount} | 📉 Negative: ${newsSentiment.negativeCount} | 📊 Neutral: ${newsSentiment.neutralCount}

${sentimentMessage}`;
      }
    } else {
      // No news available
      if (language === 'Traditional Chinese') {
        newsText = '近期暫無重大相關新聞。';
      } else if (language === 'Simplified Chinese') {
        newsText = '近期暂无重大相关新闻。';
      } else {
        newsText = 'No significant recent news available.';
      }
    }
    
    // Build bullish and bearish text
    let bullishText = '';
    if (specificAnalysis.specificBullishFactors.length > 0) {
      bullishText = specificAnalysis.specificBullishFactors.join('\n');
    } else {
      if (language === 'Traditional Chinese') {
        bullishText = '暫無明顯看好因素';
      } else if (language === 'Simplified Chinese') {
        bullishText = '暂无明显看好因素';
      } else {
        bullishText = 'No significant bullish factors identified';
      }
    }
    
    // Build bearish text - consistent language
    let bearishText = '';
    if (specificAnalysis.specificBearishFactors.length > 0) {
      bearishText = specificAnalysis.specificBearishFactors.join('\n');
    } else {
      if (language === 'Traditional Chinese') {
        bearishText = '暫無明顯看淡因素';
      } else if (language === 'Simplified Chinese') {
        bearishText = '暂无明显看淡因素';
      } else {
        bearishText = 'No significant bearish factors identified';
      }
    }
    
    // Generate trading advice
    let tradingAdviceText = '';
    if (language === 'Traditional Chinese') {
      tradingAdviceText = `目標價: ${stockData.currency}${specificAnalysis.targetPrice.toFixed(2)}\n止蝕位: ${stockData.currency}${specificAnalysis.stopLoss.toFixed(2)}\n風險回報比: 1:${((specificAnalysis.targetPrice - stockData.price) / (stockData.price - specificAnalysis.stopLoss)).toFixed(1)}`;
    } else if (language === 'Simplified Chinese') {
      tradingAdviceText = `目标价: ${stockData.currency}${specificAnalysis.targetPrice.toFixed(2)}\n止损位: ${stockData.currency}${specificAnalysis.stopLoss.toFixed(2)}\n风险回报比: 1:${((specificAnalysis.targetPrice - stockData.price) / (stockData.price - specificAnalysis.stopLoss)).toFixed(1)}`;
    } else {
      tradingAdviceText = `Target Price: ${stockData.currency}${specificAnalysis.targetPrice.toFixed(2)}\nStop Loss: ${stockData.currency}${specificAnalysis.stopLoss.toFixed(2)}\nRisk/Reward Ratio: 1:${((specificAnalysis.targetPrice - stockData.price) / (stockData.price - specificAnalysis.stopLoss)).toFixed(1)}`;
    }
    
    // Generate confidence display
    let confidenceDisplay = '';
    if (language === 'Traditional Chinese') {
      if (specificAnalysis.confidenceScore >= 85) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 五顆星 (非常高)`;
      } else if (specificAnalysis.confidenceScore >= 70) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 四顆星 (高)`;
      } else if (specificAnalysis.confidenceScore >= 50) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 三顆星 (中等)`;
      } else if (specificAnalysis.confidenceScore >= 35) {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 兩顆星 (低)`;
      } else {
        confidenceDisplay = `信心評分: ${specificAnalysis.confidenceScore}% 一顆星 (極低)`;
      }
    } else if (language === 'Simplified Chinese') {
      if (specificAnalysis.confidenceScore >= 85) {
        confidenceDisplay = `信心评分: ${specificAnalysis.confidenceScore}% 五颗星 (非常高)`;
      } else if (specificAnalysis.confidenceScore >= 70) {
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
    
    // Generate complete analysis with all 8 sections
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

${fundamentalsTitle}
${fundamentalsText}

${newsTitle}
${newsText}

${bullishTitle}
${bullishText}

${bearishTitle}
${bearishText}

${tradingAdviceTitle}
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
    version: "5.0",
    features: {
      stockDetection: true,
      multiMarket: "HK/TW/US",
      technicalIndicators: ["RSI", "MACD", "Trend", "SMA20", "SMA50", "Volatility", "BollingerBands"],
      newsAnalysis: true,
      sentimentAnalysis: true,
      userContentIntegration: true,
      contentSummarization: true,
      aiSummary: true,
      specificAnalysis: true,
      confidenceScoring: true
    }
  });
}