// app/lib/market/regime.ts
export interface MarketRegimeResult {
  regime: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile' | 'Trending';
  sentiment: 'Optimistic' | 'Cautious' | 'Neutral';
  confidence: number;
}

// This function matches the call in your route.ts (3 parameters)
export function detectMarketRegime(
  rsi: number | null, 
  macdStatus: string, 
  newsSentiment: string
): MarketRegimeResult {
  let regime: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile' | 'Trending' = 'Neutral';
  let sentiment: 'Optimistic' | 'Cautious' | 'Neutral' = 'Neutral';
  let confidence = 50;
  
  // Determine regime based on RSI and MACD
  if (rsi !== null) {
    if (rsi > 60 && macdStatus === 'Bullish') {
      regime = 'Bullish';
      sentiment = 'Optimistic';
      confidence = Math.min(90, 50 + (rsi - 50));
    } else if (rsi < 40 && macdStatus === 'Bearish') {
      regime = 'Bearish';
      sentiment = 'Cautious';
      confidence = Math.min(90, 50 + (50 - rsi));
    } else if (rsi > 70) {
      regime = 'Volatile';
      sentiment = 'Cautious';
      confidence = 65;
    } else if (rsi < 30) {
      regime = 'Volatile';
      sentiment = 'Optimistic';
      confidence = 60;
    } else if (rsi > 50) {
      regime = 'Trending';
      sentiment = 'Neutral';
      confidence = 55;
    } else {
      regime = 'Neutral';
      sentiment = 'Neutral';
      confidence = 50;
    }
  }
  
  // Adjust based on news sentiment
  if (newsSentiment === 'Bullish' && regime !== 'Bearish') {
    sentiment = 'Optimistic';
    confidence = Math.min(90, confidence + 10);
  } else if (newsSentiment === 'Bearish' && regime !== 'Bullish') {
    sentiment = 'Cautious';
    confidence = Math.min(90, confidence + 10);
  }
  
  return { regime, sentiment, confidence };
}