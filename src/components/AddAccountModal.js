import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { CURRENCIES } from '../constants';
import { Modal, Input, Select, Button } from './ui/index';

const ACCOUNT_TYPES = [
  { value: 'Bank',       label: '🏦 Bank Account' },
  { value: 'Cash',       label: '💵 Cash Wallet'  },
  { value: 'Savings',    label: '🏺 Savings Pot'  },
  { value: 'Credit',     label: '💳 Credit Card'  },
  { value: 'Investment', label: '📈 Investment'   },
];

const BLANK = { name: '', currency: 'USD', initialBalance: '', type: 'Bank' };

export default function AddAccountModal({ user, open, onClose, onSuccess }) {
  const [form,   setForm]   = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const sym = CURRENCIES.find(c => c.code === form.currency)?.symbol || '$';

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Account name is required.'); return; }
    const initBal = parseFloat(form.initialBalance);
    if (isNaN(initBal) || form.initialBalance === '') { setError('Initial balance is required (enter 0 if none).'); return; }

    setSaving(true); setError('');
    try {
      const ref = await addDoc(collection(db, `users/${user.uid}/accounts`), {
        name:           form.name.trim(),
        currency:       form.currency,
        type:           form.type,
        currentBalance: initBal,
        initialBalance: initBal,
        createdAt:      Timestamp.now(),
      });
      if (initBal !== 0) {
        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          type: 'income', amount: Math.abs(initBal),
          accountId: ref.id, categoryId: 'INITIAL_SETUP',
          currency: form.currency, date: Timestamp.now(),
          note: 'Initial Balance Setup', userId: user.uid,
        });
      }
      onSuccess?.({ id: ref.id, name: form.name.trim(), currency: form.currency, type: form.type, currentBalance: initBal });
      setForm(BLANK);
      onClose();
    } catch (e) {
      setError('Failed to create account.');
      console.error(e);
    } finally { setSaving(false); }
  };

  const handleClose = () => { setForm(BLANK); setError(''); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Account"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" block onClick={handleClose}>Cancel</Button>
          <Button variant="primary" block loading={saving} onClick={handleSubmit}>Create Account</Button>
        </div>
      }
    >
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && (
          <div style={{ padding: '8px 10px', background: 'var(--c-danger-light)', border: '1px solid #FECACA', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--c-danger)' }}>
            {error}
          </div>
        )}

        <Input
          label="Account Name *"
          placeholder="e.g. Chase Checking, Cash Wallet"
          value={form.name}
          onChange={e => f('name', e.target.value)}
          autoFocus
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Select label="Currency" value={form.currency} onChange={e => f('currency', e.target.value)}>
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>
            ))}
          </Select>
          <Select label="Account Type" value={form.type} onChange={e => f('type', e.target.value)}>
            {ACCOUNT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>

        <Input
          label="Initial Balance *"
          type="number"
          step="0.01"
          placeholder="0.00"
          prefix={sym}
          value={form.initialBalance}
          onChange={e => f('initialBalance', e.target.value)}
        />
        <p style={{ fontSize: 10, color: 'var(--c-text-4)', margin: 0 }}>
          Enter your current balance. This is required — type 0 if starting fresh.
        </p>
      </div>
    </Modal>
  );
}
