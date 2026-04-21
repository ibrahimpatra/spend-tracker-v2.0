import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PALETTE = ['#2563EB','#059669','#DC2626','#D97706','#7C3AED','#DB2777','#0891B2','#65A30D'];

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'6px 10px', boxShadow:'var(--shadow-md)', fontSize:11 }}>
      <p style={{ margin:0, fontWeight:700, color:'var(--c-text-1)' }}>{payload[0].name}</p>
      <p style={{ margin:'2px 0 0', color:'var(--c-text-3)' }}>{payload[0].value.toLocaleString(undefined,{minimumFractionDigits:2})}</p>
    </div>
  );
};

export default function ExpenseBreakdown({ data, compact }) {
  if (!data?.length) return (
    <div className="card" style={{ padding:'12px 14px', height:'100%', display:'flex', flexDirection:'column' }}>
      <h4 style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'var(--c-text-1)' }}>Expenses</h4>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--c-text-4)' }}>No expenses this period</div>
    </div>
  );

  const total  = data.reduce((s,d) => s+d.value, 0);
  const sorted = [...data].sort((a,b) => b.value - a.value);

  return (
    <div className="card" style={{ padding:'12px 14px', height:'100%', display:'flex', flexDirection:'column' }}>
      <h4 style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'var(--c-text-1)' }}>Expenses by Category</h4>
      <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
        <div style={{ width:90, height:90, flexShrink:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sorted} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={3} startAngle={90} endAngle={-270}>
                {sorted.map((_,i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, overflow:'hidden' }}>
          {sorted.slice(0,6).map((d,i) => {
            const pct = ((d.value/total)*100).toFixed(0);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:PALETTE[i%PALETTE.length], flexShrink:0 }} />
                <span style={{ fontSize:10, color:'var(--c-text-2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--c-text-3)', flexShrink:0 }}>{pct}%</span>
              </div>
            );
          })}
          {sorted.length > 6 && <p style={{ margin:0, fontSize:9, color:'var(--c-text-4)' }}>+{sorted.length-6} more</p>}
        </div>
      </div>
    </div>
  );
}
