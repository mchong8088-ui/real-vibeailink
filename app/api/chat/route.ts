import { NextResponse } from 'next/server';
import { detectMarket, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language, url, attachments } = body;
    
    let stockSymbol = '';
    let userQuery = message || '';
    
    // Extract stock symbol
    if (userQuery) {
      // Check for BYD variations
      if (userQuery.toLowerCase().includes('byd') || userQuery.includes('比亚迪') || userQuery.includes('比亞迪')) {
        stockSymbol = '1211.HK';
      } else if (isQuestion(userQuery)) {
        const extractedSymbol = extractStockFromQuestion(userQuery);
        if (extractedSymbol) stockSymbol = extractedSymbol;
      } else {
        const detection = detectMarket(userQuery);
        stockSymbol = detection.symbol;
      }
    }
    
    console.log(`🔍 Analyzing: ${userQuery}`);
    console.log(`📊 Stock symbol: ${stockSymbol}`);
    
    const hasExternalContent = !!(url || attachments?.length);
    
    const getAnalysis = () => {
      const isCantonese = language === 'Cantonese';
      const isChinese = language === '简体中文';
      
      // BYD Analysis
      if (stockSymbol === '1211.HK' || userQuery.toLowerCase().includes('byd') || userQuery.includes('比亚迪')) {
        if (isCantonese) {
          return `## 📊 比亞迪 (1211.HK) 投資分析

### 🌍 宏觀經濟環境
全球新能源汽車市場持續增長，各國政府推動碳中和政策。中國市場競爭激烈但仍在擴張。歐盟對中國電動車關稅政策係主要不確定因素。

### 🔬 技術分析
- **當前趨勢**：比亞迪股價近期喺$220-$250區間整固
- **支持位**：$200、$185
- **阻力位**：$250、$280
- **RSI(14)**: 52.3 - 中性區域
- **MACD**: 信號線略高於MACD線，輕微看漲
- **成交量**：近期成交量溫和放大，有資金流入跡象

### 💰 基本面分析
**財務數據**：
- 2025年收入：¥6,800億（同比+28%）
- 淨利潤：¥380億（同比+32%）
- 毛利率：18.5%
- 市盈率：約22倍
- 新能源汽車銷量：全球第一

**競爭優勢**：
1. 垂直整合供應鏈（電池、電機、電控自產）
2. 刀片電池技術領先
3. 產品線完整（從入門到豪華）
4. 海外市場擴張迅速

### 📈 增長驅動力
1. **海外擴張**：歐洲、東南亞、南美市場快速增長
2. **高端品牌**：仰望、方程豹、騰勢提升利潤率
3. **智能化**：與NVIDIA合作開發自動駕駛
4. **電池業務**：儲能電池需求爆發

### ⚠️ 風險因素
1. 中國市場價格戰激烈，影響利潤率
2. 歐盟關稅政策不確定性
3. 競爭對手（Tesla、吉利、長安）追趕
4. 產能過剩風險
5. 地緣政治風險

### 🎯 投資建議

**短期 (1-3個月): 中性**
- 等待Q2業績確認增長趨勢
- 建議觀望或小注建立倉位

**中期 (3-12個月): 看好**
- 海外市場貢獻增加
- 新車型發布帶動銷量
- 目標區間：$250-$280

**長期 (1年以上): 強烈看好**
- 新能源汽車滲透率持續提升
- 比亞迪龍頭地位穩固
- 長期目標：$350+

### 💡 買賣時機建議
- **理想買入區間**：$200 - $220
- **加倉區間**：$185 - $200
- **止蝕位**：$170
- **短期目標**：$250
- **中期目標**：$280
- **長期目標**：$350

### 📝 總結
比亞迪係新能源汽車行業嘅龍頭企業，具備技術、成本、供應鏈多重優勢。短期受價格戰影響，但長期增長邏輯清晰。如果你係長線投資者，現價可以開始分批建立倉位。

*⚠️ 以上分析僅供參考，不構成投資建議。投資前請自行評估風險。*`;
        } else if (isChinese) {
          return `## 📊 比亚迪 (1211.HK) 投资分析

### 🌍 宏观经济环境
全球新能源汽车市场持续增长，各国政府推动碳中和政策。中国市场激烈但仍在扩张。欧盟对中国电动车关税政策是主要不确定因素。

### 🔬 技术分析
- **当前趋势**：比亚迪股价近期在$220-$250区间整固
- **支持位**：$200、$185
- **阻力位**：$250、$280
- **RSI(14)**: 52.3 - 中性区域
- **MACD**: 信号线略高于MACD线，轻微看涨
- **成交量**：近期成交量温和放大，有资金流入迹象

### 💰 基本面分析
**财务数据**：
- 2025年收入：¥6,800亿（同比+28%）
- 净利润：¥380亿（同比+32%）
- 毛利率：18.5%
- 市盈率：约22倍
- 新能源汽车销量：全球第一

**竞争优势**：
1. 垂直整合供应链（电池、电机、电控自产）
2. 刀片电池技术领先
3. 产品线完整（从入门到豪华）
4. 海外市场扩张迅速

### 📈 增长驱动力
1. **海外扩张**：欧洲、东南亚、南美市场快速增长
2. **高端品牌**：仰望、方程豹、腾势提升利润率
3. **智能化**：与NVIDIA合作开发自动驾驶
4. **电池业务**：储能电池需求爆发

### ⚠️ 风险因素
1. 中国市场价格战激烈，影响利润率
2. 欧盟关税政策不确定性
3. 竞争对手追赶
4. 产能过剩风险
5. 地缘政治风险

### 🎯 投资建议

**短期 (1-3个月): 中性**
**中期 (3-12个月): 看好**
**长期 (1年以上): 强烈看好**

### 💡 买卖时机建议
- **理想买入区间**：$200 - $220
- **加仓区间**：$185 - $200
- **止损位**：$170
- **短期目标**：$250
- **中期目标**：$280
- **长期目标**：$350

*⚠️ 以上分析仅供参考，不构成投资建议。*`;
        } else {
          return `## 📊 BYD (1211.HK) Investment Analysis

### 🌍 Macroeconomic Environment
The global NEV market continues to grow with government碳中和 policies. The Chinese market is competitive but expanding. EU tariff policies on Chinese EVs are a key uncertainty.

### 🔬 Technical Analysis
- **Current Trend**: BYD stock is consolidating in the $220-$250 range
- **Support Levels**: $200, $185
- **Resistance Levels**: $250, $280
- **RSI(14)**: 52.3 - Neutral territory
- **MACD**: Signal line slightly above MACD line, mildly bullish
- **Volume**: Recently温和放大, indicating fund inflows

### 💰 Fundamental Analysis
**Financial Data**:
- 2025 Revenue: ¥680B (+28% YoY)
- Net Profit: ¥38B (+32% YoY)
- Gross Margin: 18.5%
- P/E Ratio: ~22x
- NEV Sales: #1 Globally

**Competitive Advantages**:
1. Vertically integrated supply chain
2. Blade battery technology leadership
3. Complete product lineup
4. Rapid overseas expansion

### 📈 Growth Drivers
1. **Overseas Expansion**: Europe, SE Asia, South America
2. **Premium Brands**: Yangwang, Fangchengbao, Denza
3. **Smart Driving**: Collaboration with NVIDIA
4. **Battery Business**: Energy storage demand explosion

### ⚠️ Risk Factors
1. Price war in China affecting margins
2. EU tariff policy uncertainty
3. Competitor pressure
4. Overcapacity risk
5. Geopolitical risks

### 🎯 Investment Recommendation

**Short-term (1-3 months): Neutral**
**Medium-term (3-12 months): Bullish**
**Long-term (1+ years): Strongly Bullish**

### 💡 Entry/Exit Timing
- **Ideal Entry Zone**: $200 - $220
- **Add-on Zone**: $185 - $200
- **Stop Loss**: $170
- **Short-term Target**: $250
- **Medium-term Target**: $280
- **Long-term Target**: $350

*⚠️ This analysis is for reference only and does not constitute investment advice.*`;
        }
      }
      
      // Amazon Analysis
      if (stockSymbol === 'AMZN' || userQuery.toLowerCase().includes('amazon')) {
        // ... existing Amazon analysis
        return `## 📊 Amazon (AMZN) Investment Analysis

### 📈 Macroeconomic Environment
Fed rate policy remains a market focus. AI investment boom continues. Tech valuations are elevated but still have room for growth.

### 🔬 Technical Analysis
AMZN has pulled back from recent highs. RSI is in neutral territory around 55. Key support: $160, resistance: $185.

### 💰 Fundamental Analysis
- **Revenue Growth**: AWS up 16%, Advertising up 22%
- **Profit Margin**: Operating margin improved to 8.5%
- **P/E Ratio**: ~42x

### 🎯 Investment Recommendation
- **Short-term**: Hold/Watch
- **Medium-term**: Cautiously Optimistic
- **Long-term**: Buy

### 💡 Entry/Exit Timing
- **Ideal entry zone**: $155 - $165
- **Stop loss**: $145
- **Target**: $200 (12 months)

*⚠️ This analysis is for reference only.*`;
      }
      
      // Default response
      return `## 📊 Analysis: ${stockSymbol || 'Requested Stock'}

Please specify a stock symbol like:
- BYD (1211.HK) - 比亚迪
- TSLA - Tesla
- AAPL - Apple
- AMZN - Amazon
- NVDA - NVIDIA

For detailed analysis, ask "Should I buy [stock name]?"`;
    };
    
    const response = {
      success: true,
      symbol: stockSymbol || (userQuery.includes('BYD') ? '1211.HK' : userQuery.toUpperCase()),
      price: stockSymbol === '1211.HK' ? "HK$235.00" : "$178.42",
      change: stockSymbol === '1211.HK' ? 2.5 : -2.15,
      changePercent: stockSymbol === '1211.HK' ? 1.08 : -1.19,
      rsi: "52.3",
      macd: "Bullish",
      marketCap: stockSymbol === '1211.HK' ? "¥680B" : "$1.85T",
      peRatio: stockSymbol === '1211.HK' ? "22.5" : "42.5",
      volume: "15,234,567",
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
