"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RefundPolicy() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Check if supabase is available (during build it might be null)
        if (typeof window !== 'undefined' && supabase && supabase.auth) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUserEmail(session.user.email ?? null);
            console.log("登入成功:", session.user.email);
          }
        }
      } catch (error) {
        console.error("獲取用戶失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const handlePortal = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    if (!userEmail) {
      alert("請先登入帳戶以管理訂閱");
      return;
    }

    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert(data.error || "無法開啟管理頁面");
      }
    } catch (err) {
      console.error("Portal Error:", err);
      alert("連線失敗，請檢查網路設定");
    }
  };

  const handleDowngrade = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.assign("https://buy.stripe.com/test_fZu28r2jeaJF9VTawy5wI01"); 
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Refund and Unsubscribe Policy</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Unsubscribe Policy</h2>
        <p>You can cancel your subscription at any time. Once canceled, you will not be charged for the next billing cycle.</p>
        
        <button 
          onClick={handlePortal}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#ef4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            marginTop: '10px' 
          }}
        >
          {loading ? "載入中..." : "Manage / Cancel Subscription"}
        </button>
      </section>

      <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Wait! Want to stay for less?</h2>
        <p>Switch to our Coffee Plan to keep the core features.</p>
        <button 
          onClick={handleDowngrade}
          style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}
        >
          Switch to Coffee Plan
        </button>
      </section>
    </div>
  );
}