// app/lib/market/news.ts - Updated version
import { simpleTranslate } from '../api/chat/route';

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url?: string;
  summary?: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
}
// Simple translation helper
function simpleTranslate(text: string, targetLang: string): string {
  if (targetLang === 'English') return text;
  
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
    }
  };
  
  let translated = text;
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
  
  // Keywords that indicate the news is about the company
  const relevantKeywords = [
    lowerSymbol,
    ...lowerCompany.split(' '),
    'earnings', 'profit', 'revenue', 'stock', 'share', 'ceo', 'chairman',
    'quarter', 'annual', 'results', 'forecast', 'guidance', 'upgrade',
    'downgrade', 'buyback', 'dividend', 'acquisition', 'merger', 'partnership',
    'contract', 'lawsuit', 'regulation', 'approval', 'launch', 'product'
  ];
  
  // Check if any relevant keyword appears in the title
  for (const keyword of relevantKeywords) {
    if (keyword.length > 2 && lowerTitle.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

// Simple translation for news titles
function translateNewsTitle(title: string, targetLang: string): string {
  if (targetLang === 'English') return title;
  
  // Common financial terms translation
  const translations: Record<string, Record<string, string>> = {
    'Cantonese': {
      'Earnings': '盈利',
      'Profit': '利潤',
      'Revenue': '收入',
      'Stock': '股價',
      'Share': '股份',
      'Market': '市場',
      'Upgrade': '升級',
      'Downgrade': '降級',
      'Buyback': '回購',
      'Dividend': '股息',
      'Acquisition': '收購',
      'Merger': '合併',
      'Partnership': '合作',
      'Contract': '合約',
      'Lawsuit': '訴訟',
      'Regulation': '監管',
      'Approval': '批准',
      'Launch': '推出',
      'Product': '產品',
      'CEO': '行政總裁',
      'Chairman': '主席',
      'Quarter': '季度',
      'Annual': '年度',
      'Results': '業績',
      'Forecast': '預測',
      'Guidance': '指引',
      'Growth': '增長',
      'Decline': '下跌',
      'Surge': '急升',
      'Plunge': '暴跌',
      'Rally': '反彈',
      'Correction': '回調',
    },
    '简体中文': {
      'Earnings': '盈利',
      'Profit': '利润',
      'Revenue': '收入',
      'Stock': '股价',
      'Share': '股份',
      'Market': '市场',
      'Upgrade': '升级',
      'Downgrade': '降级',
      'Buyback': '回购',
      'Dividend': '股息',
      'Acquisition': '收购',
      'Merger': '合并',
      'Partnership': '合作',
      'Contract': '合约',
      'Lawsuit': '诉讼',
      'Regulation': '监管',
      'Approval': '批准',
      'Launch': '推出',
      'Product': '产品',
      'CEO': '首席执行官',
      'Chairman': '主席',
      'Quarter': '季度',
      'Annual': '年度',
      'Results': '业绩',
      'Forecast': '预测',
      'Guidance': '指引',
      'Growth': '增长',
      'Decline': '下跌',
      'Surge': '急升',
      'Plunge': '暴跌',
      'Rally': '反弹',
      'Correction': '回调',
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
    
    // Filter relevant news
    const relevantNews = news.filter((item: any) => {
      const title = item.title || '';
      return isRelevantNews(title, symbol, companyName);
    });
    
    // Take top 5 relevant news
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

// Alternative news source (simulated - you can add more)
async function getMockNews(symbol: string, companyName: string): Promise<NewsItem[]> {
  // Return empty array - real news will come from Yahoo
  return [];
}

// Main function to get news with translation
export async function getNews(symbol: string, companyName: string = '', targetLang: string = 'English'): Promise<NewsItem[]> {
  console.log(`📰 Fetching news for ${symbol} (${companyName})`);
  
  // Try Yahoo Finance first
  let news = await getYahooNews(symbol, companyName);
  
  // If no relevant news, try with just symbol (less strict)
  if (news.length === 0) {
    console.log(`📰 No relevant news found, trying broader search...`);
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
  
  // Translate titles if needed
  if (targetLang !== 'English' && news.length > 0) {
    news = news.map(item => ({
      ...item,
      title: translateNewsTitle(item.title, targetLang),
    }));
  }
  
  console.log(`✅ Found ${news.length} news articles for ${symbol}`);
  return news;
}