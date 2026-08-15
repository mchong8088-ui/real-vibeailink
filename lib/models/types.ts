// Core data types for the AI Financial Analyst Engine

export interface HistoricalData {
  date: string;
  close: number;
  volume: number;
  high?: number;
  low?: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  historical: HistoricalData[];
}

export interface TechnicalIndicators {
  rsi: number | null;
  rsiStatus: 'Overbought' | 'Oversold' | 'Neutral';
  macd: {
    value: number | null;
    signal: number | null;
    histogram: number | null;
    status: 'Bullish' | 'Bearish' | 'Neutral';
  };
  sma: {
    short: number | null;
    long: number | null;
  };
  trend: 'Uptrend' | 'Downtrend' | 'Sideways';
}

export interface Fundamentals {
  marketCap: string;
  peRatio: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
  debtRatio: number | null;
}

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url?: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

export interface SentimentResult {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

// Combined data for prompt builder
export interface PromptData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  technical: TechnicalIndicators;
  fundamentals: Fundamentals;
  news: NewsItem[];
  sentiment: SentimentResult;
  userQuestion?: string;
  language: 'EN' | 'ZH' | 'HK';
}

// AI Analysis Result
export interface AnalysisResult {
  success: boolean;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  rsi: number | null;
  macd: string;
  sma20: number | null;
  sma50: number | null;
  trend: string;
  summary: string;
  text: string;
}
