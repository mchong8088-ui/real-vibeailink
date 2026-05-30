// Sentiment Engine - Analyzes news sentiment using keyword scoring
// Returns sentiment score and overall sentiment classification

export interface SentimentResult {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number;        // -100 to +100 scale
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topPositiveHeadlines: string[];
  topNegativeHeadlines: string[];
}

// Positive keywords with weights
const POSITIVE_KEYWORDS: Record<string, number> = {
  // Strong positive
  'surge': 3, 'soar': 3, 'rocket': 3, 'breakthrough': 3, 'record': 3,
  'buyback': 3, 'upgrade': 3, 'outperform': 3, 'strong': 3,
  'profit': 2, 'growth': 2, 'beat': 2, 'rise': 2, 'gain': 2,
  'positive': 2, 'bullish': 2, 'optimistic': 2, 'confidence': 2,
  'good': 1, 'great': 1, 'excellent': 1, 'success': 1, 'win': 1,
  '新高': 3, '突破': 3, '上漲': 2, '看好': 2, '樂觀': 2, '增長': 2,
  '盈利': 2, '買入': 2, '買進': 2, '升級': 2,
};

// Negative keywords with weights
const NEGATIVE_KEYWORDS: Record<string, number> = {
  // Strong negative
  'plunge': 3, 'crash': 3, 'collapse': 3, 'downgrade': 3, 'sell-off': 3,
  'lawsuit': 3, 'fraud': 3, 'scandal': 3, 'bankrupt': 3, '危机': 3,
  'decline': 2, 'drop': 2, 'fall': 2, 'loss': 2, 'miss': 2,
  'negative': 2, 'bearish': 2, 'pessimistic': 2, 'concern': 2,
  'bad': 1, 'poor': 1, 'weak': 1, 'problem': 1, 'risk': 1,
  '下跌': 2, '暴跌': 3, '看跌': 2, '悲觀': 2, '風險': 2, '虧損': 2,
  '賣出': 2, '賣出評級': 2, '降級': 2, '問題': 1,
};

// Neutral indicators (reduce weight)
const NEUTRAL_INDICATORS = [
  'neutral', 'mixed', 'uncertain', 'volatile', 'fluctuate',
  '中性', '混合', '不確定', '波動', '震荡'
];

// Score a single headline
function scoreHeadline(headline: string): { score: number; positiveWords: string[]; negativeWords: string[] } {
  const lowerHeadline = headline.toLowerCase();
  let score = 0;
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];
  
  // Check for neutral indicators first (reduce weight)
  for (const word of NEUTRAL_INDICATORS) {
    if (lowerHeadline.includes(word)) {
      score = score * 0.7; // Reduce score by 30% if neutral terms present
      break;
    }
  }
  
  // Check positive keywords
  for (const [keyword, weight] of Object.entries(POSITIVE_KEYWORDS)) {
    if (lowerHeadline.includes(keyword.toLowerCase())) {
      score += weight;
      positiveWords.push(keyword);
    }
  }
  
  // Check negative keywords
  for (const [keyword, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (lowerHeadline.includes(keyword.toLowerCase())) {
      score -= weight;
      negativeWords.push(keyword);
    }
  }
  
  return { score, positiveWords, negativeWords };
}

// Main sentiment analysis function
export function getSentiment(news: Array<{ title: string; source?: string; summary?: string }>): SentimentResult {
  if (!news || news.length === 0) {
    return {
      sentiment: 'Neutral',
      score: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      topPositiveHeadlines: [],
      topNegativeHeadlines: [],
    };
  }
  
  let totalScore = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const headlinesWithScores: Array<{ title: string; score: number; positiveWords: string[]; negativeWords: string[] }> = [];
  
  for (const item of news) {
    const headline = item.title || item.summary || '';
    if (!headline) continue;
    
    const { score, positiveWords, negativeWords } = scoreHeadline(headline);
    totalScore += score;
    headlinesWithScores.push({ title: headline, score, positiveWords, negativeWords });
    
    if (score > 1) positiveCount++;
    else if (score < -1) negativeCount++;
    else neutralCount++;
  }
  
  // Calculate average score (normalized to -100 to 100 range)
  const maxPossibleScore = news.length * 3;
  let averageScore = (totalScore / maxPossibleScore) * 100;
  averageScore = Math.max(-100, Math.min(100, averageScore));
  
  // Determine overall sentiment
  let sentiment: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
  if (averageScore > 15) sentiment = 'Positive';
  else if (averageScore < -15) sentiment = 'Negative';
  
  // Get top headlines
  const sortedByScore = [...headlinesWithScores].sort((a, b) => b.score - a.score);
  const topPositiveHeadlines = sortedByScore
    .filter(h => h.score > 0)
    .slice(0, 3)
    .map(h => h.title);
  
  const topNegativeHeadlines = sortedByScore
    .filter(h => h.score < 0)
    .slice(0, 3)
    .map(h => h.title);
  
  return {
    sentiment,
    score: Math.round(averageScore),
    positiveCount,
    negativeCount,
    neutralCount,
    topPositiveHeadlines,
    topNegativeHeadlines,
  };
}

// Simplified version for quick use
export function getSimpleSentiment(news: Array<{ title: string }>): { sentiment: string; score: number } {
  const result = getSentiment(news);
  return {
    sentiment: result.sentiment,
    score: result.score,
  };
}

// Analyze text directly (for single article or user query)
export function analyzeTextSentiment(text: string): { sentiment: 'Positive' | 'Negative' | 'Neutral'; score: number } {
  const { score } = scoreHeadline(text);
  
  // Normalize score to -100 to 100 range
  let normalizedScore = Math.max(-100, Math.min(100, score * 10));
  
  let sentiment: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
  if (normalizedScore > 20) sentiment = 'Positive';
  else if (normalizedScore < -20) sentiment = 'Negative';
  
  return { sentiment, score: normalizedScore };
}
