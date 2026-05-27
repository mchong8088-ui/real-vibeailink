import { NextResponse } from 'next/server';
import { detectMarket, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';

// Generate analysis based on stock symbol and market
const generateAnalysis = (symbol: string, market: string, language: string, query: string) => {
  const isCantonese = language === 'Cantonese';
  const isChinese = language === '简体中文';
  
  // Extract base symbol without suffix
  const baseSymbol = symbol.replace(/\.(HK|TW)$/, '');
  
  // Market-specific analysis templates
  if (symbol.endsWith('.HK')) {
    if (isCantonese) {
      return `## 📊 ${symbol} 港股分析

### 📈 基本資料
- **股票代號**: ${symbol}
- **市場**: 香港交易所 (HKEX)
- **類別**: 港股

### 🔬 技術分析要點
- **支持位**: 請查看即時圖表確認
- **阻力位**: 請查看即時圖表確認
- **50天移動平均線**: 請查看即時數據
- **RSI(14)**: 需要即時數據

### 💰 分析建議
要獲取完整嘅技術同基本面分析，建議：
1. 使用股票交易軟件查看即時圖表
2. 關注公司業績公告同行業新聞
3. 留意大市走勢同資金流向

### 📝 總結
${symbol} 係港股，如需詳細分析，請提供更具體嘅問題。

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
    } else if (isChinese) {
      return `## 📊 ${symbol} 港股分析

### 📈 基本资料
- **股票代号**: ${symbol}
- **市场**: 香港交易所 (HKEX)
- **类别**: 港股

### 🔬 技术分析要点
- **支持位**: 请查看即时图表确认
- **阻力位**: 请查看即时图表确认
- **50天移动平均线**: 需要实时数据
- **RSI(14)**: 需要实时数据

### 💰 分析建议
要获取完整的技术和基本面分析，建议：
1. 使用股票交易软件查看实时图表
2. 关注公司业绩公告和行业新闻
3. 留意大市走势和资金流向

*⚠️ 以上分析仅供参考，不构成投资建议。*`;
    } else {
      return `## 📊 ${symbol} Hong Kong Stock Analysis

### 📈 Basic Information
- **Symbol**: ${symbol}
- **Market**: Hong Kong Exchange (HKEX)
- **Type**: Hong Kong Stock

### 🔬 Technical Analysis Notes
- **Support Levels**: Check real-time charts
- **Resistance Levels**: Check real-time charts
- **50-day MA**: Requires real-time data
- **RSI(14)**: Requires real-time data

### 📝 Summary
${symbol} is a Hong Kong stock. For detailed analysis, please specify your question.

*⚠️ This analysis is for reference only. Not investment advice.*`;
    }
  }
  
  if (symbol.endsWith('.TW')) {
    if (isCantonese) {
      return `## 📊 ${symbol} 台股分析

### 📈 基本資料
- **股票代號**: ${symbol}
- **市場**: 台灣證券交易所 (TWSE)
- **類別**: 台股

### 🔬 分析建議
${symbol} 係台灣股票。如需詳細分析，請提供更具體嘅問題，例如：
- "${symbol} 嘅前景如何？"
- "應唔應該買入 ${symbol}？"

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
    } else {
      return `## 📊 ${symbol} Taiwan Stock Analysis

### 📈 Basic Information
- **Symbol**: ${symbol}
- **Market**: Taiwan Stock Exchange (TWSE)
- **Type**: Taiwan Stock

### 📝 Summary
${symbol} is a Taiwan stock. For detailed analysis, please specify your question.

*⚠️ This analysis is for reference only.*`;
    }
  }
  
  // US Stocks
  if (isCantonese) {
    return `## 📊 ${symbol} 美股分析

### 📈 基本資料
- **股票代號**: ${symbol}
- **市場**: 美國股市 (NYSE/NASDAQ)

### 🔬 分析建議
要獲取 ${symbol} 嘅詳細分析，請提出更具體嘅問題：
- "${symbol} 嘅前景如何？"
- "應唔應該買入 ${symbol}？"
- "${symbol} 嘅合理目標價係幾多？"

### 📝 總結
美股 ${symbol} 嘅詳細分析需要結合即時數據。請提出具體問題，我會為你提供更詳盡嘅分析。

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
  } else if (isChinese) {
    return `## 📊 ${symbol} 美股分析

### 📈 基本资料
- **股票代号**: ${symbol}
- **市场**: 美国股市 (NYSE/NASDAQ)

### 📝 总结
美股 ${symbol} 的详细分析需要结合实时数据。请提出具体问题，我会为你提供更详尽的分析。

*⚠️ 以上分析仅供参考，不构成投资建议。*`;
  } else {
    return `## 📊 ${symbol} Stock Analysis

### 📈 Basic Information
- **Symbol**: ${symbol}
- **Market**: US Stock Market (NYSE/NASDAQ)

### 📝 Summary
For detailed analysis of ${symbol}, please ask specific questions like:
- "What is the outlook for ${symbol}?"
- "Should I buy ${symbol}?"
- "What is the fair value target for ${symbol}?"

*⚠️ This analysis is for reference only. Not investment advice.*`;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language } = body;
    
    const userQuery = message || '';
    console.log(`🔍 Analyzing: ${userQuery}`);
    
    // Detect stock symbol from the query
    let stockSymbol = '';
    let market = 'US';
    
    if (userQuery) {
      const detection = detectMarket(userQuery);
      stockSymbol = detection.symbol;
      market = detection.market;
      console.log(`📊 Detected symbol: ${stockSymbol} (${market})`);
    }
    
    if (!stockSymbol && userQuery) {
      return NextResponse.json({
        success: true,
        symbol: "N/A",
        summary: `## Please enter a stock symbol

I couldn't identify a stock symbol in your request.

**Please try:**
- Direct stock symbol: TSLA, 0700.HK, 2330.TW, 0001.HK
- Company name: 特斯拉, 台積電, Tencent

**Example:** "Should I buy TSLA?" or "分析 0700.HK"`
      });
    }
    
    // Generate analysis based on the detected symbol
    const analysis = generateAnalysis(stockSymbol, market, language, userQuery);
    
    return NextResponse.json({
      success: true,
      symbol: stockSymbol,
      price: "N/A",
      rsi: "N/A",
      macd: "N/A",
      marketCap: "N/A",
      peRatio: "N/A",
      volume: "N/A",
      historical: [],
      summary: analysis,
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        symbol: "N/A",
        summary: `## Service Temporarily Unavailable

Analysis service is currently unavailable. Please try again in a moment.

If the problem persists, please contact support.`
      },
      { status: 200 }
    );
  }
}
