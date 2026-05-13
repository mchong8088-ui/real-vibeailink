// app/lib/market/fundamentals.ts

export interface Fundamentals {
  marketCap: string;
  peRatio: string;
  forwardPE: string;
  revenueGrowth: string;
  profitMargins: string;
  analystRating: string;
  targetPrice: number | null;
  beta: string;
  dividendYield: string;
  eps: string;
}

// Mock data for known stocks
const fundamentalsMap: Record<string, Fundamentals> = {
  "TSLA": { 
    marketCap: "$850B", 
    peRatio: "65.2", 
    forwardPE: "52.8", 
    revenueGrowth: "18.5", 
    profitMargins: "15.2", 
    analystRating: "Buy", 
    targetPrice: 185, 
    beta: "2.05", 
    dividendYield: "0%", 
    eps: "$3.52" 
  },
  "AAPL": { 
    marketCap: "$2.8T", 
    peRatio: "28.5", 
    forwardPE: "25.2", 
    revenueGrowth: "5.2", 
    profitMargins: "26.5", 
    analystRating: "Buy", 
    targetPrice: 195, 
    beta: "1.20", 
    dividendYield: "0.55%", 
    eps: "$6.25" 
  },
  "NVDA": { 
    marketCap: "$1.2T", 
    peRatio: "72.5", 
    forwardPE: "45.2", 
    revenueGrowth: "85.5", 
    profitMargins: "48.2", 
    analystRating: "Strong Buy", 
    targetPrice: 950, 
    beta: "1.65", 
    dividendYield: "0.05%", 
    eps: "$12.45" 
  },
  "MSFT": { 
    marketCap: "$2.5T", 
    peRatio: "32.5", 
    forwardPE: "28.5", 
    revenueGrowth: "12.5", 
    profitMargins: "38.5", 
    analystRating: "Buy", 
    targetPrice: 450, 
    beta: "0.90", 
    dividendYield: "0.85%", 
    eps: "$11.25" 
  },
  "GOOGL": { 
    marketCap: "$1.7T", 
    peRatio: "25.5", 
    forwardPE: "22.5", 
    revenueGrowth: "9.5", 
    profitMargins: "25.5", 
    analystRating: "Buy", 
    targetPrice: 150, 
    beta: "1.05", 
    dividendYield: "0%", 
    eps: "$5.65" 
  },
  "AMZN": { 
    marketCap: "$1.9T", 
    peRatio: "58.5", 
    forwardPE: "42.5", 
    revenueGrowth: "11.5", 
    profitMargins: "8.5", 
    analystRating: "Buy", 
    targetPrice: 185, 
    beta: "1.25", 
    dividendYield: "0%", 
    eps: "$3.85" 
  },
  "META": { 
    marketCap: "$1.1T", 
    peRatio: "28.5", 
    forwardPE: "22.5", 
    revenueGrowth: "15.5", 
    profitMargins: "28.5", 
    analystRating: "Buy", 
    targetPrice: 550, 
    beta: "1.15", 
    dividendYield: "0%", 
    eps: "$14.85" 
  },
  "0700.HK": { 
    marketCap: "$450B", 
    peRatio: "18.5", 
    forwardPE: "16.2", 
    revenueGrowth: "8.5", 
    profitMargins: "22.5", 
    analystRating: "Hold", 
    targetPrice: 165, 
    beta: "0.85", 
    dividendYield: "1.25%", 
    eps: "$8.50" 
  },
  "2330.TW": { 
    marketCap: "$500B", 
    peRatio: "18.5", 
    forwardPE: "16.2", 
    revenueGrowth: "12.5", 
    profitMargins: "45.2", 
    analystRating: "Buy", 
    targetPrice: 850, 
    beta: "0.95", 
    dividendYield: "2.15%", 
    eps: "$32.50" 
  },
};

export async function fetchFundamentals(symbol: string): Promise<Fundamentals> {
  // Return mock data for known symbols
  if (fundamentalsMap[symbol]) {
    return fundamentalsMap[symbol];
  }
  
  // Return default data for unknown symbols
  return {
    marketCap: "N/A",
    peRatio: "N/A",
    forwardPE: "N/A",
    revenueGrowth: "N/A",
    profitMargins: "N/A",
    analystRating: "Hold",
    targetPrice: null,
    beta: "N/A",
    dividendYield: "N/A",
    eps: "N/A",
  };
}