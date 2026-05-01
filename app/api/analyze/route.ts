import { NextResponse } from 'next/server';

interface TechData {
  price: string;
  rsi: string;
  macd: string;
  ma50: string;
  prevClose: string;
  volume: string;
  currency: string;
  fullName: string;
  history: { date: string; price: number }[];
}

// 1. 輔助函數：計算 RSI
function calculateRSI(prices: number[], period: number = 14): number {
  const cleanPrices = prices.filter((p): p is number => p !== null && p !== undefined);
  if (cleanPrices.length <= period) return 50.0;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = cleanPrices[i] - cleanPrices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < cleanPrices.length; i++) {
    const diff = cleanPrices[i] - cleanPrices[i - 1];
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - (100 / (1 + rs))).toFixed(1));
}

// 2. 獲取技術數據
async function getTechnicalData(symbol: string, range: string = '1mo'): Promise<TechData> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("No data");
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const prices = closes.filter((p: number | null) => p !== null);
    const rsi = calculateRSI(prices.slice(-15));
    const ma50 = prices.length >= 50 ? (prices.slice(-50).reduce((a, b) => a + b, 0) / 50) : 0;
    return {
      price: meta?.regularMarketPrice?.toFixed(2) || "N/A",
      rsi: rsi.toString(), macd: "Neutral", ma50: ma50 > 0 ? ma50.toFixed(2) : "N/A",
      prevClose: prices.length > 1 ? prices[prices.length - 2].toFixed(2) : "N/A",
      volume: meta?.regularMarketVolume?.toLocaleString() || "N/A",
      currency: meta?.currency || "HKD", fullName: meta?.shortName || symbol,
      history: result.timestamp.map((ts: number, index: number) => ({ date: new Date(ts * 1000).toLocaleDateString(), price: closes[index] }))
    };
  } catch { return { price: "N/A", rsi: "50", macd: "Neutral", ma50: "N/A", prevClose: "N/A", volume: "N/A", currency: "N/A", fullName: symbol, history: [] }; }
}

// 3. 新聞獲取
async function getMultiSourceNews(symbol: string) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=3`);
    const data = await res.json();
    const newsTitles = data.news?.map((n: any) => n.title).join(' | ') || "無相關新聞";
    return `近期新聞：${newsTitles}`;
  } catch { return "無法獲取新聞。"; }
}

// 4. AI 模型切換機制 (請確保此函數在 POST 之前)
async function callModelWithFallback(prompt: string) {
  const models = [
    { name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', body: (p: string) => ({ model: 'gpt-4o', messages: [{ role: 'user', content: p }] }), key: process.env.OPENAI_API_KEY },
    { name: 'Gemini', url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, body: (p: string) => ({ contents: [{ parts: [{ text: p }] }] }), key: process.env.GEMINI_API_KEY },
    { name: 'DeepSeek', url: 'https://api.deepseek.com/v1/chat/completions', body: (p: string) => ({ model: 'deepseek-chat', messages: [{ role: 'user', content: p }] }), key: process.env.DEEPSEEK_API_KEY }
  ];
  for (const m of models) {
    if (!m.key) continue;
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (m.name !== 'Gemini') headers['Authorization'] = `Bearer ${m.key}`;
      const res = await fetch(m.url, { method: 'POST', headers, body: JSON.stringify(m.body(prompt)) });
      const data = await res.json();
      return m.name === 'Gemini' ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
    } catch { continue; }
  }
  return "NOT_FOUND";
}

// 5. API 入口
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.symbol;
    
    // 強化解析 Prompt，加入強制對應規則
    const prompt = `請將用戶輸入 "${query}" 轉換為 Yahoo Finance 標準代號。
若用戶輸入 Tesla，強制回傳 TSLA。
若用戶輸入 TSMC 或 台積電，強制回傳 2330.TW。
若用戶輸入 騰訊，強制回傳 0700.HK。
只回傳代號字串，若無法判斷回傳 "NOT_FOUND"。`;
    
    let resolvedSymbol = await callModelWithFallback(prompt);
    resolvedSymbol = resolvedSymbol.trim().replace(/[^A-Za-z0-9.]/g, ''); 
    
    if (resolvedSymbol === "NOT_FOUND") return NextResponse.json({ error: "找不到代號" }, { status: 400 });

    const [tech, newsSummary] = await Promise.all([
      getTechnicalData(resolvedSymbol, body.range || '1mo'),
      getMultiSourceNews(resolvedSymbol)
    ]);

    // 關鍵修改：將 fullName 和 symbol 強制注入到報告開頭
    const finalPrompt = `
請作為一名資深分析師，為用戶錄製一段「語音投資簡報」。
報告必須嚴格遵守以下格式：

1. 開頭：請明確說出「我們現在來分析 ${tech.fullName}，代號 ${resolvedSymbol}。」，隨後說明當前價格 ${tech.price}。
2. 結構要求：每個數字說明後，請加上一句「投資意義」。
3. 語音格式化：
   - 每個項目之間請明確換行，不要使用編號 (例如：1. 2. 3.)。
   - 請將每一項標題處理為對話的引導詞，例如「首先看市場概況...」、「接著我們分析技術面...」。
   - 每一個句號後請務必換行。
   - 絕對禁止使用 Markdown 符號。

請依序填入以下內容：
- 市場趨勢分析 (${tech.price})
- 技術指標解讀 (RSI: ${tech.rsi}, MA50: ${tech.ma50})
- 基本面與新聞動態 (${newsSummary})
- 風險點評與三種情境預測
- 最終行動建議 (評級、信心分、具體區間)

請用 ${body.lang || '繁體中文'} 撰寫。
`;

    const summary = await callModelWithFallback(finalPrompt);

    return NextResponse.json({ 
      summary: summary.replace(/[#*]/g, ''), 
      technicalCard: tech, 
      symbol: resolvedSymbol, 
      fullName: tech.fullName 
    });
  } catch (error) {
    return NextResponse.json({ error: "伺服器處理異常" }, { status: 500 });
  }
}