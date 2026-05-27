import { NextResponse } from 'next/server';
import { findStock } from '@/app/data/stocks';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language } = body;
    
    const userQuery = message || '';
    console.log(`📝 Query: "${userQuery}"`);
    
    // Find the stock - this now handles direct symbols like "1928.HK"
    const stockInfo = findStock(userQuery);
    const stockSymbol = stockInfo?.symbol || '';
    const stockName = stockInfo?.en || '';
    const stockCn = stockInfo?.cn || '';
    
    console.log(`📊 Found stock: ${stockSymbol} (${stockName})`);
    
    const isCantonese = language === 'Cantonese';
    const isChinese = language === '简体中文';
    
    // If stock found, provide analysis
    if (stockInfo) {
      let analysis = '';
      
      if (isCantonese) {
        analysis = `## 📊 ${stockCn} (${stockSymbol}) 投資分析

### 📈 基本資料
- **公司名稱**: ${stockName}
- **行業**: ${stockInfo.segment}
- **市場**: ${stockInfo.market === 'HK' ? '香港' : stockInfo.market === 'TW' ? '台灣' : '美國'}

### 🔬 技術分析
由於即時股價數據需要連接金融數據API，建議您：
1. 使用股票交易軟件查看即時圖表
2. 關注關鍵技術指標：50日/200日移動平均線、RSI、MACD
3. 留意成交量和支撐/阻力位

### 📰 分析建議
要獲取完整嘅技術和基本面分析，請提供更具體嘅問題，例如：
- "${stockCn}嘅前景如何？"
- "應唔應該買入${stockCn}？"
- "${stockCn}嘅合理目標價係幾多？"

*⚠️ 以上分析僅供參考，不構成投資建議。建議諮詢專業財務顧問。*`;
      } else {
        analysis = `## 📊 ${stockName} (${stockSymbol}) Investment Analysis

### 📈 Basic Information
- **Company**: ${stockName}
- **Sector**: ${stockInfo.segment}
- **Market**: ${stockInfo.market === 'HK' ? 'Hong Kong' : stockInfo.market === 'TW' ? 'Taiwan' : 'US'}

### 🔬 Technical Analysis
For real-time price data and technical analysis, please:
1. Use your trading platform for live charts
2. Monitor key indicators: 50/200 MA, RSI, MACD
3. Watch volume and support/resistance levels

### 📰 Analysis Request
For detailed fundamental and technical analysis, please ask specific questions like:
- "What is the outlook for ${stockName}?"
- "Should I buy ${stockName}?"
- "What is the fair value target for ${stockName}?"

*⚠️ This analysis is for reference only. Please consult a financial advisor.*`;
      }
      
      return NextResponse.json({ 
        success: true, 
        symbol: stockSymbol, 
        summary: analysis,
        price: "N/A",
        rsi: "N/A",
        macd: "N/A"
      });
    }
    
    // Default response for unknown stocks
    const defaultAnalysis = `## 📊 Stock Not Found

I couldn't identify the stock "${userQuery}".

**Please try with**:
- **HK stocks**: 1928.HK, 0700.HK, 1211.HK, 9988.HK, 0388.HK
- **US stocks**: TSLA, NVDA, AAPL, AMZN, MSFT
- **TW stocks**: 2330.TW, 2454.TW, 2317.TW
- **Company names**: 金沙中國, 騰訊, 台積電, 特斯拉

**Examples**:
- "1928.HK"
- "分析 金沙中國"
- "Should I buy TSLA?"
- "Tell me about 0700.HK"`;
    
    return NextResponse.json({ 
      success: true, 
      symbol: "N/A", 
      summary: defaultAnalysis 
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      success: false, 
      summary: "Analysis temporarily unavailable. Please try again." 
    });
  }
}
