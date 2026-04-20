import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white px-3.5 py-2.5 rounded-xl shadow-lg border border-gray-100 text-xs">
      <p className="font-bold text-bank-900 mb-1">{label}</p>
      <p className={`font-bold ${val >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
        {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        <span className="text-bank-500 font-normal ml-1">{payload[0].payload.currency}</span>
      </p>
    </div>
  );
};

export default function BalanceComparison({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-[280px] flex flex-col">
        <h3 className="font-bold text-bank-900 mb-1">Account Balances</h3>
        <div className="flex-1 flex items-center justify-center text-bank-500 text-sm">No accounts selected</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-bank-900">Account Balances</h3>
        <span className="text-[11px] font-semibold text-bank-500 bg-gray-100 px-2.5 py-1 rounded-full">
          Comparison
        </span>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F7" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fill: '#8E8E93', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} dy={8} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: '#8E8E93', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F2F2F7' }} />
            <Bar dataKey="Balance" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.Balance >= 0 ? '#007AFF' : '#FF3B30'} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
