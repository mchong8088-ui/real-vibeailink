import React from 'react';
import { TechData } from '../types';

interface DashboardProps {
  data: TechData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // 增加安全檢查，確保資料即使不存在也不會報錯
  const cards = [
    { label: "當前價格", value: data?.price || "N/A", unit: data?.currency || "", color: "#f3f4f6" },
    { 
      label: "RSI 指數", 
      value: data?.rsi || "N/A", 
      unit: "", 
      color: data?.rsi && parseInt(data.rsi) > 70 ? "#fee2e2" : "#eef2ff" 
    },
    { 
      label: "MACD 趨勢", 
      value: data?.macd || "N/A", 
      unit: "", 
      color: data?.macd === 'Bullish' ? "#dcfce7" : "#fee2e2" 
    },
    { label: "MA50 (季線)", value: data?.ma50 || "N/A", unit: "", color: "#fef3c7" },
    { label: "昨日收盤", value: data?.prevClose || "N/A", unit: "", color: "#f3f4f6" },
    { label: "交易量", value: data?.volume || "N/A", unit: "", color: "#f3f4f6" },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', // 自動適應寬度
      gap: '15px', 
      marginTop: '20px' 
    }}>
      {cards.map((card, i) => (
        <div key={i} style={{ 
          padding: '16px', 
          background: card.color, 
          borderRadius: '16px', 
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // 加入淡淡陰影更有質感
        }}>
          <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>{card.label}</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            {card.value} <span style={{ fontSize: '12px', fontWeight: 500 }}>{card.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
};