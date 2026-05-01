// data/stocks.ts
export interface StockInfo {
  symbol: string;
  en: string;
  cn: string;
  segment: string;
  aliases: string[]; // 這裡加入所有可能的名稱
}

export const STOCK_REGISTRY: Record<string, StockInfo> = {
  // --- 範例數據 (請依此格式填入您的 150 檔) ---
  "2330.TW": { 
    symbol: "2330.TW", en: "TSMC", cn: "台積電", segment: "Foundry", 
    aliases: ["TSMC", "台積電", "2330", "TSM"] 
  },
  "0700.HK": { 
    symbol: "0700.HK", en: "Tencent", cn: "騰訊", segment: "Platform", 
    aliases: ["騰訊", "騰訊控股", "TENCENT"] 
  },
  "NVDA": { 
    symbol: "NVDA", en: "NVIDIA", cn: "輝達", segment: "AI Chips", 
    aliases: ["NVIDIA", "輝達", "NVDA"] 
  },
  // 您可以繼續新增下方的 47 檔...
};

export const findStock = (input: string): StockInfo | null => {
  const searchTerm = input.trim().toUpperCase();
  
  // 遍歷所有 Registry，檢查是否符合 Symbol 或任何一個 Alias
  const found = Object.values(STOCK_REGISTRY).find(s => 
    s.symbol.toUpperCase() === searchTerm || 
    s.aliases.some(a => a.toUpperCase() === searchTerm) ||
    s.cn === input.trim()
  );
  
  return found || null;
};