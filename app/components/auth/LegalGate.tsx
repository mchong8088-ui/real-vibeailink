"use client";
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, LogOut } from 'lucide-react';
import { footerContent } from '../../constants/content';
import { supabase } from '../../lib/supabase';

export const LegalGate = ({ onAccept, language }: { onAccept: () => void, language: string }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercent = (scrollTop + clientHeight) / scrollHeight;
    if (scrollPercent > 0.85) {
      setHasScrolledToBottom(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    // Main Overlay
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* The Modal Window */}
      <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Final Step</h2>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 text-slate-600 leading-relaxed space-y-8"
        >
          <section>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">服務條款 (Terms)</h3>
            <p className="whitespace-pre-wrap text-sm">{footerContent["服務條款"]?.[language]}</p>
          </section>
          
          <section>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">免責聲明 (Disclaimer)</h3>
            <p className="whitespace-pre-wrap text-sm">{footerContent["免責聲明"]?.[language]?.content}</p>
          </section>

          <section className="pb-12">
            <h3 className="font-bold text-slate-800 mb-2 text-lg">隱私政策 (Privacy Policy)</h3>
            <p className="whitespace-pre-wrap text-sm">{footerContent["隱私政策"]?.[language]}</p>
          </section>
        </div>

        {/* Sticky Footer Button */}
        <div className="p-6 bg-white border-t">
          <p className="text-xs text-slate-400 mb-4 text-center">
            {hasScrolledToBottom ? "✓ You may now proceed" : "Please scroll to the bottom to enable the button"}
          </p>
          <button 
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              hasScrolledToBottom 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={20} />
            Accept & Confirm (Get 100 Credits)
          </button>
        </div>

      </div>
    </div>
  );
};