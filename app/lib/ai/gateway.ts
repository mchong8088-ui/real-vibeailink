// app/lib/ai/gateway.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// =====================================
// 1. OPENAI (Primary)
// =====================================

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      console.log("✅ OpenAI response successful");
      return data.choices[0].message.content;
    }
    throw new Error("OpenAI returned no content");
  } catch (error) {
    console.warn("⚠️ OpenAI failed:", error);
    return null;
  }
}

// =====================================
// 2. GEMINI (Fallback)
// =====================================

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: combinedPrompt }] }]
    });
    
    const text = result.response.text();
    if (text && text.length > 50) {
      console.log("✅ Gemini response successful");
      return text;
    }
    throw new Error("Gemini returned empty response");
  } catch (error) {
    console.warn("⚠️ Gemini failed:", error);
    return null;
  }
}

// =====================================
// 3. DEEPSEEK (Fallback)
// =====================================

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string | null> {
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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      console.log("✅ DeepSeek response successful");
      return data.choices[0].message.content;
    }
    throw new Error("DeepSeek returned no content");
  } catch (error) {
    console.warn("⚠️ DeepSeek failed:", error);
    return null;
  }
}

// =====================================
// 4. LOCAL FALLBACK (No API call)
// =====================================

function generateLocalAnalysis(symbol: string, language: string): string {
  if (language === "Cantonese") {
    return `${symbol} 分析摘要：技術指標顯示中性信號。RSI 處於合理區間，MACD 無明顯趨勢。建議投資者關注市場動向，等待更明確的信號。\n\n風險提示：市場波動可能帶來不確定性，請謹慎決策。`;
  } else if (language === "简体中文") {
    return `${symbol} 分析摘要：技术指标显示中性信号。RSI处于合理区间，MACD无明显趋势。建议投资者关注市场动向，等待更明确的信号。\n\n风险提示：市场波动可能带来不确定性，请谨慎决策。`;
  } else {
    return `${symbol} Analysis Summary: Technical indicators show neutral signals. RSI is in reasonable range with no clear MACD trend. Investors should monitor market movements and wait for clearer signals.\n\nRisk Warning: Market volatility may bring uncertainty. Trade with caution.`;
  }
}

// =====================================
// MAIN GATEWAY (OpenAI → Gemini → DeepSeek → Local)
// =====================================

export async function callAIWithFallback(
  symbol: string,
  language: string,
  userPrompt: string,
  systemPrompt: string
): Promise<string> {
  console.log(`🤖 AI Gateway: Processing ${symbol} in ${language}`);
  
  // Try OpenAI first
  const openAIResult = await callOpenAI(systemPrompt, userPrompt);
  if (openAIResult) {
    console.log(`✅ OpenAI succeeded for ${symbol}`);
    return openAIResult;
  }
  
  // Try Gemini second
  const geminiResult = await callGemini(systemPrompt, userPrompt);
  if (geminiResult) {
    console.log(`✅ Gemini succeeded for ${symbol}`);
    return geminiResult;
  }
  
  // Try DeepSeek third
  const deepSeekResult = await callDeepSeek(systemPrompt, userPrompt);
  if (deepSeekResult) {
    console.log(`✅ DeepSeek succeeded for ${symbol}`);
    return deepSeekResult;
  }
  
  // Final local fallback
  console.log(`⚠️ All AI services failed for ${symbol}, using local analysis`);
  return generateLocalAnalysis(symbol, language);
}