import React, { useState } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Share2, 
  Volume2, 
  Languages, 
  LineChart, 
  Globe, 
  Smartphone, 
  Sparkles, 
  Shield,
  Video,
  FileAudio,
  Subtitles,
  Zap,
  Clock,
  Mic,
  FileDown,
  CheckCircle,
  X,
  Info,
  Play,
  Download,
  HelpCircle,
  Music,
  File,
  ArrowRight,
  AlertCircle,
  Bot,
  MessageSquare,
  Link,
  Search,
  BarChart,
  PieChart,
  TrendingDown,
  DollarSign,
  Calendar,
  Newspaper,
  Cpu,
  Database,
  Network,
  Eye,
  ListChecks
} from 'lucide-react';

export const FeaturesSection = ({ lang }: { lang: string }) => {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTraditional = lang === 'Traditional Chinese';
  const isSimplified = lang === 'Simplified Chinese';
  
  const getText = () => {
    if (isTraditional) {
      return {
        badge: '✨ 全新 AI 智能體驗',
        title: '智能分析 × 影音創作者工具',
        subtitle: '融合市場洞察與高效率 AI 媒體轉換，打造下一代數位生產力',
        categories: {
          media: '創作者影音工具',
          stock: 'AI 投資與市場洞察',
          core: '全球化與核心體驗'
        },
        features: [
          { 
            category: 'media',
            icon: <FileAudio size={28} />, 
            title: 'MP3/WAV 語音生成', 
            desc: '自動將文字轉換為高品質語音，支援 WAV 無損與 MP3 壓縮格式。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #FF007A 0%, #9300FF 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: '將您的文字稿轉換為自然流暢的語音輸出，支援多種語言和聲音選擇。',
              bestPractices: [
                '建議文字長度：50-5,000 字元（約 10-20 分鐘語音）',
                '中文文字建議使用 Cantonese 或 Mandarin 語音',
                '英文文字建議使用 English 語音',
                'WAV 格式：無損音質，適合專業編輯',
                'MP3 格式：壓縮格式，檔案較小，適合網路分享'
              ],
              steps: [
                '貼上或上傳您的文字稿（支援 .txt, .docx）',
                '選擇語音語言（Cantonese, Mandarin, English）',
                '選擇聲音角色（Aasing, Sinji, Tingting 等）',
                '調整語速（0.8x - 1.2x）',
                '點擊「生成套件」獲取音檔'
              ],
              tips: [
                '💡 預覽功能可試聽 5 秒語音效果',
                '💡 1000 字元約可生成 3-4 分鐘語音',
                '💡 支援批次生成多段語音',
                '💡 語音檔案命名：vibeailink_voice_[時間戳].wav/mp3'
              ],
              limitations: [
                '最大建議長度：10,000 字元',
                '生成時間依文字長度而定（約 0.5-30 秒）',
                '需安裝 macOS 系統語音',
                '僅支援 macOS 系統'
              ],
              voiceWarning: {
                title: '⚠️ 語音選擇重要提示',
                message: '如果您的電腦未安裝所需的語音，或您選擇的語音無法使用，請使用「Auto-Male (Cloud)」或「Auto-Female (Cloud)」雲端語音選項。這些雲端語音由 AI 驅動，無需本地安裝，可直接在網頁版使用，確保您能順利生成高品質語音。',
                cloudVoices: '☁️ 雲端語音（Auto-Male / Auto-Female）無需安裝，可直接在網頁版使用',
                localVoices: '💻 本地語音需安裝 macOS 系統語音，僅限桌面版使用'
              }
            }
          },
          { 
            category: 'media',
            icon: <Subtitles size={28} />, 
            title: 'SRT 字幕生成與同步', 
            desc: '一鍵提取音訊字幕，支援多國語言 SRT 字幕導出與精準時間軸同步。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: '自動為您的語音生成精確的時間軸字幕，支援雙語翻譯和 YouTube 章節標記。',
              bestPractices: [
                '建議文字長度：50-5,000 字元',
                '字幕會自動與語音時間軸同步',
                '支援雙語字幕輸出（主語言 + 翻譯語言）',
                'SRT 格式相容於所有主流影片編輯軟體',
                '可選擇翻譯語言：English, Traditional Chinese, Simplified Chinese'
              ],
              steps: [
                '生成語音後自動產生字幕',
                '選擇翻譯語言（可選）',
                '下載 SRT 字幕檔',
                '匯入影片編輯軟體（CapCut, Premiere, Final Cut）',
                '字幕會自動與語音對齊'
              ],
              tips: [
                '💡 字幕會與 MP3/WAV 音檔完美同步',
                '💡 可產生 YouTube 章節標記',
                '💡 支援雙語字幕同時顯示',
                '💡 字幕檔案命名：vibeailink_subtitle_[時間戳].srt'
              ],
              limitations: [
                '字幕同步精確度依語音生成品質而定',
                '翻譯功能為輔助性質，專業使用建議人工校對',
                '僅支援文字轉語音生成的字幕',
                '不支援即時語音辨識'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <LineChart size={28} />, 
            title: '即時股票分析', 
            desc: '支援港股、台股、美股，輸入股票代號或新聞連結，獲取完整技術分析與 AI 洞察報告。', 
            gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            linkTo: 'stockAnalysis',
            detailed: {
              description: '全面股票分析工具 - 輸入股票代號或貼上新聞連結，獲得技術指標、基本面數據和 AI 生成的分析報告，甚至可將分析轉為語音。',
              features: [
                '📊 即時技術指標（RSI, MACD, 移動平均線等）',
                '📰 AI 新聞分析 - 貼上連結獲取市場影響評估',
                '🎙️ 語音分析報告 - 將分析結果轉為語音輸出',
                '📈 動態價格圖表與趨勢線',
                '🤖 AI 信心評分與投資建議',
                '🔔 自定義關注清單'
              ],
              bestPractices: [
                '輸入完整股票代號（如：0700.HK, 2330.TW, AAPL）',
                '貼上新聞連結獲取 AI 摘要與市場影響分析',
                '使用「AI 增強」獲取更深入的分析報告',
                '可將分析結果直接轉為語音和字幕'
              ],
              steps: [
                '在搜尋欄輸入股票代號或貼上新聞連結',
                '點擊「分析」按鈕獲取即時數據',
                '查看技術指標、圖表和 AI 分析報告',
                '點擊「語音分析」將報告轉為語音',
                '下載分析報告或語音檔案'
              ],
              tips: [
                '💡 支援港股、台股、美股三大市場',
                '💡 AI 新聞分析可快速評估市場影響',
                '💡 分析結果可轉為語音，方便收聽',
                '💡 加入關注清單，即時追蹤持股'
              ],
              limitations: [
                '數據來源為公開市場數據，延遲約 15 分鐘',
                'AI 分析僅供參考，不構成投資建議',
                '新聞分析需提供有效連結'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <Newspaper size={28} />, 
            title: 'AI 新聞提煉與聊天助理', 
            desc: '貼上新聞連結，AI 自動摘要關鍵字並評估市場走勢影響。也可使用 AI 助理進行深度對話與腳本創作。', 
            gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
            linkTo: 'aiAssistant',
            detailed: {
              description: '多功能 AI 新聞分析與創作助理 - 貼上新聞連結獲取即時摘要，或與 AI 助理對話進行深度研究、腳本創作和內容規劃。',
              features: [
                '📰 新聞連結自動摘要與關鍵字提取',
                '📊 市場影響評估與情緒分析',
                '💬 AI 助理對話 - 問任何問題',
                '📝 影片腳本創作與大綱生成',
                '🎯 內容規劃與 SEO 建議',
                '🔍 深度市場研究與競品分析'
              ],
              bestPractices: [
                '貼上完整新聞連結獲取最佳摘要效果',
                '使用 AI 助理進行頭腦風暴和創意發想',
                '輸入主題獲取影片腳本大綱',
                '結合市場分析與腳本創作，製作優質內容'
              ],
              steps: [
                '在 AI 助理輸入框貼上新聞連結或問題',
                'AI 自動摘要並提供市場影響評估',
                '與 AI 助理對話，深入探討任何主題',
                '使用「腳本創作」功能生成影片腳本',
                '將腳本直接傳送到語音生成功能'
              ],
              tips: [
                '💡 AI 助理可回答任何投資相關問題',
                '💡 支援多輪對話，記憶上下文',
                '💡 生成的腳本可直接用於語音生成',
                '💡 整合多種先進 AI 引擎'
              ],
              limitations: [
                '新聞分析需提供有效連結',
                'AI 生成內容僅供參考，建議人工校對',
                '腳本生成需明確主題和方向'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <Shield size={28} />, 
            title: 'AI 信心評分', 
            desc: '0-100% 多維度風險評估與五星評分機制，輔助理性決策。', 
            gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
            linkTo: 'watchlist',
            detailed: {
              description: 'AI 信心評分是綜合技術指標、基本面數據和市場情緒的多維度評估系統。在您的關注列表中，每個股票都會顯示即時的 RSI、MACD 和趨勢信號，讓您一眼掌握所有持股的狀況。',
              features: [
                '📊 即時 RSI(14) 指標 - 超賣/超買信號一目瞭然',
                '📈 MACD 動能指標 - 看多/看空趨勢判斷',
                '🎯 買入/賣出/持有信號 - 🟢 綠色買入 / 🔴 紅色賣出 / ⚪ 灰色持有',
                '📋 關注列表整合 - 所有股票狀態集中顯示',
                '📊 價格與變化 - 即時價格和漲跌百分比',
                '📈 趨勢判斷 - 上升/下降/盤整趨勢圖標'
              ],
              watchlistBenefits: [
                '⭐ 一頁掌握所有持股狀況',
                '⏱️ 節省時間 - 無需逐一查看每支股票',
                '🎯 快速決策 - 信號一目瞭然',
                '📊 多維度分析 - RSI、MACD、趨勢綜合判斷'
              ],
              bestPractices: [
                '將您關注的股票加入關注列表',
                '定期查看關注列表的信號變化',
                '🟢 綠色信號（RSI < 30）可考慮買入',
                '🔴 紅色信號（RSI > 70）可考慮賣出',
                '⚪ 灰色信號（RSI 30-70）建議持有觀望'
              ],
              steps: [
                '點擊「⭐ 關注列表」按鈕',
                '查看所有持股的即時信號',
                '點擊任何股票查看完整分析報告',
                '根據信號做出投資決策',
                '定期刷新獲取最新數據'
              ],
              tips: [
                '💡 綠色 🟢 = RSI低於30 (超賣) - 考慮買入',
                '💡 紅色 🔴 = RSI高於70 (超買) - 考慮賣出',
                '💡 灰色 ⚪ = RSI 30-70 (中性) - 持有觀望',
                '💡 點擊股票可查看完整分析報告',
                '💡 支援港股、台股、美股三大市場'
              ],
              limitations: [
                '數據來源為公開市場數據，延遲約 15 分鐘',
                'AI 信號僅供參考，不構成投資建議',
                'RSI 和 MACD 為技術指標，需結合其他因素判斷'
              ]
            }
          },
          // Global & Experience Features
          { 
            category: 'core',
            icon: <Volume2 size={28} />, 
            title: '多語音 AI 朗讀', 
            desc: '粵語、國語、普通話、英語自然語音，自由切換監聽。', 
            gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: '支援粵語、國語、普通話、英語四種自然語音，並提供雲端 Auto-Male 和 Auto-Female 語音選項，無需本地安裝即可使用。',
              features: [
                '🎙️ 粵語 (Cantonese) - 香港/廣東地區用語',
                '🎙️ 國語 (Mandarin) - 台灣標準用語',
                '🎙️ 普通話 (Putonghua) - 中國大陸標準用語',
                '🎙️ 英語 (English) - 國際通用語言',
                '☁️ Auto-Male (Cloud) - AI 雲端男聲，無需安裝',
                '☁️ Auto-Female (Cloud) - AI 雲端女聲，無需安裝'
              ],
              bestPractices: [
                '中文內容建議使用粵語、國語或普通話',
                '英文內容建議使用英語',
                '如本地無語音，請使用 Auto-Male 或 Auto-Female 雲端語音',
                '雲端語音可在網頁版直接使用'
              ],
              steps: [
                '在語音生成面板選擇語言',
                '選擇聲音角色（Aasing, Sinji, Tingting 等）',
                '如需雲端語音，選擇 Auto-Male 或 Auto-Female',
                '調整語速後生成語音'
              ],
              tips: [
                '💡 雲端語音 Auto-Male / Auto-Female 無需安裝',
                '💡 粵語在網頁版使用國語發音作為替代',
                '💡 本地語音需 macOS 系統支援',
                '💡 可自由切換不同語言和聲音'
              ],
              limitations: [
                '粵語在網頁版使用國語發音作為替代',
                '本地語音需 macOS 系統',
                '雲端語音需要網路連線'
              ]
            }
          },
          { 
            category: 'core',
            icon: <Languages size={28} />, 
            title: '多國語言介面', 
            desc: '繁體中文、簡體中文、英文獨立控制，無縫全球運作。', 
            gradient: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)',
            linkTo: 'languageInterface',
            detailed: {
              description: '完整的多語言支援，讓您在全球市場中無縫切換，享受一致的用戶體驗。',
              features: [
                '🌐 繁體中文 - 完整台灣、香港用語',
                '🌐 簡體中文 - 中國大陸用語優化',
                '🌐 English - 國際通用語言'
              ],
              applications: [
                '📊 AI 股票分析 - 所有分析報告支援三種語言',
                '💬 AI 助理 - 用您的語言進行對話',
                '🎙️ 語音生成 - 支援中英文語音輸出',
                '📝 字幕生成 - SRT 支援多語言翻譯'
              ],
              bestPractices: [
                '在設定中選擇您的偏好語言',
                '所有內容會自動切換至所選語言',
                '語音生成支援中英文雙語輸出',
                '字幕可選擇單一語言或雙語顯示'
              ],
              steps: [
                '點擊右上角語言切換按鈕',
                '選擇您的偏好語言（繁體中文、簡體中文、英文）',
                '頁面會自動重新整理並切換語言',
                '所有功能模組都會使用所選語言',
                '無需登出即可即時切換'
              ],
              tips: [
                '💡 語言設定影響所有功能模組',
                '💡 切換語言無需重新載入頁面',
                '💡 語音生成會自動匹配所選語言',
                '💡 支援即時語言切換，無需登出'
              ],
              limitations: [
                '部分翻譯可能需要人工校對',
                '語音生成僅支援中英文'
              ]
            }
          },
          { 
            category: 'core',
            icon: <Sparkles size={28} />, 
            title: '多模型 AI 增強引擎', 
            desc: '引領業界的多核心 AI 引擎架構，深度整合最先進的語言模型與分析能力，為您提供無與倫比的智能體驗。', 
            gradient: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)',
            linkTo: 'aiEngine',
            detailed: {
              description: '我們的多模型 AI 增強引擎是 vIbeAiLink 的核心技術優勢，透過智慧路由與動態調度，為每個任務選擇最適合的 AI 模型，確保最佳效能與準確性。',
              features: [
                '🧠 智慧模型路由 - 自動為任務選擇最佳 AI',
                '⚡ 動態效能優化 - 即時調整運算資源',
                '🔄 多模型協同 - 不同 AI 協作解決複雜問題',
                '🎯 任務專用優化 - 為分析、創作、對話分別優化',
                '🔒 企業級安全 - 符合最高數據保護標準',
                '📈 持續學習 - 模型持續更新與改進'
              ],
              capabilities: [
                '📊 市場分析 - 深度學習驅動的精確預測',
                '💬 自然語言 - 流暢、自然的對話體驗',
                '🎙️ 語音合成 - 真實、自然的語音輸出',
                '📝 內容創作 - 高品質的腳本與文案生成',
                '🔍 知識檢索 - 快速準確的資訊提取'
              ],
              benefits: [
                '🚀 提升 300% 分析效率',
                '📈 提高 85% 預測準確性',
                '⏱️ 減少 70% 任務處理時間',
                '🌍 支援 100+ 語言處理',
                '💡 提供可執行洞察與建議'
              ],
              bestPractices: [
                '啟用「AI 增強」以獲得最佳分析結果',
                '複雜問題使用多輪對話深入探討',
                '結合市場分析與內容創作，最大化價值',
                '定期更新 AI 模型以獲取最新功能'
              ],
              steps: [
                '點擊「AI 增強」按鈕啟用多模型引擎',
                '輸入您的問題或分析需求',
                '系統自動選擇最適合的 AI 模型處理',
                '獲取高品質的分析結果或生成內容',
                '繼續對話深入探討，獲取更多洞察'
              ],
              tips: [
                '💡 啟用 AI 增強後，所有功能效能顯著提升',
                '💡 複雜問題建議使用多輪對話獲得最佳結果',
                '💡 分析報告可直接轉為語音輸出',
                '💡 模型會持續優化，定期釋出新功能'
              ],
              limitations: [
                'AI 生成內容僅供參考，重要決策建議人工審核',
                '部分進階功能需要訂閱方案',
                '模型響應時間依問題複雜度而定'
              ]
            }
          },
        ],
        stats: [
          { value: 'AI+⚡', label: '雙引擎驅動' },
          { value: '4', label: '多國語音' },
          { value: '3', label: '全球市場' },
          { value: '100%', label: '自動化串流' },
        ],
        cta: '立即體驗全新功能',
        modalClose: '關閉',
        getStarted: '開始使用',
        workflowReminder: {
          title: '🎬 完整影片製作流程',
          description: '您已經擁有語音和字幕，現在可以開始製作完整的 YouTube 影片！',
          steps: [
            '步驟 1：下載生成的 WAV/MP3 音檔',
            '步驟 2：下載 SRT 字幕檔',
            '步驟 3：使用影片編輯軟體（如 CapCut、Premiere Pro、Final Cut Pro）',
            '步驟 4：將音檔匯入時間軸',
            '步驟 5：匯入 SRT 字幕並自動同步',
            '步驟 6：加入影片素材、B-roll、特效',
            '步驟 7：匯出並上傳至 YouTube'
          ],
          tools: [
            '🎬 CapCut - 免費且易用的影片編輯器',
            '🎬 Adobe Premiere Pro - 專業級影片編輯',
            '🎬 Final Cut Pro - Mac 專用專業編輯器',
            '🎬 DaVinci Resolve - 免費專業調色與剪輯'
          ]
        }
      };
    } else if (isSimplified) {
      return {
        badge: '✨ 全新 AI 智能体验',
        title: '智能分析 × 影音创作者工具',
        subtitle: '融合市场洞察与高效率 AI 媒体转换，打造下一代数字生产力',
        categories: {
          media: '创作者影音工具',
          stock: 'AI 投资与市场洞察',
          core: '全球化与核心体验'
        },
        features: [
          { 
            category: 'media',
            icon: <FileAudio size={28} />, 
            title: 'MP3/WAV 语音生成', 
            desc: '自动将文字转换为高品质语音，支持 WAV 无损与 MP3 压缩格式。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #FF007A 0%, #9300FF 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: '将您的文字稿转换为自然流畅的语音输出，支持多种语言和声音选择。',
              bestPractices: [
                '建议文字长度：50-5,000 字符（约 10-20 分钟语音）',
                '中文文字建议使用 Cantonese 或 Mandarin 语音',
                '英文文字建议使用 English 语音',
                'WAV 格式：无损音质，适合专业编辑',
                'MP3 格式：压缩格式，文件较小，适合网络分享'
              ],
              steps: [
                '粘贴或上传您的文字稿（支持 .txt, .docx）',
                '选择语音语言（Cantonese, Mandarin, English）',
                '选择声音角色（Aasing, Sinji, Tingting 等）',
                '调整语速（0.8x - 1.2x）',
                '点击「生成套件」获取音档'
              ],
              tips: [
                '💡 预览功能可试听 5 秒语音效果',
                '💡 1000 字符约可生成 3-4 分钟语音',
                '💡 支持批次生成多段语音',
                '💡 语音档案命名：vibeailink_voice_[时间戳].wav/mp3'
              ],
              limitations: [
                '最大建议长度：10,000 字符',
                '生成时间依文字长度而定（约 0.5-30 秒）',
                '需安装 macOS 系统语音',
                '仅支持 macOS 系统'
              ],
              voiceWarning: {
                title: '⚠️ 语音选择重要提示',
                message: '如果您的电脑未安装所需的语音，或您选择的语音无法使用，请使用「Auto-Male (Cloud)」或「Auto-Female (Cloud)」云端语音选项。这些云端语音由 AI 驱动，无需本地安装，可直接在网页版使用，确保您能顺利生成高品质语音。',
                cloudVoices: '☁️ 云端语音（Auto-Male / Auto-Female）无需安装，可直接在网页版使用',
                localVoices: '💻 本地语音需安装 macOS 系统语音，仅限桌面版使用'
              }
            }
          },
          { 
            category: 'media',
            icon: <Subtitles size={28} />, 
            title: 'SRT 字幕生成与同步', 
            desc: '一键提取音频字幕，支持多国语言 SRT 字幕导出与精准时间轴同步。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: '自动为您的语音生成精确的时间轴字幕，支持双语翻译和 YouTube 章节标记。',
              bestPractices: [
                '建议文字长度：50-5,000 字符',
                '字幕会自动与语音时间轴同步',
                '支持双语字幕输出（主语言 + 翻译语言）',
                'SRT 格式兼容于所有主流影片编辑软件',
                '可选择翻译语言：English, Traditional Chinese, Simplified Chinese'
              ],
              steps: [
                '生成语音后自动产生字幕',
                '选择翻译语言（可选）',
                '下载 SRT 字幕档',
                '汇入影片编辑软件（CapCut, Premiere, Final Cut）',
                '字幕会自动与语音对齐'
              ],
              tips: [
                '💡 字幕会与 MP3/WAV 音档完美同步',
                '💡 可产生 YouTube 章节标记',
                '💡 支持双语字幕同时显示',
                '💡 字幕档案命名：vibeailink_subtitle_[时间戳].srt'
              ],
              limitations: [
                '字幕同步精确度依语音生成品质而定',
                '翻译功能为辅助性质，专业使用建议人工校对',
                '仅支持文字转语音生成的字幕',
                '不支持即时语音辨识'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <LineChart size={28} />, 
            title: '实时股票分析', 
            desc: '支持港股、台股、美股，输入股票代号或新闻链接，获取完整技术分析与 AI 洞察报告。', 
            gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            linkTo: 'stockAnalysis',
            detailed: {
              description: '全面股票分析工具 - 输入股票代号或贴上新闻链接，获得技术指标、基本面数据和 AI 生成的分析报告，甚至可将分析转为语音。',
              features: [
                '📊 实时技术指标（RSI, MACD, 移动平均线等）',
                '📰 AI 新闻分析 - 贴上链接获取市场影响评估',
                '🎙️ 语音分析报告 - 将分析结果转为语音输出',
                '📈 动态价格图表与趋势线',
                '🤖 AI 信心评分与投资建议',
                '🔔 自定义关注清单'
              ],
              bestPractices: [
                '输入完整股票代号（如：0700.HK, 2330.TW, AAPL）',
                '贴上新闻链接获取 AI 摘要与市场影响分析',
                '使用「AI 增强」获取更深入的分析报告',
                '可将分析结果直接转为语音和字幕'
              ],
              steps: [
                '在搜索栏输入股票代号或贴上新闻链接',
                '点击「分析」按钮获取实时数据',
                '查看技术指标、图表和 AI 分析报告',
                '点击「语音分析」将报告转为语音',
                '下载分析报告或语音档案'
              ],
              tips: [
                '💡 支持港股、台股、美股三大市场',
                '💡 AI 新闻分析可快速评估市场影响',
                '💡 分析结果可转为语音，方便收听',
                '💡 加入关注清单，实时追踪持股'
              ],
              limitations: [
                '数据来源为公开市场数据，延迟约 15 分钟',
                'AI 分析仅供参考，不构成投资建议',
                '新闻分析需提供有效链接'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <Newspaper size={28} />, 
            title: 'AI 新闻提炼与聊天助理', 
            desc: '贴上新闻链接，AI 自动摘要关键字并评估市场走势影响。也可使用 AI 助理进行深度对话与脚本创作。', 
            gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
            linkTo: 'aiAssistant',
            detailed: {
              description: '多功能 AI 新闻分析与创作助理 - 贴上新闻链接获取实时摘要，或与 AI 助理对话进行深度研究、脚本创作和内容规划。',
              features: [
                '📰 新闻链接自动摘要与关键字提取',
                '📊 市场影响评估与情绪分析',
                '💬 AI 助理对话 - 问任何问题',
                '📝 影片脚本创作与大纲生成',
                '🎯 内容规划与 SEO 建议',
                '🔍 深度市场研究与竞品分析'
              ],
              bestPractices: [
                '贴上完整新闻链接获取最佳摘要效果',
                '使用 AI 助理进行头脑风暴和创意发想',
                '输入主题获取影片脚本大纲',
                '结合市场分析与脚本创作，制作优质内容'
              ],
              steps: [
                '在 AI 助理输入框贴上新闻链接或问题',
                'AI 自动摘要并提供市场影响评估',
                '与 AI 助理对话，深入探讨任何主题',
                '使用「脚本创作」功能生成影片脚本',
                '将脚本直接传送到语音生成功能'
              ],
              tips: [
                '💡 AI 助理可回答任何投资相关问题',
                '💡 支持多轮对话，记忆上下文',
                '💡 生成的脚本可直接用于语音生成',
                '💡 整合多种先进 AI 引擎'
              ],
              limitations: [
                '新闻分析需提供有效链接',
                'AI 生成内容仅供参考，建议人工校对',
                '脚本生成需明确主题和方向'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <Shield size={28} />, 
            title: 'AI 信心评分', 
            desc: '0-100% 多维度风险评估与五星评分机制，辅助理性决策。', 
            gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
            linkTo: 'watchlist',
            detailed: {
              description: 'AI 信心评分是综合技术指标、基本面和市场情绪的多维度评估系统。在您的关注列表中，每个股票都会显示即时的 RSI、MACD 和趋势信号，让您一眼掌握所有持股的状况。',
              features: [
                '📊 即时 RSI(14) 指标 - 超卖/超买信号一目了然',
                '📈 MACD 动能指标 - 看多/看空趋势判断',
                '🎯 买入/卖出/持有信号 - 🟢 绿色买入 / 🔴 红色卖出 / ⚪ 灰色持有',
                '📋 关注列表整合 - 所有股票状态集中显示',
                '📊 价格与变化 - 即时价格和涨跌百分比',
                '📈 趋势判断 - 上升/下降/盘整趋势图标'
              ],
              watchlistBenefits: [
                '⭐ 一页掌握所有持股状况',
                '⏱️ 节省时间 - 无需逐一查看每支股票',
                '🎯 快速决策 - 信号一目了然',
                '📊 多维度分析 - RSI、MACD、趋势综合判断'
              ],
              bestPractices: [
                '将您关注的股票加入关注列表',
                '定期查看关注列表的信号变化',
                '🟢 绿色信号（RSI < 30）可考虑买入',
                '🔴 红色信号（RSI > 70）可考虑卖出',
                '⚪ 灰色信号（RSI 30-70）建议持有观望'
              ],
              steps: [
                '点击「⭐ 关注列表」按钮',
                '查看所有持股的即时信号',
                '点击任何股票查看完整分析报告',
                '根据信号做出投资决策',
                '定期刷新获取最新数据'
              ],
              tips: [
                '💡 绿色 🟢 = RSI低于30 (超卖) - 考虑买入',
                '💡 红色 🔴 = RSI高于70 (超买) - 考虑卖出',
                '💡 灰色 ⚪ = RSI 30-70 (中性) - 持有观望',
                '💡 点击股票可查看完整分析报告',
                '💡 支持港股、台股、美股三大市场'
              ],
              limitations: [
                '数据来源为公开市场数据，延迟约 15 分钟',
                'AI 信号仅供参考，不构成投资建议',
                'RSI 和 MACD 为技术指标，需结合其他因素判断'
              ]
            }
          },
          // Global & Experience Features
          { 
            category: 'core',
            icon: <Volume2 size={28} />, 
            title: '多语音 AI 朗读', 
            desc: '粤语、国语、普通话、英语自然语音，自由切换监听。', 
            gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: '支持粤语、国语、普通话、英语四种自然语音，并提供云端 Auto-Male 和 Auto-Female 语音选项，无需本地安装即可使用。',
              features: [
                '🎙️ 粤语 (Cantonese) - 香港/广东用语',
                '🎙️ 国语 (Mandarin) - 台湾标准用语',
                '🎙️ 普通话 (Putonghua) - 中国大陆标准用语',
                '🎙️ 英语 (English) - 国际通用语言',
                '☁️ Auto-Male (Cloud) - AI 云端男声，无需安装',
                '☁️ Auto-Female (Cloud) - AI 云端女声，无需安装'
              ],
              bestPractices: [
                '中文内容建议使用粤语、国语或普通话',
                '英文内容建议使用英语',
                '如本地无语音，请使用 Auto-Male 或 Auto-Female 云端语音',
                '云端语音可在网页版直接使用'
              ],
              steps: [
                '在语音生成面板选择语言',
                '选择声音角色（Aasing, Sinji, Tingting 等）',
                '如需云端语音，选择 Auto-Male 或 Auto-Female',
                '调整语速后生成语音'
              ],
              tips: [
                '💡 云端语音 Auto-Male / Auto-Female 无需安装',
                '💡 粤语在网页版使用普通话发音作为替代',
                '💡 本地语音需 macOS 系统支持',
                '💡 可自由切换不同语言和声音'
              ],
              limitations: [
                '粤语在网页版使用普通话发音作为替代',
                '本地语音需 macOS 系统',
                '云端语音需要网络连线'
              ]
            }
          },
          { 
            category: 'core',
            icon: <Languages size={28} />, 
            title: '多国语言界面', 
            desc: '繁体中文、简体中文、英文独立控制，无缝全球运作。', 
            gradient: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)',
            linkTo: 'languageInterface',
            detailed: {
              description: '完整的语言支持，让您在全球市场中无缝切换，享受一致的用户体验。',
              features: [
                '🌐 繁体中文 - 完整台湾、香港用语',
                '🌐 简体中文 - 中国大陆用语优化',
                '🌐 English - 国际通用语言'
              ],
              applications: [
                '📊 AI 股票分析 - 所有分析报告支持三种语言',
                '💬 AI 助理 - 用您的语言进行对话',
                '🎙️ 语音生成 - 支持中英文语音输出',
                '📝 字幕生成 - SRT 支持多语言翻译'
              ],
              bestPractices: [
                '在设置中选择您的偏好语言',
                '所有内容会自动切换至所选语言',
                '语音生成支持中英文双语输出',
                '字幕可选择单一语言或双语显示'
              ],
              steps: [
                '点击右上角语言切换按钮',
                '选择您的偏好语言（繁体中文、简体中文、英文）',
                '页面会自动刷新并切换语言',
                '所有功能模块都会使用所选语言',
                '无需登出即可即时切换'
              ],
              tips: [
                '💡 语言设置影响所有功能模块',
                '💡 切换语言无需重新加载页面',
                '💡 语音生成会自动匹配所选语言',
                '💡 支持实时语言切换，无需登出'
              ],
              limitations: [
                '部分翻译可能需要人工校对',
                '语音生成仅支持中英文'
              ]
            }
          },
          { 
            category: 'core',
            icon: <Sparkles size={28} />, 
            title: '多模型 AI 增强引擎', 
            desc: '引领业界的多核心 AI 引擎架构，深度整合最先进的语言模型与分析能力，为您提供无与伦比的智能体验。', 
            gradient: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)',
            linkTo: 'aiEngine',
            detailed: {
              description: '我们的多模型 AI 增强引擎是 vIbeAiLink 的核心技术优势，透过智慧路由与动态调度，为每个任务选择最适合的 AI 模型，确保最佳效能与准确性。',
              features: [
                '🧠 智慧模型路由 - 自动为任务选择最佳 AI',
                '⚡ 动态效能优化 - 实时调整运算资源',
                '🔄 多模型协同 - 不同 AI 协作解决复杂问题',
                '🎯 任务专用优化 - 为分析、创作、对话分别优化',
                '🔒 企业级安全 - 符合最高数据保护标准',
                '📈 持续学习 - 模型持续更新与改进'
              ],
              capabilities: [
                '📊 市场分析 - 深度学习驱动的精确预测',
                '💬 自然语言 - 流畅、自然的对话体验',
                '🎙️ 语音合成 - 真实、自然的语音输出',
                '📝 内容创作 - 高品质的脚本与文案生成',
                '🔍 知识检索 - 快速准确的信息提取'
              ],
              benefits: [
                '🚀 提升 300% 分析效率',
                '📈 提高 85% 预测准确性',
                '⏱️ 减少 70% 任务处理时间',
                '🌍 支持 100+ 语言处理',
                '💡 提供可执行洞察与建议'
              ],
              bestPractices: [
                '启用「AI 增强」以获得最佳分析结果',
                '复杂问题使用多轮对话深入探讨',
                '结合市场分析与内容创作，最大化价值',
                '定期更新 AI 模型以获取最新功能'
              ],
              steps: [
                '点击「AI 增强」按钮启用多模型引擎',
                '输入您的问题或分析需求',
                '系统自动选择最适合的 AI 模型处理',
                '获取高品质的分析结果或生成内容',
                '继续对话深入探讨，获取更多洞察'
              ],
              tips: [
                '💡 启用 AI 增强后，所有功能效能显著提升',
                '💡 复杂问题建议使用多轮对话获得最佳结果',
                '💡 分析报告可直接转为语音输出',
                '💡 模型会持续优化，定期释出新功能'
              ],
              limitations: [
                'AI 生成内容仅供参考，重要决策建议人工审核',
                '部分进阶功能需要订阅方案',
                '模型响应时间依问题复杂度而定'
              ]
            }
          },
        ],
        stats: [
          { value: 'AI+⚡', label: '双引擎驱动' },
          { value: '4', label: '多国语音' },
          { value: '3', label: '全球市场' },
          { value: '100%', label: '自动化串流' },
        ],
        cta: '立即体验全新功能',
        modalClose: '关闭',
        getStarted: '开始使用',
        workflowReminder: {
          title: '🎬 完整影片制作流程',
          description: '您已经拥有语音和字幕，现在可以开始制作完整的 YouTube 影片！',
          steps: [
            '步骤 1：下载生成的 WAV/MP3 音档',
            '步骤 2：下载 SRT 字幕档',
            '步骤 3：使用影片编辑软件（如 CapCut、Premiere Pro、Final Cut Pro）',
            '步骤 4：将音档汇入时间轴',
            '步骤 5：汇入 SRT 字幕并自动同步',
            '步骤 6：加入影片素材、B-roll、特效',
            '步骤 7：汇出并上传至 YouTube'
          ],
          tools: [
            '🎬 CapCut - 免费且易用的影片编辑器',
            '🎬 Adobe Premiere Pro - 专业级影片编辑',
            '🎬 Final Cut Pro - Mac 专用专业编辑器',
            '🎬 DaVinci Resolve - 免费专业调色与剪辑'
          ]
        }
      };
    } else {
      return {
        badge: '✨ Next-Gen AI Hub',
        title: 'Market Intelligence × Creator Studio',
        subtitle: 'Combining real-time financial insights with automated video & audio production.',
        categories: {
          media: 'Creator Media Tools',
          stock: 'AI Market Intelligence',
          core: 'Global Experience'
        },
        features: [
          { 
            category: 'media',
            icon: <FileAudio size={28} />, 
            title: 'MP3/WAV Audio Generator', 
            desc: 'Convert text to high-quality speech with lossless WAV or compressed MP3 output.', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #FF007A 0%, #9300FF 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: 'Transform your script into natural, flowing speech with multiple language and voice options.',
              bestPractices: [
                'Recommended text length: 50-5,000 characters (~10-20 minutes of audio)',
                'Use Cantonese or Mandarin for Chinese text',
                'Use English voice for English text',
                'WAV format: Lossless quality, ideal for professional editing',
                'MP3 format: Compressed, smaller file size for sharing'
              ],
              steps: [
                'Paste or upload your script (.txt, .docx)',
                'Select voice language (Cantonese, Mandarin, English)',
                'Choose voice character (Aasing, Sinji, Tingting, etc.)',
                'Adjust speech speed (0.8x - 1.2x)',
                'Click "Generate Package" to get audio file'
              ],
              tips: [
                '💡 Preview feature lets you hear 5 seconds of audio',
                '💡 1000 characters ≈ 3-4 minutes of speech',
                '💡 Supports batch generation of multiple audio files',
                '💡 Audio files named: vibeailink_voice_[timestamp].wav/mp3'
              ],
              limitations: [
                'Maximum recommended length: 10,000 characters',
                'Generation time depends on text length (~0.5-30 seconds)',
                'Requires macOS system voices',
                'macOS only'
              ],
              voiceWarning: {
                title: '⚠️ Voice Selection Important Notice',
                message: 'If your computer does not have the required voice installed, or if your selected voice is not available, please use "Auto-Male (Cloud)" or "Auto-Female (Cloud)" cloud voice options. These cloud voices are AI-powered, require no local installation, and work directly on the web version, ensuring you can generate high-quality speech smoothly.',
                cloudVoices: '☁️ Cloud Voices (Auto-Male / Auto-Female) - No installation required, works directly on web',
                localVoices: '💻 Local Voices - Requires macOS system voices, desktop version only'
              }
            }
          },
          { 
            category: 'media',
            icon: <Subtitles size={28} />, 
            title: 'SRT Subtitle Generator', 
            desc: 'One-click subtitle extraction with multi-language SRT export and precise timeline sync.', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: 'Automatically generate accurate timeline subtitles for your speech, with bilingual translation and YouTube chapter markers.',
              bestPractices: [
                'Recommended text length: 50-5,000 characters',
                'Subtitles auto-sync with audio timeline',
                'Supports bilingual subtitle output (main + translation)',
                'SRT format compatible with all major video editors',
                'Choose translation language: English, Traditional Chinese, Simplified Chinese'
              ],
              steps: [
                'Subtitles are auto-generated after voice generation',
                'Select translation language (optional)',
                'Download SRT subtitle file',
                'Import to video editor (CapCut, Premiere, Final Cut)',
                'Subtitles auto-sync with audio'
              ],
              tips: [
                '💡 Subtitles perfectly sync with MP3/WAV audio',
                '💡 Generates YouTube chapter markers',
                '💡 Supports dual-language subtitles',
                '💡 Subtitle files named: vibeailink_subtitle_[timestamp].srt'
              ],
              limitations: [
                'Subtitle accuracy depends on voice generation quality',
                'Translation is assistive - professional use may require manual review',
                'Only supports text-to-speech generated subtitles',
                'No real-time speech recognition'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <LineChart size={28} />, 
            title: 'Real-Time Stock Analysis', 
            desc: 'Supporting HK, TW, and US markets. Enter stock symbol or news link for complete technical analysis and AI insights.', 
            gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            linkTo: 'stockAnalysis',
            detailed: {
              description: 'Comprehensive stock analysis tool - enter a stock symbol or paste a news link to get technical indicators, fundamental data, and AI-generated analysis reports with optional voice output.',
              features: [
                '📊 Real-time technical indicators (RSI, MACD, Moving Averages)',
                '📰 AI News Analysis - paste links for market impact assessment',
                '🎙️ Voice Analysis Reports - convert analysis to speech',
                '📈 Dynamic price charts with trend lines',
                '🤖 AI Confidence Score and investment insights',
                '🔔 Custom watchlist'
              ],
              bestPractices: [
                'Enter full stock symbols (e.g., 0700.HK, 2330.TW, AAPL)',
                'Paste news links for AI summary and market impact analysis',
                'Use "AI Enhancement" for deeper analysis',
                'Convert analysis results directly to voice and subtitles'
              ],
              steps: [
                'Enter stock symbol or paste news link in search bar',
                'Click "Analyze" button to get real-time data',
                'View technical indicators, charts, and AI analysis',
                'Click "Voice Analysis" to convert report to speech',
                'Download analysis report or audio files'
              ],
              tips: [
                '💡 Supports HK, TW, and US stock markets',
                '💡 AI News Analysis quickly assesses market impact',
                '💡 Results can be converted to voice for listening',
                '💡 Add to watchlist for real-time tracking'
              ],
              limitations: [
                'Data from public market sources with ~15 min delay',
                'AI analysis for reference only, not investment advice',
                'News analysis requires valid links'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <Newspaper size={28} />, 
            title: 'AI News Analysis & Chat Assistant', 
            desc: 'Paste news links for AI-powered summaries and market impact analysis. Chat with AI assistant for deep research and script creation.', 
            gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
            linkTo: 'aiAssistant',
            detailed: {
              description: 'Multi-functional AI news analysis and creation assistant - paste news links for instant summaries, or chat with AI for deep research, script creation, and content planning.',
              features: [
                '📰 Auto-summarize news links with keyword extraction',
                '📊 Market impact assessment and sentiment analysis',
                '💬 AI Assistant Chat - ask any questions',
                '📝 Video script creation and outline generation',
                '🎯 Content planning and SEO recommendations',
                '🔍 Deep market research and competitor analysis'
              ],
              bestPractices: [
                'Paste full news links for best summary quality',
                'Use AI Assistant for brainstorming and ideation',
                'Enter topics to get video script outlines',
                'Combine market analysis with script creation for quality content'
              ],
              steps: [
                'Paste news link or question in AI Assistant input',
                'AI auto-summarizes and provides market impact assessment',
                'Chat with AI Assistant to explore any topic in depth',
                'Use "Script Creation" to generate video scripts',
                'Send scripts directly to voice generation'
              ],
              tips: [
                '💡 AI Assistant can answer any investment-related questions',
                '💡 Supports multi-turn conversations with context memory',
                '💡 Generated scripts can be used for voice generation',
                '💡 Integrated with leading AI engines'
              ],
              limitations: [
                'News analysis requires valid links',
                'AI-generated content for reference, manual review recommended',
                'Script creation requires clear topic and direction'
              ]
            }
          },
          { 
            category: 'stock',
            icon: <Shield size={28} />, 
            title: 'AI Confidence Score', 
            desc: '0-100% multi-dimensional risk assessment with 5-star rating for smarter decisions.', 
            gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
            linkTo: 'watchlist',
            detailed: {
              description: 'AI Confidence Score is a multi-dimensional assessment system combining technical indicators, fundamentals, and market sentiment. In your watchlist, every stock displays real-time RSI, MACD, and trend signals, giving you a one-glance view of all your holdings.',
              features: [
                '📊 Real-time RSI(14) - Oversold/Overbought signals at a glance',
                '📈 MACD Momentum - Bullish/Bearish trend signals',
                '🎯 Buy/Sell/Hold Signals - 🟢 Green BUY / 🔴 Red SELL / ⚪ Gray HOLD',
                '📋 Watchlist Integration - All stocks consolidated view',
                '📊 Price & Change - Real-time prices and percentages',
                '📈 Trend Indicators - Uptrend/Downtrend/Sideways icons'
              ],
              watchlistBenefits: [
                '⭐ One page view of all your holdings',
                '⏱️ Save time - no need to check each stock individually',
                '🎯 Quick decisions - signals at a glance',
                '📊 Multi-dimensional analysis - RSI, MACD, Trend combined'
              ],
              bestPractices: [
                'Add your stocks to the watchlist',
                'Regularly check watchlist for signal changes',
                '🟢 Green (RSI < 30) - Consider BUY',
                '🔴 Red (RSI > 70) - Consider SELL',
                '⚪ Gray (RSI 30-70) - HOLD and observe'
              ],
              steps: [
                'Click "⭐ Watchlist" button',
                'View real-time signals for all holdings',
                'Click any stock for complete analysis report',
                'Make decisions based on signals',
                'Refresh regularly for updated data'
              ],
              tips: [
                '💡 Green 🟢 = RSI below 30 (Oversold) - Consider BUY',
                '💡 Red 🔴 = RSI above 70 (Overbought) - Consider SELL',
                '💡 Gray ⚪ = RSI 30-70 (Neutral) - HOLD',
                '💡 Click any stock for full analysis',
                '💡 Supports HK, TW, and US markets'
              ],
              limitations: [
                'Data from public market sources with ~15 min delay',
                'AI signals for reference only, not investment advice',
                'RSI and MACD are technical indicators - combine with other factors'
              ]
            }
          },
          // Global & Experience Features
          { 
            category: 'core',
            icon: <Volume2 size={28} />, 
            title: 'Multi-Voice Speech Synthesis', 
            desc: 'Cantonese, Mandarin, Taiwanese, and English voices with Auto-Male & Auto-Female cloud options.', 
            gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
            linkTo: 'voiceProvider',
            detailed: {
              description: 'Supports Cantonese, Mandarin, Taiwanese, and English natural voices, with cloud Auto-Male and Auto-Female options that require no local installation.',
              features: [
                '🎙️ Cantonese - Hong Kong/Guangdong dialect',
                '🎙️ Mandarin (Guoyu) - Taiwan standard',
                '🎙️ Putonghua - Mainland China standard',
                '🎙️ English - International language',
                '☁️ Auto-Male (Cloud) - AI cloud male voice, no installation',
                '☁️ Auto-Female (Cloud) - AI cloud female voice, no installation'
              ],
              bestPractices: [
                'Use Cantonese, Mandarin, or Putonghua for Chinese content',
                'Use English for English content',
                'Use Auto-Male or Auto-Female if no local voices',
                'Cloud voices work directly on web version'
              ],
              steps: [
                'Select language in voice generator panel',
                'Choose voice character (Aasing, Sinji, Tingting, etc.)',
                'Select Auto-Male or Auto-Female for cloud voices',
                'Adjust speed and generate'
              ],
              tips: [
                '💡 Cloud voices Auto-Male / Auto-Female - no installation needed',
                '💡 Cantonese uses Mandarin pronunciation as fallback on web',
                '💡 Local voices require macOS system support',
                '💡 Freely switch between different languages and voices'
              ],
              limitations: [
                'Cantonese uses Mandarin pronunciation as fallback on web',
                'Local voices require macOS system',
                'Cloud voices require internet connection'
              ]
            }
          },
          { 
            category: 'core',
            icon: <Languages size={28} />, 
            title: 'Multilingual Interface', 
            desc: 'Independent control across Traditional Chinese, Simplified Chinese, and English.', 
            gradient: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)',
            linkTo: 'languageInterface',
            detailed: {
              description: 'Complete multilingual support that seamlessly integrates across all features.',
              features: [
                '🌐 Traditional Chinese - Full Taiwan/HK terminology',
                '🌐 Simplified Chinese - Mainland China optimized',
                '🌐 English - International standard'
              ],
              applications: [
                '📊 AI Stock Analysis - All reports in your language',
                '💬 AI Assistant - Chat in your preferred language',
                '🎙️ Voice Generation - Chinese and English output',
                '📝 Subtitle Generation - Multi-language SRT export'
              ],
              bestPractices: [
                'Select your preferred language in settings',
                'All content automatically switches to selected language',
                'Voice generation supports both Chinese and English',
                'Subtitles can be single or bilingual'
              ],
              steps: [
                'Click the language toggle button in the top right',
                'Select your preferred language (Traditional Chinese, Simplified Chinese, English)',
                'The page will automatically refresh with your language',
                'All features will use your selected language',
                'Switch instantly without logging out'
              ],
              tips: [
                '💡 Language settings affect all features',
                '💡 Switch languages without page reload',
                '💡 Voice generation auto-matches your language',
                '💡 Real-time language switching without logout'
              ],
              limitations: [
                'Some translations may need manual review',
                'Voice generation only supports Chinese and English'
              ]
            }
          },
          { 
            category: 'core',
            icon: <Sparkles size={28} />, 
            title: 'Multi-Model AI Engine', 
            desc: 'Industry-leading multi-core AI architecture - integrating the most advanced language models to deliver unparalleled intelligence.', 
            gradient: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)',
            linkTo: 'aiEngine',
            detailed: {
              description: 'Our Multi-Model AI Engine is vIbeAiLink\'s core advantage, leveraging intelligent routing and dynamic orchestration to select the optimal AI model for every task.',
              features: [
                '🧠 Intelligent Model Routing - Auto-select best AI for task',
                '⚡ Dynamic Performance Optimization - Real-time resource allocation',
                '🔄 Multi-Model Collaboration - Multiple AIs solve complex problems',
                '🎯 Task-Specific Optimization - Optimized for analysis, creation, chat',
                '🔒 Enterprise-Grade Security - Highest data protection standards',
                '📈 Continuous Learning - Regular model updates and improvements'
              ],
              capabilities: [
                '📊 Market Analysis - Deep learning-driven predictions',
                '💬 Natural Language - Smooth, natural conversations',
                '🎙️ Speech Synthesis - Natural, realistic voice output',
                '📝 Content Creation - High-quality script generation',
                '🔍 Knowledge Retrieval - Fast, accurate information extraction'
              ],
              benefits: [
                '🚀 300% increase in analysis efficiency',
                '📈 85% improvement in prediction accuracy',
                '⏱️ 70% reduction in task processing time',
                '🌍 100+ language support',
                '💡 Actionable insights and recommendations'
              ],
              bestPractices: [
                'Enable "AI Enhancement" for best results',
                'Use multi-turn conversations for complex problems',
                'Combine market analysis with content creation for maximum value',
                'Regularly update for latest features'
              ],
              steps: [
                'Click "AI Enhancement" to activate multi-model engine',
                'Enter your question or analysis request',
                'System auto-selects best AI model',
                'Get high-quality results or generated content',
                'Continue the conversation for deeper insights'
              ],
              tips: [
                '💡 All features perform significantly better with AI Enhancement',
                '💡 Use multi-turn conversations for complex questions',
                '💡 Analysis reports can be converted to speech',
                '💡 Models continuously improve with regular updates'
              ],
              limitations: [
                'AI-generated content for reference - review important decisions',
                'Some advanced features require subscription',
                'Response time varies by query complexity'
              ]
            }
          },
        ],
        stats: [
          { value: 'AI+⚡', label: 'Dual Engines' },
          { value: '4', label: 'Voices' },
          { value: '3', label: 'Global Markets' },
          { value: '100%', label: 'Automated Flow' },
        ],
        cta: 'Explore All Features',
        modalClose: 'Close',
        getStarted: 'Get Started',
        workflowReminder: {
          title: '🎬 Complete Video Production Workflow',
          description: 'You now have the voice and subtitles - ready to create your full YouTube video!',
          steps: [
            'Step 1: Download your WAV/MP3 audio file',
            'Step 2: Download your SRT subtitle file',
            'Step 3: Open a video editor (CapCut, Premiere Pro, Final Cut Pro)',
            'Step 4: Import the audio to your timeline',
            'Step 5: Import the SRT and auto-sync with audio',
            'Step 6: Add video footage, B-roll, and effects',
            'Step 7: Export and upload to YouTube'
          ],
          tools: [
            '🎬 CapCut - Free and beginner-friendly',
            '🎬 Adobe Premiere Pro - Professional grade',
            '🎬 Final Cut Pro - Mac optimized',
            '🎬 DaVinci Resolve - Free professional color grading'
          ]
        }
      };
    }
  };

  const text = getText();

  const handleFeatureClick = (feature: any) => {
    if (feature.detailed) {
      setSelectedFeature(feature);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeature(null);
  };

  const navigateTo = (target: string) => {
    closeModal();
    
    if (target === 'watchlist') {
      // Find and click the watchlist button
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const buttonText = button.textContent || '';
        if (buttonText.includes('Watchlist') || buttonText.includes('關注列表') || buttonText.includes('关注列表')) {
          button.click();
          break;
        }
      }
      return;
    }
    
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const buttonText = button.textContent || '';
      
      if (target === 'voiceProvider' && (
        buttonText.includes('Voice Provider') || 
        buttonText.includes('語音生成') ||
        buttonText.includes('语音生成')
      )) {
        button.click();
        break;
      }
      
      if (target === 'aiAssistant' && (
        buttonText.includes('AI Assistant') || 
        buttonText.includes('AI 助理') ||
        buttonText.includes('AI 助手')
      )) {
        button.click();
        break;
      }
      
      if (target === 'stockAnalysis' && (
        buttonText.includes('AI STOCK') || 
        buttonText.includes('AI 股票') ||
        buttonText.includes('分析')
      )) {
        button.click();
        break;
      }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div style={{ padding: '60px 20px', maxWidth: '1240px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            borderRadius: '100px',
            background: 'rgba(147, 51, 234, 0.08)',
            color: '#9333EA',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            {text.badge}
          </span>
          <h2 style={{ 
            fontSize: '42px', 
            fontWeight: 900, 
            marginBottom: '16px',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 40%, #6B21A8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {text.title}
          </h2>
          <p style={{ fontSize: '18px', color: '#64748B', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
            {text.subtitle}
          </p>
        </div>

        {/* Grid Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
          gap: '24px',
          marginBottom: '56px'
        }}>
          {text.features.map((feature, index) => (
            <div 
              key={index} 
              onClick={() => handleFeatureClick(feature)}
              style={{ 
                padding: '32px', 
                borderRadius: '28px', 
                background: feature.badge === 'NEW' 
                  ? 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,243,255,0.8) 100%)' 
                  : '#FFFFFF',
                border: feature.badge === 'NEW' ? '2px solid #C084FC' : '1px solid #F1F5F9',
                boxShadow: feature.badge === 'NEW'
                  ? '0 20px 30px -10px rgba(147, 51, 234, 0.15)'
                  : '0 10px 30px -10px rgba(0,0,0,0.04)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: feature.detailed ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (feature.detailed) {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 25px 35px -10px rgba(0,0,0,0.12)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = feature.badge === 'NEW'
                  ? '0 20px 30px -10px rgba(147, 51, 234, 0.15)'
                  : '0 10px 30px -10px rgba(0,0,0,0.04)';
              }}
            >
              {/* NEW Badge */}
              {feature.badge && (
                <span style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #FF007A, #9300FF)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  boxShadow: '0 4px 10px rgba(255, 0, 122, 0.3)'
                }}>
                  {feature.badge}
                </span>
              )}

              {/* Click indicator for interactive features */}
              {feature.detailed && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  background: 'rgba(147, 51, 234, 0.1)',
                  borderRadius: '100px',
                  padding: '4px 10px',
                  fontSize: '10px',
                  color: '#9333EA',
                  fontWeight: 600
                }}>
                  Click for details →
                </div>
              )}

              {/* Icon */}
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '18px', 
                background: feature.gradient,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '24px',
                color: 'white',
                boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)'
              }}>
                {feature.icon}
              </div>

              {/* Feature Info */}
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', color: '#0F172A' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
          borderRadius: '32px',
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '32px',
          textAlign: 'center',
          marginBottom: '48px',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)'
        }}>
          {text.stats.map((stat, index) => (
            <div key={index}>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#38BDF8', letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigateTo('stockAnalysis')}
            style={{
              background: 'linear-gradient(135deg, #9333EA 0%, #2563EB 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              padding: '16px 48px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 12px 28px -6px rgba(147, 51, 234, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 18px 36px -6px rgba(147, 51, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(147, 51, 234, 0.4)';
            }}
          >
            {text.cta} →
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedFeature && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '32px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '40px',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4)',
              position: 'relative',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2E8F0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
              }}
            >
              <X size={20} color="#64748B" />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: selectedFeature.gradient,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)'
              }}>
                {selectedFeature.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {selectedFeature.title}
                  </h2>
                  {selectedFeature.badge && (
                    <span style={{
                      background: 'linear-gradient(135deg, #FF007A, #9300FF)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '100px'
                    }}>
                      {selectedFeature.badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
                  {selectedFeature.detailed.description}
                </p>
              </div>
            </div>

            {/* Voice Warning - For MP3/WAV Audio Generator */}
            {selectedFeature.linkTo === 'voiceProvider' && selectedFeature.detailed.voiceWarning && (
              <div style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                border: '2px solid #F59E0B'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: '#92400E', 
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} color="#F59E0B" />
                  {selectedFeature.detailed.voiceWarning.title}
                </h4>
                <p style={{ fontSize: '13px', color: '#78350F', margin: '0 0 12px 0', lineHeight: '1.6' }}>
                  {selectedFeature.detailed.voiceWarning.message}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    border: '1px solid #86EFAC'
                  }}>
                    <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                      {selectedFeature.detailed.voiceWarning.cloudVoices}
                    </span>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    border: '1px solid #93C5FD'
                  }}>
                    <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>
                      {selectedFeature.detailed.voiceWarning.localVoices}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Watchlist Benefits - For AI Confidence Score */}
            {selectedFeature.linkTo === 'watchlist' && selectedFeature.detailed.watchlistBenefits && (
              <div style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                border: '2px solid #34D399'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: '#065F46', 
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ListChecks size={18} color="#10B981" />
                  Watchlist Benefits
                </h4>
                <ul style={{ 
                  margin: 0, 
                  padding: 0, 
                  listStyle: 'none',
                  display: 'grid',
                  gap: '6px'
                }}>
                  {selectedFeature.detailed.watchlistBenefits.map((item: string, i: number) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#065F46',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: '1.5'
                    }}>
                      <span style={{ color: '#10B981' }}>▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Content */}
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Features List */}
              {selectedFeature.detailed.features && selectedFeature.detailed.features.length > 0 && (
                <div style={{
                  background: '#F0FDF4',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: '#0F172A', 
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Sparkles size={18} color="#10B981" />
                    {selectedFeature.linkTo === 'aiEngine' ? 'Core Capabilities' : 'Key Features'}
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {selectedFeature.detailed.features.map((item: string, i: number) => (
                      <li key={i} style={{
                        fontSize: '13px',
                        color: '#1E293B',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ color: '#10B981' }}>▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Applications */}
              {selectedFeature.detailed.applications && selectedFeature.detailed.applications.length > 0 && (
                <div style={{
                  background: '#EFF6FF',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: '#0F172A', 
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Globe size={18} color="#2563EB" />
                    Applied Across All Features
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {selectedFeature.detailed.applications.map((item: string, i: number) => (
                      <li key={i} style={{
                        fontSize: '13px',
                        color: '#1E293B',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ color: '#2563EB' }}>▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {selectedFeature.detailed.benefits && selectedFeature.detailed.benefits.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: 'white', 
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Zap size={18} color="#FCD34D" />
                    Key Benefits
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {selectedFeature.detailed.benefits.map((item: string, i: number) => (
                      <li key={i} style={{
                        fontSize: '13px',
                        color: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ color: '#FCD34D' }}>▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Capabilities */}
              {selectedFeature.detailed.capabilities && selectedFeature.detailed.capabilities.length > 0 && (
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: '#0F172A', 
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Cpu size={18} color="#6B21A8" />
                    Advanced Capabilities
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {selectedFeature.detailed.capabilities.map((item: string, i: number) => (
                      <li key={i} style={{
                        fontSize: '13px',
                        color: '#1E293B',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ color: '#6B21A8' }}>▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best Practices */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: '#0F172A', 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={18} color="#10B981" />
                  Best Practices
                </h4>
                <ul style={{ 
                  margin: 0, 
                  padding: 0, 
                  listStyle: 'none',
                  display: 'grid',
                  gap: '8px'
                }}>
                  {selectedFeature.detailed.bestPractices.map((item: string, i: number) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: '1.5'
                    }}>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div style={{
                background: '#F0F9FF',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: '#0F172A', 
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Zap size={18} color="#2563EB" />
                  How to Use
                </h4>
                <ul style={{ 
                  margin: 0, 
                  padding: 0, 
                  listStyle: 'none',
                  display: 'grid',
                  gap: '6px'
                }}>
                  {selectedFeature.detailed.steps.map((step: string, i: number) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#1E293B',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: '1.5'
                    }}>
                      <span style={{
                        background: '#2563EB',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips & Limitations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  background: '#FFF7ED',
                  borderRadius: '16px',
                  padding: '16px'
                }}>
                  <h4 style={{ 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: '#0F172A', 
                    margin: '0 0 10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Info size={16} color="#F59E0B" />
                    Pro Tips
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {selectedFeature.detailed.tips.map((tip: string, i: number) => (
                      <li key={i} style={{
                        fontSize: '12px',
                        color: '#78350F',
                        lineHeight: '1.5'
                      }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{
                  background: '#FEF2F2',
                  borderRadius: '16px',
                  padding: '16px'
                }}>
                  <h4 style={{ 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: '#0F172A', 
                    margin: '0 0 10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={16} color="#EF4444" />
                    Limitations
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    padding: 0, 
                    listStyle: 'none',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    {selectedFeature.detailed.limitations.map((limitation: string, i: number) => (
                      <li key={i} style={{
                        fontSize: '12px',
                        color: '#991B1B',
                        lineHeight: '1.5'
                      }}>
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Workflow Reminder */}
              {selectedFeature.linkTo === 'voiceProvider' && text.workflowReminder && (
                <div style={{
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginTop: '8px'
                }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'white', 
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {text.workflowReminder.title}
                  </h4>
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#94A3B8', 
                    margin: '0 0 16px 0',
                    lineHeight: '1.6'
                  }}>
                    {text.workflowReminder.description}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <h5 style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: '#38BDF8', 
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        📋 Steps to Complete
                      </h5>
                      <ul style={{ 
                        margin: 0, 
                        padding: 0, 
                        listStyle: 'none',
                        display: 'grid',
                        gap: '4px'
                      }}>
                        {text.workflowReminder.steps.map((step: string, i: number) => (
                          <li key={i} style={{
                            fontSize: '12px',
                            color: '#E2E8F0',
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px'
                          }}>
                            <span style={{ color: '#38BDF8' }}>▸</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: '#38BDF8', 
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🛠️ Recommended Tools
                      </h5>
                      <ul style={{ 
                        margin: 0, 
                        padding: 0, 
                        listStyle: 'none',
                        display: 'grid',
                        gap: '4px'
                      }}>
                        {text.workflowReminder.tools.map((tool: string, i: number) => (
                          <li key={i} style={{
                            fontSize: '12px',
                            color: '#E2E8F0',
                            lineHeight: '1.5'
                          }}>
                            {tool}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Get Started Button */}
              <button
                onClick={() => {
                  if (selectedFeature.linkTo) {
                    navigateTo(selectedFeature.linkTo);
                  } else {
                    closeModal();
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #9333EA 0%, #2563EB 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  marginTop: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(147, 51, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {text.getStarted} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};