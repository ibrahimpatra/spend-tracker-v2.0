import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, increment, Timestamp, deleteDoc
} from 'firebase/firestore';
import { SvgIcon } from '../utils/icons';
import CategoryForm from './CategoryForm';
import { CURRENCIES, TRANSACTION_TYPES } from '../constants';

// ─── Quick add account modal ──────────────────────────────────────────────────
function QuickAddAccount({ user, onClose, onSuccess }) {
  const [name,     setName]     = useState('');
  const [currency, setCurrency] = useState('USD');
  const [type,     setType]     = useState('Bank');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const ref = await addDoc(collection(db, `users/${user.uid}/accounts`), {
      name: name.trim(), currency, type, currentBalance: 0, initialBalance: 0, createdAt: Timestamp.now(),
    });
    onSuccess({ id: ref.id, name: name.trim(), currency, type });
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-5 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up">
        <h3 className="font-bold text-bank-900 mb-4">New Account</h3>
        <div className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-money-400 focus:bg-white transition"
            placeholder="Account name"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-money-400 transition appearance-none"
            >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-money-400 transition appearance-none"
            >
              {['Bank','Cash','Savings','Credit','Investment'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-bank-500 bg-gray-100 hover:bg-gray-200 transition">
              Cancel
            </button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-money-600 hover:bg-money-700 transition">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calculator Keypad ────────────────────────────────────────────────────────
function Keypad({ onInput, onClear, onSubmit }) {
  const keys = ['7','8','9','÷','4','5','6','×','1','2','3','-','.','0','⌫','+'];
  return (
    <div className="p-4 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-4 gap-2 mb-2">
        {keys.map(k => (
          <button
            key={k}
            type="button"
            onPointerDown={e => { e.preventDefault(); onInput(k); }}
            className={`h-12 rounded-xl text-base font-bold transition active:scale-95 shadow-sm ${
              ['÷','×','-','+'].includes(k) ? 'bg-money-50 text-money-700 border border-money-100' :
              k === '⌫' ? 'bg-red-50 text-[#FF3B30] border border-red-100' :
              'bg-white text-bank-900 border border-gray-100'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onPointerDown={e => { e.preventDefault(); onClear(); }}
          className="h-12 rounded-xl text-sm font-bold bg-white border border-gray-200 text-bank-500 transition active:scale-95"
        >
          Clear
        </button>
        <button
          type="button"
          onPointerDown={e => { e.preventDefault(); onSubmit(); }}
          className="h-12 rounded-xl text-sm font-bold bg-money-600 text-white transition active:scale-95 shadow-sm"
        >
          Done ✓
        </button>
      </div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
const TAB_COLORS = {
  expense:  { active: 'bg-[#FF3B30] text-white', inactive: 'text-[#FF3B30] hover:bg-red-50' },
  income:   { active: 'bg-[#34C759] text-white', inactive: 'text-[#34C759] hover:bg-green-50' },
  transfer: { active: 'bg-[#007AFF] text-white', inactive: 'text-[#007AFF] hover:bg-blue-50' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddTransaction({ user, onClose, editData = null }) {
  const isEdit = !!editData;

  // ── State ──────────────────────────────────────────────────────────────────
  const getInitialTransferType = () => {
    if (editData?.type === TRANSACTION_TYPES.IN_TRANSFER)  return 'in';
    if (editData?.type === TRANSACTION_TYPES.OUT_TRANSFER) return 'out';
    return 'internal';
  };

  const getInitialType = () => {
    if (editData?.type === 'out_transfer' || editData?.type === 'in_transfer') return 'transfer';
    return editData?.type || 'expense';
  };

  const [type,            setType]           = useState(getInitialType());
  const [transferSubType, setTransferSubType]= useState(getInitialTransferType());
  const [amountStr,       setAmountStr]      = useState(editData?.amount?.toString() || '');
  const [receivedAmount,  setReceivedAmount] = useState(editData?.transferAmount || '');
  const [date,            setDate]           = useState(
    editData?.dateObj ? editData.dateObj.toISOString().substring(0,10) : new Date().toISOString().substring(0,10)
  );
  const [time,            setTime]           = useState(
    editData?.dateObj
      ? editData.dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
  const [note,            setNote]           = useState(editData?.note || '');
  const [selectedAccountId, setSelectedAccountId] = useState(editData?.accountId || '');
  const [selectedCategoryId,setSelectedCategoryId]= useState(editData?.categoryId || '');
  const [transferToId,    setTransferToId]   = useState(editData?.transferToAccountId || '');

  const [accounts,     setAccounts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeypad,   setShowKeypad]   = useState(false);
  const [isAddingCat,  setIsAddingCat]  = useState(false);
  const [isAddingAcc,  setIsAddingAcc]  = useState(false);

  const keypadRef = useRef(null);
  const amountRef = useRef(null);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close keypad on outside click
  useEffect(() => {
    const handler = (e) => {
      if (keypadRef.current && !keypadRef.current.contains(e.target) &&
          amountRef.current  && !amountRef.current.contains(e.target)) {
        setShowKeypad(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const [accSnap, catSnap] = await Promise.all([
        getDocs(collection(db, `users/${user.uid}/accounts`)),
        getDocs(collection(db, `users/${user.uid}/categories`)),
      ]);
      setAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, [user]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const targetAccount   = accounts.find(a => a.id === transferToId);
  const isCrossCurrency = type === 'transfer' && transferSubType === 'internal' &&
    selectedAccount && targetAccount && selectedAccount.currency !== targetAccount.currency;

  const currencySymbol = selectedAccount
    ? (CURRENCIES.find(c => c.code === selectedAccount.currency)?.symbol || selectedAccount.currency)
    : '$';

  // ── Keypad ─────────────────────────────────────────────────────────────────
  const handleKeypadInput = (key) => {
    if (key === '⌫') { setAmountStr(p => p.slice(0,-1)); return; }
    if (key === '×')  { setAmountStr(p => p + '*'); return; }
    if (key === '÷')  { setAmountStr(p => p + '/'); return; }
    setAmountStr(p => p + key);
  };

  const evaluateExpression = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(amountStr.replace(/[^-()\d/*+.]/g, ''));
      if (isFinite(result) && result > 0) {
        setAmountStr(parseFloat(result.toFixed(4)).toString());
      }
    } catch {}
    setShowKeypad(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmitting) return;

    let finalVal = 0;
    try {
      // eslint-disable-next-line no-eval
      finalVal = eval(amountStr.replace(/[^-()\d/*+.]/g, ''));
    } catch { alert('Invalid amount.'); return; }

    if (!finalVal || finalVal <= 0) return alert('Please enter a valid amount.');
    if (!selectedAccountId)         return alert('Please select an account.');
    if (type !== 'transfer' && !selectedCategoryId) return alert('Please select a category.');
    if (type === 'transfer' && transferSubType === 'internal' && !transferToId) return alert('Please select a target account.');
    if (type === 'transfer' && transferSubType === 'internal' && selectedAccountId === transferToId) return alert('Cannot transfer to the same account.');
    if (isCrossCurrency && (!receivedAmount || parseFloat(receivedAmount) <= 0)) {
      return alert(`Different currencies detected! Please enter the received amount in ${targetAccount?.currency}.`);
    }

    setIsSubmitting(true);
    const fullDate  = new Date(`${date}T${time}`);
    const txnCol    = collection(db, `users/${user.uid}/transactions`);

    try {
      if (isEdit) {
        await revertEffect(editData);
        await deleteDoc(doc(db, `users/${user.uid}/transactions`, editData.id));
      }

      if (type === 'transfer' && transferSubType === 'internal') {
        const finalReceived = isCrossCurrency ? parseFloat(receivedAmount) : parseFloat(finalVal);

        await addDoc(txnCol, {
          type: TRANSACTION_TYPES.OUT_TRANSFER, amount: parseFloat(finalVal),
          date: Timestamp.fromDate(fullDate), accountId: selectedAccountId,
          currency: selectedAccount.currency,
          note: note ? `${note} → ${targetAccount?.name}` : `Transfer → ${targetAccount?.name}`,
          userId: user.uid,
        });
        await updateDoc(doc(db, `users/${user.uid}/accounts`, selectedAccountId),
          { currentBalance: increment(-parseFloat(finalVal)) });

        await addDoc(txnCol, {
          type: TRANSACTION_TYPES.IN_TRANSFER, amount: finalReceived,
          date: Timestamp.fromDate(fullDate), accountId: transferToId,
          currency: targetAccount.currency,
          note: note ? `${note} ← ${selectedAccount?.name}` : `Transfer ← ${selectedAccount?.name}`,
          userId: user.uid,
        });
        await updateDoc(doc(db, `users/${user.uid}/accounts`, transferToId),
          { currentBalance: increment(finalReceived) });

      } else {
        let dbType = type;
        if (type === 'transfer') {
          dbType = transferSubType === 'out' ? TRANSACTION_TYPES.OUT_TRANSFER : TRANSACTION_TYPES.IN_TRANSFER;
        }

        await addDoc(txnCol, {
          type: dbType, amount: parseFloat(finalVal),
          date: Timestamp.fromDate(fullDate), accountId: selectedAccountId,
          currency: selectedAccount.currency, note,
          categoryId: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE].includes(dbType)
            ? selectedCategoryId : null,
          userId: user.uid,
        });

        const accRef = doc(db, `users/${user.uid}/accounts`, selectedAccountId);
        if (dbType === TRANSACTION_TYPES.INCOME || dbType === TRANSACTION_TYPES.IN_TRANSFER) {
          await updateDoc(accRef, { currentBalance: increment(finalVal) });
        } else {
          await updateDoc(accRef, { currentBalance: increment(-finalVal) });
        }
      }

      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setIsSubmitting(false);
    }
  };

  const revertEffect = async (tData) => {
    const accRef = doc(db, `users/${user.uid}/accounts`, tData.accountId);
    if (tData.type === TRANSACTION_TYPES.INCOME || tData.type === TRANSACTION_TYPES.IN_TRANSFER) {
      await updateDoc(accRef, { currentBalance: increment(-tData.amount) });
    } else {
      await updateDoc(accRef, { currentBalance: increment(tData.amount) });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this transaction?')) return;
    setIsSubmitting(true);
    await revertEffect(editData);
    await deleteDoc(doc(db, `users/${user.uid}/transactions`, editData.id));
    onClose();
  };

  const typeTabs   = ['expense','income','transfer'];
  const tabColors  = TAB_COLORS[type];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end bg-black/50 backdrop-blur-sm w-screen h-screen animate-fade-in">
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full md:w-[480px] h-full bg-white flex flex-col shadow-2xl animate-slide-in-right">

        {/* ── Header ─── */}
        <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="p-2 -ml-2 text-bank-500 hover:text-bank-900 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <h2 className="text-base font-extrabold text-bank-900">
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          {isEdit ? (
            <button onClick={handleDelete} className="text-sm font-bold text-[#FF3B30] hover:underline px-2">
              Delete
            </button>
          ) : <div className="w-10" />}
        </div>

        {/* ── Type Tabs ─── */}
        <div className="flex-none flex gap-2 p-3 bg-gray-50 border-b border-gray-100">
          {typeTabs.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                type === t ? TAB_COLORS[t].active : `bg-white ${TAB_COLORS[t].inactive} border border-gray-100`
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Scrollable Form ─── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-5">

            {/* AMOUNT */}
            <div ref={keypadRef}>
              <label className="block text-xs font-bold text-bank-500 uppercase tracking-wide mb-2">
                {type === 'transfer' && transferSubType === 'in' ? 'Received Amount' : 'Amount'}
              </label>
              <div
                ref={amountRef}
                onClick={() => setShowKeypad(true)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition cursor-pointer ${
                  showKeypad ? 'border-money-400 bg-money-50/30' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl font-bold text-bank-500">{currencySymbol}</span>
                <span className={`flex-1 text-4xl font-extrabold tracking-tight ${amountStr ? 'text-bank-900' : 'text-gray-300'}`}>
                  {amountStr || '0.00'}
                </span>
              </div>
              {/* Keypad slot */}
              {showKeypad && (
                <div className="mt-2 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <Keypad onInput={handleKeypadInput} onClear={() => setAmountStr('')} onSubmit={evaluateExpression} />
                </div>
              )}
            </div>

            {/* TRANSFER SUB-TYPES */}
            {type === 'transfer' && (
              <div className="bg-blue-50 p-1 rounded-xl flex border border-blue-100">
                {[{id:'internal',label:'Internal'},{id:'out',label:'Transfer Out'},{id:'in',label:'Transfer In'}].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setTransferSubType(m.id); setTransferToId(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      transferSubType === m.id ? 'bg-white text-[#007AFF] shadow-sm' : 'text-blue-400 hover:bg-blue-100/50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {/* ACCOUNT SELECTION */}
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-bank-500 uppercase tracking-wide mb-1.5">
                    {type === 'transfer' && transferSubType === 'in' ? 'To Account' : 'Account'}
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={e => { setSelectedAccountId(e.target.value); setTransferToId(''); }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 focus:bg-white transition appearance-none"
                  >
                    <option value="">Select account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingAcc(true)}
                  className="w-10 h-10 rounded-xl bg-gray-100 text-bank-500 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
                  title="Add new account"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>

              {/* Internal transfer — target account */}
              {type === 'transfer' && transferSubType === 'internal' && (
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3 animate-fade-in-down">
                  <div>
                    <label className="block text-xs font-bold text-blue-400 uppercase mb-1.5">To Account</label>
                    <select
                      value={transferToId}
                      onChange={e => setTransferToId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-[#007AFF] transition appearance-none"
                    >
                      <option value="">Select target account...</option>
                      {accounts
                        .filter(a => a.id !== selectedAccountId)
                        .map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)
                      }
                    </select>
                  </div>

                  {/* Cross-currency manual input */}
                  {isCrossCurrency && (
                    <div className="bg-white rounded-xl border border-orange-200 p-3 animate-fade-in-down">
                      <div className="flex items-center gap-2 text-orange-500 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                        <span className="text-xs font-bold">Cross-currency transfer</span>
                      </div>
                      <label className="text-xs font-bold text-bank-500 block mb-1.5">
                        Received Amount in {targetAccount?.currency} <span className="text-[#FF3B30]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bank-500 font-bold text-sm pointer-events-none">
                          {CURRENCIES.find(c => c.code === targetAccount?.currency)?.symbol || targetAccount?.currency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={receivedAmount}
                          onChange={e => setReceivedAmount(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-orange-200 rounded-xl text-sm font-bold text-bank-900 focus:outline-none focus:border-orange-400 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CATEGORY */}
            {type !== 'transfer' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-bank-500 uppercase tracking-wide">
                    Category <span className="text-[#FF3B30]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCat(true)}
                    className="text-xs font-bold text-money-600 hover:underline"
                  >
                    + New
                  </button>
                </div>
                {isAddingCat ? (
                  <CategoryForm
                    user={user}
                    type={type}
                    onSuccess={cat => { setCategories(p => [...p, cat]); setSelectedCategoryId(cat.id); setIsAddingCat(false); }}
                    onCancel={() => setIsAddingCat(false)}
                  />
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {categories.filter(c => c.type === type).map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                          selectedCategoryId === cat.id
                            ? 'border-transparent shadow-md scale-105'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                        style={selectedCategoryId === cat.id ? { backgroundColor: cat.color + '18', borderColor: cat.color } : {}}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-1.5 shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        >
                          <SvgIcon name={cat.icon} className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold truncate w-full text-center text-bank-900">
                          {cat.name}
                        </span>
                        {selectedCategoryId === cat.id && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#34C759]" />
                        )}
                      </button>
                    ))}
                    {categories.filter(c => c.type === type).length === 0 && (
                      <p className="col-span-4 text-xs text-bank-500 text-center py-4">
                        No {type} categories. Click "+ New" to create one.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DATE + TIME */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-bank-500 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-bank-500 uppercase tracking-wide mb-1.5">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 transition"
                />
              </div>
            </div>

            {/* NOTE */}
            <div>
              <label className="block text-[10px] font-bold text-bank-500 uppercase tracking-wide mb-1.5">Note</label>
              <textarea
                placeholder="Add a note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-bank-900 resize-none focus:outline-none focus:border-money-400 focus:bg-white transition"
              />
            </div>

            <div className="h-4" />
          </div>
        </div>

        {/* ── Footer ─── */}
        <div className="flex-none border-t border-gray-100 bg-white p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-bank-500 bg-gray-100 hover:bg-gray-200 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${tabColors.active}`}
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  {isEdit ? 'Update' : 'Save'} Record
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {isAddingAcc && (
        <QuickAddAccount
          user={user}
          onClose={() => setIsAddingAcc(false)}
          onSuccess={acc => { setAccounts(p => [...p, acc]); setSelectedAccountId(acc.id); setIsAddingAcc(false); }}
        />
      )}
    </div>,
    document.body
  );
}
