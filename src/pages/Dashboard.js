import React, {useState, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from 'recharts';
import {useAccounts, useCategories, useTransactions, useStats, useTrend, useCatSpend} from '../hooks/useData';
import TxSheet  from '../components/TxSheet';
import DrillDown from '../components/DrillDown';
import {T, CURRENCIES, fmt, isIncome, isTransfer, isExpense, PALETTE} from '../constants';
import {Icon, ChartTip, Progress, Empty, Btn, Stat} from '../components/Ui';
import {SvgIcon} from '../utils/icons';

const RANGES = [{id:'thisMonth',l:'Month'},{id:'lastMonth',l:'Last'},{id:'thisYear',l:'Year'},{id:'all',l:'All'}];

// ─── Compact account card ─────────────────────────────────────────────────────
function AccCard({acc, idx, hidden, onHide, onClick}) {
  const sym    = CURRENCIES.find(c=>c.code===acc.currency)?.symbol||acc.currency;
  const neg    = acc.currentBalance<0;
  const isPri  = idx===0;
  return (
    <div onClick={onClick} style={{
      flexShrink:0, width:148, borderRadius:14,
      padding:'11px 13px', cursor:'pointer',
      background: isPri?`linear-gradient(135deg,${T.blue},#003BB5)`:'#fff',
      border: isPri?'none':`1px solid ${T.sep}`,
      boxShadow: isPri?`0 4px 16px ${T.blue}33`:T.shadow,
      position:'relative', overflow:'hidden',
      transition:'transform 0.15s',
    }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}
    >
      {isPri&&<div style={{position:'absolute',top:-16,right:-16,width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <span style={{fontSize:9,fontWeight:600,color:isPri?'rgba(255,255,255,0.65)':T.t3,textTransform:'uppercase',letterSpacing:'0.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'80%'}}>{acc.name}</span>
        <button onClick={e=>{e.stopPropagation();onHide();}} style={{background:'none',border:'none',cursor:'pointer',padding:0,flexShrink:0,color:isPri?'rgba(255,255,255,0.5)':T.t3,display:'flex',alignItems:'center'}}>
          <Icon name={hidden?'eyeOff':'eye'} size={11} color="currentColor"/>
        </button>
      </div>
      <p style={{margin:'0 0 4px',fontSize:16,fontWeight:800,letterSpacing:-0.5,
        color:isPri?(neg?'#ffb3b0':'#fff'):(neg?T.red:T.t1),
        filter:hidden?'blur(7px)':'none',userSelect:hidden?'none':'auto',transition:'filter 0.2s',
      }}>
        {sym}{Math.abs(acc.currentBalance).toLocaleString(undefined,{minimumFractionDigits:2})}
      </p>
      <span style={{fontSize:9,color:isPri?'rgba(255,255,255,0.45)':T.t3,fontWeight:500}}>{acc.type}</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({user}) {
  const nav = useNavigate();
  const [range, setRange]   = useState('thisMonth');
  const [showTx,setShowTx]  = useState(false);
  const [drill, setDrill]   = useState(null);

  // Global hide balance
  const [hidden, setHidden] = useState(()=>{try{return JSON.parse(localStorage.getItem('mv_hide')||'{}')}catch{return{}}});
  const saveHide = h => {setHidden(h);localStorage.setItem('mv_hide',JSON.stringify(h));};
  const toggleHide = id => saveHide({...hidden,[id]:!hidden[id]});

  const accounts   = useAccounts(user.uid);
  const categories = useCategories(user.uid);
  const txns       = useTransactions(user.uid, {range});
  const stats      = useStats(txns);
  const trend      = useTrend(txns);
  const catSpend   = useCatSpend(txns, categories);

  const primCurr   = accounts[0]?.currency||'USD';
  const primSym    = CURRENCIES.find(c=>c.code===primCurr)?.symbol||'';
  const pStats     = stats[primCurr]||{income:0,expense:0};
  const net        = pStats.income - pStats.expense;
  const todayStr   = new Date().toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric'});
  const greeting   = () => {const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening';};

  const openTypeDrill = type => {
    const filtered = type==='income'?txns.filter(t=>isIncome(t.type)):txns.filter(t=>isExpense(t.type));
    setDrill({type:'month',label:type==='income'?'Income Detail':'Expense Detail',color:type==='income'?T.green:T.red,txns:filtered,cats:categories,accs:accounts});
  };

  const openCatDrill = d => {
    const catTxns = txns.filter(t=>{const c=categories.find(x=>x.id===t.categoryId);return(c?.name||'Uncategorized')===d.name;});
    const cat     = categories.find(c=>c.name===d.name);
    setDrill({type:'category',label:d.name,color:cat?.color||T.blue,txns:catTxns,allExp:txns.filter(t=>t.type==='expense'),cats:categories,accs:accounts,catObj:cat});
  };

  const openAccDrill = acc => {
    const accTxns = txns.filter(t=>t.accountId===acc.id);
    setDrill({type:'account',label:acc.name,color:T.blue,txns:accTxns,cats:categories,accs:accounts,accObj:acc});
  };

  // Chart height based on screen
  const chartH = window.innerWidth<768?140:190;

  return (
    <div style={{padding:'16px 16px 32px',maxWidth:1100,margin:'0 auto'}}>

      {/* Greeting + Add button */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.t1,letterSpacing:-0.4}}>{greeting()}{user?.displayName?`, ${user.displayName.split(' ')[0]}`:''}</h1>
          <p style={{margin:'2px 0 0',fontSize:13,color:T.t3}}>{todayStr}</p>
        </div>
        <Btn icon="plus" onClick={()=>setShowTx(true)}>Add</Btn>
      </div>

      {/* Account cards horizontal strip */}
      {accounts.length>0 && (
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:4,scrollbarWidth:'none'}}>
            {accounts.map((acc,i)=>(
              <AccCard key={acc.id} acc={acc} idx={i} hidden={!!hidden[acc.id]}
                onHide={()=>toggleHide(acc.id)} onClick={()=>openAccDrill(acc)}/>
            ))}
            {/* Add account shortcut */}
            <div onClick={()=>nav('/accounts')} style={{flexShrink:0,width:148,borderRadius:14,padding:'11px 13px',cursor:'pointer',border:`1.5px dashed ${T.sep}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,transition:'background 0.1s'}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:28,height:28,borderRadius:'50%',background:T.blueLight,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon name="plus" size={14} color={T.blue}/>
              </div>
              <span style={{fontSize:11,fontWeight:500,color:T.t3}}>Add Account</span>
            </div>
          </div>
        </div>
      )}

      {/* Period selector */}
      <div style={{display:'flex',gap:4,marginBottom:14}}>
        {RANGES.map(r=>(
          <button key={r.id} onClick={()=>setRange(r.id)} style={{
            padding:'5px 13px',borderRadius:20,border:'none',cursor:'pointer',
            fontFamily:'inherit',fontSize:12,fontWeight:600,
            background:range===r.id?T.blue:'transparent',
            color:range===r.id?'#fff':T.t3,
            transition:'all 0.12s',
          }}>{r.l}</button>
        ))}
      </div>

      {/* Summary stats (clickable!) */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <Stat label="Income"   value={`${primSym}${pStats.income.toLocaleString(undefined,{minimumFractionDigits:2})}`}  color={T.green} onClick={()=>openTypeDrill('income')}/>
        <Stat label="Expenses" value={`${primSym}${pStats.expense.toLocaleString(undefined,{minimumFractionDigits:2})}`} color={T.red}   onClick={()=>openTypeDrill('expense')}/>
        <Stat label="Net"      value={`${primSym}${Math.abs(net).toLocaleString(undefined,{minimumFractionDigits:2})}`}  color={net>=0?T.blue:T.red}/>
      </div>

      {/* Cash flow chart */}
      {trend.length>0 && (
        <div style={{background:T.surface,borderRadius:14,boxShadow:T.shadow,padding:'14px 14px',marginBottom:16}}>
          <p style={{margin:'0 0 10px',fontSize:12,fontWeight:600,color:T.t3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Cash Flow</p>
          <div style={{display:'flex',gap:12,marginBottom:8}}>
            {[{l:'Income',c:T.green},{l:'Expense',c:T.red}].map(x=>(
              <span key={x.l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:T.t3}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:x.c,flexShrink:0}}/>{x.l}
              </span>
            ))}
          </div>
          <div style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{top:4,right:4,left:-30,bottom:0}}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.18}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red}   stopOpacity={0.15}/><stop offset="95%" stopColor={T.red}   stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface2}/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9,fontFamily:'Inter'}} dy={6}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9,fontFamily:'Inter'}}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="Income"  stroke={T.green} strokeWidth={2} fill="url(#gi)" dot={false} activeDot={{r:4,strokeWidth:0}}/>
                <Area type="monotone" dataKey="Expense" stroke={T.red}   strokeWidth={2} fill="url(#ge)" dot={false} activeDot={{r:4,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top spending categories */}
      {catSpend.length>0 && (
        <div style={{background:T.surface,borderRadius:14,boxShadow:T.shadow,overflow:'hidden',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`0.5px solid ${T.sep}`}}>
            <p style={{margin:0,fontSize:12,fontWeight:600,color:T.t3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Top Spending</p>
          </div>
          {catSpend.slice(0,5).map((d,i)=>{
            const maxV = catSpend[0].value;
            return (
              <div key={i} onClick={()=>openCatDrill(d)} style={{
                padding:'10px 16px',borderBottom:i<Math.min(4,catSpend.length-1)?`0.5px solid ${T.sep}`:'none',
                cursor:'pointer',transition:'background 0.1s',
              }}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:d.color||PALETTE[i],flexShrink:0}}/>
                    <span style={{fontSize:14,color:T.t1}}>{d.name}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:14,fontWeight:600,color:T.t1}}>{d.value.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                    <Icon name="chevR" size={12} color={T.t4}/>
                  </div>
                </div>
                <Progress pct={(d.value/maxV)*100} color={d.color||PALETTE[i]} height={4}/>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent activity */}
      {txns.length>0 && (
        <div style={{background:T.surface,borderRadius:14,boxShadow:T.shadow,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`0.5px solid ${T.sep}`}}>
            <p style={{margin:0,fontSize:12,fontWeight:600,color:T.t3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Recent Activity</p>
            <button onClick={()=>nav('/records')} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:T.blue,fontFamily:'inherit'}}>See All</button>
          </div>
          {txns.slice(0,6).map((t,i)=>{
            const cat  = categories.find(c=>c.id===t.categoryId);
            const isIn = isIncome(t.type);
            const isTrf= isTransfer(t.type);
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:i<5?`0.5px solid ${T.sep}`:'none',cursor:'pointer',transition:'background 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:34,height:34,borderRadius:10,background:isTrf?T.blueLight:isIn?T.greenLight:T.redLight,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>
                  {isTrf?'⇄':cat?<SvgIcon name={cat.icon} className="w-4 h-4" style={{color:cat.color}}/>:(isIn?'↓':'↑')}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:13,fontWeight:500,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.note||cat?.name||'Transaction'}</p>
                  <p style={{margin:0,fontSize:11,color:T.t3}}>{t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'})}</p>
                </div>
                <p style={{margin:0,fontSize:13,fontWeight:700,color:isIn?T.green:t.type==='out_transfer'?T.red:isTrf?T.blue:T.t1}}>
                  {isIn?'+':!isTrf?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {accounts.length===0 && (
        <Empty emoji="🏦" title="No accounts yet" sub="Create your first account to start tracking." action={<Btn onClick={()=>nav('/accounts')}>Create Account</Btn>}/>
      )}

      <TxSheet user={user} open={showTx} onClose={()=>setShowTx(false)} editTx={null}/>
      <DrillDown ctx={drill} onClose={()=>setDrill(null)}/>
    </div>
  );
}
