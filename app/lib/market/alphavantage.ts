// app/lib/market/alphavantage.ts
export async function getAlphaVantageQuote(symbol: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;
  
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  );
  const data = await response.json();
  
  const quote = data["Global Quote"];
  if (!quote) return null;
  
  return {
    symbol: quote["01. symbol"],
    price: parseFloat(quote["05. price"]),
    change: parseFloat(quote["09. change"]),
    changePercent: quote["10. change percent"],
    volume: parseInt(quote["06. volume"]),
  };
}