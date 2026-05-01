// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  // 這裡只寫與 AI 溝通或資料庫扣點的邏輯
  return NextResponse.json({ reply: "這是 API 回應，UI 不會在這裡定義。" });
}