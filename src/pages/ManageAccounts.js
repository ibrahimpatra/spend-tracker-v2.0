import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, Timestamp
} from 'firebase/firestore';
import { CURRENCIES } from '../constants';

// ─── Account type icons ───────────────────────────────────────────────────────
const TYPE_META = {
  Bank:    { label: 'Bank Account',  emoji: '🏦', bg: 'bg-blue-50',   text: 'text-[#007AFF]' },
  Cash:    { label: 'Cash Wallet',   emoji: '💵', bg: 'bg-green-50',  text: 'text-[#34C759]' },
  Savings: { label: 'Savings Pot',   emoji: '🏺', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  Credit:  { label: 'Credit Card',   emoji: '💳', bg: 'bg-purple-50', text: 'text-purple-600' },
  Investment: { label: 'Investment', emoji: '📈', bg: 'bg-orange-50', text: 'text-orange-500' },
};

const BLANK_FORM = { name: '', currency: 'USD', initialBalance: '', type: 'Bank' };

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({ acc, onDelete }) {
  const meta = TYPE_META[acc.type] || TYPE_META.Bank;
  const sym  = CURRENCIES.find(c => c.code === acc.currency)?.symbol || acc.currency;
  const neg  = acc.currentBalance < 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${meta.bg}`}>
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-bank-900 truncate">{acc.name}</p>
        <p className="text-xs text-bank-500">{meta.label} · {acc.currency}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-base font-extrabold ${neg ? 'text-[#FF3B30]' : 'text-bank-900'}`}>
          {neg ? '-' : ''}{sym}{Math.abs(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <button
          onClick={() => onDelete(acc)}
          className="text-[11px] text-gray-300 hover:text-[#FF3B30] transition font-semibold opacity-0 group-hover:opacity-100"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── Manage Accounts page ─────────────────────────────────────────────────────
export default function ManageAccounts({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState(BLANK_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    return onSnapshot(
      collection(db, `users/${user.uid}/accounts`),
      snap => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError('Account name is required.'); return; }
    setSaving(true);
    setError('');
    const initBal = parseFloat(formData.initialBalance) || 0;
    try {
      const ref = await addDoc(collection(db, `users/${user.uid}/accounts`), {
        name:           formData.name.trim(),
        currency:       formData.currency,
        type:           formData.type,
        currentBalance: initBal,
        initialBalance: initBal,
        createdAt:      Timestamp.now(),
      });

      if (initBal !== 0) {
        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          type:       'income',
          amount:     Math.abs(initBal),
          accountId:  ref.id,
          categoryId: 'INITIAL_SETUP',
          currency:   formData.currency,
          date:       Timestamp.now(),
          note:       'Initial Balance Setup',
          userId:     user.uid,
        });
      }

      setFormData(BLANK_FORM);
      setShowForm(false);
    } catch (e) {
      setError('Failed to create account. Try again.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (acc) => {
    if (!window.confirm(`Delete "${acc.name}"? This won't delete its transactions.`)) return;
    await deleteDoc(doc(db, `users/${user.uid}/accounts`, acc.id));
  };

  const f = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  // Totals per currency
  const totals = accounts.reduce((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + a.currentBalance;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto pb-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-bank-900">Accounts</h2>
          <p className="text-sm text-bank-500 mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(o => !o)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
            showForm
              ? 'bg-gray-100 text-bank-900'
              : 'bg-money-600 text-white hover:bg-money-700 shadow-sm'
          }`}
        >
          {showForm ? 'Cancel' : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Add Account
            </>
          )}
        </button>
      </div>

      {/* Net Worth Summary */}
      {Object.keys(totals).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {Object.entries(totals).map(([curr, total]) => {
            const sym = CURRENCIES.find(c => c.code === curr)?.symbol || curr;
            const neg = total < 0;
            return (
              <div key={curr} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-bank-500 uppercase tracking-wide">{curr} Total</p>
                <p className={`text-lg font-extrabold mt-1 ${neg ? 'text-[#FF3B30]' : 'text-bank-900'}`}>
                  {neg ? '-' : ''}{sym}{Math.abs(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 animate-fade-in-up">
          <h3 className="font-bold text-bank-900 mb-4">New Account</h3>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 text-[#FF3B30] text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-bank-500 uppercase tracking-wide mb-1.5">
                Account Name <span className="text-[#FF3B30]">*</span>
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 focus:bg-white transition"
                placeholder="e.g. Chase Checking"
                value={formData.name}
                onChange={e => f('name', e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Currency */}
              <div>
                <label className="block text-xs font-bold text-bank-500 uppercase tracking-wide mb-1.5">Currency</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 transition appearance-none"
                  value={formData.currency}
                  onChange={e => f('currency', e.target.value)}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-bank-500 uppercase tracking-wide mb-1.5">Type</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 transition appearance-none"
                  value={formData.type}
                  onChange={e => f('type', e.target.value)}
                >
                  {Object.entries(TYPE_META).map(([val, m]) => (
                    <option key={val} value={val}>{m.emoji} {m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Initial Balance */}
            <div>
              <label className="block text-xs font-bold text-bank-500 uppercase tracking-wide mb-1.5">
                Initial Balance <span className="text-bank-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bank-500 font-bold text-sm pointer-events-none">
                  {CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 focus:bg-white transition"
                  placeholder="0.00"
                  value={formData.initialBalance}
                  onChange={e => f('initialBalance', e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowForm(false); setFormData(BLANK_FORM); setError(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-bank-500 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white bg-money-600 hover:bg-money-700 shadow-sm transition disabled:opacity-60 active:scale-[0.98]"
              >
                {saving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl text-bank-500 text-sm">
            <p className="text-3xl mb-3">🏦</p>
            No accounts yet. Create your first account above.
          </div>
        ) : (
          accounts.map(acc => (
            <AccountCard key={acc.id} acc={acc} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
