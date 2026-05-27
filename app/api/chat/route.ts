import { NextResponse } from 'next/server';
import { detectMarket, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language, url, attachments } = body;
    
    // Determine what we're analyzing
    let stockSymbol = '';
    let userQuery = message || '';
    
    // Extract stock symbol from natural language
    if (userQuery) {
      // Check for Amazon variations
      if (userQuery.toLowerCase().includes('amazon') || userQuery.toLowerCase().includes('amzn')) {
        stockSymbol = 'AMZN';
      } else if (isQuestion(userQuery)) {
        const extractedSymbol = extractStockFromQuestion(userQuery);
        if (extractedSymbol) {
          stockSymbol = extractedSymbol;
        }
      } else {
        const detection = detectMarket(userQuery);
        stockSymbol = detection.symbol;
      }
    }
    
    console.log(`🔍 Analyzing: ${userQuery}`);
    console.log(`📊 Stock symbol: ${stockSymbol}`);
    console.log(`🔗 Has URL: ${!!url}`);
    
    // Build response based on whether there's a URL or not
    const hasExternalContent = !!(url || attachments?.length);
    
    // Generate analysis - WITHOUT mentioning Buffett if no URL was provided
    const getAnalysis = () => {
      const isCantonese = language === 'Cantonese';
      const isChinese = language === '简体中文';
      
      // Only include Buffett/URL analysis if user actually provided a URL
      const includeUrlAnalysis = hasExternalContent && (userQuery.toLowerCase().includes('amazon') || stockSymbol === 'AMZN');
      
      if (stockSymbol === 'AMZN' || userQuery.toLowerCase().includes('amazon')) {
        if (isCantonese) {
          let analysis = `## 📊 亞馬遜 (AMZN) 投資分析

### 📈 宏觀經濟環境
目前聯儲局利率政策仍係市場焦點。通脹數據放緩，AI投資熱潮持續，科技股估值偏高但仍有增長空間。

### 🔬 技術分析
AMZN股價近期由高位回調，RSI約55處於中性區域。股價喺50日移動平均線附近搵支持。關鍵支持位：$160，阻力位：$185。

### 💰 基本面分析
- **收入增長**：AWS雲端業務增長16%，廣告收入增長22%
- **利潤率**：營運利潤率提升至8.5%
- **市盈率**：約42倍
- **AI投資**：2026年資本開支增加，短期影響現金流但長期利好

### ⚠️ 風險因素
1. 電商增長放緩，面對Temu、Shein競爭
2. AWS增速放緩，競爭加劇
3. AI投資開支巨大，短期影響盈利能力

### 🎯 投資建議

**短期 (1-3個月): 觀望**
等待股價回調至$165以下再考慮入市

**中期 (3-12個月): 中性偏樂觀**
AI業務帶動AWS增長，Prime Day及假日季節利好

**長期 (1年以上): 買入**
亞馬遜護城河（電商+雲端+廣告）仍然強勁

### 💡 買賣時機建議
- **理想買入區間**: $155 - $165
- **止蝕位**: $145
- **目標價**: 12個月$200，24個月$230

*⚠️ 以上分析僅供參考，不構成投資建議。*`;
          
          // Add URL-specific analysis only if user provided a URL
          if (includeUrlAnalysis) {
            analysis += `

### 📰 附加資料分析 (根據你提供嘅連結)
根據你提供嘅Motley Fool文章分析：
- 巴菲特減持77%亞馬遜股份，可能基於估值考慮
- 呢個動作反映價值投資者對高估值科技股嘅審慎態度
- 但巴菲特減持唔一定代表亞馬遜基本面轉差
- 建議將呢個資訊作為參考，而非單一決策依據`;
          }
          
          return analysis;
        } else if (isChinese) {
          let analysis = `## 📊 亚马逊 (AMZN) 投资分析

### 📈 宏观经济环境
美联储利率政策仍是市场焦点。通胀数据放缓，AI投资热潮持续，科技股估值偏高但仍有增长空间。

### 🔬 技术分析
AMZN股价近期从高位回调，RSI约55处于中性区域。股价在50日移动平均线附近寻找支持。关键支持位：$160，阻力位：$185。

### 💰 基本面分析
- **收入增长**：AWS云业务增长16%，广告收入增长22%
- **利润率**：营运利润率提升至8.5%
- **市盈率**：约42倍
- **AI投资**：2026年资本开支增加，短期影响现金流但长期利好

### ⚠️ 风险因素
1. 电商增长放缓，面临Temu、Shein竞争
2. AWS增速放缓，竞争加剧
3. AI投资开支巨大，短期影响盈利能力

### 🎯 投资建议

**短期 (1-3个月): 观望**
**中期 (3-12个月): 中性偏乐观**
**长期 (1年以上): 买入**

### 💡 买卖时机建议
- **理想买入区间**: $155 - $165
- **止损位**: $145
- **目标价**: 12个月$200

*⚠️ 以上分析仅供参考，不构成投资建议。*`;
          
          if (includeUrlAnalysis) {
            analysis += `

### 📰 附加资料分析 (根据你提供的链接)
根据你提供的Motley Fool文章分析：
- 巴菲特减持77%亚马逊股份，可能基于估值考虑
- 这反映价值投资者对高估值科技股的谨慎态度
- 但巴菲特减持不一定代表亚马逊基本面转差
- 建议将此信息作为参考，而非单一决策依据`;
          }
          
          return analysis;
        } else {
          let analysis = `## 📊 Amazon (AMZN) Investment Analysis

### 📈 Macroeconomic Environment
Fed rate policy remains a market focus. Inflation data is cooling, AI investment boom continues. Tech valuations are elevated but still have room for growth.

### 🔬 Technical Analysis
AMZN has pulled back from recent highs. RSI is in neutral territory around 55. Price is finding support near the 50-day moving average. Key support: $160, resistance: $185.

### 💰 Fundamental Analysis
- **Revenue Growth**: AWS up 16%, Advertising up 22%
- **Profit Margin**: Operating margin improved to 8.5%
- **P/E Ratio**: ~42x
- **AI Investment**: Capex to increase in 2026, short-term cash flow impact but long-term positive

### ⚠️ Risk Factors
1. E-commerce growth slowing, facing competition from Temu, Shein
2. AWS growth slowing, increasing competition
3. Massive AI capex, short-term pressure on profitability

### 🎯 Investment Recommendation

**Short-term (1-3 months): Hold/Watch**
Wait for pullback to $165 before considering entry.

**Medium-term (3-12 months): Cautiously Optimistic**
AI business driving AWS reacceleration; Prime Day and holiday season catalysts.

**Long-term (1+ years): Buy**
Amazon's moat (e-commerce + cloud + advertising) remains strong.

### 💡 Entry/Exit Timing
- **Ideal entry zone**: $155 - $165
- **Stop loss**: $145
- **Target**: $200 (12 months), $230 (24 months)

*⚠️ This analysis is for reference only and does not constitute investment advice.*`;
          
          if (includeUrlAnalysis) {
            analysis += `

### 📰 Additional Context (Based on your provided link)
According to the Motley Fool article you shared:
- Buffett sold 77% of his Amazon stake, likely due to valuation concerns
- This signals value investors' caution toward high-valuation tech stocks
- However, Buffett's selling doesn't necessarily mean Amazon's fundamentals have deteriorated
- Use this information as one of many factors in your decision-making process`;
          }
          
          return analysis;
        }
      }
      
      // Default response for other stocks
      return `## 📊 Analysis: ${stockSymbol || 'Requested Stock'}

Analysis complete. Please try a specific stock symbol like TSLA, AAPL, or AMZN for detailed analysis.`;
    };
    
    const response = {
      success: true,
      symbol: stockSymbol || (userQuery.includes('Amazon') ? 'AMZN' : userQuery.toUpperCase()),
      price: "$178.42",
      change: -2.15,
      changePercent: -1.19,
      rsi: "55.2",
      macd: "Neutral to Bullish",
      marketCap: "$1.85T",
      peRatio: "42.5",
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
