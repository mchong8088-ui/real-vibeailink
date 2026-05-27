// Stock symbol mapping for Chinese and English names (Top 50+ stocks)
const SYMBOL_MAP: Record<string, string> = {
  // ===== BYD (比亚迪) - Add this first =====
  "比亚迪": "1211.HK",
  "比亞迪": "1211.HK",
  "BYD": "1211.HK",
  "比亚迪股份": "1211.HK",
  "比亞迪股份": "1211.HK",
  "BYD Company": "1211.HK",
  
  // ===== US Tech Stocks =====
  "特斯拉": "TSLA",
  "Tesla": "TSLA",
  "英偉達": "NVDA",
  "輝達": "NVDA",
  "NVIDIA": "NVDA",
  "苹果": "AAPL",
  "蘋果": "AAPL",
  "Apple": "AAPL",
  "微软": "MSFT",
  "微軟": "MSFT",
  "Microsoft": "MSFT",
  "谷歌": "GOOGL",
  "Google": "GOOGL",
  "亚马逊": "AMZN",
  "Amazon": "AMZN",
  "Meta": "META",
  "臉書": "META",
  "Facebook": "META",
  
  // ===== Chinese Tech Stocks =====
  "台積電": "2330.TW",
  "台积电": "2330.TW",
  "TSMC": "2330.TW",
  "騰訊": "0700.HK",
  "腾讯": "0700.HK",
  "Tencent": "0700.HK",
  "阿里巴巴": "BABA",
  "Alibaba": "BABA",
  "百度": "BIDU",
  "Baidu": "BIDU",
  "京东": "JD",
  "京東": "JD",
  "拼多多": "PDD",
  "Pinduoduo": "PDD",
  "港交所": "0388.HK",
  "香港交易所": "0388.HK",
  "小米": "1810.HK",
  "Xiaomi": "1810.HK",
  "美团": "3690.HK",
  "美團": "3690.HK",
  "Meituan": "3690.HK",
};

// Keywords that indicate a stock symbol might be mentioned
const STOCK_KEYWORDS = [
  "stock", "share", "買", "卖", "賣", "buy", "sell", "invest", "投資",
  "股价", "股價", "price", "should I", "我應該", "我应该",
  "recommend", "建議", "建议", "analysis", "分析", "worth", "值不值得",
  "看好", "看跌", "bullish", "bearish"
];

// Extract stock symbol from natural language question
export const extractStockFromQuestion = (input: string): string | null => {
  const cleanInput = input.trim();
  
  // First, check if the input contains any known stock names
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    if (regex.test(cleanInput)) {
      console.log(`✅ Found stock name "${name}" -> ${symbol}`);
      return symbol;
    }
  }
  
  // Check for common ticker patterns
  const tickerPattern = /[A-Z]{1,5}(?:\.(?:HK|TW))?/i;
  const match = cleanInput.match(tickerPattern);
  if (match && match[0].length >= 2 && match[0].length <= 8) {
    const potentialSymbol = match[0].toUpperCase();
    if (!['I', 'A', 'TO', 'BE', 'AND', 'FOR', 'THE', 'IS', 'ARE'].includes(potentialSymbol)) {
      return potentialSymbol;
    }
  }
  
  return null;
};

// Check if the input is asking a question
export const isQuestion = (input: string): boolean => {
  const questionIndicators = ['?', '？', 'should', '買', '卖', '賣', 'buy', 'sell', '如何', '怎樣', '怎样', '是否', '值不值得', '會', '会'];
  return questionIndicators.some(indicator => input.includes(indicator));
};

export const detectMarket = (input: string) => {
  const cleanInput = input.trim().toUpperCase();
  
  // First try to extract from natural language question
  const extractedSymbol = extractStockFromQuestion(input);
  if (extractedSymbol) {
    if (extractedSymbol.endsWith('.TW')) return { market: 'TW', symbol: extractedSymbol };
    if (extractedSymbol.endsWith('.HK')) return { market: 'HK', symbol: extractedSymbol };
    return { market: 'US', symbol: extractedSymbol };
  }

  // Check if already includes market suffix
  if (cleanInput.endsWith('.TW') || cleanInput.includes('台灣')) 
    return { market: 'TW', symbol: cleanInput.replace('台灣', '').trim() };
  if (cleanInput.endsWith('.HK') || cleanInput.includes('香港')) 
    return { market: 'HK', symbol: cleanInput.replace('香港', '').trim() };
  
  // Check SYMBOL_MAP dictionary
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    if (input.includes(name)) {
      const isTW = symbol.includes('.TW');
      const isHK = symbol.includes('.HK');
      return { market: isTW ? 'TW' : isHK ? 'HK' : 'US', symbol: symbol };
    }
  }

  // Default logic
  if (/^\d+$/.test(cleanInput)) return { market: 'HK', symbol: `${cleanInput}.HK` };
  
  return { market: 'US', symbol: cleanInput };
};

export { SYMBOL_MAP };
