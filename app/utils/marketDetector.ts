// Simple stock symbol detection
const SYMBOL_MAP: Record<string, string> = {
  "台積電": "2330.TW",
  "騰訊": "0700.HK",
  "港交所": "0388.HK",
  "特斯拉": "TSLA",
  "英偉達": "NVDA",
  "輝達": "NVDA"
};

export const detectMarket = (input: string) => {
  const cleanInput = input.trim().toUpperCase();

  // 1. Check if already includes market suffix
  if (cleanInput.endsWith('.TW') || cleanInput.includes('台灣')) return { market: 'TW', symbol: cleanInput.replace('台灣', '').trim() };
  if (cleanInput.endsWith('.HK') || cleanInput.includes('香港')) return { market: 'HK', symbol: cleanInput.replace('香港', '').trim() };
  
  // 2. Check SYMBOL_MAP dictionary
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    if (input.includes(name)) return { market: symbol.includes('.TW') ? 'TW' : symbol.includes('.HK') ? 'HK' : 'US', symbol: symbol };
  }

  // 3. Default logic: if pure number treat as HK, otherwise US
  if (/^\d+$/.test(cleanInput)) return { market: 'HK', symbol: `${cleanInput}.HK` };
  
  return { market: 'US', symbol: cleanInput };
};

export const extractStockFromQuestion = (input: string): string | null => {
  const cleanInput = input.trim();
  
  // Check for known stock names
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    if (cleanInput.includes(name)) return symbol;
  }
  
  return null;
};

export const isQuestion = (input: string): boolean => {
  const questionIndicators = ['?', '？', 'should', '買', '卖', '賣', 'buy', 'sell', '如何', '怎樣', '怎样', '是否'];
  return questionIndicators.some(indicator => input.includes(indicator));
};
