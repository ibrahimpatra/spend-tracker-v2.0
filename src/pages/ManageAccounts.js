import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { CURRENCIES } from '../constants';
import AddAccountModal from '../components/AddAccountModal';
import { Icon, Empty, Badge } from '../components/ui/index';

const TYPE_EMOJI = { Bank:'🏦', Cash:'💵', Savings:'🏺', Credit:'💳', Investment:'📈' };

export default function ManageAccounts({ user }) {
  const [accounts,  setAccounts]  = useState([]);
  const [showAdd,   setShowAdd]   = useState(false);
  const [hiddenBals,setHiddenBals]= useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_hb')||'{}'); } catch { return {}; }
  });
  const saveHidden = h => { setHiddenBals(h); localStorage.setItem('mv_hb', JSON.stringify(h)); };
  const toggleHide = id => saveHidden({ ...hiddenBals, [id]: !hiddenBals[id] });

  useEffect(() => onSnapshot(collection(db,`users/${user.uid}/accounts`), s=>setAccounts(s.docs.map(d=>({id:d.id,...d.data()})))), [user]);

  const handleDelete = async (acc) => {
    if (!window.confirm(`Delete "${acc.name}"?\nThis won't delete transactions.`)) return;
    await deleteDoc(doc(db, `users/${user.uid}/accounts`, acc.id));
  };

  // Net worth by currency
  const totals = accounts.reduce((acc,a) => ({ ...acc, [a.currency]: (acc[a.currency]||0) + a.currentBalance }), {});

  return (
    <div style={{ maxWidth:640, paddingBottom:80 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <h2 style={{ margin:0, fontSize:15, fontWeight:800, color:'var(--c-text-1)' }}>Accounts</h2>
          <p style={{ margin:0, fontSize:11, color:'var(--c-text-4)' }}>{accounts.length} account{accounts.length!==1?'s':''}</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{
          display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
          borderRadius:'var(--r-md)', background:'var(--c-primary)', border:'none',
          color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
        }}>
          <Icon name="plus" size={12} style={{color:'#fff'}} /> Add Account
        </button>
      </div>

      {/* Net worth summary */}
      {Object.keys(totals).length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8, marginBottom:14 }}>
          {Object.entries(totals).map(([curr,total]) => {
            const sym = CURRENCIES.find(c=>c.code===curr)?.symbol || curr;
            const neg = total < 0;
            return (
              <div key={curr} className="card" style={{ padding:'10px 12px' }}>
                <p style={{ margin:'0 0 3px', fontSize:9, fontWeight:700, color:'var(--c-text-4)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{curr} Total</p>
                <p style={{ margin:0, fontSize:15, fontWeight:800, letterSpacing:-0.3, color:neg?'var(--c-danger)':'var(--c-text-1)' }}>
                  {neg?'-':''}{sym}{Math.abs(total).toLocaleString(undefined,{minimumFractionDigits:2})}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div style={{ border:'2px dashed var(--c-border)', borderRadius:'var(--r-xl)', padding:'32px', textAlign:'center' }}>
          <Empty icon="🏦" title="No accounts yet" subtitle="Create your first account to start tracking." action={
            <button onClick={()=>setShowAdd(true)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:'var(--r-md)', background:'var(--c-primary)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <Icon name="plus" size={12} style={{color:'#fff'}} /> Add Account
            </button>
          } />
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {accounts.map(acc => {
            const sym    = CURRENCIES.find(c=>c.code===acc.currency)?.symbol || acc.currency;
            const hidden = hiddenBals[acc.id];
            const neg    = acc.currentBalance < 0;
            return (
              <div key={acc.id} className="card" style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:10, transition:'box-shadow 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow-xs)'}
              >
                {/* Account icon */}
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--c-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
                  {TYPE_EMOJI[acc.type] || '💳'}
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--c-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.name}</p>
                  <p style={{ margin:0, fontSize:9, color:'var(--c-text-4)', marginTop:1 }}>{acc.type} · {acc.currency}</p>
                </div>
                {/* Balance */}
                <div style={{ textAlign:'right', flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:800, letterSpacing:-0.3,
                    color: neg?'var(--c-danger)':'var(--c-text-1)',
                    filter:hidden?'blur(8px)':'none', userSelect:hidden?'none':'auto', transition:'filter 0.2s'
                  }}>
                    {neg?'-':''}{sym}{Math.abs(acc.currentBalance).toLocaleString(undefined,{minimumFractionDigits:2})}
                  </p>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={()=>toggleHide(acc.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:3, color:'var(--c-text-4)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center' }}>
                      <Icon name={hidden?'eyeOff':'eye'} size={12} />
                    </button>
                    <button onClick={()=>handleDelete(acc)} style={{ background:'none', border:'none', cursor:'pointer', padding:3, color:'var(--c-text-4)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center' }}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--c-danger)'}
                      onMouseLeave={e=>e.currentTarget.style.color='var(--c-text-4)'}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add account modal */}
      <AddAccountModal user={user} open={showAdd} onClose={()=>setShowAdd(false)} onSuccess={()=>setShowAdd(false)} />
    </div>
  );
}
