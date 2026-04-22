import React, {useState, useMemo} from 'react';
import {db} from '../firebase';
import {doc, deleteDoc} from 'firebase/firestore';
import {useCategories, useTransactions} from '../hooks/useData';
import {CategoryModal} from '../components/Modals';
import DrillDown from '../components/DrillDown';
import {T} from '../constants';
import {Icon, Empty, Btn, Progress} from '../components/Ui';
import {SvgIcon} from '../utils/icons';

export default function Categories({user}) {
  const cats     = useCategories(user.uid);
  const txns     = useTransactions(user.uid, {range:'thisMonth'});
  const [tab,    setTab]    = useState('expense');
  const [showAdd,setShowAdd]= useState(false);
  const [drill,  setDrill]  = useState(null);

  const filtered = cats.filter(c=>c.type===tab);

  // Spending per category this month
  const catSpend = useMemo(()=>{
    const m={};
    txns.filter(t=>t.type==='expense').forEach(t=>{
      if(!m[t.categoryId])m[t.categoryId]=0;
      m[t.categoryId]+=t.amount;
    }); return m;
  },[txns]);

  const maxSpend = Math.max(...filtered.map(c=>catSpend[c.id]||0),1);

  const del = async id => {
    if (window.confirm('Delete? Transactions will show as Uncategorized.'))
      await deleteDoc(doc(db,`users/${user.uid}/categories`,id));
  };

  const openDrill = cat => {
    const catTxns = txns.filter(t=>t.categoryId===cat.id);
    const allExp  = txns.filter(t=>t.type==='expense');
    setDrill({type:'category',label:cat.name,color:cat.color,txns:catTxns,allExp,cats,accs:[],catObj:cat});
  };

  return (
    <div style={{padding:'16px 16px 32px',maxWidth:680,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.t1,letterSpacing:-0.4}}>Categories</h1>
        <Btn icon="plus" onClick={()=>setShowAdd(true)}>Add</Btn>
      </div>

      {/* Expense / Income tabs */}
      <div style={{display:'flex',background:T.surface2,borderRadius:12,padding:3,marginBottom:18,width:'fit-content',gap:3}}>
        {['expense','income'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'6px 20px',borderRadius:10,border:'none',cursor:'pointer',
            fontFamily:'inherit',fontSize:13,fontWeight:600,transition:'all 0.15s',
            background:tab===t?T.surface:'transparent',
            color:tab===t?(t==='expense'?T.red:T.green):T.t3,
            boxShadow:tab===t?T.shadow:'none',
          }}>
            {t==='expense'?'Expense':'Income'}
          </button>
        ))}
      </div>

      {filtered.length===0
        ? <div style={{border:`2px dashed ${T.sep}`,borderRadius:16,padding:'28px'}}><Empty emoji={tab==='expense'?'🧾':'💰'} title={`No ${tab} categories`} sub="Create some to organise your transactions." action={<Btn onClick={()=>setShowAdd(true)}>Add Category</Btn>}/></div>
        : (
          // iOS settings list style for categories
          <div style={{background:T.surface,borderRadius:12,boxShadow:T.shadow,overflow:'hidden'}}>
            {filtered.map((cat,i)=>{
              const spent = catSpend[cat.id]||0;
              return (
                <div key={cat.id} style={{
                  display:'flex',alignItems:'center',gap:12,
                  padding:'12px 16px',
                  borderBottom:i<filtered.length-1?`0.5px solid ${T.sep}`:'none',
                  cursor:'pointer',transition:'background 0.1s',
                }}
                  onClick={()=>openDrill(cat)}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  {/* Icon */}
                  <div style={{width:36,height:36,borderRadius:10,background:cat.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 2px 8px ${cat.color}44`}}>
                    <SvgIcon name={cat.icon} className="w-4 h-4 text-white"/>
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:14,color:T.t1}}>{cat.name}</span>
                      <span style={{fontSize:13,fontWeight:600,color:spent>0?T.t1:T.t3}}>{spent>0?spent.toLocaleString(undefined,{minimumFractionDigits:2}):'—'}</span>
                    </div>
                    {tab==='expense' && (
                      <Progress pct={(spent/maxSpend)*100} color={cat.color} height={3}/>
                    )}
                  </div>
                  {/* Delete + chevron */}
                  <button onClick={e=>{e.stopPropagation();del(cat.id);}} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 8px',color:T.t4,display:'flex',alignItems:'center',borderRadius:6,marginLeft:4}}
                    onMouseEnter={e=>e.currentTarget.style.color=T.red}
                    onMouseLeave={e=>e.currentTarget.style.color=T.t4}>
                    <Icon name="trash" size={13} color="currentColor"/>
                  </button>
                  <Icon name="chevR" size={13} color={T.t4}/>
                </div>
              );
            })}
          </div>
        )
      }

      <CategoryModal user={user} type={tab} open={showAdd} onClose={()=>setShowAdd(false)}/>
      <DrillDown ctx={drill} onClose={()=>setDrill(null)}/>
    </div>
  );
}
