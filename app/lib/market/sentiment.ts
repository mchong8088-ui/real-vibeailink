// app/lib/market/sentiment.ts
export interface SentimentData {
  overall: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  factors: {
    technical: number;
    volume: number;
    momentum: number;
  };
}

export function calculateSentiment(
  indicators: any, 
  volume: number, 
  avgVolume: number
): SentimentData {
  let score = 0;
  
  // RSI contribution
  if (indicators.rsi) {
    if (indicators.rsi < 30) score += 20;
    else if (indicators.rsi > 70) score -= 20;
    else if (indicators.rsi > 50) score += 5;
    else if (indicators.rsi < 50) score -= 5;
  }
  
  // MACD contribution
  if (indicators.macd?.status === 'Bullish') score += 15;
  else if (indicators.macd?.status === 'Bearish') score -= 15;
  
  // Volume analysis
  const volumeRatio = volume / (avgVolume || 1);
  if (volumeRatio > 1.5) score += 10;
  else if (volumeRatio < 0.5) score -= 5;
  
  // SMA trend
  if (indicators.sma?.short && indicators.sma?.long) {
    if (indicators.sma.short > indicators.sma.long) score += 10;
    else score -= 10;
  }
  
  let overall: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (score > 20) overall = 'Bullish';
  else if (score < -20) overall = 'Bearish';
  
  return {
    overall,
    score,
    factors: {
      technical: Math.min(100, Math.max(-100, score)),
      volume: volumeRatio > 1.5 ? 20 : volumeRatio < 0.5 ? -10 : 0,
      momentum: indicators.sma?.short && indicators.sma?.long && indicators.sma.short > indicators.sma.long ? 15 : -5,
    },
  };
}

// This function is called by your route.ts
export function analyzeNewsSentiment(headlines: string[]): string {
  if (!headlines || headlines.length === 0) return "Neutral";
  
  let positive = 0;
  let negative = 0;
  
  const positiveWords = [
    'surge', 'gain', 'profit', 'growth', 'positive', 'bullish', 
    'upgrade', 'beat', 'record', 'high', 'rally', 'strong', 
    'opportunity', 'breakthrough', 'success'
  ];
  
  const negativeWords = [
    'drop', 'loss', 'decline', 'negative', 'bearish', 'downgrade', 
    'miss', 'fall', 'low', 'concern', 'risk', 'warning', 
    'lawsuit', 'investigation', 'delay'
  ];
  
  headlines.forEach(headline => {
    const lowerHeadline = headline.toLowerCase();
    positiveWords.forEach(word => { 
      if (lowerHeadline.includes(word)) positive++; 
    });
    negativeWords.forEach(word => { 
      if (lowerHeadline.includes(word)) negative++; 
    });
  });
  
  if (positive > negative + 2) return "Bullish";
  if (negative > positive + 2) return "Bearish";
  return "Neutral";
}