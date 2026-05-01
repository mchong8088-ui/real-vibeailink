"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';

export const PriceChart = ({ data }: { data: any[] }) => {
  return (
    <div style={{ width: '100%', height: '350px', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
      <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>股價趨勢與技術指標</h4>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={['auto', 'auto']} fontSize={12} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          
          {/* 布林通道底色 */}
          <Area type="monotone" dataKey="upper" stroke="none" fill="#e2e8f0" fillOpacity={0.3} />
          <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" />
          
          {/* 股價主線 (品牌藍) */}
          <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} dot={false} />
          
          {/* VWAP (虛線) */}
          <Line type="monotone" dataKey="vwap" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};