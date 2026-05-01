// app/types.ts
export interface TechData {
  price: string;
  rsi: string;
  macd: string;
  ma50: string;
  prevClose: string;
  volume: string;
  currency: string;
  fullName: string;
  history: { date: string; price: number }[];
}

export interface AnalysisResponse {
  summary: string;
  technicalCard: TechData;
  symbol: string;
  fullName: string;
  // 建議新增結構化欄位，讓 AI 回傳更清晰
  bullReasons?: string[];
  bearReasons?: string[];
  tradingStrategy?: string;
}