// constants/locales.ts

export type Language = 'Cantonese' | '简体中文' | 'English';

export interface Translations {
  // Header
  aiStock: string;
  about: string;
  features: string;
  pricing: string;
  login: string;
  loginPortal: string;
  
  // Left Panel
  financeMarketAnalysis: string;
  environmentActive: string;
  
  // Input Area
  enterStockSymbol: string;
  stockExample: string;
  
  // Footer
  disclaimer: string;
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
  contactUs: string;
  
  // Dashboard
  welcomeBack: string;
  creditsRemaining: string;
  currentPlan: string;
  status: string;
  email: string;
  monthlyCoffeePlan: string;
  changePaymentPlan: string;
  unsubscribe: string;
  logout: string;
  active: string;
  
  // Pricing Modal
  wantToChangePlan: string;
  choosePlan: string;
  monthly: string;
  annual: string;
  savePercent: string;
  savePerYear: string;
  explorer: string;
  proLite: string;
  institutional: string;
  free: string;
  perMonth: string;
  perYear: string;
  oneTime: string;
  joinPlan: string;
  topUpCoffeePlan: string;
  getStarted: string;
  goToPlan: string;
  close: string;
  cancel: string;
  
  // Features Lists
  realTimeStockData: string;
  globalNewsUpdates: string;
  multiLanguageVoice: string;
  basicAISummary: string;
  personalUrlInput: string;
  realTimeAIAnalysis: string;
  prioritySupport: string;
  apiAccess: string;
  dedicatedManager: string;
  priorityProcessing: string;
  
  // Unsubscribe Modal
  sadToSeeYouGo: string;
  beforeCancel: string;
  monthlyCoffeePlanDesc: string;
  perfectForCasualUsers: string;
  noCancelAnyway: string;
  downgradeInstead: string;
  returnToDashboard: string;
  helpUsImprove: string;
  tellUsWhy: string;
  selectAllThatApply: string;
  continueToStripe: string;
  back: string;
  confirmCancellation: string;
  subscriptionEndMessage: string;
  
  // Source Menu
  addAnalysisSource: string;
  addAdditionalContext: string;
  analyzeNewsLinks: string;
  pasteLinks: string;
  takePhoto: string;
  scanReports: string;
  uploadFile: string;
  uploadData: string;
  returnToAnalysis: string;
  
  // Voice/Analysis
  awaitingMarketSignal: string;
  analyzingMarket: string;
  technicalMomentum: string;
  marketStrategyReport: string;
  verifiedAIInsight: string;
  live: string;
  rsi: string;
  macd: string;
  current: string;
  high: string;
  low: string;
  volume: string;
  change: string;
  
  // Auth Modal
  welcomeBack: string;
  createAccount: string;
  yourNameOptional: string;
  emailAddress: string;
  password: string;
  signIn: string;
  signUp: string;
  or: string;
  signInWithGoogle: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  
  // Terms Modal
  termsOfServiceTitle: string;
  legalAgreement: string;
  eligibility: string;
  eligibilityText: string;
  serviceNature: string;
  serviceNatureText: string;
  userResponsibility: string;
  userResponsibilityText: string;
  disclaimerTitle: string;
  disclaimerText: string;
  privacyPolicyTitle: string;
  dataCollection: string;
  dataCollectionText: string;
  paymentSecurity: string;
  paymentSecurityText: string;
  dataRetention: string;
  dataRetentionText: string;
  welcomeBonus: string;
  acceptCredits: string;
  decline: string;
  acceptGetCredits: string;
  scrollToAccept: string;
  
  // Mobile
  hiWeAre: string;
  welcomeMessage: string;
}

export const translations: Record<Language, Translations> = {
  Cantonese: {
    // Header
    aiStock: 'AI 股票',
    about: '關於',
    features: '功能',
    pricing: '價格',
    login: '登入',
    loginPortal: '登入',
    
    // Left Panel
    financeMarketAnalysis: '金融與市場分析',
    environmentActive: '環境啟用中',
    
    // Input Area
    enterStockSymbol: '輸入股票代號',
    stockExample: '例如：0700.hk, TSLA 或 2330.TW',
    
    // Footer
    disclaimer: '免責聲明',
    termsOfService: '服務條款',
    privacyPolicy: '隱私政策',
    refundPolicy: '退款政策',
    contactUs: '聯絡我們',
    
    // Dashboard
    welcomeBack: '歡迎回來',
    creditsRemaining: '剩餘積分',
    currentPlan: '當前計劃',
    status: '狀態',
    email: '電子郵件',
    monthlyCoffeePlan: '☕ 每月咖啡計劃',
    changePaymentPlan: '更改付款計劃',
    unsubscribe: '取消訂閱',
    logout: '登出',
    active: '啟用中',
    
    // Pricing Modal
    wantToChangePlan: '想換成更低成本的計劃來節省開支？',
    choosePlan: '選擇更適合您需求的計劃',
    monthly: '月付',
    annual: '年付',
    savePercent: '節省 20%',
    savePerYear: '每年節省',
    explorer: '探索者',
    proLite: '專業精簡版',
    institutional: '機構版',
    free: '免費',
    perMonth: '/月',
    perYear: '/年',
    oneTime: '一次性',
    joinPlan: '加入計劃',
    topUpCoffeePlan: '咖啡計劃加值',
    getStarted: '開始使用',
    goToPlan: '選擇計劃',
    close: '關閉',
    cancel: '取消',
    
    // Features Lists
    realTimeStockData: '即時股票數據 - 港股/台股/美股',
    globalNewsUpdates: '全球新聞更新',
    multiLanguageVoice: '粵語、國語及英語語音支援',
    basicAISummary: '基礎 AI 摘要與分析',
    personalUrlInput: '個人 URL 輸入分析',
    realTimeAIAnalysis: '即時 AI 無偏見分析',
    prioritySupport: '優先電郵支援',
    apiAccess: 'API 存取',
    dedicatedManager: '專屬客戶經理',
    priorityProcessing: '優先處理',
    
    // Unsubscribe Modal
    sadToSeeYouGo: '我們很遺憾看到您離開！😢',
    beforeCancel: '在取消之前，您是否考慮降級到更實惠的計劃？',
    monthlyCoffeePlanDesc: '☕ 每月咖啡計劃',
    perfectForCasualUsers: '非常適合休閒用戶',
    noCancelAnyway: '不，仍然取消',
    downgradeInstead: '改為降級',
    returnToDashboard: '返回儀表板',
    helpUsImprove: '幫助我們改進',
    tellUsWhy: '請告訴我們您取消的原因',
    selectAllThatApply: '（可選擇多項）',
    continueToStripe: '前往 Stripe 繼續',
    back: '返回',
    confirmCancellation: '確認取消',
    subscriptionEndMessage: '您的訂閱將在當前計費週期結束時終止。',
    
    // Source Menu
    addAnalysisSource: '新增分析來源',
    addAdditionalContext: '為 AI 分析添加額外內容',
    analyzeNewsLinks: '分析新聞連結',
    pasteLinks: '貼上 Motley Fool、CNBC 等連結',
    takePhoto: '拍照或上傳文件',
    scanReports: '掃描實體報告或螢幕截圖',
    uploadFile: '上傳數據文件',
    uploadData: 'PDF、CSV 或技術圖表',
    returnToAnalysis: '返回分析',
    
    // Voice/Analysis
    awaitingMarketSignal: '等待市場信號',
    analyzingMarket: '分析市場中...',
    technicalMomentum: '技術動能',
    marketStrategyReport: '市場策略報告',
    verifiedAIInsight: 'AI 驗證洞察',
    live: '即時',
    rsi: 'RSI',
    macd: 'MACD',
    current: '現價',
    high: '最高',
    low: '最低',
    volume: '成交量',
    change: '漲跌幅',
    
    // Auth Modal
    welcomeBack: '歡迎回來',
    createAccount: '創建帳戶',
    yourNameOptional: '您的姓名（選填）',
    emailAddress: '電子郵件',
    password: '密碼',
    signIn: '登入',
    signUp: '註冊',
    or: '或',
    signInWithGoogle: '使用 Google 登入',
    dontHaveAccount: '還沒有帳戶？註冊',
    alreadyHaveAccount: '已有帳戶？登入',
    
    // Terms Modal
    termsOfServiceTitle: '服務條款與法律協議',
    legalAgreement: '請仔細閱讀後接受',
    eligibility: '資格',
    eligibilityText: '僅限法定成年人（18 歲以上）使用。',
    serviceNature: '服務性質',
    serviceNatureText: '市場數據摘要和 AI 分析 - 非財務建議。',
    userResponsibility: '用戶責任',
    userResponsibilityText: '所有行動均為自主決策。',
    disclaimerTitle: '免責聲明',
    disclaimerText: '提供之數據基於「大數據演算法」及「數學模型」，不構成投資建議。',
    privacyPolicyTitle: '隱私政策',
    dataCollection: '資料收集',
    dataCollectionText: '僅收集必要的帳戶資訊。',
    paymentSecurity: '支付安全',
    paymentSecurityText: '由 Stripe 安全處理。',
    dataRetention: '資料保留',
    dataRetentionText: '帳戶停用後自動刪除。',
    welcomeBonus: '🎁 歡迎獎勵！',
    acceptCredits: '接受後立即獲得 100 免費積分，成為探索者會員！',
    decline: '拒絕',
    acceptGetCredits: '接受並獲得 100 積分',
    scrollToAccept: '請滾動至底部以啟用接受',
    
    // Mobile
    hiWeAre: '您好，我們是 Michael 和 Teresa',
    welcomeMessage: '金融專家和數據分析助理。歡迎加入探索全球 AI 新聞和股票分析。點擊感興趣的主題開始您的旅程。',
  },
  
  '简体中文': {
    // Header
    aiStock: 'AI 股票',
    about: '关于',
    features: '功能',
    pricing: '价格',
    login: '登录',
    loginPortal: '登录',
    
    // Left Panel
    financeMarketAnalysis: '金融与市场分析',
    environmentActive: '环境启用中',
    
    // Input Area
    enterStockSymbol: '输入股票代号',
    stockExample: '例如：0700.hk, TSLA 或 2330.TW',
    
    // Footer
    disclaimer: '免责声明',
    termsOfService: '服务条款',
    privacyPolicy: '隐私政策',
    refundPolicy: '退款政策',
    contactUs: '联系我们',
    
    // Dashboard
    welcomeBack: '欢迎回来',
    creditsRemaining: '剩余积分',
    currentPlan: '当前计划',
    status: '状态',
    email: '电子邮件',
    monthlyCoffeePlan: '☕ 每月咖啡计划',
    changePaymentPlan: '更改付款计划',
    unsubscribe: '取消订阅',
    logout: '登出',
    active: '启用中',
    
    // Pricing Modal
    wantToChangePlan: '想换成更低成本的计划来节省开支？',
    choosePlan: '选择更适合您需求的计划',
    monthly: '月付',
    annual: '年付',
    savePercent: '节省 20%',
    savePerYear: '每年节省',
    explorer: '探索者',
    proLite: '专业精简版',
    institutional: '机构版',
    free: '免费',
    perMonth: '/月',
    perYear: '/年',
    oneTime: '一次性',
    joinPlan: '加入计划',
    topUpCoffeePlan: '咖啡计划充值',
    getStarted: '开始使用',
    goToPlan: '选择计划',
    close: '关闭',
    cancel: '取消',
    
    // Features Lists
    realTimeStockData: '实时股票数据 - 港股/台股/美股',
    globalNewsUpdates: '全球新闻更新',
    multiLanguageVoice: '粤语、国语及英语语音支持',
    basicAISummary: '基础 AI 摘要与分析',
    personalUrlInput: '个人 URL 输入分析',
    realTimeAIAnalysis: '实时 AI 无偏见分析',
    prioritySupport: '优先电邮支持',
    apiAccess: 'API 存取',
    dedicatedManager: '专属客户经理',
    priorityProcessing: '优先处理',
    
    // Unsubscribe Modal
    sadToSeeYouGo: '我们很遗憾看到您离开！😢',
    beforeCancel: '在取消之前，您是否考虑降级到更实惠的计划？',
    monthlyCoffeePlanDesc: '☕ 每月咖啡计划',
    perfectForCasualUsers: '非常适合休闲用户',
    noCancelAnyway: '不，仍然取消',
    downgradeInstead: '改为降级',
    returnToDashboard: '返回仪表板',
    helpUsImprove: '帮助我们改进',
    tellUsWhy: '请告诉我们您取消的原因',
    selectAllThatApply: '（可选择多项）',
    continueToStripe: '前往 Stripe 继续',
    back: '返回',
    confirmCancellation: '确认取消',
    subscriptionEndMessage: '您的订阅将在当前计费周期结束时终止。',
    
    // Source Menu
    addAnalysisSource: '新增分析来源',
    addAdditionalContext: '为 AI 分析添加额外内容',
    analyzeNewsLinks: '分析新闻链接',
    pasteLinks: '贴上 Motley Fool、CNBC 等链接',
    takePhoto: '拍照或上传文件',
    scanReports: '扫描实体报告或屏幕截图',
    uploadFile: '上传数据文件',
    uploadData: 'PDF、CSV 或技术图表',
    returnToAnalysis: '返回分析',
    
    // Voice/Analysis
    awaitingMarketSignal: '等待市场信号',
    analyzingMarket: '分析市场中...',
    technicalMomentum: '技术动能',
    marketStrategyReport: '市场策略报告',
    verifiedAIInsight: 'AI 验证洞察',
    live: '实时',
    rsi: 'RSI',
    macd: 'MACD',
    current: '现价',
    high: '最高',
    low: '最低',
    volume: '成交量',
    change: '涨跌幅',
    
    // Auth Modal
    welcomeBack: '欢迎回来',
    createAccount: '创建账户',
    yourNameOptional: '您的姓名（选填）',
    emailAddress: '电子邮件',
    password: '密码',
    signIn: '登录',
    signUp: '注册',
    or: '或',
    signInWithGoogle: '使用 Google 登录',
    dontHaveAccount: '还没有账户？注册',
    alreadyHaveAccount: '已有账户？登录',
    
    // Terms Modal
    termsOfServiceTitle: '服务条款与法律协议',
    legalAgreement: '请仔细阅读后接受',
    eligibility: '资格',
    eligibilityText: '仅限法定成年人（18 岁以上）使用。',
    serviceNature: '服务性质',
    serviceNatureText: '市场数据摘要和 AI 分析 - 非财务建议。',
    userResponsibility: '用户责任',
    userResponsibilityText: '所有行动均为自主决策。',
    disclaimerTitle: '免责声明',
    disclaimerText: '提供之数据基于「大数据演算法」及「数学模型」，不构成投资建议。',
    privacyPolicyTitle: '隐私政策',
    dataCollection: '资料收集',
    dataCollectionText: '仅收集必要的账户信息。',
    paymentSecurity: '支付安全',
    paymentSecurityText: '由 Stripe 安全处理。',
    dataRetention: '资料保留',
    dataRetentionText: '账户停用后自动删除。',
    welcomeBonus: '🎁 欢迎奖励！',
    acceptCredits: '接受后立即获得 100 免费积分，成为探索者会员！',
    decline: '拒绝',
    acceptGetCredits: '接受并获得 100 积分',
    scrollToAccept: '请滚动至底部以启用接受',
    
    // Mobile
    hiWeAre: '您好，我们是 Michael 和 Teresa',
    welcomeMessage: '金融专家和数据分析助理。欢迎加入探索全球 AI 新闻和股票分析。点击感兴趣的主题开始您的旅程。',
  },
  
  English: {
    // Header
    aiStock: 'AI STOCK',
    about: 'ABOUT',
    features: 'FEATURES',
    pricing: 'PRICING',
    login: 'Login',
    loginPortal: 'Login',
    
    // Left Panel
    financeMarketAnalysis: 'Finance & Market Analysis',
    environmentActive: 'Environment Active',
    
    // Input Area
    enterStockSymbol: 'Enter Stock Symbol',
    stockExample: 'e.g.: 0700.hk, TSLA or 2330.TW',
    
    // Footer
    disclaimer: 'DISCLAIMER',
    termsOfService: 'TERMS OF SERVICE',
    privacyPolicy: 'PRIVACY POLICY',
    refundPolicy: 'REFUND POLICY',
    contactUs: 'CONTACT US',
    
    // Dashboard
    welcomeBack: 'Welcome Back',
    creditsRemaining: 'Credits Remaining',
    currentPlan: 'Current Plan',
    status: 'Status',
    email: 'Email',
    monthlyCoffeePlan: '☕ Monthly Coffee Plan',
    changePaymentPlan: 'Change Payment Plan',
    unsubscribe: 'Unsubscribe',
    logout: 'Logout',
    active: 'Active',
    
    // Pricing Modal
    wantToChangePlan: 'Want to change to a lower cost plan to save cost?',
    choosePlan: 'Choose a plan that better fits your needs',
    monthly: 'Monthly',
    annual: 'Annual',
    savePercent: 'Save 20%',
    savePerYear: 'Save',
    explorer: 'EXPLORER',
    proLite: 'PRO LITE',
    institutional: 'INSTITUTIONAL',
    free: 'FREE',
    perMonth: '/mo',
    perYear: '/yr',
    oneTime: 'one-time',
    joinPlan: 'Join the Plan',
    topUpCoffeePlan: 'Top-up Coffee Plan',
    getStarted: 'Get Started',
    goToPlan: 'Go to Plan',
    close: 'Close',
    cancel: 'Cancel',
    
    // Features Lists
    realTimeStockData: 'Real time Stock data - HK/TW/US markets',
    globalNewsUpdates: 'Key Global News updates',
    multiLanguageVoice: 'Cantonese, Mandarin & English voice support',
    basicAISummary: 'Basic AI summary & Analysis',
    personalUrlInput: 'Personal URL input for analysis',
    realTimeAIAnalysis: 'Real time AI summary without bias',
    prioritySupport: 'Priority email support',
    apiAccess: 'API access',
    dedicatedManager: 'Dedicated account manager',
    priorityProcessing: 'Priority processing',
    
    // Unsubscribe Modal
    sadToSeeYouGo: "We're sad to see you go! 😢",
    beforeCancel: 'Before you cancel, would you consider downgrading to a more affordable plan?',
    monthlyCoffeePlanDesc: '☕ Monthly Coffee Plan',
    perfectForCasualUsers: 'Perfect for casual users',
    noCancelAnyway: 'No, cancel anyway',
    downgradeInstead: 'Downgrade Instead',
    returnToDashboard: 'Return to Dashboard',
    helpUsImprove: 'Help us improve',
    tellUsWhy: 'Please tell us why you\'re cancelling',
    selectAllThatApply: '(select all that apply)',
    continueToStripe: 'Continue to Stripe',
    back: 'Back',
    confirmCancellation: 'Confirm Cancellation',
    subscriptionEndMessage: 'Your subscription will end at the current billing period.',
    
    // Source Menu
    addAnalysisSource: 'Add Analysis Source',
    addAdditionalContext: 'Add additional context for AI analysis',
    analyzeNewsLinks: 'Analyze News Links',
    pasteLinks: 'Paste links from Motley Fool, CNBC, etc.',
    takePhoto: 'Take Photo or Upload File',
    scanReports: 'Scan physical reports or screens',
    uploadFile: 'Upload Data File',
    uploadData: 'PDF, CSV, or Technical Sheets',
    returnToAnalysis: 'RETURN TO ANALYSIS',
    
    // Voice/Analysis
    awaitingMarketSignal: 'Awaiting Market Signal',
    analyzingMarket: 'Analyzing Market...',
    technicalMomentum: 'Technical Momentum',
    marketStrategyReport: 'Market Strategy Report',
    verifiedAIInsight: 'Verified AI Insight',
    live: 'Live',
    rsi: 'RSI',
    macd: 'MACD',
    current: 'Current',
    high: 'High',
    low: 'Low',
    volume: 'Volume',
    change: 'Change',
    
    // Auth Modal
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    yourNameOptional: 'Your name (optional)',
    emailAddress: 'Email address',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    or: 'or',
    signInWithGoogle: 'Sign in with Google',
    dontHaveAccount: "Don't have an account? Sign Up",
    alreadyHaveAccount: 'Already have an account? Sign In',
    
    // Terms Modal
    termsOfServiceTitle: 'Terms of Service & Legal Agreement',
    legalAgreement: 'Please read carefully before accepting',
    eligibility: 'Eligibility',
    eligibilityText: 'For legal adults only (18+).',
    serviceNature: 'Service Nature',
    serviceNatureText: 'Market data summaries and AI analysis - NOT financial advice.',
    userResponsibility: 'User Responsibility',
    userResponsibilityText: 'All actions are independent decisions.',
    disclaimerTitle: 'Disclaimer',
    disclaimerText: "Data provided is based on 'Big Data Algorithms' and 'Mathematical Models' and does not constitute investment advice.",
    privacyPolicyTitle: 'Privacy Policy',
    dataCollection: 'Data Collection',
    dataCollectionText: 'Only necessary account information.',
    paymentSecurity: 'Payment Security',
    paymentSecurityText: 'Securely processed by Stripe.',
    dataRetention: 'Data Retention',
    dataRetentionText: 'Deleted upon account deactivation.',
    welcomeBonus: '🎁 Welcome Bonus!',
    acceptCredits: 'Accept to receive 100 FREE credits as an Explorer member!',
    decline: 'Decline',
    acceptGetCredits: 'Accept & Get 100 Credits',
    scrollToAccept: 'Please scroll to the bottom to accept',
    
    // Mobile
    hiWeAre: 'Hi, we are Michael and Teresa',
    welcomeMessage: 'Finance Specialist and Data Analysis assistance. Welcome to join and explore the Global AI News and Stock Analysis. Let\'s start the journey by clicking on the interest topics.',
  },
};

// Helper function to get translations based on language
export function useTranslation(langKey: string): Translations {
  if (langKey === 'Cantonese') return translations.Cantonese;
  if (langKey === '简体中文') return translations['简体中文'];
  return translations.English;
}