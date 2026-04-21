import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { CURRENCIES, ACCOUNT_TYPES, IOS, CHART_COLORS } from '../constants';
import { Modal, Field, Sel, Btn, Icon } from './ui';
import { ICON_SET, SvgIcon } from '../utils/icons';

// ─── AddAccountModal ──────────────────────────────────────────────────────────
export function AddAccountModal({ user, open, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ name:'', currency:'USD', type:'Bank', initialBalance:'' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const sym = CURRENCIES.find(c => c.code === form.currency)?.symbol || '$';

  const submit = async () => {
    if (!form.name.trim())      { setError('Account name is required.'); return; }
    if (form.initialBalance === '') { setError('Initial balance is required (enter 0 if none).'); return; }
    const bal = parseFloat(form.initialBalance);
    if (isNaN(bal))             { setError('Enter a valid number for balance.'); return; }

    setSaving(true); setError('');
    try {
      const ref = await addDoc(collection(db, `users/${user.uid}/accounts`), {
        name: form.name.trim(), currency: form.currency, type: form.type,
        currentBalance: bal, initialBalance: bal, createdAt: Timestamp.now(),
      });
      if (bal !== 0) {
        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          type: 'income', amount: Math.abs(bal), accountId: ref.id,
          categoryId: 'INITIAL_SETUP', currency: form.currency,
          date: Timestamp.now(), note: 'Initial Balance', userId: user.uid,
        });
      }
      onSuccess?.({ id: ref.id, ...form, currentBalance: bal });
      setForm({ name:'', currency:'USD', type:'Bank', initialBalance:'' });
      onClose();
    } catch (e) { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Account"
      footer={
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="surface" block onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" block loading={saving} onClick={submit}>Create Account</Btn>
        </div>
      }
    >
      <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom:8 }}>
        {error && <div style={{ padding:'9px 12px', background:'#FFF0EE', border:'1px solid #FECACA', borderRadius:10, fontSize:12, color:IOS.red }}>{error}</div>}
        <Field label="Account Name *" placeholder="e.g. Chase Checking" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Sel label="Currency" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>)}
          </Sel>
          <Sel label="Account Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            {ACCOUNT_TYPES.map(t=><option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
          </Sel>
        </div>
        <Field label="Initial Balance *" type="number" step="0.01" placeholder="0.00" prefix={sym}
          value={form.initialBalance} onChange={e=>setForm({...form,initialBalance:e.target.value})} />
        <p style={{ fontSize:11, color:IOS.gray5, marginTop:-6 }}>Required — enter 0 if starting fresh.</p>
      </div>
    </Modal>
  );
}

// ─── CategoryModal ────────────────────────────────────────────────────────────
const PRESET_COLORS = [IOS.blue,'#30D158','#FF453A','#FF9F0A','#BF5AF2','#FF375F','#5AC8FA','#34AADC','#5856D6','#4CD964','#FF6B6B','#636366'];

export function CategoryModal({ user, type, open, onClose, onSuccess }) {
  const [name,    setName]    = useState('');
  const [color,   setColor]   = useState(IOS.blue);
  const [icon,    setIcon]    = useState('Shopping');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = { name:name.trim(), icon, color, type, userId:user.uid };
      const ref = await addDoc(collection(db,`users/${user.uid}/categories`), payload);
      onSuccess?.({ id:ref.id, ...payload });
      setName(''); setColor(IOS.blue); setIcon('Shopping');
      onClose();
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={`New ${type==='expense'?'Expense':'Income'} Category`}
      footer={
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="surface" block onClick={onClose}>Cancel</Btn>
          <Btn block loading={loading} onClick={submit} style={{ background:color, border:'none', color:'#fff', flex:2, borderRadius:12, padding:'9px 16px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Create
          </Btn>
        </div>
      }
    >
      <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom:8 }}>
        {/* Preview + name */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${color}55` }}>
            <SvgIcon name={icon} className="w-6 h-6 text-white" />
          </div>
          <Field placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} className="flex-1" style={{ width:'100%' }} autoFocus />
        </div>

        {/* Color palette */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Color</p>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
            {PRESET_COLORS.map(c=>(
              <button key={c} type="button" onClick={()=>setColor(c)} style={{
                width:26, height:26, borderRadius:'50%', background:c, border:'none', cursor:'pointer',
                outline: color===c ? `3px solid ${c}` : 'none', outlineOffset:2,
                transition:'transform 0.1s', flexShrink:0,
              }}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.12)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
              >
                {color===c&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path d="M5 13l4 4L19 7"/></svg>}
              </button>
            ))}
            <div style={{ position:'relative', width:26, height:26, borderRadius:'50%', overflow:'hidden', border:'2px dashed #C7C7CC', flexShrink:0 }}>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                style={{ position:'absolute', top:-6, left:-6, width:38, height:38, cursor:'pointer', opacity:0 }} />
              <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#C7C7CC', pointerEvents:'none' }}>+</span>
            </div>
          </div>
        </div>

        {/* Icon grid */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Icon</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
            {Object.keys(ICON_SET).map(k=>(
              <button key={k} type="button" onClick={()=>setIcon(k)} style={{
                aspectRatio:'1', borderRadius:10, border: icon===k ? `2px solid ${color}` : '1.5px solid transparent',
                background: icon===k ? color+'18' : IOS.gray9,
                color: icon===k ? color : IOS.gray4,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.12s',
              }}>
                <SvgIcon name={k} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
