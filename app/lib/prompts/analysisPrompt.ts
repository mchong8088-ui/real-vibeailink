// app/lib/prompts/analysisPrompt.ts

export function buildAnalysisPrompt(
  symbol: string,
  displayName: string,
  stockData: any,
  fundamentals: any,
  headlines: string[],
  newsSentiment: string,
  marketRegime: any
): string {
  // Format currency based on market
  const currency = symbol.includes('HK') ? 'HK$' : (symbol.includes('TW') ? 'NT$' : '$');
  
  return `
STOCK: ${displayName} (${symbol})

========================================
TECHNICAL ANALYSIS
========================================
Current Price: ${currency}${stockData.price?.toFixed(2) || 'N/A'}
RSI (14): ${stockData.rsi?.toFixed(1) || 'N/A'} (${stockData.rsiStatus || 'Neutral'})
MACD Signal: ${stockData.macdStatus || 'Neutral'}
20-day SMA: ${currency}${stockData.sma20?.toFixed(2) || 'N/A'}
50-day SMA: ${currency}${stockData.sma50?.toFixed(2) || 'N/A'}
Volume: ${stockData.volume?.toLocaleString() || 'N/A'}

========================================
FUNDAMENTAL ANALYSIS
========================================
Market Cap: ${fundamentals?.marketCap || 'N/A'}
P/E Ratio: ${fundamentals?.peRatio || 'N/A'}
Forward P/E: ${fundamentals?.forwardPE || 'N/A'}
Revenue Growth: ${fundamentals?.revenueGrowth || 'N/A'}%
Profit Margins: ${fundamentals?.profitMargins || 'N/A'}%
Analyst Rating: ${fundamentals?.analystRating || 'N/A'}
Target Price: ${fundamentals?.targetPrice ? currency + fundamentals.targetPrice : 'N/A'}

========================================
MARKET REGIME & SENTIMENT
========================================
Market Regime: ${marketRegime?.regime || 'Neutral'}
Market Sentiment: ${marketRegime?.sentiment || 'Neutral'}
Confidence: ${marketRegime?.confidence || 50}%

========================================
RECENT NEWS HEADLINES (Last 7 days)
========================================
${headlines.length > 0 ? headlines.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No recent news available.'}

Overall News Sentiment: ${newsSentiment || 'Neutral'}

========================================
ANALYSIS REQUIREMENTS
========================================
Based on the above data, provide a comprehensive investment analysis including:

1. SUMMARY: A concise overall assessment (2-3 sentences)

2. TECHNICAL OUTLOOK: Analyze the technical indicators - what do RSI, MACD, and moving averages suggest?

3. FUNDAMENTAL OUTLOOK: Analyze valuation, growth prospects, and profitability

4. NEWS IMPACT: How do recent news and overall sentiment affect the stock?

5. BULL CASE: Key arguments for price appreciation

6. BEAR CASE: Key arguments for price depreciation

7. RISK FACTORS: Main risks to monitor

8. RECOMMENDATION: Buy/Hold/Sell/Watch with confidence score (0-100)

9. KEY LEVELS: Support and resistance price levels

Return ONLY valid JSON. Do not include any markdown or explanatory text.`;
}