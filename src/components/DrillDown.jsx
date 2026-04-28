// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — components/DrillDown.jsx
// Full-screen slide-in panel (iOS navigation style).
// Triggered from Dashboard, Records, Accounts, Categories — anywhere.
// Supports: category | account | month | type (income/expense) contexts.
// Uses React Portal so it renders above everything including the nav pill.
//
// Usage:
//   import { useDrillDown } from './DrillDown';
//   const { openDrill, DrillDownPortal } = useDrillDown();
//   openDrill({ type: 'category', label: 'Food', catObj: cat, txns: [...], allExp: [...], cats, accounts });
//   return <>{...page...}<DrillDownPortal /></>
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, CHART_PALETTE } from '../constants';
import { formatAmount, calcStatsByCurrency, isIncomeType, isExpenseType } from '../utils/currency';
import { Icon, TxIcon, Skeleton } from './ui';

// ─── Inject DrillDown slide animation once ────────────────────────────────────
let ANIM_INJECTED = false;
const injectDrillAnim = () => {
  if (ANIM_INJECTED || typeof document === 'undefined') return;
  ANIM_INJECTED = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes mv6-slide-right {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes mv6-slide-right-out {
      from { transform: translateX(0);    opacity: 1; }
      to   { transform: translateX(100%); opacity: 0; }
    }
    .mv6-drill-enter { animation: mv6-slide-right ${ANIM.slow}ms ${ANIM.spring} both; }
    .mv6-drill-exit  { animation: mv6-slide-right-out ${ANIM.normal}ms ${ANIM.ease} both; }
  `;
  document.head.appendChild(s);
};

// ─── Dark frosted tooltip ─────────────────────────────────────────────────────
function ChartTip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(28,28,30,0.94)', backdropFilter: 'blur(12px)',
      borderRadius: RADIUS.lg, padding: '9px 13px', boxShadow: SHADOW.lg,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      {label && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: FONT.family, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '12px', fontWeight: 600, color: p.color || '#fff', fontFamily: FONT.family }}>
          {p.name}: {typeof p.value === 'number' ? formatAmount(p.value, currency || '') : p.value}
        </div>
      ))}
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ t, categories, accounts, index }) {
  const [pressed, setPressed] = useState(false);
  const cat   = categories?.find(c => c.id === t.categoryId);
  const acc   = accounts?.find(a => a.id === t.accountId);
  const isInc = isIncomeType(t.type);
  const isTx  = ['transfer','out_transfer','in_transfer'].includes(t.type);

  return (
    <button
      onClick={() => window.__mv6_openAdd?.(t)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md,
        padding: `${SPACE.md}px ${SPACE.lg}px`,
        background: pressed ? COLORS.fillTertiary : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: `background ${ANIM.fast}ms`,
        WebkitTapHighlightColor: 'transparent',
        animation: `mv6-fade-in ${ANIM.normal}ms ease ${Math.min(index * 25, 300)}ms both`,
      }}
    >
      <TxIcon type={t.type} category={cat} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: FONT.callout.size, fontWeight: FONT.medium,
          color: COLORS.labelPrimary, fontFamily: FONT.family,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t.note || cat?.name || (isTx ? 'Transfer' : 'Transaction')}
        </div>
        <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, marginTop: 2, display: 'flex', gap: 4 }}>
          <span>{t.dateObj?.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          {acc && <><span>·</span><span style={{ textTransform: 'uppercase', fontSize: '10px' }}>{acc.name}</span></>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: FONT.callout.size, fontWeight: FONT.bold,
          color: isInc ? COLORS.income : isTx ? COLORS.transfer : COLORS.labelPrimary,
          fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
        }}>
          {isInc ? '+' : isTx ? '' : '−'}{formatAmount(t.amount, t.currency)}
        </div>
        <div style={{ fontSize: '10px', color: COLORS.labelQuaternary, fontFamily: FONT.family, letterSpacing: '0.5px', marginTop: 1 }}>{t.currency}</div>
      </div>
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Sec({ title, children }) {
  return (
    <div style={{ marginBottom: SPACE.md }}>
      {title && (
        <div style={{
          fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
          color: COLORS.labelSecondary, textTransform: 'uppercase',
          letterSpacing: '0.8px', fontFamily: FONT.family,
          padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
        }}>
          {title}
        </div>
      )}
      <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
        {children}
      </div>
    </div>
  );
}

// ─── Stats grid ───────────────────────────────────────────────────────────────
function StatsGrid({ items }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 1, background: COLORS.separatorOpaque,
      borderRadius: RADIUS.xl, overflow: 'hidden',
      marginBottom: SPACE.md, boxShadow: SHADOW.sm,
    }}>
      {items.map((s, i) => (
        <div key={i} style={{
          padding: `${SPACE.md}px ${SPACE.sm}px`,
          textAlign: 'center',
          background: COLORS.surface,
        }}>
          <div style={{ fontSize: '10px', fontWeight: FONT.semibold, color: COLORS.labelTertiary, textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: FONT.family, marginBottom: 4 }}>
            {s.label}
          </div>
          <div style={{
            fontSize: '14px', fontWeight: 700,
            color: s.color || COLORS.labelPrimary,
            fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Category drill content ────────────────────────────────────────────────────
function CatDrill({ txns, catObj, allExp, currency }) {
  const daily = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj?.toLocaleDateString('default', { month: 'short', day: 'numeric' }) || '';
      if (!m[k]) m[k] = { label: k, amount: 0, _d: t.dateObj };
      m[k].amount += t.amount || 0;
    });
    return Object.values(m).sort((a, b) => a._d - b._d);
  }, [txns]);

  const total    = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalAll = allExp.reduce((s, t) => s + (t.amount || 0), 0);
  const pct      = totalAll > 0 ? ((total / totalAll) * 100).toFixed(1) : 0;
  const avg      = txns.length > 0 ? total / txns.length : 0;

  return (
    <>
      <StatsGrid items={[
        { label: 'Total Spent',    value: `${currency} ${formatAmount(total, currency)}`,    color: COLORS.expense },
        { label: '% of Expenses',  value: `${pct}%`,                                         color: COLORS.blue    },
        { label: 'Avg / Txn',      value: `${currency} ${formatAmount(avg, currency)}`,      color: COLORS.labelSecondary },
      ]} />
      {daily.length > 1 && (
        <Sec title="Daily Spending">
          <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px`, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="catDrillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={catObj?.color || COLORS.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={catObj?.color || COLORS.blue} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.separatorOpaque} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} tickFormatter={v => formatAmount(v, currency)} />
                <Tooltip content={<ChartTip currency={currency} />} />
                <Area type="monotone" dataKey="amount" name="Spent" stroke={catObj?.color || COLORS.blue} strokeWidth={2.5} fill="url(#catDrillGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
    </>
  );
}

// ─── Account drill content ────────────────────────────────────────────────────
function AccDrill({ txns, accObj, currency }) {
  const totalIn  = txns.filter(t => isIncomeType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = txns.filter(t => isExpenseType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);

  const runBal = useMemo(() => {
    let bal = accObj?.balance || 0;
    // Walk back to opening
    const sorted = [...txns].sort((a, b) => b.dateObj - a.dateObj);
    sorted.forEach(t => {
      if (isIncomeType(t.type))       bal -= t.amount || 0;
      else if (isExpenseType(t.type)) bal += t.amount || 0;
    });
    // Walk forward
    const fwd = [...txns].sort((a, b) => a.dateObj - b.dateObj);
    const data = [{ label: 'Start', balance: parseFloat(bal.toFixed(3)) }];
    fwd.forEach(t => {
      if (isIncomeType(t.type))       bal += t.amount || 0;
      else if (isExpenseType(t.type)) bal -= t.amount || 0;
      data.push({
        label: t.dateObj?.toLocaleDateString('default', { month: 'short', day: 'numeric' }) || '',
        balance: parseFloat(bal.toFixed(3)),
      });
    });
    return data;
  }, [txns, accObj]);

  const monthly = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj?.toLocaleString('default', { month: 'short', year: '2-digit' }) || '';
      if (!m[k]) m[k] = { label: k, income: 0, expense: 0, _d: t.dateObj };
      if (isIncomeType(t.type))       m[k].income  += t.amount || 0;
      else if (isExpenseType(t.type)) m[k].expense += t.amount || 0;
    });
    return Object.values(m).sort((a, b) => a._d - b._d);
  }, [txns]);

  return (
    <>
      <StatsGrid items={[
        { label: 'Balance',  value: `${currency} ${formatAmount(accObj?.balance || 0, currency)}`, color: (accObj?.balance || 0) >= 0 ? COLORS.blue : COLORS.red },
        { label: 'Total In', value: `${currency} ${formatAmount(totalIn, currency)}`,  color: COLORS.income  },
        { label: 'Total Out',value: `${currency} ${formatAmount(totalOut, currency)}`, color: COLORS.expense },
      ]} />
      {runBal.length > 2 && (
        <Sec title="Running Balance">
          <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px`, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runBal} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.separatorOpaque} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} tickFormatter={v => formatAmount(v, currency)} />
                <Tooltip content={<ChartTip currency={currency} />} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke={accObj?.color || COLORS.blue} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
      {monthly.length > 0 && (
        <Sec title="Monthly Flow">
          <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px`, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.separatorOpaque} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} />
                <Tooltip content={<ChartTip currency={currency} />} />
                <Bar dataKey="income"  name="Income"  fill={COLORS.income}  radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Expense" fill={COLORS.expense} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
    </>
  );
}

// ─── Month drill content ──────────────────────────────────────────────────────
function MonthDrill({ txns, categories, currency }) {
  const catBreak = useMemo(() => {
    const m = {};
    txns.filter(t => isExpenseType(t.type)).forEach(t => {
      const cat = categories?.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Uncategorized';
      const color = cat?.color || COLORS.neutral;
      if (!m[name]) m[name] = { name, value: 0, color };
      m[name].value += t.amount || 0;
    });
    return Object.values(m).sort((a, b) => b.value - a.value);
  }, [txns, categories]);

  const daily = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj?.getDate().toString() || '';
      if (!m[k]) m[k] = { label: k, income: 0, expense: 0, _d: t.dateObj };
      if (isIncomeType(t.type))       m[k].income  += t.amount || 0;
      else if (isExpenseType(t.type)) m[k].expense += t.amount || 0;
    });
    return Object.values(m).sort((a, b) => parseInt(a.label) - parseInt(b.label));
  }, [txns]);

  const totalIn  = txns.filter(t => isIncomeType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = txns.filter(t => isExpenseType(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalAll = catBreak.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <StatsGrid items={[
        { label: 'Income',  value: `${currency} ${formatAmount(totalIn, currency)}`,          color: COLORS.income  },
        { label: 'Expenses',value: `${currency} ${formatAmount(totalOut, currency)}`,         color: COLORS.expense },
        { label: 'Net',     value: `${currency} ${formatAmount(Math.abs(totalIn - totalOut), currency)}`, color: (totalIn - totalOut) >= 0 ? COLORS.income : COLORS.expense },
      ]} />

      {catBreak.length > 0 && (
        <Sec title="Spending Breakdown">
          <div style={{ padding: SPACE.lg, display: 'flex', alignItems: 'center', gap: SPACE.lg }}>
            <div style={{ width: 110, height: 110, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catBreak} dataKey="value" innerRadius={32} outerRadius={50} paddingAngle={3} startAngle={90} endAngle={-270}>
                    {catBreak.map((d, i) => <Cell key={i} fill={d.color || CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catBreak.slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color || CHART_PALETTE[i % CHART_PALETTE.length], flexShrink: 0 }} />
                  <span style={{ fontSize: FONT.footnote.size, color: COLORS.labelSecondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT.family }}>{d.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: FONT.semibold, color: COLORS.labelTertiary, fontFamily: FONT.family, flexShrink: 0 }}>
                    {totalAll > 0 ? `${((d.value / totalAll) * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Sec>
      )}

      {daily.length > 1 && (
        <Sec title="Daily Cash Flow">
          <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px`, height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.separatorOpaque} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} />
                <Tooltip content={<ChartTip currency={currency} />} />
                <Bar dataKey="income"  name="Income"  fill={COLORS.income}  radius={[3,3,0,0]} />
                <Bar dataKey="expense" name="Expense" fill={COLORS.expense} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
    </>
  );
}

// ─── Type drill (income / expense period summary) ──────────────────────────────
function TypeDrill({ txns, categories, currency, accentColor }) {
  const monthly = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj?.toLocaleString('default', { month: 'short', year: '2-digit' }) || '';
      if (!m[k]) m[k] = { label: k, amount: 0, _d: t.dateObj };
      m[k].amount += t.amount || 0;
    });
    return Object.values(m).sort((a, b) => a._d - b._d);
  }, [txns]);

  const catBreak = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const cat = categories?.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Uncategorized';
      const color = cat?.color || COLORS.neutral;
      if (!m[name]) m[name] = { name, value: 0, color };
      m[name].value += t.amount || 0;
    });
    return Object.values(m).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [txns, categories]);

  const max = catBreak[0]?.value || 1;

  return (
    <>
      {monthly.length > 1 && (
        <Sec title="Monthly Trend">
          <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px`, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="typeDrillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.separatorOpaque} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.labelTertiary, fontSize: 9, fontFamily: FONT.family }} tickFormatter={v => formatAmount(v, currency)} />
                <Tooltip content={<ChartTip currency={currency} />} />
                <Area type="monotone" dataKey="amount" name="Amount" stroke={accentColor} strokeWidth={2.5} fill="url(#typeDrillGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Sec>
      )}
      {catBreak.length > 0 && (
        <Sec title="Top Categories">
          <div style={{ padding: `${SPACE.sm}px 0` }}>
            {catBreak.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.sm}px ${SPACE.lg}px` }}>
                <div style={{ width: 30, height: 30, borderRadius: RADIUS.md, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: FONT.subheadline.size, color: COLORS.labelPrimary, fontFamily: FONT.family, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{c.name}</span>
                    <span style={{ fontSize: FONT.subheadline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(c.value, currency)}</span>
                  </div>
                  <div style={{ height: 4, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.value / max) * 100}%`, background: c.color, borderRadius: RADIUS.full, transition: `width 0.7s ${ANIM.spring}` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Sec>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRILL DOWN PANEL
// ─────────────────────────────────────────────────────────────────────────────
function DrillDownPanel({ ctx, onClose }) {
  const [search,  setSearch]  = useState('');
  const [exiting, setExiting] = useState(false);

  useEffect(() => { injectDrillAnim(); }, []);

  // Hardware back button (Android) / escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'Back') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, ANIM.normal);
  }, [onClose]);

  if (!ctx) return null;

  const { type, label, color = COLORS.blue, txns = [], allExp = [], categories = [], accounts = [], accObj, catObj } = ctx;

  const total    = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const currency = txns[0]?.currency || '';

  const filtered = useMemo(() => {
    if (!search.trim()) return txns;
    const term = search.toLowerCase();
    return txns.filter(t =>
      (t.note && t.note.toLowerCase().includes(term)) ||
      String(t.amount).includes(term) ||
      (categories.find(c => c.id === t.categoryId)?.name || '').toLowerCase().includes(term)
    );
  }, [txns, search, categories]);

  const accentColor = type === 'income' ? COLORS.income : type === 'expense' ? COLORS.expense : color;

  return createPortal(
    <div
      className={exiting ? 'mv6-drill-exit' : 'mv6-drill-enter'}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: COLORS.bgPrimary,
        display: 'flex', flexDirection: 'column',
        overflowY: 'hidden',
        fontFamily: FONT.family,
      }}
    >
      {/* ── iOS-style nav bar ───────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(242,242,247,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `0.5px solid ${COLORS.separatorOpaque}`,
        padding: `0 ${SPACE.lg}px`,
        display: 'flex', alignItems: 'center',
        height: 52, flexShrink: 0,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <button
          onClick={handleClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            color: COLORS.blue, fontSize: FONT.callout.size,
            fontWeight: FONT.regular, fontFamily: FONT.family,
            padding: '4px 0', marginRight: 'auto',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="ChevronLeft" size={20} color={COLORS.blue} strokeWidth={2.5} />
          Back
        </button>

        <span style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontSize: FONT.headline.size, fontWeight: FONT.semibold,
          color: COLORS.labelPrimary, fontFamily: FONT.family,
          maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ padding: `${SPACE.lg}px ${SPACE.lg}px`, maxWidth: 560, margin: '0 auto' }}>

          {/* Hero card */}
          <div style={{
            background: `linear-gradient(145deg, ${accentColor}EE, ${accentColor}88)`,
            borderRadius: RADIUS.xxl, padding: SPACE.xl,
            marginBottom: SPACE.lg,
            position: 'relative', overflow: 'hidden',
            boxShadow: `0 8px 32px ${accentColor}44`,
            animation: `mv6-fade-in ${ANIM.normal}ms ease both`,
          }}>
            <div style={{ position: 'absolute', top: -25, right: -25, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{
              fontSize: '11px', fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '1px', textTransform: 'uppercase',
              marginBottom: SPACE.sm,
            }}>
              {type === 'account'  ? 'Account Balance'
               : type === 'category' ? 'Category Total'
               : type === 'month'    ? 'Month Total'
               : type === 'income'   ? 'Period Income'
               : 'Period Expenses'}
            </div>
            <div style={{
              fontSize: '36px', fontWeight: 700, color: '#fff',
              letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1, marginBottom: SPACE.sm,
            }}>
              {currency} {formatAmount(total, currency)}
            </div>
            <div style={{ fontSize: FONT.subheadline.size, color: 'rgba(255,255,255,0.6)' }}>
              {txns.length} transaction{txns.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Context-specific charts */}
          {type === 'category' && <CatDrill txns={txns} catObj={catObj} allExp={allExp} currency={currency} />}
          {type === 'account'  && <AccDrill txns={txns} accObj={accObj} currency={currency} />}
          {type === 'month'    && <MonthDrill txns={txns} categories={categories} currency={currency} />}
          {(type === 'income' || type === 'expense') && <TypeDrill txns={txns} categories={categories} currency={currency} accentColor={accentColor} />}

          {/* Transaction search + list */}
          <Sec title={`Transactions (${filtered.length})`}>
            {/* Search */}
            <div style={{ padding: `${SPACE.sm}px ${SPACE.md}px`, borderBottom: `0.5px solid ${COLORS.separatorOpaque}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, background: COLORS.bgPrimary, borderRadius: RADIUS.lg, padding: `0 ${SPACE.md}px` }}>
                <Icon name="Search" size={14} color={COLORS.labelTertiary} strokeWidth={2} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search transactions…"
                  style={{
                    flex: 1, border: 'none', background: 'transparent', outline: 'none',
                    padding: '9px 0',
                    fontSize: FONT.callout.size, color: COLORS.labelPrimary,
                    fontFamily: FONT.family,
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <Icon name="X" size={14} color={COLORS.labelTertiary} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: `${SPACE.xl}px`, textAlign: 'center', color: COLORS.labelTertiary, fontSize: FONT.footnote.size, fontFamily: FONT.family }}>
                No transactions found
              </div>
            ) : (
              filtered.map((t, i) => (
                <React.Fragment key={t.id}>
                  <TxRow t={t} categories={categories} accounts={accounts} index={i} />
                  {i < filtered.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 66 }} />}
                </React.Fragment>
              ))
            )}
          </Sec>

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDrillDown() {
  const [ctx, setCtx] = useState(null);

  const openDrill = useCallback((drillCtx) => {
    setCtx(drillCtx);
  }, []);

  const closeDrill = useCallback(() => {
    setCtx(null);
  }, []);

  const DrillDownPortal = useCallback(() => {
    if (!ctx) return null;
    return <DrillDownPanel ctx={ctx} onClose={closeDrill} />;
  }, [ctx, closeDrill]);

  return { openDrill, closeDrill, DrillDownPortal };
}

export default DrillDownPanel;