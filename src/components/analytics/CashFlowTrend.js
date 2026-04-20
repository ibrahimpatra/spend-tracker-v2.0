import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3.5 py-2.5 rounded-xl shadow-lg border border-gray-100 text-xs">
      <p className="font-bold text-bank-900 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-bank-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold text-bank-900">
            {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CashFlowTrend({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-[280px] flex flex-col">
        <h3 className="font-bold text-bank-900 mb-1">Cash Flow</h3>
        <div className="flex-1 flex items-center justify-center text-bank-500 text-sm">No data for this period</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-bank-900">Cash Flow</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-bank-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />Income
          </span>
          <span className="flex items-center gap-1.5 text-bank-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />Expense
          </span>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34C759" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FF3B30" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#FF3B30" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F7" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fill: '#8E8E93', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} dy={8} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: '#8E8E93', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Income"  stroke="#34C759" strokeWidth={2} fill="url(#incGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="Expense" stroke="#FF3B30" strokeWidth={2} fill="url(#expGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
