export const runtime = 'edge';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, hostName, language } = await req.json();

    const langInstructions: { [key: string]: string } = {
      'zh-HK': 'Use natural, humorous, street-style Cantonese (廣東話). Be a witty, charming companion. Use particles like 呀, 㗎, 喎.',
      'zh-CN': 'Use humorous, standard Mandarin (普通話). Be warm, engaging, and funny.',
      'en-US': 'Use natural, witty, and humorous English. Be a charming, sharp-witted companion.',
    };

    const instruction = langInstructions[language] || langInstructions['zh-HK'];
    const systemPrompt = `Your name is ${hostName}. You are a witty, humorous, and supportive companion for retirees. You are sharp, helpful, and never boring. NEVER mention you are an AI. ${instruction}`;

    // --- TIER 1: GEMINI ---
    try {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(geminiKey || "");
      
      // Using the stable 2.5 version
      const modelName = "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // --- TERMINAL LOG START ---
      console.log(`\n--- [VIBE CHECK] ---`);
      console.log(`Host: ${hostName}`);
      console.log(`Model: ${modelName}`);
      console.log(`Input: ${message.substring(0, 40)}...`);
      console.log(`--------------------\n`);
      // --- TERMINAL LOG END ---

      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
      const text = result.response.text();
      
      if (text) {
        console.log("✅ SUCCESS: Gemini 2.5 responded.");
        return NextResponse.json({ reply: text });
      }
    } catch (err: any) {
      console.error(`❌ GEMINI FAILED: ${err.message}`);
      // If Gemini fails, it will automatically move to Tier 2 (OpenAI) below
    }

    // --- TIER 2: OPENAI (The Reliable Wingman) ---
    try {
      console.log("🔄 ATTEMPTING OPENAI FALLBACK...");
      const openAiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const openai = new OpenAI({ apiKey: openAiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      });

      const reply = completion.choices[0].message.content;
      if (reply) {
        console.log("✅ SUCCESS: OpenAI saved the day.");
        return NextResponse.json({ reply });
      }
    } catch (err: any) {
      console.error(`❌ OPENAI FAILED: ${err.message}`);
    }

    // --- TIER 3: DEEPSEEK (The Final Bodyguard) ---
    try {
      console.log("🔄 ATTEMPTING DEEPSEEK FALLBACK...");
      const dsKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
      const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${dsKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: `${systemPrompt}. Do not mention DeepSeek.` },
            { role: "user", content: message }
          ]
        })
      });
      const dsData = await dsResponse.json();
      console.log("✅ SUCCESS: DeepSeek provided the final fallback.");
      return NextResponse.json({ reply: dsData.choices[0].message.content });
    } catch (dsError) {
      return NextResponse.json({ reply: "我依家有啲忙，轉頭再搵我呀！" }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}