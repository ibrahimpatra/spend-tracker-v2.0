import React, {useState, useMemo} from 'react';
import {createPortal} from 'react-dom';
import {AreaChart,Area,BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from 'recharts';
import {T, CURRENCIES, PALETTE, isIncome, isExpense, isTransfer, fmt} from '../constants';
import {Icon, Progress, ChartTip, Empty} from './Ui';
import {SvgIcon} from '../utils/icons';

// ─── Tx Row ──────────────────────────────────────────────────────────────────
function TxRow({t, cats, accs}) {
  const cat  = cats.find(c=>c.id===t.categoryId);
  const acc  = accs.find(a=>a.id===t.accountId)?.name||'';
  const isIn = isIncome(t.type);
  const isTrf= isTransfer(t.type);
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`0.5px solid ${T.sep}`}}>
      <div style={{width:34,height:34,borderRadius:10,flexShrink:0,
        background:isTrf?T.blueLight:isIn?T.greenLight:T.redLight,
        display:'flex',alignItems:'center',justifyContent:'center',}}>
        {isTrf?<span style={{fontSize:14}}>⇄</span>
          :cat?<SvgIcon name={cat.icon} className="w-4 h-4" style={{color:cat.color}}/>
          :<span style={{fontSize:12}}>{isIn?'↓':'↑'}</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:13,fontWeight:500,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.note||cat?.name||'Transaction'}</p>
        <p style={{margin:0,fontSize:11,color:T.t3}}>{t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric',year:'numeric'})}{acc?` · ${acc}`:''}</p>
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:isIn?T.green:t.type==='out_transfer'?T.red:isTrf?T.blue:T.t1}}>
          {isIn?'+':!isTrf?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
        </p>
        <p style={{margin:0,fontSize:9,color:T.t3,textTransform:'uppercase',fontWeight:600}}>{t.currency}</p>
      </div>
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
function Stats3({items}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${items.length},1fr)`,background:T.surface,borderRadius:12,boxShadow:T.shadow,overflow:'hidden',marginBottom:16}}>
      {items.map((s,i)=>(
        <div key={i} style={{padding:'12px 14px',textAlign:'center',borderRight:i<items.length-1?`0.5px solid ${T.sep}`:'none'}}>
          <p style={{margin:'0 0 3px',fontSize:10,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.l}</p>
          <p style={{margin:0,fontSize:13,fontWeight:700,color:s.c||T.t1,letterSpacing:-0.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.v}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
const Sec = ({title, children}) => (
  <div style={{marginBottom:16}}>
    {title && <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8,paddingLeft:2}}>{title}</p>}
    <div style={{background:T.surface,borderRadius:12,boxShadow:T.shadow,overflow:'hidden'}}>{children}</div>
  </div>
);

// ─── Category drilldown ───────────────────────────────────────────────────────
function CatDrill({txns, cat, allExp}) {
  const daily = useMemo(()=>{
    const m={}; txns.forEach(t=>{
      const k=t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'});
      if(!m[k])m[k]={name:k,Amount:0,_d:t.dateObj}; m[k].Amount+=t.amount;
    }); return Object.values(m).sort((a,b)=>a._d-b._d);
  },[txns]);
  const total   = txns.reduce((s,t)=>s+t.amount,0);
  const totalAll= allExp.reduce((s,t)=>s+t.amount,0);
  const pct     = totalAll>0?((total/totalAll)*100).toFixed(1):0;
  const currency= txns[0]?.currency||'';
  return (
    <>
      <Stats3 items={[{l:'Total Spent',v:fmt(total,currency),c:T.t1},{l:'% of Expenses',v:`${pct}%`,c:T.blue},{l:'Transactions',v:txns.length.toString()}]}/>
      {daily.length>1&&(
        <Sec title="Daily Spending">
          <div style={{padding:'14px 14px 14px',height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{top:4,right:4,left:-30,bottom:0}}>
                <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={cat?.color||T.blue} stopOpacity={0.2}/><stop offset="95%" stopColor={cat?.color||T.blue} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface2}/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}} dy={6}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="Amount" stroke={cat?.color||T.blue} strokeWidth={2} fill="url(#dg)" dot={false} activeDot={{r:4,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
    </>
  );
}

// ─── Account drilldown ────────────────────────────────────────────────────────
function AccDrill({txns, account}) {
  const currency = account?.currency||'';
  const totalIn  = txns.filter(t=>isIncome(t.type)).reduce((s,t)=>s+t.amount,0);
  const totalOut = txns.filter(t=>isExpense(t.type)).reduce((s,t)=>s+t.amount,0);

  const runBal = useMemo(()=>{
    let bal = account?.initialBalance||0;
    return [...txns].sort((a,b)=>a.dateObj-b.dateObj).map(t=>{
      if(isIncome(t.type))  bal+=t.amount;
      else if(isExpense(t.type)) bal-=t.amount;
      return {name:t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'}),Balance:parseFloat(bal.toFixed(2)),_d:t.dateObj};
    });
  },[txns, account]);

  const monthly = useMemo(()=>{
    const m={}; txns.forEach(t=>{
      const k=t.dateObj.toLocaleString('default',{month:'short',year:'2-digit'});
      if(!m[k])m[k]={name:k,Income:0,Expense:0,_d:t.dateObj};
      if(isIncome(t.type))  m[k].Income +=t.amount;
      if(isExpense(t.type)) m[k].Expense+=t.amount;
    }); return Object.values(m).sort((a,b)=>a._d-b._d);
  },[txns]);

  return (
    <>
      <Stats3 items={[{l:'Balance',v:fmt(account?.currentBalance||0,currency),c:(account?.currentBalance||0)>=0?T.blue:T.red},{l:'Total In',v:fmt(totalIn,currency),c:T.green},{l:'Total Out',v:fmt(totalOut,currency),c:T.red}]}/>
      {runBal.length>1&&(
        <Sec title="Running Balance">
          <div style={{padding:'14px',height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runBal} margin={{top:4,right:4,left:-30,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface2}/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}} dy={6}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="Balance" stroke={T.blue} strokeWidth={2} dot={false} activeDot={{r:4,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
      {monthly.length>0&&(
        <Sec title="Monthly Flow">
          <div style={{padding:'14px',height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{top:4,right:4,left:-30,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface2}/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}}/>
                <Tooltip content={<ChartTip/>} cursor={{fill:T.surface2}}/>
                <Bar dataKey="Income"  fill={T.green} radius={[4,4,0,0]} maxBarSize={22}/>
                <Bar dataKey="Expense" fill={T.red}   radius={[4,4,0,0]} maxBarSize={22}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
    </>
  );
}

// ─── Month drilldown ──────────────────────────────────────────────────────────
function MonthDrill({txns, cats}) {
  const catBreak = useMemo(()=>{
    const m={}; txns.filter(t=>t.type==='expense').forEach(t=>{
      const cat=cats.find(c=>c.id===t.categoryId);
      const name=cat?.name||'Uncategorized', color=cat?.color||T.t3;
      if(!m[name])m[name]={name,value:0,color}; m[name].value+=t.amount;
    }); return Object.values(m).sort((a,b)=>b.value-a.value);
  },[txns,cats]);

  const daily = useMemo(()=>{
    const m={}; txns.forEach(t=>{
      const k=t.dateObj.getDate().toString();
      if(!m[k])m[k]={name:k,Income:0,Expense:0,_d:t.dateObj};
      if(isIncome(t.type))  m[k].Income +=t.amount;
      if(isExpense(t.type)) m[k].Expense+=t.amount;
    }); return Object.values(m).sort((a,b)=>parseInt(a.name)-parseInt(b.name));
  },[txns]);

  const currency = txns[0]?.currency||'';
  const totalIn  = txns.filter(t=>isIncome(t.type)).reduce((s,t)=>s+t.amount,0);
  const totalOut = txns.filter(t=>isExpense(t.type)).reduce((s,t)=>s+t.amount,0);
  const totalAll = catBreak.reduce((s,d)=>s+d.value,0);

  return (
    <>
      <Stats3 items={[{l:'Income',v:fmt(totalIn,currency),c:T.green},{l:'Expenses',v:fmt(totalOut,currency),c:T.red},{l:'Net',v:fmt(totalIn-totalOut,currency),c:(totalIn-totalOut)>=0?T.blue:T.red}]}/>
      {catBreak.length>0&&(
        <Sec title="Spending Breakdown">
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px'}}>
            <div style={{width:100,height:100,flexShrink:0}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catBreak} dataKey="value" innerRadius={28} outerRadius={44} paddingAngle={3} startAngle={90} endAngle={-270}>
                    {catBreak.map((d,i)=><Cell key={i} fill={d.color||PALETTE[i%PALETTE.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>[v.toLocaleString(undefined,{minimumFractionDigits:2}),'']}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
              {catBreak.slice(0,5).map((d,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:d.color||PALETTE[i%PALETTE.length],flexShrink:0}}/>
                  <span style={{fontSize:12,color:T.t2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</span>
                  <span style={{fontSize:11,fontWeight:600,color:T.t3,flexShrink:0}}>{totalAll>0?((d.value/totalAll)*100).toFixed(0):0}%</span>
                </div>
              ))}
            </div>
          </div>
        </Sec>
      )}
      {daily.length>1&&(
        <Sec title="Daily Cash Flow">
          <div style={{padding:'14px',height:150}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{top:4,right:4,left:-30,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface2}/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:T.t3,fontSize:9}}/>
                <Tooltip content={<ChartTip/>} cursor={{fill:T.surface2}}/>
                <Bar dataKey="Income"  fill={T.green} radius={[3,3,0,0]} maxBarSize={18}/>
                <Bar dataKey="Expense" fill={T.red}   radius={[3,3,0,0]} maxBarSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
    </>
  );
}

// ─── Main DrillDown ───────────────────────────────────────────────────────────
export default function DrillDown({ctx, onClose}) {
  const [search, setSearch] = useState('');
  if (!ctx) return null;

  const {type, label, color=T.blue, txns=[], allExp=[], cats=[], accs=[], accObj, catObj} = ctx;
  const total    = txns.reduce((s,t)=>s+t.amount,0);
  const currency = txns[0]?.currency||'';
  const filtered = search ? txns.filter(t=>(t.note||'').toLowerCase().includes(search.toLowerCase())||t.amount.toString().includes(search)) : txns;

  return createPortal(
    <div className="slide-right" style={{position:'fixed',inset:0,zIndex:950,background:T.bg,display:'flex',flexDirection:'column',overflowY:'hidden'}}>

      {/* iOS nav header */}
      <div style={{background:'rgba(250,250,250,0.92)',backdropFilter:'blur(20px)',borderBottom:`0.5px solid ${T.sep}`,padding:'0 16px',display:'flex',alignItems:'center',height:52,flexShrink:0,position:'sticky',top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,color:T.blue,fontSize:15,fontWeight:500,fontFamily:'inherit',padding:'4px 0',marginRight:'auto'}}>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1 7.5L8 14" stroke={T.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <span style={{position:'absolute',left:'50%',transform:'translateX(-50%)',fontSize:15,fontWeight:700,color:T.t1}}>{label}</span>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>

        {/* Hero */}
        <div style={{background:color,borderRadius:18,padding:'18px 20px',marginBottom:16,position:'relative',overflow:'hidden',boxShadow:`0 6px 24px ${color}44`}}>
          <div style={{position:'absolute',top:-20,right:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
          <p style={{margin:'0 0 4px',fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
            {type==='account'?'Account Balance':type==='category'?'Category Total':type==='month'?'Month Total':'Period Total'}
          </p>
          <p style={{margin:'0 0 5px',fontSize:28,fontWeight:800,color:'#fff',letterSpacing:-0.8}}>
            {fmt(total,currency)}
          </p>
          <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,0.65)',fontWeight:500}}>
            {txns.length} transaction{txns.length!==1?'s':''}
          </p>
        </div>

        {/* Context charts */}
        {type==='category' && <CatDrill txns={txns} cat={catObj} allExp={allExp}/>}
        {type==='account'  && <AccDrill txns={txns} account={accObj}/>}
        {type==='month'    && <MonthDrill txns={txns} cats={cats}/>}

        {/* Transaction list */}
        <Sec title={`Transactions (${filtered.length})`}>
          <div style={{padding:'10px 14px 8px',borderBottom:`0.5px solid ${T.sep}`}}>
            <div style={{position:'relative'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.t3} strokeWidth="2.2"
                style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…"
                style={{width:'100%',paddingLeft:28,paddingRight:12,height:32,borderRadius:9,border:`1px solid ${T.sep}`,background:T.surface2,fontSize:12,fontFamily:'inherit',color:T.t1,outline:'none'}}
                onFocus={e=>e.target.style.borderColor=T.blue}
                onBlur ={e=>e.target.style.borderColor=T.sep}
              />
            </div>
          </div>
          {filtered.length===0
            ? <p style={{textAlign:'center',padding:'20px 0',fontSize:12,color:T.t3}}>No transactions found</p>
            : filtered.map(t=><TxRow key={t.id} t={t} cats={cats} accs={accs}/>)
          }
        </Sec>

        <div style={{height:24}}/>
      </div>
    </div>,
    document.body
  );
}
