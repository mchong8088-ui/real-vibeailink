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

// 1. 輔助函數：計算 RSI (保持原樣，這是穩定的)
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

// 2. 獲取技術數據 (增加對 HK/TW 格式的兼容)
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
      rsi: rsi.toString(), 
      macd: "Neutral", 
      ma50: ma50 > 0 ? ma50.toFixed(2) : "N/A",
      prevClose: prices.length > 1 ? prices[prices.length - 2].toFixed(2) : "N/A",
      volume: meta?.regularMarketVolume?.toLocaleString() || "N/A",
      currency: meta?.currency || "USD", 
      fullName: meta?.shortName || symbol,
      history: result.timestamp.map((ts: number, index: number) => ({ 
        date: new Date(ts * 1000).toLocaleDateString(), 
        price: closes[index] 
      }))
    };
  } catch { 
    return { price: "N/A", rsi: "50", macd: "Neutral", ma50: "N/A", prevClose: "N/A", volume: "N/A", currency: "N/A", fullName: symbol, history: [] }; 
  }
}

// 4. AI 模型切換機制 (加入 Timeout 處理防止「無限旋轉」)
async function callModelWithFallback(prompt: string) {
  const models = [
    { name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', body: (p: string) => ({ model: 'gpt-4o', messages: [{ role: 'user', content: p }] }), key: process.env.OPENAI_API_KEY },
    { name: 'Gemini', url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, body: (p: string) => ({ contents: [{ parts: [{ text: p }] }] }), key: process.env.GEMINI_API_KEY },
    { name: 'DeepSeek', url: 'https://api.deepseek.com/v1/chat/completions', body: (p: string) => ({ model: 'deepseek-chat', messages: [{ role: 'user', content: p }] }), key: process.env.DEEPSEEK_API_KEY }
  ];

  for (const m of models) {
    if (!m.key) continue;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000); // 8秒超時自動換下一個模型

      const headers: any = { 'Content-Type': 'application/json' };
      if (m.name !== 'Gemini') headers['Authorization'] = `Bearer ${m.key}`;
      
      const res = await fetch(m.url, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(m.body(prompt)),
        signal: controller.signal 
      });
      clearTimeout(id);
      const data = await res.json();
      return m.name === 'Gemini' ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
    } catch (e) {
      console.warn(`${m.name} failed, trying next...`);
      continue; 
    }
  }
  return "NOT_FOUND";
}

// 5. API 入口
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticker, additionalUrl, lang } = body; // 接收 page.tsx 傳來的參數
    
    // 解析正確代號，避免 AMZN 出現 TSLA 的問題
    const symbolPrompt = `Identify the correct Yahoo Finance ticker for: "${ticker}".
    Output ONLY the ticker string (e.g., AAPL, 0700.HK, 2330.TW). 
    If you cannot find it, return "NOT_FOUND".`;
    
    let resolvedSymbol = await callModelWithFallback(symbolPrompt);
    resolvedSymbol = resolvedSymbol.trim().replace(/[^A-Za-z0-9.]/g, ''); 
    
    if (resolvedSymbol === "NOT_FOUND") resolvedSymbol = ticker; // 備案：直接用輸入值

    const tech = await getTechnicalData(resolvedSymbol);

    // 整合 URL 內容與巴菲特風格分析
    const finalPrompt = `
    請作為一名資深分析師。用戶查詢的股票是：${tech.fullName} (${resolvedSymbol})。
    ${additionalUrl ? `特別注意：請重點分析此網頁內容並納入簡報：${additionalUrl}` : ''}
    
    請提供一段「語音投資簡報」，格式如下：
    1. 開頭：明確說出「我們現在來分析 ${tech.fullName}，代號 ${resolvedSymbol}。」
    2. 分析風格：模仿巴菲特，討論「虛擬壟斷」、「資本配置」與「護城河」。
    3. 納入數據：當前價格 ${tech.price}，RSI 為 ${tech.rsi}。
    
    請用 ${lang || '繁體中文'} 撰寫。不要使用 Markdown 符號（如 # 或 *）。
    `;

    const summary = await callModelWithFallback(finalPrompt);

    // 回傳符合 AnalysisDashboard 需求的 JSON
    return NextResponse.json({ 
      summary: summary, 
      technicalCard: tech, 
      symbol: resolvedSymbol, 
      report: {
        title: `${tech.fullName} 戰略分析報告`,
        summary: summary
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "伺服器處理異常" }, { status: 500 });
  }
}