// Shared full-screen overlay for creating a new account.
// Used both from Accounts page AND from inside AddTransaction.

import React, { useState } from 'react';
import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, ACCOUNT_TYPES, CURRENCIES, DEFAULT_CURRENCY } from '../constants';
import { Icon, Spinner, SegmentedControl } from './ui';

const PRESET_COLORS = ['#007AFF','#34C759','#FF9500','#FF3B30','#5856D6','#FF2D55','#AF52DE','#5AC8FA','#FFCC00','#A2845E'];

const iStyle = (err) => ({
  width: '100%', padding: `${SPACE.md}px`, borderRadius: RADIUS.lg,
  border: `1.5px solid ${err ? COLORS.red : COLORS.separatorOpaque}`,
  fontSize: FONT.callout.size, fontFamily: FONT.family,
  color: COLORS.labelPrimary, background: COLORS.bgPrimary,
  outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none',
});

const Label = ({ text }) => (
  <div style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, fontFamily: FONT.family, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>{text}</div>
);

export default function AddAccountOverlay({ onClose, onSave, saving, defaultIsDefault = false }) {
  const [name,       setName]       = useState('');
  const [type,       setType]       = useState('bank');
  const [balance,    setBalance]    = useState('');
  const [currency,   setCurrency]   = useState(DEFAULT_CURRENCY);
  const [color,      setColor]      = useState(PRESET_COLORS[0]);
  const [isDefault,  setIsDefault]  = useState(defaultIsDefault);
  const [errors,     setErrors]     = useState({});
  const [animate,    setAnimate]    = useState(false);

  React.useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true))); }, []);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Enter account name';
    if (isNaN(parseFloat(balance))) e.balance = 'Enter a valid balance';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), type, balance: parseFloat(balance), currency, color, isDefault });
  };

  const typeOptions = ACCOUNT_TYPES.map(t => ({ value: t.value, label: t.label.replace(' Account','').replace(' Card','').replace('Digital ','') }));

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
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: RADIUS.full, background: COLORS.fillPrimary }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.md}px`, flexShrink: 0 }}>
          <span style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>New Account</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: RADIUS.full, background: COLORS.fillTertiary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <Icon name="X" size={15} color={COLORS.labelSecondary} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>

          {/* Type */}
          <div>
            <Label text="Type" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
              {ACCOUNT_TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: RADIUS.full, background: type === t.value ? COLORS.blue : COLORS.fillTertiary, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: FONT.medium, color: type === t.value ? '#fff' : COLORS.labelSecondary, fontFamily: FONT.family, transition: `all ${ANIM.fast}ms`, WebkitTapHighlightColor: 'transparent' }}>
                  <Icon name={t.icon} size={13} color={type === t.value ? '#fff' : COLORS.labelSecondary} strokeWidth={2} />
                  {t.label.replace(' Account','').replace(' Card','').replace('Digital ','')}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label text="Account Name" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NBK Current"
              style={iStyle(errors.name)} autoFocus />
            {errors.name && <div style={{ color: COLORS.red, fontSize: FONT.caption1.size, fontFamily: FONT.family, marginTop: 4 }}>{errors.name}</div>}
          </div>

          {/* Balance + Currency */}
          <div style={{ display: 'flex', gap: SPACE.md }}>
            <div style={{ flex: 1 }}>
              <Label text="Opening Balance" />
              <input type="number" inputMode="decimal" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.000"
                style={{ ...iStyle(errors.balance), textAlign: 'right', fontSize: '20px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }} />
              {errors.balance && <div style={{ color: COLORS.red, fontSize: FONT.caption1.size, fontFamily: FONT.family, marginTop: 4 }}>{errors.balance}</div>}
            </div>
            <div style={{ width: 110 }}>
              <Label text="Currency" />
              <div style={{ position: 'relative' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  style={{ ...iStyle(), width: '100%', appearance: 'none', WebkitAppearance: 'none', paddingRight: 28, cursor: 'pointer' }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
                <Icon name="ChevronDown" size={14} color={COLORS.labelTertiary} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <Label text="Color" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ width: 34, height: 34, borderRadius: RADIUS.full, background: c, border: `3px solid ${color === c ? COLORS.labelPrimary : 'transparent'}`, cursor: 'pointer', boxSizing: 'border-box', transform: color === c ? 'scale(1.18)' : 'scale(1)', transition: `transform ${ANIM.fast}ms ${ANIM.spring}`, WebkitTapHighlightColor: 'transparent' }} />
              ))}
            </div>
          </div>

          {/* Default account toggle */}
          <button onClick={() => setIsDefault(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, background: COLORS.surface, border: 'none', borderRadius: RADIUS.xl, padding: `${SPACE.md}px ${SPACE.lg}px`, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', boxShadow: SHADOW.sm }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family }}>Set as Default Account</div>
              <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, marginTop: 2 }}>Pre-selected when adding transactions</div>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: RADIUS.full, background: isDefault ? COLORS.blue : COLORS.fillSecondary, position: 'relative', transition: `background ${ANIM.fast}ms`, flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: isDefault ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: `left ${ANIM.fast}ms ${ANIM.spring}` }} />
            </div>
          </button>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '17px', borderRadius: RADIUS.xl, background: saving ? `${COLORS.blue}80` : COLORS.blue, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, marginBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>
            {saving ? <Spinner size={20} color="#fff" /> : <span style={{ fontSize: '17px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>Add Account</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
