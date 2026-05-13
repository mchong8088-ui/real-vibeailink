"use client";
import React, { useState } from 'react';
import { Mic, Volume2, Pause, Send, Plus } from 'lucide-react';

interface DashboardProps { onAnalyze: (ticker: string) => void; }

export function Dashboard({ onAnalyze }: DashboardProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onAnalyze(input.trim().toUpperCase());
  };

  return (
    <div className="w-full flex flex-col items-center border-none outline-none ring-0">
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3 border-none outline-none">
        
        {/* GROUP 1: THE WHITE BLANKET - Reduced Height, Massive Text */}
        <div 
          style={{ backgroundColor: '#ffffff', minHeight: '60px' }} // Height reduced to 1/2 (from 120px to 60px)
          className="w-full rounded-[32px] shadow-lg px-10 py-4 flex items-center justify-center border-none outline-none ring-0 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Input your stock Symbols: TSLA, 0700.HK or 2330.TW"
            // text-4xl makes the wording 2x bigger for clarity
            className="w-full bg-transparent text-4xl outline-none border-none ring-0 text-slate-800 placeholder:text-slate-400 font-bold text-center"
          />
        </div>

        {/* GROUP 2: THE 5 ICONS - Red & Green Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-2 border-none outline-none ring-0">
          {/* Subtle Plus Icon */}
          <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-full border-none outline-none transition-all">
            <Plus size={28} />
          </button>
          
          {/* MIC: Explicit RED */}
          <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-full border-none outline-none transition-all">
            <Mic size={28} strokeWidth={3} />
          </button>

          {/* SPEAKER: Explicit RED */}
          <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-full border-none outline-none transition-all">
            <Volume2 size={28} strokeWidth={3} />
          </button>

          {/* PAUSE: Explicit RED */}
          <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-full border-none outline-none transition-all">
            <Pause size={28} strokeWidth={3} />
          </button>

          {/* SEND: Explicit GREEN */}
          <button 
            type="submit" 
            disabled={!input.trim()}
            className={`p-2 rounded-full transition-all border-none outline-none ml-2 ${
              input.trim() ? 'text-green-600 scale-125 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Send 
              size={34} 
              fill={input.trim() ? "currentColor" : "none"} 
              strokeWidth={3} 
            />
          </button>
        </div>
      </form>
    </div>
  );
}