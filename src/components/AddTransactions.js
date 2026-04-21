import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, increment, Timestamp, deleteDoc
} from 'firebase/firestore';
import { SvgIcon } from '../utils/icons';
import CategoryForm from './CategoryForm';
import AddAccountModal from './AddAccountModal';
import { CURRENCIES, TRANSACTION_TYPES } from '../constants';
import { Icon } from './ui/index';

// ─── Keypad (mobile only) ─────────────────────────────────────────────────────
function Keypad({ onInput, onClear, onSubmit }) {
  const keys = ['7','8','9','÷','4','5','6','×','1','2','3','-','.','0','⌫','+'];
  return (
    <div style={{ padding: '10px 12px 12px', background: 'var(--c-surface-2)', borderTop: '1px solid var(--c-border-light)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 5 }}>
        {keys.map(k => (
          <button key={k} type="button"
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onInput(k); }}
            className={`keypad-key ${['÷','×','-','+'].includes(k) ? 'keypad-op' : k === '⌫' ? 'keypad-del' : ''}`}
          >{k}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        <button type="button" onPointerDown={e => { e.preventDefault(); onClear(); }}
          style={{ height: 40, borderRadius: 'var(--r-md)', border: '1px solid var(--c-border)', background: 'var(--c-surface)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--c-text-3)' }}>
          Clear
        </button>
        <button type="button" onPointerDown={e => { e.preventDefault(); onSubmit(); }}
          style={{ height: 40, borderRadius: 'var(--r-md)', border: 'none', background: 'var(--c-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
          Done ✓
        </button>
      </div>
    </div>
  );
}

// ─── Type tab colours ─────────────────────────────────────────────────────────
const TYPE_STYLE = {
  expense:  { active: '#DC2626', light: '#FEF2F2', border: '#FECACA' },
  income:   { active: '#059669', light: '#ECFDF5', border: '#A7F3D0' },
  transfer: { active: '#2563EB', light: '#EFF6FF', border: '#BFDBFE' },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AddTransaction({ user, onClose, editData = null }) {
  const isEdit = !!editData;

  const getInitialType = () => {
    if (!editData) return 'expense';
    if (['out_transfer','in_transfer','transfer'].includes(editData.type)) return 'transfer';
    return editData.type;
  };
  const getInitialSubType = () => {
    if (editData?.type === 'in_transfer')  return 'in';
    if (editData?.type === 'out_transfer') return 'out';
    return 'internal';
  };

  const [type,           setType]          = useState(getInitialType());
  const [subType,        setSubType]       = useState(getInitialSubType());
  const [amountStr,      setAmountStr]     = useState(editData?.amount?.toString() || '');
  const [receivedAmt,    setReceivedAmt]   = useState(editData?.transferAmount || '');
  const [date,           setDate]          = useState(
    editData?.dateObj ? editData.dateObj.toISOString().slice(0,10) : new Date().toISOString().slice(0,10)
  );
  const [time,           setTime]          = useState(
    editData?.dateObj
      ? editData.dateObj.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
      : new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  );
  const [note,           setNote]          = useState(editData?.note || '');
  const [fromAccId,      setFromAccId]     = useState(editData?.accountId || '');
  const [catId,          setCatId]         = useState(editData?.categoryId || '');
  const [toAccId,        setToAccId]       = useState(editData?.transferToAccountId || '');

  const [accounts,   setAccounts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addAccOpen, setAddAccOpen] = useState(false);

  // Detect touch/small screen for keypad visibility
  const isMobile = window.innerWidth < 768;

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const load = async () => {
      const [a, c] = await Promise.all([
        getDocs(collection(db, `users/${user.uid}/accounts`)),
        getDocs(collection(db, `users/${user.uid}/categories`)),
      ]);
      setAccounts(a.docs.map(d => ({ id: d.id, ...d.data() })));
      setCategories(c.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, [user]);

  // Derived
  const fromAcc = accounts.find(a => a.id === fromAccId);
  const toAcc   = accounts.find(a => a.id === toAccId);
  const isCross = type === 'transfer' && subType === 'internal' && fromAcc && toAcc && fromAcc.currency !== toAcc.currency;
  const sym     = CURRENCIES.find(c => c.code === fromAcc?.currency)?.symbol || '$';
  const ts      = TYPE_STYLE[type];

  // Keypad logic
  const handleKey = (k) => {
    if (k === '⌫') { setAmountStr(p => p.slice(0,-1)); return; }
    if (k === '×')  { setAmountStr(p => p + '*'); return; }
    if (k === '÷')  { setAmountStr(p => p + '/'); return; }
    setAmountStr(p => p + k);
  };
  const evalAmount = () => {
    try {
      // eslint-disable-next-line no-eval
      const r = eval(amountStr.replace(/[^-()\d/*+.]/g,''));
      if (isFinite(r) && r > 0) setAmountStr(parseFloat(r.toFixed(4)).toString());
    } catch {}
    setShowKeypad(false);
  };

  // Submit
  const handleSubmit = async () => {
    if (submitting) return;
    let finalVal = 0;
    try {
      // eslint-disable-next-line no-eval
      finalVal = parseFloat(eval(amountStr.replace(/[^-()\d/*+.]/g,'')));
    } catch { alert('Invalid amount'); return; }

    if (!finalVal || finalVal <= 0)   return alert('Enter a valid amount.');
    if (!fromAccId)                    return alert('Select an account.');
    if (type !== 'transfer' && !catId) return alert('Select a category.');
    if (type === 'transfer' && subType === 'internal') {
      if (!toAccId)                return alert('Select target account.');
      if (toAccId === fromAccId)   return alert('Cannot transfer to same account.');
      if (isCross && (!receivedAmt || parseFloat(receivedAmt) <= 0))
        return alert(`Enter the received amount in ${toAcc?.currency}.`);
    }

    setSubmitting(true);
    const fullDate = new Date(`${date}T${time}`);
    const txnCol   = collection(db, `users/${user.uid}/transactions`);

    try {
      if (isEdit) {
        await revertEffect(editData);
        await deleteDoc(doc(db, `users/${user.uid}/transactions`, editData.id));
      }

      if (type === 'transfer' && subType === 'internal') {
        const received = isCross ? parseFloat(receivedAmt) : finalVal;

        // ─── OUT leg (deducts from source) ───
        await addDoc(txnCol, {
          type: TRANSACTION_TYPES.OUT_TRANSFER, amount: finalVal,
          date: Timestamp.fromDate(fullDate), accountId: fromAccId,
          currency: fromAcc.currency,
          note: note ? `${note} → ${toAcc?.name}` : `Transfer → ${toAcc?.name}`,
          userId: user.uid,
        });
        // Deduct from source account
        await updateDoc(doc(db, `users/${user.uid}/accounts`, fromAccId),
          { currentBalance: increment(-finalVal) });

        // ─── IN leg (adds to destination) ───
        await addDoc(txnCol, {
          type: TRANSACTION_TYPES.IN_TRANSFER, amount: received,
          date: Timestamp.fromDate(fullDate), accountId: toAccId,
          currency: toAcc.currency,
          note: note ? `${note} ← ${fromAcc?.name}` : `Transfer ← ${fromAcc?.name}`,
          userId: user.uid,
        });
        // Add to destination account
        await updateDoc(doc(db, `users/${user.uid}/accounts`, toAccId),
          { currentBalance: increment(received) });

      } else {
        let dbType = type;
        if (type === 'transfer') dbType = subType === 'out' ? TRANSACTION_TYPES.OUT_TRANSFER : TRANSACTION_TYPES.IN_TRANSFER;

        await addDoc(txnCol, {
          type: dbType, amount: finalVal,
          date: Timestamp.fromDate(fullDate), accountId: fromAccId,
          currency: fromAcc.currency, note,
          categoryId: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE].includes(dbType) ? catId : null,
          userId: user.uid,
        });
        const accRef = doc(db, `users/${user.uid}/accounts`, fromAccId);
        // Income or incoming transfer → add; expense or outgoing transfer → subtract
        if (dbType === TRANSACTION_TYPES.INCOME || dbType === TRANSACTION_TYPES.IN_TRANSFER) {
          await updateDoc(accRef, { currentBalance: increment(finalVal) });
        } else {
          await updateDoc(accRef, { currentBalance: increment(-finalVal) });
        }
      }
      onClose();
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const revertEffect = async (t) => {
    const ref = doc(db, `users/${user.uid}/accounts`, t.accountId);
    if (t.type === TRANSACTION_TYPES.INCOME || t.type === TRANSACTION_TYPES.IN_TRANSFER) {
      await updateDoc(ref, { currentBalance: increment(-t.amount) });
    } else {
      await updateDoc(ref, { currentBalance: increment(t.amount) });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this transaction?')) return;
    setSubmitting(true);
    await revertEffect(editData);
    await deleteDoc(doc(db, `users/${user.uid}/transactions`, editData.id));
    onClose();
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', justifyContent:'flex-end' }} className="modal-overlay">
      {/* Backdrop */}
      <div style={{ position:'absolute', inset:0 }} onClick={onClose} />

      {/* Drawer */}
      <div className="drawer-right" style={{ maxWidth: 440 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--c-border-light)', flexShrink:0 }}>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-text-3)', padding:4, borderRadius:6, display:'flex' }}>
            <Icon name="close" size={14} />
          </button>
          <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'var(--c-text-1)' }}>
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          {isEdit ? (
            <button onClick={handleDelete} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-danger)', fontSize:11, fontWeight:700 }}>Delete</button>
          ) : <div style={{ width:28 }} />}
        </div>

        {/* Type tabs */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--c-border-light)', display:'flex', gap:5, flexShrink:0 }}>
          {['expense','income','transfer'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex:1, padding:'6px 0', borderRadius:'var(--r-md)', border:'1px solid',
              fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.13s', textTransform:'capitalize',
              background: type === t ? TYPE_STYLE[t].active : 'var(--c-surface)',
              color:      type === t ? '#fff' : 'var(--c-text-3)',
              borderColor: type === t ? TYPE_STYLE[t].active : 'var(--c-border)',
            }}>{t}</button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="scroll" style={{ flex:1, overflowY:'auto' }}>
          <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:13 }}>

            {/* ── AMOUNT ── */}
            <div>
              <p className="input-label">Amount</p>
              {/* Desktop: regular number input */}
              <div className="hidden md:block">
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, fontWeight:700, color:'var(--c-text-3)', pointerEvents:'none' }}>{sym}</span>
                  <input
                    type="number" step="0.01" min="0"
                    placeholder="0.00"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className="input"
                    style={{ paddingLeft:28, fontSize:20, fontWeight:800, letterSpacing:-0.5 }}
                  />
                </div>
              </div>
              {/* Mobile: tap-to-open keypad */}
              <div className="md:hidden">
                <div
                  onClick={() => setShowKeypad(s => !s)}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'10px 14px', borderRadius:'var(--r-lg)',
                    border: `1.5px solid ${showKeypad ? ts.active : 'var(--c-border)'}`,
                    background: showKeypad ? ts.light : 'var(--c-surface-2)',
                    cursor:'pointer', transition:'all 0.15s',
                  }}
                >
                  <span style={{ fontSize:16, fontWeight:700, color:'var(--c-text-3)' }}>{sym}</span>
                  <span style={{ fontSize:26, fontWeight:800, color: amountStr ? 'var(--c-text-1)' : 'var(--c-text-4)', letterSpacing:-0.5, flex:1 }}>
                    {amountStr || '0.00'}
                  </span>
                  <Icon name={showKeypad ? 'chevDown' : 'chevRight'} size={12} style={{ color:'var(--c-text-4)' }} />
                </div>
                {showKeypad && <Keypad onInput={handleKey} onClear={() => setAmountStr('')} onSubmit={evalAmount} />}
              </div>
            </div>

            {/* ── TRANSFER SUB-TYPES ── */}
            {type === 'transfer' && (
              <div className="tab-group" style={{ background:'var(--c-primary-light)', borderColor:'var(--c-primary-muted)' }}>
                {[{id:'internal',l:'Internal'},{id:'out',l:'Sent Out'},{id:'in',l:'Received In'}].map(m => (
                  <button key={m.id} type="button" onClick={() => { setSubType(m.id); setToAccId(''); }}
                    className={`tab-item ${subType === m.id ? 'active' : ''}`} style={{ fontSize:11 }}>
                    {m.l}
                  </button>
                ))}
              </div>
            )}

            {/* ── FROM ACCOUNT ── */}
            <div>
              <p className="input-label">
                {type === 'transfer' && subType === 'in' ? 'To Account' : 'Account'}
              </p>
              <div style={{ display:'flex', gap:6 }}>
                <select
                  value={fromAccId}
                  onChange={e => { setFromAccId(e.target.value); setToAccId(''); }}
                  className="input select"
                  style={{ flex:1 }}
                >
                  <option value="">Select account…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                </select>
                <button type="button" onClick={() => setAddAccOpen(true)} style={{
                  width:34, height:34, borderRadius:'var(--r-md)', border:'1px solid var(--c-border)',
                  background:'var(--c-surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  color:'var(--c-text-3)',
                }}>
                  <Icon name="plus" size={13} />
                </button>
              </div>
            </div>

            {/* ── INTERNAL TRANSFER: TO ACCOUNT ── */}
            {type === 'transfer' && subType === 'internal' && (
              <div style={{ background:'var(--c-primary-light)', border:'1px solid var(--c-primary-muted)', borderRadius:'var(--r-lg)', padding:'10px 12px', display:'flex', flexDirection:'column', gap:10 }} className="anim-fade">
                <div>
                  <p className="input-label" style={{ color:'var(--c-primary)' }}>To Account</p>
                  <select value={toAccId} onChange={e => setToAccId(e.target.value)} className="input select" style={{ borderColor:'var(--c-primary-muted)' }}>
                    <option value="">Select target account…</option>
                    {accounts.filter(a => a.id !== fromAccId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                  </select>
                </div>
                {/* Cross-currency */}
                {isCross && (
                  <div style={{ background:'var(--c-surface)', border:'1px solid #FDE68A', borderRadius:'var(--r-md)', padding:'9px 11px' }} className="anim-fade">
                    <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--c-warning)', marginBottom:7 }}>
                      <Icon name="transfer" size={12} />
                      <span style={{ fontSize:10, fontWeight:700 }}>Cross-currency — enter received amount</span>
                    </div>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:700, color:'var(--c-text-3)', pointerEvents:'none' }}>
                        {CURRENCIES.find(c => c.code === toAcc?.currency)?.symbol || toAcc?.currency}
                      </span>
                      <input
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        value={receivedAmt}
                        onChange={e => setReceivedAmt(e.target.value)}
                        className="input"
                        style={{ paddingLeft:24 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── CATEGORY ── */}
            {type !== 'transfer' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <p className="input-label" style={{ margin:0 }}>Category <span style={{ color:'var(--c-danger)' }}>*</span></p>
                  <button type="button" onClick={() => setAddCatOpen(true)}
                    style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'var(--c-primary)', cursor:'pointer', padding:0 }}>
                    + New
                  </button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, maxHeight:140, overflowY:'auto' }} className="scroll">
                  {categories.filter(c => c.type === type).map(cat => {
                    const active = catId === cat.id;
                    return (
                      <button key={cat.id} type="button" onClick={() => setCatId(cat.id)} style={{
                        padding:'7px 4px', borderRadius:'var(--r-md)',
                        border: `1.5px solid ${active ? cat.color : 'var(--c-border-light)'}`,
                        background: active ? cat.color+'14' : 'var(--c-surface-2)',
                        cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        transition:'all 0.12s', transform: active ? 'scale(1.05)' : 'none',
                      }}>
                        <div style={{ width:28, height:28, borderRadius:7, background:cat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <SvgIcon name={cat.icon} className="w-4 h-4 text-white" />
                        </div>
                        <span style={{ fontSize:9, fontWeight:700, color:'var(--c-text-1)', textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.name}</span>
                        {active && <span style={{ position:'absolute', top:3, right:3, width:6, height:6, borderRadius:'50%', background:'var(--c-success)' }} />}
                      </button>
                    );
                  })}
                  {categories.filter(c => c.type === type).length === 0 && (
                    <p style={{ gridColumn:'1/-1', fontSize:11, color:'var(--c-text-4)', textAlign:'center', padding:'10px 0' }}>
                      No {type} categories yet. Click "+ New" to create one.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── DATE + TIME ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <p className="input-label">Date</p>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
              </div>
              <div>
                <p className="input-label">Time</p>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" />
              </div>
            </div>

            {/* ── NOTE ── */}
            <div>
              <p className="input-label">Note (optional)</p>
              <textarea
                value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Add a description…"
                style={{ width:'100%', resize:'none', fontFamily:'var(--font)', fontSize:'var(--text-sm)' }}
                className="input"
              />
            </div>

            <div style={{ height:6 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--c-border-light)', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'10px 0', borderRadius:'var(--r-lg)', border:'1px solid var(--c-border)',
            background:'var(--c-surface)', fontSize:12, fontWeight:700, color:'var(--c-text-3)', cursor:'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex:2, padding:'10px 0', borderRadius:'var(--r-lg)', border:'none',
            background: submitting ? 'var(--c-border)' : ts.active,
            fontSize:12, fontWeight:700, color:'#fff', cursor: submitting ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'all 0.15s',
          }}>
            {submitting ? 'Saving…' : <>{isEdit ? 'Update' : 'Save'} Record <Icon name="check" size={12} style={{ color:'#fff' }} /></>}
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      {addCatOpen && (
        <CategoryForm
          user={user} type={type} asModal
          onSuccess={cat => { setCategories(p => [...p, cat]); setCatId(cat.id); setAddCatOpen(false); }}
          onCancel={() => setAddCatOpen(false)}
        />
      )}
      <AddAccountModal
        user={user} open={addAccOpen}
        onClose={() => setAddAccOpen(false)}
        onSuccess={acc => { setAccounts(p => [...p, acc]); setFromAccId(acc.id); setAddAccOpen(false); }}
      />
    </div>,
    document.body
  );
}
