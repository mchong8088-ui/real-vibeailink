// app/lib/market/news.ts
export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export async function fetchStockNews(symbol: string): Promise<NewsItem[]> {
  try {
    // Try Finnhub if API key is available
    const apiKey = process.env.FINNHUB_API_KEY;
    if (apiKey) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const response = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${formatDate(startDate)}&to=${formatDate(endDate)}&token=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data.slice(0, 5).map((item: any) => ({
            title: item.headline,
            summary: item.summary,
            source: item.source,
            url: item.url,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
            sentiment: analyzeSentiment(item.headline + " " + item.summary),
          }));
        }
      }
    }
  } catch (error) {
    console.error("Finnhub error, using mock data:", error);
  }
  
  // Return mock data
  return getMockNews(symbol);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function analyzeSentiment(text: string): 'Positive' | 'Negative' | 'Neutral' {
  const positiveWords = ['surge', 'gain', 'profit', 'growth', 'positive', 'bullish', 'upgrade', 'beat', 'record', 'high'];
  const negativeWords = ['drop', 'loss', 'decline', 'negative', 'bearish', 'downgrade', 'miss', 'fall', 'low', 'concern'];
  
  let positive = 0;
  let negative = 0;
  const lowerText = text.toLowerCase();
  
  positiveWords.forEach(word => { if (lowerText.includes(word)) positive++; });
  negativeWords.forEach(word => { if (lowerText.includes(word)) negative++; });
  
  if (positive > negative) return 'Positive';
  if (negative > positive) return 'Negative';
  return 'Neutral';
}

function getMockNews(symbol: string): NewsItem[] {
  return [
    {
      title: `${symbol} Shows Strong Momentum in Recent Trading`,
      summary: `Analysts are watching ${symbol} closely as technical indicators show positive signals.`,
      source: "Market News",
      url: "#",
      publishedAt: new Date().toISOString(),
      sentiment: 'Positive',
    },
    {
      title: `Market Update: ${symbol} Performance Review`,
      summary: `Trading volume remains stable with institutional interest growing.`,
      source: "Financial Times",
      url: "#",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      sentiment: 'Neutral',
    },
  ];
}