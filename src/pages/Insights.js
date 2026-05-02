// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Insights.jsx  (v2 — full analytics suite)
//
// 4 tabs:
//   Overview   — KPI tiles + spending donut + monthly bars + savings rate
//   Cashflow   — cumulative net + daily waterfall + balance trend
//   Categories — ranked breakdown + category vs avg + heatmap by day-of-week
//   Compare    — this period vs prior period, all metrics side-by-side
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ComposedChart,
} from 'recharts';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, CHART_PALETTE } from '../constants';
import { useFilter, getFilterLabel, getDateBounds } from '../context/FilterContext';
import { useCategories, useTransactions } from '../hooks/useData';
import {
  buildCategoryBreakdown, buildDailyTimeSeries, buildMonthlyTimeSeries,
  buildRunningBalance, formatAmount, calcStatsByCurrency, sortByDateDesc,
} from '../utils/currency';
import { Icon, SegmentedControl, Skeleton, EmptyState, PillButton } from '../components/ui';
import { openAddTransaction } from '../components/Layout';

// ─── safeDate ─────────────────────────────────────────────────────────────────
const safeDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d.toDate === 'function') return d.toDate();
  if (typeof d.seconds === 'number') return new Date(d.seconds * 1000);
  const p = new Date(d); return isNaN(p) ? new Date() : p;
};

// ─── Shared tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--mv6-surface-overlay, rgba(28,28,30,0.94))',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: RADIUS.lg, padding: '10px 14px', boxShadow: SHADOW.lg,
      border: '0.5px solid rgba(255,255,255,0.12)',
    }}>
      {label && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: FONT.family, marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontFamily: FONT.family, marginRight: 4 }}>{p.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: p.color || '#fff', fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
            {formatter ? formatter(p.value, p.name) : formatAmount(p.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({ title, subtitle, children, action, style }) {
  return (
    <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px`, ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: `0 ${SPACE.xs}px ${SPACE.xs}px` }}>
        <div>
          <span style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: FONT.family }}>{title}</span>
          {subtitle && <span style={{ fontSize: FONT.caption1.size, color: COLORS.labelQuaternary, fontFamily: FONT.family, marginLeft: 6 }}>{subtitle}</span>}
        </div>
        {action}
      </div>
      <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function KpiGrid({ stats, currency, savingsRate }) {
  const s = stats[currency] || { income: 0, expense: 0, net: 0, count: 0 };
  const items = [
    { label: 'Income',       value: formatAmount(s.income, currency),         color: COLORS.income,  icon: 'TrendingUp',   bg: `${COLORS.income}12`  },
    { label: 'Expenses',     value: formatAmount(s.expense, currency),         color: COLORS.expense, icon: 'TrendingDown', bg: `${COLORS.expense}12` },
    { label: 'Net',          value: `${s.net >= 0 ? '+' : '−'}${formatAmount(Math.abs(s.net), currency)}`, color: s.net >= 0 ? COLORS.income : COLORS.expense, icon: 'Activity', bg: `${COLORS.blue}12` },
    { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 20 ? COLORS.income : savingsRate >= 0 ? COLORS.orange : COLORS.expense, icon: 'PiggyBank', bg: `${COLORS.teal}12` },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.sm, margin: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ background: COLORS.surface, borderRadius: RADIUS.xl, padding: `${SPACE.md}px ${SPACE.lg}px`, boxShadow: SHADOW.sm, animation: `mv6-fade-in ${ANIM.normal}ms ease ${i * 60}ms both` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: RADIUS.md, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={item.icon} size={14} color={item.color} strokeWidth={2} />
            </div>
            <span style={{ fontSize: FONT.caption1.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{item.label}</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: item.color, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {item.value}
          </div>
          <div style={{ fontSize: '10px', color: COLORS.labelQuaternary, fontFamily: FONT.family, marginTop: 2 }}>{currency}</div>
        </div>
      ))}
    </div>
  );
}

function SpendingDonut({ breakdown, currency, onClickCategory }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const total = breakdown.reduce((s, b) => s + b.amount, 0);
  if (!breakdown.length) return <EmptyState icon="PieChart" title="No expenses" message="No expense categories for this period" style={{ padding: `${SPACE.xl}px` }} accentColor={COLORS.expense} />;
  return (
    <div style={{ padding: SPACE.lg }}>
      <div style={{ position: 'relative', height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={breakdown} cx="50%" cy="50%" innerRadius={68} outerRadius={92} paddingAngle={2} dataKey="amount"
              onMouseEnter={(_, idx) => setActiveIdx(idx)} onMouseLeave={() => setActiveIdx(null)}
              onClick={(_, idx) => onClickCategory?.(breakdown[idx]?.categoryId)}>
              {breakdown.map((entry, idx) => (
                <Cell key={entry.categoryId} fill={entry.color} opacity={activeIdx === null || activeIdx === idx ? 1 : 0.4}
                  stroke={activeIdx === idx ? entry.color : 'none'} strokeWidth={activeIdx === idx ? 2 : 0} />
              ))}
            </Pie>
            <PieTooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: 'var(--mv6-surface-overlay)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: RADIUS.lg, padding: '10px 14px', boxShadow: SHADOW.lg }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: d.color, fontFamily: FONT.family }}>{d.name}</div>
                  <div style={{ fontSize: '13px', color: '#fff', fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{formatAmount(d.amount, currency)}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: FONT.family }}>{d.percentage}% of total</div>
                </div>
              );
            }} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          {activeIdx !== null ? (
            <>
              <div style={{ fontSize: '15px', fontWeight: 700, color: breakdown[activeIdx]?.color, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(breakdown[activeIdx]?.amount, currency)}</div>
              <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>{breakdown[activeIdx]?.percentage}%</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.labelPrimary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(total, currency)}</div>
              <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>total spent</div>
            </>
          )}
        </div>
      </div>
      {/* Ranked legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: SPACE.md }}>
        {breakdown.slice(0, 6).map((b, i) => (
          <button key={b.categoryId} onClick={() => onClickCategory?.(b.categoryId)}
            style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', WebkitTapHighlightColor: 'transparent', animation: `mv6-fade-in ${ANIM.normal}ms ease ${i * 40}ms both` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: FONT.subheadline.size, color: COLORS.labelPrimary, fontFamily: FONT.family, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
            <span style={{ fontSize: FONT.subheadline.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{b.percentage}%</span>
            <span style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>{formatAmount(b.amount, currency)}</span>
          </button>
        ))}
        {breakdown.length > 6 && (
          <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, textAlign: 'center', paddingTop: 4 }}>
            +{breakdown.length - 6} more categories
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyBarsChart({ transactions, currency }) {
  const data = useMemo(() => buildMonthlyTimeSeries(transactions, currency), [transactions, currency]);
  if (!data.length) return <EmptyState icon="BarChart3" title="No monthly data" style={{ padding: `${SPACE.xl}px` }} />;
  const avgIncome  = data.reduce((s, d) => s + d.income,  0) / data.length;
  const avgExpense = data.reduce((s, d) => s + d.expense, 0) / data.length;
  return (
    <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px` }}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barSize={10} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={60} />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Bar dataKey="income"  name="Income"  fill={COLORS.income}  radius={[4,4,0,0]} />
          <Bar dataKey="expense" name="Expense" fill={COLORS.expense} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', gap: SPACE.xl, marginTop: SPACE.md, paddingTop: SPACE.sm, borderTop: `0.5px solid ${COLORS.separatorOpaque}` }}>
        {[{ label: 'Avg Income', v: avgIncome, c: COLORS.income }, { label: 'Avg Expense', v: avgExpense, c: COLORS.expense }, { label: 'Avg Net', v: avgIncome - avgExpense, c: avgIncome >= avgExpense ? COLORS.income : COLORS.expense }].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.bold, color: s.c, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(Math.abs(s.v), currency)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: CASHFLOW
// ─────────────────────────────────────────────────────────────────────────────

function DailyCashflowChart({ transactions, currency }) {
  const data = useMemo(() => buildDailyTimeSeries(transactions, currency), [transactions, currency]);
  if (data.length < 2) return <EmptyState icon="TrendingUp" title="Not enough data" message="Need at least 2 days of activity" style={{ padding: `${SPACE.xl}px` }} accentColor={COLORS.blue} />;
  return (
    <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px` }}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cfIncome"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={COLORS.income}  stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.income}  stopOpacity={0} /></linearGradient>
            <linearGradient id="cfExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={COLORS.expense} stopOpacity={0.25}/><stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} interval="preserveStartEnd"
            tickFormatter={d => new Date(d).toLocaleDateString('default', { month: 'short', day: 'numeric' })} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={60} />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Area type="monotone" dataKey="income"  name="Income"  stroke={COLORS.income}  strokeWidth={2} fill="url(#cfIncome)"  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="expense" name="Expense" stroke={COLORS.expense} strokeWidth={2} fill="url(#cfExpense)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function NetCashflowChart({ transactions, currency }) {
  const data = useMemo(() => {
    const daily = buildDailyTimeSeries(transactions, currency);
    return daily.map(d => ({ ...d, net: d.income - d.expense }));
  }, [transactions, currency]);
  if (data.length < 2) return null;
  return (
    <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px` }}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} interval="preserveStartEnd"
            tickFormatter={d => new Date(d).toLocaleDateString('default', { month: 'short', day: 'numeric' })} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(Math.abs(v), currency)} width={60} />
          <Tooltip content={<ChartTooltip currency={currency} formatter={(v) => (v >= 0 ? '+' : '−') + formatAmount(Math.abs(v), currency)} />} />
          <ReferenceLine y={0} stroke={COLORS.separatorOpaque} strokeWidth={1} />
          <Bar dataKey="net" name="Net" radius={[3,3,3,3]}
            fill={COLORS.income}
            isAnimationActive
            label={false}
            // Color positive bars green, negative red
            shape={(props) => {
              const { x, y, width, height, value } = props;
              const fill = value >= 0 ? COLORS.income : COLORS.expense;
              const absH = Math.abs(height);
              const rectY = value >= 0 ? y : y + height;
              return <rect x={x} y={rectY} width={width} height={absH} fill={fill} rx={3} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RunningBalanceChart({ transactions, currency, accounts }) {
  const data = useMemo(() => {
    const filtered = transactions.filter(t => t.currency === currency);
    return buildRunningBalance(filtered, accounts, currency);
  }, [transactions, accounts, currency]);
  if (data.length < 2) return <EmptyState icon="Activity" title="Not enough data" style={{ padding: `${SPACE.xl}px` }} />;
  const minVal = Math.min(...data.map(d => d.balance));
  const maxVal = Math.max(...data.map(d => d.balance));
  const isPositive = data[data.length - 1]?.balance >= data[0]?.balance;
  const lineColor = isPositive ? COLORS.income : COLORS.expense;
  return (
    <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px` }}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={lineColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} interval="preserveStartEnd"
            tickFormatter={d => new Date(d).toLocaleDateString('default', { month: 'short', day: 'numeric' })} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={64} domain={['auto','auto']} />
          <ReferenceLine y={0} stroke={COLORS.separatorOpaque} strokeWidth={1} strokeDasharray="4 4" />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Area type="monotone" dataKey="balance" name="Balance" stroke={lineColor} strokeWidth={2.5} fill="url(#balanceGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function DayOfWeekHeatmap({ transactions, currency }) {
  const data = useMemo(() => {
    const map = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    const counts = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    transactions.filter(t => t.type === 'expense' && t.currency === currency).forEach(t => {
      const day = safeDate(t.dateObj).getDay();
      map[day] += t.amount || 0;
      counts[day]++;
    });
    return DAYS.map((label, i) => ({ label, total: map[i], count: counts[i], avg: counts[i] > 0 ? map[i] / counts[i] : 0 }));
  }, [transactions, currency]);
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ padding: `${SPACE.lg}px ${SPACE.lg}px` }}>
      <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, marginBottom: SPACE.md }}>Spending by day of week</div>
      <div style={{ display: 'flex', gap: SPACE.sm, alignItems: 'flex-end' }}>
        {data.map((d, i) => {
          const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
          const isWeekend = i === 0 || i === 6;
          const barH = Math.max(pct * 1.2, 4);
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: '9px', color: COLORS.labelTertiary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                {d.total > 0 ? formatAmount(d.total, currency).replace(/[^0-9.]/g, '') : ''}
              </div>
              <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${barH}%`, minHeight: 4, background: isWeekend ? COLORS.orange : COLORS.blue, borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`, opacity: pct > 0 ? 0.7 + pct * 0.003 : 0.2, transition: `height 0.7s ${ANIM.spring}` }} />
              </div>
              <div style={{ fontSize: '10px', fontWeight: isWeekend ? FONT.semibold : FONT.regular, color: isWeekend ? COLORS.orange : COLORS.labelSecondary, fontFamily: FONT.family }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryRanking({ breakdown, currency, navigate }) {
  const max = breakdown[0]?.amount || 1;
  return (
    <div style={{ padding: `${SPACE.sm}px 0 0` }}>
      {breakdown.slice(0, 10).map((b, i) => (
        <button key={b.categoryId} onClick={() => navigate?.(`/categories/${b.categoryId}`)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', animation: `mv6-fade-in ${ANIM.normal}ms ease ${i * 40}ms both` }}>
          <div style={{ width: 28, height: 28, borderRadius: RADIUS.full, background: i < 3 ? `${b.color}20` : COLORS.fillTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? b.color : COLORS.labelTertiary, fontFamily: FONT.family }}>#{i+1}</span>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: RADIUS.md, background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={b.icon || 'Tag'} size={16} color={b.color} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: FONT.callout.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{b.name}</span>
              <span style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatAmount(b.amount, currency)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <div style={{ flex: 1, height: 5, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(b.amount / max) * 100}%`, background: b.color, borderRadius: RADIUS.full, transition: `width 0.8s ${ANIM.spring}` }} />
              </div>
              <span style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, flexShrink: 0, minWidth: 32 }}>{b.percentage}%</span>
              <Icon name="ChevronRight" size={14} color={COLORS.labelTertiary} strokeWidth={2.5} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: COMPARE (this period vs prior period)
// ─────────────────────────────────────────────────────────────────────────────

function getPriorFilter(filter) {
  const bounds = getDateBounds(filter);
  const rangeMs = bounds.end.getTime() - bounds.start.getTime();
  return {
    dateRange: 'custom',
    customStart: new Date(bounds.start.getTime() - rangeMs - 86400000).toISOString().split('T')[0],
    customEnd:   new Date(bounds.start.getTime() - 86400000).toISOString().split('T')[0],
    accountIds:  filter.accountIds || [],
  };
}

function CompareBar({ label, current, prior, color }) {
  const max = Math.max(current, prior, 1);
  const pctCurrent = (current / max) * 100;
  const pctPrior   = (prior / max) * 100;
  const change = prior > 0 ? ((current - prior) / prior) * 100 : null;
  const improved = color === COLORS.income ? current >= prior : current <= prior;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.sm}px ${SPACE.lg}px` }}>
      <div style={{ width: 64, flexShrink: 0 }}>
        <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{label}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 22, background: COLORS.fillTertiary, borderRadius: RADIUS.sm, overflow: 'hidden', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
            <div style={{ width: `${pctCurrent}%`, height: '100%', background: color, borderRadius: RADIUS.sm, position: 'absolute', left: 0, top: 0 }} />
            <div style={{ width: `${pctCurrent}%`, height: '100%', background: `${color}cc`, borderRadius: RADIUS.sm, minWidth: 4 }} />
          </div>
          <div style={{ flex: 1, height: 22, background: COLORS.fillTertiary, borderRadius: RADIUS.sm, overflow: 'hidden' }}>
            <div style={{ width: `${pctPrior}%`, height: '100%', background: `${color}50`, borderRadius: RADIUS.sm, minWidth: pctPrior > 0 ? 4 : 0 }} />
          </div>
        </div>
      </div>
      {change !== null && (
        <div style={{ width: 52, textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: improved ? COLORS.income : COLORS.expense, fontFamily: FONT.family }}>
            {change > 0 ? '+' : ''}{change.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

function CompareTab({ user, filter, currency }) {
  const priorFilter = useMemo(() => getPriorFilter(filter), [filter]);
  const { transactions: currTx, loading: currLoading } = useTransactions(user.uid, filter);
  const { transactions: priorTx, loading: priorLoading } = useTransactions(user.uid, priorFilter);
  const currStats  = useMemo(() => calcStatsByCurrency(currTx),  [currTx]);
  const priorStats = useMemo(() => calcStatsByCurrency(priorTx), [priorTx]);
  const c  = currStats[currency]  || { income: 0, expense: 0, net: 0, count: 0 };
  const p  = priorStats[currency] || { income: 0, expense: 0, net: 0, count: 0 };

  if (currLoading || priorLoading) return (
    <div style={{ padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 48, background: COLORS.fillTertiary, borderRadius: RADIUS.lg }} />)}
    </div>
  );

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: SPACE.lg, padding: `${SPACE.sm}px ${SPACE.lg}px ${SPACE.md}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.blue }} /><span style={{ fontSize: '11px', color: COLORS.labelSecondary, fontFamily: FONT.family }}>This period</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: `${COLORS.blue}50` }} /><span style={{ fontSize: '11px', color: COLORS.labelSecondary, fontFamily: FONT.family }}>Prior period</span></div>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>% change</div>
      </div>
      <CompareBar label="Income"  current={c.income}  prior={p.income}  color={COLORS.income}  />
      <div style={{ height: '0.5px', background: COLORS.separatorOpaque, margin: `0 ${SPACE.lg}px` }} />
      <CompareBar label="Expense" current={c.expense} prior={p.expense} color={COLORS.expense} />
      <div style={{ height: '0.5px', background: COLORS.separatorOpaque, margin: `0 ${SPACE.lg}px` }} />
      <CompareBar label="Txns"    current={c.count}   prior={p.count}   color={COLORS.blue}    />

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.sm, padding: `${SPACE.md}px ${SPACE.lg}px ${SPACE.lg}px`, marginTop: SPACE.sm }}>
        {[
          { label: 'This Period', income: c.income, expense: c.expense, net: c.net, count: c.count, isCurrent: true },
          { label: 'Prior Period', income: p.income, expense: p.expense, net: p.net, count: p.count, isCurrent: false },
        ].map(col => (
          <div key={col.label} style={{ background: col.isCurrent ? `${COLORS.blue}08` : COLORS.fillTertiary, borderRadius: RADIUS.xl, padding: `${SPACE.md}px ${SPACE.md}px`, border: col.isCurrent ? `1px solid ${COLORS.blue}20` : '1px solid transparent' }}>
            <div style={{ fontSize: FONT.caption2.size, fontWeight: FONT.semibold, color: col.isCurrent ? COLORS.blue : COLORS.labelTertiary, fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: SPACE.sm }}>{col.label}</div>
            {[{ l: 'Income', v: col.income, c: COLORS.income }, { l: 'Expense', v: col.expense, c: COLORS.expense }, { l: 'Net', v: col.net, c: col.net >= 0 ? COLORS.income : COLORS.expense }, { l: 'Txns', v: col.count, c: COLORS.blue }].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '11px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>{r.l}</span>
                <span style={{ fontSize: '12px', fontWeight: FONT.semibold, color: r.c, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
                  {r.l === 'Txns' ? r.v : formatAmount(Math.abs(r.v), currency)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Monthly comparison chart */}
      {(() => {
        const currMonthly  = buildMonthlyTimeSeries(currTx, currency);
        const priorMonthly = buildMonthlyTimeSeries(priorTx, currency);
        if (!currMonthly.length && !priorMonthly.length) return null;
        const combined = [...new Set([...currMonthly.map(d=>d.label),...priorMonthly.map(d=>d.label)])].sort().map(l => ({
          label: l,
          currentIncome:  currMonthly.find(d=>d.label===l)?.income  || 0,
          currentExpense: currMonthly.find(d=>d.label===l)?.expense || 0,
          priorIncome:    priorMonthly.find(d=>d.label===l)?.income  || 0,
          priorExpense:   priorMonthly.find(d=>d.label===l)?.expense || 0,
        }));
        return (
          <div style={{ padding: `0 ${SPACE.sm}px ${SPACE.lg}px` }}>
            <div style={{ height: '0.5px', background: COLORS.separatorOpaque, margin: `0 ${SPACE.md}px ${SPACE.md}px` }} />
            <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, textAlign: 'center', marginBottom: SPACE.sm }}>Monthly comparison</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={combined} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barSize={8} barGap={1}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} width={52} tickFormatter={v => formatAmount(v, currency)} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar dataKey="currentIncome"  name="This Income"  fill={COLORS.income}          radius={[3,3,0,0]} />
                <Bar dataKey="priorIncome"    name="Prior Income"  fill={`${COLORS.income}55`}   radius={[3,3,0,0]} />
                <Bar dataKey="currentExpense" name="This Expense"  fill={COLORS.expense}         radius={[3,3,0,0]} />
                <Bar dataKey="priorExpense"   name="Prior Expense" fill={`${COLORS.expense}55`}  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Top Merchants ────────────────────────────────────────────────────────────
function TopMerchants({ transactions, currency }) {
  const merchants = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense' && t.currency === currency && t.note?.trim()).forEach(t => {
      const k = t.note.trim();
      if (!map[k]) map[k] = { note: k, total: 0, count: 0 };
      map[k].total += t.amount || 0;
      map[k].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [transactions, currency]);
  if (!merchants.length) return <EmptyState icon="Store" title="No merchant data" message="Add notes to transactions to see top merchants" style={{ padding: `${SPACE.xl}px` }} accentColor={COLORS.purple} />;
  const max = merchants[0]?.total || 1;
  return (
    <div style={{ padding: `${SPACE.sm}px 0` }}>
      {merchants.map((m, i) => (
        <div key={m.note} style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.md}px ${SPACE.lg}px`, animation: `mv6-fade-in ${ANIM.normal}ms ease ${i * 40}ms both` }}>
          <div style={{ width: 28, height: 28, borderRadius: RADIUS.full, background: i < 3 ? `${CHART_PALETTE[i]}18` : COLORS.fillTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? CHART_PALETTE[i] : COLORS.labelTertiary, fontFamily: FONT.family }}>{i + 1}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: FONT.subheadline.size, fontWeight: FONT.medium, color: COLORS.labelPrimary, fontFamily: FONT.family, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{m.note}</span>
              <span style={{ fontSize: FONT.subheadline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatAmount(m.total, currency)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <div style={{ flex: 1, height: 3, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(m.total / max) * 100}%`, background: CHART_PALETTE[i % CHART_PALETTE.length], borderRadius: RADIUS.full, transition: `width 0.7s ${ANIM.spring}` }} />
              </div>
              <span style={{ fontSize: FONT.caption2.size, color: COLORS.labelTertiary, fontFamily: FONT.family, flexShrink: 0 }}>{m.count}×</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ALL_TIME = { dateRange: 'allTime', accountIds: [] };

export default function Insights({ user }) {
  const navigate = useNavigate();
  const { filter }  = useFilter();
  const { categories }   = useCategories(user.uid);
  const { transactions, loading } = useTransactions(user.uid, filter);
  const { transactions: allTx }   = useTransactions(user.uid, ALL_TIME);

  const [activeTab,  setActiveTab]  = useState('overview');
  const [activeCurr, setActiveCurr] = useState(null);

  const currencies = useMemo(() => [...new Set(transactions.map(t => t.currency).filter(Boolean))], [transactions]);
  const currency   = activeCurr && currencies.includes(activeCurr) ? activeCurr : currencies[0] || 'KWD';

  React.useEffect(() => {
    if (currencies.length > 0 && !currencies.includes(activeCurr)) setActiveCurr(currencies[0]);
  }, [currencies]);

  const stats     = useMemo(() => calcStatsByCurrency(transactions), [transactions]);
  const breakdown = useMemo(() => buildCategoryBreakdown(transactions, categories, currency), [transactions, categories, currency]);

  const s = stats[currency] || { income: 0, expense: 0, net: 0 };
  const savingsRate = s.income > 0 ? Math.round(((s.income - s.expense) / s.income) * 100) : 0;
  const filterLabel = getFilterLabel(filter);

  const tabs = [
    { value: 'overview',    label: 'Overview'    },
    { value: 'cashflow',    label: 'Cashflow'    },
    { value: 'categories',  label: 'Categories'  },
    { value: 'compare',     label: 'Compare'     },
  ];

  const Loading = () => (
    <div style={{ padding: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.sm }}>{[1,2,3,4].map(i => <div key={i} style={{ height: 88, background: COLORS.surface, borderRadius: RADIUS.xl, animation: `mv6-pulse 1.4s ease infinite ${i*150}ms` }} />)}</div>
      <div style={{ height: 260, background: COLORS.surface, borderRadius: RADIUS.xl }} />
      <div style={{ height: 200, background: COLORS.surface, borderRadius: RADIUS.xl }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px` }}>
        <h1 style={{ margin: 0, fontSize: FONT.largeTitle.size, fontWeight: FONT.bold, color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-0.5px' }}>Insights</h1>
        <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, marginTop: 3 }}>{filterLabel}</div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.md}px` }}>
        <SegmentedControl options={tabs} value={activeTab} onChange={setActiveTab} />
      </div>

      {/* Currency tabs */}
      {currencies.length > 1 && (
        <div style={{ display: 'flex', gap: SPACE.xs, padding: `0 ${SPACE.lg}px ${SPACE.md}px`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {currencies.map(c => (
            <button key={c} onClick={() => setActiveCurr(c)} style={{ padding: '5px 14px', borderRadius: RADIUS.full, background: currency === c ? COLORS.blue : COLORS.fillTertiary, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: FONT.semibold, color: currency === c ? '#fff' : COLORS.labelSecondary, fontFamily: FONT.family, flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>{c}</button>
          ))}
        </div>
      )}

      {loading ? <Loading /> : transactions.length === 0 ? (
        <EmptyState icon="BarChart3" title="No data to analyze" message={`Add some transactions for ${filterLabel.toLowerCase()} to see insights`} action={() => openAddTransaction()} actionLabel="Add Transaction" accentColor={COLORS.blue} />
      ) : (
        <>
          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              <KpiGrid stats={stats} currency={currency} savingsRate={savingsRate} />
              <Section title="Spending by Category" subtitle="tap to drill down">
                <SpendingDonut breakdown={breakdown} currency={currency} onClickCategory={id => navigate(`/categories/${id}`)} />
              </Section>
              <Section title="Monthly Overview">
                <MonthlyBarsChart transactions={allTx} currency={currency} />
              </Section>
              <Section title="Top Merchants">
                <TopMerchants transactions={transactions} currency={currency} />
              </Section>
            </>
          )}

          {/* ── CASHFLOW ─────────────────────────────────────────────────────── */}
          {activeTab === 'cashflow' && (
            <>
              <Section title="Daily Income vs Expense">
                <DailyCashflowChart transactions={transactions} currency={currency} />
              </Section>
              <Section title="Net Cashflow per Day">
                <NetCashflowChart transactions={transactions} currency={currency} />
              </Section>
              <Section title="Balance Trend">
                <RunningBalanceChart transactions={allTx} currency={currency} accounts={[]} />
              </Section>
            </>
          )}

          {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
          {activeTab === 'categories' && (
            <>
              <Section title="Expense Ranking" subtitle="all categories">
                <CategoryRanking breakdown={breakdown} currency={currency} navigate={navigate} />
              </Section>
              <Section title="Spending by Day of Week">
                <DayOfWeekHeatmap transactions={transactions} currency={currency} />
              </Section>
            </>
          )}

          {/* ── COMPARE ──────────────────────────────────────────────────────── */}
          {activeTab === 'compare' && (
            <Section title="Period Comparison">
              <CompareTab user={user} filter={filter} currency={currency} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
