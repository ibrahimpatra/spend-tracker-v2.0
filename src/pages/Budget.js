import React, {useState, useMemo} from 'react';
import {db} from '../firebase';
import {collection, addDoc, doc, deleteDoc, Timestamp} from 'firebase/firestore';
import {useCategories, useTransactions, useBudgets} from '../hooks/useData';
import {T, CURRENCIES, fmt} from '../constants';
import {Icon, Group, Row, Sheet, Field, Sel, Btn, Progress, Empty} from '../components/Ui';
import {SvgIcon} from '../utils/icons';

// ─── Add Budget Sheet ─────────────────────────────────────────────────────────
function AddBudgetSheet({user, cats, monthYear, open, onClose}) {
  const [catId,  setCatId]  = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const expCats = cats.filter(c=>c.type==='expense');
  const currency = cats.find(c=>c.id===catId)?.currency||'USD'; // fallback

  const submit = async () => {
    if (!catId||!amount||parseFloat(amount)<=0) return;
    setSaving(true);
    try {
      await addDoc(collection(db,`users/${user.uid}/budgets`),{
        categoryId:catId, monthYear, amount:parseFloat(amount),
        createdAt:Timestamp.now(),
      });
      setCatId(''); setAmount('');
      onClose();
    } catch(e){console.error(e);}
    finally{setSaving(false);}
  };

  return (
    <Sheet open={open} onClose={onClose} title="Set Category Budget"
      footer={<div style={{display:'flex',gap:8}}><Btn variant="outline" block onClick={onClose}>Cancel</Btn><Btn block loading={saving} onClick={submit}>Save Budget</Btn></div>}>
      <div style={{display:'flex',flexDirection:'column',gap:14,paddingBottom:10}}>
        <Sel label="Category" value={catId} onChange={e=>setCatId(e.target.value)}>
          <option value="">Select category…</option>
          {expCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Sel>
        <Field label="Monthly Budget Amount" type="number" step="0.01" min="0"
          placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/>
        <p style={{fontSize:11,color:T.t3,marginTop:-8}}>This budget applies to {monthYear.replace('-',' · ')}.</p>
      </div>
    </Sheet>
  );
}

// ─── Budget page ──────────────────────────────────────────────────────────────
export default function Budget({user}) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [showAdd,setShowAdd] = useState(false);

  const monthYear = `${year}-${String(month+1).padStart(2,'0')}`;
  const monthLabel = new Date(year,month,1).toLocaleString('default',{month:'long',year:'numeric'});

  const categories = useCategories(user.uid);
  const budgets    = useBudgets(user.uid, monthYear);
  const txns       = useTransactions(user.uid, {
    range:'custom',
    from:`${year}-${String(month+1).padStart(2,'0')}-01`,
    to:  new Date(year,month+1,0).toISOString().slice(0,10),
  });

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // Spending per category this month
  const catSpend = useMemo(()=>{
    const m={};
    txns.filter(t=>t.type==='expense').forEach(t=>{
      if(!m[t.categoryId])m[t.categoryId]=0;
      m[t.categoryId]+=t.amount;
    }); return m;
  },[txns]);

  const totalSpend  = Object.values(catSpend).reduce((s,v)=>s+v,0);
  const totalBudget = budgets.reduce((s,b)=>s+b.amount,0);
  const totalLeft   = totalBudget - totalSpend;
  const currency    = txns[0]?.currency||'USD';
  const sym         = CURRENCIES.find(c=>c.code===currency)?.symbol||'';
  const spendPct    = totalBudget>0?(totalSpend/totalBudget)*100:0;

  const delBudget = async id => {
    await deleteDoc(doc(db,`users/${user.uid}/budgets`,id));
  };

  const budgeted = budgets.map(b=>{
    const cat   = categories.find(c=>c.id===b.categoryId);
    const spent = catSpend[b.categoryId]||0;
    const left  = b.amount - spent;
    const pct   = b.amount>0?(spent/b.amount)*100:0;
    return {budget:b, cat, spent, left, pct};
  }).sort((a,b)=>b.pct-a.pct);

  // Categories with no budget (show spending only)
  const unbudgeted = Object.entries(catSpend)
    .filter(([catId])=>!budgets.some(b=>b.categoryId===catId))
    .map(([catId,spent])=>({cat:categories.find(c=>c.id===catId),spent,catId}))
    .filter(x=>x.cat)
    .sort((a,b)=>b.spent-a.spent);

  return (
    <div style={{padding:'16px 16px 32px',maxWidth:680,margin:'0 auto'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.t1,letterSpacing:-0.4}}>Budget</h1>
        <Btn icon="plus" onClick={()=>setShowAdd(true)}>Set Budget</Btn>
      </div>

      {/* Month navigator */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:T.surface,borderRadius:12,padding:'11px 16px',boxShadow:T.shadow,marginBottom:16}}>
        <button onClick={prevMonth} style={{background:'none',border:'none',cursor:'pointer',width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:T.blue}}>
          <Icon name="back" size={16} color={T.blue}/>
        </button>
        <span style={{fontSize:16,fontWeight:700,color:T.t1}}>{monthLabel}</span>
        <button onClick={nextMonth} style={{background:'none',border:'none',cursor:'pointer',width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:T.blue}}>
          <Icon name="chevR" size={16} color={T.blue}/>
        </button>
      </div>

      {/* Overall budget card */}
      {totalBudget>0 && (
        <div style={{background:T.surface,borderRadius:16,boxShadow:T.shadow,padding:'18px 18px',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
            <p style={{margin:0,fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Overall Spending</p>
            <span style={{fontSize:12,fontWeight:600,color:totalLeft>=0?T.green:T.red}}>
              {totalLeft>=0?`${sym}${totalLeft.toLocaleString(undefined,{minimumFractionDigits:2})} left`:`${sym}${Math.abs(totalLeft).toLocaleString(undefined,{minimumFractionDigits:2})} over`}
            </span>
          </div>
          <p style={{margin:'4px 0 10px',fontSize:28,fontWeight:800,color:T.t1,letterSpacing:-0.8}}>
            {sym}{totalSpend.toLocaleString(undefined,{minimumFractionDigits:2})}
            <span style={{fontSize:14,fontWeight:400,color:T.t3,marginLeft:6}}>of {sym}{totalBudget.toLocaleString(undefined,{minimumFractionDigits:2})} budgeted</span>
          </p>
          <Progress pct={spendPct} color={spendPct>100?T.red:spendPct>80?T.orange:T.blue} height={8}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
            <span style={{fontSize:11,color:T.t3}}>{sym}{totalSpend.toLocaleString(undefined,{minimumFractionDigits:2})} spent</span>
            <span style={{fontSize:11,color:T.t3}}>{sym}{totalBudget.toLocaleString(undefined,{minimumFractionDigits:2})} budgeted</span>
          </div>
        </div>
      )}

      {/* Category budgets */}
      {budgeted.length>0 && (
        <div style={{marginBottom:8}}>
          <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8,paddingLeft:2}}>Category Budgets</p>
          <div style={{background:T.surface,borderRadius:12,boxShadow:T.shadow,overflow:'hidden'}}>
            {budgeted.map(({budget,cat,spent,left,pct},i,arr)=>{
              if (!cat) return null;
              const over = left<0;
              return (
                <div key={budget.id} style={{padding:'13px 16px',borderBottom:i<arr.length-1?`0.5px solid ${T.sep}`:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <div style={{width:34,height:34,borderRadius:9,background:cat.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <SvgIcon name={cat.icon} className="w-4 h-4 text-white"/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:14,color:T.t1}}>{cat.name}</span>
                        <span style={{fontSize:14,fontWeight:700,color:T.t1}}>{sym}{spent.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:1}}>
                        <span style={{fontSize:11,color:over?T.red:T.t3}}>
                          {over?`${sym}${Math.abs(left).toLocaleString(undefined,{minimumFractionDigits:2})} over budget`:`${sym}${left.toLocaleString(undefined,{minimumFractionDigits:2})} left`}
                        </span>
                        <button onClick={()=>delBudget(budget.id)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',fontSize:11,color:T.t4,fontFamily:'inherit'}}
                          onMouseEnter={e=>e.currentTarget.style.color=T.red}
                          onMouseLeave={e=>e.currentTarget.style.color=T.t4}>Remove</button>
                      </div>
                    </div>
                  </div>
                  <Progress pct={pct} color={pct>100?T.red:pct>80?T.orange:cat.color} height={5}/>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                    <span style={{fontSize:10,color:T.t3}}>{sym}{spent.toLocaleString(undefined,{minimumFractionDigits:2})} spent</span>
                    <span style={{fontSize:10,color:T.t3}}>{sym}{budget.amount.toLocaleString(undefined,{minimumFractionDigits:2})} budget</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unbudgeted spending */}
      {unbudgeted.length>0 && (
        <div style={{marginBottom:8}}>
          <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8,paddingLeft:2}}>Unbudgeted Spending</p>
          <div style={{background:T.surface,borderRadius:12,boxShadow:T.shadow,overflow:'hidden'}}>
            {unbudgeted.map(({cat,spent},i,arr)=>(
              <div key={cat.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:i<arr.length-1?`0.5px solid ${T.sep}`:'none'}}>
                <div style={{width:30,height:30,borderRadius:8,background:cat.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <SvgIcon name={cat.icon} className="w-4 h-4 text-white"/>
                </div>
                <span style={{flex:1,fontSize:14,color:T.t1}}>{cat.name}</span>
                <span style={{fontSize:14,fontWeight:600,color:T.t2}}>{sym}{spent.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {budgets.length===0 && txns.length===0 && (
        <Empty emoji="🎯" title="No budgets set" sub="Set monthly spending limits for your categories."
          action={<Btn onClick={()=>setShowAdd(true)}>Set First Budget</Btn>}/>
      )}

      <AddBudgetSheet user={user} cats={categories} monthYear={monthYear} open={showAdd} onClose={()=>setShowAdd(false)}/>
    </div>
  );
}
