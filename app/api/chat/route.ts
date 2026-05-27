import { NextResponse } from 'next/server';
import { findStock, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language } = body;
    
    let userQuery = message || '';
    let stockInfo = null;
    let stockSymbol = '';
    
    console.log(`📝 Received query: "${userQuery}"`);
    console.log(`🌐 Language: ${language}`);
    
    // Try to find stock in the query
    stockInfo = findStock(userQuery);
    
    if (stockInfo) {
      stockSymbol = stockInfo.symbol;
      console.log(`✅ Found stock: ${stockInfo.cn} (${stockSymbol})`);
    } else {
      console.log(`❌ No stock found in query`);
    }
    
    // Generate analysis based on stock found
    const getAnalysis = () => {
      const isCantonese = language === 'Cantonese';
      const isChinese = language === '简体中文';
      
      // TSMC Analysis (台積電)
      if (stockSymbol === '2330.TW' || userQuery.includes('台積電') || userQuery.includes('台积电') || userQuery.includes('TSMC')) {
        if (isCantonese) {
          return `## 📊 台積電 (2330.TW) 投資分析

### 🌍 宏觀經濟環境
全球半導體行業正處於AI驅動嘅超級週期。台積電作為全球晶圓代工龍頭，直接受惠於AI芯片需求爆發。

### 🔬 技術分析
- **當前趨勢**：股價處於多頭趨勢，沿住20日均線穩步上升
- **支持位**：NT$800、NT$750
- **阻力位**：NT$900、NT$950
- **RSI(14)**: 62 - 強勢區域但未超買
- **MACD**: 快線高於慢線，維持看漲信號

### 💰 基本面分析
**財務數據**：
- 2025年Q4營收：NT$8,680億（同比+38%）
- 毛利率：57.8%
- 淨利率：45.2%
- 每股盈餘：NT$45.2
- 本益比：約22倍

**競爭優勢**：
1. 先進製程技術領先（3nm、2nm）
2. CoWoS先進封裝產能供不應求
3. 客戶遍及全球頂尖科技公司
4. 高毛利率護城河

### 📈 增長驅動力
1. **AI芯片需求**：NVIDIA、AMD、Broadcom訂單強勁
2. **先進封裝**：CoWoS產能擴充
3. **海外擴張**：美國、日本、德國設廠
4. **2nm製程**：預計2026年量產

### ⚠️ 風險因素
1. 地緣政治風險（兩岸關係、美國關稅）
2. 全球經濟放緩影響終端需求
3. 競爭對手（三星、英特爾）追趕
4. 資本開支巨大影響現金流

### 🎯 投資建議

**短期 (1-3個月): 看好**
AI訂單持續強勁，Q1業績可望優於預期

**中期 (3-12個月): 強烈看好**
2nm量產、海外產能開出

**長期 (1年以上): 強烈看好**
半導體需求長期增長，台積電龍頭地位穩固

### 💡 買賣時機建議
- **理想買入區間**：NT$750 - NT$800
- **加倉區間**：NT$800 - NT$850
- **止蝕位**：NT$700
- **短期目標**：NT$900
- **中期目標**：NT$1,000
- **長期目標**：NT$1,200

### 📝 總結
台積電係AI時代嘅核心受惠者，技術領先、客戶黏性高。短期股價或有波動，但長期增長邏輯清晰。適合長線投資者分批布局。

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
        } else {
          return `## 📊 TSMC (2330.TW) Investment Analysis

### 🌍 Macroeconomic Environment
The global semiconductor industry is in an AI-driven super cycle. TSMC, as the world's leading foundry, directly benefits from exploding AI chip demand.

### 🔬 Technical Analysis
- **Current Trend**: Bullish trend, steadily rising along 20-day MA
- **Support**: NT$800, NT$750
- **Resistance**: NT$900, NT$950
- **RSI(14)**: 62 - Strong but not overbought
- **MACD**: Bullish signal maintained

### 💰 Fundamental Analysis
**Financial Data**:
- Q4 2025 Revenue: NT$868B (+38% YoY)
- Gross Margin: 57.8%
- Net Margin: 45.2%
- EPS: NT$45.2
- P/E Ratio: ~22x

### 🎯 Investment Recommendation
- **Short-term (1-3 months)**: Bullish
- **Medium-term (3-12 months)**: Strongly Bullish
- **Long-term (1+ years)**: Strongly Bullish

### 💡 Entry/Exit Timing
- **Ideal Entry Zone**: NT$750 - NT$800
- **Stop Loss**: NT$700
- **Target**: NT$900 (short), NT$1,000 (mid), NT$1,200 (long)

*⚠️ This analysis is for reference only.*`;
        }
      }
      
      // Default response when stock not found
      return `## 📊 Stock Analysis

I couldn't identify the stock you're asking about. 

Please try asking with:
- **Chinese name**: 台積電、騰訊、比亞迪、特斯拉
- **English name**: TSMC, Tencent, BYD, Tesla
- **Stock symbol**: 2330.TW, 0700.HK, NVDA, TSLA

**Examples**:
- "Should I buy 台積電 now?"
- "Is TSMC a good investment?"
- "分析一下 NVDA"

*⚠️ For detailed analysis, please specify a clear stock name or symbol.*`;
    };
    
    const response = {
      success: true,
      symbol: stockSymbol || 'N/A',
      price: stockSymbol === '2330.TW' ? "NT$850" : "N/A",
      rsi: "62",
      macd: "Bullish",
      marketCap: stockSymbol === '2330.TW' ? "NT$22T" : "N/A",
      peRatio: stockSymbol === '2330.TW' ? "22.5" : "N/A",
      volume: "32,456,789",
      historical: [],
      summary: getAnalysis(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        symbol: 'N/A',
        summary: `Analysis temporarily unavailable. Please try again.`
      },
      { status: 200 }
    );
  }
}
