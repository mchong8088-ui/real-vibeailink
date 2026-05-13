// components/features/stock-analysis/AnalysisDashboard.tsx
"use client";
import React from 'react';
import { Activity } from 'lucide-react';

interface AnalysisDashboardProps {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, isLoading, langKey, t }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">{t.analyzingMarket}</p>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <Activity size={48} strokeWidth={1} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-400 text-base">Please input stock symbol below</p>
        <p className="text-slate-300 text-sm mt-2">e.g.: 0700.hk, TSLA, 2330.TW</p>
      </div>
    );
  }

  // Only show when we have real data
  const symbol = data?.symbol || "Stock";
  const currentPrice = data?.price || "N/A";
  const rsiValue = data?.rsi || "N/A";
  const macdValue = data?.macd || "N/A";

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6">
      
      {/* Stock Name */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">{symbol}</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time Analysis</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
          <p className="text-xl font-black text-slate-800">{currentPrice}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">RSI (14)</p>
          <p className="text-xl font-black text-blue-500">{rsiValue}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">MACD</p>
          <p className="text-xl font-black text-emerald-500">{macdValue}</p>
        </div>
      </div>

      {/* Analysis Text */}
      {data.summary && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
        </div>
      )}
    </div>
  );
};