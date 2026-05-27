// app/api/chat/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import {
  calculateIndicators,
  getMACDSignal,
  getRSIStatus
} from "../../lib/market/indicators";

import {
  extractStockSymbol
} from "../../lib/market/symbolParser";

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || ""
  );



// =====================================
// PROVIDER SYMBOL FORMAT
// =====================================

function formatSymbol(
  symbol: string,
  provider: string
) {

  // HK

  if (
    symbol.endsWith(".HK")
  ) {

    const code =
      symbol.replace(".HK", "");

    if (
      provider ===
      "twelvedata"
    ) {

      return `${parseInt(code)}.HK`;
    }

    return symbol;
  }



  // TW

  if (
    symbol.endsWith(".TW")
  ) {

    return symbol;
  }



  // US

  return symbol;
}



// =====================================
// ALPHA VANTAGE
// =====================================

async function fetchAlphaVantage(
  symbol: string
) {

  try {

    const apiKey =
      process.env
        .ALPHA_VANTAGE_API_KEY;

    const finalSymbol =
      formatSymbol(
        symbol,
        "alphavantage"
      );



    const url =
`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${finalSymbol}&outputsize=compact&apikey=${apiKey}`;



    const res =
      await fetch(url);

    const data =
      await res.json();



    console.log(
      "AlphaVantage:",
      data
    );



    const series =
      data["Time Series (Daily)"];



    if (!series)
      return null;



    return Object.keys(series)
      .map((date) => ({

        date,

        close:
          parseFloat(
            series[date]["4. close"]
          ),

        volume:
          parseFloat(
            series[date]["5. volume"]
          )
      }));

  } catch (err) {

    console.error(
      "AlphaVantage Error:",
      err
    );

    return null;
  }
}



// =====================================
// TWELVEDATA
// =====================================

async function fetchTwelveData(
  symbol: string
) {

  try {

    const apiKey =
      process.env
        .TWELVEDATA_API_KEY;

    const finalSymbol =
      formatSymbol(
        symbol,
        "twelvedata"
      );



    const url =
`https://api.twelvedata.com/time_series?symbol=${finalSymbol}&interval=1day&outputsize=60&apikey=${apiKey}`;



    const res =
      await fetch(url);

    const data =
      await res.json();



    console.log(
      "TwelveData:",
      data
    );



    if (!data.values)
      return null;



    return data.values.map(
      (v: any) => ({

        date:
          v.datetime,

        close:
          parseFloat(v.close),

        volume:
          parseFloat(
            v.volume || 0
          )
      })
    );

  } catch (err) {

    console.error(
      "TwelveData Error:",
      err
    );

    return null;
  }
}



// =====================================
// FINNHUB
// =====================================

async function fetchFinnhub(
  symbol: string
) {

  try {

    const apiKey =
      process.env
        .FINNHUB_API_KEY;

    const finalSymbol =
      formatSymbol(
        symbol,
        "finnhub"
      );



    const to =
      Math.floor(
        Date.now() / 1000
      );

    const from =
      to - (
        60 * 60 * 24 * 90
      );



    const url =
`https://finnhub.io/api/v1/stock/candle?symbol=${finalSymbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;



    const res =
      await fetch(url);

    const data =
      await res.json();



    console.log(
      "Finnhub:",
      data
    );



    if (
      !data.c ||
      data.s !== "ok"
    ) {

      return null;
    }



    return data.c.map(
      (
        close: number,
        i: number
      ) => ({

        date:
          new Date(
            data.t[i] * 1000
          )
          .toISOString(),

        close,

        volume:
          data.v[i]
      })
    );

  } catch (err) {

    console.error(
      "Finnhub Error:",
      err
    );

    return null;
  }
}



// =====================================
// MASTER FETCH
// =====================================

async function fetchStockData(
  symbol: string
) {

  let historical =
    await fetchAlphaVantage(
      symbol
    );



  if (!historical) {

    console.log(
      "Alpha failed → TwelveData"
    );

    historical =
      await fetchTwelveData(
        symbol
      );
  }



  if (!historical) {

    console.log(
      "TwelveData failed → Finnhub"
    );

    historical =
      await fetchFinnhub(
        symbol
      );
  }



  if (
    !historical ||
    historical.length === 0
  ) {

    return null;
  }



  const closes =
    historical
      .map((h) => h.close)
      .reverse();



  const latest =
    historical[0];



  const indicators =
    calculateIndicators(
      closes
    );



  return {

    symbol,

    historical,

    price:
      latest.close,

    volume:
      latest.volume,

    rsi:
      indicators.rsi,

    macdStatus:
      getMACDSignal(
        indicators.macd.value,
        indicators.macd.signal
      ),

    sma20:
      indicators.sma.short,

    sma50:
      indicators.sma.long,

    rsiStatus:
      getRSIStatus(
        indicators.rsi
      )
  };
}



// =====================================
// AI ENGINE
// =====================================

async function analyzeWithAI(
  prompt: string
) {

  try {

    const model =
      genAI.getGenerativeModel({

        model:
          "gemini-1.5-flash"
      });

    const result =
      await model.generateContent(
        prompt
      );

    return result
      .response.text();

  } catch {

    const response =
      await fetch(
        "https://api.openai.com/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
`Bearer ${process.env.OPENAI_API_KEY}`
          },

          body: JSON.stringify({

            model:
              "gpt-4o-mini",

            messages: [

              {
                role: "user",
                content: prompt
              }
            ]
          })
        }
      );



    const data =
      await response.json();

    return data.choices[0]
      .message.content;
  }
}



// =====================================
// MAIN API
// =====================================

export async function POST(
  req: Request
) {

  try {

    const {
      message
    } = await req.json();



    const symbol =
      extractStockSymbol(
        message
      );



    console.log(
      "Detected Symbol:",
      symbol
    );



    if (!symbol) {

      return NextResponse.json({

        success: false,

        text:
          "Unable to detect stock symbol."
      });
    }



    const stockData =
      await fetchStockData(
        symbol
      );



    if (!stockData) {

      return NextResponse.json({

        success: false,

        text:
`Live market data unavailable for ${symbol}.`
      });
    }



    const prompt = `

Analyze stock:

${symbol}

Price:
${stockData.price}

RSI:
${stockData.rsi}

MACD:
${stockData.macdStatus}

SMA20:
${stockData.sma20}

SMA50:
${stockData.sma50}

Provide:
1. Market summary
2. Bull case
3. Bear case
4. Risks
5. Recommendation
`;



    const aiText =
      await analyzeWithAI(
        prompt
      );



    return NextResponse.json({

      success: true,

      symbol,

      text:
        aiText,

      summary:
        aiText,

      price:
        stockData.price,

      rsi:
        stockData.rsi,

      macd:
        stockData.macdStatus,

      sma20:
        stockData.sma20,

      sma50:
        stockData.sma50,

      volume:
        stockData.volume,

      historical:
        stockData.historical
    });

  } catch (err) {

    console.error(
      "Route Error:",
      err
    );

    return NextResponse.json({

      success: false,

      text:
        "System temporarily unavailable."
    });
  }
}