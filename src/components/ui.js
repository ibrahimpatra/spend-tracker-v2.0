import React from 'react';
import { IOS } from '../constants';

// ─── Icon (SVG path renderer) ─────────────────────────────────────────────────
export const ICONS = {
  home:      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  list:      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  card:      "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  tag:       "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z",
  plus:      "M12 4v16m8-8H4",
  close:     "M6 18L18 6M6 6l12 12",
  check:     "M5 13l4 4L19 7",
  back:      "M15 19l-7-7 7-7",
  chevRight: "M9 5l7 7-7 7",
  chevDown:  "M19 9l-7 7-7-7",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  eye:       "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  eyeOff:    "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  logout:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  dots:      "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z",
  grid:      "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  transfer:  "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  trash:     "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  drag:      "M9 20h6M9 4h6m-6 8h6m-3 4v4m0-16v4",
  chart:     "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  settings:  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  menu:      "M4 6h16M4 12h16M4 18h16",
};

export const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d={ICONS[name] || ICONS.dots} />
  </svg>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 18, color = IOS.blue }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.5"
      strokeDasharray="48" strokeDashoffset="36" />
  </svg>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onClick, className }) => (
  <div onClick={onClick} className={className} style={{
    background: IOS.white,
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

// ─── Btn ─────────────────────────────────────────────────────────────────────
export const Btn = ({
  children, onClick, variant = 'primary', size = 'md',
  disabled, loading, icon, block, style, type = 'button',
}) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontWeight: 600, letterSpacing: -0.1,
    borderRadius: 12, transition: 'all 0.15s', whiteSpace: 'nowrap',
    opacity: disabled || loading ? 0.55 : 1,
    width: block ? '100%' : undefined,
    ...style,
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 16px', fontSize: 13 },
    lg: { padding: '13px 20px', fontSize: 15 },
  };
  const variants = {
    primary: { background: IOS.blue, color: '#fff' },
    danger:  { background: IOS.red,  color: '#fff' },
    success: { background: IOS.green, color: '#fff' },
    ghost:   { background: 'transparent', color: IOS.blue },
    outline: { background: 'transparent', color: IOS.gray2, border: `1px solid ${IOS.gray8}` },
    surface: { background: IOS.gray9, color: IOS.gray1 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {loading ? <Spinner size={13} color={variant === 'primary' ? '#fff' : IOS.blue} />
                : icon ? <Icon name={icon} size={13} color="currentColor" /> : null}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 11px',
  background: IOS.gray9, border: `1px solid ${IOS.gray8}`,
  borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
  color: IOS.gray1, transition: 'border-color 0.15s, background 0.15s',
};

export const Field = React.forwardRef(({ label, error, prefix, suffix, ...props }, ref) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: IOS.gray4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {prefix && <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: IOS.gray4, pointerEvents: 'none' }}>{prefix}</span>}
      <input ref={ref} {...props}
        style={{ ...inputStyle, paddingLeft: prefix ? 28 : 11, paddingRight: suffix ? 28 : 11, ...(props.style || {}) }}
        onFocus={e => { e.target.style.borderColor = IOS.blue; e.target.style.background = '#fff'; }}
        onBlur={e  => { e.target.style.borderColor = IOS.gray8; e.target.style.background = IOS.gray9; }}
      />
      {suffix && <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: IOS.gray4, pointerEvents: 'none' }}>{suffix}</span>}
    </div>
    {error && <p style={{ fontSize: 11, color: IOS.red, marginTop: 1 }}>{error}</p>}
  </div>
));

// ─── Select ───────────────────────────────────────────────────────────────────
export const Sel = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: IOS.gray4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
    <select {...props} style={{
      ...inputStyle, appearance: 'none', cursor: 'pointer',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
      ...(props.style || {}),
    }}
      onFocus={e => { e.target.style.borderColor = IOS.blue; e.target.style.background = '#fff'; }}
      onBlur={e  => { e.target.style.borderColor = IOS.gray8; e.target.style.background = IOS.gray9; }}
    >{children}</select>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, width = 460 }) => {
  React.useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;

  return (
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="anim-up" style={{
        background: '#fff', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: width, maxHeight: '96dvh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Drag handle */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: IOS.gray7 }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: IOS.gray1 }}>{title}</h2>
          <button onClick={onClose} style={{ background: IOS.gray9, border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={14} color={IOS.gray4} />
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>{children}</div>
        {/* Footer */}
        {footer && <div style={{ padding: '14px 20px 20px', borderTop: `1px solid ${IOS.gray9}` }}>{footer}</div>}
      </div>
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────
export const Empty = ({ emoji = '📭', title, subtitle, action }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
    <p style={{ fontSize: 15, fontWeight: 700, color: IOS.gray2, margin: '0 0 6px' }}>{title}</p>
    {subtitle && <p style={{ fontSize: 13, color: IOS.gray5, margin: '0 0 16px' }}>{subtitle}</p>}
    {action}
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 6px' }}>
    <span style={{ fontSize: 13, fontWeight: 700, color: IOS.gray4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    {action}
  </div>
);

// ─── Amount display ───────────────────────────────────────────────────────────
export const AmountDisplay = ({ amount, currency, size = 32, color, blurred }) => (
  <span style={{
    fontSize: size, fontWeight: 800, letterSpacing: -1.2,
    color: color || IOS.gray1, fontVariantNumeric: 'tabular-nums',
    filter: blurred ? 'blur(8px)' : 'none', userSelect: blurred ? 'none' : 'auto',
    transition: 'filter 0.2s',
  }}>
    {currency}{typeof amount === 'number' ? Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
  </span>
);

// ─── Keypad ────────────────────────────────────────────────────────────────────
export const Keypad = ({ onInput, onClear, onSubmit, accentColor = IOS.blue }) => {
  const keys = [
    ['7','8','9'],
    ['4','5','6'],
    ['1','2','3'],
    ['.','0','⌫'],
  ];
  return (
    <div style={{ padding: '8px 20px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
        {keys.flat().map(k => (
          <button key={k} type="button"
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); if (k === '⌫') onInput('⌫'); else onInput(k); }}
            style={{
              height: 52, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: k === '⌫' ? '#FFF0EE' : IOS.gray9,
              color: k === '⌫' ? IOS.red : IOS.gray1,
              fontSize: k === '⌫' ? 18 : 20, fontWeight: k === '⌫' ? 600 : 500,
              fontFamily: 'inherit', transition: 'transform 0.1s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onMouseUp  ={e => e.currentTarget.style.transform = 'scale(1)'}
          >{k}</button>
        ))}
      </div>
    </div>
  );
};
