import { findStock, StockInfo } from '@/app/data/stocks';

export const detectMarket = (input: string) => {
  const cleanInput = input.trim();
  
  // First try to find stock in registry
  const stock = findStock(cleanInput);
  if (stock) {
    console.log(`✅ Found stock in registry: ${stock.cn} (${stock.symbol})`);
    return { market: stock.market, symbol: stock.symbol };
  }
  
  // Fallback to basic detection
  const upperInput = cleanInput.toUpperCase();
  
  if (upperInput.endsWith('.TW')) return { market: 'TW', symbol: upperInput };
  if (upperInput.endsWith('.HK')) return { market: 'HK', symbol: upperInput };
  if (/^\d+$/.test(upperInput)) return { market: 'HK', symbol: `${upperInput}.HK` };
  
  return { market: 'US', symbol: upperInput };
};

export const extractStockFromQuestion = (input: string): string | null => {
  console.log(`🔍 Extracting stock from: "${input}"`);
  const stock = findStock(input);
  if (stock) {
    console.log(`✅ Found: ${stock.cn} -> ${stock.symbol}`);
    return stock.symbol;
  }
  console.log(`❌ No stock found in registry`);
  return null;
};

export const isQuestion = (input: string): boolean => {
  const questionIndicators = ['?', '？', 'should', '買', '卖', '賣', 'buy', 'sell', '如何', '怎樣', '怎样', '是否', '值不值得', '會', '会'];
  return questionIndicators.some(indicator => input.includes(indicator));
};

export { findStock };
