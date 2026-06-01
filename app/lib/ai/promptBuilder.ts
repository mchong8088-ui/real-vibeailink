// AI Prompt Builder - Generates prompts for any stock analysis

export function buildAnalysisPrompt(
  symbol: string,
  companyName: string,
  price: number,
  changePercent: number,
  rsi: number | null,
  macdStatus: string,
  sma20: number | null,
  sma50: number | null,
  urlContent: string | null,
  fileContent: string | null,
  language: string
): string {
  const isChinese = language === 'Cantonese' || language === '简体中文';
  const rsiText = rsi ? rsi.toFixed(1) : 'N/A';
  const rsiStatus = rsi ? (rsi > 70 ? '超買' : rsi < 30 ? '超賣' : '中性') : '未知';
  
  let contentSection = '';
  if (urlContent) {
    contentSection = `
【用戶提供的新聞/文章內容】
${urlContent.substring(0, 1500)}

請分析以上內容對${symbol} (${companyName})股價的影響。`;
  } else if (fileContent) {
    contentSection = `
【用戶上傳的文件內容】
${fileContent.substring(0, 1500)}

請分析以上文件內容對${symbol} (${companyName})股價的影響。`;
  }

  const prompt = `你是一位專業的金融分析師。請對${symbol} (${companyName})進行專業的股票分析。

【當前市場數據】
股價: $${price.toFixed(2)}
日漲跌幅: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%
RSI(14): ${rsiText} (${rsiStatus}區間)
MACD: ${macdStatus}
20日均線: $${sma20?.toFixed(2) || 'N/A'}
50日均線: $${sma50?.toFixed(2) || 'N/A'}

${contentSection}

請按照以下8個部分輸出分析（使用繁體中文）:

1. 技術分析: 解讀RSI、MACD、均線系統，說明當前技術面狀況

2. 基本面分析: ${urlContent || fileContent ? '結合用戶提供的資料，分析公司基本面' : '分析公司基本面和估值'}

3. 用戶提供資料分析: ${urlContent || fileContent ? '摘要用戶提供的內容，並給出AI的獨立判斷，說明這份資料對股價的影響程度(高/中/低)' : '無用戶提供資料'}

4. 市場氣氛判斷: Risk-On / Risk-Off / Neutral

5. 看好因素: 列出2-3個支撐股價的理由

6. 看淡因素: 列出2-3個壓制股價的風險

7. 買賣建議: 給出具體的買入區間、目標價和止蝕位

8. AI信心評分: 0-100%

請用專業、客觀的語氣回答。`;
  
  return prompt;
}
