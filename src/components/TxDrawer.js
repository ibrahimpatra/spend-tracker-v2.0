import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, increment, Timestamp, deleteDoc } from 'firebase/firestore';
import { SvgIcon } from '../utils/icons';
import { CURRENCIES, TRANSACTION_TYPES, IOS } from '../constants';
import { Icon, Btn, Field, Sel, Keypad, Modal } from './ui';
import { AddAccountModal } from './modals';
import { CategoryModal } from './modals';

const TYPE_COLOR = { expense: IOS.red, income: IOS.green, transfer: IOS.blue };
const TYPE_BG    = { expense:'#FFF0EE', income:'#ECFDF5', transfer:IOS.blue+'12' };

export default function TxDrawer({ user, open, onClose, editData }) {
  const isEdit = !!editData;
  const [type,      setType]      = useState(editData?.type==='out_transfer'||editData?.type==='in_transfer'?'transfer':editData?.type||'expense');
  const [subType,   setSubType]   = useState(editData?.type==='in_transfer'?'in':editData?.type==='out_transfer'?'out':'internal');
  const [amtStr,    setAmtStr]    = useState(editData?.amount?.toString()||'');
  const [recvAmt,   setRecvAmt]   = useState('');
  const [fromAccId, setFromAccId] = useState(editData?.accountId||'');
  const [catId,     setCatId]     = useState(editData?.categoryId||'');
  const [toAccId,   setToAccId]   = useState('');
  const [date,      setDate]      = useState(editData?.dateObj?editData.dateObj.toISOString().slice(0,10):new Date().toISOString().slice(0,10));
  const [time,      setTime]      = useState(editData?.dateObj?editData.dateObj.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
  const [note,      setNote]      = useState(editData?.note||'');
  const [accounts,  setAccounts]  = useState([]);
  const [cats,      setCats]      = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [addAccOpen,setAddAccOpen]= useState(false);
  const [addCatOpen,setAddCatOpen]= useState(false);

  // Detect mobile for keypad display
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const [a, c] = await Promise.all([
        getDocs(collection(db,`users/${user.uid}/accounts`)),
        getDocs(collection(db,`users/${user.uid}/categories`)),
      ]);
      setAccounts(a.docs.map(d=>({id:d.id,...d.data()})));
      setCats(c.docs.map(d=>({id:d.id,...d.data()})));
    };
    load();
  }, [open, user]);

  useEffect(() => { if (open) document.body.style.overflow='hidden'; return ()=>{document.body.style.overflow=''}; }, [open]);

  const fromAcc = accounts.find(a=>a.id===fromAccId);
  const toAcc   = accounts.find(a=>a.id===toAccId);
  const isCross = type==='transfer'&&subType==='internal'&&fromAcc&&toAcc&&fromAcc.currency!==toAcc.currency;
  const sym     = CURRENCIES.find(c=>c.code===fromAcc?.currency)?.symbol||'$';

  const handleKey = k => {
    if (k==='⌫') { setAmtStr(p=>p.slice(0,-1)); return; }
    setAmtStr(p=>p+k);
  };

  const handleSave = async () => {
    if (saving) return;
    const finalAmt = parseFloat(amtStr);
    if (!finalAmt || finalAmt <= 0) return alert('Enter a valid amount.');
    if (!fromAccId)                  return alert('Select an account.');
    if (type!=='transfer'&&!catId)   return alert('Select a category.');
    if (type==='transfer'&&subType==='internal') {
      if (!toAccId||toAccId===fromAccId) return alert('Select a different target account.');
      if (isCross&&(!recvAmt||parseFloat(recvAmt)<=0)) return alert(`Enter received amount in ${toAcc?.currency}.`);
    }

    setSaving(true);
    const fullDate = new Date(`${date}T${time}`);
    const txnCol   = collection(db,`users/${user.uid}/transactions`);

    try {
      if (isEdit) {
        await revert(editData);
        await deleteDoc(doc(db,`users/${user.uid}/transactions`,editData.id));
      }

      if (type==='transfer'&&subType==='internal') {
        const recv = isCross ? parseFloat(recvAmt) : finalAmt;
        // OUT leg - deducts from source ✅
        await addDoc(txnCol,{ type:'out_transfer', amount:finalAmt, date:Timestamp.fromDate(fullDate), accountId:fromAccId, currency:fromAcc.currency, note:note?`${note} → ${toAcc?.name}`:`Transfer → ${toAcc?.name}`, userId:user.uid });
        await updateDoc(doc(db,`users/${user.uid}/accounts`,fromAccId),{ currentBalance:increment(-finalAmt) });
        // IN leg - adds to destination ✅
        await addDoc(txnCol,{ type:'in_transfer', amount:recv, date:Timestamp.fromDate(fullDate), accountId:toAccId, currency:toAcc.currency, note:note?`${note} ← ${fromAcc?.name}`:`Transfer ← ${fromAcc?.name}`, userId:user.uid });
        await updateDoc(doc(db,`users/${user.uid}/accounts`,toAccId),{ currentBalance:increment(recv) });
      } else {
        let dbType = type;
        if (type==='transfer') dbType = subType==='out'?'out_transfer':'in_transfer';
        await addDoc(txnCol,{ type:dbType, amount:finalAmt, date:Timestamp.fromDate(fullDate), accountId:fromAccId, currency:fromAcc.currency, note, categoryId:[TRANSACTION_TYPES.INCOME,TRANSACTION_TYPES.EXPENSE].includes(dbType)?catId:null, userId:user.uid });
        const ref = doc(db,`users/${user.uid}/accounts`,fromAccId);
        if (dbType==='income'||dbType==='in_transfer') await updateDoc(ref,{currentBalance:increment(finalAmt)});
        else await updateDoc(ref,{currentBalance:increment(-finalAmt)});
      }
      onClose();
    } catch(e){ console.error(e); setSaving(false); }
  };

  const revert = async t => {
    const ref = doc(db,`users/${user.uid}/accounts`,t.accountId);
    if (t.type==='income'||t.type==='in_transfer') await updateDoc(ref,{currentBalance:increment(-t.amount)});
    else await updateDoc(ref,{currentBalance:increment(t.amount)});
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this transaction?')) return;
    setSaving(true);
    await revert(editData);
    await deleteDoc(doc(db,`users/${user.uid}/transactions`,editData.id));
    onClose();
  };

  if (!open) return null;

  const typeColor = TYPE_COLOR[type];
  const filteredCats = cats.filter(c=>c.type===type);

  return createPortal(
    <div className="anim-fade" style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>

      <div className="anim-up" style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'96dvh', display:'flex', flexDirection:'column', boxShadow:'0 -8px 40px rgba(0,0,0,0.18)' }}>
        
        {/* Handle + header */}
        <div style={{ padding:'12px 20px 0', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:IOS.gray7, margin:'0 auto 10px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:8, color:IOS.gray4, display:'flex' }}>
              <Icon name="close" size={16} color={IOS.gray4} />
            </button>
            <h2 style={{ fontSize:16, fontWeight:700, color:IOS.gray1 }}>{isEdit?'Edit':'New'} Transaction</h2>
            {isEdit
              ? <button onClick={handleDelete} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:IOS.red }}>Delete</button>
              : <div style={{width:28}}/>
            }
          </div>
        </div>

        {/* Type tabs */}
        <div style={{ padding:'10px 20px', flexShrink:0 }}>
          <div style={{ display:'flex', gap:6, background:IOS.gray9, borderRadius:12, padding:4 }}>
            {['expense','income','transfer'].map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{
                flex:1, padding:'7px 0', borderRadius:9, border:'none', cursor:'pointer',
                fontFamily:'inherit', fontSize:13, fontWeight:700, transition:'all 0.15s', textTransform:'capitalize',
                background: type===t ? '#fff' : 'transparent',
                color:      type===t ? TYPE_COLOR[t] : IOS.gray4,
                boxShadow:  type===t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Scrollable form */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>

          {/* Amount display */}
          <div onClick={()=>isMobile&&setShowKeypad(s=>!s)} style={{
            display:'flex', alignItems:'center', gap:8, padding:'14px 16px', borderRadius:16,
            background: showKeypad ? TYPE_BG[type] : IOS.gray9,
            border: `2px solid ${showKeypad ? typeColor : 'transparent'}`,
            marginBottom:14, cursor:'pointer', transition:'all 0.15s',
          }}>
            <span style={{ fontSize:24, fontWeight:700, color:IOS.gray4 }}>{sym}</span>
            {/* Desktop: regular input; Mobile: display-only, keypad below */}
            {isMobile
              ? <span style={{ flex:1, fontSize:32, fontWeight:800, letterSpacing:-1, color:amtStr?IOS.gray1:IOS.gray5 }}>{amtStr||'0.00'}</span>
              : <input type="number" step="0.01" min="0" placeholder="0.00" value={amtStr} onChange={e=>setAmtStr(e.target.value)}
                  style={{ flex:1, border:'none', background:'transparent', fontSize:32, fontWeight:800, letterSpacing:-1, color:IOS.gray1, fontFamily:'inherit', outline:'none' }} />
            }
          </div>
          {/* Mobile keypad */}
          {isMobile && showKeypad && <Keypad onInput={handleKey} onClear={()=>setAmtStr('')} onSubmit={()=>setShowKeypad(false)} accentColor={typeColor} />}

          {/* Transfer sub-type */}
          {type==='transfer' && (
            <div style={{ display:'flex', gap:5, background:IOS.blue+'10', borderRadius:12, padding:4, marginBottom:14 }}>
              {[{id:'internal',l:'Between My Accounts'},{id:'out',l:'Sent Externally'},{id:'in',l:'Received Externally'}].map(m=>(
                <button key={m.id} onClick={()=>{setSubType(m.id);setToAccId('');}} style={{
                  flex:1, padding:'6px 4px', borderRadius:9, border:'none', cursor:'pointer',
                  fontFamily:'inherit', fontSize:11, fontWeight:700, transition:'all 0.15s',
                  background: subType===m.id ? '#fff' : 'transparent',
                  color:      subType===m.id ? IOS.blue : IOS.blue+'99',
                  boxShadow:  subType===m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>{m.l}</button>
              ))}
            </div>
          )}

          {/* Account */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
              {type==='transfer'&&subType==='in' ? 'To Account' : 'Account'}
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <select value={fromAccId} onChange={e=>{setFromAccId(e.target.value);setToAccId('');}} style={{
                flex:1, padding:'9px 32px 9px 11px', background:IOS.gray9, border:`1px solid ${IOS.gray8}`, borderRadius:10, fontSize:13, fontFamily:'inherit', color:IOS.gray1, appearance:'none',
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
              }}>
                <option value="">Select account…</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
              <button onClick={()=>setAddAccOpen(true)} style={{ width:38, height:38, borderRadius:10, background:IOS.gray9, border:`1px solid ${IOS.gray8}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="plus" size={14} color={IOS.gray3} />
              </button>
            </div>
          </div>

          {/* To account (internal transfer) */}
          {type==='transfer'&&subType==='internal'&&(
            <div style={{ background:IOS.blue+'08', border:`1px solid ${IOS.blue}22`, borderRadius:14, padding:12, marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:IOS.blue, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>To Account</label>
              <select value={toAccId} onChange={e=>setToAccId(e.target.value)} style={{
                width:'100%', padding:'9px 32px 9px 11px', background:'#fff', border:`1px solid ${IOS.blue}33`, borderRadius:10, fontSize:13, fontFamily:'inherit', color:IOS.gray1, appearance:'none',
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23007AFF' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
              }}>
                <option value="">Select target account…</option>
                {accounts.filter(a=>a.id!==fromAccId).map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
              {isCross&&(
                <div style={{ marginTop:10, background:'#fff', border:'1px solid #FFD60A44', borderRadius:10, padding:10 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#FF9F0A', marginBottom:6 }}>⚡ Cross-currency — enter received amount</p>
                  <input type="number" step="0.01" min="0" placeholder={`Amount in ${toAcc?.currency}`} value={recvAmt} onChange={e=>setRecvAmt(e.target.value)}
                    style={{ width:'100%', padding:'8px 11px', background:IOS.gray9, border:`1px solid ${IOS.gray8}`, borderRadius:9, fontSize:14, fontWeight:700, fontFamily:'inherit', color:IOS.gray1, outline:'none' }} />
                </div>
              )}
            </div>
          )}

          {/* Category */}
          {type!=='transfer'&&(
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Category <span style={{color:IOS.red}}>*</span></label>
                <button onClick={()=>setAddCatOpen(true)} style={{ background:'none', border:'none', fontSize:12, fontWeight:700, color:IOS.blue, cursor:'pointer' }}>+ New</button>
              </div>
              {filteredCats.length===0
                ? <p style={{ fontSize:12, color:IOS.gray5, textAlign:'center', padding:'16px 0' }}>No {type} categories. <button onClick={()=>setAddCatOpen(true)} style={{ background:'none', border:'none', color:IOS.blue, fontWeight:700, cursor:'pointer', fontSize:12 }}>Create one</button></p>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, maxHeight:150, overflowY:'auto' }}>
                    {filteredCats.map(cat=>{
                      const sel = catId===cat.id;
                      return (
                        <button key={cat.id} onClick={()=>setCatId(cat.id)} style={{
                          padding:'8px 4px', borderRadius:12, border:`2px solid ${sel?cat.color:'transparent'}`,
                          background: sel ? cat.color+'14' : IOS.gray9,
                          cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                          transition:'all 0.12s', transform:sel?'scale(1.05)':'none',
                        }}>
                          <div style={{ width:32, height:32, borderRadius:9, background:cat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <SvgIcon name={cat.icon} className="w-4 h-4 text-white" />
                          </div>
                          <span style={{ fontSize:9, fontWeight:700, color:IOS.gray1, textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {/* Date + time */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', padding:'9px 11px', background:IOS.gray9, border:`1px solid ${IOS.gray8}`, borderRadius:10, fontSize:13, fontFamily:'inherit', color:IOS.gray1, outline:'none' }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Time</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{ width:'100%', padding:'9px 11px', background:IOS.gray9, border:`1px solid ${IOS.gray8}`, borderRadius:10, fontSize:13, fontFamily:'inherit', color:IOS.gray1, outline:'none' }} />
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Add a description…"
              style={{ width:'100%', resize:'none', padding:'9px 11px', background:IOS.gray9, border:`1px solid ${IOS.gray8}`, borderRadius:10, fontSize:13, fontFamily:'inherit', color:IOS.gray1, outline:'none' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', paddingBottom:'max(20px,env(safe-area-inset-bottom,20px))', borderTop:`1px solid ${IOS.gray9}`, display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px 0', borderRadius:14, border:`1px solid ${IOS.gray8}`, background:'#fff', fontSize:14, fontWeight:700, color:IOS.gray3, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex:2, padding:'13px 0', borderRadius:14, border:'none',
            background: saving ? IOS.gray7 : typeColor,
            fontSize:14, fontWeight:700, color:'#fff', cursor:saving?'not-allowed':'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            {saving ? 'Saving…' : <>{isEdit?'Update':'Save'} <Icon name="check" size={14} color="#fff" /></>}
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <AddAccountModal user={user} open={addAccOpen} onClose={()=>setAddAccOpen(false)} onSuccess={acc=>{setAccounts(p=>[...p,acc]);setFromAccId(acc.id);}} />
      <CategoryModal user={user} type={type} open={addCatOpen} onClose={()=>setAddCatOpen(false)} onSuccess={cat=>{setCats(p=>[...p,cat]);setCatId(cat.id);}} />
    </div>,
    document.body
  );
}
