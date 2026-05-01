// app/success/page.tsx
"use client";

import React from 'react';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#fff',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        textAlign: 'center', 
        padding: '40px', 
        borderRadius: '32px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <CheckCircle2 size={80} color="#10b981" />
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '16px' }}>
          支付成功！
        </h1>
        
        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
          感謝您訂閱 Pro Elite 方案。您的 AI 智慧引擎已準備就緒，點數將在幾分鐘內自動注入您的帳戶。
        </p>

        <Link href="/" style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '16px',
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '16px',
          textDecoration: 'none',
          fontWeight: 700
        }}>
          進入控制面板 <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}