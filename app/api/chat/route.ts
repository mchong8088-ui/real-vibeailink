export const runtime = 'edge';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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

    // --- TIER 1: GEMINI (The Primary Humorist) ---
    try {
      console.log(`\n--- TRACE: [1] Attempting GEMINI for ${hostName} ---`);
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
      const text = result.response.text();
      
      if (text) {
        console.log("✅ SUCCESS: Gemini 2.5 Flash responded.");
        return NextResponse.json({ reply: text });
      }
    } catch (err: any) {
      console.log(`⚠️ GEMINI FAILED. Reason: ${err.message}`);
    }

    // --- TIER 2: OPENAI (The Reliable Wingman) ---
    try {
      console.log(`--- TRACE: [2] Attempting OPENAI for ${hostName} ---`);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
      console.log(`⚠️ OPENAI FAILED. Reason: ${err.message}`);
    }

    // --- TIER 3: DEEPSEEK (The Silent Bodyguard) ---
    try {
      console.log(`--- TRACE: [3] Attempting DEEPSEEK for ${hostName} ---`);
      const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
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