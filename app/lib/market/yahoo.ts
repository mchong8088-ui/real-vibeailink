// app/lib/market/yahoo.ts

// Mock Yahoo Finance data - no external dependencies
export async function getStockQuote(symbol: string) {
  const mockData: Record<string, any> = {
    "AAPL": {
      symbol: "AAPL",
      price: 192.53,
      change: 1.25,
      changePercent: 0.65,
      volume: 45200000,
      marketCap: 2980000000000,
      pe: 29.5,
      high52Week: 199.62,
      low52Week: 164.08,
    },
    "TSLA": {
      symbol: "TSLA",
      price: 248.42,
      change: -3.15,
      changePercent: -1.25,
      volume: 89100000,
      marketCap: 790000000000,
      pe: 65.2,
      high52Week: 299.29,
      low52Week: 152.37,
    },
    "NVDA": {
      symbol: "NVDA",
      price: 128.44,
      change: 2.85,
      changePercent: 2.27,
      volume: 123000000,
      marketCap: 3160000000000,
      pe: 72.5,
      high52Week: 140.76,
      low52Week: 39.23,
    },
  };
  
  const formattedSymbol = symbol.toUpperCase();
  return mockData[formattedSymbol] || {
    symbol: formattedSymbol,
    price: 100.00,
    change: 0,
    changePercent: 0,
    volume: 0,
    marketCap: 0,
    pe: 0,
    high52Week: 0,
    low52Week: 0,
  };
}

export async function getHistoricalData(symbol: string, period: string = '3mo') {
  // Generate mock historical data
  const data = [];
  const now = new Date();
  let days = 90; // 3 months default
  
  if (period === '1mo') days = 30;
  if (period === '6mo') days = 180;
  if (period === '1y') days = 365;
  
  let basePrice = 100;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Random walk with slight upward trend
    const change = (Math.random() - 0.48) * 3;
    basePrice = Math.max(10, basePrice + change);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: basePrice,
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      close: basePrice,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  
  return data;
}