import { RSI, MACD, SMA } from "technicalindicators";

export interface RSIResult {
  value: number | null;
  status: 'Overbought' | 'Oversold' | 'Neutral';
}

export interface MACDResult {
  value: number | null;
  signal: number | null;
  histogram: number | null;
  status: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface SMAResult {
  sma20: number | null;
  sma50: number | null;
}

export interface IndicatorResult {
  rsi: RSIResult;
  macd: MACDResult;
  sma: SMAResult;
  trend: 'Uptrend' | 'Downtrend' | 'Sideways';
}

// Calculate RSI (14-period)
export function calculateRSI(closes: number[]): RSIResult {
  if (!closes || closes.length < 14) {
    return { value: null, status: 'Neutral' };
  }
  
  try {
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    const value = rsiValues[rsiValues.length - 1] || null;
    
    let status: 'Overbought' | 'Oversold' | 'Neutral' = 'Neutral';
    if (value !== null) {
      if (value > 70) status = 'Overbought';
      else if (value < 30) status = 'Oversold';
    }
    
    return { value, status };
  } catch (error) {
    console.error("RSI calculation error:", error);
    return { value: null, status: 'Neutral' };
  }
}

// Calculate MACD (12, 26, 9)
export function calculateMACD(closes: number[]): MACDResult {
  if (!closes || closes.length < 26) {
    return { value: null, signal: null, histogram: null, status: 'Neutral' };
  }
  
  try {
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    
    const last = macdValues[macdValues.length - 1];
    if (!last) {
      return { value: null, signal: null, histogram: null, status: 'Neutral' };
    }
    
    const value = latestMacd?.MACD;
    const signal = latestMacd?.signal;
    const histogram = last.histogram;
    
    let status: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

let status: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

if (typeof value === "number" && typeof signal === "number") {
  if (value > signal) status = "Bullish";
  else if (value < signal) status = "Bearish";
}
    
    return { value, signal, histogram, status };
  } catch (error) {
    console.error("MACD calculation error:", error);
    return { value: null, signal: null, histogram: null, status: 'Neutral' };
  }
}

// Calculate SMA (20 and 50 period)
export function calculateSMA(closes: number[]): SMAResult {
  if (!closes || closes.length < 20) {
    return { sma20: null, sma50: null };
  }
  
  try {
    let sma20: number | null = null;
    let sma50: number | null = null;
    
    if (closes.length >= 20) {
      const sma20Values = SMA.calculate({ values: closes, period: 20 });
      sma20 = sma20Values[sma20Values.length - 1] || null;
    }
    
    if (closes.length >= 50) {
      const sma50Values = SMA.calculate({ values: closes, period: 50 });
      sma50 = sma50Values[sma50Values.length - 1] || null;
    }
    
    return { sma20, sma50 };
  } catch (error) {
    console.error("SMA calculation error:", error);
    return { sma20: null, sma50: null };
  }
}

// Calculate trend based on SMA and price
export function calculateTrend(closes: number[], sma20: number | null, sma50: number | null): 'Uptrend' | 'Downtrend' | 'Sideways' {
  if (!closes.length || sma20 === null || sma50 === null) {
    return 'Sideways';
  }
  
  const lastPrice = closes[closes.length - 1];
  
  if (lastPrice > sma20 && sma20 > sma50) {
    return 'Uptrend';
  } else if (lastPrice < sma20 && sma20 < sma50) {
    return 'Downtrend';
  }
  
  return 'Sideways';
}

// Main function that returns all indicators
export function calculateIndicators(closes: number[]): IndicatorResult {
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const sma = calculateSMA(closes);
  const trend = calculateTrend(closes, sma.sma20, sma.sma50);
  
  return {
    rsi,
    macd,
    sma,
    trend,
  };
}

// Legacy exports for compatibility with existing code
export function getMACDSignal(macdValue: number | null, macdSignal: number | null): string {
  if (macdValue === null || macdSignal === null) return "Neutral";
  if (macdValue > macdSignal) return "Bullish";
  if (macdValue < macdSignal) return "Bearish";
  return "Neutral";
}

export function getRSIStatus(rsiValue: number | null): string {
  if (rsiValue === null) return "Neutral";
  if (rsiValue > 70) return "Overbought";
  if (rsiValue < 30) return "Oversold";
  return "Neutral";
}
