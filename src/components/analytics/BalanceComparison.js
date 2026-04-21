import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'7px 10px', boxShadow:'var(--shadow-md)', fontSize:11 }}>
      <p style={{ margin:'0 0 3px', fontWeight:700, color:'var(--c-text-1)' }}>{label}</p>
      <p style={{ margin:0, fontWeight:700, color: val >= 0 ? 'var(--c-primary)' : 'var(--c-danger)' }}>
        {val.toLocaleString(undefined,{minimumFractionDigits:2})}
        <span style={{ fontWeight:400, color:'var(--c-text-4)', marginLeft:4 }}>{payload[0].payload.currency}</span>
      </p>
    </div>
  );
};

export default function BalanceComparison({ data, compact }) {
  const h = compact ? 180 : 220;
  return (
    <div className="card" style={{ padding:'12px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <h4 style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--c-text-1)' }}>Account Balances</h4>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--c-text-4)', background:'var(--c-surface-2)', padding:'2px 6px', borderRadius:'var(--r-full)', border:'1px solid var(--c-border-light)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Comparison</span>
      </div>
      {data.length === 0 ? (
        <div style={{ height:h, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--c-text-4)' }}>No accounts</div>
      ) : (
        <div style={{ height:h }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top:4, right:4, left:-32, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border-light)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:'var(--c-text-4)', fontSize:9 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'var(--c-text-4)', fontSize:9 }} />
              <Tooltip content={<Tip />} cursor={{ fill:'var(--c-surface-2)' }} />
              <Bar dataKey="Balance" radius={[5,5,0,0]} maxBarSize={48}>
                {data.map((e,i) => <Cell key={i} fill={e.Balance >= 0 ? '#2563EB' : '#DC2626'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
