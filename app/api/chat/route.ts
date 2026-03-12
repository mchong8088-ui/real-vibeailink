import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const { message, hostName, language } = await req.json();

    const langInstructions: { [key: string]: string } = {
      'zh-HK': 'You must respond in natural, street-style Cantonese (廣東話) using Traditional Chinese characters. Use particles like 呀, 㗎, 喎.',
      'zh-CN': 'You must respond in standard Mandarin (普通話) using Simplified Chinese characters.',
      'en-US': 'You must respond in natural, friendly English.',
    };

    const instruction = langInstructions[language] || langInstructions['zh-HK'];
    const prompt = `Your name is ${hostName}. STRICT RULE: ${instruction} User says: ${message}`;

    // --- 1. GEMINI WITH UPDATED MODEL & SAFETY ---
    let lastGeminiError = null;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        
        // Updated to Gemini 3 Flash Preview (Replaces 1.5)
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3-flash-preview",
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        });
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        if (text) {
          return NextResponse.json({ reply: text });
        }
      } catch (err: any) {
        lastGeminiError = err;
        console.warn(`Gemini attempt ${i + 1} failed: ${err.message}. Retrying...`);
        await sleep(1000 * (i + 1));
      }
    }

    // --- 2. FALLBACK TO DEEPSEEK ---
    console.log("Gemini failed after retries. Switching to DeepSeek...");
    
    try {
      const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: `You are ${hostName}. ${instruction}` },
            { role: "user", content: message }
          ]
        })
      });

      const dsData = await dsResponse.json();
      return NextResponse.json({ reply: dsData.choices[0].message.content });
    } catch (dsError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: "System busy" }, { status: 500 });
  }
}