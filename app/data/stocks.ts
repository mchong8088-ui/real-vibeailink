// app/data/stocks.ts

export interface StockInfo {
  symbol: string;
  en: string;
  cn: string;
  segment: string;
  aliases: string[];
}

export const STOCK_REGISTRY: Record<string, StockInfo> = {
  // =====================================
  // US STOCKS (Top 30)
  // =====================================
  "TSLA": { 
    symbol: "TSLA", en: "Tesla", cn: "特斯拉", segment: "EV", 
    aliases: ["TESLA", "TSLA", "特斯拉", "tesla stock", "buy tesla", "tsla stock"] 
  },
  "AAPL": { 
    symbol: "AAPL", en: "Apple", cn: "蘋果", segment: "Tech", 
    aliases: ["APPLE", "AAPL", "蘋果", "apple stock", "buy apple"] 
  },
  "NVDA": { 
    symbol: "NVDA", en: "NVIDIA", cn: "輝達", segment: "AI Chips", 
    aliases: ["NVIDIA", "NVDA", "輝達", "nvidia stock"] 
  },
  "MSFT": { 
    symbol: "MSFT", en: "Microsoft", cn: "微軟", segment: "Software", 
    aliases: ["MICROSOFT", "MSFT", "微軟", "microsoft stock"] 
  },
  "GOOGL": { 
    symbol: "GOOGL", en: "Alphabet", cn: "谷歌", segment: "Internet", 
    aliases: ["GOOGLE", "GOOGL", "谷歌", "alphabet stock"] 
  },
  "AMZN": { 
    symbol: "AMZN", en: "Amazon", cn: "亞馬遜", segment: "E-commerce", 
    aliases: ["AMAZON", "AMZN", "亞馬遜", "amazon stock"] 
  },
  "META": { 
    symbol: "META", en: "Meta", cn: "元宇宙", segment: "Social Media", 
    aliases: ["META", "FACEBOOK", "FB", "meta stock"] 
  },
  "NFLX": { 
    symbol: "NFLX", en: "Netflix", cn: "網飛", segment: "Streaming", 
    aliases: ["NETFLIX", "NFLX", "網飛"] 
  },
  "AMD": { 
    symbol: "AMD", en: "AMD", cn: "超微半導體", segment: "Semiconductor", 
    aliases: ["AMD", "超微", "amd stock"] 
  },
  "INTC": { 
    symbol: "INTC", en: "Intel", cn: "英特爾", segment: "Semiconductor", 
    aliases: ["INTEL", "INTC", "英特爾"] 
  },
  "JPM": { 
    symbol: "JPM", en: "JPMorgan", cn: "摩根大通", segment: "Banking", 
    aliases: ["JPMORGAN", "JPM", "摩根大通"] 
  },
  "BAC": { 
    symbol: "BAC", en: "Bank of America", cn: "美國銀行", segment: "Banking", 
    aliases: ["BANK OF AMERICA", "BAC", "美銀"] 
  },
  "WMT": { 
    symbol: "WMT", en: "Walmart", cn: "沃爾瑪", segment: "Retail", 
    aliases: ["WALMART", "WMT", "沃爾瑪"] 
  },
  "JNJ": { 
    symbol: "JNJ", en: "Johnson & Johnson", cn: "強生", segment: "Healthcare", 
    aliases: ["JOHNSON", "JNJ", "強生"] 
  },
  "PG": { 
    symbol: "PG", en: "Procter & Gamble", cn: "寶潔", segment: "Consumer", 
    aliases: ["PROCTER", "PG", "寶潔"] 
  },
  "V": { 
    symbol: "V", en: "Visa", cn: "維薩", segment: "Finance", 
    aliases: ["VISA", "V", "維薩"] 
  },
  "MA": { 
    symbol: "MA", en: "Mastercard", cn: "萬事達", segment: "Finance", 
    aliases: ["MASTERCARD", "MA", "萬事達"] 
  },
  "HD": { 
    symbol: "HD", en: "Home Depot", cn: "家得寶", segment: "Retail", 
    aliases: ["HOME DEPOT", "HD", "家得寶"] 
  },
  "DIS": { 
    symbol: "DIS", en: "Disney", cn: "迪士尼", segment: "Entertainment", 
    aliases: ["DISNEY", "DIS", "迪士尼"] 
  },
  "COST": { 
    symbol: "COST", en: "Costco", cn: "好市多", segment: "Retail", 
    aliases: ["COSTCO", "COST", "好市多"] 
  },
  "PFE": { 
    symbol: "PFE", en: "Pfizer", cn: "輝瑞", segment: "Pharma", 
    aliases: ["PFIZER", "PFE", "輝瑞"] 
  },
  "ABBV": { 
    symbol: "ABBV", en: "AbbVie", cn: "艾伯維", segment: "Pharma", 
    aliases: ["ABBVIE", "ABBV", "艾伯維"] 
  },
  "CRM": { 
    symbol: "CRM", en: "Salesforce", cn: "賽富時", segment: "Software", 
    aliases: ["SALESFORCE", "CRM", "賽富時"] 
  },
  "ADBE": { 
    symbol: "ADBE", en: "Adobe", cn: "奧多比", segment: "Software", 
    aliases: ["ADOBE", "ADBE", "奧多比"] 
  },
  "CSCO": { 
    symbol: "CSCO", en: "Cisco", cn: "思科", segment: "Networking", 
    aliases: ["CISCO", "CSCO", "思科"] 
  },
  "PEP": { 
    symbol: "PEP", en: "Pepsi", cn: "百事", segment: "Beverage", 
    aliases: ["PEPSI", "PEP", "百事"] 
  },
  "KO": { 
    symbol: "KO", en: "Coca-Cola", cn: "可口可樂", segment: "Beverage", 
    aliases: ["COCA COLA", "KO", "可口可樂"] 
  },
  "TMO": { 
    symbol: "TMO", en: "Thermo Fisher", cn: "賽默飛", segment: "Life Sciences", 
    aliases: ["THERMO", "TMO", "賽默飛"] 
  },
  "AVGO": { 
    symbol: "AVGO", en: "Broadcom", cn: "博通", segment: "Semiconductor", 
    aliases: ["BROADCOM", "AVGO", "博通"] 
  },
  "QCOM": { 
    symbol: "QCOM", en: "Qualcomm", cn: "高通", segment: "Semiconductor", 
    aliases: ["QUALCOMM", "QCOM", "高通"] 
  },

  // =====================================
  // HONG KONG STOCKS (Top 10)
  // =====================================
  "0700.HK": { 
    symbol: "0700.HK", en: "Tencent", cn: "騰訊控股", segment: "Internet", 
    aliases: ["TENCENT", "騰訊", "0700", "tencent stock", "騰訊控股"] 
  },
  "9988.HK": { 
    symbol: "9988.HK", en: "Alibaba", cn: "阿里巴巴", segment: "E-commerce", 
    aliases: ["ALIBABA", "阿里巴巴", "9988", "baba", "阿里"] 
  },
  "1299.HK": { 
    symbol: "1299.HK", en: "AIA Group", cn: "友邦保險", segment: "Insurance", 
    aliases: ["AIA", "友邦", "1299", "友邦保險"] 
  },
  "0005.HK": { 
    symbol: "0005.HK", en: "HSBC", cn: "滙豐銀行", segment: "Banking", 
    aliases: ["HSBC", "滙豐", "0005", "匯豐"] 
  },
  "1810.HK": { 
    symbol: "1810.HK", en: "Xiaomi", cn: "小米集團", segment: "Tech", 
    aliases: ["XIAOMI", "小米", "1810", "小米集团"] 
  },
  "0388.HK": { 
    symbol: "0388.HK", en: "HKEX", cn: "香港交易所", segment: "Exchange", 
    aliases: ["HKEX", "港交所", "0388", "香港交易所"] 
  },
  "1928.HK": { 
    symbol: "1928.HK", en: "Sands China", cn: "金沙中國", segment: "Gaming", 
    aliases: ["SANDS CHINA", "金沙", "1928", "金沙中國"] 
  },
  "0939.HK": { 
    symbol: "0939.HK", en: "CCB", cn: "建設銀行", segment: "Banking", 
    aliases: ["CCB", "建設銀行", "0939", "建行"] 
  },
  "1398.HK": { 
    symbol: "1398.HK", en: "ICBC", cn: "工商銀行", segment: "Banking", 
    aliases: ["ICBC", "工商銀行", "1398", "工行"] 
  },
  "2269.HK": { 
    symbol: "2269.HK", en: "WuXi Biologics", cn: "藥明生物", segment: "Biotech", 
    aliases: ["WUXI", "藥明生物", "2269", "药明生物"] 
  },

  // =====================================
  // TAIWAN STOCKS (Top 10)
  // =====================================
  "2330.TW": { 
    symbol: "2330.TW", en: "TSMC", cn: "台積電", segment: "Semiconductor", 
    aliases: ["TSMC", "台積電", "2330", "tsmc stock", "台积电"] 
  },
  "2317.TW": { 
    symbol: "2317.TW", en: "Hon Hai", cn: "鴻海精密", segment: "Manufacturing", 
    aliases: ["HON HAI", "鴻海", "2317", "foxconn", "富士康"] 
  },
  "2454.TW": { 
    symbol: "2454.TW", en: "MediaTek", cn: "聯發科", segment: "Semiconductor", 
    aliases: ["MEDIATEK", "聯發科", "2454", "联发科"] 
  },
  "2412.TW": { 
    symbol: "2412.TW", en: "Chunghwa Telecom", cn: "中華電信", segment: "Telecom", 
    aliases: ["CHUNGHWA", "中華電", "2412", "中华电信"] 
  },
  "2308.TW": { 
    symbol: "2308.TW", en: "Delta", cn: "台達電", segment: "Electronics", 
    aliases: ["DELTA", "台達電", "2308", "台达电"] 
  },
  "2382.TW": { 
    symbol: "2382.TW", en: "Quanta", cn: "廣達", segment: "Tech", 
    aliases: ["QUANTA", "廣達", "2382", "广达"] 
  },
  "2357.TW": { 
    symbol: "2357.TW", en: "Asus", cn: "華碩", segment: "Tech", 
    aliases: ["ASUS", "華碩", "2357", "华硕"] 
  },
  "2303.TW": { 
    symbol: "2303.TW", en: "UMC", cn: "聯電", segment: "Semiconductor", 
    aliases: ["UMC", "聯電", "2303", "联电"] 
  },
  "2891.TW": { 
    symbol: "2891.TW", en: "CTBC", cn: "中信金", segment: "Finance", 
    aliases: ["CTBC", "中信金", "2891", "中国信托"] 
  },
  "2881.TW": { 
    symbol: "2881.TW", en: "Fubon", cn: "富邦金", segment: "Finance", 
    aliases: ["FUBON", "富邦金", "2881", "富邦"] 
  },
};

export const findStock = (input: string): StockInfo | null => {
  if (!input) return null;
  const searchTerm = input.trim().toUpperCase();
  
  const found = Object.values(STOCK_REGISTRY).find(s => 
    s.symbol.toUpperCase() === searchTerm || 
    s.aliases.some(alias => alias.toUpperCase() === searchTerm)
  );
  
  return found || null;
};

export const getAllStocks = (): StockInfo[] => {
  return Object.values(STOCK_REGISTRY);
};