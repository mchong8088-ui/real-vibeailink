// AI Gateway - Simple version with fallback chain

// Mock AI response when all APIs fail
function callMockAI(prompt: string): string {
  console.log('⚠️ Using mock AI response');
  
  // Extract symbol from prompt
  const symbolMatch = prompt.match(/STOCK: ([A-Z0-9.]+)/i);
  const symbol = symbolMatch ? symbolMatch[1] : 'the stock';
  
  return `{
  "summary": "${symbol} shows mixed signals. Technical indicators suggest neutral momentum in the near term.",
  "technical": "RSI is in neutral territory. MACD shows mixed signals. Price is near key support levels.",
  "fundamental": "Valuation appears reasonable relative to sector peers.",
  "bullCase": ["Technical indicators suggest potential bounce", "Support levels holding"],
  "bearCase": ["Resistance overhead may limit upside", "Market volatility"],
  "risks": ["Broader market uncertainty", "Interest rate expectations"],
  "recommendation": "HOLD",
  "priceTarget": "N/A",
  "confidence": 65
}`;
}

// Google Gemini API
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key missing');
  
  console.log('🤖 Calling Gemini...');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) throw new Error('Gemini API error');
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error('Gemini returned empty response');
  
  console.log('✅ Gemini success');
  return text;
}

// OpenAI API
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
    }),
  });
  
  if (!response.ok) throw new Error('OpenAI API error');
  
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) throw new Error('OpenAI returned empty response');
  
  console.log('✅ OpenAI success');
  return text;
}

// DeepSeek API
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
    }),
  });
  
  if (!response.ok) throw new Error('DeepSeek API error');
  
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) throw new Error('DeepSeek returned empty response');
  
  console.log('✅ DeepSeek success');
  return text;
}

// Main AI Gateway with fallback chain
export async function callAI(prompt: string): Promise<string> {
  console.log('🚀 AI Gateway: Starting request');
  
  // Try Gemini first
  try {
    return await callGemini(prompt);
  } catch (err: any) {
    console.log(`Gemini failed: ${err.message}`);
  }
  
  // Try OpenAI second
  try {
    return await callOpenAI(prompt);
  } catch (err: any) {
    console.log(`OpenAI failed: ${err.message}`);
  }
  
  // Try DeepSeek third
  try {
    return await callDeepSeek(prompt);
  } catch (err: any) {
    console.log(`DeepSeek failed: ${err.message}`);
  }
  
  // Final fallback: mock AI
  console.log('⚠️ All APIs failed, using mock response');
  return callMockAI(prompt);
}

// Helper to check available providers
export function getAvailableProviders() {
  return {
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  };
}
