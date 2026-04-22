import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {db} from '../firebase';
import {collection, getDocs, Timestamp} from 'firebase/firestore';
import {SvgIcon} from '../utils/icons';
import {T, CURRENCIES, TX, isIncome, isExpense, isTransfer} from '../constants';
import {Icon, Field, Sel, Btn, Keypad, Spin} from './Ui';
import {saveTx, deleteTx} from '../hooks/useData';

const TYPE_COLOR = {expense:T.red, income:T.green, transfer:T.blue};
const isMobile = () => window.innerWidth < 768;

export default function TxSheet({user, open, onClose, editTx}) {
  const isEdit = !!editTx;

  const initType = () => {
    if (!editTx) return 'expense';
    if (isTransfer(editTx.type)) return 'transfer';
    return editTx.type;
  };

  const [type,      setType]      = useState(initType);
  const [subtype,   setSubtype]   = useState('internal');
  const [amtStr,    setAmtStr]    = useState(editTx?.amount?.toString()||'');
  const [fromId,    setFromId]    = useState(editTx?.accountId||'');
  const [toId,      setToId]      = useState('');
  const [catId,     setCatId]     = useState(editTx?.categoryId||'');
  const [date,      setDate]      = useState(editTx?.dateObj?editTx.dateObj.toISOString().slice(0,10):new Date().toISOString().slice(0,10));
  const [time,      setTime]      = useState(editTx?.dateObj?editTx.dateObj.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
  const [note,      setNote]      = useState(editTx?.note||'');
  const [recvAmt,   setRecvAmt]   = useState('');
  const [accounts,  setAccounts]  = useState([]);
  const [cats,      setCats]      = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [showKP,    setShowKP]    = useState(false);

  useEffect(()=>{
    if (!open) return;
    const load = async ()=>{
      const [a,c] = await Promise.all([
        getDocs(collection(db,`users/${user.uid}/accounts`)),
        getDocs(collection(db,`users/${user.uid}/categories`)),
      ]);
      setAccounts(a.docs.map(d=>({id:d.id,...d.data()})));
      setCats(c.docs.map(d=>({id:d.id,...d.data()})));
    };
    load();
  },[open, user]);

  useEffect(()=>{
    document.body.style.overflow = open ? 'hidden' : '';
    return ()=>{document.body.style.overflow=''};
  },[open]);

  const fromAcc  = accounts.find(a=>a.id===fromId);
  const toAcc    = accounts.find(a=>a.id===toId);
  const isCross  = type==='transfer'&&subtype==='internal'&&fromAcc&&toAcc&&fromAcc.currency!==toAcc.currency;
  const symbol   = CURRENCIES.find(c=>c.code===fromAcc?.currency)?.symbol||'$';
  const tc       = TYPE_COLOR[type]||T.blue;
  const filtCats = cats.filter(c=>c.type===type);

  const handleKey = k => {
    if (k==='⌫') setAmtStr(p=>p.slice(0,-1));
    else setAmtStr(p=>p+k);
  };

  const submit = async () => {
    if (saving) return;
    const amt = parseFloat(amtStr);
    if (!amt || amt<=0)              return alert('Enter a valid amount.');
    if (!fromId)                     return alert('Select an account.');
    if (type!=='transfer'&&!catId)   return alert('Select a category.');
    if (type==='transfer'&&subtype==='internal'){
      if (!toId||toId===fromId)      return alert('Select a different target account.');
      if (isCross&&(!recvAmt||parseFloat(recvAmt)<=0)) return alert(`Enter received amount in ${toAcc?.currency}.`);
    }
    setSaving(true);
    const fullDate = new Date(`${date}T${time}`);
    try {
      let txType = type;
      if (type==='transfer'&&subtype==='out') txType=TX.OUT_TRANSFER;
      if (type==='transfer'&&subtype==='in')  txType=TX.IN_TRANSFER;

      await saveTx({
        uid: user.uid,
        editId: isEdit?editTx.id:null,
        editOriginal: isEdit?editTx:null,
        payload:{
          type: type==='transfer'&&subtype==='internal'?'internal_transfer':txType,
          amount: amt,
          fromId, toId,
          fromAcc, toAcc,
          date: Timestamp.fromDate(fullDate),
          note, categoryId: catId,
          receivedAmount: isCross?parseFloat(recvAmt):amt,
        },
      });
      onClose();
    } catch(e){ console.error(e); setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this transaction?')) return;
    setSaving(true);
    await deleteTx(user.uid, editTx);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fade-in" style={{position:'fixed',inset:0,zIndex:901,background:'rgba(0,0,0,0.42)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="slide-up" style={{background:T.surface,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,maxHeight:'97dvh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)'}}>

        {/* Handle */}
        <div style={{padding:'12px 0 0',display:'flex',justifyContent:'center',flexShrink:0}}>
          <div style={{width:36,height:4,borderRadius:2,background:T.sep}}/>
        </div>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 20px 10px',flexShrink:0}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:T.t3,display:'flex',alignItems:'center'}}>
            <Icon name="close" size={16} color={T.t3}/>
          </button>
          <h3 style={{fontSize:16,fontWeight:700,color:T.t1,margin:0}}>{isEdit?'Edit':'New'} Transaction</h3>
          {isEdit
            ? <button onClick={handleDelete} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:T.red,fontFamily:'inherit'}}>Delete</button>
            : <div style={{width:28}}/>
          }
        </div>

        {/* Type tabs */}
        <div style={{padding:'0 20px 10px',flexShrink:0}}>
          <div style={{display:'flex',gap:6,background:T.surface2,borderRadius:12,padding:4}}>
            {['expense','income','transfer'].map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{
                flex:1,padding:'7px 0',borderRadius:9,border:'none',cursor:'pointer',
                fontFamily:'inherit',fontSize:13,fontWeight:600,transition:'all 0.15s',textTransform:'capitalize',
                background:type===t?T.surface:'transparent',
                color:type===t?TYPE_COLOR[t]:T.t3,
                boxShadow:type===t?'0 1px 4px rgba(0,0,0,0.08)':'none',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{flex:1,overflowY:'auto',padding:'0 20px'}}>

          {/* Amount — desktop: regular input; mobile: display + keypad */}
          <div style={{marginBottom:14}}>
            {isMobile() ? (
              <>
                <div onClick={()=>setShowKP(s=>!s)} style={{
                  display:'flex',alignItems:'center',gap:8,padding:'12px 14px',
                  borderRadius:14,border:`1.5px solid ${showKP?tc:T.sep}`,
                  background:showKP?tc+'0d':T.surface2,cursor:'pointer',marginBottom:2,
                }}>
                  <span style={{fontSize:22,fontWeight:700,color:T.t3}}>{symbol}</span>
                  <span style={{flex:1,fontSize:30,fontWeight:800,letterSpacing:-1,color:amtStr?T.t1:T.t4}}>{amtStr||'0.00'}</span>
                  <Icon name={showKP?'chevD':'chevR'} size={13} color={T.t4}/>
                </div>
                {showKP && <Keypad onKey={handleKey} onClear={()=>setAmtStr('')} onDone={()=>setShowKP(false)}/>}
              </>
            ) : (
              <Field label="Amount" type="number" step="0.01" min="0"
                placeholder="0.00" value={amtStr} onChange={e=>setAmtStr(e.target.value)}
                prefix={symbol}
              />
            )}
          </div>

          {/* Transfer sub-type */}
          {type==='transfer' && (
            <div style={{marginBottom:14,display:'flex',gap:4,background:T.blueMid,borderRadius:10,padding:4}}>
              {[{id:'internal',l:'Between Accounts'},{id:'out',l:'Sent Out'},{id:'in',l:'Received In'}].map(m=>(
                <button key={m.id} onClick={()=>{setSubtype(m.id);setToId('');}} style={{
                  flex:1,padding:'6px 4px',borderRadius:7,border:'none',cursor:'pointer',
                  fontFamily:'inherit',fontSize:11,fontWeight:600,
                  background:subtype===m.id?T.surface:'transparent',
                  color:subtype===m.id?T.blue:T.blue+'99',
                  boxShadow:subtype===m.id?'0 1px 4px rgba(0,0,0,0.09)':'none',
                }}>{m.l}</button>
              ))}
            </div>
          )}

          {/* From account */}
          <div style={{marginBottom:14}}>
            <Sel label={type==='transfer'&&subtype==='in'?'To Account':'Account'}
              value={fromId} onChange={e=>{setFromId(e.target.value);setToId('');}}>
              <option value="">Select account…</option>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </Sel>
          </div>

          {/* Internal transfer: to account */}
          {type==='transfer'&&subtype==='internal' && (
            <div style={{marginBottom:14,background:T.blueLight,borderRadius:12,padding:12}}>
              <Sel label="To Account" value={toId} onChange={e=>setToId(e.target.value)}
                >
                <option value="">Select target…</option>
                {accounts.filter(a=>a.id!==fromId).map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </Sel>
              {isCross && (
                <div style={{marginTop:10,background:T.surface,borderRadius:9,padding:10,border:`1px solid ${T.orange}44`}}>
                  <p style={{fontSize:11,fontWeight:600,color:T.orange,marginBottom:6}}>⚡ Cross-currency — enter received amount</p>
                  <Field type="number" step="0.01" min="0" placeholder={`Amount in ${toAcc?.currency}`}
                    value={recvAmt} onChange={e=>setRecvAmt(e.target.value)} prefix={CURRENCIES.find(c=>c.code===toAcc?.currency)?.symbol}/>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          {type!=='transfer' && (
            <div style={{marginBottom:14}}>
              <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Category <span style={{color:T.red}}>*</span></p>
              {filtCats.length===0
                ? <p style={{fontSize:12,color:T.t3,textAlign:'center',padding:'12px 0'}}>No {type} categories. Go to Categories to create one.</p>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,maxHeight:160,overflowY:'auto'}}>
                    {filtCats.map(cat=>{
                      const sel=catId===cat.id;
                      return (
                        <button key={cat.id} onClick={()=>setCatId(cat.id)} style={{
                          padding:'8px 4px',borderRadius:12,border:`1.5px solid ${sel?cat.color:'transparent'}`,
                          background:sel?cat.color+'14':T.surface2,cursor:'pointer',
                          display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                          transition:'all 0.12s',transform:sel?'scale(1.05)':'none',
                        }}>
                          <div style={{width:32,height:32,borderRadius:9,background:cat.color,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <SvgIcon name={cat.icon} className="w-4 h-4 text-white"/>
                          </div>
                          <span style={{fontSize:9,fontWeight:600,color:T.t1,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {/* Date + Time */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            <Field label="Date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            <Field label="Time" type="time" value={time} onChange={e=>setTime(e.target.value)}/>
          </div>

          {/* Note */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:5}}>Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Optional note…"
              style={{width:'100%',resize:'none',padding:'10px 12px',background:T.surface2,border:`1.5px solid ${T.sep}`,borderRadius:10,fontSize:14,fontFamily:'inherit',color:T.t1,outline:'none'}}
              onFocus={e=>e.target.style.borderColor=T.blue}
              onBlur ={e=>e.target.style.borderColor=T.sep}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'10px 20px',paddingBottom:'max(20px,env(safe-area-inset-bottom,20px))',borderTop:`0.5px solid ${T.sep}`,display:'flex',gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,padding:'13px',borderRadius:14,border:`1px solid ${T.sep}`,background:T.surface,fontSize:14,fontWeight:600,color:T.t2,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{
            flex:2,padding:'13px',borderRadius:14,border:'none',
            background:saving?T.sep:tc,
            fontSize:14,fontWeight:700,color:'#fff',cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',
            display:'flex',alignItems:'center',justifyContent:'center',gap:7,
          }}>
            {saving?<Spin size={14} color="#fff"/>:<><>{isEdit?'Update':'Save'}</> <Icon name="check" size={14} color="#fff"/></>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
