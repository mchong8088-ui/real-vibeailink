// app/api/stock/historical/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const range = searchParams.get("range") || "6mo"; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y
    const interval = searchParams.get("interval") || "1d"; // 1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Map range to Yahoo Finance format
    const rangeMap: Record<string, string> = {
      "1d": "1d",
      "5d": "5d",
      "1mo": "1mo",
      "3mo": "3mo",
      "6mo": "6mo",
      "1y": "1y",
      "2y": "2y",
      "5y": "5y",
    };

    const intervalMap: Record<string, string> = {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "60m",
      "1d": "1d",
      "1wk": "1wk",
      "1mo": "1mo",
    };

    const yahooRange = rangeMap[range] || "6mo";
    const yahooInterval = intervalMap[interval] || "1d";

    // Fetch from Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&range=${yahooRange}`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json(
        { error: `No data found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close;
    const volume = quotes.volume || [];
    const open = quotes.open || [];
    const high = quotes.high || [];
    const low = quotes.low || [];
    const close = quotes.close || [];

    // Build historical data array
    const historical = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] && close[i] !== null) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          open: open[i] || null,
          high: high[i] || null,
          low: low[i] || null,
          close: close[i],
          volume: volume[i] || null,
          adjClose: adjClose[i] || close[i],
        });
      }
    }

    // Calculate additional metrics
    const prices = historical.map(h => h.close).filter(p => p !== null);
    const volumes = historical.map(h => h.volume).filter(v => v !== null);

    // Calculate moving averages
    const sma20 = prices.length >= 20 
      ? prices.slice(-20).reduce((a, b) => a + b, 0) / 20 
      : null;
    const sma50 = prices.length >= 50 
      ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 
      : null;

    // Calculate RSI
    const rsi = calculateRSI(prices, 14);

    // Calculate volatility (standard deviation of daily returns)
    let volatility = null;
    if (prices.length > 1) {
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    }

    // Calculate average volume
    const avgVolume = volumes.length > 0 
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length 
      : null;

    return NextResponse.json({
      success: true,
      symbol: symbol.toUpperCase(),
      meta: {
        currency: result.meta.currency || "USD",
        exchange: result.meta.exchangeName || "N/A",
        fullName: result.meta.longName || result.meta.shortName || symbol,
        interval: yahooInterval,
        range: yahooRange,
      },
      technicals: {
        currentPrice: result.meta.regularMarketPrice || prices[prices.length - 1] || 0,
        rsi: rsi,
        sma20: sma20,
        sma50: sma50,
        volatility: volatility,
        avgVolume: avgVolume,
        volume: result.meta.regularMarketVolume || 0,
      },
      historical: historical,
    });

  } catch (error) {
    console.error("Historical API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data", details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function: Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number | null {
  const cleanPrices = prices.filter(p => p !== null && p !== undefined);
  if (cleanPrices.length <= period) return null;
  
  let avgGain = 0, avgLoss = 0;
  
  // Calculate initial gains/losses
  for (let i = 1; i <= period; i++) {
    const diff = cleanPrices[i] - cleanPrices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate subsequent values
  for (let i = period + 1; i < cleanPrices.length; i++) {
    const diff = cleanPrices[i] - cleanPrices[i - 1];
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - (100 / (1 + rs))).toFixed(1));
}