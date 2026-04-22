import React, {useState} from 'react';
import {db} from '../firebase';
import {collection, addDoc, Timestamp} from 'firebase/firestore';
import {CURRENCIES, ACCOUNT_TYPES, T} from '../constants';
import {Sheet, Field, Sel, Btn} from './Ui';
import {ICON_SET, SvgIcon} from '../utils/icons';

// ─── Add Account ─────────────────────────────────────────────────────────────
export function AccountModal({user, open, onClose}) {
  const [form,  setForm]  = useState({name:'', currency:'USD', type:'Bank', initialBalance:''});
  const [saving,setSaving]= useState(false);
  const [err,   setErr]   = useState('');
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const sym = CURRENCIES.find(c=>c.code===form.currency)?.symbol||'$';

  const submit = async () => {
    if (!form.name.trim())      { setErr('Account name is required.'); return; }
    if (form.initialBalance==='') { setErr('Enter initial balance (0 if none).'); return; }
    const bal = parseFloat(form.initialBalance);
    if (isNaN(bal))              { setErr('Enter a valid number.'); return; }
    setSaving(true); setErr('');
    try {
      const ref = await addDoc(collection(db,`users/${user.uid}/accounts`),{
        name:form.name.trim(), currency:form.currency, type:form.type,
        currentBalance:bal, initialBalance:bal, createdAt:Timestamp.now(),
      });
      if (bal!==0) await addDoc(collection(db,`users/${user.uid}/transactions`),{
        type:'income', amount:Math.abs(bal), accountId:ref.id,
        categoryId:'INITIAL_SETUP', currency:form.currency,
        date:Timestamp.now(), note:'Initial Balance', userId:user.uid,
      });
      setForm({name:'',currency:'USD',type:'Bank',initialBalance:''});
      onClose();
    } catch(e){ setErr('Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Account"
      footer={<div style={{display:'flex',gap:8}}><Btn variant="outline" block onClick={onClose}>Cancel</Btn><Btn block loading={saving} onClick={submit}>Create Account</Btn></div>}>
      <div style={{display:'flex',flexDirection:'column',gap:14,paddingBottom:10}}>
        {err && <div style={{padding:'9px 12px',background:T.redLight,border:`1px solid ${T.red}33`,borderRadius:10,fontSize:12,color:T.red}}>{err}</div>}
        <Field label="Account Name *" placeholder="e.g. Chase Checking" value={form.name} onChange={e=>f('name',e.target.value)} autoFocus/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Sel label="Currency" value={form.currency} onChange={e=>f('currency',e.target.value)}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>)}
          </Sel>
          <Sel label="Type" value={form.type} onChange={e=>f('type',e.target.value)}>
            {ACCOUNT_TYPES.map(t=><option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
          </Sel>
        </div>
        <Field label="Initial Balance *" type="number" step="0.01" placeholder="0.00" prefix={sym}
          value={form.initialBalance} onChange={e=>f('initialBalance',e.target.value)}/>
        <p style={{fontSize:11,color:T.t3,marginTop:-8}}>Required — enter 0 if starting fresh today.</p>
      </div>
    </Sheet>
  );
}

// ─── Add Category ─────────────────────────────────────────────────────────────
const PRESET = ['#056DFF','#30D158','#FF3B30','#FF9500','#BF5AF2','#FF375F','#32ADE6','#FFD60A','#5AC8FA','#FF6961'];

export function CategoryModal({user, type, open, onClose, onCreated}) {
  const [name,   setName]   = useState('');
  const [color,  setColor]  = useState('#056DFF');
  const [icon,   setIcon]   = useState('Shopping');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {name:name.trim(), icon, color, type, userId:user.uid};
      const ref = await addDoc(collection(db,`users/${user.uid}/categories`), payload);
      onCreated?.({id:ref.id,...payload});
      setName(''); setColor('#056DFF'); setIcon('Shopping');
      onClose();
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title={`New ${type==='expense'?'Expense':'Income'} Category`}
      footer={<div style={{display:'flex',gap:8}}><Btn variant="outline" block onClick={onClose}>Cancel</Btn><Btn block loading={saving} onClick={submit} style={{background:color,borderColor:color}}>Create</Btn></div>}>
      <div style={{display:'flex',flexDirection:'column',gap:14,paddingBottom:10}}>
        {/* Preview */}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:48,height:48,borderRadius:14,background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 4px 12px ${color}55`}}>
            <SvgIcon name={icon} className="w-6 h-6 text-white"/>
          </div>
          <Field placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} autoFocus style={{flex:1}}/>
        </div>
        {/* Colors */}
        <div>
          <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Color</p>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
            {PRESET.map(c=>(
              <button key={c} onClick={()=>setColor(c)} style={{
                width:26,height:26,borderRadius:'50%',background:c,border:'none',cursor:'pointer',flexShrink:0,
                outline:color===c?`3px solid ${c}`:'none',outlineOffset:2,transition:'transform 0.1s',
              }}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
              >
                {color===c&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path d="M5 13l4 4L19 7"/></svg>}
              </button>
            ))}
            <div style={{position:'relative',width:26,height:26,borderRadius:'50%',overflow:'hidden',border:'2px dashed #C7C7CC',flexShrink:0}}>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                style={{position:'absolute',top:-6,left:-6,width:38,height:38,cursor:'pointer',opacity:0}}/>
              <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#C7C7CC',pointerEvents:'none'}}>+</span>
            </div>
          </div>
        </div>
        {/* Icons */}
        <div>
          <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Icon</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
            {Object.keys(ICON_SET).map(k=>(
              <button key={k} onClick={()=>setIcon(k)} style={{
                aspectRatio:'1',borderRadius:10,border:`1.5px solid ${icon===k?color:T.sep}`,
                background:icon===k?color+'14':T.surface2,
                color:icon===k?color:T.t3,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.12s',
              }}>
                <SvgIcon name={k} className="w-5 h-5"/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
