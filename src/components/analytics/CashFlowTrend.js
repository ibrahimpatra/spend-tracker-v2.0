import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'7px 10px', boxShadow:'var(--shadow-md)', fontSize:11 }}>
      <p style={{ margin:'0 0 4px', fontWeight:700, color:'var(--c-text-1)' }}>{label}</p>
      {payload.map((e,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--c-text-3)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:e.color, display:'inline-block' }} />
            {e.name}
          </span>
          <span style={{ fontWeight:700, color:'var(--c-text-1)' }}>{e.value.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
      ))}
    </div>
  );
};

export default function CashFlowTrend({ data, compact }) {
  const h = compact ? 180 : 220;
  return (
    <div className="card" style={{ padding:'12px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <h4 style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--c-text-1)' }}>Cash Flow</h4>
        <div style={{ display:'flex', gap:10 }}>
          {[{ label:'Income', color:'#059669' },{ label:'Expense', color:'#DC2626' }].map(l => (
            <span key={l.label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--c-text-3)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:l.color }} />{l.label}
            </span>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div style={{ height:h, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--c-text-4)' }}>No data</div>
      ) : (
        <div style={{ height:h }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:4, right:4, left:-32, bottom:0 }}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#DC2626" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border-light)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:'var(--c-text-4)', fontSize:9 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'var(--c-text-4)', fontSize:9 }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="Income"  stroke="#059669" strokeWidth={1.8} fill="url(#gInc)" dot={false} activeDot={{ r:3, strokeWidth:0 }} />
              <Area type="monotone" dataKey="Expense" stroke="#DC2626" strokeWidth={1.8} fill="url(#gExp)" dot={false} activeDot={{ r:3, strokeWidth:0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
