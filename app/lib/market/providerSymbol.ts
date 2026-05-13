// lib/market/providerSymbol.ts
export function getProviderSymbol(symbol: string, provider: string) {
  // For HK stocks, TwelveData needs numeric code without leading zeros
  if (symbol.endsWith(".HK")) {
    const code = symbol.replace(".HK", "").replace(/^0+/, "");
    if (provider === "twelvedata") {
      return `${code}.HK`;
    }
    return symbol;
  }
  // For TW and US stocks, return as-is
  return symbol;
}