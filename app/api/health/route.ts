import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Checking both possible key names
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    
    if (!apiKey) {
      return NextResponse.json({ 
        status: "Configuration Error", 
        message: "API Key is missing in environment variables" 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using the stable 2.0 address to verify connection
    const modelName = "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // A simple "ping" to make sure the key and model are talking to each other
    const result = await model.generateContent("ping");
    const response = await result.response;
    
    return NextResponse.json({ 
      status: "Online", 
      api: "Connected",
      model: modelName,
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    // If it fails here, it will tell us why (e.g., wrong model name or bad key)
    return NextResponse.json({ 
      status: "Error", 
      message: error.message 
    }, { status: 500 });
  }
}