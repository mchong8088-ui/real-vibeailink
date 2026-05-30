// Stock symbol detection from natural language
// This restores: 騰訊 → 0700.HK, 台積電 → 2330.TW, Tesla → TSLA

const STOCK_ALIASES: Record<string, string> = {
  // Hong Kong Stocks
  "騰訊": "0700.HK",
  "腾讯": "0700.HK",
  "tencent": "0700.HK",
  "TENCENT": "0700.HK",
  "港交所": "0388.HK",
  "香港交易所": "0388.HK",
  "比亞迪": "1211.HK",
  "比亚迪": "1211.HK",
  "byd": "1211.HK",
  "BYD": "1211.HK",
  "小米": "1810.HK",
  "xiaomi": "1810.HK",
  "美團": "3690.HK",
  "美团": "3690.HK",
  "meituan": "3690.HK",
  "阿里巴巴": "9988.HK",
  "alibaba": "9988.HK",
  "滙豐": "0005.HK",
  "汇丰": "0005.HK",
  "hsbc": "0005.HK",
  "金沙": "1928.HK",
  "金沙中國": "1928.HK",
  
  // Taiwan Stocks
  "台積電": "2330.TW",
  "台积电": "2330.TW",
  "tsmc": "2330.TW",
  "TSMC": "2330.TW",
  "聯發科": "2454.TW",
  "联发科": "2454.TW",
  "mediatek": "2454.TW",
  "鴻海": "2317.TW",
  "鸿海": "2317.TW",
  "foxconn": "2317.TW",
  
  // US Stocks
  "特斯拉": "TSLA",
  "tesla": "TSLA",
  "苹果": "AAPL",
  "蘋果": "AAPL",
  "apple": "AAPL",
  "微軟": "MSFT",
  "微软": "MSFT",
  "microsoft": "MSFT",
  "谷歌": "GOOGL",
  "google": "GOOGL",
  "亞馬遜": "AMZN",
  "亚马逊": "AMZN",
  "amazon": "AMZN",
  "英偉達": "NVDA",
  "辉达": "NVDA",
  "nvidia": "NVDA",
  "輝達": "NVDA",
  "meta": "META",
  "amd": "AMD",
};

export function detectStock(input: string): string {
  if (!input || input.trim() === '') return '';
  
  const cleanInput = input.trim();
  const lowerInput = cleanInput.toLowerCase();
  
  // Check if it's already a valid stock symbol format
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) {
    return cleanInput.toUpperCase();
  }
  
  // 4-digit number (likely HK stock)
  if (/^\d{4}$/.test(cleanInput)) {
    return `${cleanInput}.HK`;
  }
  
  // 5-digit number (likely TW stock)
  if (/^\d{5}$/.test(cleanInput)) {
    return `${cleanInput}.TW`;
  }
  
  // All caps letter symbol (US stock)
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) {
    return cleanInput.toUpperCase();
  }
  
  // Check aliases map (case-insensitive)
  for (const [name, symbol] of Object.entries(STOCK_ALIASES)) {
    if (lowerInput.includes(name.toLowerCase())) {
      console.log(`✅ Detected stock: "${name}" -> ${symbol}`);
      return symbol;
    }
  }
  
  // If nothing matches, return as is
  return cleanInput.toUpperCase();
}

export function isQuestion(input: string): boolean {
  const questionWords = ['?', '？', 'should', 'buy', 'sell', '買', '賣', '點睇', '如何', '怎樣', '怎样', '是否', '會', '会'];
  return questionWords.some(word => input.includes(word));
}

export function extractStockFromQuestion(input: string): string | null {
  const symbol = detectStock(input);
  if (symbol !== input.trim().toUpperCase()) {
    return symbol;
  }
  return null;
}
