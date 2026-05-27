// Simple stock symbol detection - generic approach
const SYMBOL_MAP: Record<string, string> = {
  "台積電": "2330.TW",
  "台积电": "2330.TW",
  "騰訊": "0700.HK",
  "腾讯": "0700.HK",
  "港交所": "0388.HK",
  "特斯拉": "TSLA",
  "Tesla": "TSLA",
  "英偉達": "NVDA",
  "輝達": "NVDA",
  "NVIDIA": "NVDA",
  "比亚迪": "1211.HK",
  "比亞迪": "1211.HK",
  "BYD": "1211.HK",
};

export const detectMarket = (input: string) => {
  const cleanInput = input.trim().toUpperCase();

  // 1. Direct stock symbol (generic - any format works)
  // If user enters ANY stock symbol like 0001.HK, TSLA, 2330.TW, just use it
  if (cleanInput.match(/^[A-Z0-9.]+$/)) {
    // Check if it already has a suffix
    if (cleanInput.endsWith('.TW') || cleanInput.endsWith('.HK')) {
      return { market: cleanInput.endsWith('.TW') ? 'TW' : 'HK', symbol: cleanInput };
    }
    // Check if it's a 4-digit number (likely Hong Kong stock)
    if (/^\d{4}$/.test(cleanInput)) {
      return { market: 'HK', symbol: `${cleanInput}.HK` };
    }
    // Default to US for letters
    if (/^[A-Z]+$/.test(cleanInput)) {
      return { market: 'US', symbol: cleanInput };
    }
  }
  
  // 2. Check Chinese name mapping
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    if (input.includes(name)) {
      if (symbol.includes('.TW')) return { market: 'TW', symbol: symbol };
      if (symbol.includes('.HK')) return { market: 'HK', symbol: symbol };
      return { market: 'US', symbol: symbol };
    }
  }

  // 3. Default: treat as US stock symbol
  const symbol = cleanInput.replace(/[^A-Z0-9]/g, '');
  if (symbol) return { market: 'US', symbol: symbol };
  
  return { market: 'US', symbol: cleanInput };
};

export const extractStockFromQuestion = (input: string): string | null => {
  const result = detectMarket(input);
  return result.symbol !== input.toUpperCase() ? result.symbol : null;
};

export const isQuestion = (input: string): boolean => {
  const questionIndicators = ['?', '？', 'should', '買', '卖', '賣', 'buy', 'sell', '如何', '怎樣', '怎样', '是否'];
  return questionIndicators.some(indicator => input.includes(indicator));
};
