// app/lib/market/symbolParser.ts
import { findStock } from "../../data/stocks";

export function extractStockSymbol(query: string): string | null {
  if (!query || query.trim() === "") {
    return null;
  }
  
  const normalizedQuery = query.trim();
  console.log("Parsing query:", normalizedQuery);
  
  // STEP 1: Check against stock registry (supports 50+ stocks with aliases)
  const stockInfo = findStock(normalizedQuery);
  if (stockInfo) {
    console.log(`✓ Registry match: ${stockInfo.symbol}`);
    return stockInfo.symbol;
  }
  
  // STEP 2: Check direct symbol patterns
  // US: 1-5 letters (TSLA, AAPL, NVDA)
  const usPattern = /^[A-Z]{1,5}$/i;
  if (usPattern.test(normalizedQuery)) {
    console.log(`✓ Direct US symbol: ${normalizedQuery.toUpperCase()}`);
    return normalizedQuery.toUpperCase();
  }
  
  // HK: 4 digits with optional .HK (0700, 0700.HK)
  const hkPattern = /^(\d{4})(?:\.HK)?$/i;
  const hkMatch = normalizedQuery.match(hkPattern);
  if (hkMatch) {
    console.log(`✓ Direct HK symbol: ${hkMatch[1]}.HK`);
    return `${hkMatch[1]}.HK`;
  }
  
  // TW: 4 digits with .TW (2330.TW)
  const twPattern = /^(\d{4})\.TW$/i;
  const twMatch = normalizedQuery.match(twPattern);
  if (twMatch) {
    console.log(`✓ Direct TW symbol: ${twMatch[0].toUpperCase()}`);
    return twMatch[0].toUpperCase();
  }
  
  // STEP 3: Check for embedded stock symbols (e.g., "buy TSLA", "TSLA stock")
  const commonSymbols = ["TSLA", "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META"];
  for (const sym of commonSymbols) {
    const regex = new RegExp(`\\b${sym}\\b`, 'i');
    if (regex.test(normalizedQuery)) {
      console.log(`✓ Embedded symbol: ${sym}`);
      return sym;
    }
  }
  
  // STEP 4: Check for HK pattern in middle of text
  const hkEmbeddedPattern = /\b(\d{4})(?:\.HK)?\b/i;
  const hkEmbeddedMatch = normalizedQuery.match(hkEmbeddedPattern);
  if (hkEmbeddedMatch) {
    console.log(`✓ Embedded HK symbol: ${hkEmbeddedMatch[1]}.HK`);
    return `${hkEmbeddedMatch[1]}.HK`;
  }
  
  console.log(`✗ No match found for: "${normalizedQuery}"`);
  return null;
}

export function isValidSymbolFormat(symbol: string): boolean {
  const usPattern = /^[A-Z]{1,5}$/;
  const hkPattern = /^\d{4}\.HK$/i;
  const twPattern = /^\d{4}\.TW$/i;
  return usPattern.test(symbol) || hkPattern.test(symbol) || twPattern.test(symbol);
}