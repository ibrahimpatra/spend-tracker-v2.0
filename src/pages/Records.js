import React, { useState, useMemo, useRef } from 'react';
import { useAccounts, useCategories, useTransactions, isTransfer, isIncome } from '../hooks/useData';
import GlobalFilter from '../components/GlobalFilter';
import TxDrawer from '../components/TxDrawer';
import { IOS, CURRENCIES } from '../constants';
import { Card, Icon, Btn, Empty } from '../components/ui';
import { SvgIcon } from '../utils/icons';

const DIMENSIONS = {
  date:     { label:'Date',     get:(t,_,__)=>t.dateObj.toLocaleDateString('default',{weekday:'short',month:'short',day:'numeric',year:'numeric'}) },
  month:    { label:'Month',    get:(t,_,__)=>t.dateObj.toLocaleString('default',{month:'long',year:'numeric'}) },
  account:  { label:'Account',  get:(t,accs,__)=>accs.find(a=>a.id===t.accountId)?.name||'Unknown' },
  category: { label:'Category', get:(t,_,cats)=>cats.find(c=>c.id===t.categoryId)?.name||'Uncategorized' },
  type:     { label:'Type',     get:(t,_,__)=>isIncome(t.type)?'Income':isTransfer(t.type)?'Transfer':'Expense' },
  currency: { label:'Currency', get:(t,_,__)=>t.currency },
};

// ─── Single transaction row ───────────────────────────────────────────────────
function TxRow({ t, accounts, categories, onClick }) {
  const isTrf = isTransfer(t.type);
  const isIn  = isIncome(t.type);
  const isOut = t.type==='expense'||t.type==='out_transfer';
  const cat   = categories.find(c=>c.id===t.categoryId);
  const acc   = accounts.find(a=>a.id===t.accountId)?.name||'';

  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
      cursor:'pointer', transition:'background 0.1s', borderBottom:`1px solid ${IOS.gray9}`,
    }}
      onMouseEnter={e=>e.currentTarget.style.background=IOS.gray9}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
        background: isTrf?IOS.blue+'14':isIn?IOS.green+'14':IOS.red+'14' }}>
        {isTrf ? <span style={{fontSize:14}}>⇄</span>
          : cat ? <SvgIcon name={cat.icon} className="w-4 h-4" style={{color:cat.color||IOS.gray4}} />
          : <span style={{fontSize:12}}>{isIn?'↓':'↑'}</span>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:13, fontWeight:600, color:IOS.gray1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {t.note||cat?.name||(isTrf?'Transfer':'Transaction')}
        </p>
        <p style={{ margin:0, fontSize:11, color:IOS.gray5, display:'flex', alignItems:'center', gap:4 }}>
          <span>{t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'})}</span>
          {acc&&<><span style={{color:IOS.gray8}}>·</span><span style={{textTransform:'uppercase',fontSize:10,letterSpacing:'0.03em'}}>{acc}</span></>}
        </p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <p style={{ margin:0, fontSize:13, fontWeight:700,
          color:isIn?IOS.green:t.type==='out_transfer'?IOS.red:isTrf?IOS.blue:IOS.gray1 }}>
          {isIn?'+':(isOut&&!isTrf)?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
        </p>
        <p style={{ margin:0, fontSize:9, color:IOS.gray5, textTransform:'uppercase', fontWeight:600 }}>{t.currency}</p>
      </div>
    </div>
  );
}

// ─── Group header ─────────────────────────────────────────────────────────────
function GroupHeader({ label, count, stats, open, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 16px', background:IOS.gray9, cursor:'pointer', borderBottom:`1px solid ${IOS.gray8}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <Icon name={open?'chevDown':'chevRight'} size={11} color={IOS.gray5} />
        <span style={{ fontSize:12, fontWeight:700, color:IOS.gray2 }}>{label}</span>
        <span style={{ fontSize:10, color:IOS.gray5, background:'#fff', padding:'1px 6px', borderRadius:10, border:`1px solid ${IOS.gray8}` }}>{count}</span>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        {Object.entries(stats).map(([curr,v])=>{
          const net=v.income-v.expense;
          return (
            <span key={curr} style={{ fontSize:11, fontWeight:700, color:net>=0?IOS.green:IOS.red }}>
              <span style={{ color:IOS.gray5, fontWeight:500, marginRight:2, fontSize:10 }}>{curr}</span>
              {net>=0?'+':''}{net.toLocaleString(undefined,{minimumFractionDigits:2})}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recursive group node ─────────────────────────────────────────────────────
function GroupNode({ node, level, accounts, categories, onEdit }) {
  const [open, setOpen] = useState(true);
  if (node.isLeaf) {
    return node.items.map(t=><TxRow key={t.id} t={t} accounts={accounts} categories={categories} onClick={()=>onEdit(t)} />);
  }
  return node.children.map(child=>(
    <div key={child.key}>
      <GroupHeader label={child.key} count={child.count} stats={child.stats} open={open} onToggle={()=>setOpen(o=>!o)} />
      {open&&(
        <div style={level>0?{borderLeft:`2px solid ${IOS.blue+'22'}`,marginLeft:16}:{}}>
          <GroupNode node={child} level={level+1} accounts={accounts} categories={categories} onEdit={onEdit} />
        </div>
      )}
    </div>
  ));
}

// ─── Records ──────────────────────────────────────────────────────────────────
export default function Records({ user }) {
  const [filter,   setFilter]   = useState({ dateRange:'thisMonth', accountIds:[], customStart:'', customEnd:'' });
  const [search,   setSearch]   = useState('');
  const [groupBy,  setGroupBy]  = useState(['date']);
  const [showGM,   setShowGM]   = useState(false);
  const [showTx,   setShowTx]   = useState(false);
  const [editTx,   setEditTx]   = useState(null);
  const gmRef = useRef(null);

  const accounts   = useAccounts(user.uid);
  const categories = useCategories(user.uid);
  const txns       = useTransactions(user.uid, filter);

  const filtered = useMemo(()=>
    search ? txns.filter(t=>(t.note||'').toLowerCase().includes(search.toLowerCase())||t.amount.toString().includes(search)) : txns,
    [txns,search]
  );

  const calcStats = items=>{
    const s={};
    items.forEach(t=>{ const c=t.currency; if(!s[c])s[c]={income:0,expense:0}; if(isIncome(t.type))s[c].income+=t.amount; else if(t.type==='expense')s[c].expense+=t.amount; });
    return s;
  };
  const buildGroups=(items,keys)=>{
    if(!keys.length)return{isLeaf:true,items,stats:calcStats(items),count:items.length};
    const[head,...tail]=keys, map={};
    items.forEach(t=>{const k=DIMENSIONS[head].get(t,accounts,categories);if(!map[k])map[k]=[];map[k].push(t);});
    const children=Object.entries(map).map(([k,its])=>({key:k,...buildGroups(its,tail)})).sort((a,b)=>b.key.localeCompare(a.key,undefined,{numeric:true}));
    return{isLeaf:false,children,stats:calcStats(items),count:items.length};
  };
  const grouped = useMemo(()=>buildGroups(filtered,groupBy),[filtered,groupBy,accounts,categories]);

  const totals = useMemo(()=>{
    const s={};
    filtered.forEach(t=>{if(!s[t.currency])s[t.currency]={income:0,expense:0};if(isIncome(t.type))s[t.currency].income+=t.amount;else if(t.type==='expense')s[t.currency].expense+=t.amount;});
    return s;
  },[filtered]);

  const openEdit = t=>{setEditTx(t);setShowTx(true);};
  const openAdd  = ()=>{setEditTx(null);setShowTx(true);};

  return (
    <div style={{ padding:'14px 16px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:IOS.gray1, letterSpacing:-0.5 }}>Records</h1>
        <Btn icon="plus" onClick={openAdd}>Add</Btn>
      </div>

      <GlobalFilter filterState={filter} setFilterState={setFilter} accounts={accounts} />

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        {/* Search */}
        <div style={{ flex:1, position:'relative' }}>
          <Icon name="search" size={13} color={IOS.gray5} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…"
            style={{ width:'100%', paddingLeft:30, paddingRight:12, height:34, borderRadius:10, border:`1px solid ${IOS.gray8}`, background:'#fff', fontSize:12, fontFamily:'inherit', color:IOS.gray1, outline:'none' }}
            onFocus={e=>e.target.style.borderColor=IOS.blue}
            onBlur={e=>e.target.style.borderColor=IOS.gray8}
          />
        </div>
        {/* Group by */}
        <div style={{ position:'relative' }} ref={gmRef}>
          <button onClick={()=>setShowGM(o=>!o)} style={{
            display:'flex', alignItems:'center', gap:5, height:34, padding:'0 11px',
            borderRadius:10, border:'1px solid', fontFamily:'inherit', fontSize:12, fontWeight:600, cursor:'pointer',
            background:groupBy.length?IOS.blue:      '#fff',
            borderColor:groupBy.length?IOS.blue:     IOS.gray8,
            color:groupBy.length?'#fff':              IOS.gray2,
          }}>
            <Icon name="menu" size={12} color={groupBy.length?'#fff':IOS.gray2} />
            Group{groupBy.length?` (${groupBy.length})`:''}
          </button>
          {showGM&&(
            <div className="anim-scale" style={{ position:'absolute', right:0, top:'calc(100% + 4px)', width:190, background:'#fff', borderRadius:16, boxShadow:'0 8px 30px rgba(0,0,0,0.14)', border:`1px solid ${IOS.gray9}`, zIndex:500, padding:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Group By</span>
                {groupBy.length>0&&<button onClick={()=>setGroupBy([])} style={{ background:'none', border:'none', fontSize:11, color:IOS.red, cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>Clear</button>}
              </div>
              {Object.entries(DIMENSIONS).map(([key,dim])=>{
                const active=groupBy.includes(key), idx=groupBy.indexOf(key);
                return (
                  <button key={key} onClick={()=>setGroupBy(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key])} style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'7px 9px', borderRadius:10, border:'1px solid', marginBottom:4,
                    cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:active?700:500,
                    background:active?IOS.blue+'10':'#fff', borderColor:active?IOS.blue+'44':IOS.gray9,
                    color:active?IOS.blue:IOS.gray2, transition:'all 0.12s',
                  }}>
                    {dim.label}
                    {active&&<span style={{ width:18, height:18, borderRadius:'50%', background:IOS.blue, color:'#fff', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{idx+1}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Totals bar */}
      {Object.keys(totals).length>0&&(
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, padding:'8px 14px', background:'#fff', border:`1px solid ${IOS.gray8}`, borderRadius:12, marginBottom:10 }}>
          {Object.entries(totals).map(([curr,v])=>(
            <div key={curr} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
              <span style={{ fontWeight:700, color:IOS.gray5, fontSize:10 }}>{curr}</span>
              <span style={{ color:IOS.green, fontWeight:700 }}>+{v.income.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              <span style={{ color:IOS.red,   fontWeight:700 }}>-{v.expense.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              <span style={{ color:(v.income-v.expense)>=0?IOS.blue:IOS.red, fontWeight:700 }}>
                ={(v.income-v.expense).toLocaleString(undefined,{minimumFractionDigits:2})}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        {filtered.length===0
          ? <Empty emoji="📋" title="No records" subtitle="Try changing the date range or filters." />
          : groupBy.length===0
          ? <>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 16px', background:IOS.gray9, borderBottom:`1px solid ${IOS.gray8}` }}>
                <span style={{ fontSize:10, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Transaction</span>
                <span style={{ fontSize:10, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Amount</span>
              </div>
              {filtered.map(t=><TxRow key={t.id} t={t} accounts={accounts} categories={categories} onClick={()=>openEdit(t)} />)}
            </>
          : <GroupNode node={grouped} level={0} accounts={accounts} categories={categories} onEdit={openEdit} />
        }
      </Card>

      {/* Mobile FAB */}
      <button onClick={openAdd} style={{
        position:'fixed', bottom:'calc(68px + env(safe-area-inset-bottom,0px))', right:16,
        width:50, height:50, borderRadius:'50%', background:IOS.blue, border:'none',
        color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 6px 20px ${IOS.blue}55`, zIndex:40,
      }} id="rec-fab">
        <Icon name="plus" size={22} color="#fff" strokeWidth={2.5} />
      </button>
      <style>{`@media(min-width:768px){#rec-fab{display:none}}`}</style>

      <TxDrawer user={user} open={showTx} onClose={()=>{setShowTx(false);setEditTx(null);}} editData={editTx} />
    </div>
  );
}
