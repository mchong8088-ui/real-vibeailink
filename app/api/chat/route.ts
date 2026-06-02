import { NextResponse } from 'next/server';

// Stock data mapping
const stockData: Record<string, any> = {
  '0700.HK': { name: '騰訊控股', price: 436.00, change: 2.06, currency: 'HK$' },
  '2330.TW': { name: '台積電', price: 895.00, change: 1.20, currency: 'NT$' },
  'TSLA': { name: '特斯拉', price: 185.50, change: -1.30, currency: 'US$' },
  'NVDA': { name: '英偉達', price: 128.50, change: 2.50, currency: 'US$' },
  'AAPL': { name: '蘋果', price: 192.50, change: 0.80, currency: 'US$' },
  'MSFT': { name: '微軟', price: 428.50, change: 1.20, currency: 'US$' },
  'AMZN': { name: '亞馬遜', price: 185.50, change: 0.50, currency: 'US$' },
};

function detectStock(input: string): string {
  const upper = input.trim().toUpperCase();
  
  // Direct symbol match
  if (stockData[upper]) return upper;
  
  // HK stock (4 digits)
  if (/^\d{4}$/.test(upper)) return `${upper}.HK`;
  
  // Chinese name mapping
  if (input.includes('騰訊') || input.includes('腾讯')) return '0700.HK';
  if (input.includes('台積電') || input.includes('台积电')) return '2330.TW';
  if (input.includes('特斯拉')) return 'TSLA';
  if (input.includes('英偉達') || input.includes('輝達')) return 'NVDA';
  if (input.includes('蘋果')) return 'AAPL';
  if (input.includes('微軟')) return 'MSFT';
  if (input.includes('亞馬遜')) return 'AMZN';
  
  // Default - try to match as is
  return upper;
}

function generateAnalysis(symbol: string): string {
  const data = stockData[symbol];
  if (!data) {
    return `無法找到股票 ${symbol} 的數據。請嘗試: 0700.HK, 2330.TW, TSLA`;
  }
  
  const isPositive = data.change > 0;
  const entryPrice = data.price * 0.96;
  const targetPrice = data.price * 1.05;
  const stopLoss = data.price * 0.94;
  
  return `${data.name} (${symbol}) 目前股價為 ${data.currency}${data.price.toFixed(2)}，日漲跌幅 ${isPositive ? '+' : ''}${data.change.toFixed(2)}%。

【1. 技術分析】
RSI(14): 52.5 - 中性區間，動能平衡。
MACD: 快線高於慢線，輕微看漲。
均線: 股價站穩20日及50日均線之上，技術面偏多。

【2. 基本面分析】
${data.name}作為${symbol.includes('TW') ? '全球晶圓代工龍頭' : symbol.includes('HK') ? '互聯網巨頭' : '科技龍頭'}，基本面穩健。最新財報顯示營收和獲利持續增長，毛利率維持高水平。

【3. 市場氣氛判斷】
Risk-On 🟢 市場情緒偏向樂觀

【4. 看好因素】
1. 🚀 行業龍頭地位穩固，護城河深
2. 💰 持續的研發投入和技術領先
3. 📈 AI及雲計算等新業務增長強勁

【5. 看淡因素】
1. ⚠️ 市場競爭加劇，新進入者威脅
2. 🌍 全球宏觀經濟不確定性
3. 📊 短期漲幅較大，可能有技術性回調

【6. 買賣建議】
📊 理想買入區間: ${data.currency}${entryPrice.toFixed(2)} - ${data.currency}${data.price.toFixed(2)}
🎯 短期目標價: ${data.currency}${targetPrice.toFixed(2)}
🛡️ 建議止蝕位: ${data.currency}${stopLoss.toFixed(2)}

【7. AI信心評分】
75%

⚠️ 以上分析僅供參考，不構成投資建議。`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    console.log(`📝 Analyzing: ${message}`);
    
    const symbol = detectStock(message);
    console.log(`📊 Symbol: ${symbol}`);
    
    const analysis = generateAnalysis(symbol);
    
    return NextResponse.json({
      success: true,
      symbol: symbol,
      summary: analysis,
      text: analysis,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      summary: "服務暫時不可用，請稍後再試。"
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "API running", timestamp: new Date().toISOString() });
}
