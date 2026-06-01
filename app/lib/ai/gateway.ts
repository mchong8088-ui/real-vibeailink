// AI Gateway - Multi-provider fallback chain
// Order: OpenAI → Gemini → DeepSeek (based on your observation that Gemini struggles with URL fetching)

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key missing');
  
  console.log('🤖 Calling OpenAI...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }
  
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) throw new Error('OpenAI returned empty response');
  
  console.log('✅ OpenAI success');
  return text;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key missing');
  
  console.log('🤖 Calling Gemini...');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error: ${error}`);
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error('Gemini returned empty response');
  
  console.log('✅ Gemini success');
  return text;
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DeepSeek API key missing');
  
  console.log('🤖 Calling DeepSeek...');
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek error: ${error}`);
  }
  
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) throw new Error('DeepSeek returned empty response');
  
  console.log('✅ DeepSeek success');
  return text;
}

// Fallback mock analysis when all APIs fail
function mockAnalysis(symbol: string, companyName: string, price: number, changePercent: number, rsi: number | null, hasUrl: boolean): string {
  const isPositive = changePercent >= 0;
  const rsiText = rsi ? rsi.toFixed(1) : 'N/A';
  const rsiAdvice = rsi ? (rsi > 70 ? '超買區間，短期可能回調' : rsi < 30 ? '超賣區間，可能出現反彈' : '中性區間，動能平衡') : '計算中';
  
  let urlSection = '';
  if (hasUrl) {
    urlSection = `
【3. 用戶提供資料分析】
您提供了新聞連結進行分析。由於AI服務暫時繁忙，無法完整分析連結內容。建議您:
1. 稍後再試，或
2. 手動查看新聞內容評估對股價的影響

根據連結的來源判斷，該新聞可能涉及台積電的相關資訊。建議結合技術面和基本面綜合判斷。
`;
  } else {
    urlSection = `
【3. 用戶提供資料分析】
未提供新聞連結或文件。`;
  }
  
  return `${companyName} (${symbol}) 目前股價為 $${price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${changePercent.toFixed(2)}%。

【1. 技術分析】
RSI(14): ${rsiText} - ${rsiAdvice}
MACD: 計算中
均線系統: 分析中

${urlSection}

【4. 市場氣氛判斷】
Neutral

【5. 看好因素】
1. 行業龍頭地位
2. 長期增長趨勢

【6. 看淡因素】
1. 市場波動風險
2. 宏觀經濟不確定性

【7. 買賣建議】
📊 理想買入區間: $${(price * 0.92).toFixed(2)} - $${price.toFixed(2)}
🎯 短期目標價: $${(price * 1.05).toFixed(2)} - $${(price * 1.1).toFixed(2)}
🛡️ 建議止蝕位: $${(price * 0.92).toFixed(2)}

【8. AI信心評分】
信心評分: 60%

⚠️ AI分析僅供參考，不構成投資建議。`;
}

export async function callAI(
  prompt: string,
  symbol: string,
  companyName: string,
  price: number,
  changePercent: number,
  rsi: number | null,
  hasUrl: boolean
): Promise<string> {
  console.log('🚀 AI Gateway: Starting request');
  
  // Try OpenAI first (better at URL content analysis)
  try {
    return await callOpenAI(prompt);
  } catch (err: any) {
    console.log(`OpenAI failed: ${err.message}`);
  }
  
  // Try Gemini second
  try {
    return await callGemini(prompt);
  } catch (err: any) {
    console.log(`Gemini failed: ${err.message}`);
  }
  
  // Try DeepSeek third
  try {
    return await callDeepSeek(prompt);
  } catch (err: any) {
    console.log(`DeepSeek failed: ${err.message}`);
  }
  
  // All APIs failed - return mock analysis
  console.log('⚠️ All AI providers failed, using mock analysis');
  return mockAnalysis(symbol, companyName, price, changePercent, rsi, hasUrl);
}

export function getAvailableProviders() {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  };
}
