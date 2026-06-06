// Share Buttons Component
const ShareButtons = ({ data, langKey }: { data: any; langKey: string }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const generateShareText = () => {
    const isPositive = data.changePercent > 0;
    const sentiment = isPositive ? '🚀' : '📉';
    const changeText = `${isPositive ? '+' : ''}${data.changePercent?.toFixed(2)}%`;
    const companyName = data.companyName || data.symbol;
    
    const confidenceScore = data.specificAnalysis?.confidenceScore || 0;
    const recommendation = data.specificAnalysis?.specificRecommendation?.substring(0, 80) || 'Analysis completed';
    const riskLevel = data.specificAnalysis?.riskLevel || 'Medium';
    
    let starsText = '';
    if (confidenceScore >= 80) starsText = '⭐⭐⭐⭐⭐';
    else if (confidenceScore >= 65) starsText = '⭐⭐⭐⭐';
    else if (confidenceScore >= 50) starsText = '⭐⭐⭐';
    else if (confidenceScore >= 35) starsText = '⭐⭐';
    else starsText = '⭐';
    
    if (langKey === 'Cantonese') {
      return `${sentiment} ${companyName} 現價 ${data.currency || '$'}${data.price} (${changeText})
📊 分析摘要: ${recommendation}
🎯 信心評分: ${confidenceScore}% ${starsText}
⚠️ 風險等級: ${riskLevel}

🔗 完整分析: vibeailink.com
#股票分析 #投資 #vibeAiLink`;
    } else if (langKey === '简体中文') {
      return `${sentiment} ${companyName} 现价 ${data.currency || '$'}${data.price} (${changeText})
📊 分析摘要: ${recommendation}
🎯 信心评分: ${confidenceScore}% ${starsText}
⚠️ 风险等级: ${riskLevel}

🔗 完整分析: vibeailink.com
#股票分析 #投资 #vibeAiLink`;
    } else {
      return `${sentiment} ${companyName} is at ${data.currency || '$'}${data.price} (${changeText})
📊 Summary: ${recommendation}
🎯 Confidence: ${confidenceScore}% ${starsText}
⚠️ Risk Level: ${riskLevel}

🔗 Full analysis: vibeailink.com
#StockAnalysis #Investing #vibeAiLink`;
    }
  };

  const shareText = generateShareText();
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareToFacebook = () => {
    // Copy analysis content to clipboard first
    navigator.clipboard.writeText(shareText);
    // Then open Facebook share dialog with the page URL
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
    // Show alert to let user know content is copied
    setTimeout(() => {
      alert(langKey === 'Cantonese' ? '分析內容已複製，可貼上到Facebook！' : langKey === '简体中文' ? '分析内容已复制，可粘贴到Facebook！' : 'Analysis copied! You can paste it on Facebook.');
    }, 100);
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.substring(0, 240))}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
  };

  const copyToClipboard = () => {
    const textToCopy = `${shareText}\n\n${shareUrl}`;
    navigator.clipboard.writeText(textToCopy);
    alert(langKey === 'Cantonese' ? '已複製到剪貼板！' : langKey === '简体中文' ? '已复制到剪贴板！' : 'Copied to clipboard!');
  };

  const downloadAsImage = () => {
    alert(langKey === 'Cantonese' ? '截圖功能：請使用瀏覽器截圖工具' : langKey === '简体中文' ? '截图功能：请使用浏览器截图工具' : 'Screenshot: Please use browser screenshot tool');
  };

  const shareButtons = [
    { icon: '📘', label: 'Facebook', onClick: shareToFacebook, color: '#1877F2' },
    { icon: '🐦', label: 'Twitter', onClick: shareToTwitter, color: '#1DA1F2' },
    { icon: '🔗', label: 'LinkedIn', onClick: shareToLinkedIn, color: '#0077B5' },
    { icon: '📱', label: 'WhatsApp', onClick: shareToWhatsApp, color: '#25D366' },
    { icon: '📋', label: langKey === 'Cantonese' ? '複製連結' : langKey === '简体中文' ? '复制链接' : 'Copy Link', onClick: copyToClipboard, color: '#6B7280' },
    { icon: '📸', label: langKey === 'Cantonese' ? '截圖' : langKey === '简体中文' ? '截图' : 'Screenshot', onClick: downloadAsImage, color: '#8B5CF6' },
  ];

  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
          📤 {langKey === 'Cantonese' ? '分享分析報告' : langKey === '简体中文' ? '分享分析报告' : 'Share Analysis'}
        </span>
        <button onClick={() => setShowShareMenu(!showShareMenu)} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {showShareMenu ? '▼' : '▶'} {langKey === 'Cantonese' ? '分享選項' : langKey === '简体中文' ? '分享选项' : 'Share Options'}
        </button>
      </div>
      
      {showShareMenu && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {shareButtons.map((btn, idx) => (
            <button key={idx} onClick={btn.onClick} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: btn.color, color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <span>{btn.icon}</span> {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};