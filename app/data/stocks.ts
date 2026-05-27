// Stock Registry - Top 150 Stocks across US, Taiwan, Hong Kong markets
// Organized by AI, Semiconductors, EV, Energy Transition, and Tech Ecosystems

export interface StockInfo {
  symbol: string;
  en: string;
  cn: string;
  segment: string;
  market: 'US' | 'TW' | 'HK';
  aliases: string[];
}

export const STOCK_REGISTRY: Record<string, StockInfo> = {
  // ============================================
  // US MARKET - AI / Tech Leaders (50 stocks)
  // ============================================
  
  // AI Chips / GPU
  "NVDA": { symbol: "NVDA", en: "NVIDIA", cn: "輝達", segment: "AI Chips / GPU", market: "US", aliases: ["NVIDIA", "輝達", "英伟达"] },
  "AMD": { symbol: "AMD", en: "AMD", cn: "超微", segment: "AI Chips", market: "US", aliases: ["AMD", "超微"] },
  "INTC": { symbol: "INTC", en: "Intel", cn: "英特爾", segment: "Chips / Foundry", market: "US", aliases: ["Intel", "英特爾"] },
  "AVGO": { symbol: "AVGO", en: "Broadcom", cn: "博通", segment: "AI ASIC / Networking", market: "US", aliases: ["Broadcom", "博通"] },
  
  // Cloud + AI
  "MSFT": { symbol: "MSFT", en: "Microsoft", cn: "微軟", segment: "Cloud + AI", market: "US", aliases: ["Microsoft", "微軟", "微软"] },
  "GOOGL": { symbol: "GOOGL", en: "Alphabet (Google)", cn: "谷歌", segment: "AI / Cloud", market: "US", aliases: ["Google", "谷歌", "Alphabet"] },
  "AMZN": { symbol: "AMZN", en: "Amazon", cn: "亞馬遜", segment: "Cloud / AI Infra", market: "US", aliases: ["Amazon", "亞馬遜", "亚马逊"] },
  "ORCL": { symbol: "ORCL", en: "Oracle", cn: "甲骨文", segment: "Cloud", market: "US", aliases: ["Oracle", "甲骨文"] },
  "IBM": { symbol: "IBM", en: "IBM", cn: "IBM", segment: "AI / Enterprise", market: "US", aliases: ["IBM"] },
  
  // AI Devices / Social
  "AAPL": { symbol: "AAPL", en: "Apple", cn: "蘋果", segment: "AI Devices", market: "US", aliases: ["Apple", "蘋果", "苹果"] },
  "META": { symbol: "META", en: "Meta Platforms", cn: "Meta", segment: "AI / Social", market: "US", aliases: ["Meta", "Facebook", "臉書"] },
  
  // EV / AI
  "TSLA": { symbol: "TSLA", en: "Tesla", cn: "特斯拉", segment: "EV / AI", market: "US", aliases: ["Tesla", "特斯拉"] },
  "RIVN": { symbol: "RIVN", en: "Rivian", cn: "Rivian", segment: "EV", market: "US", aliases: ["Rivian"] },
  "LCID": { symbol: "LCID", en: "Lucid", cn: "Lucid", segment: "EV", market: "US", aliases: ["Lucid"] },
  
  // Memory / Networking
  "MU": { symbol: "MU", en: "Micron", cn: "美光", segment: "Memory (HBM AI)", market: "US", aliases: ["Micron", "美光"] },
  "MRVL": { symbol: "MRVL", en: "Marvell", cn: "邁威爾", segment: "Data Infra", market: "US", aliases: ["Marvell", "邁威爾"] },
  "ANET": { symbol: "ANET", en: "Arista Networks", cn: "阿里斯塔網絡", segment: "AI Networking", market: "US", aliases: ["Arista", "ANET"] },
  "CSCO": { symbol: "CSCO", en: "Cisco", cn: "思科", segment: "Networking", market: "US", aliases: ["Cisco", "思科"] },
  "QCOM": { symbol: "QCOM", en: "Qualcomm", cn: "高通", segment: "AI / Mobile Chips", market: "US", aliases: ["Qualcomm", "高通"] },
  
  // AI SaaS / Software
  "CRM": { symbol: "CRM", en: "Salesforce", cn: "賽富時", segment: "AI SaaS", market: "US", aliases: ["Salesforce", "賽富時"] },
  "NOW": { symbol: "NOW", en: "ServiceNow", cn: "服務現在", segment: "AI SaaS", market: "US", aliases: ["ServiceNow"] },
  "SNOW": { symbol: "SNOW", en: "Snowflake", cn: "雪花", segment: "Data Cloud", market: "US", aliases: ["Snowflake"] },
  "PLTR": { symbol: "PLTR", en: "Palantir", cn: "帕蘭提爾", segment: "AI Analytics", market: "US", aliases: ["Palantir"] },
  "DDOG": { symbol: "DDOG", en: "Datadog", cn: "Datadog", segment: "Observability", market: "US", aliases: ["Datadog"] },
  "ADBE": { symbol: "ADBE", en: "Adobe", cn: "奧多比", segment: "AI Creative", market: "US", aliases: ["Adobe", "奧多比"] },
  "INTU": { symbol: "INTU", en: "Intuit", cn: "Intuit", segment: "Fintech AI", market: "US", aliases: ["Intuit"] },
  
  // Cybersecurity
  "CRWD": { symbol: "CRWD", en: "CrowdStrike", cn: "CrowdStrike", segment: "Cybersecurity", market: "US", aliases: ["CrowdStrike"] },
  "PANW": { symbol: "PANW", en: "Palo Alto Networks", cn: "帕羅奧圖", segment: "Cybersecurity", market: "US", aliases: ["Palo Alto"] },
  "FTNT": { symbol: "FTNT", en: "Fortinet", cn: "飛塔", segment: "Cybersecurity", market: "US", aliases: ["Fortinet"] },
  
  // Fintech / Platform
  "SQ": { symbol: "SQ", en: "Block", cn: "Block", segment: "Fintech", market: "US", aliases: ["Block", "Square"] },
  "PYPL": { symbol: "PYPL", en: "PayPal", cn: "貝寶", segment: "Fintech", market: "US", aliases: ["PayPal"] },
  "SHOP": { symbol: "SHOP", en: "Shopify", cn: "Shopify", segment: "E-commerce", market: "US", aliases: ["Shopify"] },
  "UBER": { symbol: "UBER", en: "Uber", cn: "優步", segment: "Mobility AI", market: "US", aliases: ["Uber"] },
  "ABNB": { symbol: "ABNB", en: "Airbnb", cn: "愛彼迎", segment: "Platform AI", market: "US", aliases: ["Airbnb"] },
  
  // Media / Streaming
  "NFLX": { symbol: "NFLX", en: "Netflix", cn: "網飛", segment: "AI Media", market: "US", aliases: ["Netflix"] },
  "DIS": { symbol: "DIS", en: "Disney", cn: "迪士尼", segment: "Streaming", market: "US", aliases: ["Disney"] },
  
  // Energy
  "XOM": { symbol: "XOM", en: "ExxonMobil", cn: "埃克森美孚", segment: "Energy", market: "US", aliases: ["Exxon"] },
  "CVX": { symbol: "CVX", en: "Chevron", cn: "雪佛龍", segment: "Energy", market: "US", aliases: ["Chevron"] },
  "NEE": { symbol: "NEE", en: "NextEra Energy", cn: "新紀元能源", segment: "Clean Energy", market: "US", aliases: ["NextEra"] },
  "CEG": { symbol: "CEG", en: "Constellation Energy", cn: "星座能源", segment: "Nuclear / AI Power", market: "US", aliases: ["Constellation"] },
  "LNG": { symbol: "LNG", en: "Cheniere Energy", cn: "切尼爾能源", segment: "LNG Export", market: "US", aliases: ["Cheniere"] },
  "ENPH": { symbol: "ENPH", en: "Enphase Energy", cn: "Enphase", segment: "Solar", market: "US", aliases: ["Enphase"] },
  "FSLR": { symbol: "FSLR", en: "First Solar", cn: "第一太陽能", segment: "Solar", market: "US", aliases: ["First Solar"] },
  "PLUG": { symbol: "PLUG", en: "Plug Power", cn: "普拉格能源", segment: "Hydrogen", market: "US", aliases: ["Plug"] },
  
  // Chip Equipment
  "AMAT": { symbol: "AMAT", en: "Applied Materials", cn: "應用材料", segment: "Chip Equipment", market: "US", aliases: ["Applied Materials"] },
  "LRCX": { symbol: "LRCX", en: "Lam Research", cn: "科林研發", segment: "Chip Equipment", market: "US", aliases: ["Lam Research"] },
  "KLAC": { symbol: "KLAC", en: "KLA", cn: "科磊", segment: "Chip Inspection", market: "US", aliases: ["KLA"] },
  "SNPS": { symbol: "SNPS", en: "Synopsys", cn: "新思科技", segment: "Chip Design", market: "US", aliases: ["Synopsys"] },
  "CDNS": { symbol: "CDNS", en: "Cadence", cn: "楷登電子", segment: "Chip Design", market: "US", aliases: ["Cadence"] },
  "ASML": { symbol: "ASML", en: "ASML", cn: "艾司摩爾", segment: "Lithography", market: "US", aliases: ["ASML"] },
  
  // ============================================
  // TAIWAN MARKET - Semiconductor & AI Supply Chain (50 stocks)
  // ============================================
  
  // Foundry
  "2330.TW": { symbol: "2330.TW", en: "TSMC", cn: "台積電", segment: "Foundry", market: "TW", aliases: ["TSMC", "台積電", "台积电", "2330", "TSM"] },
  "2303.TW": { symbol: "2303.TW", en: "UMC", cn: "聯電", segment: "Foundry", market: "TW", aliases: ["UMC", "聯電", "联电"] },
  "5347.TW": { symbol: "5347.TW", en: "Vanguard", cn: "世界先進", segment: "Foundry", market: "TW", aliases: ["Vanguard", "世界先進"] },
  
  // IC Design
  "2454.TW": { symbol: "2454.TW", en: "MediaTek", cn: "聯發科", segment: "IC Design", market: "TW", aliases: ["MediaTek", "聯發科", "联发科"] },
  "2379.TW": { symbol: "2379.TW", en: "Realtek", cn: "瑞昱", segment: "IC Design", market: "TW", aliases: ["Realtek", "瑞昱"] },
  "3034.TW": { symbol: "3034.TW", en: "Novatek", cn: "聯詠", segment: "Display IC", market: "TW", aliases: ["Novatek", "聯詠"] },
  "3443.TW": { symbol: "3443.TW", en: "Alchip", cn: "創意", segment: "ASIC AI", market: "TW", aliases: ["Alchip", "創意"] },
  "6643.TW": { symbol: "6643.TW", en: "M31", cn: "M31", segment: "IP Design", market: "TW", aliases: ["M31"] },
  "3529.TW": { symbol: "3529.TW", en: "eMemory", cn: "力旺", segment: "IP", market: "TW", aliases: ["eMemory", "力旺"] },
  "6415.TW": { symbol: "6415.TW", en: "Silergy", cn: "矽力", segment: "Power IC", market: "TW", aliases: ["Silergy", "矽力"] },
  "4966.TW": { symbol: "4966.TW", en: "Parade", cn: "譜瑞", segment: "IC", market: "TW", aliases: ["Parade", "譜瑞"] },
  
  // AI Servers
  "2317.TW": { symbol: "2317.TW", en: "Hon Hai (Foxconn)", cn: "鴻海", segment: "AI Servers", market: "TW", aliases: ["Foxconn", "鴻海", "鸿海"] },
  "2382.TW": { symbol: "2382.TW", en: "Quanta", cn: "廣達", segment: "AI Servers", market: "TW", aliases: ["Quanta", "廣達"] },
  "3231.TW": { symbol: "3231.TW", en: "Wistron", cn: "緯創", segment: "AI Servers", market: "TW", aliases: ["Wistron", "緯創"] },
  "2356.TW": { symbol: "2356.TW", en: "Inventec", cn: "英業達", segment: "Servers", market: "TW", aliases: ["Inventec", "英業達"] },
  "6669.TW": { symbol: "6669.TW", en: "Wiwynn", cn: "緯穎", segment: "AI Servers", market: "TW", aliases: ["Wiwynn", "緯穎"] },
  "4938.TW": { symbol: "4938.TW", en: "Pegatron", cn: "和碩", segment: "Electronics", market: "TW", aliases: ["Pegatron", "和碩"] },
  
  // Power / EV Components
  "2308.TW": { symbol: "2308.TW", en: "Delta Electronics", cn: "台達電", segment: "Power / EV", market: "TW", aliases: ["Delta", "台達電"] },
  "2301.TW": { symbol: "2301.TW", en: "Lite-On", cn: "光寶科", segment: "Power", market: "TW", aliases: ["Lite-On", "光寶科"] },
  "6282.TW": { symbol: "6282.TW", en: "AcBel", cn: "康舒", segment: "Power", market: "TW", aliases: ["AcBel", "康舒"] },
  
  // Packaging
  "3711.TW": { symbol: "3711.TW", en: "ASE", cn: "日月光投控", segment: "Packaging", market: "TW", aliases: ["ASE", "日月光"] },
  "2325.TW": { symbol: "2325.TW", en: "SPIL", cn: "矽品", segment: "Packaging", market: "TW", aliases: ["SPIL", "矽品"] },
  
  // PCB
  "3037.TW": { symbol: "3037.TW", en: "Unimicron", cn: "欣興", segment: "PCB", market: "TW", aliases: ["Unimicron", "欣興"] },
  "2313.TW": { symbol: "2313.TW", en: "Compeq", cn: "華通", segment: "PCB", market: "TW", aliases: ["Compeq", "華通"] },
  "3044.TW": { symbol: "3044.TW", en: "Tripod", cn: "健鼎", segment: "PCB", market: "TW", aliases: ["Tripod", "健鼎"] },
  "8046.TW": { symbol: "8046.TW", en: "Nan Ya PCB", cn: "南電", segment: "PCB", market: "TW", aliases: ["Nan Ya PCB", "南電"] },
  
  // Optics
  "3008.TW": { symbol: "3008.TW", en: "Largan", cn: "大立光", segment: "Optics", market: "TW", aliases: ["Largan", "大立光"] },
  "3406.TW": { symbol: "3406.TW", en: "Genius", cn: "玉晶光", segment: "Optics", market: "TW", aliases: ["Genius", "玉晶光"] },
  
  // Display
  "2409.TW": { symbol: "2409.TW", en: "AUO", cn: "友達", segment: "Display", market: "TW", aliases: ["AUO", "友達"] },
  "3481.TW": { symbol: "3481.TW", en: "Innolux", cn: "群創", segment: "Display", market: "TW", aliases: ["Innolux", "群創"] },
  
  // Memory
  "2408.TW": { symbol: "2408.TW", en: "Nanya Tech", cn: "南亞科", segment: "Memory", market: "TW", aliases: ["Nanya", "南亞科"] },
  "2344.TW": { symbol: "2344.TW", en: "Winbond", cn: "華邦電", segment: "Memory", market: "TW", aliases: ["Winbond", "華邦電"] },
  "2337.TW": { symbol: "2337.TW", en: "Macronix", cn: "旺宏", segment: "Memory", market: "TW", aliases: ["Macronix", "旺宏"] },
  
  // Materials / Silicon Wafers
  "6488.TW": { symbol: "6488.TW", en: "GlobalWafers", cn: "環球晶", segment: "Silicon Wafers", market: "TW", aliases: ["GlobalWafers", "環球晶"] },
  "5483.TW": { symbol: "5483.TW", en: "Sino-American Silicon", cn: "中美晶", segment: "Materials", market: "TW", aliases: ["SAS", "中美晶"] },
  "2383.TW": { symbol: "2383.TW", en: "Elite Material", cn: "台光電", segment: "Materials", market: "TW", aliases: ["Elite", "台光電"] },
  
  // Passive Components
  "2327.TW": { symbol: "2327.TW", en: "Yageo", cn: "國巨", segment: "Passive", market: "TW", aliases: ["Yageo", "國巨"] },
  
  // Casing / Components
  "2474.TW": { symbol: "2474.TW", en: "Catcher", cn: "可成", segment: "Casing", market: "TW", aliases: ["Catcher", "可成"] },
  "2385.TW": { symbol: "2385.TW", en: "Chicony", cn: "群光", segment: "Components", market: "TW", aliases: ["Chicony", "群光"] },
  
  // Server Chips
  "5274.TW": { symbol: "5274.TW", en: "Aspeed", cn: "信驊", segment: "Server Chips", market: "TW", aliases: ["Aspeed", "信驊"] },
  
  // ============================================
  // HONG KONG MARKET - Platform + EV + Energy (50 stocks)
  // ============================================
  
  // Internet / Platform
  "0700.HK": { symbol: "0700.HK", en: "Tencent", cn: "騰訊", segment: "AI / Internet", market: "HK", aliases: ["Tencent", "騰訊", "腾讯"] },
  "9988.HK": { symbol: "9988.HK", en: "Alibaba", cn: "阿里巴巴", segment: "Cloud", market: "HK", aliases: ["Alibaba", "阿里巴巴", "BABA"] },
  "3690.HK": { symbol: "3690.HK", en: "Meituan", cn: "美團", segment: "Platform", market: "HK", aliases: ["Meituan", "美團", "美团"] },
  "9618.HK": { symbol: "9618.HK", en: "JD.com", cn: "京東", segment: "E-commerce", market: "HK", aliases: ["JD", "京東", "京东"] },
  "9888.HK": { symbol: "9888.HK", en: "Baidu", cn: "百度", segment: "AI", market: "HK", aliases: ["Baidu", "百度"] },
  "1810.HK": { symbol: "1810.HK", en: "Xiaomi", cn: "小米", segment: "AIoT / EV", market: "HK", aliases: ["Xiaomi", "小米"] },
  
  // EV / Auto
  "1211.HK": { symbol: "1211.HK", en: "BYD", cn: "比亞迪", segment: "EV", market: "HK", aliases: ["BYD", "比亞迪", "比亚迪"] },
  "9866.HK": { symbol: "9866.HK", en: "NIO", cn: "蔚來", segment: "EV", market: "HK", aliases: ["NIO", "蔚來"] },
  "9868.HK": { symbol: "9868.HK", en: "XPeng", cn: "小鵬", segment: "EV", market: "HK", aliases: ["XPeng", "小鵬"] },
  "2015.HK": { symbol: "2015.HK", en: "Li Auto", cn: "理想", segment: "EV", market: "HK", aliases: ["Li Auto", "理想"] },
  "0175.HK": { symbol: "0175.HK", en: "Geely", cn: "吉利汽車", segment: "EV", market: "HK", aliases: ["Geely", "吉利"] },
  "2333.HK": { symbol: "2333.HK", en: "Great Wall Motor", cn: "長城汽車", segment: "EV", market: "HK", aliases: ["Great Wall", "長城"] },
  
  // Semiconductors (China)
  "0981.HK": { symbol: "0981.HK", en: "SMIC", cn: "中芯國際", segment: "Foundry", market: "HK", aliases: ["SMIC", "中芯"] },
  "1347.HK": { symbol: "1347.HK", en: "Hua Hong Semi", cn: "華虹半導體", segment: "Foundry", market: "HK", aliases: ["Hua Hong", "華虹"] },
  "0285.HK": { symbol: "0285.HK", en: "BYD Electronic", cn: "比亞迪電子", segment: "Components", market: "HK", aliases: ["BYD Electronic", "比亞迪電子"] },
  
  // Components / Hardware
  "0992.HK": { symbol: "0992.HK", en: "Lenovo", cn: "聯想", segment: "AI PCs", market: "HK", aliases: ["Lenovo", "聯想"] },
  "0763.HK": { symbol: "0763.HK", en: "ZTE", cn: "中興通訊", segment: "Telecom", market: "HK", aliases: ["ZTE", "中興"] },
  "2382.HK": { symbol: "2382.HK", en: "Sunny Optical", cn: "舜宇光學", segment: "Optics", market: "HK", aliases: ["Sunny", "舜宇"] },
  "2018.HK": { symbol: "2018.HK", en: "AAC Tech", cn: "瑞聲科技", segment: "Components", market: "HK", aliases: ["AAC", "瑞聲"] },
  "1070.HK": { symbol: "1070.HK", en: "TCL Electronics", cn: "TCL電子", segment: "Electronics", market: "HK", aliases: ["TCL"] },
  "6690.HK": { symbol: "6690.HK", en: "Haier Smart Home", cn: "海爾智家", segment: "Appliances", market: "HK", aliases: ["Haier", "海爾"] },
  
  // Telecom / 5G
  "0941.HK": { symbol: "0941.HK", en: "China Mobile", cn: "中國移動", segment: "5G", market: "HK", aliases: ["China Mobile", "中移動"] },
  "0728.HK": { symbol: "0728.HK", en: "China Telecom", cn: "中國電信", segment: "5G", market: "HK", aliases: ["China Telecom", "中電信"] },
  "0762.HK": { symbol: "0762.HK", en: "China Unicom", cn: "中國聯通", segment: "5G", market: "HK", aliases: ["China Unicom", "聯通"] },
  
  // Financial / Insurance
  "2318.HK": { symbol: "2318.HK", en: "Ping An", cn: "平安", segment: "Fintech", market: "HK", aliases: ["Ping An", "平安"] },
  "1299.HK": { symbol: "1299.HK", en: "AIA", cn: "友邦", segment: "Insurance", market: "HK", aliases: ["AIA", "友邦"] },
  "0388.HK": { symbol: "0388.HK", en: "HKEX", cn: "港交所", segment: "Exchange", market: "HK", aliases: ["HKEX", "港交所"] },
  
  // Energy - Oil & Gas
  "0857.HK": { symbol: "0857.HK", en: "PetroChina", cn: "中石油", segment: "Energy", market: "HK", aliases: ["PetroChina", "中石油"] },
  "0386.HK": { symbol: "0386.HK", en: "Sinopec", cn: "中石化", segment: "Energy", market: "HK", aliases: ["Sinopec", "中石化"] },
  "0883.HK": { symbol: "0883.HK", en: "CNOOC", cn: "中海油", segment: "Energy", market: "HK", aliases: ["CNOOC", "中海油"] },
  
  // Energy - Power / Renewables
  "1088.HK": { symbol: "1088.HK", en: "China Shenhua", cn: "神華", segment: "Coal", market: "HK", aliases: ["Shenhua", "神華"] },
  "0836.HK": { symbol: "0836.HK", en: "China Resources Power", cn: "華潤電力", segment: "Power", market: "HK", aliases: ["CR Power", "華潤電力"] },
  "0916.HK": { symbol: "0916.HK", en: "China Longyuan", cn: "龍源電力", segment: "Wind", market: "HK", aliases: ["Longyuan", "龍源"] },
  "2688.HK": { symbol: "2688.HK", en: "ENN Energy", cn: "新奧能源", segment: "Gas", market: "HK", aliases: ["ENN", "新奧"] },
  "2380.HK": { symbol: "2380.HK", en: "China Power", cn: "中國電力", segment: "Energy", market: "HK", aliases: ["China Power", "中電"] },
  "1071.HK": { symbol: "1071.HK", en: "Huadian Power", cn: "華電", segment: "Power", market: "HK", aliases: ["Huadian", "華電"] },
  
  // Software / AI
  "3888.HK": { symbol: "3888.HK", en: "Kingsoft", cn: "金山軟件", segment: "Software", market: "HK", aliases: ["Kingsoft", "金山"] },
  "0268.HK": { symbol: "0268.HK", en: "Kingdee", cn: "金蝶", segment: "SaaS", market: "HK", aliases: ["Kingdee", "金蝶"] },
  "0020.HK": { symbol: "0020.HK", en: "SenseTime", cn: "商湯", segment: "AI", market: "HK", aliases: ["SenseTime", "商湯"] },
  
  // Data Centers / Infrastructure
  "9698.HK": { symbol: "9698.HK", en: "GDS", cn: "萬國數據", segment: "Data Centers", market: "HK", aliases: ["GDS", "萬國數據"] },
  "0788.HK": { symbol: "0788.HK", en: "China Tower", cn: "中國鐵塔", segment: "Infrastructure", market: "HK", aliases: ["China Tower", "鐵塔"] },
  
  // Logistics / Shipping
  "1919.HK": { symbol: "1919.HK", en: "COSCO Shipping", cn: "中遠海控", segment: "Shipping", market: "HK", aliases: ["COSCO", "中遠"] },
  
  // Metals / Mining
  "2899.HK": { symbol: "2899.HK", en: "Zijin Mining", cn: "紫金礦業", segment: "Metals", market: "HK", aliases: ["Zijin", "紫金"] },
  "0358.HK": { symbol: "0358.HK", en: "Jiangxi Copper", cn: "江西銅業", segment: "Copper", market: "HK", aliases: ["Jiangxi Copper", "江西銅業"] },
  
  // Consumer
  "0291.HK": { symbol: "0291.HK", en: "China Resources Beer", cn: "華潤啤酒", segment: "Consumer", market: "HK", aliases: ["CR Beer", "華潤啤酒"] },
  "1876.HK": { symbol: "1876.HK", en: "Budweiser APAC", cn: "百威亞太", segment: "Consumer", market: "HK", aliases: ["Budweiser", "百威"] },
};

// Find stock by symbol, Chinese name, English name, or alias
export const findStock = (input: string): StockInfo | null => {
  const searchTerm = input.trim().toUpperCase();
  
  // Direct symbol match
  if (STOCK_REGISTRY[searchTerm]) {
    return STOCK_REGISTRY[searchTerm];
  }
  
  // Search by Chinese name or alias
  const found = Object.values(STOCK_REGISTRY).find(stock => {
    if (stock.cn === input.trim()) return true;
    if (stock.en.toUpperCase() === searchTerm) return true;
    return stock.aliases.some(alias => alias.toUpperCase() === searchTerm || alias === input.trim());
  });
  
  return found || null;
};

// Get stocks by market
export const getStocksByMarket = (market: 'US' | 'TW' | 'HK'): StockInfo[] => {
  return Object.values(STOCK_REGISTRY).filter(stock => stock.market === market);
};

// Get stocks by segment
export const getStocksBySegment = (segment: string): StockInfo[] => {
  return Object.values(STOCK_REGISTRY).filter(stock => stock.segment === segment);
};

// Search stocks by keyword
export const searchStocks = (keyword: string): StockInfo[] => {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(STOCK_REGISTRY).filter(stock =>
    stock.en.toLowerCase().includes(lowerKeyword) ||
    stock.cn.includes(lowerKeyword) ||
    stock.segment.toLowerCase().includes(lowerKeyword) ||
    stock.aliases.some(alias => alias.toLowerCase().includes(lowerKeyword))
  );
};
