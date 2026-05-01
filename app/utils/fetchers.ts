import yahooFinance from 'yahoo-finance2';
import { TechData } from '../types';

/**
 * 計算 RSI (Relative Strength Index)
 * @param prices 最近的價格陣列
 * @param period 計算週期，預設為 14
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length <= period) return 50; // 數據不足時顯示中性
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

// 統一的數據抓取器
export async function fetchYahooData(symbol: string, market: 'HK' | 'TW' | 'US'): Promise<TechData> {
  try {
    // 1. 處理代號格式
    let formattedSymbol = symbol.trim().toUpperCase();
    if (market === 'HK' && !formattedSymbol.includes('.')) formattedSymbol = `${formattedSymbol}.HK`;
    if (market === 'TW' && !formattedSymbol.includes('.')) formattedSymbol = `${formattedSymbol}.TW`;

    // 2. 同時並行抓取報價與歷史數據 (提高速度)
    const [quote, historyData] = await Promise.all([
      yahooFinance.quote(formattedSymbol),
      yahooFinance.chart(formattedSymbol, { period1: '2026-01-01' }) // 抓取今年以來的數據
    ]);

    // 3. 計算技術指標
    const prices = historyData.quotes.map(q => q.close).filter(p => p !== null) as number[];
    const currentRSI = calculateRSI(prices.slice(-15)); // 計算最後 14 天的 RSI

    return {
      price: quote.regularMarketPrice?.toString() || "0",
      rsi: currentRSI.toString(),
      macd: "0",
      ma50: "0",
      prevClose: quote.regularMarketPreviousClose?.toString() || "0",
      volume: quote.regularMarketVolume?.toString() || "0",
      currency: quote.currency || "HKD",
      fullName: quote.longName || symbol,
      history: historyData.quotes.map(q => ({ 
        date: q.date.toISOString().split('T')[0], 
        price: q.close || 0 
      }))
    };
  } catch (e) {
    console.error("Yahoo 數據獲取失敗:", e);
    // 回傳預設結構，防止前端崩潰
    return { 
      price: "0", rsi: "50", macd: "0", ma50: "0", 
      prevClose: "0", volume: "0", currency: "N/A", 
      fullName: symbol, history: [] 
    };
  }
}

// 為了兼容性，保留此函數但強制導向 Yahoo 邏輯
export async function fetchHKStockData(symbol: string): Promise<TechData> {
  return await fetchYahooData(symbol, 'HK');
}