import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectStock, STOCK_ALIASES } from '@/app/lib/market/stockDetector';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// =====================================
// MARKET DATA HELPERS
// =====================================

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
    if (symbol.endsWith('.HK')) yahooSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) yahooSymbol = symbol.replace('.TW', '');
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      const longName = data.chart?.result?.[0]?.meta?.longName;
      if (longName) {
        return { 
          name: longName, 
          chineseName: chineseNameFromAlias || longName
        };
      }
    }
  } catch (err) {
    console.log('Error fetching company info:', err);
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
    
    const res = await fetch(url, { 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: number) => c !== null && c > 0);
    
    if (validCloses.length === 0) return null;
    
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || validCloses[validCloses.length - 2] || price;
    const changePercent = ((price - previousClose) / previousClose) * 100;
    const dayLow = meta.regularMarketDayLow || null;
    const dayHigh = meta.regularMarketDayHigh || null;
    const rsi = calculateRSI(validCloses);
    const macd = calculateMACD(validCloses);
    const trend = determineTrend(validCloses);
    
    let currency = '$';
    if (symbol.endsWith('.TW')) currency = 'NT$';
    if (symbol.endsWith('.HK')) currency = 'HK$';
    
    return { 
      price, 
      changePercent,
      dayLow,
      dayHigh,
      rsi, 
      macd, 
      trend, 
      currency
    };
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err);
    return null;
  }
}

// =====================================
// AI PROVIDER CALLS
// =====================================

async function callOpenAI(prompt: string, systemPrompt: string): Promise<string | null> {
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
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    return null;
  } catch (error) {
    console.error("OpenAI error:", error);
    return null;
  }
}

async function callGemini(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }]
    });
    const text = result.response.text();
    return text && text.length > 10 ? text : null;
  } catch (error) {
    console.error("Gemini error:", error);
    return null;
  }
}

async function callDeepSeek(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    return null;
  } catch (error) {
    console.error("DeepSeek error:", error);
    return null;
  }
}

function getSystemPrompt(language: string): string {
  if (language === "Cantonese") {
    return `你是一位全能的AI助手及研究助理。你可以回答各類開放式問題（如旅遊、生活、通用知識、寫作、編程等），同時亦擅長金融市場分析。

重要指示：
- 必須使用繁體中文（香港粵語）回覆
- 對於一般問題（如旅遊建議），請提供實用、友善且詳細的建議
- 如果問題涉及股票或金融，請提供專業、客觀且有數據支持的分析
- 保持回答條理分明，易於閱讀`;
  } else if (language === "Simplified Chinese") {
    return `你是一位全能的AI助手及研究助理。你可以回答各类开放式问题（如旅游、生活、通用知识、写作、编程等），同时也擅长金融市场分析。

重要指示：
- 必须使用简体中文回复
- 对于一般问题（如旅游建议），请提供实用、友好且详细的建议
- 如果问题涉及股票或金融，请提供专业、客观且有数据支持的分析
- 保持回答条理分明，易于阅读`;
  } else {
    return `You are a versatile AI Assistant and Research Assistant capable of answering open-ended queries (e.g., travel recommendations, daily topics, general knowledge, coding, writing) as well as financial market analysis.

Instructions:
- Respond clearly in English
- For open-ended questions, provide helpful, friendly, and practical insights
- For stock or financial queries, offer professional, data-driven analysis
- Keep responses well-structured and concise`;
  }
}

// =====================================
// MAIN API ROUTE
// =====================================

export async function POST(req: Request) {
  try {
    const { query, language = "English", userId } = await req.json();
    
    console.log(`📡 Research query: "${query}" | Language: ${language} | User: ${userId}`);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Query cannot be empty." }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(language);
    let userPrompt = query;

    // Check if the query contains a stock symbol or stock name
    const symbol = detectStock(query);

    if (symbol) {
      console.log(`📊 Detected stock query for: ${symbol}`);
      const [stockData, companyInfo] = await Promise.all([
        fetchRealStockData(symbol),
        fetchCompanyInfo(symbol)
      ]);

      if (stockData) {
        const displayName = companyInfo.chineseName || companyInfo.name;
        userPrompt = `User Question: "${query}"\n\nReal-time Market Context for ${displayName} (${symbol}):\n- Current Price: ${stockData.currency}${stockData.price}\n- Day Change: ${stockData.changePercent.toFixed(2)}%\n- RSI (14): ${stockData.rsi ? stockData.rsi.toFixed(1) : 'N/A'}\n- MACD Signal: ${stockData.macd}\n- Trend: ${stockData.trend}\n\nPlease include these real-time technical indicators and prices in your answer.`;
      }
    }

    let response: string | null = null;
    let usedProvider = 'none';

    // 1. Try OpenAI first
    response = await callOpenAI(userPrompt, systemPrompt);
    if (response) {
      usedProvider = 'openai';
    }
    
    // 2. If OpenAI fails, try Gemini
    if (!response) {
      console.log("OpenAI failed or unavailable, trying Gemini...");
      response = await callGemini(userPrompt, systemPrompt);
      if (response) usedProvider = 'gemini';
    }
    
    // 3. If Gemini fails, try DeepSeek
    if (!response) {
      console.log("Gemini failed or unavailable, trying DeepSeek...");
      response = await callDeepSeek(userPrompt, systemPrompt);
      if (response) usedProvider = 'deepseek';
    }

    // 4. Return error if all providers fail
    if (!response) {
      return NextResponse.json({
        success: false,
        error: "All AI providers are currently unavailable. Please try again later."
      }, { status: 503 });
    }

    console.log(`✅ Successfully generated response using provider: ${usedProvider}`);

    return NextResponse.json({
      success: true,
      response: response,
      provider: usedProvider,
    });

  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json({
      success: false,
      error: "An error occurred while processing your request."
    }, { status: 500 });
  }
}