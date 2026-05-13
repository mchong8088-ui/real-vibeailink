"use client";

import React from 'react';

export default function ThankYouPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>☕</div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>
        感謝您的支持！
      </h1>
      <p style={{ fontSize: '18px', color: '#4b5563', marginTop: '10px', maxWidth: '500px' }}>
        您的 Coffee Plan 訂閱/儲值已處理完成。額度通常會在幾分鐘內更新到您的帳戶中。
      </p>
      
      <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
        <button 
          onClick={() => window.location.assign('/')}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          返回首頁
        </button>
      </div>
    </div>
  );
}