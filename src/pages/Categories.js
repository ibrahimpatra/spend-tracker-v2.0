import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useCategories } from '../hooks/useData';
import { CategoryModal } from '../components/modals';
import { IOS } from '../constants';
import { Card, Btn, Empty } from '../components/ui';
import { SvgIcon } from '../utils/icons';

export default function Categories({ user }) {
  const categories = useCategories(user.uid);
  const [tab,      setTab]     = useState('expense');
  const [showAdd,  setShowAdd] = useState(false);

  const filtered = categories.filter(c => c.type === tab);

  const del = async id => {
    if (window.confirm('Delete category? Transactions will show as Uncategorized.'))
      await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
  };

  return (
    <div style={{ padding: '14px 16px 24px', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: IOS.gray1, letterSpacing: -0.5, margin: 0 }}>Categories</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: IOS.gray5 }}>{filtered.length} {tab} categories</p>
        </div>
        <Btn icon="plus" onClick={() => setShowAdd(true)}>Add</Btn>
      </div>

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 6, background: IOS.gray9, borderRadius: 12, padding: 4, marginBottom: 16, width: 'fit-content' }}>
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            background: tab === t ? '#fff' : 'transparent',
            color: tab === t ? (t === 'expense' ? IOS.red : IOS.green) : IOS.gray4,
            boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>
            {t === 'expense' ? '↑ Expense' : '↓ Income'}
          </button>
        ))}
      </div>

      {/* Categories grid */}
      {filtered.length === 0 ? (
        <div style={{ border: `2px dashed ${IOS.gray8}`, borderRadius: 18, padding: '28px' }}>
          <Empty
            emoji={tab === 'expense' ? '🧾' : '💰'}
            title={`No ${tab} categories`}
            subtitle="Create some to organise your transactions."
            action={<Btn icon="plus" onClick={() => setShowAdd(true)}>Add Category</Btn>}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(88px,1fr))', gap: 8 }}>
          {filtered.map(cat => (
            <div key={cat.id} style={{ position: 'relative' }}
              onMouseEnter={e => { const b = e.currentTarget.querySelector('.cat-del'); if (b) b.style.opacity = '1'; }}
              onMouseLeave={e => { const b = e.currentTarget.querySelector('.cat-del'); if (b) b.style.opacity = '0'; }}
            >
              <Card style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: cat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 3px 10px ${cat.color}55`, flexShrink: 0,
                }}>
                  <SvgIcon name={cat.icon} className="w-5 h-5 text-white" />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: IOS.gray1, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name}
                </span>
              </Card>
              <button className="cat-del" onClick={() => del(cat.id)} style={{
                position: 'absolute', top: 5, right: 5, width: 18, height: 18,
                borderRadius: '50%', background: '#FFF0EE', border: `1px solid #FECACA`,
                color: IOS.red, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s', padding: 0,
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <CategoryModal user={user} type={tab} open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
