export async function technicalAgent(
  stockData: any
) {

  let trend = "Neutral";

  if (
    stockData.macdStatus === "Bullish" &&
    stockData.rsi > 55
  ) {

    trend = "Bullish";
  }

  if (
    stockData.macdStatus === "Bearish" &&
    stockData.rsi < 45
  ) {

    trend = "Bearish";
  }

  return {

    trend,

    rsi: stockData.rsi,

    macd: stockData.macdStatus,

    confidence:
      Math.round(stockData.rsi)
  };
}