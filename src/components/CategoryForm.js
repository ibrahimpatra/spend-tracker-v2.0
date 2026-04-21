import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ICON_SET, SvgIcon } from '../utils/icons';
import { Modal, Input, Button } from './ui/index';

const PRESET_COLORS = [
  '#2563EB','#059669','#DC2626','#D97706','#7C3AED',
  '#DB2777','#0891B2','#65A30D','#EA580C','#475569',
];

export default function CategoryForm({ user, type, onSuccess, onCancel, asModal = false }) {
  const [name,    setName]    = useState('');
  const [color,   setColor]   = useState('#2563EB');
  const [icon,    setIcon]    = useState('Shopping');
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(''); setColor('#2563EB'); setIcon('Shopping'); };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = { name: name.trim(), icon, color, type, userId: user.uid };
      const ref = await addDoc(collection(db, `users/${user.uid}/categories`), payload);
      onSuccess?.({ id: ref.id, ...payload });
      reset();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const body = (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Preview + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}>
          <SvgIcon name={icon} className="w-5 h-5 text-white" />
        </div>
        <Input
          placeholder="Category name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          className="flex-1"
        />
      </div>

      {/* Color presets */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Color</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{
              width: 22, height: 22, borderRadius: '50%', background: c, border: 'none',
              cursor: 'pointer', flexShrink: 0, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s',
            }}>
              {color === c && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
            </button>
          ))}
          {/* Custom */}
          <div style={{ position: 'relative', width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', border: '1.5px dashed var(--c-border)', cursor: 'pointer', flexShrink: 0 }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ position: 'absolute', top: -6, left: -6, width: 34, height: 34, cursor: 'pointer', opacity: 0 }} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--c-text-4)', pointerEvents: 'none' }}>+</span>
          </div>
        </div>
      </div>

      {/* Icon grid */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Icon</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
          {Object.keys(ICON_SET).map(k => (
            <button key={k} type="button" onClick={() => setIcon(k)} style={{
              width: '100%', aspectRatio: '1', borderRadius: 8, border: '1px solid',
              borderColor: icon === k ? color : 'var(--c-border-light)',
              background: icon === k ? color + '18' : 'var(--c-surface-2)',
              color: icon === k ? color : 'var(--c-text-3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s', transform: icon === k ? 'scale(1.06)' : 'none',
            }}>
              <SvgIcon name={k} className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (asModal) {
    return (
      <Modal
        open
        onClose={onCancel}
        title={`New ${type === 'expense' ? 'Expense' : 'Income'} Category`}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" block onClick={onCancel}>Cancel</Button>
            <Button variant="primary" block loading={loading} onClick={handleSubmit} style={{ background: color, borderColor: color }}>
              Create Category
            </Button>
          </div>
        }
      >
        {body}
      </Modal>
    );
  }

  return (
    <div className="card anim-up" style={{ marginBottom: 12 }}>
      {body}
      <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
        <Button variant="ghost" block onClick={onCancel}>Cancel</Button>
        <Button variant="primary" block loading={loading} onClick={handleSubmit} style={{ background: color, borderColor: color }}>
          Create Category
        </Button>
      </div>
    </div>
  );
}
