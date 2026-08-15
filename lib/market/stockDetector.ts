// Stock symbol detection from natural language
// This restores: 騰訊 → 0700.HK, 台積電 → 2330.TW, Tesla → TSLA

export const STOCK_ALIASES: Record<string, string> = {
  // ============================================
  // HONG KONG STOCKS (HKEX)
  // ============================================
  
  // Blue Chips & Major Companies
  "長江和記實業": "0001.HK",
  "長和": "0001.HK",
  "ck hutchison": "0001.HK",
  "ckh": "0001.HK",
  
  "中電": "0002.HK",
  "中電控股": "0002.HK",
  "clp": "0002.HK",
  "clp holdings": "0002.HK",
  
  "香港中華煤氣": "0003.HK",
  "煤氣": "0003.HK",
  "towngas": "0003.HK",
  
  "九龍倉": "0004.HK",
  "wharf": "0004.HK",
  
  "匯豐": "0005.HK",
  "匯豐控股": "0005.HK",
  "汇丰": "0005.HK",
  "hsbc": "0005.HK",
  
  "恒生銀行": "0011.HK",
  "恒生": "0011.HK",
  "hang seng": "0011.HK",
  "hangseng": "0011.HK",
  
  "新鴻基地產": "0016.HK",
  "新地": "0016.HK",
  "sun hung kai": "0016.HK",
  "shkp": "0016.HK",
  
  "新世界發展": "0017.HK",
  "新世界": "0017.HK",
  "new world development": "0017.HK",
  "nwd": "0017.HK",
  
  "新濠國際發展": "0200.HK",
  "melco international": "0200.HK",
  "melco": "0200.HK",
  "新濠": "0200.HK",
  
  // HK Tech & Major
  "騰訊": "0700.HK",
  "腾讯": "0700.HK",
  "tencent": "0700.HK",
  "tencent holdings": "0700.HK",
  "tence": "0700.HK",
  
  "港交所": "0388.HK",
  "香港交易所": "0388.HK",
  "hkex": "0388.HK",
  
  "比亞迪": "1211.HK",
  "比亚迪": "1211.HK",
  "byd": "1211.HK",
  "byd company": "1211.HK",
  
  "小米": "1810.HK",
  "xiaomi": "1810.HK",
  "小米集團": "1810.HK",
  
  "美團": "3690.HK",
  "美团": "3690.HK",
  "meituan": "3690.HK",
  "美團點評": "3690.HK",
  
  "阿里巴巴": "9988.HK",
  "alibaba": "9988.HK",
  "ali baba": "9988.HK",
  "阿里巴巴集團": "9988.HK",
  
  "金沙": "1928.HK",
  "金沙中國": "1928.HK",
  "sands china": "1928.HK",
  "las vegas sands": "1928.HK",
  
  // More HK Stocks
  "友邦保險": "1299.HK",
  "友邦": "1299.HK",
  "aia": "1299.HK",
  
  "中國移動": "0941.HK",
  "中移動": "0941.HK",
  "china mobile": "0941.HK",
  
  "中國平安": "2318.HK",
  "平安保險": "2318.HK",
  "ping an": "2318.HK",
  
  "中國人壽": "2628.HK",
  "國壽": "2628.HK",
  "china life": "2628.HK",
  
  "建設銀行": "0939.HK",
  "建行": "0939.HK",
  "ccb": "0939.HK",
  
  "工商銀行": "1398.HK",
  "工行": "1398.HK",
  "icbc": "1398.HK",
  
  "招商銀行": "3968.HK",
  "招行": "3968.HK",
  "cmb": "3968.HK",
  
  "中國銀行": "3988.HK",
  "中行": "3988.HK",
  "bank of china": "3988.HK",
  
  "農業銀行": "1288.HK",
  "農行": "1288.HK",
  "abc": "1288.HK",
  
  "交通銀行": "3328.HK",
  "交行": "3328.HK",
  "bank of communications": "3328.HK",
  
  "中信銀行": "0998.HK",
  "中信": "0998.HK",
  "citic": "0998.HK",
  
  "銀河娛樂": "0027.HK",
  "銀娛": "0027.HK",
  "galaxy entertainment": "0027.HK",
  
  "領展": "0823.HK",
  "領展房產基金": "0823.HK",
  "link reit": "0823.HK",
  
  "長實集團": "1113.HK",
  "長實": "1113.HK",
  "ck asset": "1113.HK",
  
  "恒基地產": "0012.HK",
  "恒基": "0012.HK",
  "henderson land": "0012.HK",
  
  "信和置業": "0083.HK",
  "信和": "0083.HK",
  "sino land": "0083.HK",
  
  "太古": "0019.HK",
  "太古股份": "0019.HK",
  "swire pacific": "0019.HK",
  
  "港鐵": "0066.HK",
  "地鐵": "0066.HK",
  "mtr": "0066.HK",
  
  "中電信": "0728.HK",
  "中國電信": "0728.HK",
  "china telecom": "0728.HK",
  
  "中國聯通": "0762.HK",
  "聯通": "0762.HK",
  "china unicom": "0762.HK",
  
  // ============================================
  // TAIWAN STOCKS (TWSE)
  // ============================================
  
  "台積電": "2330.TW",
  "台积电": "2330.TW",
  "tsmc": "2330.TW",
  "taiwan semiconductor": "2330.TW",
  
  "聯發科": "2454.TW",
  "联发科": "2454.TW",
  "mediatek": "2454.TW",
  
  "鴻海": "2317.TW",
  "鸿海": "2317.TW",
  "foxconn": "2317.TW",
  "hon hai": "2317.TW",
  
  "台達電": "2308.TW",
  "台达电": "2308.TW",
  "delta electronics": "2308.TW",
  
  "廣達": "2382.TW",
  "广达": "2382.TW",
  "quanta": "2382.TW",
  
  "聯電": "2303.TW",
  "联电": "2303.TW",
  "umc": "2303.TW",
  "united microelectronics": "2303.TW",
  
  "日月光": "3711.TW",
  "ase group": "3711.TW",
  
  "中華電": "2412.TW",
  "中华电": "2412.TW",
  "chunghwa telecom": "2412.TW",
  
  "台塑": "1301.TW",
  "formosa plastics": "1301.TW",
  
  "南亞": "1303.TW",
  "南亚": "1303.TW",
  "nanya plastics": "1303.TW",
  
  "台化": "1326.TW",
  "台化纖維": "1326.TW",
  
  // ============================================
  // US STOCKS (NASDAQ/NYSE)
  // ============================================
  
  // EV & Auto
  "特斯拉": "TSLA",
  "tesla": "TSLA",
  "Tesla": "TSLA",

  // Tech Giants
  "苹果": "AAPL",
  "蘋果": "AAPL",
  "apple": "AAPL",
  "Apple": "AAPL",

  "SpaceX": "SPCX",
  "Space X": "SPCX",
  "spacex": "SPCX",

  "微軟": "MSFT",
  "微软": "MSFT",
  "microsoft": "MSFT",
  "Microsoft": "MSFT",
  
  "谷歌": "GOOGL",
  "google": "GOOGL",
  "Google": "GOOGL",
  "alphabet": "GOOGL",
  
  "亞馬遜": "AMZN",
  "亚马逊": "AMZN",
  "amazon": "AMZN",
  "Amazon": "AMZN",

  "Nebius": "NBIS",
  "nebius": "NBIS",
  
  // Semiconductors
  "英偉達": "NVDA",
  "辉达": "NVDA",
  "nvidia": "NVDA",
  "Nvidia": "NVDA",
  "輝達": "NVDA",
  
  "英特尔": "INTC",
  "intel": "INTC",
  "Intel": "INTC",
  
  "超微半導體": "AMD",
  "amd": "AMD",
  "Amd": "AMD",
  "advanced micro devices": "AMD",
  
  "高通": "QCOM",
  "qualcomm": "QCOM",
  "Qualcomm": "QCOM",
  
  "博通": "AVGO",
  "broadcom": "AVGO",
  "Broadcom": "AVGO",
  
  "德州儀器": "TXN",
  "texas instruments": "TXN",
  "ti": "TXN",
  
  // Social Media
  "meta": "META",
  "Meta": "META",
  "facebook": "META",
  "Facebook": "META",
  "meta platforms": "META",
  
  // Other Tech
  "网飞": "NFLX",
  "netflix": "NFLX",
  "Netflix": "NFLX",
  
  "特斯拉能源": "TSLA",
  
  // Finance
  "巴菲特": "BRK.B",
  "berkshire": "BRK.B",
  "巴郡": "BRK.B",
  "波克夏": "BRK.B",
  
  "摩根大通": "JPM",
  "jpmorgan": "JPM",
  "jpm": "JPM",
  
  "高盛": "GS",
  "goldman sachs": "GS",
  
  // Consumer
  "可口可樂": "KO",
  "coca cola": "KO",
  "coke": "KO",
  
  "麥當勞": "MCD",
  "mcdonalds": "MCD",
  "mcd": "MCD",
  
  "星巴克": "SBUX",
  "starbucks": "SBUX",
  
  "耐克": "NKE",
  "nike": "NKE",
  
  // EV & Energy
  "蔚来": "NIO",
  "nio": "NIO",
  "蔚來": "NIO",
  
  "理想汽车": "LI",
  "理想": "LI",
  "li auto": "LI",
  
  "小鹏": "XPEV",
  "小鹏汽车": "XPEV",
  "xpeng": "XPEV",
  
  "福特": "F",
  "ford": "F",
  
  "通用汽车": "GM",
  "general motors": "GM",
  
  // Chinese ADRs
  "拼多多": "PDD",
  "pinduoduo": "PDD",
  "pdd": "PDD",
  
  "京东": "JD",
  "jd": "JD",
  "jingdong": "JD",
  "jd.com": "JD",
  
  "百度": "BIDU",
  "baidu": "BIDU",
  
  "网易": "NTES",
  "netease": "NTES",
  
  "贝壳": "BEKE",
  "ke holdings": "BEKE",
  
  "中通快递": "ZTO",
  "zto": "ZTO",
  
  // Pharma
  "辉瑞": "PFE",
  "pfizer": "PFE",
  
  "莫德纳": "MRNA",
  "moderna": "MRNA",
  
  // Defense/Aerospace
  "波音": "BA",
  "boeing": "BA",
  
  "洛克希德马丁": "LMT",
  "lockheed martin": "LMT",
};

export function detectStock(input: string): string {
  if (!input || input.trim() === '') return '';
  
  const cleanInput = input.trim();
  const lowerInput = cleanInput.toLowerCase();
  
  // Check if it's already a valid stock symbol format
  if (/^[A-Z0-9]+\.(HK|TW)$/i.test(cleanInput)) {
    return cleanInput.toUpperCase();
  }
  
  // 4-digit number (likely HK stock)
  if (/^\d{4}$/.test(cleanInput)) {
    return `${cleanInput}.HK`;
  }
  
  // 5-digit number (likely TW stock)
  if (/^\d{5}$/.test(cleanInput)) {
    return `${cleanInput}.TW`;
  }
  
  // All caps letter symbol (US stock) - extended to handle longer symbols
  if (/^[A-Z]{1,5}$/i.test(cleanInput)) {
    return cleanInput.toUpperCase();
  }
  
  // Handle common US stock symbols with dots (like BRK.B)
  if (/^[A-Z]+\.[A-Z]$/i.test(cleanInput)) {
    return cleanInput.toUpperCase();
  }
  
  // Check aliases map (case-insensitive)
  for (const [name, symbol] of Object.entries(STOCK_ALIASES)) {
    if (lowerInput.includes(name.toLowerCase())) {
      console.log(`✅ Detected stock: "${name}" -> ${symbol}`);
      return symbol;
    }
  }
  
  // If nothing matches, return as is
  return cleanInput.toUpperCase();
}

export function isQuestion(input: string): boolean {
  const questionWords = ['?', '？', 'should', 'buy', 'sell', '買', '賣', '點睇', '如何', '怎樣', '怎样', '是否', '會', '会'];
  return questionWords.some(word => input.includes(word));
}

export function extractStockFromQuestion(input: string): string | null {
  const symbol = detectStock(input);
  if (symbol !== input.trim().toUpperCase()) {
    return symbol;
  }
  return null;
}