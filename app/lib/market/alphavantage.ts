export async function fetchAlphaVantage(symbol: string) {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return null;
    
    // Format symbol for Alpha Vantage
    let formattedSymbol = symbol;
    if (symbol.endsWith('.TW')) {
      formattedSymbol = symbol.replace('.TW', '.TW');
    } else if (symbol.endsWith('.HK')) {
      formattedSymbol = symbol.replace('.HK', '.HK');
    }
    
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${formattedSymbol}&outputsize=compact&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data["Error Message"] || !data["Time Series (Daily)"]) {
      console.log(`Alpha Vantage: No data for ${symbol}`);
      return null;
    }
    
    const series = data["Time Series (Daily)"];
    return Object.keys(series).map((date) => ({
      date,
      close: parseFloat(series[date]["4. close"]),
      volume: parseFloat(series[date]["5. volume"]),
    }));
  } catch (err) {
    console.error("AlphaVantage Error:", err);
    return null;
  }
}
