import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import GlobalFilter from '../components/GlobalFilter';
import AddTransaction from '../components/AddTransactions';
import { Icon } from '../components/ui/index';
import { CURRENCIES } from '../constants';
import CashFlowTrend from '../components/analytics/CashFlowTrend';
import ExpenseBreakdown from '../components/analytics/ExpenseBreakdown';
import BalanceComparison from '../components/analytics/BalanceComparison';

const isTransfer = t => ['transfer','out_transfer','in_transfer'].includes(t);
const isIncome   = t => t === 'income' || t === 'in_transfer';

const DEFAULT_ORDER = ['stats','cashflow','comparison','breakdown','recent'];
const WIDGET_LABELS = { stats:'Summary', cashflow:'Cash Flow', comparison:'Accounts', breakdown:'Expenses', recent:'Activity' };

// ─── Tiny stat pill ────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div className="stat-pill">
      <p style={{ margin:0, fontSize:9, fontWeight:700, color:'var(--c-text-4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</p>
      <p style={{ margin:0, fontSize:13, fontWeight:800, color, letterSpacing:-0.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</p>
    </div>
  );
}

// ─── Tx row ────────────────────────────────────────────────────────────────────
function TxRow({ t, categories }) {
  const cat  = categories.find(c => c.id === t.categoryId);
  const isIn = isIncome(t.type);
  const isTrf = isTransfer(t.type);
  const isOut = t.type === 'out_transfer' || t.type === 'expense';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:'var(--r-md)', transition:'background 0.1s' }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--c-surface-2)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{ width:28, height:28, borderRadius:7, flexShrink:0, background: isTrf?'#EFF6FF':isIn?'#ECFDF5':'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
        {isTrf?'⇄':isIn?'↓':'↑'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:11, fontWeight:600, color:'var(--c-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {t.note || cat?.name || 'Transaction'}
        </p>
        <p style={{ margin:0, fontSize:9, color:'var(--c-text-4)' }}>{t.dateObj.toLocaleDateString('en',{month:'short',day:'numeric'})}</p>
      </div>
      <p style={{ margin:0, fontSize:11, fontWeight:700, flexShrink:0,
        color: isIn?'var(--c-success)': t.type==='out_transfer'?'var(--c-danger)': isTrf?'var(--c-primary)':'var(--c-text-1)'
      }}>
        {isIn?'+':isOut&&!isTrf?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
        <span style={{ fontSize:9, color:'var(--c-text-4)', marginLeft:2, fontWeight:500 }}>{t.currency}</span>
      </p>
    </div>
  );
}

// ─── Widget drag wrapper ───────────────────────────────────────────────────────
function DragWidget({ id, idx, onDragStart, onDragEnter, onDragEnd, children }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragEnter={() => onDragEnter(idx)}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      style={{ position:'relative', cursor:'auto' }}
    >
      {children}
      <div style={{ position:'absolute', top:8, right:8, opacity:0.25, cursor:'grab', fontSize:12, userSelect:'none' }} title="Drag to reorder">⠿</div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const navigate  = useNavigate();
  const [filter,       setFilter]       = useState({ dateRange:'thisMonth', accountIds:[], customStart:'', customEnd:'' });
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [showAdd,      setShowAdd]      = useState(false);

  // Per-account hide balance (persisted)
  const [hiddenBals, setHiddenBals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_hb') || '{}'); } catch { return {}; }
  });
  const saveHiddenBals = h => { setHiddenBals(h); localStorage.setItem('mv_hb', JSON.stringify(h)); };
  const toggleHide = id => saveHiddenBals({ ...hiddenBals, [id]: !hiddenBals[id] });

  // Widget order + visibility (persisted)
  const [order, setOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_wo') || 'null') || DEFAULT_ORDER; } catch { return DEFAULT_ORDER; }
  });
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_wh') || '[]'); } catch { return []; }
  });
  const saveOrder  = o => { setOrder(o);  localStorage.setItem('mv_wo', JSON.stringify(o)); };
  const saveHidden = h => { setHidden(h); localStorage.setItem('mv_wh', JSON.stringify(h)); };
  const toggleWidget = id => saveHidden(hidden.includes(id) ? hidden.filter(x=>x!==id) : [...hidden,id]);

  // Drag state
  const drag = useRef({ from: null, to: null });
  const onDragStart = i => { drag.current.from = i; };
  const onDragEnter = i => { drag.current.to   = i; };
  const onDragEnd   = () => {
    const { from, to } = drag.current;
    if (from === null || to === null || from === to) return;
    const next = [...order];
    const [m]  = next.splice(from, 1);
    next.splice(to, 0, m);
    saveOrder(next);
    drag.current = { from:null, to:null };
  };

  // Firebase subscriptions
  useEffect(() => onSnapshot(collection(db,`users/${user.uid}/accounts`), s => setAccounts(s.docs.map(d=>({id:d.id,...d.data()})))), [user]);
  useEffect(() => onSnapshot(collection(db,`users/${user.uid}/categories`), s => setCategories(s.docs.map(d=>({id:d.id,...d.data()})))), [user]);

  useEffect(() => {
    let start = new Date(), end = new Date();
    if (filter.dateRange==='thisMonth')  { start=new Date(start.getFullYear(),start.getMonth(),1); }
    else if (filter.dateRange==='lastMonth') { start=new Date(start.getFullYear(),start.getMonth()-1,1); end=new Date(end.getFullYear(),end.getMonth(),0); }
    else if (filter.dateRange==='custom'&&filter.customStart&&filter.customEnd) { start=new Date(filter.customStart); end=new Date(filter.customEnd); end.setHours(23,59,59); }
    else { start=new Date('2000-01-01'); }
    const q = query(collection(db,`users/${user.uid}/transactions`),where('date','>=',Timestamp.fromDate(start)),where('date','<=',Timestamp.fromDate(end)));
    return onSnapshot(q, s => {
      const all = s.docs.map(d=>({...d.data(),dateObj:d.data().date.toDate()}));
      const filtered = filter.accountIds.length ? all.filter(t=>filter.accountIds.includes(t.accountId)) : all;
      setTransactions(filtered.sort((a,b)=>b.dateObj-a.dateObj));
    });
  }, [user, filter]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selAccs   = filter.accountIds.length ? accounts.filter(a=>filter.accountIds.includes(a.id)) : accounts;
  const isSingle  = filter.accountIds.length === 1;
  const sameCurr  = new Set(selAccs.map(a=>a.currency)).size <= 1;
  const primCurr  = selAccs[0]?.currency || '';

  const periodIncome  = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const periodExpense = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const periodNet     = periodIncome - periodExpense;

  const trendData = useMemo(() => {
    const m = {};
    transactions.forEach(t => {
      const k = t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'});
      if (!m[k]) m[k]={name:k,Income:0,Expense:0,_d:t.dateObj};
      if (t.type==='income')  m[k].Income  += t.amount;
      if (t.type==='expense') m[k].Expense += t.amount;
    });
    return Object.values(m).sort((a,b)=>a._d-b._d);
  }, [transactions]);

  const barData = selAccs.map(a=>({name:a.name,Balance:a.currentBalance,currency:a.currency}));

  const pieData = useMemo(() => {
    const m = {};
    transactions.filter(t=>t.type==='expense').forEach(t=>{
      const name = categories.find(c=>c.id===t.categoryId)?.name || 'Uncategorized';
      m[name] = (m[name]||0) + t.amount;
    });
    return Object.entries(m).map(([name,value])=>({name,value}));
  }, [transactions, categories]);

  const fmt = n => n.toLocaleString(undefined,{minimumFractionDigits:2});

  // ── Widget renderer ───────────────────────────────────────────────────────────
  const renderWidget = (id, widgetIdx) => {
    if (hidden.includes(id)) return null;

    let content = null;
    switch(id) {
      case 'stats':
        if (!sameCurr || !selAccs.length) return null;
        content = (
          <div style={{ display:'flex', gap:8 }}>
            <StatPill label="Income"   value={`${primCurr} ${fmt(periodIncome)}`}  color="var(--c-success)" />
            <StatPill label="Expenses" value={`${primCurr} ${fmt(periodExpense)}`} color="var(--c-danger)"  />
            <StatPill label="Net"      value={`${primCurr} ${fmt(periodNet)}`}     color={periodNet>=0?'var(--c-primary)':'var(--c-danger)'} />
          </div>
        );
        break;
      case 'cashflow':
        if (!isSingle) return null;
        content = <CashFlowTrend data={trendData} compact />;
        break;
      case 'comparison':
        if (isSingle || barData.length < 2) return null;
        content = <BalanceComparison data={barData} compact />;
        break;
      case 'breakdown':
        if (!(isSingle || sameCurr) || !pieData.length) return null;
        content = <div style={{height:190}}><ExpenseBreakdown data={pieData} compact /></div>;
        break;
      case 'recent':
        content = (
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid var(--c-border-light)' }}>
              <h4 style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--c-text-1)' }}>Recent Activity</h4>
              <button onClick={()=>navigate('/records')} style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'var(--c-primary)', cursor:'pointer', padding:0 }}>View all →</button>
            </div>
            <div className="scroll" style={{ maxHeight:260, overflowY:'auto' }}>
              {transactions.length===0 ? (
                <p style={{ textAlign:'center', fontSize:11, color:'var(--c-text-4)', padding:'18px 0' }}>No transactions this period</p>
              ) : transactions.slice(0,15).map((t,i)=><TxRow key={i} t={t} categories={categories}/>)}
            </div>
          </div>
        );
        break;
      default: return null;
    }

    if (!content) return null;
    return (
      <DragWidget key={id} id={id} idx={widgetIdx} onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd}>
        {content}
      </DragWidget>
    );
  };

  // Split visible widgets into 2 columns (for desktop grid)
  const visibleWidgets = order.filter(id => !hidden.includes(id));

  return (
    <div style={{ paddingBottom:80 }}>

      {/* Top row: filter + add btn */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:2 }}>
        <div style={{ flex:1 }}>
          <GlobalFilter filterState={filter} setFilterState={setFilter} accounts={accounts} />
        </div>
        <button onClick={()=>setShowAdd(true)} className="hidden md:flex"
          style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:'var(--r-md)', background:'var(--c-primary)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-xs)', marginTop:1 }}>
          <Icon name="plus" size={12} style={{color:'#fff'}} /> Add
        </button>
      </div>

      {/* Widget toggle bar */}
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:10, overflowX:'auto' }} className="scroll">
        {DEFAULT_ORDER.map(id => {
          const isHidden = hidden.includes(id);
          return (
            <button key={id} onClick={()=>toggleWidget(id)} style={{
              flexShrink:0, padding:'3px 8px', borderRadius:'var(--r-full)',
              fontSize:10, fontWeight:600, cursor:'pointer', border:'1px solid',
              transition:'all 0.12s',
              background:  isHidden ? 'var(--c-surface)'       : 'var(--c-primary-light)',
              borderColor: isHidden ? 'var(--c-border)'         : 'var(--c-primary-muted)',
              color:       isHidden ? 'var(--c-text-4)'         : 'var(--c-primary)',
              textDecoration: isHidden ? 'line-through' : 'none',
            }}>{WIDGET_LABELS[id]}</button>
          );
        })}
        <button onClick={()=>{ saveOrder(DEFAULT_ORDER); saveHidden([]); }} style={{ flexShrink:0, padding:'3px 7px', borderRadius:'var(--r-full)', fontSize:10, fontWeight:600, border:'1px solid var(--c-border)', background:'var(--c-surface)', color:'var(--c-text-3)', cursor:'pointer' }}>
          Reset
        </button>
      </div>

      {/* Per-account balance cards with hide toggle */}
      {selAccs.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8, marginBottom:12 }}>
          {selAccs.map((acc,i) => {
            const sym    = CURRENCIES.find(c=>c.code===acc.currency)?.symbol || acc.currency;
            const hidden_ = hiddenBals[acc.id];
            const neg    = acc.currentBalance < 0;
            return (
              <div key={acc.id} className="card" style={{
                padding:'10px 12px', position:'relative',
                background: i===0 ? 'linear-gradient(135deg,#2563EB,#1e40af)' : i===1 ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'var(--c-surface)',
                border: i<2 ? 'none' : '1px solid var(--c-border)',
                boxShadow: i<2 ? '0 4px 14px rgba(37,99,235,0.3)' : 'var(--shadow-xs)',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:i<2?'rgba(255,255,255,0.6)':'var(--c-text-4)', textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'75%' }}>
                    {acc.name}
                  </span>
                  <button onClick={()=>toggleHide(acc.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:1, color:i<2?'rgba(255,255,255,0.5)':'var(--c-text-4)', display:'flex', alignItems:'center' }}>
                    <Icon name={hidden_?'eyeOff':'eye'} size={10} />
                  </button>
                </div>
                <p style={{
                  margin:'0 0 3px', fontSize:16, fontWeight:800, letterSpacing:-0.5,
                  color: i<2 ? (neg?'#fca5a5':'#fff') : (neg?'var(--c-danger)':'var(--c-text-1)'),
                  filter: hidden_?'blur(8px)':'none', userSelect:hidden_?'none':'auto', transition:'filter 0.2s',
                }}>
                  {sym}{Math.abs(acc.currentBalance).toLocaleString(undefined,{minimumFractionDigits:2})}
                </p>
                <span style={{ fontSize:9, color:i<2?'rgba(255,255,255,0.5)':'var(--c-text-4)', fontWeight:600 }}>
                  {acc.currency} · {acc.type}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {selAccs.length===0 && (
        <div style={{ border:'2px dashed var(--c-border)', borderRadius:'var(--r-xl)', padding:'20px', textAlign:'center', color:'var(--c-text-4)', fontSize:12, marginBottom:12 }}>
          No accounts yet. <a href="/accounts" style={{ color:'var(--c-primary)', fontWeight:700 }}>Create one →</a>
        </div>
      )}

      {/* Draggable widgets — 2-col on desktop, 1-col on mobile */}
      <div className="hidden md:grid" style={{ gridTemplateColumns:'1fr 1fr', gap:10, display:'none' }}>
        {/* Left col */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {visibleWidgets.filter((_,i)=>i%2===0).map(id => renderWidget(id, order.indexOf(id)))}
        </div>
        {/* Right col */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {visibleWidgets.filter((_,i)=>i%2===1).map(id => renderWidget(id, order.indexOf(id)))}
        </div>
      </div>

      {/* Mobile single col */}
      <div className="md:hidden" style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {visibleWidgets.map(id => renderWidget(id, order.indexOf(id)))}
      </div>

      {/* Desktop grid (non-tailwind fallback using CSS grid) */}
      <style>{`
        @media (min-width: 768px) {
          .dash-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; }
          .dash-single { display: none !important; }
        }
        @media (max-width: 767px) {
          .dash-grid { display: none !important; }
          .dash-single { display: flex !important; flex-direction: column; gap: 10px; }
        }
      `}</style>
      <div className="dash-grid">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {visibleWidgets.filter((_,i)=>i%2===0).map(id => renderWidget(id, order.indexOf(id)))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {visibleWidgets.filter((_,i)=>i%2===1).map(id => renderWidget(id, order.indexOf(id)))}
        </div>
      </div>
      <div className="dash-single">
        {visibleWidgets.map(id => renderWidget(id, order.indexOf(id)))}
      </div>

      {/* Mobile FAB */}
      <button onClick={()=>setShowAdd(true)} style={{
        position:'fixed', bottom:'calc(60px + env(safe-area-inset-bottom,0px))', right:14,
        width:46, height:46, borderRadius:'50%', background:'var(--c-primary)', border:'none',
        color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 16px rgba(37,99,235,0.45)', zIndex:40,
      }} className="md:hidden">
        <Icon name="plus" size={20} strokeWidth={2.5} style={{color:'#fff'}} />
      </button>

      {showAdd && <AddTransaction user={user} onClose={()=>setShowAdd(false)} />}
    </div>
  );
}
