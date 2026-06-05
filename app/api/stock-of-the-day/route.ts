// app/api/stock-of-the-day/route.ts
import { NextResponse } from 'next/server';

// Pre-defined interesting stocks to rotate
const STOCK_OF_THE_DAY_CANDIDATES = [
  { symbol: "0700.HK", name: "Tencent", market: "HK" },
  { symbol: "2330.TW", name: "TSMC", market: "TW" },
  { symbol: "TSLA", name: "Tesla", market: "US" },
  { symbol: "NVDA", name: "NVIDIA", market: "US" },
  { symbol: "AAPL", name: "Apple", market: "US" },
  { symbol: "9988.HK", name: "Alibaba", market: "HK" },
  { symbol: "1211.HK", name: "BYD", market: "HK" },
  { symbol: "3690.HK", name: "Meituan", market: "HK" },
  { symbol: "INTC", name: "Intel", market: "US" },
  { symbol: "AMD", name: "AMD", market: "US" },
  { symbol: "GOOGL", name: "Google", market: "US" },
  { symbol: "MSFT", name: "Microsoft", market: "US" },
];

function getStockOfTheDay() {
  // Use date to deterministically select a stock (changes daily)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % STOCK_OF_THE_DAY_CANDIDATES.length;
  return STOCK_OF_THE_DAY_CANDIDATES[index];
}

export async function GET() {
  const stock = getStockOfTheDay();
  
  // Fetch current price
  try {
    const priceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`;
    const res = await fetch(priceUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    return NextResponse.json({
      success: true,
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      price: price || 'N/A',
      date: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      price: 'N/A',
      date: new Date().toISOString().split('T')[0],
    });
  }
}