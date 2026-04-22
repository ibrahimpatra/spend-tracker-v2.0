import React, {useState, useMemo} from 'react';
import {useAccounts, useCategories, useTransactions} from '../hooks/useData';
import TxSheet from '../components/TxSheet';
import {T, CURRENCIES, isIncome, isTransfer} from '../constants';
import {Icon, Empty, Btn} from '../components/Ui';
import {SvgIcon} from '../utils/icons';

const RANGES = [{id:'thisMonth',l:'This Month'},{id:'lastMonth',l:'Last Month'},{id:'thisYear',l:'This Year'},{id:'all',l:'All Time'}];

function TxRow({t, cats, accs, onClick}) {
  const cat  = cats.find(c=>c.id===t.categoryId);
  const acc  = accs.find(a=>a.id===t.accountId)?.name||'';
  const isIn = isIncome(t.type);
  const isTrf= isTransfer(t.type);
  return (
    <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 16px',borderBottom:`0.5px solid ${T.sep}`,cursor:'pointer',transition:'background 0.1s'}}
      onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
        background:isTrf?T.blueLight:isIn?T.greenLight:T.redLight,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
        {isTrf?'⇄':cat?<SvgIcon name={cat.icon} className="w-4 h-4" style={{color:cat.color}}/>:(isIn?'↓':'↑')}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:14,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.note||cat?.name||'Transaction'}</p>
        <p style={{margin:0,fontSize:12,color:T.t3,marginTop:1}}>{acc||'—'}</p>
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <p style={{margin:0,fontSize:14,fontWeight:700,color:isIn?T.green:t.type==='out_transfer'?T.red:isTrf?T.blue:T.t1}}>
          {isIn?'+':!isTrf?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
        </p>
        <p style={{margin:0,fontSize:10,color:T.t3,textTransform:'uppercase',fontWeight:500}}>{t.currency}</p>
      </div>
    </div>
  );
}

export default function Records({user}) {
  const [range,   setRange]   = useState('thisMonth');
  const [search,  setSearch]  = useState('');
  const [showTx,  setShowTx]  = useState(false);
  const [editTx,  setEditTx]  = useState(null);

  const accounts   = useAccounts(user.uid);
  const categories = useCategories(user.uid);
  const txns       = useTransactions(user.uid, {range});

  const filtered = useMemo(()=>
    search ? txns.filter(t=>(t.note||'').toLowerCase().includes(search.toLowerCase())||t.amount.toString().includes(search)) : txns,
    [txns, search]
  );

  // Group by date
  const grouped = useMemo(()=>{
    const m = {};
    filtered.forEach(t=>{
      const k = t.dateObj.toLocaleDateString('default',{weekday:'short',month:'short',day:'numeric'});
      if (!m[k]) m[k] = {label:k,items:[],_d:t.dateObj};
      m[k].items.push(t);
    });
    return Object.values(m).sort((a,b)=>b._d-a._d);
  },[filtered]);

  // Period totals
  const totals = useMemo(()=>{
    const s = {};
    filtered.forEach(t=>{
      if (!s[t.currency]) s[t.currency]={income:0,expense:0};
      if (t.type==='income')  s[t.currency].income  +=t.amount;
      if (t.type==='expense') s[t.currency].expense +=t.amount;
    }); return s;
  },[filtered]);

  const openEdit = t => {setEditTx(t);setShowTx(true);};
  const openAdd  = ()=>{setEditTx(null);setShowTx(true);};

  return (
    <div style={{padding:'16px 16px 32px',maxWidth:900,margin:'0 auto'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.t1,letterSpacing:-0.4}}>Records</h1>
        <Btn icon="plus" onClick={openAdd}>Add</Btn>
      </div>

      {/* Date range tabs */}
      <div style={{display:'flex',gap:4,marginBottom:12,overflowX:'auto',paddingBottom:2}}>
        {RANGES.map(r=>(
          <button key={r.id} onClick={()=>setRange(r.id)} style={{
            flexShrink:0,padding:'5px 13px',borderRadius:20,border:'none',cursor:'pointer',
            fontFamily:'inherit',fontSize:12,fontWeight:600,
            background:range===r.id?T.blue:'transparent',
            color:range===r.id?'#fff':T.t3,transition:'all 0.12s',
          }}>{r.l}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{position:'relative',marginBottom:12}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.t3} strokeWidth="2"
          style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…"
          style={{width:'100%',paddingLeft:32,paddingRight:14,height:36,borderRadius:10,border:`1px solid ${T.sep}`,background:T.surface,fontSize:13,fontFamily:'inherit',color:T.t1,outline:'none'}}
          onFocus={e=>e.target.style.borderColor=T.blue}
          onBlur ={e=>e.target.style.borderColor=T.sep}
        />
      </div>

      {/* Period totals */}
      {Object.keys(totals).length>0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:14,padding:'9px 14px',background:T.surface,borderRadius:12,boxShadow:T.shadow,marginBottom:14}}>
          {Object.entries(totals).map(([cur,v])=>(
            <div key={cur} style={{display:'flex',alignItems:'center',gap:10,fontSize:13}}>
              <span style={{fontWeight:600,color:T.t3,fontSize:11}}>{cur}</span>
              <span style={{color:T.green,fontWeight:700}}>+{v.income.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              <span style={{color:T.red,  fontWeight:700}}>-{v.expense.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              <span style={{color:(v.income-v.expense)>=0?T.blue:T.red,fontWeight:700}}>={(v.income-v.expense).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grouped transaction list */}
      {filtered.length===0
        ? <Empty emoji="📋" title="No records" sub="No transactions for this period."/>
        : grouped.map(group=>(
          <div key={group.label} style={{marginBottom:10}}>
            <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5,paddingLeft:2}}>{group.label}</p>
            <div style={{background:T.surface,borderRadius:12,boxShadow:T.shadow,overflow:'hidden'}}>
              {group.items.map((t,i)=>(
                <TxRow key={t.id} t={t} cats={categories} accs={accounts} onClick={()=>openEdit(t)}/>
              ))}
            </div>
          </div>
        ))
      }

      <TxSheet user={user} open={showTx} onClose={()=>{setShowTx(false);setEditTx(null);}} editTx={editTx}/>
    </div>
  );
}
