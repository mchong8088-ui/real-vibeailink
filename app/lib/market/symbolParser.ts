// Stock symbol extraction from natural language
const SYMBOL_MAP: Record<string, string> = {
  "台積電": "2330.TW",
  "台积电": "2330.TW",
  "TSMC": "2330.TW",
  "騰訊": "0700.HK",
  "腾讯": "0700.HK",
  "港交所": "0388.HK",
  "特斯拉": "TSLA",
  "Tesla": "TSLA",
  "英偉達": "NVDA",
  "輝達": "NVDA",
  "NVIDIA": "NVDA",
};

export function extractStockSymbol(query: string): string | null {
  if (!query || query.trim() === '') return null;
  
  const cleanQuery = query.trim();
  
  // Direct symbol with suffix
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanQuery)) {
    return cleanQuery.toUpperCase();
  }
  
  // 4-digit number (HK stock)
  if (/^\d{4}$/.test(cleanQuery)) {
    return `${cleanQuery}.HK`;
  }
  
  // 5-digit number (TW stock)  
  if (/^\d{5}$/.test(cleanQuery)) {
    return `${cleanQuery}.TW`;
  }
  
  // All caps letter symbol (US stock)
  if (/^[A-Z]{1,5}$/i.test(cleanQuery)) {
    return cleanQuery.toUpperCase();
  }
  
  // Check Chinese name mapping
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    if (cleanQuery.includes(name)) {
      return symbol;
    }
  }
  
  return null;
}

// Additional exports that route.ts might expect
export function extractStockFromQuestion(query: string): string | null {
  return extractStockSymbol(query);
}

export function isQuestion(query: string): boolean {
  const indicators = ['?', '？', 'should', 'buy', 'sell', '買', '賣', '如何', '是否'];
  return indicators.some(i => query.includes(i));
}

export function detectMarket(query: string): { market: string; symbol: string } {
  const symbol = extractStockSymbol(query);
  if (!symbol) return { market: 'US', symbol: query.toUpperCase() };
  
  if (symbol.endsWith('.TW')) return { market: 'TW', symbol };
  if (symbol.endsWith('.HK')) return { market: 'HK', symbol };
  return { market: 'US', symbol };
}
