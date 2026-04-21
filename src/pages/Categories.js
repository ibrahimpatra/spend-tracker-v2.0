import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import CategoryForm from '../components/CategoryForm';
import { SvgIcon } from '../utils/icons';
import { Icon, Empty } from '../components/ui/index';

export default function Categories({ user }) {
  const [categories, setCategories] = useState([]);
  const [showAdd,    setShowAdd]    = useState(false);
  const [typeTab,    setTypeTab]    = useState('expense');

  useEffect(() => onSnapshot(collection(db,`users/${user.uid}/categories`), s=>setCategories(s.docs.map(d=>({id:d.id,...d.data()})))), [user]);

  const handleDelete = async id => {
    if (window.confirm('Delete? Existing transactions will show as Uncategorized.'))
      await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
  };

  const filtered = categories.filter(c => c.type === typeTab);

  return (
    <div style={{ maxWidth:640, paddingBottom:80 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:15, fontWeight:800, color:'var(--c-text-1)' }}>Categories</h2>
          <p style={{ margin:0, fontSize:11, color:'var(--c-text-4)' }}>{filtered.length} {typeTab} categories</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{
          display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
          borderRadius:'var(--r-md)', background:'var(--c-primary)', border:'none',
          color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
        }}>
          <Icon name="plus" size={12} style={{color:'#fff'}} /> Add Category
        </button>
      </div>

      {/* Type tabs */}
      <div className="tab-group" style={{ maxWidth:220, marginBottom:14 }}>
        {['expense','income'].map(t => (
          <button key={t} className={`tab-item ${typeTab===t?'active':''}`} onClick={()=>setTypeTab(t)} style={{ textTransform:'capitalize' }}>
            {t==='expense'?'↑ Expense':'↓ Income'}
          </button>
        ))}
      </div>

      {/* Categories grid */}
      {filtered.length === 0 ? (
        <div style={{ border:'2px dashed var(--c-border)', borderRadius:'var(--r-xl)', padding:'28px' }}>
          <Empty
            icon={typeTab==='expense'?'🧾':'💰'}
            title={`No ${typeTab} categories`}
            subtitle="Create some to organise your transactions."
            action={
              <button onClick={()=>setShowAdd(true)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:'var(--r-md)', background:'var(--c-primary)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <Icon name="plus" size={12} style={{color:'#fff'}} /> Add Category
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8 }}>
          {filtered.map(cat => (
            <div key={cat.id} className="card" style={{ padding:'10px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', transition:'box-shadow 0.15s, transform 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.querySelector('.del-btn').style.opacity='1'; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='var(--shadow-xs)'; e.currentTarget.querySelector('.del-btn').style.opacity='0'; }}
            >
              {/* Delete */}
              <button className="del-btn" onClick={()=>handleDelete(cat.id)} style={{
                position:'absolute', top:4, right:4, width:18, height:18, borderRadius:'50%',
                background:'var(--c-danger-light)', border:'1px solid #FECACA',
                color:'var(--c-danger)', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', opacity:0, transition:'opacity 0.15s', padding:0,
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>

              {/* Icon */}
              <div style={{ width:36, height:36, borderRadius:10, background:cat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 2px 8px ${cat.color}55` }}>
                <SvgIcon name={cat.icon} className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--c-text-1)', textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* New category modal */}
      {showAdd && (
        <CategoryForm
          user={user} type={typeTab} asModal
          onSuccess={()=>setShowAdd(false)}
          onCancel={()=>setShowAdd(false)}
        />
      )}
    </div>
  );
}
