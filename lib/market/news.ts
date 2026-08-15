// app/lib/market/news.ts
export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url?: string;
  summary?: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

// Simple translation function (self-contained)
function translateNewsTitle(title: string, targetLang: string): string {
  if (targetLang === 'English') return title;
  
  const translations: Record<string, Record<string, string>> = {
    'Cantonese': {
      'Stock': '股票',
      'share': '股份',
      'price': '股價',
      'market': '市場',
      'AI': '人工智能',
      'IPO': '首次公開募股',
      'target': '目標',
      'billion': '十億',
      'trillion': '萬億',
      'earnings': '盈利',
      'profit': '利潤',
      'revenue': '收入',
      'growth': '增長',
      'decline': '下跌',
      'surge': '急升',
      'plunge': '暴跌',
      'rally': '反彈',
      'correction': '回調',
      'upgrade': '升級',
      'downgrade': '降級',
      'buyback': '回購',
      'dividend': '股息',
      'acquisition': '收購',
      'merger': '合併',
      'partnership': '合作',
      'contract': '合約',
      'lawsuit': '訴訟',
      'regulation': '監管',
      'approval': '批准',
      'launch': '推出',
      'product': '產品',
      'CEO': '行政總裁',
      'Chairman': '主席',
      'Quarter': '季度',
      'Annual': '年度',
      'Results': '業績',
      'Forecast': '預測',
      'Guidance': '指引',
      'Tesla': '特斯拉',
      'SpaceX': '太空探索',
    },
    '简体中文': {
      'Stock': '股票',
      'share': '股份',
      'price': '股价',
      'market': '市场',
      'AI': '人工智能',
      'IPO': '首次公开募股',
      'target': '目标',
      'billion': '十亿',
      'trillion': '万亿',
      'earnings': '盈利',
      'profit': '利润',
      'revenue': '收入',
      'growth': '增长',
      'decline': '下跌',
      'surge': '急升',
      'plunge': '暴跌',
      'rally': '反弹',
      'correction': '回调',
      'upgrade': '升级',
      'downgrade': '降级',
      'buyback': '回购',
      'dividend': '股息',
      'acquisition': '收购',
      'merger': '合并',
      'partnership': '合作',
      'contract': '合约',
      'lawsuit': '诉讼',
      'regulation': '监管',
      'approval': '批准',
      'launch': '推出',
      'product': '产品',
      'CEO': '首席执行官',
      'Chairman': '主席',
      'Quarter': '季度',
      'Annual': '年度',
      'Results': '业绩',
      'Forecast': '预测',
      'Guidance': '指引',
      'Tesla': '特斯拉',
      'SpaceX': '太空探索',
    }
  };
  
  let translated = title;
  const dict = translations[targetLang];
  if (dict) {
    for (const [eng, chn] of Object.entries(dict)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      translated = translated.replace(regex, chn);
    }
  }
  
  return translated;
}

// Simple function to check if news is relevant to the stock
function isRelevantNews(title: string, symbol: string, companyName: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerSymbol = symbol.toLowerCase().replace('.hk', '').replace('.tw', '');
  const lowerCompany = companyName.toLowerCase();
  
  const relevantKeywords = [
    lowerSymbol,
    ...lowerCompany.split(' '),
    'earnings', 'profit', 'revenue', 'stock', 'share', 'ceo', 'chairman',
    'quarter', 'annual', 'results', 'forecast', 'guidance', 'upgrade',
    'downgrade', 'buyback', 'dividend', 'acquisition', 'merger', 'partnership',
    'contract', 'lawsuit', 'regulation', 'approval', 'launch', 'product'
  ];
  
  for (const keyword of relevantKeywords) {
    if (keyword.length > 2 && lowerTitle.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

// Yahoo Finance News with better filtering
async function getYahooNews(symbol: string, companyName: string): Promise<NewsItem[]> {
  try {
    let yahooSymbol = symbol;
    if (symbol.endsWith('.HK')) yahooSymbol = `${symbol.replace('.HK', '')}.HK`;
    if (symbol.endsWith('.TW')) yahooSymbol = `${symbol.replace('.TW', '')}.TW`;
    
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${yahooSymbol}&newsCount=10`;
    const res = await fetch(url, { 
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const news = data.news || [];
    
    const relevantNews = news.filter((item: any) => {
      const title = item.title || '';
      return isRelevantNews(title, symbol, companyName);
    });
    
    return relevantNews.slice(0, 5).map((item: any) => ({
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
export async function getNews(symbol: string, companyName: string = '', targetLang: string = 'English'): Promise<NewsItem[]> {
  console.log(`📰 Fetching news for ${symbol} (${companyName})`);
  
  let news = await getYahooNews(symbol, companyName);
  
  if (news.length === 0) {
    try {
      let yahooSymbol = symbol;
      if (symbol.endsWith('.HK')) yahooSymbol = symbol.replace('.HK', '');
      if (symbol.endsWith('.TW')) yahooSymbol = symbol.replace('.TW', '');
      
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${yahooSymbol}&newsCount=5`;
      const res = await fetch(url, { 
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      if (res.ok) {
        const data = await res.json();
        const allNews = data.news || [];
        news = allNews.slice(0, 5).map((item: any) => ({
          title: item.title || '',
          source: item.publisher || 'Yahoo Finance',
          date: new Date(item.providerPublishTime * 1000).toISOString(),
          url: item.link || '',
          summary: item.summary || '',
        }));
      }
    } catch (err) {
      console.log('Broader search failed');
    }
  }
  
  if (targetLang !== 'English' && news.length > 0) {
    news = news.map(item => ({
      ...item,
      title: translateNewsTitle(item.title, targetLang),
    }));
  }
  
  console.log(`✅ Found ${news.length} news articles for ${symbol}`);
  return news;
}