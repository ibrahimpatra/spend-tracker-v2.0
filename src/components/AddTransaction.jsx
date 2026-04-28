// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — components/AddTransaction.jsx   (FIXED)
//
// FIXES vs previous version:
// 1. safeDate() helper — editData.dateObj can be string/Timestamp/Date, all handled
// 2. Timestamp is a static import — no more `await import()` inside handleSave
// 3. useTransactions called with stable filter ref — no infinite re-subscription
// 4. Two-step flow: amount keypad → details (tap amount bar to go back)
// 5. Calculator: + − × ÷ with live expression, = collapses to result
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';

import {
  COLORS, FONT, RADIUS, SPACE, ANIM,
  TX_TYPES, CURRENCIES, DEFAULT_CURRENCY,
} from '../constants';
import { useAccounts, useCategories, useTransactions, tsToDate } from '../hooks/useData';
import { formatAmount } from '../utils/currency';
import {
  Icon, BottomSheet, SegmentedControl, AlertDialog, Spinner,
} from './ui';

// ─── safeDate — converts anything to a JS Date ────────────────────────────────
const safeDate = (v) => {
  if (!v) return new Date();
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  return tsToDate(v); // handles Timestamp, {seconds}, ISO string, number
};

// ─── Safe expression evaluator ────────────────────────────────────────────────
const safeEval = (expr) => {
  const cleaned = String(expr).replace(/[^0-9+\-*/.() ]/g, '').trim();
  if (!cleaned) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + cleaned + ')')();
    if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) return null;
    return result;
  } catch { return null; }
};

// ─── Stable allTime filter object ─────────────────────────────────────────────
// Keep outside component so it never changes reference → no re-subscription
const ALL_TIME_FILTER = { dateRange: 'allTime', accountIds: [] };

// ─── Keypad ───────────────────────────────────────────────────────────────────
const ROWS = [
  ['7','8','9','÷'],
  ['4','5','6','×'],
  ['1','2','3','−'],
  ['.','0','⌫','+'],
];

function KeypadButton({ label, onPress, variant }) {
  const [pressed, setPressed] = useState(false);
  const bg    = { number: COLORS.surface,           operator: `${COLORS.blue}12`,   delete: `${COLORS.orange}12` }[variant];
  const color = { number: COLORS.labelPrimary,       operator: COLORS.blue,          delete: COLORS.orange }[variant];
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onPress(); }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={(e) => { e.preventDefault(); setPressed(false); onPress(); }}
      style={{
        padding: '19px 0', background: pressed ? COLORS.fillSecondary : bg,
        border: 'none', cursor: 'pointer',
        fontSize: variant === 'number' ? '22px' : '20px',
        fontWeight: variant === 'number' ? 400 : 600,
        color, fontFamily: FONT.family,
        transition: `background ${ANIM.fast}ms`,
        userSelect: 'none', WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

function Keypad({ expression, onChange, onDone, currency }) {
  const isOp = (k) => ['÷','×','−','+'].includes(k);
  const evalResult = safeEval(
    expression.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-')
  );
  const hasOp = /[÷×−+]/.test(expression);

  const handleKey = (key) => {
    if (key === '⌫') { onChange(expression.slice(0, -1)); return; }
    if (isOp(key)) {
      const last = expression.slice(-1);
      if (isOp(last)) onChange(expression.slice(0,-1) + key);
      else if (expression !== '') onChange(expression + key);
      return;
    }
    if (key === '.') {
      const parts = expression.split(/[÷×−+]/);
      if (parts[parts.length-1].includes('.')) return;
    }
    const parts = expression.split(/[÷×−+]/);
    if (parts[parts.length-1].length >= 12) return;
    onChange(expression + key);
  };

  return (
    <div>
      {/* Display */}
      <div style={{ padding: `${SPACE.lg}px ${SPACE.xl}px ${SPACE.md}px`, textAlign: 'right', background: COLORS.surface, borderBottom: `0.5px solid ${COLORS.separatorOpaque}` }}>
        {hasOp && (
          <div style={{ fontSize: '13px', color: COLORS.labelTertiary, fontFamily: FONT.family, marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>
            {expression}
          </div>
        )}
        <div style={{ fontSize: '40px', fontWeight: 700, color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-1.5px', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
          {evalResult !== null && hasOp ? formatAmount(evalResult, currency) : (expression || '0')}
        </div>
        <div style={{ fontSize: '13px', color: COLORS.labelTertiary, fontFamily: FONT.family, marginTop: 2, letterSpacing: '0.5px' }}>
          {currency}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: COLORS.separatorOpaque }}>
        {ROWS.flat().map((key, i) => (
          <KeypadButton
            key={i} label={key} onPress={() => handleKey(key)}
            variant={isOp(key) ? 'operator' : key === '⌫' ? 'delete' : 'number'}
          />
        ))}
      </div>

      {/* = or Done */}
      {hasOp ? (
        <button
          onClick={() => { if (evalResult !== null) onChange(String(Math.round(evalResult * 1e8) / 1e8)); }}
          style={{ width: '100%', padding: '17px', background: COLORS.blue, border: 'none', fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: FONT.family, cursor: 'pointer' }}
        >
          = {evalResult !== null ? formatAmount(evalResult, currency) : ''}
        </button>
      ) : (
        <button
          onClick={onDone}
          style={{ width: '100%', padding: '17px', background: COLORS.blue, border: 'none', fontSize: '17px', fontWeight: 700, color: '#fff', fontFamily: FONT.family, cursor: 'pointer' }}
        >
          Done
        </button>
      )}
    </div>
  );
}

// ─── Category Grid ────────────────────────────────────────────────────────────
function CategoryGrid({ categories, selected, onSelect, txType }) {
  const filtered = categories.filter(c =>
    txType === TX_TYPES.INCOME ? c.type === 'income' : c.type !== 'income'
  );
  if (!filtered.length) return (
    <div style={{ padding: SPACE.lg, textAlign: 'center', color: COLORS.labelTertiary, fontSize: FONT.footnote.size, fontFamily: FONT.family }}>
      No categories yet — add them in the Categories page
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: SPACE.sm, padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.lg}px` }}>
      {filtered.map(cat => {
        const active = selected === cat.id;
        return (
          <button key={cat.id} onClick={() => onSelect(active ? null : cat.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: `${SPACE.md}px ${SPACE.sm}px`, borderRadius: RADIUS.xl,
              background: active ? `${cat.color}18` : COLORS.fillTertiary,
              border: `1.5px solid ${active ? cat.color+'50' : 'transparent'}`,
              cursor: 'pointer', transform: active ? 'scale(1.04)' : 'scale(1)',
              transition: `all ${ANIM.fast}ms ${ANIM.spring}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: RADIUS.lg, background: active ? cat.color : `${cat.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={cat.icon} size={20} color={active ? '#fff' : cat.color} strokeWidth={1.75} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: active ? FONT.semibold : FONT.regular, color: active ? cat.color : COLORS.labelSecondary, fontFamily: FONT.family, textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Account Selector ─────────────────────────────────────────────────────────
function AccountSelector({ accounts, value, onChange, label = 'Account', exclude }) {
  const [open, setOpen] = useState(false);
  const list     = accounts.filter(a => a.id !== exclude);
  const selected = accounts.find(a => a.id === value);

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
      >
        <span style={{ fontSize: FONT.callout.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
          <span style={{ fontSize: FONT.callout.size, fontWeight: FONT.medium, color: selected ? COLORS.labelPrimary : COLORS.labelTertiary, fontFamily: FONT.family }}>
            {selected ? selected.name : 'Select'}
          </span>
          <Icon name="ChevronRight" size={16} color={COLORS.labelTertiary} strokeWidth={2.5} />
        </div>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={label} height={Math.min(140 + list.length * 64, 480)}>
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.xl}px` }}>
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: SPACE.xl, color: COLORS.labelTertiary, fontSize: FONT.footnote.size, fontFamily: FONT.family }}>
              No accounts found — add one in the Accounts page
            </div>
          ) : (
            <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
              {list.map((acc, i) => (
                <React.Fragment key={acc.id}>
                  <button onClick={() => { onChange(acc.id); setOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: `${acc.color || COLORS.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="Wallet" size={18} color={acc.color || COLORS.blue} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family }}>{acc.name}</div>
                      <div style={{ fontSize: FONT.footnote.size, color: COLORS.labelTertiary, fontFamily: FONT.family }}>{formatAmount(acc.balance, acc.currency)} {acc.currency}</div>
                    </div>
                    {value === acc.id && <Icon name="Check" size={18} color={COLORS.blue} strokeWidth={2.5} />}
                  </button>
                  {i < list.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 68 }} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

// ─── Currency Selector ────────────────────────────────────────────────────────
function CurrencySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = CURRENCIES.filter(c =>
    !search || c.code.includes(search.toUpperCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: RADIUS.full, background: `${COLORS.blue}12`, border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
      >
        <span style={{ fontSize: '13px', fontWeight: FONT.semibold, color: COLORS.blue, fontFamily: FONT.family }}>{value}</span>
        <Icon name="ChevronDown" size={12} color={COLORS.blue} strokeWidth={2.5} />
      </button>
      <BottomSheet open={open} onClose={() => { setOpen(false); setSearch(''); }} title="Currency" height={520}>
        <div style={{ padding: `0 ${SPACE.lg}px` }}>
          <input placeholder="Search currency…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: `${SPACE.md}px`, borderRadius: RADIUS.lg, border: `1.5px solid ${COLORS.separatorOpaque}`, fontSize: FONT.callout.size, fontFamily: FONT.family, color: COLORS.labelPrimary, background: COLORS.bgPrimary, outline: 'none', marginBottom: SPACE.md, boxSizing: 'border-box' }}
          />
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
            {filtered.map((c, i) => (
              <React.Fragment key={c.code}>
                <button onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: FONT.callout.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family, marginRight: 8 }}>{c.code}</span>
                    <span style={{ fontSize: FONT.footnote.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{c.name}</span>
                  </div>
                  {value === c.code && <Icon name="Check" size={18} color={COLORS.blue} strokeWidth={2.5} />}
                </button>
                {i < filtered.length-1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// Keyed by editData?.id || 'new' from App.jsx — full remount on each open
// ─────────────────────────────────────────────────────────────────────────────
export default function AddTransaction({ user, editData, onClose }) {
  const isEdit = !!editData;

  const { accounts }   = useAccounts(user.uid);
  const { categories } = useCategories(user.uid);
  const { addTransaction, editTransaction, deleteTransaction } = useTransactions(user.uid, ALL_TIME_FILTER);

  // ── Derive a safe Date from editData ─────────────────────────────────────
  // editData.dateObj can be: Date, Firestore Timestamp, {seconds}, ISO string, undefined
  const editDateObj = useMemo(() => {
    if (!isEdit) return new Date();
    return safeDate(editData.dateObj || editData.date);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Type tabs ─────────────────────────────────────────────────────────────
  const [txType, setTxType] = useState(() => {
    if (!isEdit) return TX_TYPES.EXPENSE;
    if ([TX_TYPES.TRANSFER_INT, TX_TYPES.TRANSFER_OUT, TX_TYPES.TRANSFER_IN].includes(editData.type)) return 'transfer';
    return editData.type || TX_TYPES.EXPENSE;
  });

  const [transferSubType, setTransferSubType] = useState(() =>
    isEdit ? (editData.type || TX_TYPES.TRANSFER_INT) : TX_TYPES.TRANSFER_INT
  );

  // ── Form fields ───────────────────────────────────────────────────────────
  const [expression,  setExpression]  = useState(() => isEdit ? String(editData.amount || '') : '');
  const [currency,    setCurrency]    = useState(() => isEdit ? (editData.currency || DEFAULT_CURRENCY) : DEFAULT_CURRENCY);
  const [accountId,   setAccountId]   = useState(() => isEdit ? (editData.accountId || '') : '');
  const [toAccountId, setToAccountId] = useState(() => isEdit ? (editData.toAccountId || '') : '');
  const [categoryId,  setCategoryId]  = useState(() => isEdit ? (editData.categoryId || null) : null);
  const [note,        setNote]        = useState(() => isEdit ? (editData.note || '') : '');
  const [date,        setDate]        = useState(() => editDateObj.toISOString().split('T')[0]);
  const [time,        setTime]        = useState(() => {
    const h = String(editDateObj.getHours()).padStart(2,'0');
    const m = String(editDateObj.getMinutes()).padStart(2,'0');
    return `${h}:${m}`;
  });

  const [receivedExpr,     setReceivedExpr]     = useState(() => isEdit ? String(editData.receivedAmount || '') : '');
  const [receivedCurrency, setReceivedCurrency] = useState(DEFAULT_CURRENCY);

  // UI state
  const [step,       setStep]       = useState('amount');
  const [saving,     setSaving]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [errors,     setErrors]     = useState({});

  // Auto-set currency from account
  useEffect(() => {
    const acc = accounts.find(a => a.id === accountId);
    if (acc?.currency) setCurrency(acc.currency);
  }, [accountId, accounts]);

  // Auto-set received currency from toAccount
  useEffect(() => {
    const acc = accounts.find(a => a.id === toAccountId);
    if (acc?.currency) setReceivedCurrency(acc.currency);
  }, [toAccountId, accounts]);

  // Auto-select first account if none selected yet
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const amount = useMemo(() => {
    const val = safeEval(expression.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-'));
    return val !== null ? val : parseFloat(expression) || 0;
  }, [expression]);

  const isTransfer = txType === 'transfer';

  const isCrossCurrency = isTransfer
    && transferSubType === TX_TYPES.TRANSFER_INT
    && toAccountId
    && accounts.find(a => a.id === toAccountId)?.currency !== currency;

  const accent = txType === TX_TYPES.INCOME ? COLORS.income : isTransfer ? COLORS.transfer : COLORS.expense;

  // ── Tab options ───────────────────────────────────────────────────────────
  const tabOptions = [
    { value: TX_TYPES.EXPENSE, label: 'Expense' },
    { value: TX_TYPES.INCOME,  label: 'Income'  },
    { value: 'transfer',       label: 'Transfer' },
  ];
  const transferOptions = [
    { value: TX_TYPES.TRANSFER_INT, label: 'Between Accounts' },
    { value: TX_TYPES.TRANSFER_OUT, label: 'Sent Out'         },
    { value: TX_TYPES.TRANSFER_IN,  label: 'Received'         },
  ];

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!amount || amount <= 0)  errs.amount    = 'Enter a valid amount';
    if (!accountId)              errs.accountId = 'Select an account';
    if (isTransfer && transferSubType === TX_TYPES.TRANSFER_INT && !toAccountId)
                                 errs.toAccount = 'Select destination account';
    if (isCrossCurrency && (!receivedExpr || parseFloat(receivedExpr) <= 0))
                                 errs.received  = 'Enter received amount';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const dateObj       = new Date(`${date}T${time}`);
      const resolvedType  = isTransfer ? transferSubType : txType;
      const receivedAmount = isCrossCurrency
        ? (safeEval(receivedExpr) ?? parseFloat(receivedExpr) ?? undefined)
        : undefined;

      const payload = {
        type:       resolvedType,
        amount,
        currency,
        accountId,
        ...(resolvedType === TX_TYPES.TRANSFER_INT ? { toAccountId } : {}),
        ...(receivedAmount !== undefined            ? { receivedAmount } : {}),
        categoryId: isTransfer ? null : (categoryId || null),
        note:       note.trim() || null,
        date:       Timestamp.fromDate(dateObj),  // static import — no dynamic await
      };

      if (isEdit) {
        await editTransaction(editData.id, payload, editData, accounts);
      } else {
        await addTransaction(payload, accounts);
      }
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteTransaction(editData.id, editData, accounts);
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto',
        background: COLORS.bgPrimary,
        borderRadius: `${RADIUS.xxl}px ${RADIUS.xxl}px 0 0`,
        maxHeight: '96dvh', display: 'flex', flexDirection: 'column',
        animation: `mv6-slide-up ${ANIM.slow}ms ${ANIM.spring} both`,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: RADIUS.full, background: COLORS.fillPrimary }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.md}px` }}>
          <span style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </span>
          <div style={{ display: 'flex', gap: SPACE.sm }}>
            {isEdit && (
              <button onClick={() => setShowDelete(true)}
                style={{ width: 32, height: 32, borderRadius: RADIUS.full, background: `${COLORS.red}12`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <Icon name="Trash2" size={15} color={COLORS.red} strokeWidth={2} />
              </button>
            )}
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: RADIUS.full, background: COLORS.fillTertiary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <Icon name="X" size={16} color={COLORS.labelSecondary} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Type tabs */}
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.md}px` }}>
          <SegmentedControl options={tabOptions} value={txType} onChange={v => { setTxType(v); setCategoryId(null); }} />
        </div>

        {/* Transfer sub-type */}
        {isTransfer && (
          <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.md}px` }}>
            <SegmentedControl options={transferOptions} value={transferSubType} onChange={setTransferSubType} />
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {step === 'amount' ? (
            /* ── AMOUNT STEP ───────────────────────────────────────────────── */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `0 ${SPACE.xl}px ${SPACE.xs}px`, gap: SPACE.sm }}>
                <span style={{ fontSize: '13px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>Currency</span>
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>
              <Keypad
                expression={expression}
                onChange={setExpression}
                currency={currency}
                onDone={() => {
                  if (amount > 0) setStep('details');
                  else setErrors({ amount: 'Enter an amount first' });
                }}
              />
              {errors.amount && (
                <div style={{ textAlign: 'center', padding: SPACE.sm, color: COLORS.red, fontSize: FONT.caption1.size, fontFamily: FONT.family }}>{errors.amount}</div>
              )}
            </div>
          ) : (
            /* ── DETAILS STEP ──────────────────────────────────────────────── */
            <div>
              {/* Amount bar — tap to go back to keypad */}
              <button onClick={() => setStep('amount')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.xl}px`, background: `${accent}10`, border: 'none', cursor: 'pointer', borderBottom: `0.5px solid ${COLORS.separatorOpaque}`, WebkitTapHighlightColor: 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: accent, fontFamily: FONT.family, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
                    {formatAmount(amount, currency)}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: `${accent}90`, fontFamily: FONT.family }}>{currency}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '13px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>Edit</span>
                  <Icon name="ChevronRight" size={14} color={COLORS.labelTertiary} strokeWidth={2.5} />
                </div>
              </button>

              {/* Details card */}
              <div style={{ margin: SPACE.lg, background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
                <AccountSelector accounts={accounts} value={accountId} onChange={setAccountId}
                  label={isTransfer && transferSubType === TX_TYPES.TRANSFER_INT ? 'From Account' : 'Account'} />

                {isTransfer && transferSubType === TX_TYPES.TRANSFER_INT && (
                  <>
                    <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />
                    <AccountSelector accounts={accounts} value={toAccountId} onChange={setToAccountId} label="To Account" exclude={accountId} />
                  </>
                )}

                {isCrossCurrency && (
                  <>
                    <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />
                    <div style={{ padding: `${SPACE.md}px ${SPACE.lg}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.sm }}>
                        <span style={{ fontSize: FONT.callout.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>Received Amount</span>
                        <CurrencySelector value={receivedCurrency} onChange={setReceivedCurrency} />
                      </div>
                      <input type="number" inputMode="decimal" value={receivedExpr} onChange={e => setReceivedExpr(e.target.value)} placeholder="0.000"
                        style={{ width: '100%', padding: `${SPACE.md}px`, borderRadius: RADIUS.lg, border: `1.5px solid ${errors.received ? COLORS.red : COLORS.separatorOpaque}`, fontSize: '22px', fontWeight: 600, color: COLORS.labelPrimary, fontFamily: FONT.family, background: COLORS.bgPrimary, outline: 'none', textAlign: 'right', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' }}
                      />
                    </div>
                  </>
                )}

                <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px` }}>
                  <span style={{ fontSize: FONT.callout.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>Date</span>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: FONT.callout.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family, cursor: 'pointer' }} />
                </div>

                <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />

                {/* Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px` }}>
                  <span style={{ fontSize: FONT.callout.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>Time</span>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: FONT.callout.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family, cursor: 'pointer' }} />
                </div>

                <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />

                {/* Note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, padding: `${SPACE.md}px ${SPACE.lg}px` }}>
                  <Icon name="FileText" size={16} color={COLORS.labelTertiary} strokeWidth={2} />
                  <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" maxLength={120}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: FONT.callout.size, color: COLORS.labelPrimary, fontFamily: FONT.family }} />
                </div>
              </div>

              {/* Category grid */}
              {!isTransfer && (
                <div>
                  <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.xs}px`, fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: FONT.family }}>
                    Category
                  </div>
                  <CategoryGrid categories={categories} selected={categoryId} onSelect={setCategoryId} txType={txType} />
                </div>
              )}

              {errors.submit && (
                <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.md}px`, color: COLORS.red, fontSize: FONT.footnote.size, fontFamily: FONT.family, textAlign: 'center' }}>{errors.submit}</div>
              )}

              {/* Save button */}
              <div style={{ padding: `${SPACE.md}px ${SPACE.lg}px`, paddingBottom: `max(${SPACE.xl}px, env(safe-area-inset-bottom, 20px))` }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ width: '100%', padding: '17px', borderRadius: RADIUS.xl, background: saving ? `${accent}60` : accent, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, WebkitTapHighlightColor: 'transparent' }}
                >
                  {saving
                    ? <Spinner size={20} color="#fff" />
                    : <span style={{ fontSize: '17px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>
                        {isEdit ? 'Save Changes' : `Add ${isTransfer ? 'Transfer' : txType === TX_TYPES.INCOME ? 'Income' : 'Expense'}`}
                      </span>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={showDelete} onClose={() => setShowDelete(false)}
        title="Delete Transaction"
        message="This will reverse the balance change on your account. Cannot be undone."
        confirmLabel="Delete" confirmDestructive
        onConfirm={handleDelete}
      />
    </div>
  );
}