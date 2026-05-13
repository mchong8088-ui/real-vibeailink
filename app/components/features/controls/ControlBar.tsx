"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Mic, Volume2, Pause, Send } from 'lucide-react';

interface ControlBarProps {
  onSendMessage: (msg: string, contextUrl?: string) => void;
  onPlusClick: () => void; // Added to trigger the source menu
  langKey: string;
}

export function ControlBar({ onSendMessage, onPlusClick, langKey }: ControlBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [os, setOs] = useState('desktop');

  // Auto-detect system for voice fallback logic
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setOs('ios');
    } else if (userAgent.includes('android')) {
      setOs('android');
    } else if (userAgent.includes('linux')) {
      setOs('linux');
    } else if (userAgent.includes('win')) {
      setOs('windows');
    }
  }, []);

  return (
    <div className="flex items-center justify-center gap-6 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-50 shadow-sm mt-2">
      
      {/* 1. THE [+] BUTTON: Now linked to onPlusClick */}
      <button 
        onClick={onPlusClick}
        className="p-3 hover:bg-blue-100 rounded-full transition-colors text-slate-600 group relative" 
        title={langKey === "English" ? "Add Source (URL/File/Photo)" : "添加來源 (網址/檔案/拍照)"}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {/* 2. THE MIC: OS-Aware Input */}
      <button 
        onClick={() => setIsRecording(!isRecording)}
        className={`p-3 rounded-full transition-all ${
          isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-blue-100 text-slate-600'
        }`}
      >
        <Mic size={24} strokeWidth={3} />
      </button>

      {/* 3. THE SPEAKER: Auto-Detect Voice Output */}
      <button 
        className="p-3 hover:bg-blue-100 rounded-full text-slate-600"
        onClick={() => setIsSpeaking(!isSpeaking)}
      >
        <Volume2 size={24} strokeWidth={3} />
      </button>

      {/* 4. THE PAUSE: Immediate Stop */}
      <button 
        onClick={() => {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }} 
        className="p-3 hover:bg-red-100 rounded-full text-slate-600"
      >
        <Pause size={24} strokeWidth={3} />
      </button>

      {/* 5. THE SEND: Action Button */}
      <button 
        onClick={() => onSendMessage("")} // Logic to be handled by parent
        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform active:scale-95"
      >
        <Send size={24} strokeWidth={3} />
      </button>

    </div>
  );
}