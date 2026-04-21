import React from 'react';

// ─── Icon ─────────────────────────────────────────────────────────────────────
export const PATHS = {
  dashboard:   "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  records:     "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  accounts:    "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  categories:  "M4 6h6v6H4V6zm10 0h6v6h-6V6zM4 14h6v6H4v-6zm10 3h6m-3-3v6",
  analytics:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  logout:      "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  plus:        "M12 4v16m8-8H4",
  close:       "M6 18L18 6M6 6l12 12",
  check:       "M5 13l4 4L19 7",
  chevDown:    "M19 9l-7 7-7-7",
  chevRight:   "M9 5l7 7-7 7",
  search:      "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  eye:         "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  eyeOff:      "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  filter:      "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
  sort:        "M4 6h16M4 12h8m-8 6h16",
  drag:        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  transfer:    "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  trash:       "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  info:        "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  bank:        "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  wallet:      "M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7zm14 5a1 1 0 11-2 0 1 1 0 012 0z",
  dotGrid:     "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z",
};

export const Icon = ({ name, size = 14, className = '', strokeWidth = 1.8, style }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d={PATHS[name] || PATHS.dotGrid} />
  </svg>
);

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({
  children, onClick, variant = 'primary', size = 'md',
  disabled, loading, block, icon, className = '', type = 'button', style,
}) => {
  const base = `btn btn-${variant}`;
  const sz   = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const blk  = block ? 'btn-block' : '';
  const icn  = !children ? 'btn-icon' : '';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sz} ${blk} ${icn} ${className}`}
      style={style}
    >
      {loading ? <Spinner size={12} /> : icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', pad = true, hover, style, onClick }) => (
  <div
    className={`card ${pad ? 'card-p' : ''} ${hover ? 'card-hover' : ''} ${className}`}
    style={style}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, color = 'gray', dot }) => (
  <span className={`badge badge-${color}`}>
    {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
    {children}
  </span>
);

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef(({
  label, error, prefix, suffix, className = '', ...props
}, ref) => (
  <div className={`w-full ${className}`}>
    {label && <label className="input-label">{label}</label>}
    <div className="relative">
      {prefix && (
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--c-text-3)', fontSize: 12, fontWeight: 600, pointerEvents: 'none',
        }}>{prefix}</span>
      )}
      <input
        ref={ref}
        className={`input ${error ? 'input-error' : ''} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
        {...props}
      />
      {suffix && (
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--c-text-3)', fontSize: 12, fontWeight: 600, pointerEvents: 'none',
        }}>{suffix}</span>
      )}
    </div>
    {error && <p style={{ fontSize: 11, color: 'var(--c-danger)', marginTop: 3 }}>{error}</p>}
  </div>
));

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = ({ label, children, className = '', ...props }) => (
  <div className={`w-full ${className}`}>
    {label && <label className="input-label">{label}</label>}
    <select className="input select" {...props}>{children}</select>
  </div>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spinOnce 0.7s linear infinite' }}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="48" strokeDashoffset="36" />
  </svg>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width = 440, footer }) => {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-sheet anim-up" style={{ maxWidth: width }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--c-border-light)', flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="scroll" style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
        {/* Footer */}
        {footer && <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border-light)', flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
};

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--c-border-light)' }} />
    {label && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: 'var(--c-border-light)' }} />
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
export const Empty = ({ icon = '📭', title = 'Nothing here', subtitle, action }) => (
  <div style={{ textAlign: 'center', padding: '36px 20px' }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)', margin: '0 0 4px' }}>{title}</p>
    {subtitle && <p style={{ fontSize: 11, color: 'var(--c-text-4)', margin: '0 0 12px' }}>{subtitle}</p>}
    {action}
  </div>
);
