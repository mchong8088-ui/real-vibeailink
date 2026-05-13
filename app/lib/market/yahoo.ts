// app/lib/market/yahoo.ts
import yahooFinance from 'yahoo-finance2';

export interface YahooStockData {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap: number;
  pe: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  historicalPrices: { date: Date; close: number; high: number; low: number; volume: number }[];
}

export async function fetchYahooStockData(symbol: string): Promise<YahooStockData | null> {
  try {
    // Fetch current quote
    const quote = await yahooFinance.quote(symbol);
    
    // Fetch historical data (100 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 100);
    
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });
    
    const closes = historical.map(h => h.close);
    const avgVolume = closes.length > 0 
      ? historical.slice(-20).reduce((sum, h) => sum + h.volume, 0) / 20 
      : quote.regularMarketVolume || 0;
    
    return {
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      avgVolume: avgVolume,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      open: quote.regularMarketOpen || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      marketCap: quote.marketCap || 0,
      pe: quote.trailingPE || null,
      eps: quote.epsTrailingTwelveMonths || null,
      dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
      beta: quote.beta || null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      historicalPrices: historical.map(h => ({
        date: h.date,
        close: h.close,
        high: h.high,
        low: h.low,
        volume: h.volume,
      })),
    };
  } catch (error) {
    console.error(`Error fetching Yahoo data for ${symbol}:`, error);
    return null;
  }
}

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toFixed(0)}`;
  if (price >= 100) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(2)}`;
}

export function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}