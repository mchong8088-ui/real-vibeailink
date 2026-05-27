import { fetchYahooFinance } from './yahooFinance';
import { fetchAlphaVantage } from './alphavantage';
import { fetchTwelveData } from './twelvedata';
import { fetchFinnhub } from './finnhub';

export async function fetchStockData(symbol: string) {
  console.log(`Fetching data for ${symbol}`);
  
  let stockData = null;
  
  // For HK and TW stocks, try Yahoo Finance first (best coverage)
  if (symbol.endsWith('.HK') || symbol.endsWith('.TW')) {
    console.log(`Using Yahoo Finance for ${symbol} (HK/TW stock)`);
    stockData = await fetchYahooFinance(symbol);
    
    if (stockData) {
      console.log(`✅ Yahoo Finance success for ${symbol}`);
      return stockData;
    }
    
    console.log(`Yahoo Finance failed for ${symbol}, trying other sources...`);
  }
  
  // Try Alpha Vantage
  console.log(`Trying Alpha Vantage for ${symbol}`);
  const alphaData = await fetchAlphaVantage(symbol);
  if (alphaData && alphaData.length > 0) {
    console.log(`✅ Alpha Vantage success for ${symbol}`);
    return {
      symbol,
      historical: alphaData,
      price: alphaData[0].close,
      volume: alphaData[0].volume,
    };
  }
  
  // Try TwelveData
  console.log(`Trying TwelveData for ${symbol}`);
  const twelveData = await fetchTwelveData(symbol);
  if (twelveData && twelveData.length > 0) {
    console.log(`✅ TwelveData success for ${symbol}`);
    return {
      symbol,
      historical: twelveData,
      price: twelveData[0].close,
      volume: twelveData[0].volume,
    };
  }
  
  // Try Finnhub
  console.log(`Trying Finnhub for ${symbol}`);
  const finnhubData = await fetchFinnhub(symbol);
  if (finnhubData && finnhubData.length > 0) {
    console.log(`✅ Finnhub success for ${symbol}`);
    return {
      symbol,
      historical: finnhubData,
      price: finnhubData[0].close,
      volume: finnhubData[0].volume,
    };
  }
  
  console.log(`❌ All data sources failed for ${symbol}`);
  return null;
}
