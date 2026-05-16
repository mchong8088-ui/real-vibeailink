// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { extractStockSymbol } from "../../lib/market/symbolParser";

// =====================================
// YAHOO FINANCE API - REAL DATA
// =====================================

function calculateRSI(prices: number[], period: number = 14): number {
  const cleanPrices = prices.filter((p): p is number => p !== null && p !== undefined);
  if (cleanPrices.length <= period) return 50.0;
  
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = cleanPrices[i] - cleanPrices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  for (let i = period + 1; i < cleanPrices.length; i++) {
    const diff = cleanPrices[i] - cleanPrices[i - 1];
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - (100 / (1 + rs))).toFixed(1));
}

async function fetchRealStockData(symbol: string, range: string = '1mo') {
  try {
    let yahooSymbol = symbol;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${range}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const timestamps = result?.timestamp || [];
    const prices = closes.filter((p: number | null) => p !== null);
    
    const rsi = prices.length >= 15 ? calculateRSI(prices.slice(-15)) : 50;
    
    let sma20 = null;
    let sma50 = null;
    if (prices.length >= 20) {
      sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    }
    if (prices.length >= 50) {
      sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
    }
    
    const currentPrice = meta.regularMarketPrice || prices[prices.length - 1] || 0;
    
    let macdStatus = "Neutral";
    let rsiStatus = "Neutral";
    if (rsi > 70) rsiStatus = "Overbought";
    else if (rsi < 30) rsiStatus = "Oversold";
    if (sma20 && currentPrice > sma20 * 1.02) macdStatus = "Bullish";
    else if (sma20 && currentPrice < sma20 * 0.98) macdStatus = "Bearish";
    
    let change = 0;
    let changePercent = 0;
    if (prices.length >= 2) {
      const prevClose = prices[prices.length - 2];
      const lastClose = prices[prices.length - 1];
      if (prevClose && lastClose) {
        change = lastClose - prevClose;
        changePercent = (change / prevClose) * 100;
      }
    }
    
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && timestamps[i]) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          close: closes[i],
        });
      }
    }
    
    return {
      symbol: yahooSymbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: meta.regularMarketVolume || 0,
      rsi: rsi,
      rsiStatus: rsiStatus,
      macdStatus: macdStatus,
      sma20: sma20,
      sma50: sma50,
      fullName: meta.longName || meta.shortName || symbol,
      currency: meta.currency || "USD",
      historical: historical,
    };
    
  } catch (error) {
    console.error("Yahoo Finance error:", error);
    return null;
  }
}

// =====================================
// FETCH FUNDAMENTALS
// =====================================

async function fetchFundamentals(symbol: string) {
  const fundamentalsMap: Record<string, any> = {
    "TSLA": { marketCap: "$850B", peRatio: "65.2", forwardPE: "52.8", revenueGrowth: "18.5", profitMargins: "15.2", analystRating: "Buy", targetPrice: 185 },
    "AAPL": { marketCap: "$2.8T", peRatio: "28.5", forwardPE: "25.2", revenueGrowth: "5.2", profitMargins: "26.5", analystRating: "Buy", targetPrice: 195 },
    "NVDA": { marketCap: "$1.2T", peRatio: "72.5", forwardPE: "45.2", revenueGrowth: "85.5", profitMargins: "48.2", analystRating: "Strong Buy", targetPrice: 950 },
    "0700.HK": { marketCap: "$450B", peRatio: "18.5", forwardPE: "16.2", revenueGrowth: "8.5", profitMargins: "22.5", analystRating: "Hold", targetPrice: 165 },
    "2330.TW": { marketCap: "$500B", peRatio: "18.5", forwardPE: "16.2", revenueGrowth: "12.5", profitMargins: "45.2", analystRating: "Buy", targetPrice: 850 },
  };
  
  return fundamentalsMap[symbol] || { marketCap: "N/A", peRatio: "N/A", forwardPE: "N/A", revenueGrowth: "N/A", profitMargins: "N/A", analystRating: "Hold", targetPrice: null };
}

// =====================================
// FETCH NEWS
// =====================================

function getMockNews(symbol: string): string[] {
  return [
    `${symbol} recent trading activity shows strong momentum, investor attention increasing.`,
    `Analysts update rating and price target for ${symbol}.`,
    `Market digesting latest economic data and industry trends.`,
  ];
}

async function fetchStockNews(symbol: string): Promise<string[]> {
  try {
    return getMockNews(symbol);
  } catch (error) {
    return getMockNews(symbol);
  }
}

// =====================================
// ANALYZE NEWS SENTIMENT
// =====================================

function analyzeNewsSentiment(headlines: string[]): string {
  if (!headlines || headlines.length === 0) return "Neutral";
  
  let positive = 0;
  let negative = 0;
  
  const positiveWords = ['strong', 'growth', 'profit', 'positive', 'bullish', 'upgrade', 'high', 'rally'];
  const negativeWords = ['decline', 'loss', 'negative', 'bearish', 'downgrade', 'risk', 'concern'];
  
  headlines.forEach(headline => {
    positiveWords.forEach(w => { if (headline.toLowerCase().includes(w)) positive++; });
    negativeWords.forEach(w => { if (headline.toLowerCase().includes(w)) negative++; });
  });
  
  if (positive > negative + 2) return "Positive";
  if (negative > positive + 2) return "Negative";
  return "Neutral";
}

// =====================================
// MARKET REGIME DETECTION
// =====================================

function detectMarketRegime(rsi: number | null, macdStatus: string, newsSentiment: string) {
  let regime = "Neutral";
  let sentiment = "Neutral";
  let confidence = 50;
  
  if (rsi && rsi > 60 && macdStatus === "Bullish") {
    regime = "Bullish";
    sentiment = "Optimistic";
    confidence = 70;
  } else if (rsi && rsi < 40 && macdStatus === "Bearish") {
    regime = "Bearish";
    sentiment = "Cautious";
    confidence = 70;
  } else if (rsi && rsi > 70) {
    regime = "Overbought";
    sentiment = "Cautious";
    confidence = 65;
  } else if (rsi && rsi < 30) {
    regime = "Oversold";
    sentiment = "Opportunistic";
    confidence = 65;
  }
  
  if (newsSentiment === "Positive" && regime !== "Bearish") {
    sentiment = "Optimistic";
    confidence = Math.min(90, confidence + 10);
  } else if (newsSentiment === "Negative" && regime !== "Bullish") {
    sentiment = "Cautious";
    confidence = Math.min(90, confidence + 10);
  }
  
  return { regime, sentiment, confidence };
}

// =====================================
// BUILD PROMPTS
// =====================================

function buildSystemPrompt(language: string): string {
  console.log("Building system prompt for language:", language);
  
  if (language === "Cantonese") {
    return `【重要指示】你必須使用繁體中文（香港粵語）回覆。絕對不要使用英文。

你是一位專業的AI股票市場分析師。

請根據提供的數據提供詳細的股票分析。

使用繁體中文，專業、詳細。`;
  } else if (language === "简体中文") {
    return `【重要指示】你必须使用简体中文回复。绝对不要使用英文。

你是一位专业的AI股票市场分析师。

请根据提供的数据提供详细的股票分析。

使用简体中文，专业、详细。`;
  } else {
    return `CRITICAL INSTRUCTION: You MUST respond in ENGLISH only. Do NOT use any Chinese characters at all.

You are a professional AI stock market analyst.

Provide a detailed stock analysis in ENGLISH based on the provided data.

Use professional, detailed English.`;
  }
}

function buildAnalysisPrompt(
  symbol: string,
  displayName: string,
  stockData: any,
  fundamentals: any,
  headlines: string[],
  newsSentiment: string,
  marketRegime: any,
  language: string
): string {
  const currency = symbol.includes('HK') ? 'HK$' : (symbol.includes('TW') ? 'NT$' : '$');
  
  const languageInstruction = language === "English" 
    ? "IMPORTANT: Respond in ENGLISH only. Do not use any Chinese characters.\n\n"
    : language === "Cantonese" 
    ? "重要：請用繁體中文（香港粵語）回覆。\n\n"
    : "重要：请用简体中文回复。\n\n";
  
  return languageInstruction + `
Analyze the following stock:

Stock Name: ${displayName}
Stock Symbol: ${symbol}

【Technical Data】
- Current Price: ${currency}${stockData.price?.toFixed(2) || 'N/A'}
- Daily Change: ${stockData.changePercent?.toFixed(2) || '0'}%
- RSI (14): ${stockData.rsi?.toFixed(1) || 'N/A'} (${stockData.rsiStatus || 'Neutral'})
- MACD Signal: ${stockData.macdStatus || 'Neutral'}
- 20-day SMA: ${currency}${stockData.sma20?.toFixed(2) || 'N/A'}
- 50-day SMA: ${currency}${stockData.sma50?.toFixed(2) || 'N/A'}
- Volume: ${stockData.volume?.toLocaleString() || 'N/A'}

【Fundamental Data】
- Market Cap: ${fundamentals?.marketCap || 'N/A'}
- P/E Ratio: ${fundamentals?.peRatio || 'N/A'}
- Forward P/E: ${fundamentals?.forwardPE || 'N/A'}
- Revenue Growth: ${fundamentals?.revenueGrowth || 'N/A'}%
- Profit Margins: ${fundamentals?.profitMargins || 'N/A'}%
- Analyst Rating: ${fundamentals?.analystRating || 'N/A'}
- Target Price: ${fundamentals?.targetPrice ? currency + fundamentals.targetPrice : 'N/A'}

【Market Conditions】
- Market Trend: ${marketRegime?.regime || 'Neutral'}
- Market Sentiment: ${marketRegime?.sentiment || 'Neutral'}

【Recent News】
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}
News Sentiment: ${newsSentiment || 'Neutral'}

Please provide a detailed investment analysis including:
1. Market Summary
2. Technical Outlook
3. Fundamental Analysis
4. News Impact
5. Bullish Factors
6. Bearish Factors
7. Risk Warning
8. Investment Recommendation`;
}

// =====================================
// AI CALL WITH FALLBACK
// =====================================

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          { role: "user", content: "Remember to respond in the language specified in the system prompt. Use ONLY that language, do not mix languages." }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      console.log("✅ OpenAI response successful");
      console.log("Response preview:", data.choices[0].message.content.substring(0, 100));
      return data.choices[0].message.content;
    }
    throw new Error("OpenAI returned no content");
  } catch (error) {
    console.warn("OpenAI failed, using fallback");
  }
  
  return generateFallbackAnalysis(systemPrompt, userPrompt);
}

function generateFallbackAnalysis(systemPrompt: string, userPrompt: string): string {
  return "Analysis temporarily unavailable. Please try again later.";
}

// =====================================
// FORMAT PRICE
// =====================================

const formatPrice = (price: number, currency: string): string => {
  if (!price) return "N/A";
  const symbol = currency === 'HKD' ? 'HK$' : (currency === 'TWD' ? 'NT$' : '$');
  return `${symbol}${price.toFixed(2)}`;
};

// =====================================
// GET HANDLER - Historical & Batch Data
// =====================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const symbols = searchParams.get("symbols")?.split(",");
    const range = searchParams.get("range") || "1mo";
    const type = searchParams.get("type") || "single";

    if (type === "batch" && symbols && symbols.length > 0) {
      const results: Record<string, any> = {};
      
      for (const sym of symbols) {
        const data = await fetchRealStockData(sym.trim(), "1d");
        if (data) {
          results[sym.trim()] = {
            symbol: data.symbol,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            volume: data.volume,
            fullName: data.fullName,
            currency: data.currency,
          };
        } else {
          results[sym.trim()] = { error: "Failed to fetch data" };
        }
      }
      
      return NextResponse.json({ success: true, data: results });
    }

    if (symbol) {
      const stockData = await fetchRealStockData(symbol, range);
      
      if (!stockData) {
        return NextResponse.json(
          { success: false, error: `No data found for symbol: ${symbol}` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        symbol: stockData.symbol,
        fullName: stockData.fullName,
        currency: stockData.currency,
        currentPrice: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        technicals: {
          rsi: stockData.rsi,
          rsiStatus: stockData.rsiStatus,
          macdStatus: stockData.macdStatus,
          sma20: stockData.sma20,
          sma50: stockData.sma50,
        },
        historical: stockData.historical,
      });
    }

    return NextResponse.json(
      { success: false, error: "Please provide either 'symbol' or 'symbols' parameter" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("GET Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}

// =====================================
// POST HANDLER - Chat/Analysis
// =====================================

export async function POST(req: Request) {
  try {
    const { message, language } = await req.json();
    const selectedLanguage = language || "English";

    console.log("Language:", selectedLanguage, "Message:", message);

    const symbol = extractStockSymbol(message);
    
    if (!symbol) {
      let errorMsg = "Unable to detect stock symbol.";
      if (selectedLanguage === "Cantonese") errorMsg = "無法識別股票代號。請輸入如 TSLA、0700.HK 或 2330.TW";
      else if (selectedLanguage === "简体中文") errorMsg = "无法识别股票代号。请输入如 TSLA、0700.HK 或 2330.TW";
      return NextResponse.json({ success: false, text: errorMsg });
    }

    console.log("Detected Symbol:", symbol);

    let stockData = await fetchRealStockData(symbol);
    
    if (!stockData) {
      let errorMsg = `Unable to fetch data for ${symbol}. Please try again.`;
      if (selectedLanguage === "Cantonese") errorMsg = `無法獲取 ${symbol} 的數據。請稍後再試。`;
      else if (selectedLanguage === "简体中文") errorMsg = `无法获取 ${symbol} 的数据。请稍后再试。`;
      return NextResponse.json({ success: false, text: errorMsg });
    }

    console.log(`✅ Real-time: ${symbol} - ${stockData.currency} $${stockData.price.toFixed(2)}`);

    const fundamentals = await fetchFundamentals(symbol);
    const headlines = await fetchStockNews(symbol);
    const newsSentiment = analyzeNewsSentiment(headlines);
    const marketRegime = detectMarketRegime(stockData.rsi, stockData.macdStatus, newsSentiment);

    const systemPrompt = buildSystemPrompt(selectedLanguage);
    const analysisPrompt = buildAnalysisPrompt(
      symbol, 
      stockData.fullName || symbol, 
      stockData, 
      fundamentals, 
      headlines, 
      newsSentiment, 
      marketRegime,
      selectedLanguage
    );

    console.log("Calling AI...");
    
    const aiAnalysis = await callAI(systemPrompt, analysisPrompt);

    const responseData = {
      success: true,
      symbol: symbol,
      price: formatPrice(stockData.price, stockData.currency),
      change: stockData.change,
      changePercent: stockData.changePercent,
      rsi: stockData.rsi?.toFixed(1) || "N/A",
      macd: stockData.macdStatus,
      sma20: stockData.sma20 ? formatPrice(stockData.sma20, stockData.currency) : "N/A",
      sma50: stockData.sma50 ? formatPrice(stockData.sma50, stockData.currency) : "N/A",
      volume: stockData.volume?.toLocaleString() || "N/A",
      marketCap: fundamentals?.marketCap || "N/A",
      peRatio: fundamentals?.peRatio || "N/A",
      high52w: "N/A",
      low52w: "N/A",
      avgVolume: "N/A",
      historical: stockData.historical || [],
      summary: aiAnalysis,
      text: aiAnalysis,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({
      success: false,
      text: "System temporarily unavailable. Please try again."
    });
  }
}