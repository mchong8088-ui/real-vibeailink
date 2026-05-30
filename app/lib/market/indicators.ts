import { RSI, MACD, SMA } from "technicalindicators";

export function calculateIndicators(closes: number[]) {
  const defaultResult = {
    rsi: { value: null, status: 'Neutral' },
    macd: { value: null, signal: null, histogram: null, status: 'Neutral' },
    sma: { sma20: null, sma50: null },
    trend: 'Sideways' as const,
  };
  
  if (!closes || closes.length < 26) return defaultResult;

  // Calculate RSI
  let rsi = null;
  let rsiStatus = 'Neutral';
  try {
    if (closes.length >= 14) {
      const rsiValues = RSI.calculate({ values: closes, period: 14 });
      rsi = rsiValues && rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;
      if (rsi !== null && rsi !== undefined) {
        if (rsi > 70) rsiStatus = 'Overbought';
        else if (rsi < 30) rsiStatus = 'Oversold';
      }
    }
  } catch (e) {
    console.error('RSI calculation error:', e);
  }

  // Calculate MACD - with required parameters
  let macdValue = null;
  let macdSignal = null;
  let macdHistogram = null;
  let macdStatus = 'Neutral';
  
  try {
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    
    if (macdValues && macdValues.length > 0) {
      const last = macdValues[macdValues.length - 1];
      if (last) {
        macdValue = typeof last.MACD === 'number' ? last.MACD : null;
        macdSignal = typeof last.signal === 'number' ? last.signal : null;
        macdHistogram = typeof last.histogram === 'number' ? last.histogram : null;
        
        if (macdValue !== null && macdSignal !== null) {
          if (macdValue > macdSignal) {
            macdStatus = 'Bullish';
          } else if (macdValue < macdSignal) {
            macdStatus = 'Bearish';
          }
        }
      }
    }
  } catch (e) {
    console.error('MACD calculation error:', e);
  }

  // Calculate SMAs
  let sma20 = null;
  let sma50 = null;
  try {
    if (closes.length >= 20) {
      const sma20Values = SMA.calculate({ values: closes, period: 20 });
      sma20 = sma20Values && sma20Values.length > 0 ? sma20Values[sma20Values.length - 1] : null;
    }
    if (closes.length >= 50) {
      const sma50Values = SMA.calculate({ values: closes, period: 50 });
      sma50 = sma50Values && sma50Values.length > 0 ? sma50Values[sma50Values.length - 1] : null;
    }
  } catch (e) {
    console.error('SMA calculation error:', e);
  }

  // Determine trend
  let trend: 'Uptrend' | 'Downtrend' | 'Sideways' = 'Sideways';
  const lastPrice = closes[closes.length - 1];
  if (sma20 !== null && sma50 !== null && lastPrice !== null) {
    if (lastPrice > sma20 && sma20 > sma50) {
      trend = 'Uptrend';
    } else if (lastPrice < sma20 && sma20 < sma50) {
      trend = 'Downtrend';
    }
  }

  return {
    rsi: { value: rsi, status: rsiStatus },
    macd: { value: macdValue, signal: macdSignal, histogram: macdHistogram, status: macdStatus },
    sma: { sma20, sma50 },
    trend,
  };
}
