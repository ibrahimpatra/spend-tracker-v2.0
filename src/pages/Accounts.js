import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAccounts } from '../hooks/useData';
import { AddAccountModal } from '../components/modals';
import { IOS, CURRENCIES, ACCOUNT_TYPES } from '../constants';
import { Card, Btn, Icon, Empty } from '../components/ui';

export default function Accounts({ user }) {
  const accounts = useAccounts(user.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [hiddenBals, setHiddenBals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_hb') || '{}'); } catch { return {}; }
  });
  const saveHB = h => { setHiddenBals(h); localStorage.setItem('mv_hb', JSON.stringify(h)); };

  const totals = accounts.reduce((acc, a) => ({
    ...acc, [a.currency]: (acc[a.currency] || 0) + a.currentBalance
  }), {});

  const del = async acc => {
    if (!window.confirm(`Delete "${acc.name}"?\nTransactions will remain but show no account.`)) return;
    await deleteDoc(doc(db, `users/${user.uid}/accounts`, acc.id));
  };

  return (
    <div style={{ padding: '14px 16px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: IOS.gray1, letterSpacing: -0.5, margin: 0 }}>Accounts</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: IOS.gray5 }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn icon="plus" onClick={() => setShowAdd(true)}>Add Account</Btn>
      </div>

      {/* Net worth summary */}
      {Object.keys(totals).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, marginBottom: 16 }}>
          {Object.entries(totals).map(([curr, total]) => {
            const sym = CURRENCIES.find(c => c.code === curr)?.symbol || curr;
            const neg = total < 0;
            return (
              <Card key={curr} style={{ padding: '11px 14px' }}>
                <p style={{ margin: '0 0 3px', fontSize: 9, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{curr} Total</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: neg ? IOS.red : IOS.gray1 }}>
                  {neg ? '-' : ''}{sym}{Math.abs(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div style={{ border: `2px dashed ${IOS.gray8}`, borderRadius: 18, padding: '32px' }}>
          <Empty emoji="🏦" title="No accounts yet" subtitle="Add your first account to start tracking."
            action={<Btn icon="plus" onClick={() => setShowAdd(true)}>Add Account</Btn>} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {accounts.map(acc => {
            const sym    = CURRENCIES.find(c => c.code === acc.currency)?.symbol || acc.currency;
            const hidden = hiddenBals[acc.id];
            const neg    = acc.currentBalance < 0;
            const emoji  = ACCOUNT_TYPES.find(t => t.value === acc.type)?.emoji || '💳';
            const label  = ACCOUNT_TYPES.find(t => t.value === acc.type)?.label || acc.type;
            return (
              <Card key={acc.id} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 12, background: IOS.blue + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                  {emoji}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: IOS.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: IOS.gray5 }}>{label} · {acc.currency}</p>
                </div>
                {/* Balance + actions */}
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{
                    margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: -0.4,
                    color: neg ? IOS.red : IOS.gray1,
                    filter: hidden ? 'blur(8px)' : 'none',
                    userSelect: hidden ? 'none' : 'auto',
                    transition: 'filter 0.2s',
                  }}>
                    {neg ? '-' : ''}{sym}{Math.abs(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <button onClick={() => saveHB({ ...hiddenBals, [acc.id]: !hidden })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center', borderRadius: 6, color: IOS.gray5 }}>
                    <Icon name={hidden ? 'eyeOff' : 'eye'} size={13} color={IOS.gray5} />
                  </button>
                  <button onClick={() => del(acc)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center', borderRadius: 6, color: IOS.gray5 }}
                    onMouseEnter={e => e.currentTarget.style.color = IOS.red}
                    onMouseLeave={e => e.currentTarget.style.color = IOS.gray5}>
                    <Icon name="trash" size={13} color="currentColor" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddAccountModal user={user} open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
