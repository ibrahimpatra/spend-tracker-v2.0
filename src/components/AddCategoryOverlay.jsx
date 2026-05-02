// Shared full-screen overlay for creating a new category.
// Used from Categories page AND from inside AddTransaction.

import React, { useState } from 'react';
import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { Icon, Spinner, SegmentedControl } from './ui';

const iStyle = (err) => ({
  width: '100%', padding: `${SPACE.md}px`, borderRadius: RADIUS.lg,
  border: `1.5px solid ${err ? COLORS.red : COLORS.separatorOpaque}`,
  fontSize: FONT.callout.size, fontFamily: FONT.family,
  color: COLORS.labelPrimary, background: COLORS.bgPrimary,
  outline: 'none', boxSizing: 'border-box',
});

const Label = ({ text }) => (
  <div style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, fontFamily: FONT.family, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>{text}</div>
);

export default function AddCategoryOverlay({ onClose, onSave, saving, defaultType = 'expense' }) {
  const [name,        setName]        = useState('');
  const [type,        setType]        = useState(defaultType);
  const [color,       setColor]       = useState(CATEGORY_COLORS[0]);
  const [icon,        setIcon]        = useState(CATEGORY_ICONS[0]);
  const [customColor, setCustomColor] = useState('');
  const [errors,      setErrors]      = useState({});
  const [animate,     setAnimate]     = useState(false);

  React.useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true))); }, []);

  const activeColor = customColor || color;

  const handleSave = () => {
    if (!name.trim()) { setErrors({ name: 'Enter a name' }); return; }
    onSave({ name: name.trim(), color: activeColor, icon, type });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', opacity: animate ? 1 : 0, transition: `opacity 300ms` }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto',
        background: COLORS.bgPrimary, borderRadius: `${RADIUS.xxl}px ${RADIUS.xxl}px 0 0`,
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        transform: animate ? 'translateY(0)' : 'translateY(100%)',
        transition: `transform 350ms ${ANIM.spring}`,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: RADIUS.full, background: COLORS.fillPrimary }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.md}px`, flexShrink: 0 }}>
          <span style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>New Category</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: RADIUS.full, background: COLORS.fillTertiary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <Icon name="X" size={15} color={COLORS.labelSecondary} strokeWidth={2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
          {/* Type */}
          <SegmentedControl options={[{ value: 'expense', label: 'Expense' },{ value: 'income', label: 'Income' }]} value={type} onChange={setType} />

          {/* Preview + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md }}>
            <div style={{ width: 52, height: 52, borderRadius: RADIUS.lg, background: `${activeColor}20`, border: `1.5px solid ${activeColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={26} color={activeColor} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1 }}>
              <Label text="Name" />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Groceries" maxLength={32}
                style={iStyle(errors.name)} autoFocus />
              {errors.name && <div style={{ color: COLORS.red, fontSize: FONT.caption1.size, fontFamily: FONT.family, marginTop: 3 }}>{errors.name}</div>}
            </div>
          </div>

          {/* Color */}
          <div>
            <Label text="Color" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {CATEGORY_COLORS.map(c => (
                <button key={c} onClick={() => { setColor(c); setCustomColor(''); }}
                  style={{ width: 34, height: 34, borderRadius: RADIUS.full, background: c, border: `3px solid ${activeColor === c && !customColor ? COLORS.labelPrimary : 'transparent'}`, cursor: 'pointer', boxSizing: 'border-box', transform: activeColor === c && !customColor ? 'scale(1.18)' : 'scale(1)', transition: `transform ${ANIM.fast}ms ${ANIM.spring}`, WebkitTapHighlightColor: 'transparent' }} />
              ))}
              <label style={{ width: 34, height: 34, borderRadius: RADIUS.full, overflow: 'hidden', cursor: 'pointer', border: `2px dashed ${COLORS.separator}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: customColor || 'transparent', position: 'relative' }}>
                <input type="color" value={customColor || color} onChange={e => setCustomColor(e.target.value)} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} />
                {!customColor && <Icon name="Pipette" size={14} color={COLORS.labelTertiary} strokeWidth={2} />}
              </label>
            </div>
          </div>

          {/* Icon */}
          <div>
            <Label text="Icon" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: SPACE.sm }}>
              {CATEGORY_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  style={{ aspectRatio: '1', borderRadius: RADIUS.lg, background: icon === ic ? `${activeColor}20` : COLORS.fillTertiary, border: `1.5px solid ${icon === ic ? activeColor + '50' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: `all ${ANIM.fast}ms`, WebkitTapHighlightColor: 'transparent' }}>
                  <Icon name={ic} size={18} color={icon === ic ? activeColor : COLORS.labelSecondary} strokeWidth={1.75} />
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '17px', borderRadius: RADIUS.xl, background: saving ? `${activeColor}80` : activeColor, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>
            {saving ? <Spinner size={20} color="#fff" /> : <span style={{ fontSize: '17px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>Add Category</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
