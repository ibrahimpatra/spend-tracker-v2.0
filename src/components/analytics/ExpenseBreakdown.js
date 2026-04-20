import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// iOS-compatible vibrant palette
const PALETTE = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#5AC8FA', '#FF2D55', '#FFCC00',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 text-xs">
      <p className="font-bold text-bank-900">{d.name}</p>
      <p className="text-bank-500 mt-0.5">
        {d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default function ExpenseBreakdown({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
        <h3 className="font-bold text-bank-900 mb-1">Expenses</h3>
        <div className="flex-1 flex items-center justify-center text-bank-500 text-sm">
          No expenses this period
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full">
      <h3 className="font-bold text-bank-900 mb-4">Expenses by Category</h3>

      <div className="flex items-center gap-4 flex-1 min-h-0">
        {/* Donut */}
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sorted} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={3} startAngle={90} endAngle={-270}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 overflow-hidden">
          {sorted.slice(0, 6).map((d, i) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                <span className="text-xs text-bank-900 font-medium truncate flex-1 min-w-0">{d.name}</span>
                <span className="text-xs text-bank-500 font-semibold flex-shrink-0">{pct}%</span>
              </div>
            );
          })}
          {sorted.length > 6 && (
            <p className="text-[10px] text-bank-500">+{sorted.length - 6} more categories</p>
          )}
        </div>
      </div>
    </div>
  );
}
