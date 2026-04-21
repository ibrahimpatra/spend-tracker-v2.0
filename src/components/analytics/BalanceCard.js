import React from 'react';
import { CURRENCIES } from '../../constants';

const GRADIENTS = [
  { bg: 'linear-gradient(135deg, #2563EB 0%, #1e40af 100%)', text: '#fff', sub: 'rgba(255,255,255,0.65)' },
  { bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  { bg: '#fff',    border: 'var(--c-border)', text: 'var(--c-text-1)', sub: 'var(--c-text-4)' },
  { bg: '#F8FAFC', border: 'var(--c-border)', text: 'var(--c-text-1)', sub: 'var(--c-text-4)' },
];

export default function BalanceCard({ currency, balance, label, index }) {
  const s   = GRADIENTS[index] || GRADIENTS[2];
  const sym = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const neg = balance < 0;
  const isColoured = index < 2;

  return (
    <div style={{
      borderRadius: 'var(--r-xl)', padding: '12px 14px',
      background: s.bg, border: s.border ? `1px solid ${s.border}` : 'none',
      boxShadow: isColoured ? '0 4px 14px rgba(37,99,235,0.25)' : 'var(--shadow-xs)',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {isColoured && (
        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
      )}
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:9, fontWeight:700, color:s.sub, textTransform:'uppercase', letterSpacing:'0.05em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>
            {label}
          </span>
          <span style={{ fontSize:9, fontWeight:700, color:s.sub, background:'rgba(255,255,255,0.15)', padding:'1px 5px', borderRadius:'var(--r-full)', border: isColoured ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--c-border-light)' }}>
            {currency}
          </span>
        </div>
        <p style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:-0.5, color: neg ? (isColoured ? '#fca5a5' : 'var(--c-danger)') : s.text }}>
          {neg ? '-' : ''}{sym}{Math.abs(balance).toLocaleString(undefined,{minimumFractionDigits:2})}
        </p>
        <p style={{ margin:'3px 0 0', fontSize:9, color:s.sub }}>Current Balance</p>
      </div>
    </div>
  );
}
