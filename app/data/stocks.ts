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
  // ===== US MARKET =====
  "TSLA": { symbol: "TSLA", en: "Tesla", cn: "特斯拉", segment: "EV / AI", market: "US", aliases: ["Tesla", "特斯拉", "TSLA"] },
  "NVDA": { symbol: "NVDA", en: "NVIDIA", cn: "輝達", segment: "AI Chips", market: "US", aliases: ["NVIDIA", "輝達", "英伟达", "NVDA"] },
  "AAPL": { symbol: "AAPL", en: "Apple", cn: "蘋果", segment: "Devices", market: "US", aliases: ["Apple", "蘋果", "苹果", "AAPL"] },
  "AMZN": { symbol: "AMZN", en: "Amazon", cn: "亞馬遜", segment: "Cloud", market: "US", aliases: ["Amazon", "亞馬遜", "亚马逊", "AMZN"] },
  "MSFT": { symbol: "MSFT", en: "Microsoft", cn: "微軟", segment: "Cloud + AI", market: "US", aliases: ["Microsoft", "微軟", "微软", "MSFT"] },
  "GOOGL": { symbol: "GOOGL", en: "Google", cn: "谷歌", segment: "AI / Cloud", market: "US", aliases: ["Google", "谷歌", "GOOGL"] },
  "META": { symbol: "META", en: "Meta", cn: "Meta", segment: "Social", market: "US", aliases: ["Meta", "Facebook", "META"] },
  "AMD": { symbol: "AMD", en: "AMD", cn: "超微", segment: "Chips", market: "US", aliases: ["AMD", "超微"] },
  
  // ===== TAIWAN MARKET =====
  "2330.TW": { symbol: "2330.TW", en: "TSMC", cn: "台積電", segment: "Foundry", market: "TW", aliases: ["TSMC", "台積電", "台积电", "2330", "TSM"] },
  "2454.TW": { symbol: "2454.TW", en: "MediaTek", cn: "聯發科", segment: "IC Design", market: "TW", aliases: ["MediaTek", "聯發科", "联发科"] },
  "2317.TW": { symbol: "2317.TW", en: "Foxconn", cn: "鴻海", segment: "AI Servers", market: "TW", aliases: ["Foxconn", "鴻海", "鸿海"] },
  
  // ===== HONG KONG MARKET (Major stocks) =====
  "1928.HK": { 
    symbol: "1928.HK", 
    en: "Sands China", 
    cn: "金沙中國", 
    segment: "Gaming / Tourism", 
    market: "HK", 
    aliases: ["Sands China", "金沙中國", "金沙中国", "1928"] 
  },
  
  "0700.HK": { symbol: "0700.HK", en: "Tencent", cn: "騰訊", segment: "Internet", market: "HK", aliases: ["Tencent", "騰訊", "腾讯", "0700"] },
  "1211.HK": { symbol: "1211.HK", en: "BYD", cn: "比亞迪", segment: "EV", market: "HK", aliases: ["BYD", "比亞迪", "比亚迪", "1211"] },
  "9988.HK": { symbol: "9988.HK", en: "Alibaba", cn: "阿里巴巴", segment: "E-commerce", market: "HK", aliases: ["Alibaba", "阿里巴巴", "9988", "BABA"] },
  "3690.HK": { symbol: "3690.HK", en: "Meituan", cn: "美團", segment: "Platform", market: "HK", aliases: ["Meituan", "美團", "美团", "3690"] },
  "1810.HK": { symbol: "1810.HK", en: "Xiaomi", cn: "小米", segment: "AIoT", market: "HK", aliases: ["Xiaomi", "小米", "1810"] },
  "0388.HK": { symbol: "0388.HK", en: "HKEX", cn: "港交所", segment: "Exchange", market: "HK", aliases: ["HKEX", "港交所", "0388"] },
  "0005.HK": { symbol: "0005.HK", en: "HSBC", cn: "滙豐", segment: "Banking", market: "HK", aliases: ["HSBC", "滙豐", "汇丰", "0005"] },
  "0939.HK": { symbol: "0939.HK", en: "CCB", cn: "建設銀行", segment: "Banking", market: "HK", aliases: ["CCB", "建設銀行", "建设银行", "0939"] },
  "1398.HK": { symbol: "1398.HK", en: "ICBC", cn: "工商銀行", segment: "Banking", market: "HK", aliases: ["ICBC", "工商銀行", "工商银行", "1398"] },
  "3988.HK": { symbol: "3988.HK", en: "Bank of China", cn: "中國銀行", segment: "Banking", market: "HK", aliases: ["BOC", "中國銀行", "中国银行", "3988"] },
  "2628.HK": { symbol: "2628.HK", en: "China Life", cn: "中國人壽", segment: "Insurance", market: "HK", aliases: ["China Life", "中國人壽", "中国人寿", "2628"] },
  "0883.HK": { symbol: "0883.HK", en: "CNOOC", cn: "中海油", segment: "Energy", market: "HK", aliases: ["CNOOC", "中海油", "0883"] },
  "0857.HK": { symbol: "0857.HK", en: "PetroChina", cn: "中石油", segment: "Energy", market: "HK", aliases: ["PetroChina", "中石油", "0857"] },
  "0386.HK": { symbol: "0386.HK", en: "Sinopec", cn: "中石化", segment: "Energy", market: "HK", aliases: ["Sinopec", "中石化", "0386"] },
  "0941.HK": { symbol: "0941.HK", en: "China Mobile", cn: "中國移動", segment: "Telecom", market: "HK", aliases: ["China Mobile", "中國移動", "中国移动", "0941"] },
  "0762.HK": { symbol: "0762.HK", en: "China Unicom", cn: "中國聯通", segment: "Telecom", market: "HK", aliases: ["China Unicom", "中國聯通", "中国联通", "0762"] },
  "0728.HK": { symbol: "0728.HK", en: "China Telecom", cn: "中國電信", segment: "Telecom", market: "HK", aliases: ["China Telecom", "中國電信", "中国电信", "0728"] },
  "0960.HK": { symbol: "0960.HK", en: "Longfor", cn: "龍湖集團", segment: "Property", market: "HK", aliases: ["Longfor", "龍湖集團", "龙湖集团", "0960"] },
  "1109.HK": { symbol: "1109.HK", en: "China Resources Land", cn: "華潤置地", segment: "Property", market: "HK", aliases: ["CR Land", "華潤置地", "华润置地", "1109"] },
  "0688.HK": { symbol: "0688.HK", en: "China Overseas", cn: "中國海外", segment: "Property", market: "HK", aliases: ["COLI", "中國海外", "中国海外", "0688"] },
  "2020.HK": { symbol: "2020.HK", en: "ANTA Sports", cn: "安踏體育", segment: "Retail", market: "HK", aliases: ["ANTA", "安踏體育", "安踏体育", "2020"] },
  "2331.HK": { symbol: "2331.HK", en: "Li Ning", cn: "李寧", segment: "Retail", market: "HK", aliases: ["Li Ning", "李寧", "李宁", "2331"] },
  "1876.HK": { symbol: "1876.HK", en: "Budweiser APAC", cn: "百威亞太", segment: "Consumer", market: "HK", aliases: ["Budweiser", "百威亞太", "百威亚太", "1876"] },
  "0291.HK": { symbol: "0291.HK", en: "CR Beer", cn: "華潤啤酒", segment: "Consumer", market: "HK", aliases: ["CR Beer", "華潤啤酒", "华润啤酒", "0291"] },
};

// Enhanced findStock function - DIRECT SYMBOL MATCH FIRST!
export const findStock = (input: string): StockInfo | null => {
  if (!input || input.trim() === '') return null;
  
  const searchTerm = input.trim();
  const upperTerm = searchTerm.toUpperCase();
  
  console.log(`🔍 Searching for: "${searchTerm}"`);
  
  // FIRST PRIORITY: Direct symbol match (e.g., "1928.HK", "TSLA", "2330.TW")
  if (STOCK_REGISTRY[upperTerm]) {
    console.log(`✅ Direct symbol match: ${upperTerm}`);
    return STOCK_REGISTRY[upperTerm];
  }
  
  // Check if it's a Hong Kong numeric code without .HK (e.g., "1928")
  if (/^\d{4}$/.test(searchTerm)) {
    const withHK = `${searchTerm}.HK`;
    if (STOCK_REGISTRY[withHK]) {
      console.log(`✅ HK numeric match: ${withHK}`);
      return STOCK_REGISTRY[withHK];
    }
  }
  
  // Check if it's a Taiwan numeric code (e.g., "2330")
  if (/^\d{4}$/.test(searchTerm)) {
    const withTW = `${searchTerm}.TW`;
    if (STOCK_REGISTRY[withTW]) {
      console.log(`✅ TW numeric match: ${withTW}`);
      return STOCK_REGISTRY[withTW];
    }
  }
  
  // Then search through all stocks
  for (const [symbol, stock] of Object.entries(STOCK_REGISTRY)) {
    // Exact Chinese name match
    if (stock.cn === searchTerm) {
      console.log(`✅ Chinese match: ${stock.cn} -> ${symbol}`);
      return stock;
    }
    
    // Exact English name match (case insensitive)
    if (stock.en.toLowerCase() === searchTerm.toLowerCase()) {
      console.log(`✅ English match: ${stock.en} -> ${symbol}`);
      return stock;
    }
    
    // Check if search term contains the Chinese name
    if (searchTerm.includes(stock.cn)) {
      console.log(`✅ Contains Chinese: "${stock.cn}" -> ${symbol}`);
      return stock;
    }
    
    // Check aliases
    for (const alias of stock.aliases) {
      if (alias === searchTerm) {
        console.log(`✅ Alias match: ${alias} -> ${symbol}`);
        return stock;
      }
      if (alias.toLowerCase() === searchTerm.toLowerCase()) {
        console.log(`✅ Alias (case) match: ${alias} -> ${symbol}`);
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
  const questionIndicators = ['?', '？', 'should', '買', '卖', '賣', 'buy', 'sell', '如何', '怎樣', '怎样', '是否'];
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
