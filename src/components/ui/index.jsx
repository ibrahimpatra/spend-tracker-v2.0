// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — components/ui/index.jsx
// Complete iOS design system. Every visual primitive lives here.
// Import what you need: import { Card, BottomSheet, CurrencyDisplay } from '../ui'
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM } from '../../constants';
import { formatAmount, formatWithSymbol } from '../../utils/currency';

// ─── Icon helper ──────────────────────────────────────────────────────────────
// Renders any Lucide icon by string name. Falls back to a dot if not found.
export const Icon = ({ name, size = 20, color = COLORS.labelSecondary, strokeWidth = 1.75, style, ...props }) => {
  const LucideIcon = LucideIcons[name];
  if (!LucideIcon) return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', ...style }} />
  );
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} style={style} {...props} />;
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24, color = COLORS.blue }) => (
  <div style={{
    width: size, height: size,
    border: `2.5px solid ${color}22`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'mv6-spin 0.7s linear infinite',
  }} />
);

// ─── Separator ────────────────────────────────────────────────────────────────
export const Separator = ({ indent = 0, style }) => (
  <div style={{
    height: '0.5px',
    background: COLORS.separatorOpaque,
    marginLeft: indent,
    ...style,
  }} />
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = COLORS.blue, bg, style }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: RADIUS.full,
    background: bg || `${color}18`,
    color: color,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    fontFamily: FONT.family,
    ...style,
  }}>
    {label}
  </span>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, padding = SPACE.lg, radius = RADIUS.xl, shadow = SHADOW.sm }) => (
  <div style={{
    background: COLORS.surface,
    borderRadius: radius,
    boxShadow: shadow,
    overflow: 'hidden',
    ...( padding !== false ? { padding } : {} ),
    ...style,
  }}>
    {children}
  </div>
);

// ─── Inset grouped card (iOS Settings style) ──────────────────────────────────
export const InsetCard = ({ children, style }) => (
  <div style={{
    background: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    boxShadow: SHADOW.sm,
    ...style,
  }}>
    {children}
  </div>
);

// ─── List Item (iOS Settings row) ─────────────────────────────────────────────
export const ListItem = ({
  icon, iconColor = COLORS.blue, iconBg,
  title, subtitle, right, rightLabel, rightColor,
  onPress, disabled, showChevron = true, last = false,
  style,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <>
      <div
        onMouseDown={() => onPress && setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => onPress && setPressed(true)}
        onTouchEnd={() => { setPressed(false); onPress?.(); }}
        onClick={onPress}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: `${SPACE.md}px ${SPACE.lg}px`,
          background: pressed ? COLORS.fillTertiary : 'transparent',
          cursor: onPress ? 'pointer' : 'default',
          transition: `background ${ANIM.fast}ms`,
          opacity: disabled ? 0.45 : 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
      >
        {/* Icon blob */}
        {icon && (
          <div style={{
            width: 32, height: 32,
            borderRadius: RADIUS.md,
            background: iconBg || `${iconColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name={icon} size={17} color={iconColor} strokeWidth={2} />
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: FONT.callout.size,
            fontWeight: FONT.medium,
            color: COLORS.labelPrimary,
            fontFamily: FONT.family,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: FONT.footnote.size,
              color: COLORS.labelSecondary,
              fontFamily: FONT.family,
              marginTop: 1,
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Right side */}
        {right || (rightLabel && (
          <span style={{
            fontSize: FONT.callout.size,
            color: rightColor || COLORS.labelSecondary,
            fontFamily: FONT.family,
            fontWeight: FONT.medium,
            flexShrink: 0,
          }}>
            {rightLabel}
          </span>
        ))}

        {showChevron && onPress && (
          <Icon name="ChevronRight" size={16} color={COLORS.labelTertiary} strokeWidth={2.5} />
        )}
      </div>
      {!last && <Separator indent={icon ? 60 : 16} />}
    </>
  );
};

// ─── Section Header (iOS grouped table style) ─────────────────────────────────
export const SectionHeader = ({ title, action, actionLabel, style }) => (
  <div style={{
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.xs}px`,
    ...style,
  }}>
    <span style={{
      fontSize: FONT.footnote.size,
      fontWeight: FONT.semibold,
      color: COLORS.labelSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      fontFamily: FONT.family,
    }}>
      {title}
    </span>
    {action && (
      <button
        onClick={action}
        style={{
          fontSize: FONT.subheadline.size,
          color: COLORS.blue,
          fontWeight: FONT.regular,
          fontFamily: FONT.family,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {actionLabel || 'See All'}
      </button>
    )}
  </div>
);

// ─── Currency Display ─────────────────────────────────────────────────────────
// Core component for showing financial amounts. Never mixes currencies.
export const CurrencyDisplay = ({
  amount, currency,
  size = 'md',          // 'sm' | 'md' | 'lg' | 'hero'
  type,                 // 'income' | 'expense' | 'transfer' | undefined
  showSign = false,
  showCode = true,
  style,
}) => {
  const colorMap = {
    income:   COLORS.income,
    expense:  COLORS.expense,
    transfer: COLORS.transfer,
  };
  const color = colorMap[type] || COLORS.labelPrimary;
  const sign  = showSign ? (type === 'income' ? '+' : type === 'expense' ? '−' : '') : '';

  const sizeMap = {
    sm:   { amount: '15px', code: '10px', weight: 600 },
    md:   { amount: '17px', code: '11px', weight: 700 },
    lg:   { amount: '24px', code: '13px', weight: 700 },
    hero: { amount: '40px', code: '15px', weight: 700 },
  };
  const sz = sizeMap[size] || sizeMap.md;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, ...style }}>
      <span style={{
        fontSize: sz.amount,
        fontWeight: sz.weight,
        color,
        fontFamily: FONT.family,
        letterSpacing: size === 'hero' ? '-1px' : '-0.3px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {sign}{formatAmount(amount, currency)}
      </span>
      {showCode && (
        <span style={{
          fontSize: sz.code,
          fontWeight: 600,
          color: type ? `${color}99` : COLORS.labelTertiary,
          fontFamily: FONT.family,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {currency}
        </span>
      )}
    </div>
  );
};

// ─── Multi-currency stat row ───────────────────────────────────────────────────
// Shows income / expense / net for ONE currency. Use multiple for multiple currencies.
export const CurrencyStatRow = ({ currency, income, expense, net, style }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.lg,
    ...style,
  }}>
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      color: COLORS.labelTertiary,
      fontFamily: FONT.family,
      letterSpacing: '0.8px',
      minWidth: 36,
    }}>
      {currency}
    </span>
    <div style={{ display: 'flex', gap: SPACE.xl, flex: 1 }}>
      <div>
        <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, fontWeight: 500, marginBottom: 1 }}>IN</div>
        <CurrencyDisplay amount={income} currency={currency} size="sm" type="income" showSign showCode={false} />
      </div>
      <div>
        <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, fontWeight: 500, marginBottom: 1 }}>OUT</div>
        <CurrencyDisplay amount={expense} currency={currency} size="sm" type="expense" showSign showCode={false} />
      </div>
      <div>
        <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, fontWeight: 500, marginBottom: 1 }}>NET</div>
        <CurrencyDisplay amount={Math.abs(net)} currency={currency} size="sm" type={net >= 0 ? 'income' : 'expense'} showSign showCode={false} />
      </div>
    </div>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max, color, height = 6, style, animated = true }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = color || (pct >= 100 ? COLORS.red : pct >= 80 ? COLORS.orange : COLORS.blue);

  return (
    <div style={{
      width: '100%',
      height,
      background: COLORS.fillTertiary,
      borderRadius: RADIUS.full,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: barColor,
        borderRadius: RADIUS.full,
        transition: animated ? `width 0.6s ${ANIM.spring}` : 'none',
      }} />
    </div>
  );
};

// ─── Pill Button ──────────────────────────────────────────────────────────────
export const PillButton = ({
  label, icon, onPress, active, disabled,
  variant = 'default', // 'default' | 'primary' | 'destructive' | 'ghost'
  size = 'md',
  style,
}) => {
  const [pressed, setPressed] = useState(false);

  const variantStyles = {
    default: {
      background: active ? COLORS.blue : COLORS.fillTertiary,
      color:      active ? '#fff' : COLORS.labelPrimary,
    },
    primary: {
      background: COLORS.blue,
      color: '#fff',
    },
    destructive: {
      background: active ? COLORS.red : `${COLORS.red}15`,
      color:      active ? '#fff' : COLORS.red,
    },
    ghost: {
      background: 'transparent',
      color: COLORS.blue,
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '13px', height: 30 },
    md: { padding: '8px 16px', fontSize: '14px', height: 36 },
    lg: { padding: '12px 22px', fontSize: '16px', height: 46 },
  };

  const vs = variantStyles[variant] || variantStyles.default;
  const ss = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      onClick={!disabled ? onPress : undefined}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => { setPressed(false); !disabled && onPress?.(); }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: RADIUS.full,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: FONT.family,
        fontWeight: FONT.semibold,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        opacity: disabled ? 0.45 : 1,
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: `transform ${ANIM.fast}ms ${ANIM.spring}, background ${ANIM.fast}ms`,
        ...vs,
        ...ss,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={parseInt(ss.fontSize) - 1} color={vs.color} strokeWidth={2} />}
      {label}
    </button>
  );
};

// ─── Icon Button ──────────────────────────────────────────────────────────────
export const IconButton = ({ icon, onPress, size = 36, color = COLORS.labelSecondary, bg = COLORS.fillTertiary, style }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: size, height: size,
        borderRadius: RADIUS.full,
        background: bg,
        border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        transition: `transform ${ANIM.fast}ms ${ANIM.spring}`,
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon name={icon} size={size * 0.45} color={color} strokeWidth={2} />
    </button>
  );
};

// ─── Segmented Control (iOS style) ────────────────────────────────────────────
export const SegmentedControl = ({ options, value, onChange, style }) => (
  <div style={{
    display: 'flex',
    background: COLORS.fillTertiary,
    borderRadius: RADIUS.lg,
    padding: 2,
    gap: 2,
    ...style,
  }}>
    {options.map(opt => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: RADIUS.md,
            border: 'none',
            background: active ? COLORS.surface : 'transparent',
            color: active ? COLORS.labelPrimary : COLORS.labelSecondary,
            fontSize: FONT.subheadline.size,
            fontWeight: active ? FONT.semibold : FONT.regular,
            fontFamily: FONT.family,
            cursor: 'pointer',
            transition: `all ${ANIM.fast}ms ${ANIM.ease}`,
            boxShadow: active ? SHADOW.sm : 'none',
            whiteSpace: 'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ─── Text Input (iOS style) ────────────────────────────────────────────────────
export const TextInput = React.forwardRef(({
  label, placeholder, value, onChange, type = 'text',
  error, hint, icon, rightElement, disabled, style, inputStyle,
  ...rest
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{
          fontSize: FONT.footnote.size,
          fontWeight: FONT.semibold,
          color: focused ? COLORS.blue : COLORS.labelSecondary,
          fontFamily: FONT.family,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          transition: `color ${ANIM.fast}ms`,
        }}>
          {label}
        </label>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACE.sm,
        background: COLORS.fillTertiary,
        borderRadius: RADIUS.lg,
        border: `1.5px solid ${error ? COLORS.red : focused ? COLORS.blue : 'transparent'}`,
        padding: `${SPACE.md}px ${SPACE.md}px`,
        transition: `border-color ${ANIM.fast}ms`,
      }}>
        {icon && <Icon name={icon} size={18} color={focused ? COLORS.blue : COLORS.labelTertiary} />}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: FONT.callout.size,
            fontWeight: FONT.regular,
            color: COLORS.labelPrimary,
            fontFamily: FONT.family,
            '::placeholder': { color: COLORS.labelTertiary },
            ...inputStyle,
          }}
          {...rest}
        />
        {rightElement}
      </div>
      {(error || hint) && (
        <span style={{
          fontSize: FONT.caption1.size,
          color: error ? COLORS.red : COLORS.labelTertiary,
          fontFamily: FONT.family,
          paddingLeft: 4,
        }}>
          {error || hint}
        </span>
      )}
    </div>
  );
});

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
export const BottomSheet = ({
  open, onClose, children,
  title, height = 'auto',      // 'auto' | 'full' | px number
  showHandle = true,
  closeOnBackdrop = true,
  style,
}) => {
  const [visible, setVisible] = useState(open);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), ANIM.slow);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!visible) return null;

  const sheetHeight = height === 'full' ? '92vh'
    : height === 'auto' ? 'auto'
    : `${height}px`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'flex-end',
    }}>
      {/* Backdrop */}
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: animate ? 1 : 0,
          transition: `opacity ${ANIM.slow}ms ${ANIM.ease}`,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 560,
        margin: '0 auto',
        background: COLORS.bgPrimary,
        borderRadius: `${RADIUS.xxl}px ${RADIUS.xxl}px 0 0`,
        maxHeight: '92vh',
        height: sheetHeight,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transform: animate ? 'translateY(0)' : 'translateY(100%)',
        transition: `transform ${ANIM.slow}ms ${ANIM.spring}`,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        ...style,
      }}>
        {/* Handle */}
        {showHandle && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            paddingTop: 12, paddingBottom: 4, flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 4,
              background: COLORS.fillPrimary,
              borderRadius: RADIUS.full,
            }} />
          </div>
        )}

        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.md}px`,
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: FONT.headline.size,
              fontWeight: FONT.semibold,
              color: COLORS.labelPrimary,
              fontFamily: FONT.family,
            }}>
              {title}
            </span>
            <IconButton icon="X" onPress={onClose} size={30} />
          </div>
        )}

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Alert Dialog (iOS style) ─────────────────────────────────────────────────
export const AlertDialog = ({
  open, onClose,
  title, message,
  confirmLabel = 'Confirm', confirmDestructive = false,
  cancelLabel  = 'Cancel',
  onConfirm,
}) => {
  const [visible, setVisible] = useState(open);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), ANIM.normal);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: SPACE.xl,
    }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: animate ? 1 : 0,
          transition: `opacity ${ANIM.normal}ms`,
        }}
      />
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRadius: RADIUS.xxl,
        width: '100%',
        maxWidth: 300,
        overflow: 'hidden',
        transform: animate ? 'scale(1)' : 'scale(0.85)',
        opacity: animate ? 1 : 0,
        transition: `transform ${ANIM.normal}ms ${ANIM.spring}, opacity ${ANIM.normal}ms`,
        boxShadow: SHADOW.xl,
      }}>
        <div style={{ padding: `${SPACE.xl}px ${SPACE.xl}px ${SPACE.lg}px`, textAlign: 'center' }}>
          <div style={{
            fontSize: FONT.headline.size,
            fontWeight: FONT.semibold,
            color: COLORS.labelPrimary,
            fontFamily: FONT.family,
            marginBottom: 6,
          }}>
            {title}
          </div>
          {message && (
            <div style={{
              fontSize: FONT.subheadline.size,
              color: COLORS.labelSecondary,
              fontFamily: FONT.family,
              lineHeight: '1.5',
            }}>
              {message}
            </div>
          )}
        </div>

        <Separator />
        <div style={{ display: 'flex' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: `${SPACE.md}px`, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: FONT.callout.size, fontWeight: FONT.regular,
              color: COLORS.blue, fontFamily: FONT.family,
            }}
          >
            {cancelLabel}
          </button>
          <div style={{ width: '0.5px', background: COLORS.separatorOpaque }} />
          <button
            onClick={() => { onConfirm?.(); onClose?.(); }}
            style={{
              flex: 1, padding: `${SPACE.md}px`, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: FONT.callout.size, fontWeight: FONT.semibold,
              color: confirmDestructive ? COLORS.red : COLORS.blue,
              fontFamily: FONT.family,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page Header (with optional back button) ──────────────────────────────────
export const PageHeader = ({ title, subtitle, backHref, action, style }) => (
  <div style={{
    padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.md}px`,
    ...style,
  }}>
    {backHref && (
      <a
        href={backHref}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: COLORS.blue,
          fontSize: FONT.callout.size,
          fontFamily: FONT.family,
          textDecoration: 'none',
          marginBottom: SPACE.sm,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Icon name="ChevronLeft" size={20} color={COLORS.blue} strokeWidth={2.5} />
        Back
      </a>
    )}
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{
          margin: 0,
          fontSize: FONT.largeTitle.size,
          fontWeight: FONT.bold,
          color: COLORS.labelPrimary,
          fontFamily: FONT.family,
          letterSpacing: FONT.largeTitle.letterSpacing,
          lineHeight: FONT.largeTitle.lineHeight,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            margin: '4px 0 0',
            fontSize: FONT.subheadline.size,
            color: COLORS.labelSecondary,
            fontFamily: FONT.family,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = 'Inbox', title, message, action, actionLabel, style }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: SPACE.md,
    padding: `${SPACE.xxxl * 2}px ${SPACE.xl}px`,
    textAlign: 'center',
    ...style,
  }}>
    <div style={{
      width: 64, height: 64,
      borderRadius: RADIUS.xxl,
      background: COLORS.fillTertiary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: SPACE.xs,
    }}>
      <Icon name={icon} size={28} color={COLORS.labelTertiary} strokeWidth={1.5} />
    </div>
    <div style={{
      fontSize: FONT.headline.size, fontWeight: FONT.semibold,
      color: COLORS.labelPrimary, fontFamily: FONT.family,
    }}>
      {title}
    </div>
    {message && (
      <div style={{
        fontSize: FONT.subheadline.size, color: COLORS.labelSecondary,
        fontFamily: FONT.family, maxWidth: 260, lineHeight: 1.5,
      }}>
        {message}
      </div>
    )}
    {action && (
      <PillButton label={actionLabel || 'Get Started'} onPress={action} variant="primary" size="md" style={{ marginTop: SPACE.sm }} />
    )}
  </div>
);

// ─── Transaction Icon ─────────────────────────────────────────────────────────
export const TxIcon = ({ type, category, size = 40 }) => {
  const isTransfer = ['transfer','out_transfer','in_transfer'].includes(type);
  const isIncome   = type === 'income' || type === 'in_transfer';
  const bg = isTransfer ? COLORS.transfer
    : category?.color || (isIncome ? COLORS.income : COLORS.expense);
  const icon = isTransfer ? 'ArrowLeftRight'
    : category?.icon || (isIncome ? 'TrendingUp' : 'TrendingDown');

  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.28,
      background: `${bg}20`,
      border: `1.5px solid ${bg}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon name={icon} size={size * 0.45} color={bg} strokeWidth={2} />
    </div>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
export const Skeleton = ({ width = '100%', height = 16, radius = RADIUS.sm, style }) => (
  <div style={{
    width, height,
    borderRadius: radius,
    background: `linear-gradient(90deg, ${COLORS.fillTertiary} 25%, ${COLORS.fillSecondary} 50%, ${COLORS.fillTertiary} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'mv6-shimmer 1.4s ease-in-out infinite',
    ...style,
  }} />
);

// ─── Global CSS keyframes ─────────────────────────────────────────────────────
// Inject once into the document
const CSS_INJECTED = { done: false };
export const injectGlobalCSS = () => {
  if (CSS_INJECTED.done || typeof document === 'undefined') return;
  CSS_INJECTED.done = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes mv6-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes mv6-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    @keyframes mv6-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
    @keyframes mv6-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    body { margin: 0; background: #F2F2F7; }
    input, button, select, textarea { font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Helvetica Neue', sans-serif; }
    ::-webkit-scrollbar { width: 0; background: transparent; }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
  `;
  document.head.appendChild(style);
};