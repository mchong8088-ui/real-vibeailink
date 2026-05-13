// app/lib/market/indicators.ts
import { RSI, MACD, SMA } from "technicalindicators";

export interface IndicatorResult {
  rsi: number | null;
  rsiStatus: string;
  macd: {
    value: number | null;
    signal: number | null;
    histogram: number | null;
    status: string;
  };
  sma: {
    short: number | null;
    long: number | null;
  };
}

export function calculateIndicators(closes: number[]): IndicatorResult {
  if (!closes || closes.length < 26) {
    return {
      rsi: null,
      rsiStatus: "Neutral",
      macd: { value: null, signal: null, histogram: null, status: "Neutral" },
      sma: { short: null, long: null },
    };
  }

  // Calculate RSI (14 period)
  let rsiValue: number | null = null;
  let rsiStatus = "Neutral";
  try {
    const rsiResult = RSI.calculate({ values: closes, period: 14 });
    rsiValue = rsiResult.length > 0 ? rsiResult[rsiResult.length - 1] : null;
    if (rsiValue !== null) {
      if (rsiValue > 70) rsiStatus = "Overbought";
      else if (rsiValue < 30) rsiStatus = "Oversold";
    }
  } catch (e) {
    console.error("RSI calculation error:", e);
  }

  // Calculate MACD
  let macdValue = null;
  let macdSignal = null;
  let macdHistogram = null;
  let macdStatus = "Neutral";
  try {
    const macdResult = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    if (macdResult.length > 0) {
      const last = macdResult[macdResult.length - 1];
      macdValue = last.MACD;
      macdSignal = last.signal;
      macdHistogram = last.histogram;
      if (macdValue !== null && macdSignal !== null) {
        macdStatus = macdValue > macdSignal ? "Bullish" : macdValue < macdSignal ? "Bearish" : "Neutral";
      }
    }
  } catch (e) {
    console.error("MACD calculation error:", e);
  }

  // Calculate SMA
  let smaShort = null;
  let smaLong = null;
  try {
    if (closes.length >= 20) {
      const sma20 = SMA.calculate({ values: closes, period: 20 });
      smaShort = sma20.length > 0 ? sma20[sma20.length - 1] : null;
    }
    if (closes.length >= 50) {
      const sma50 = SMA.calculate({ values: closes, period: 50 });
      smaLong = sma50.length > 0 ? sma50[sma50.length - 1] : null;
    }
  } catch (e) {
    console.error("SMA calculation error:", e);
  }

  return {
    rsi: rsiValue,
    rsiStatus,
    macd: {
      value: macdValue,
      signal: macdSignal,
      histogram: macdHistogram,
      status: macdStatus,
    },
    sma: { short: smaShort, long: smaLong },
  };
}

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