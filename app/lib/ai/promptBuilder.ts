export interface AnalysisData {
  symbol: string;
  price: number;
  changePercent: number;
  rsi: number | null;
  macd: string;
  trend: string;
  news: Array<{ title: string; summary: string; source: string }>;
  userQuestion?: string;
  language: string;
}

export function buildAnalysisPrompt(data: AnalysisData): string {
  const isCantonese = data.language === 'Cantonese';
  const isChinese = data.language === '简体中文';
  
  const newsSection = data.news.length > 0 
    ? data.news.map(n => `- [${n.source}] ${n.title}`).join('\n')
    : 'No recent news available for this stock.';
  
  const prompt = isCantonese ? `
你係一位專業嘅金融分析師。請根據以下數據提供詳細嘅股票分析：

股票: ${data.symbol}
股價: $${data.price}
變動: ${data.changePercent > 0 ? '+' : ''}${data.changePercent}%
RSI(14): ${data.rsi ?? 'N/A'}
MACD: ${data.macd}
趨勢: ${data.trend}

近期新聞:
${newsSection}

用戶問題: ${data.userQuestion || '請提供完整嘅股票分析'}

請嚴格按照以下8個部分輸出分析，每個部分都要詳細：

1. 摘要 - 整體評估
2. 技術分析 - RSI、MACD、趨勢解讀
3. 基本面分析 - 估值、增長、競爭優勢
4. 新聞情緒 - 新聞對股價嘅影響
5. 風險分析 - 主要風險因素
6. 看好理由 - 支撐股價嘅因素
7. 看淡理由 - 壓制股價嘅因素
8. 最終建議 - 買入/賣出/持有，連同目標價

請用專業、詳細嘅語氣回答。
` : isChinese ? `
你是一位专业的金融分析师。请根据以下数据提供详细的股票分析：

股票: ${data.symbol}
股价: $${data.price}
变动: ${data.changePercent > 0 ? '+' : ''}${data.changePercent}%
RSI(14): ${data.rsi ?? 'N/A'}
MACD: ${data.macd}
趋势: ${data.trend}

近期新闻:
${newsSection}

用户问题: ${data.userQuestion || '请提供完整的股票分析'}

请严格按照以下8个部分输出分析，每个部分都要详细：

1. 摘要 - 整体评估
2. 技术分析 - RSI、MACD、趋势解读
3. 基本面分析 - 估值、增长、竞争优势
4. 新闻情绪 - 新闻对股价的影响
5. 风险分析 - 主要风险因素
6. 看好理由 - 支撑股价的因素
7. 看淡理由 - 压制股价的因素
8. 最终建议 - 买入/卖出/持有，连同目标价

请用专业、详细的语气回答。
` : `
You are a professional financial analyst. Provide detailed stock analysis based on the following data:

Stock: ${data.symbol}
Price: $${data.price}
Change: ${data.changePercent > 0 ? '+' : ''}${data.changePercent}%
RSI(14): ${data.rsi ?? 'N/A'}
MACD: ${data.macd}
Trend: ${data.trend}

Recent News:
${newsSection}

User Question: ${data.userQuestion || 'Please provide complete stock analysis'}

Provide analysis in exactly 8 sections:

1. SUMMARY - Overall assessment
2. TECHNICAL ANALYSIS - RSI, MACD, trend interpretation
3. FUNDAMENTAL ANALYSIS - Valuation, growth, competitive position
4. NEWS SENTIMENT - How news affects the stock
5. RISK ANALYSIS - Key risk factors
6. BULL CASE - Factors supporting the stock
7. BEAR CASE - Factors压制 the stock
8. FINAL RECOMMENDATION - Buy/Sell/Hold with price target

Be professional, detailed, and data-driven.
`;

  return prompt;
}
