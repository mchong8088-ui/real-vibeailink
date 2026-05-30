// Prompt Builder - Constructs professional AI prompts from market data
// Formats all data sources into structured prompts for AI analysis

export interface PromptData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  technical: {
    rsi: number | null;
    rsiStatus: string;
    macd: {
      value: number | null;
      signal: number | null;
      histogram: number | null;
      status: string;
    };
    sma: {
      short: number | null;
      long: number | null;
    };
    trend: string;
  };
  fundamentals: {
    marketCap: string;
    peRatio: number | null;
    revenueGrowth: number | null;
    profitMargin: number | null;
    debtRatio: number | null;
  };
  news: Array<{
    title: string;
    source: string;
    date: string;
    sentiment?: string;
  }>;
  sentiment: {
    score: number;
    overall: string;
  };
  userQuestion?: string;
  language: 'EN' | 'ZH' | 'HK';
}

// Language-specific instructions
const getLanguageInstruction = (language: string): string => {
  switch (language) {
    case 'HK':
      return '請用粵語回答，提供專業嘅金融分析。';
    case 'ZH':
      return '请用简体中文回答，提供专业的金融分析。';
    default:
      return 'Respond in English with professional financial analysis.';
  }
};

// Format technical indicators for prompt
function formatTechnical(data: PromptData): string {
  const parts = [];
  
  parts.push(`RSI(14): ${data.technical.rsi !== null ? data.technical.rsi.toFixed(1) : 'N/A'} (${data.technical.rsiStatus})`);
  parts.push(`MACD: ${data.technical.macd.status}`);
  parts.push(`20-day SMA: ${data.technical.sma.short !== null ? `$${data.technical.sma.short.toFixed(2)}` : 'N/A'}`);
  parts.push(`50-day SMA: ${data.technical.sma.long !== null ? `$${data.technical.sma.long.toFixed(2)}` : 'N/A'}`);
  parts.push(`Trend: ${data.technical.trend}`);
  
  return parts.join('\n');
}

// Format fundamental data for prompt
function formatFundamentals(data: PromptData): string {
  const parts = [];
  
  parts.push(`Market Cap: ${data.fundamentals.marketCap || 'N/A'}`);
  parts.push(`P/E Ratio: ${data.fundamentals.peRatio !== null ? data.fundamentals.peRatio.toFixed(1) : 'N/A'}`);
  
  if (data.fundamentals.revenueGrowth !== null) {
    const growth = data.fundamentals.revenueGrowth;
    parts.push(`Revenue Growth: ${growth.toFixed(1)}% ${growth > 0 ? '📈' : '📉'}`);
  }
  
  if (data.fundamentals.profitMargin !== null) {
    parts.push(`Profit Margin: ${data.fundamentals.profitMargin.toFixed(1)}%`);
  }
  
  if (data.fundamentals.debtRatio !== null) {
    parts.push(`Debt to Equity: ${data.fundamentals.debtRatio.toFixed(2)}`);
  }
  
  return parts.join('\n');
}

// Format news for prompt
function formatNews(data: PromptData): string {
  if (!data.news || data.news.length === 0) {
    return 'No recent news available.';
  }
  
  const newsLines = data.news.slice(0, 5).map(item => {
    const sentimentIcon = item.sentiment === 'Positive' ? '🟢' : item.sentiment === 'Negative' ? '🔴' : '🟡';
    return `- ${sentimentIcon} [${item.source}] ${item.title}`;
  });
  
  return newsLines.join('\n');
}

// Build the complete prompt
export function buildPrompt(data: PromptData): string {
  const languageInstruction = getLanguageInstruction(data.language);
  
  const hasUserQuestion = data.userQuestion && data.userQuestion.trim().length > 0;
  
  let prompt = `${languageInstruction}

You are a professional equity research analyst. Analyze the following stock data and provide a structured investment analysis.

========================================
STOCK INFORMATION
========================================
Symbol: ${data.symbol}
Current Price: $${data.price?.toFixed(2) || 'N/A'}
Daily Change: ${data.changePercent?.toFixed(2) || 0}% (${data.change && data.change > 0 ? '+' : ''}${data.change?.toFixed(2) || 0})
Volume: ${data.volume?.toLocaleString() || 'N/A'}

========================================
TECHNICAL ANALYSIS
========================================
${formatTechnical(data)}

========================================
FUNDAMENTAL ANALYSIS
========================================
${formatFundamentals(data)}

========================================
MARKET SENTIMENT & NEWS
========================================
Overall Sentiment Score: ${data.sentiment.score} (${data.sentiment.overall})

Recent News Headlines:
${formatNews(data)}

========================================
ANALYSIS TASK
========================================
${hasUserQuestion ? `User Question: ${data.userQuestion}` : 'Provide a general investment analysis.'}

Based STRICTLY on the data above (do not invent numbers), provide:

1. EXECUTIVE SUMMARY (2-3 sentences)
2. TECHNICAL OUTLOOK (what indicators suggest)
3. FUNDAMENTAL ASSESSMENT (valuation and growth)
4. BULL CASE (reasons to be positive, 2-3 points)
5. BEAR CASE (risks and concerns, 2-3 points)
6. KEY RISKS (specific risk factors)
7. FINAL RECOMMENDATION (Buy/Sell/Hold with price target)
8. CONFIDENCE SCORE (0-100%)

Return ONLY valid JSON with this structure:
{
  "summary": "",
  "technical": "",
  "fundamental": "",
  "bullCase": [],
  "bearCase": [],
  "risks": [],
  "recommendation": "",
  "priceTarget": "",
  "confidence": 0
}

Be concise, professional, and data-driven.`;
  
  return prompt;
}

// Simplified prompt for quick analysis
export function buildQuickPrompt(symbol: string, price: number, changePercent: number): string {
  return `Analyze ${symbol} at $${price} (${changePercent > 0 ? '+' : ''}${changePercent}%). 
Provide: 1) Technical outlook 2) Key levels 3) Recommendation. Keep it concise.`;
}

// Prompt for news-only analysis
export function buildNewsPrompt(symbol: string, news: Array<{ title: string; source: string }>): string {
  const newsList = news.map(n => `- ${n.title} (${n.source})`).join('\n');
  
  return `Analyze how recent news affects ${symbol}:

Recent News:
${newsList}

Provide:
1. News sentiment summary
2. Potential price impact
3. Key takeaways for investors

Keep response professional and concise.`;
}

// Prompt for technical-only analysis
export function buildTechnicalPrompt(symbol: string, rsi: number | null, macd: string, trend: string): string {
  return `Technical analysis for ${symbol}:
- RSI: ${rsi || 'N/A'}
- MACD: ${macd}
- Trend: ${trend}

Based on these indicators, provide:
1. Current momentum assessment
2. Key support/resistance levels
3. Short-term outlook

Be concise.`;
}
