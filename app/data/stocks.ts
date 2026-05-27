// Stock Registry - Top 150 Stocks across US, Taiwan, Hong Kong markets
// Organized by AI, Semiconductors, EV, Energy Transition, and Tech Ecosystems

export interface StockInfo {
  symbol: string;
  en: string;
  cn: string;
  segment: string;
  market: 'US' | 'TW' | 'HK';
  aliases: string[];
}

export const STOCK_REGISTRY: Record<string, StockInfo> = {
  // ===== TAIWAN MARKET - Key stocks first =====
  "2330.TW": { 
    symbol: "2330.TW", 
    en: "TSMC", 
    cn: "台積電", 
    segment: "Foundry", 
    market: "TW", 
    aliases: ["TSMC", "台積電", "台积电", "2330", "TSM", "台灣積體電路", "台湾积体电路"] 
  },
  
  "2454.TW": { 
    symbol: "2454.TW", 
    en: "MediaTek", 
    cn: "聯發科", 
    segment: "IC Design", 
    market: "TW", 
    aliases: ["MediaTek", "聯發科", "联发科", "2454"] 
  },
  
  "2317.TW": { 
    symbol: "2317.TW", 
    en: "Hon Hai (Foxconn)", 
    cn: "鴻海", 
    segment: "AI Servers", 
    market: "TW", 
    aliases: ["Foxconn", "鴻海", "鸿海", "2317"] 
  },
  
  "2382.TW": { 
    symbol: "2382.TW", 
    en: "Quanta", 
    cn: "廣達", 
    segment: "AI Servers", 
    market: "TW", 
    aliases: ["Quanta", "廣達", "广达", "2382"] 
  },
  
  "2308.TW": { 
    symbol: "2308.TW", 
    en: "Delta Electronics", 
    cn: "台達電", 
    segment: "Power / EV", 
    market: "TW", 
    aliases: ["Delta", "台達電", "台达电", "2308"] 
  },
  
  // ===== HONG KONG MARKET =====
  "0700.HK": { 
    symbol: "0700.HK", 
    en: "Tencent", 
    cn: "騰訊", 
    segment: "AI / Internet", 
    market: "HK", 
    aliases: ["Tencent", "騰訊", "腾讯", "0700", "TENCENT"] 
  },
  
  "1211.HK": { 
    symbol: "1211.HK", 
    en: "BYD", 
    cn: "比亞迪", 
    segment: "EV", 
    market: "HK", 
    aliases: ["BYD", "比亞迪", "比亚迪", "1211", "BYD Company"] 
  },
  
  "9988.HK": { 
    symbol: "9988.HK", 
    en: "Alibaba", 
    cn: "阿里巴巴", 
    segment: "Cloud", 
    market: "HK", 
    aliases: ["Alibaba", "阿里巴巴", "9988", "BABA"] 
  },
  
  "3690.HK": { 
    symbol: "3690.HK", 
    en: "Meituan", 
    cn: "美團", 
    segment: "Platform", 
    market: "HK", 
    aliases: ["Meituan", "美團", "美团", "3690"] 
  },
  
  "1810.HK": { 
    symbol: "1810.HK", 
    en: "Xiaomi", 
    cn: "小米", 
    segment: "AIoT / EV", 
    market: "HK", 
    aliases: ["Xiaomi", "小米", "1810"] 
  },
  
  // ===== US MARKET =====
  "NVDA": { 
    symbol: "NVDA", 
    en: "NVIDIA", 
    cn: "輝達", 
    segment: "AI Chips / GPU", 
    market: "US", 
    aliases: ["NVIDIA", "輝達", "英伟达", "NVDA"] 
  },
  
  "TSLA": { 
    symbol: "TSLA", 
    en: "Tesla", 
    cn: "特斯拉", 
    segment: "EV / AI", 
    market: "US", 
    aliases: ["Tesla", "特斯拉", "TSLA"] 
  },
  
  "AAPL": { 
    symbol: "AAPL", 
    en: "Apple", 
    cn: "蘋果", 
    segment: "AI Devices", 
    market: "US", 
    aliases: ["Apple", "蘋果", "苹果", "AAPL"] 
  },
  
  "AMZN": { 
    symbol: "AMZN", 
    en: "Amazon", 
    cn: "亞馬遜", 
    segment: "Cloud / AI Infra", 
    market: "US", 
    aliases: ["Amazon", "亞馬遜", "亚马逊", "AMZN"] 
  },
  
  "MSFT": { 
    symbol: "MSFT", 
    en: "Microsoft", 
    cn: "微軟", 
    segment: "Cloud + AI", 
    market: "US", 
    aliases: ["Microsoft", "微軟", "微软", "MSFT"] 
  },
  
  "GOOGL": { 
    symbol: "GOOGL", 
    en: "Alphabet (Google)", 
    cn: "谷歌", 
    segment: "AI / Cloud", 
    market: "US", 
    aliases: ["Google", "谷歌", "Alphabet", "GOOGL"] 
  },
  
  "META": { 
    symbol: "META", 
    en: "Meta Platforms", 
    cn: "Meta", 
    segment: "AI / Social", 
    market: "US", 
    aliases: ["Meta", "Facebook", "臉書", "脸书", "META"] 
  },
  
  "AMD": { 
    symbol: "AMD", 
    en: "AMD", 
    cn: "超微", 
    segment: "AI Chips", 
    market: "US", 
    aliases: ["AMD", "超微"] 
  },
};

// Find stock by symbol, Chinese name, English name, or alias
export const findStock = (input: string): StockInfo | null => {
  const searchTerm = input.trim();
  console.log(`🔍 Searching for: "${searchTerm}"`);
  
  // Direct symbol match (case insensitive)
  const upperTerm = searchTerm.toUpperCase();
  if (STOCK_REGISTRY[upperTerm]) {
    console.log(`✅ Direct match: ${upperTerm}`);
    return STOCK_REGISTRY[upperTerm];
  }
  
  // Search through all stocks
  for (const [symbol, stock] of Object.entries(STOCK_REGISTRY)) {
    // Check exact Chinese name match
    if (stock.cn === searchTerm) {
      console.log(`✅ Chinese name match: ${stock.cn} -> ${symbol}`);
      return stock;
    }
    
    // Check English name match (case insensitive)
    if (stock.en.toUpperCase() === upperTerm) {
      console.log(`✅ English name match: ${stock.en} -> ${symbol}`);
      return stock;
    }
    
    // Check aliases (case insensitive for English, exact for Chinese)
    for (const alias of stock.aliases) {
      if (alias === searchTerm) {
        console.log(`✅ Alias match: ${alias} -> ${symbol}`);
        return stock;
      }
      if (alias.toUpperCase() === upperTerm && /[A-Za-z]/.test(alias)) {
        console.log(`✅ Alias (case-insensitive) match: ${alias} -> ${symbol}`);
        return stock;
      }
    }
    
    // Check if search term contains stock name (for phrases like "buy 台積電")
    if (searchTerm.includes(stock.cn)) {
      console.log(`✅ Contains Chinese name: ${stock.cn} in "${searchTerm}" -> ${symbol}`);
      return stock;
    }
  }
  
  console.log(`❌ No match found for: "${searchTerm}"`);
  return null;
};

// Get stocks by market
export const getStocksByMarket = (market: 'US' | 'TW' | 'HK'): StockInfo[] => {
  return Object.values(STOCK_REGISTRY).filter(stock => stock.market === market);
};

// Get stocks by segment
export const getStocksBySegment = (segment: string): StockInfo[] => {
  return Object.values(STOCK_REGISTRY).filter(stock => stock.segment === segment);
};

// Search stocks by keyword
export const searchStocks = (keyword: string): StockInfo[] => {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(STOCK_REGISTRY).filter(stock =>
    stock.en.toLowerCase().includes(lowerKeyword) ||
    stock.cn.includes(lowerKeyword) ||
    stock.segment.toLowerCase().includes(lowerKeyword) ||
    stock.aliases.some(alias => alias.toLowerCase().includes(lowerKeyword))
  );
};
