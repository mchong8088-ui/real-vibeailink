// AI Prompt Builder - Structures prompts for consistent AI analysis

export interface AnalysisData {
  symbol: string;
  price: number | null;
  rsi: number | null;
  macdStatus: string;
  sma20: number | null;
  sma50: number | null;
  volume: number | null;
}

export function buildAnalysisPrompt(data: AnalysisData, userQuestion?: string): string {
  const hasUserQuestion = userQuestion && userQuestion.trim().length > 0;
  
  let prompt = `You are a professional financial analyst. Analyze the following stock data:

Stock Symbol: ${data.symbol}
Current Price: ${data.price || 'N/A'}
RSI(14): ${data.rsi !== null ? data.rsi.toFixed(2) : 'N/A'}${data.rsi !== null ? (data.rsi > 70 ? ' (Overbought)' : data.rsi < 30 ? ' (Oversold)' : ' (Neutral)') : ''}
MACD Signal: ${data.macdStatus || 'N/A'}
20-day SMA: ${data.sma20 !== null ? data.sma20.toFixed(2) : 'N/A'}
50-day SMA: ${data.sma50 !== null ? data.sma50.toFixed(2) : 'N/A'}
Volume: ${data.volume !== null ? data.volume.toLocaleString() : 'N/A'}

${hasUserQuestion ? `User Question: ${userQuestion}` : 'Provide a general analysis.'}

Based on the data above, provide:
1. Market Summary - overall assessment
2. Bull Case - reasons to be positive
3. Bear Case - risks and concerns
4. Technical Outlook - what indicators suggest
5. Final Recommendation - Buy/Sell/Hold with reasoning

Keep response concise but professional.`;
  
  return prompt;
}
