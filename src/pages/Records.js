import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import AddTransaction from '../components/AddTransactions';
import GlobalFilter from '../components/GlobalFilter';
import { SvgIcon } from '../utils/icons';
import { Icon, Empty } from '../components/ui/index';

const isTransfer = t => ['transfer','out_transfer','in_transfer'].includes(t);
const isIncome   = t => t === 'income' || t === 'in_transfer';

const DIMENSIONS = {
  month:    { label:'Month',    getValue:(t)      => t.dateObj.toLocaleString('default',{month:'long',year:'numeric'}) },
  date:     { label:'Date',     getValue:(t)      => t.dateObj.toLocaleDateString('default',{weekday:'short',month:'short',day:'numeric'}) },
  account:  { label:'Account',  getValue:(t,accs) => accs.find(a=>a.id===t.accountId)?.name || 'Unknown' },
  currency: { label:'Currency', getValue:(t)      => t.currency },
  type:     { label:'Type',     getValue:(t)      => isIncome(t.type)?'Income':isTransfer(t.type)?'Transfer':'Expense' },
};

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ t, accounts, categories, onEdit }) {
  const isTrf = isTransfer(t.type);
  const isIn  = isIncome(t.type);
  const isOut = t.type==='expense' || t.type==='out_transfer';
  const cat   = categories.find(c=>c.id===t.categoryId);
  const acc   = accounts.find(a=>a.id===t.accountId)?.name || '';

  return (
    <div onClick={()=>onEdit(t)} style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 12px', cursor:'pointer', transition:'background 0.1s',
      borderBottom:'1px solid var(--c-border-light)',
    }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--c-surface-2)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{
        width:30, height:30, borderRadius:8, flexShrink:0,
        background: isTrf?'#EFF6FF':isIn?'#ECFDF5':'#FEF2F2',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {isTrf
          ? <span style={{ fontSize:11 }}>⇄</span>
          : cat
          ? <SvgIcon name={cat.icon} className="w-3.5 h-3.5" style={{ color:cat.color }} />
          : <span style={{ fontSize:10 }}>{isIn?'↓':'↑'}</span>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:12, fontWeight:600, color:'var(--c-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {t.note || cat?.name || (isTrf?'Transfer':'Transaction')}
        </p>
        <p style={{ margin:0, fontSize:9, color:'var(--c-text-4)', display:'flex', alignItems:'center', gap:4 }}>
          {t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'})}
          {acc && <><span style={{color:'var(--c-border)'}}>·</span><span style={{textTransform:'uppercase',letterSpacing:'0.03em'}}>{acc}</span></>}
        </p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <p style={{ margin:0, fontSize:12, fontWeight:700,
          color: isIn?'var(--c-success)': t.type==='out_transfer'?'var(--c-danger)': isTrf?'var(--c-primary)':'var(--c-text-1)'
        }}>
          {isIn?'+': isOut?'-':''}{t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
        </p>
        <p style={{ margin:0, fontSize:9, color:'var(--c-text-4)', textTransform:'uppercase' }}>{t.currency}</p>
      </div>
    </div>
  );
}

// ─── Group node with independent collapse ─────────────────────────────────────
function GroupNode({ node, level, accounts, categories, onEdit }) {
  const [open, setOpen] = useState(true);
  if (node.isLeaf) {
    return node.items.map(t => <TxRow key={t.id} t={t} accounts={accounts} categories={categories} onEdit={onEdit} />);
  }
  return node.children.map(child => (
    <div key={child.key}>
      <div onClick={()=>setOpen(o=>!o)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:`8px ${level===0?'12px':'12px'} 8px ${level===0?'12px':24+level*12+'px'}`,
        background: level===0 ? 'var(--c-surface-2)' : 'var(--c-surface)',
        borderBottom:'1px solid var(--c-border-light)', cursor:'pointer',
        transition:'background 0.1s',
      }}
        onMouseEnter={e=>e.currentTarget.style.background=level===0?'var(--c-border-light)':'var(--c-surface-2)'}
        onMouseLeave={e=>e.currentTarget.style.background=level===0?'var(--c-surface-2)':'var(--c-surface)'}
      >
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Icon name={open?'chevDown':'chevRight'} size={11} style={{ color:'var(--c-text-4)', flexShrink:0 }} />
          <span style={{ fontSize:11, fontWeight:700, color:'var(--c-text-1)' }}>{child.key}</span>
          <span style={{ fontSize:9, fontWeight:600, color:'var(--c-text-4)', background:'var(--c-border-light)', padding:'1px 5px', borderRadius:'var(--r-full)' }}>{child.count}</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {Object.entries(child.stats).map(([curr,v]) => {
            const net = v.income - v.expense;
            return (
              <span key={curr} style={{ fontSize:10, fontWeight:700, color: net>=0?'var(--c-success)':'var(--c-danger)' }}>
                <span style={{ color:'var(--c-text-4)', fontWeight:500, marginRight:2 }}>{curr}</span>
                {net>=0?'+':''}{net.toLocaleString(undefined,{minimumFractionDigits:2})}
              </span>
            );
          })}
        </div>
      </div>
      {open && (
        <div style={level>0?{borderLeft:'2px solid var(--c-primary-muted)', marginLeft:24}:{}}>
          <GroupNode node={child} level={level+1} accounts={accounts} categories={categories} onEdit={onEdit} />
        </div>
      )}
    </div>
  ));
}

// ─── Records page ─────────────────────────────────────────────────────────────
export default function Records({ user }) {
  const [filter,       setFilter]       = useState({ dateRange:'thisMonth', accountIds:[], customStart:'', customEnd:'' });
  const [transactions, setTransactions] = useState([]);
  const [accounts,     setAccounts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [search,       setSearch]       = useState('');
  const [groupBy,      setGroupBy]      = useState([]);
  const [showGroupMenu,setShowGroupMenu]= useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editData,     setEditData]     = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowGroupMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const u1 = onSnapshot(collection(db,`users/${user.uid}/accounts`),  s=>setAccounts(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(collection(db,`users/${user.uid}/categories`),s=>setCategories(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>{ u1(); u2(); };
  }, [user]);

  useEffect(() => {
    let start=new Date(), end=new Date();
    if (filter.dateRange==='thisMonth')  { start=new Date(start.getFullYear(),start.getMonth(),1); }
    else if (filter.dateRange==='lastMonth') { start=new Date(start.getFullYear(),start.getMonth()-1,1); end=new Date(end.getFullYear(),end.getMonth(),0); }
    else if (filter.dateRange==='custom'&&filter.customStart&&filter.customEnd) { start=new Date(filter.customStart); end=new Date(filter.customEnd); end.setHours(23,59,59); }
    else { start=new Date('2000-01-01'); }
    const q=query(collection(db,`users/${user.uid}/transactions`),where('date','>=',Timestamp.fromDate(start)),where('date','<=',Timestamp.fromDate(end)),orderBy('date','desc'));
    return onSnapshot(q,s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data(),dateObj:d.data().date.toDate()}));
      setTransactions(filter.accountIds.length?all.filter(t=>filter.accountIds.includes(t.accountId)):all);
    });
  }, [user, filter]);

  const filtered = useMemo(()=>
    search ? transactions.filter(t=>(t.note||'').toLowerCase().includes(search.toLowerCase())||t.amount.toString().includes(search)) : transactions,
    [transactions,search]
  );

  const calcStats = items => {
    const s={};
    items.forEach(t=>{ const c=t.currency; if(!s[c])s[c]={income:0,expense:0}; if(isIncome(t.type))s[c].income+=t.amount; else if(t.type==='expense')s[c].expense+=t.amount; });
    return s;
  };

  const buildGroups = (items, keys) => {
    if (!keys.length) return { isLeaf:true, items, stats:calcStats(items), count:items.length };
    const [head,...tail] = keys;
    const map={};
    items.forEach(t=>{ const k=DIMENSIONS[head].getValue(t,accounts); if(!map[k])map[k]=[]; map[k].push(t); });
    const children=Object.entries(map).map(([k,its])=>({key:k,...buildGroups(its,tail)})).sort((a,b)=>b.key.localeCompare(a.key,undefined,{numeric:true}));
    return { isLeaf:false, children, stats:calcStats(items), count:items.length };
  };

  const grouped = useMemo(()=>buildGroups(filtered,groupBy),[filtered,groupBy,accounts]);

  const totals = useMemo(()=>{
    const s={};
    filtered.forEach(t=>{ if(!s[t.currency])s[t.currency]={income:0,expense:0}; if(isIncome(t.type))s[t.currency].income+=t.amount; else if(t.type==='expense')s[t.currency].expense+=t.amount; });
    return s;
  },[filtered]);

  const toggleDim = key => setGroupBy(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key]);

  const openEdit = t => { setEditData(t); setShowModal(true); };
  const openAdd  = () => { setEditData(null); setShowModal(true); };

  return (
    <div style={{ paddingBottom:80 }}>
      <GlobalFilter filterState={filter} setFilterState={setFilter} accounts={accounts} />

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
        <h2 style={{ margin:0, fontSize:14, fontWeight:800, color:'var(--c-text-1)', flex:1 }}>Transaction History</h2>

        {/* Search */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <Icon name="search" size={11} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--c-text-4)', pointerEvents:'none' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            style={{ paddingLeft:24, paddingRight:10, height:30, width:160, borderRadius:'var(--r-md)', border:'1px solid var(--c-border)', background:'var(--c-surface)', fontSize:11, fontFamily:'var(--font)', color:'var(--c-text-1)', outline:'none' }}
            onFocus={e=>e.target.style.borderColor='var(--c-primary)'}
            onBlur={e=>e.target.style.borderColor='var(--c-border)'}
          />
        </div>

        {/* Group by */}
        <div style={{ position:'relative', flexShrink:0 }} ref={menuRef}>
          <button onClick={()=>setShowGroupMenu(o=>!o)} style={{
            display:'flex', alignItems:'center', gap:5, height:30, padding:'0 10px',
            borderRadius:'var(--r-md)', border:'1px solid', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'var(--font)',
            background: groupBy.length?'var(--c-primary)':'var(--c-surface)',
            borderColor: groupBy.length?'var(--c-primary)':'var(--c-border)',
            color: groupBy.length?'#fff':'var(--c-text-2)',
          }}>
            <Icon name="sort" size={11} style={{ color:'inherit' }} />
            Group{groupBy.length?` (${groupBy.length})`:''}
          </button>
          {showGroupMenu && (
            <div className="card anim-scale" style={{ position:'absolute', right:0, top:'calc(100% + 4px)', width:180, padding:'8px', zIndex:100, boxShadow:'var(--shadow-lg)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--c-text-4)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Group By</span>
                {groupBy.length>0 && <button onClick={()=>setGroupBy([])} style={{ background:'none', border:'none', fontSize:10, color:'var(--c-danger)', cursor:'pointer', fontWeight:700 }}>Reset</button>}
              </div>
              {Object.entries(DIMENSIONS).map(([key,dim])=>{
                const active=groupBy.includes(key), idx=groupBy.indexOf(key);
                return (
                  <button key={key} onClick={()=>toggleDim(key)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    width:'100%', padding:'5px 8px', borderRadius:'var(--r-md)', border:'1px solid',
                    marginBottom:3, cursor:'pointer', fontSize:11, fontWeight:active?700:500, fontFamily:'var(--font)',
                    background: active?'var(--c-primary-light)':'var(--c-surface)',
                    borderColor: active?'var(--c-primary-muted)':'var(--c-border-light)',
                    color: active?'var(--c-primary)':'var(--c-text-2)',
                    transition:'all 0.12s',
                  }}>
                    {dim.label}
                    {active && <span style={{ width:16, height:16, borderRadius:'50%', background:'var(--c-primary)', color:'#fff', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{idx+1}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Add btn */}
        <button onClick={openAdd} style={{
          flexShrink:0, display:'flex', alignItems:'center', gap:4, height:30, padding:'0 10px',
          borderRadius:'var(--r-md)', border:'none', background:'var(--c-primary)', color:'#fff',
          fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)',
        }} className="hidden sm:flex">
          <Icon name="plus" size={11} style={{color:'#fff'}} /> Add
        </button>
      </div>

      {/* Period totals */}
      {Object.keys(totals).length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:16, padding:'8px 12px', background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'var(--r-lg)', marginBottom:10 }}>
          {Object.entries(totals).map(([curr,v])=>(
            <div key={curr} style={{ display:'flex', alignItems:'center', gap:10, fontSize:11 }}>
              <span style={{ fontWeight:700, color:'var(--c-text-3)', fontSize:10 }}>{curr}</span>
              <span style={{ color:'var(--c-success)', fontWeight:700 }}>+{v.income.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              <span style={{ color:'var(--c-danger)',  fontWeight:700 }}>-{v.expense.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              <span style={{ color: v.income-v.expense>=0?'var(--c-primary)':'var(--c-danger)', fontWeight:700 }}>
                ={' '}{(v.income-v.expense).toLocaleString(undefined,{minimumFractionDigits:2})}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {filtered.length===0 ? (
          <Empty icon="📋" title="No records found" subtitle="Try changing the date range or filters." />
        ) : groupBy.length===0 ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 12px', background:'var(--c-surface-2)', borderBottom:'1px solid var(--c-border-light)' }}>
              <span style={{ fontSize:9, fontWeight:700, color:'var(--c-text-4)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Transaction</span>
              <span style={{ fontSize:9, fontWeight:700, color:'var(--c-text-4)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Amount</span>
            </div>
            {filtered.map(t=><TxRow key={t.id} t={t} accounts={accounts} categories={categories} onEdit={openEdit} />)}
          </>
        ) : (
          <GroupNode node={grouped} level={0} accounts={accounts} categories={categories} onEdit={openEdit} />
        )}
      </div>

      {/* Mobile FAB */}
      <button onClick={openAdd} className="sm:hidden" style={{
        position:'fixed', bottom:'calc(60px + env(safe-area-inset-bottom,0px))', right:14,
        width:46, height:46, borderRadius:'50%', background:'var(--c-primary)', border:'none',
        color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 16px rgba(37,99,235,0.45)', zIndex:40,
      }}>
        <Icon name="plus" size={20} strokeWidth={2.5} style={{color:'#fff'}} />
      </button>

      {showModal && <AddTransaction user={user} onClose={()=>setShowModal(false)} editData={editData} />}
    </div>
  );
}
