// News Engine - Fetches news from multiple providers
// Returns structured news data for AI analysis

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url?: string;
  summary?: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

export interface NewsResult {
  symbol: string;
  articles: NewsItem[];
  totalCount: number;
  sources: string[];
}

// ============================================
// Yahoo Finance News (Best for HK/TW/US)
// ============================================
async function getYahooNews(symbol: string): Promise<NewsItem[]> {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    // Yahoo Finance news feed
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${yahooSymbol}&newsCount=10`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 minutes
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const news = data.news || [];
    
    return news.slice(0, 10).map((item: any) => ({
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

// ============================================
// Finnhub News (Good for US stocks)
// ============================================
async function getFinnhubNews(symbol: string): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];
    
    // Remove suffix for Finnhub
    let finnhubSymbol = symbol;
    if (symbol.endsWith('.HK')) finnhubSymbol = symbol.replace('.HK', '');
    if (symbol.endsWith('.TW')) finnhubSymbol = symbol.replace('.TW', '');
    
    const from = new Date();
    from.setDate(from.getDate() - 7); // Last 7 days
    const to = new Date();
    
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    const url = `https://finnhub.io/api/v1/company-news?symbol=${finnhubSymbol}&from=${fromStr}&to=${toStr}&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    
    return data.slice(0, 10).map((item: any) => ({
      title: item.headline || '',
      source: item.source || 'Finnhub',
      date: new Date(item.datetime * 1000).toISOString(),
      url: item.url || '',
      summary: item.summary || '',
    }));
  } catch (err) {
    console.log(`Finnhub news failed for ${symbol}`);
    return [];
  }
}

// ============================================
// Google News RSS (Free, wide coverage)
// ============================================
async function getGoogleNews(symbol: string): Promise<NewsItem[]> {
  try {
    // Get company name from symbol (simplified)
    const companyNames: Record<string, string> = {
      '0700.HK': 'Tencent',
      '2330.TW': 'TSMC',
      'TSLA': 'Tesla',
      'AAPL': 'Apple',
      'NVDA': 'NVIDIA',
      'AMZN': 'Amazon',
      'MSFT': 'Microsoft',
      'GOOGL': 'Google',
      '0005.HK': 'HSBC',
      '1211.HK': 'BYD',
      '0388.HK': 'HKEX',
    };
    
    const companyName = companyNames[symbol] || symbol.replace(/\.(HK|TW)$/, '');
    
    // Use Google News RSS feed (no API key required)
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    
    if (!res.ok) return [];
    
    const text = await res.text();
    
    // Parse RSS XML (simple regex approach)
    const items: NewsItem[] = [];
    const titleRegex = /<title>(.*?)<\/title>/g;
    const linkRegex = /<link>(.*?)<\/link>/g;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/g;
    
    const titles = [...text.matchAll(titleRegex)];
    const links = [...text.matchAll(linkRegex)];
    const dates = [...text.matchAll(pubDateRegex)];
    
    // Skip first item (channel title)
    for (let i = 1; i < Math.min(titles.length, 11); i++) {
      if (titles[i] && links[i] && dates[i]) {
        items.push({
          title: titles[i][1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
          source: 'Google News',
          date: new Date(dates[i][1]).toISOString(),
          url: links[i][1],
        });
      }
    }
    
    return items.slice(0, 10);
  } catch (err) {
    console.log(`Google News failed for ${symbol}`);
    return [];
  }
}

// ============================================
// Alpha Vantage News (Fallback)
// ============================================
async function getAlphaVantageNews(symbol: string): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return [];
    
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const feed = data.feed || [];
    
    return feed.slice(0, 10).map((item: any) => ({
      title: item.title || '',
      source: item.source || 'Alpha Vantage',
      date: item.time_published || new Date().toISOString(),
      url: item.url || '',
      summary: item.summary || '',
      sentiment: item.overall_sentiment_label === 'Bullish' ? 'Positive' : 
                 item.overall_sentiment_label === 'Bearish' ? 'Negative' : 'Neutral',
    }));
  } catch (err) {
    console.log(`Alpha Vantage news failed for ${symbol}`);
    return [];
  }
}

// ============================================
// MAIN FUNCTION - Get news from all sources
// ============================================

export async function getNews(symbol: string): Promise<NewsItem[]> {
  console.log(`📰 Fetching news for ${symbol}`);
  
  const allNews: NewsItem[] = [];
  const sources: string[] = [];
  
  // Try Yahoo Finance (best for all markets)
  const yahooNews = await getYahooNews(symbol);
  if (yahooNews.length > 0) {
    allNews.push(...yahooNews);
    sources.push('Yahoo Finance');
    console.log(`✅ Yahoo Finance: ${yahooNews.length} articles`);
  }
  
  // Try Google News (good for general coverage)
  const googleNews = await getGoogleNews(symbol);
  if (googleNews.length > 0) {
    allNews.push(...googleNews);
    sources.push('Google News');
    console.log(`✅ Google News: ${googleNews.length} articles`);
  }
  
  // Try Finnhub (good for US stocks)
  const finnhubNews = await getFinnhubNews(symbol);
  if (finnhubNews.length > 0) {
    allNews.push(...finnhubNews);
    sources.push('Finnhub');
    console.log(`✅ Finnhub: ${finnhubNews.length} articles`);
  }
  
  // Try Alpha Vantage as fallback
  if (allNews.length === 0) {
    const alphaNews = await getAlphaVantageNews(symbol);
    if (alphaNews.length > 0) {
      allNews.push(...alphaNews);
      sources.push('Alpha Vantage');
      console.log(`✅ Alpha Vantage: ${alphaNews.length} articles`);
    }
  }
  
  // Remove duplicates by title (case insensitive)
  const uniqueNews = allNews.filter((item, index, self) => 
    index === self.findIndex((t) => 
      t.title.toLowerCase() === item.title.toLowerCase()
    )
  );
  
  // Sort by date (newest first)
  uniqueNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  console.log(`📰 Total unique news articles for ${symbol}: ${uniqueNews.length}`);
  
  return uniqueNews.slice(0, 15); // Return top 15 most recent
}

// ============================================
// Helper: Get news summary with sentiment
// ============================================

export async function getNewsWithSentiment(symbol: string): Promise<{ articles: NewsItem[]; sentiment: 'Positive' | 'Negative' | 'Neutral'; averageScore: number }> {
  const articles = await getNews(symbol);
  
  if (articles.length === 0) {
    return { articles: [], sentiment: 'Neutral', averageScore: 0 };
  }
  
  // Count sentiment if available
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  for (const article of articles) {
    if (article.sentiment === 'Positive') positiveCount++;
    else if (article.sentiment === 'Negative') negativeCount++;
    else neutralCount++;
  }
  
  const total = positiveCount + negativeCount + neutralCount;
  let sentiment: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
  let averageScore = 0;
  
  if (total > 0) {
    averageScore = ((positiveCount - negativeCount) / total) * 100;
    if (averageScore > 20) sentiment = 'Positive';
    else if (averageScore < -20) sentiment = 'Negative';
    else sentiment = 'Neutral';
  }
  
  return { articles, sentiment, averageScore };
}

// ============================================
// Helper: Get latest headline only
// ============================================

export async function getLatestHeadline(symbol: string): Promise<string | null> {
  const news = await getNews(symbol);
  if (news.length === 0) return null;
  return news[0].title;
}
