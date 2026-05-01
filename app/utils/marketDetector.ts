// 用於將名稱映射到符號的簡單字典
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

  // 1. 檢查是否已直接包含市場後綴
  if (cleanInput.endsWith('.TW') || cleanInput.includes('台灣')) return { market: 'TW', symbol: cleanInput.replace('台灣', '').trim() };
  if (cleanInput.endsWith('.HK') || cleanInput.includes('香港')) return { market: 'HK', symbol: cleanInput.replace('香港', '').trim() };
  
  // 2. 檢查 SYMBOL_MAP 字典
  for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
    if (input.includes(name)) return { market: symbol.includes('.TW') ? 'TW' : symbol.includes('.HK') ? 'HK' : 'US', symbol: symbol };
  }

  // 3. 預設邏輯：如果是純數字視為 HK (Mark Six 或港股)，否則視為 US
  if (/^\d+$/.test(cleanInput)) return { market: 'HK', symbol: `${cleanInput}.HK` };
  
  return { market: 'US', symbol: cleanInput };
};