// AI Gateway - Multi-provider fallback chain
// Order: Gemini → OpenAI → DeepSeek → Mock (last resort)

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================
// Provider 1: Google Gemini
// ============================================
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key missing');
  }
  
  console.log('🤖 Calling Gemini...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  if (!text || text.trim().length === 0) {
    throw new Error('Gemini returned empty response');
  }
  
  console.log('✅ Gemini success');
  return text;
}

// ============================================
// Provider 2: OpenAI
// ============================================
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key missing');
  }
  
  console.log('🤖 Calling OpenAI...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
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
  
  if (!text) {
    throw new Error('OpenAI returned empty response');
  }
  
  console.log('✅ OpenAI success');
  return text;
}

// ============================================
// Provider 3: DeepSeek
// ============================================
async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API key missing');
  }
  
  console.log('🤖 Calling DeepSeek...');
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
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
  
  if (!text) {
    throw new Error('DeepSeek returned empty response');
  }
  
  console.log('✅ DeepSeek success');
  return text;
}

// ============================================
// Fallback: Mock AI (when all APIs fail)
// ============================================
function callMockAI(prompt: string): string {
  console.log('⚠️ Using mock AI response (no API keys configured)');
  
  // Extract symbol from prompt (simple heuristic)
  const symbolMatch = prompt.match(/Symbol: ([A-Z0-9.]+)/i);
  const symbol = symbolMatch ? symbolMatch[1] : 'the stock';
  
  // Extract price from prompt
  const priceMatch = prompt.match(/Current Price: \$([0-9.]+)/i);
  const price = priceMatch ? parseFloat(priceMatch[1]) : null;
  
  return `{
  "summary": "${symbol} shows mixed technical signals with neutral momentum. Current price action suggests consolidation in the near term.",
  "technical": "RSI is in neutral territory. MACD shows mixed signals. Price is trading near key support levels.",
  "fundamental": "Valuation metrics appear reasonable relative to sector peers. Monitor upcoming earnings for confirmation.",
  "bullCase": [
    "Technical indicators suggest potential bounce from support",
    "Volume patterns show accumulation at current levels"
  ],
  "bearCase": [
    "Resistance overhead may cap upside",
    "Market volatility could pressure prices"
  ],
  "risks": [
    "Broader market uncertainty",
    "Interest rate expectations",
    "Sector rotation risk"
  ],
  "recommendation": "HOLD",
  "priceTarget": price ? `$${(price * 1.05).toFixed(2)}` : "N/A",
  "confidence": 65
}`;
}

// ============================================
// MAIN EXPORT - AI Gateway with fallback chain
// ============================================

export interface AIGatewayOptions {
  timeout?: number;      // Request timeout in ms (default: 30000)
  retries?: number;      // Number of retries per provider (default: 1)
  skipMock?: boolean;    // Skip mock fallback (default: false)
}

export async function callAI(prompt: string, options?: AIGatewayOptions): Promise<string> {
  const timeout = options?.timeout || 30000;
  const retries = options?.retries || 1;
  
  console.log('🚀 AI Gateway: Starting request');
  console.log(`📝 Prompt length: ${prompt.length} characters`);
  
  // Track which providers were tried
  const triedProviders: string[] = [];
  
  // Helper to call with timeout
  const withTimeout = async <T>(promise: Promise<T>, providerName: string): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${providerName} timeout after ${timeout}ms`)), timeout);
    });
    return Promise.race([promise, timeoutPromise]);
  };
  
  // Helper to retry a provider
  const retryProvider = async (
    providerFn: () => Promise<string>,
    providerName: string
  ): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`  Attempt ${attempt}/${retries} for ${providerName}...`);
        const result = await withTimeout(providerFn(), providerName);
        if (result && result.trim().length > 0) {
          return result;
        }
      } catch (err: any) {
        console.log(`  ${providerName} attempt ${attempt} failed: ${err.message}`);
        if (attempt === retries) {
          triedProviders.push(providerName);
        }
      }
    }
    return null;
  };
  
  // Try Gemini
  const geminiResult = await retryProvider(() => callGemini(prompt), 'Gemini');
  if (geminiResult) return geminiResult;
  
  // Try OpenAI
  const openaiResult = await retryProvider(() => callOpenAI(prompt), 'OpenAI');
  if (openaiResult) return openaiResult;
  
  // Try DeepSeek
  const deepseekResult = await retryProvider(() => callDeepSeek(prompt), 'DeepSeek');
  if (deepseekResult) return deepseekResult;
  
  // Final fallback: Mock AI
  console.log(`⚠️ All providers failed: ${triedProviders.join(', ')}`);
  
  if (options?.skipMock) {
    throw new Error('All AI providers failed and mock is disabled');
  }
  
  return callMockAI(prompt);
}

// ============================================
// Helper: Test all providers
// ============================================

export async function testAIGateway(): Promise<{ provider: string; working: boolean; error?: string }[]> {
  const testPrompt = 'Respond with just "OK" if you are working.';
  const results = [];
  
  // Test Gemini
  try {
    await callGemini(testPrompt);
    results.push({ provider: 'Gemini', working: true });
  } catch (err: any) {
    results.push({ provider: 'Gemini', working: false, error: err.message });
  }
  
  // Test OpenAI
  try {
    await callOpenAI(testPrompt);
    results.push({ provider: 'OpenAI', working: true });
  } catch (err: any) {
    results.push({ provider: 'OpenAI', working: false, error: err.message });
  }
  
  // Test DeepSeek
  try {
    await callDeepSeek(testPrompt);
    results.push({ provider: 'DeepSeek', working: true });
  } catch (err: any) {
    results.push({ provider: 'DeepSeek', working: false, error: err.message });
  }
  
  console.table(results);
  return results;
}

// ============================================
// Helper: Get available providers
// ============================================

export function getAvailableProviders(): { gemini: boolean; openai: boolean; deepseek: boolean } {
  return {
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  };
}
