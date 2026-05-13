// app/utils/fetchers.ts

// Mock data fetcher - no external dependencies
export async function fetchStockQuote(symbol: string) {
  // Return mock data
  const mockQuotes: Record<string, any> = {
    "AAPL": { price: 192.53, change: 1.25, changePercent: 0.65, volume: 45200000 },
    "TSLA": { price: 248.42, change: -3.15, changePercent: -1.25, volume: 89100000 },
    "NVDA": { price: 128.44, change: 2.85, changePercent: 2.27, volume: 123000000 },
    "MSFT": { price: 428.72, change: 1.52, changePercent: 0.36, volume: 18900000 },
    "GOOGL": { price: 152.65, change: 0.85, changePercent: 0.56, volume: 22300000 },
    "AMZN": { price: 185.23, change: -0.92, changePercent: -0.49, volume: 34100000 },
    "META": { price: 498.19, change: 3.42, changePercent: 0.69, volume: 15200000 },
  };
  
  const formattedSymbol = symbol.toUpperCase();
  return mockQuotes[formattedSymbol] || { 
    price: 100.00, 
    change: 0, 
    changePercent: 0, 
    volume: 0 
  };
}

export async function fetchStockChart(symbol: string) {
  // Return mock chart data
  const dates = [];
  const prices = [];
  const now = new Date();
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
    
    // Generate random walk price
    const basePrice = 100;
    const trend = Math.sin(i / 15) * 10;
    const noise = (Math.random() - 0.5) * 5;
    prices.push(basePrice + trend + noise);
  }
  
  return { dates, prices };
}