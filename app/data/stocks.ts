// Stock Registry - Comprehensive stock database
export interface StockInfo {
  symbol: string;
  en: string;
  cn: string;
  segment: string;
  market: 'US' | 'TW' | 'HK';
  aliases: string[];
}

export const STOCK_REGISTRY: Record<string, StockInfo> = {
  // ===== US MARKET - Top stocks =====
  "TSLA": { 
    symbol: "TSLA", 
    en: "Tesla", 
    cn: "特斯拉", 
    segment: "EV / AI", 
    market: "US", 
    aliases: ["Tesla", "特斯拉", "TSLA", "特斯拉汽車"] 
  },
  
  "NVDA": { 
    symbol: "NVDA", 
    en: "NVIDIA", 
    cn: "輝達", 
    segment: "AI Chips / GPU", 
    market: "US", 
    aliases: ["NVIDIA", "輝達", "英伟达", "NVDA"] 
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
    en: "Google", 
    cn: "谷歌", 
    segment: "AI / Cloud", 
    market: "US", 
    aliases: ["Google", "谷歌", "Alphabet", "GOOGL"] 
  },
  
  "META": { 
    symbol: "META", 
    en: "Meta", 
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
  
  // ===== TAIWAN MARKET =====
  "2330.TW": { 
    symbol: "2330.TW", 
    en: "TSMC", 
    cn: "台積電", 
    segment: "Foundry", 
    market: "TW", 
    aliases: ["TSMC", "台積電", "台积电", "2330", "TSM"] 
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
    en: "Foxconn", 
    cn: "鴻海", 
    segment: "AI Servers", 
    market: "TW", 
    aliases: ["Foxconn", "鴻海", "鸿海", "2317"] 
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
};

// Enhanced findStock function with better matching
export const findStock = (input: string): StockInfo | null => {
  if (!input || input.trim() === '') return null;
  
  const searchTerm = input.trim();
  const lowerSearch = searchTerm.toLowerCase();
  
  console.log(`🔍 Searching for: "${searchTerm}"`);
  
  // First, try direct symbol match (case insensitive)
  const upperTerm = searchTerm.toUpperCase();
  if (STOCK_REGISTRY[upperTerm]) {
    console.log(`✅ Direct symbol match: ${upperTerm}`);
    return STOCK_REGISTRY[upperTerm];
  }
  
  // Search through all stocks with multiple matching strategies
  for (const [symbol, stock] of Object.entries(STOCK_REGISTRY)) {
    
    // 1. Exact Chinese name match
    if (stock.cn === searchTerm) {
      console.log(`✅ Exact Chinese match: ${stock.cn} -> ${symbol}`);
      return stock;
    }
    
    // 2. Exact English name match (case insensitive)
    if (stock.en.toLowerCase() === lowerSearch) {
      console.log(`✅ Exact English match: ${stock.en} -> ${symbol}`);
      return stock;
    }
    
    // 3. Check if search term contains the Chinese name (for "buy 台積電" etc.)
    if (searchTerm.includes(stock.cn)) {
      console.log(`✅ Contains Chinese name: "${stock.cn}" in "${searchTerm}" -> ${symbol}`);
      return stock;
    }
    
    // 4. Check if search term contains the English name (case insensitive)
    if (lowerSearch.includes(stock.en.toLowerCase())) {
      console.log(`✅ Contains English name: "${stock.en}" in "${searchTerm}" -> ${symbol}`);
      return stock;
    }
    
    // 5. Check aliases
    for (const alias of stock.aliases) {
      // Exact alias match
      if (alias === searchTerm) {
        console.log(`✅ Exact alias match: ${alias} -> ${symbol}`);
        return stock;
      }
      // Case insensitive for English aliases
      if (/[A-Za-z]/.test(alias) && alias.toLowerCase() === lowerSearch) {
        console.log(`✅ Alias (case-insensitive) match: ${alias} -> ${symbol}`);
        return stock;
      }
      // Search term contains alias (for "buy Tesla" containing "Tesla")
      if (lowerSearch.includes(alias.toLowerCase())) {
        console.log(`✅ Contains alias: "${alias}" in "${searchTerm}" -> ${symbol}`);
        return stock;
      }
    }
  }
  
  console.log(`❌ No match found for: "${searchTerm}"`);
  return null;
};

export const extractStockFromQuestion = (input: string): string | null => {
  const stock = findStock(input);
  return stock ? stock.symbol : null;
};

export const isQuestion = (input: string): boolean => {
  const questionIndicators = ['?', '？', 'should', '買', '卖', '賣', 'buy', 'sell', '如何', '怎樣', '怎样', '是否', '值不值得', '會', '会'];
  return questionIndicators.some(indicator => input.includes(indicator));
};

export const detectMarket = (input: string) => {
  const stock = findStock(input);
  if (stock) {
    return { market: stock.market, symbol: stock.symbol };
  }
  return { market: 'US', symbol: input.toUpperCase() };
};

export { STOCK_REGISTRY };
