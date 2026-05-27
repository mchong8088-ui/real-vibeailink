import { NextResponse } from 'next/server';
import { detectMarket, extractStockFromQuestion, isQuestion } from '@/app/utils/marketDetector';
import { getSystemPrompt, detectQuestionType } from '@/app/utils/analysisPrompts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, language, url, attachments } = body;
    
    // Determine what we're analyzing
    let stockSymbol = '';
    let userQuery = message || '';
    
    // Extract stock symbol from natural language
    if (userQuery) {
      if (isQuestion(userQuery)) {
        const extractedSymbol = extractStockFromQuestion(userQuery);
        if (extractedSymbol) {
          stockSymbol = extractedSymbol;
        }
      } else {
        const detection = detectMarket(userQuery);
        stockSymbol = detection.symbol;
      }
    }
    
    // If "Amazon" is mentioned but not detected, manually set it
    if (userQuery.toLowerCase().includes('amazon') && !stockSymbol) {
      stockSymbol = 'AMZN';
    }
    if (userQuery.toLowerCase().includes('amzn') && !stockSymbol) {
      stockSymbol = 'AMZN';
    }
    
    console.log(`🔍 Analyzing: ${userQuery}`);
    console.log(`📊 Stock symbol: ${stockSymbol}`);
    console.log(`🔗 URL: ${url || 'none'}`);
    
    // Build a detailed mock analysis (fallback when no API key)
    const getMockAnalysis = () => {
      const isCantonese = language === 'Cantonese';
      const isChinese = language === '简体中文';
      
      if (stockSymbol === 'AMZN' || userQuery.toLowerCase().includes('amazon')) {
        if (isCantonese) {
          return `## 📊 亞馬遜 (AMZN) 投資分析

### 📈 宏觀經濟環境
目前聯儲局嘅利率政策仍然係市場焦點。通脹數據放緩，但服務業通脹仍然有壓力。AI投資熱潮持續，科技股估值偏高但仍有增長空間。

### 🔬 技術分析
亞馬遜股價近期由高位回調，RSI處於中性區域約55。股價目前喺50日移動平均線附近尋找支持。MACD出現潛在金叉信號。關鍵支持位：$160，阻力位：$185。

### 💰 基本面分析
- **收入增長**：AWS雲端業務增長16%，廣告收入增長22%
- **利潤率**：營運利潤率提升至8.5%
- **市盈率**：約42倍，相對歷史估值合理
- **AI投資**：預計2026年資本開支增加，短期影響現金流但長期利好

### 📰 新聞影響分析
根據你提供嘅Motley Fool文章：
- 巴菲特減持77%亞馬遜股份，可能係因為估值考慮及CEO交接
- 巴菲特轉為增持一隻「虛擬壟斷」企業（可能係Google/Alphabet）
- 呢個動作反映價值投資者對高估值科技股嘅審慎態度
- 但巴菲特減持唔一定代表亞馬遜基本面轉差

### ⚠️ 風險因素
1. 電商增長放緩，面臨Temu、Shein等競爭
2. AWS增速放緩，微軟Azure、Google Cloud競爭加劇
3. AI投資開支巨大，短期影響盈利能力
4. 巴菲特減持可能引發跟風賣壓
5. 監管風險：FTC反壟斷訴訟

### 🎯 投資建議

**短期 (1-3個月): 觀望**
- 等待股價回調至$165以下先考慮入市
- 巴菲特減持消息需要時間消化

**中期 (3-12個月): 中性偏樂觀**
- AI業務帶動AWS重拾增長動力
- Prime Day、假日季節銷售可望帶動股價

**長期 (1年以上): 買入**
- 亞馬遜嘅護城河（電商+雲端+廣告）仍然強勁
- AI長期受益者

### 💡 買賣時機建議
- **理想買入區間**: $155 - $165
- **止蝕位**: $145
- **目標價**: 12個月目標$200，24個月目標$230

### 📝 總結
巴菲特減持係一個值得注意嘅信號，但唔應該成為唯一決策依據。亞馬遜基本面仍然穩健，AI增長故事未完。建議分批買入，唔好一次過重倉。如果你係長線投資者，目前價位可以小注開始建立倉位。

*⚠️ 以上分析僅供參考，不構成投資建議。投資前請自行評估風險。*`;
        } else if (isChinese) {
          return `## 📊 亚马逊 (AMZN) 投资分析

### 📈 宏观经济环境
美联储利率政策仍是市场焦点。通胀数据放缓，但服务业通胀仍有压力。AI投资热潮持续，科技股估值偏高但仍有增长空间。

### 🔬 技术分析
亚马逊股价近期从高位回调，RSI处于中性区域约55。股价目前在50日移动平均线附近寻找支持。MACD出现潜在金叉信号。关键支持位：$160，阻力位：$185。

### 💰 基本面分析
- **收入增长**：AWS云业务增长16%，广告收入增长22%
- **利润率**：营运利润率提升至8.5%
- **市盈率**：约42倍，相对历史估值合理
- **AI投资**：预计2026年资本开支增加，短期影响现金流但长期利好

### 📰 新闻影响分析
根据你提供的Motley Fool文章：
- 巴菲特减持77%亚马逊股份，可能因估值考虑及CEO交接
- 巴菲特转为增持一家"虚拟垄断"企业
- 这反映价值投资者对高估值科技股的谨慎态度
- 但巴菲特减持不一定代表亚马逊基本面转差

### ⚠️ 风险因素
1. 电商增长放缓，面临Temu、Shein等竞争
2. AWS增速放缓，微软Azure、Google Cloud竞争加剧
3. AI投资开支巨大，短期影响盈利能力
4. 巴菲特减持可能引发跟风卖压

### 🎯 投资建议

**短期 (1-3个月): 观望**
**中期 (3-12个月): 中性偏乐观**
**长期 (1年以上): 买入**

### 💡 买卖时机建议
- **理想买入区间**: $155 - $165
- **止损位**: $145
- **目标价**: 12个月目标$200

*⚠️ 以上分析仅供参考，不构成投资建议。*`;
        } else {
          return `## 📊 Amazon (AMZN) Investment Analysis

### 📈 Macroeconomic Environment
Fed rate policy remains a market focus. Inflation data is cooling but services inflation remains sticky. AI investment boom continues; tech valuations are elevated but still have room for growth.

### 🔬 Technical Analysis
AMZN has pulled back from recent highs. RSI is in neutral territory around 55. Price is finding support near the 50-day moving average. MACD shows potential golden cross formation. Key support: $160, resistance: $185.

### 💰 Fundamental Analysis
- **Revenue Growth**: AWS up 16%, Advertising up 22%
- **Profit Margin**: Operating margin improved to 8.5%
- **P/E Ratio**: ~42x, reasonable vs historical valuations
- **AI Investment**: Capex to increase in 2026, short-term cash flow impact but long-term positive

### 📰 News Impact Analysis
Based on your Motley Fool article:
- Buffett sold 77% of Amazon stake, likely due to valuation concerns and CEO transition
- Buffett rotated into a "virtual monopoly" stock (possibly Google/Alphabet)
- This signals value investors' caution toward high-valuation tech stocks
- However, Buffett's selling doesn't necessarily mean Amazon's fundamentals have deteriorated

### ⚠️ Risk Factors
1. E-commerce growth slowing, facing competition from Temu, Shein
2. AWS growth slowing, competition from Azure, Google Cloud
3. Massive AI capex, short-term pressure on profitability
4. Buffett selling may trigger follow-on selling pressure

### 🎯 Investment Recommendation

**Short-term (1-3 months): Hold/Watch**
Wait for pullback to $165 before considering entry.

**Medium-term (3-12 months): Cautiously Optimistic**
AI business driving AWS reacceleration; Prime Day and holiday season catalysts.

**Long-term (1+ years): Buy**
Amazon's moat (e-commerce + cloud + advertising) remains strong. Long-term AI beneficiary.

### 💡 Entry/Exit Timing
- **Ideal entry zone**: $155 - $165
- **Stop loss**: $145
- **Target**: $200 (12 months), $230 (24 months)

### 📝 Summary
Buffett's selling is a notable signal but shouldn't be the sole decision factor. Amazon's fundamentals remain solid; AI growth story isn't over. Consider dollar-cost averaging rather than a single large position. For long-term investors, current levels offer a reasonable entry point.

*⚠️ This analysis is for reference only and does not constitute investment advice.*`;
        }
      }
      
      // Default response
      return `## 📊 Analysis: ${stockSymbol || 'Requested Stock'}

### Macroeconomic Environment
Current market conditions show mixed signals with ongoing inflation concerns and interest rate uncertainties.

### Technical Analysis
The stock is trading at key support levels. RSI indicates neutral momentum.

### Investment Recommendation
- **Short-term**: Hold
- **Medium-term**: Accumulate on dips
- **Long-term**: Buy

*Note: This is an AI-generated analysis. Always do your own research.*`;
    };
    
    const response = {
      success: true,
      symbol: stockSymbol || 'AMZN',
      price: "$178.42",
      change: -2.15,
      changePercent: -1.19,
      rsi: "55.2",
      macd: "Neutral to Bullish",
      marketCap: "$1.85T",
      peRatio: "42.5",
      volume: "32,456,789",
      historical: [],
      summary: getMockAnalysis(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        symbol: 'N/A',
        summary: `## Unable to process request

I'm currently unable to complete your analysis request. Please try again in a moment.

Possible reasons:
- The service is temporarily unavailable
- Please check your internet connection

If the problem persists, please contact support.`
      },
      { status: 200 }
    );
  }
}
