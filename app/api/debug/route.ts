import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const allParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  
  return NextResponse.json({
    url: url.toString(),
    searchParams: allParams,
    hash: url.hash,
    timestamp: new Date().toISOString(),
  });
}
