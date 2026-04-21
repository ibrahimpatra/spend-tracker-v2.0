import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Legend,
} from 'recharts';
import { useAccounts, useCategories, useTransactions, useStats, useTrendData, usePieData, isTransfer, isIncome } from '../hooks/useData';
import GlobalFilter from '../components/GlobalFilter';
import TxDrawer from '../components/TxDrawer';
import { IOS, CURRENCIES, CHART_COLORS } from '../constants';
import { Icon, Card, Btn, Empty } from '../components/ui';

// ─── Widget registry ──────────────────────────────────────────────────────────
const WIDGETS = {
  cashflow:    { label:'Cash Flow',       icon:'chart',  minW:1, defaultW:2 },
  breakdown:   { label:'Spending',        icon:'tag',    minW:1, defaultW:1 },
  comparison:  { label:'Accounts',        icon:'card',   minW:1, defaultW:1 },
  monthly:     { label:'Monthly Trend',   icon:'chart',  minW:2, defaultW:2 },
  topcat:      { label:'Top Categories',  icon:'list',   minW:1, defaultW:1 },
  recent:      { label:'Recent Activity', icon:'list',   minW:1, defaultW:2 },
};
const DEFAULT_ORDER = ['cashflow','breakdown','comparison','monthly','topcat','recent'];
const GRID_COLS = 2;

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(255,255,255,0.95)', border:`1px solid ${IOS.gray8}`, borderRadius:10, padding:'8px 12px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', fontSize:12 }}>
      <p style={{ margin:'0 0 5px', fontWeight:700, color:IOS.gray2 }}>{label}</p>
      {payload.map((e,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0 }} />
          <span style={{ color:IOS.gray4 }}>{e.name}:</span>
          <span style={{ fontWeight:700, color:IOS.gray1 }}>{typeof e.value==='number'?e.value.toLocaleString(undefined,{minimumFractionDigits:2}):e.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Widget components ────────────────────────────────────────────────────────
function CashFlowWidget({ data }) {
  return (
    <div style={{ height:200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{top:4,right:4,left:-28,bottom:0}}>
          <defs>
            <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={IOS.green} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={IOS.green} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={IOS.red} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={IOS.red} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:IOS.gray5,fontSize:9}} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={{fill:IOS.gray5,fontSize:9}} />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="Income"  stroke={IOS.green} strokeWidth={2} fill="url(#gInc)" dot={false} activeDot={{r:4,strokeWidth:0}}/>
          <Area type="monotone" dataKey="Expense" stroke={IOS.red}   strokeWidth={2} fill="url(#gExp)" dot={false} activeDot={{r:4,strokeWidth:0}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function BreakdownWidget({ data }) {
  if (!data.length) return <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:IOS.gray5}}>No expenses</div>;
  const total = data.reduce((s,d)=>s+d.value,0);
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,height:160}}>
      <div style={{width:100,height:100,flexShrink:0}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={30} outerRadius={46} paddingAngle={3} startAngle={90} endAngle={-270}>
              {data.map((d,i)=><Cell key={i} fill={d.color||CHART_COLORS[i%CHART_COLORS.length]}/>)}
            </Pie>
            <Tooltip formatter={(v)=>[v.toLocaleString(undefined,{minimumFractionDigits:2}),'']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:5,overflow:'hidden'}}>
        {data.slice(0,5).map((d,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:d.color||CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
            <span style={{fontSize:11,color:IOS.gray2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</span>
            <span style={{fontSize:10,fontWeight:700,color:IOS.gray4,flexShrink:0}}>{((d.value/total)*100).toFixed(0)}%</span>
          </div>
        ))}
        {data.length>5&&<p style={{fontSize:10,color:IOS.gray5,margin:0}}>+{data.length-5} more</p>}
      </div>
    </div>
  );
}

function ComparisonWidget({ accounts }) {
  const data = accounts.map(a=>({name:a.name,Balance:a.currentBalance,currency:a.currency}));
  if (!data.length) return <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:IOS.gray5}}>No accounts</div>;
  return (
    <div style={{height:160}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{top:4,right:4,left:-32,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9}/>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:IOS.gray5,fontSize:9}} dy={6}/>
          <YAxis axisLine={false} tickLine={false} tick={{fill:IOS.gray5,fontSize:9}}/>
          <Tooltip content={<Tip />} cursor={{fill:IOS.gray9+'88'}}/>
          <Bar dataKey="Balance" radius={[6,6,0,0]} maxBarSize={40}>
            {data.map((e,i)=><Cell key={i} fill={e.Balance>=0?IOS.blue:IOS.red} fillOpacity={0.85}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyWidget({ transactions }) {
  const data = useMemo(()=>{
    const map={};
    transactions.forEach(t=>{
      const k=t.dateObj.toLocaleString('default',{month:'short'});
      if(!map[k])map[k]={name:k,Income:0,Expense:0};
      if(t.type==='income')map[k].Income+=t.amount;
      if(t.type==='expense')map[k].Expense+=t.amount;
    });
    return Object.values(map);
  },[transactions]);
  if(!data.length) return <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:IOS.gray5}}>No data</div>;
  return (
    <div style={{height:180}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{top:4,right:4,left:-32,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9}/>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:IOS.gray5,fontSize:9}}/>
          <YAxis axisLine={false} tickLine={false} tick={{fill:IOS.gray5,fontSize:9}}/>
          <Tooltip content={<Tip />} cursor={{fill:IOS.gray9+'88'}}/>
          <Bar dataKey="Income"  fill={IOS.green} radius={[4,4,0,0]} maxBarSize={28}/>
          <Bar dataKey="Expense" fill={IOS.red}   radius={[4,4,0,0]} maxBarSize={28}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopCatWidget({ pieData }) {
  if(!pieData.length) return <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:IOS.gray5}}>No expenses</div>;
  const top = pieData.slice(0,5);
  const max = top[0]?.value||1;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8,height:160,justifyContent:'center'}}>
      {top.map((d,i)=>(
        <div key={i}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:d.color||CHART_COLORS[i],flexShrink:0}}/>
              <span style={{fontSize:11,color:IOS.gray2,fontWeight:500}}>{d.name}</span>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:IOS.gray2}}>{d.value.toLocaleString(undefined,{minimumFractionDigits:0})}</span>
          </div>
          <div style={{height:4,background:IOS.gray9,borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(d.value/max)*100}%`,background:d.color||CHART_COLORS[i],borderRadius:2,transition:'width 0.5s'}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentWidget({ txns, categories, onTxClick }) {
  return (
    <div style={{maxHeight:240,overflowY:'auto'}}>
      {txns.length===0
        ? <p style={{textAlign:'center',fontSize:12,color:IOS.gray5,padding:'20px 0'}}>No transactions this period</p>
        : txns.slice(0,12).map((t,i)=>{
            const cat  = categories.find(c=>c.id===t.categoryId);
            const isIn = isIncome(t.type);
            const isTrf= isTransfer(t.type);
            return (
              <div key={i} onClick={()=>onTxClick(t)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<11?`1px solid ${IOS.gray9}`:'none',cursor:'pointer'}}>
                <div style={{width:34,height:34,borderRadius:10,background:isTrf?IOS.blue+'15':isIn?IOS.green+'15':IOS.red+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>
                  {isTrf?'⇄':isIn?'↓':'↑'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:12,fontWeight:600,color:IOS.gray1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.note||cat?.name||'Transaction'}</p>
                  <p style={{margin:0,fontSize:10,color:IOS.gray5}}>{t.dateObj.toLocaleDateString('en',{month:'short',day:'numeric'})}</p>
                </div>
                <p style={{margin:0,fontSize:12,fontWeight:700,flexShrink:0,color:isIn?IOS.green:t.type==='out_transfer'?IOS.red:isTrf?IOS.blue:IOS.gray1}}>
                  {isIn?'+':!isTrf?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                  <span style={{fontSize:9,color:IOS.gray5,marginLeft:2}}>{t.currency}</span>
                </p>
              </div>
            );
          })
      }
    </div>
  );
}

// ─── Widget shell (card with header, drag handle, resize) ─────────────────────
function WidgetCard({ id, widgetW, onToggleSize, children, label, icon }) {
  return (
    <div style={{ gridColumn:`span ${widgetW}`, position:'relative' }}>
      <Card style={{ padding:'14px 16px', height:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Icon name={icon} size={13} color={IOS.gray5} />
            <span style={{ fontSize:12, fontWeight:700, color:IOS.gray3, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={()=>onToggleSize(id)} style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:6, color:IOS.gray5 }} title={widgetW===2?'Collapse':'Expand'}>
              <Icon name={widgetW===2?'close':'grid'} size={12} color={IOS.gray5} />
            </button>
          </div>
        </div>
        {children}
      </Card>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [filter,  setFilter]  = useState({ dateRange:'thisMonth', accountIds:[], customStart:'', customEnd:'' });
  const [showAdd, setShowAdd] = useState(false);
  const [editTx,  setEditTx]  = useState(null);

  // Hide balance per account
  const [hiddenBals, setHiddenBals] = useState(() => { try{return JSON.parse(localStorage.getItem('mv_hb')||'{}')}catch{return{}} });
  const saveHB = h => { setHiddenBals(h); localStorage.setItem('mv_hb',JSON.stringify(h)); };

  // Widget layout: order + widths
  const [widgetOrder, setWidgetOrder] = useState(() => { try{return JSON.parse(localStorage.getItem('mv_wo')||'null')||DEFAULT_ORDER}catch{return DEFAULT_ORDER} });
  const [widgetWidths, setWidgetWidths] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_ww')||'null') || Object.fromEntries(DEFAULT_ORDER.map(id=>[id,WIDGETS[id].defaultW])); }
    catch { return Object.fromEntries(DEFAULT_ORDER.map(id=>[id,WIDGETS[id].defaultW])); }
  });
  const [hiddenW, setHiddenW] = useState(() => { try{return JSON.parse(localStorage.getItem('mv_hw')||'[]')}catch{return[]} });

  const saveOrder  = o => { setWidgetOrder(o);  localStorage.setItem('mv_wo',JSON.stringify(o)); };
  const saveWidths = w => { setWidgetWidths(w); localStorage.setItem('mv_ww',JSON.stringify(w)); };
  const saveHidden = h => { setHiddenW(h);      localStorage.setItem('mv_hw',JSON.stringify(h)); };

  const toggleWidget = id => saveHidden(hiddenW.includes(id)?hiddenW.filter(x=>x!==id):[...hiddenW,id]);
  const toggleSize   = id => {
    const curr = widgetWidths[id]||WIDGETS[id].defaultW;
    const minW  = WIDGETS[id].minW;
    const next  = curr===2 ? minW : 2;
    saveWidths({ ...widgetWidths, [id]: next });
  };

  // Drag state
  const drag = useRef({from:null,to:null});
  const onDragStart = i  => { drag.current.from = i; };
  const onDragEnter = i  => { drag.current.to   = i; };
  const onDragEnd   = () => {
    const { from, to } = drag.current;
    if (from===null||to===null||from===to) return;
    const next=[...widgetOrder]; const [m]=next.splice(from,1); next.splice(to,0,m);
    saveOrder(next); drag.current={from:null,to:null};
  };

  const accounts   = useAccounts(user.uid);
  const categories = useCategories(user.uid);
  const txns       = useTransactions(user.uid, filter);
  const stats      = useStats(txns);
  const trendData  = useTrendData(txns);
  const pieData    = usePieData(txns, categories);

  const selAccounts = filter.accountIds.length ? accounts.filter(a=>filter.accountIds.includes(a.id)) : accounts;
  const isSingle   = filter.accountIds.length===1;
  const sameCurr   = new Set(selAccounts.map(a=>a.currency)).size<=1;
  const primCurr   = selAccounts[0]?.currency||'';
  const primSym    = CURRENCIES.find(c=>c.code===primCurr)?.symbol||'';
  const periodStats = stats[primCurr]||{income:0,expense:0,net:0};
  const fmt = n=>n.toLocaleString(undefined,{minimumFractionDigits:2});

  const renderWidget = (id, idx) => {
    if (hiddenW.includes(id)) return null;
    const wW = widgetWidths[id]||WIDGETS[id].defaultW;
    const w  = WIDGETS[id];

    let content;
    switch(id) {
      case 'cashflow':   content=<CashFlowWidget data={trendData} />; break;
      case 'breakdown':  content=<BreakdownWidget data={pieData} />; break;
      case 'comparison': content=<ComparisonWidget accounts={selAccounts} />; break;
      case 'monthly':    content=<MonthlyWidget transactions={txns} />; break;
      case 'topcat':     content=<TopCatWidget pieData={pieData} />; break;
      case 'recent':     content=<RecentWidget txns={txns} categories={categories} onTxClick={t=>{setEditTx(t);setShowAdd(true);}} />; break;
      default: return null;
    }

    return (
      <div key={id} draggable
        onDragStart={()=>onDragStart(idx)}
        onDragEnter={()=>onDragEnter(idx)}
        onDragEnd={onDragEnd}
        onDragOver={e=>e.preventDefault()}
        style={{ gridColumn:`span ${Math.min(wW,GRID_COLS)}`, minWidth:0 }}
      >
        <Card style={{ padding:'14px 16px', height:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:10, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{w.label}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ cursor:'grab', opacity:0.3, fontSize:13, userSelect:'none' }}>⠿</span>
              <button onClick={()=>toggleSize(id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 5px', borderRadius:6, fontSize:10, color:IOS.gray5, fontFamily:'inherit' }}>
                {wW===2?'⬜':'⬛'}
              </button>
            </div>
          </div>
          {content}
        </Card>
      </div>
    );
  };

  return (
    <div style={{ padding:'14px 16px 24px', maxWidth:1200, margin:'0 auto' }}>

      {/* Heading */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:IOS.gray1, letterSpacing:-0.5 }}>Dashboard</h1>
        <Btn icon="plus" onClick={()=>{setEditTx(null);setShowAdd(true);}}>Add</Btn>
      </div>

      {/* Global filter */}
      <GlobalFilter filterState={filter} setFilterState={setFilter} accounts={accounts} />

      {/* Widget toggle bar */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <span style={{ fontSize:10, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', marginRight:2 }}>Widgets:</span>
        {DEFAULT_ORDER.map(id=>{
          const hidden=hiddenW.includes(id);
          return <button key={id} onClick={()=>toggleWidget(id)} style={{
            padding:'3px 9px', borderRadius:20, border:'1px solid', fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            background: hidden?'#fff':IOS.blue+'12', borderColor:hidden?IOS.gray8:IOS.blue+'44',
            color:hidden?IOS.gray5:IOS.blue, textDecoration:hidden?'line-through':'none',
          }}>{WIDGETS[id].label}</button>;
        })}
        <button onClick={()=>{saveOrder(DEFAULT_ORDER);saveHidden([]);saveWidths(Object.fromEntries(DEFAULT_ORDER.map(id=>[id,WIDGETS[id].defaultW])));}} style={{ padding:'3px 8px', borderRadius:20, border:`1px solid ${IOS.gray8}`, fontSize:10, fontWeight:600, cursor:'pointer', background:'#fff', color:IOS.gray4, fontFamily:'inherit' }}>
          Reset
        </button>
      </div>

      {/* Account balance cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:10, marginBottom:14 }}>
        {selAccounts.map((acc,i)=>{
          const sym   = CURRENCIES.find(c=>c.code===acc.currency)?.symbol||acc.currency;
          const h     = hiddenBals[acc.id];
          const neg   = acc.currentBalance<0;
          const isFirst = i===0;
          return (
            <div key={acc.id} style={{
              borderRadius:18, padding:'14px 16px', position:'relative', overflow:'hidden',
              background: isFirst ? `linear-gradient(135deg,${IOS.blue},#003DCB)` : i===1 ? 'linear-gradient(135deg,#1C1C1E,#3A3A3C)' : '#fff',
              boxShadow: isFirst ? `0 6px 20px ${IOS.blue}40` : '0 1px 4px rgba(0,0,0,0.06)',
              border: i>=2 ? `1px solid ${IOS.gray8}` : 'none',
            }}>
              {isFirst && <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:700, color:i<2?'rgba(255,255,255,0.6)':IOS.gray5, textTransform:'uppercase', letterSpacing:'0.04em', maxWidth:'75%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.name}</span>
                <button onClick={()=>saveHB({...hiddenBals,[acc.id]:!h})} style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:i<2?'rgba(255,255,255,0.5)':IOS.gray5, display:'flex', alignItems:'center' }}>
                  <Icon name={h?'eyeOff':'eye'} size={12} color={i<2?'rgba(255,255,255,0.6)':IOS.gray5} />
                </button>
              </div>
              <p style={{
                margin:'0 0 4px', fontSize:18, fontWeight:800, letterSpacing:-0.8,
                color: i<2?(neg?'#ffb3b0':'#fff'):(neg?IOS.red:IOS.gray1),
                filter:h?'blur(8px)':'none', userSelect:h?'none':'auto', transition:'filter 0.2s',
              }}>
                {sym}{Math.abs(acc.currentBalance).toLocaleString(undefined,{minimumFractionDigits:2})}
              </p>
              <span style={{ fontSize:9, color:i<2?'rgba(255,255,255,0.45)':IOS.gray5, fontWeight:600 }}>{acc.currency} · {acc.type}</span>
            </div>
          );
        })}
        {selAccounts.length===0 && (
          <div style={{ gridColumn:'1/-1', border:`2px dashed ${IOS.gray8}`, borderRadius:18, padding:'20px', textAlign:'center', color:IOS.gray5, fontSize:12 }}>
            No accounts yet. <a href="/accounts" style={{ color:IOS.blue, fontWeight:700 }}>Create one →</a>
          </div>
        )}
      </div>

      {/* Period summary pills */}
      {selAccounts.length>0 && sameCurr && (
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {[
            {l:'Income',  v:`${primSym}${fmt(periodStats.income)}`,  c:IOS.green},
            {l:'Expenses',v:`${primSym}${fmt(periodStats.expense)}`, c:IOS.red},
            {l:'Net',     v:`${primSym}${fmt(periodStats.net)}`,     c:periodStats.net>=0?IOS.blue:IOS.red},
          ].map(p=>(
            <div key={p.l} style={{ flex:1, minWidth:100, background:'#fff', borderRadius:14, padding:'10px 14px', border:`1px solid ${IOS.gray8}` }}>
              <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{p.l}</p>
              <p style={{ margin:0, fontSize:14, fontWeight:800, color:p.c, letterSpacing:-0.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Draggable widget grid */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${GRID_COLS},1fr)`, gap:10 }}>
        {widgetOrder.map((id,idx) => renderWidget(id, idx))}
      </div>

      {/* Mobile FAB */}
      <button onClick={()=>{setEditTx(null);setShowAdd(true);}} style={{
        position:'fixed', bottom:'calc(68px + env(safe-area-inset-bottom,0px))', right:16,
        width:50, height:50, borderRadius:'50%', background:IOS.blue, border:'none',
        color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 6px 20px ${IOS.blue}55`, zIndex:40,
      }} id="mobile-fab">
        <Icon name="plus" size={22} color="#fff" strokeWidth={2.5} />
      </button>
      <style>{`@media(min-width:768px){#mobile-fab{display:none}}`}</style>

      <TxDrawer user={user} open={showAdd} onClose={()=>{setShowAdd(false);setEditTx(null);}} editData={editTx} />
    </div>
  );
}
