import { useState } from 'react';

export function useStockAnalysis(langKey: string) {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeStock = async (
    symbol: string, 
    useAI: boolean = false,
    user: any = null,
    profile: any = null,
    onAuthOpen?: () => void,
    onNavigate?: (page: string, params?: any) => void
  ) => {
    if (!symbol.trim()) return;

    if (!user) {
      const msg = langKey === 'Traditional Chinese' ? '請先登入' : 
                  langKey === 'Simplified Chinese' ? '请先登录' : 
                  'Please login first';
      alert(msg);
      if (onAuthOpen) onAuthOpen();
      return;
    }

    if (profile && profile.credits <= 0) {
      const msg = langKey === 'Traditional Chinese' ? '積分不足，是否升級計劃？' : 
                  langKey === 'Simplified Chinese' ? '积分不足，是否升级计划？' : 
                  'Insufficient credits. Would you like to upgrade?';
      const confirmUpgrade = confirm(msg);
      if (confirmUpgrade && onNavigate) {
        onNavigate('content', { view: 'pricing' });
      }
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = useAI ? '/api/chat/ai-enhanced' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: symbol.trim(), 
          language: langKey,
          useAI: useAI
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg = data.summary || data.text || `Unable to analyze ${symbol.trim().toUpperCase()}`;
        setAnalysisData({
          symbol: symbol.trim().toUpperCase(),
          summary: errorMsg,
          price: "N/A",
          change: null,
          changePercent: null,
          companyName: null,
          currency: null,
          rsi: "N/A",
          macd: "N/A",
          trend: "N/A",
          marketCap: "N/A",
          peRatio: "N/A",
          volume: "N/A",
          historical: [],
        });
        setIsLoading(false);
        return;
      }

      // Use the same data structure as desktop
      setAnalysisData({
        symbol: data.symbol || symbol.trim().toUpperCase(),
        summary: data.text || data.summary,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        companyName: data.companyName,
        currency: data.currency,
        rsi: data.rsi,
        macd: data.macd,
        trend: data.trend,
        marketCap: data.marketCap || "N/A",
        peRatio: data.peRatio || "N/A",
        volume: data.volume || "N/A",
        historical: data.historical || [],
        sma20: data.sma20,
        sma50: data.sma50,
        volatility: data.volatility,
        avgVolume: data.avgVolume,
        dayLow: data.dayLow,
        dayHigh: data.dayHigh,
        specificAnalysis: data.specificAnalysis
      });
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = langKey === 'Traditional Chinese' ? `無法分析 ${symbol.trim().toUpperCase()}，請稍後再試。` :
                       langKey === 'Simplified Chinese' ? `无法分析 ${symbol.trim().toUpperCase()}，请稍后再试。` :
                       `Unable to analyze ${symbol.trim().toUpperCase()}. Please try again.`;
      setAnalysisData({
        symbol: symbol.trim().toUpperCase(),
        summary: errorMsg,
        price: "N/A",
        change: null,
        changePercent: null,
        companyName: null,
        currency: null,
        rsi: "N/A",
        macd: "N/A",
        trend: "N/A",
        marketCap: "N/A",
        peRatio: "N/A",
        volume: "N/A",
        historical: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { analysisData, isLoading, analyzeStock, setAnalysisData };
}
