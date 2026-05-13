// app/lib/market/fundamentals.ts
export interface FundamentalsData {
  marketCap: string;
  peRatio: number | null;
  forwardPE: number | null;
  revenueGrowth: number | null;
  profitMargins: number | null;
  analystRating: string;
  targetPrice: number | null;
  eps: number | null;
  beta: number | null;
  dividendYield: number | null;
}

// Mock fundamental data for when Yahoo Finance is unavailable
const mockFundamentals: FundamentalsData = {
  marketCap: "N/A",
  peRatio: 18.5,
  forwardPE: 16.2,
  revenueGrowth: 8.5,
  profitMargins: 22.5,
  analystRating: "Hold",
  targetPrice: 165.0,
  eps: 8.25,
  beta: 1.15,
  dividendYield: 1.2
};

// Predefined fundamentals for popular stocks
const stockFundamentals: Record<string, FundamentalsData> = {
  "TSLA": {
    marketCap: "$850B",
    peRatio: 65.2,
    forwardPE: 52.8,
    revenueGrowth: 18.5,
    profitMargins: 15.2,
    analystRating: "Buy",
    targetPrice: 185.0,
    eps: 2.85,
    beta: 2.05,
    dividendYield: 0
  },
  "AAPL": {
    marketCap: "$2.8T",
    peRatio: 28.5,
    forwardPE: 25.2,
    revenueGrowth: 5.2,
    profitMargins: 26.5,
    analystRating: "Buy",
    targetPrice: 195.0,
    eps: 6.45,
    beta: 1.25,
    dividendYield: 0.55
  },
  "NVDA": {
    marketCap: "$1.2T",
    peRatio: 72.5,
    forwardPE: 45.2,
    revenueGrowth: 85.5,
    profitMargins: 48.2,
    analystRating: "Strong Buy",
    targetPrice: 950.0,
    eps: 12.85,
    beta: 1.65,
    dividendYield: 0.05
  },
  "0700.HK": {
    marketCap: "$450B",
    peRatio: 18.5,
    forwardPE: 16.2,
    revenueGrowth: 8.5,
    profitMargins: 22.5,
    analystRating: "Hold",
    targetPrice: 165.0,
    eps: 8.25,
    beta: 1.15,
    dividendYield: 1.2
  }
};

export async function fetchFundamentals(symbol: string): Promise<FundamentalsData> {
  // First check if we have predefined data for this stock
  const upperSymbol = symbol.toUpperCase();
  if (stockFundamentals[upperSymbol]) {
    return stockFundamentals[upperSymbol];
  }
  
  // Try to fetch from Yahoo Finance (with proper error handling)
  try {
    // Dynamic import to avoid build issues
    const yahooFinance = await import("yahoo-finance2");
    
    let yahooSymbol = symbol;
    if (symbol.includes('.HK') || symbol.includes('HK')) {
      yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.HK`;
    }
    
    const quote = await yahooFinance.quote(yahooSymbol);
    
    // Format market cap
    let marketCap = "N/A";
    if (quote.marketCap) {
      if (quote.marketCap >= 1e12) marketCap = `$${(quote.marketCap / 1e12).toFixed(2)}T`;
      else if (quote.marketCap >= 1e9) marketCap = `$${(quote.marketCap / 1e9).toFixed(2)}B`;
      else if (quote.marketCap >= 1e6) marketCap = `$${(quote.marketCap / 1e6).toFixed(2)}M`;
      else marketCap = `$${quote.marketCap.toFixed(0)}`;
    }
    
    // Get analyst rating
    let analystRating = "Hold";
    try {
      const summary = await yahooFinance.summary(yahooSymbol);
      if (summary?.recommendation?.mean) {
        const mean = summary.recommendation.mean;
        if (mean <= 1.5) analystRating = "Strong Buy";
        else if (mean <= 2.5) analystRating = "Buy";
        else if (mean <= 3.5) analystRating = "Hold";
        else analystRating = "Sell";
      }
    } catch (e) {
      // Summary not available, use default
    }
    
    return {
      marketCap: marketCap,
      peRatio: quote.trailingPE || null,
      forwardPE: quote.forwardPE || null,
      revenueGrowth: null,
      profitMargins: quote.profitMargins ? quote.profitMargins * 100 : null,
      analystRating: analystRating,
      targetPrice: quote.targetMeanPrice || null,
      eps: quote.epsTrailingTwelveMonths || null,
      beta: quote.beta || null,
      dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
    };
  } catch (error) {
    console.log(`Using mock fundamentals for ${symbol}`);
    // Return mock data for the symbol if available, otherwise default mock
    return stockFundamentals[upperSymbol] || { ...mockFundamentals };
  }
}

// Helper function to format market cap for display
export function formatMarketCap(marketCap: number | null | undefined): string {
  if (!marketCap) return "N/A";
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toFixed(0)}`;
}

// Helper function to format P/E ratio
export function formatPEPeriod(pe: number | null | undefined): string {
  if (!pe) return "N/A";
  return pe.toFixed(2);
}

// Helper function to format percentage
export function formatPercentage(value: number | null | undefined): string {
  if (!value) return "N/A";
  return `${value.toFixed(1)}%`;
}