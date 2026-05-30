// News Engine - Simplified version

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url?: string;
  summary?: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

// Yahoo Finance News
async function getYahooNews(symbol: string): Promise<NewsItem[]> {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${yahooSymbol}&newsCount=5`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const news = data.news || [];
    
    return news.slice(0, 5).map((item: any) => ({
      title: item.title || '',
      source: item.publisher || 'Yahoo Finance',
      date: new Date(item.providerPublishTime * 1000).toISOString(),
      url: item.link || '',
      summary: item.summary || '',
    }));
  } catch (err) {
    console.log(`Yahoo news failed for ${symbol}`);
    return [];
  }
}

// Main function to get news
export async function getNews(symbol: string): Promise<NewsItem[]> {
  console.log(`📰 Fetching news for ${symbol}`);
  
  // Try Yahoo Finance first
  const yahooNews = await getYahooNews(symbol);
  if (yahooNews.length > 0) {
    console.log(`✅ Yahoo Finance: ${yahooNews.length} articles`);
    return yahooNews;
  }
  
  console.log(`📰 No news found for ${symbol}`);
  return [];
}
