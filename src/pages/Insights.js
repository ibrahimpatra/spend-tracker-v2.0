// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Insights.jsx
// Fully filterable analytics page. Every chart reacts to global FilterContext.
// • Spending donut by category (Recharts PieChart)
// • Spending trend area chart over time
// • Income vs Expense bar chart (monthly)
// • Top merchants / notes list
// • Currency switcher when multiple currencies exist
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, CHART_PALETTE } from '../constants';
import { useFilter, getFilterLabel } from '../context/FilterContext';
import { useCategories, useTransactions } from '../hooks/useData';
import {
  buildCategoryBreakdown, buildDailyTimeSeries, buildMonthlyTimeSeries,
  formatAmount, calcStatsByCurrency, sortByDateDesc,
} from '../utils/currency';
import { Icon, SegmentedControl, Skeleton, EmptyState } from '../components/ui';

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children, style }) {
  return (
    <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px`, ...style }}>
      <div style={{
        fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
        color: COLORS.labelSecondary, textTransform: 'uppercase',
        letterSpacing: '0.8px', fontFamily: FONT.family,
        padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
      }}>
        {title}
      </div>
      <div style={{
        background: COLORS.surface, borderRadius: RADIUS.xl,
        overflow: 'hidden', boxShadow: SHADOW.sm,
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Chart tooltip (dark frosted) ─────────────────────────────────────────────
function DarkTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(28,28,30,0.94)', backdropFilter: 'blur(12px)',
      borderRadius: RADIUS.lg, padding: '10px 14px', boxShadow: SHADOW.lg,
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {label && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: FONT.family, marginBottom: 5 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '13px', fontWeight: 600, color: p.color || '#fff', fontFamily: FONT.family, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          {p.name}: {formatAmount(p.value, currency)}
        </div>
      ))}
    </div>
  );
}

// ─── Spending Donut ───────────────────────────────────────────────────────────
function SpendingDonut({ breakdown, currency }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (!breakdown.length) return (
    <EmptyState icon="PieChart" title="No expense data" message="No expenses recorded for this period" style={{ padding: `${SPACE.xl}px` }} />
  );

  const total = breakdown.reduce((s, b) => s + b.amount, 0);

  return (
    <div style={{ padding: `${SPACE.lg}px` }}>
      <div style={{ position: 'relative', width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={breakdown}
              cx="50%" cy="50%"
              innerRadius={65} outerRadius={90}
              paddingAngle={2}
              dataKey="amount"
              onMouseEnter={(_, idx) => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {breakdown.map((entry, idx) => (
                <Cell
                  key={entry.categoryId}
                  fill={entry.color}
                  opacity={activeIdx === null || activeIdx === idx ? 1 : 0.45}
                  stroke="none"
                />
              ))}
            </Pie>
            <PieTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{
                    background: 'rgba(28,28,30,0.94)', backdropFilter: 'blur(12px)',
                    borderRadius: RADIUS.lg, padding: '10px 14px', boxShadow: SHADOW.lg,
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: d.color, fontFamily: FONT.family }}>{d.name}</div>
                    <div style={{ fontSize: '13px', color: '#fff', fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
                      {currency} {formatAmount(d.amount, currency)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: FONT.family }}>{d.percentage}%</div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          {activeIdx !== null ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 700, color: breakdown[activeIdx]?.color, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
                {formatAmount(breakdown[activeIdx]?.amount, currency)}
              </div>
              <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>
                {breakdown[activeIdx]?.percentage}%
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.labelPrimary, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
                {formatAmount(total, currency)}
              </div>
              <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>{currency}</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm, marginTop: SPACE.md }}>
        {breakdown.slice(0, 8).map((b, i) => (
          <div key={b.categoryId} style={{
            display: 'flex', alignItems: 'center', gap: SPACE.sm,
            animation: `mv6-fade-in ${ANIM.normal}ms ease ${i * 40}ms both`,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: b.color, flexShrink: 0,
            }} />
            <span style={{
              flex: 1, fontSize: FONT.subheadline.size, color: COLORS.labelPrimary,
              fontFamily: FONT.family, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {b.name}
            </span>
            <span style={{
              fontSize: FONT.subheadline.size, fontWeight: FONT.semibold,
              color: COLORS.labelSecondary, fontFamily: FONT.family, flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {b.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Spending Trend ───────────────────────────────────────────────────────────
function SpendingTrend({ transactions, currency }) {
  const data = useMemo(() => buildDailyTimeSeries(transactions, currency), [transactions, currency]);

  if (data.length < 2) return (
    <EmptyState icon="TrendingUp" title="Not enough data" message="Need at least 2 days of data to show a trend" style={{ padding: `${SPACE.xl}px` }} />
  );

  return (
    <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px` }}>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="insightIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.income}  stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS.income}  stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="insightExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.expense} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
          <XAxis
            dataKey="date" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }}
            tickLine={false} axisLine={false} interval="preserveStartEnd"
            tickFormatter={d => new Date(d).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={64} />
          <Tooltip content={<DarkTooltip currency={currency} />} />
          <Area type="monotone" dataKey="income"  name="Income"  stroke={COLORS.income}  strokeWidth={2} fill="url(#insightIncome)"  dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="expense" name="Expense" stroke={COLORS.expense} strokeWidth={2} fill="url(#insightExpense)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Monthly Bars ─────────────────────────────────────────────────────────────
function MonthlyBars({ transactions, currency }) {
  // For monthly bars we always show all-time data grouped by month
  const data = useMemo(() => buildMonthlyTimeSeries(transactions, currency), [transactions, currency]);

  if (data.length === 0) return (
    <EmptyState icon="BarChart3" title="No data" message="No monthly data available" style={{ padding: `${SPACE.xl}px` }} />
  );

  return (
    <div style={{ padding: `${SPACE.md}px ${SPACE.sm}px ${SPACE.lg}px` }}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }} barSize={12} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={64} />
          <Tooltip content={<DarkTooltip currency={currency} />} />
          <Bar dataKey="income"  name="Income"  fill={COLORS.income}  radius={[4,4,0,0]} />
          <Bar dataKey="expense" name="Expense" fill={COLORS.expense} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Net line summary */}
      {data.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: SPACE.xl,
          marginTop: SPACE.md, padding: `${SPACE.sm}px 0 0`,
          borderTop: `0.5px solid ${COLORS.separatorOpaque}`,
        }}>
          {[
            { label: 'Avg Income',  value: data.reduce((s,d) => s + d.income,  0) / data.length, color: COLORS.income  },
            { label: 'Avg Expense', value: data.reduce((s,d) => s + d.expense, 0) / data.length, color: COLORS.expense },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.bold, color: s.color, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
                {formatAmount(s.value, currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top Merchants ────────────────────────────────────────────────────────────
function TopMerchants({ transactions, currency }) {
  const merchants = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === 'expense' && t.currency === currency && t.note)
      .forEach(t => {
        const k = t.note.trim();
        if (!map[k]) map[k] = { note: k, total: 0, count: 0 };
        map[k].total += t.amount || 0;
        map[k].count++;
      });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [transactions, currency]);

  if (!merchants.length) return (
    <EmptyState icon="Store" title="No merchant data" message="Add notes to your transactions to see them here" style={{ padding: `${SPACE.xl}px` }} />
  );

  const max = merchants[0]?.total || 1;

  return (
    <div style={{ padding: `${SPACE.sm}px 0` }}>
      {merchants.map((m, i) => (
        <div
          key={m.note}
          style={{
            display: 'flex', alignItems: 'center', gap: SPACE.md,
            padding: `${SPACE.md}px ${SPACE.lg}px`,
            animation: `mv6-fade-in ${ANIM.normal}ms ease ${i * 40}ms both`,
          }}
        >
          {/* Rank */}
          <div style={{
            width: 28, height: 28, borderRadius: RADIUS.full,
            background: i < 3 ? `${CHART_PALETTE[i]}18` : COLORS.fillTertiary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: i < 3 ? CHART_PALETTE[i] : COLORS.labelTertiary,
              fontFamily: FONT.family,
            }}>
              {i + 1}
            </span>
          </div>

          {/* Name + bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{
                fontSize: FONT.subheadline.size, fontWeight: FONT.medium,
                color: COLORS.labelPrimary, fontFamily: FONT.family,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%',
              }}>
                {m.note}
              </span>
              <span style={{
                fontSize: FONT.subheadline.size, fontWeight: FONT.semibold,
                color: COLORS.labelPrimary, fontFamily: FONT.family,
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>
                {formatAmount(m.total, currency)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <div style={{ flex: 1, height: 3, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(m.total / max) * 100}%`,
                  background: CHART_PALETTE[i % CHART_PALETTE.length],
                  borderRadius: RADIUS.full,
                  transition: `width 0.7s ${ANIM.spring}`,
                }} />
              </div>
              <span style={{ fontSize: FONT.caption2.size, color: COLORS.labelTertiary, fontFamily: FONT.family, flexShrink: 0 }}>
                {m.count}×
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Summary Stats row ────────────────────────────────────────────────────────
function SummaryStats({ stats, currency }) {
  const s = stats[currency] || { income: 0, expense: 0, net: 0, count: 0 };

  const items = [
    { label: 'Income',       value: formatAmount(s.income,  currency), color: COLORS.income,   icon: 'TrendingUp'   },
    { label: 'Expenses',     value: formatAmount(s.expense, currency), color: COLORS.expense,  icon: 'TrendingDown' },
    { label: 'Net',          value: formatAmount(Math.abs(s.net), currency), color: s.net >= 0 ? COLORS.income : COLORS.expense, icon: 'Activity' },
    { label: 'Transactions', value: s.count, color: COLORS.blue, icon: 'ReceiptText' },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: SPACE.sm, margin: `0 ${SPACE.lg}px ${SPACE.lg}px`,
    }}>
      {items.map(item => (
        <div key={item.label} style={{
          background: COLORS.surface, borderRadius: RADIUS.xl,
          padding: `${SPACE.md}px ${SPACE.lg}px`,
          boxShadow: SHADOW.sm,
          animation: `mv6-fade-in ${ANIM.normal}ms ease both`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: RADIUS.md,
              background: `${item.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={item.icon} size={14} color={item.color} strokeWidth={2} />
            </div>
            <span style={{ fontSize: FONT.caption1.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>
              {item.label}
            </span>
          </div>
          <div style={{
            fontSize: '20px', fontWeight: 700, color: item.color,
            fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.5px',
          }}>
            {item.value}
          </div>
          {item.label !== 'Transactions' && (
            <div style={{ fontSize: '10px', color: COLORS.labelQuaternary, fontFamily: FONT.family, marginTop: 2, letterSpacing: '0.5px' }}>
              {currency}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Insights({ user }) {
  const { filter }    = useFilter();
  const { categories } = useCategories(user.uid);
  const { transactions, loading } = useTransactions(user.uid, filter);

  // For monthly bars — all time
  const { transactions: allTx } = useTransactions(user.uid, { dateRange: 'allTime', accountIds: [] });

  const [activeTab, setActiveTab]   = useState('overview'); // 'overview' | 'trends' | 'merchants'
  const [activeCurr, setActiveCurr] = useState(null);

  const currencies = useMemo(
    () => [...new Set(transactions.map(t => t.currency).filter(Boolean))],
    [transactions]
  );
  const currency = activeCurr || currencies[0] || 'KWD';

  React.useEffect(() => {
    if (currencies.length > 0 && !currencies.includes(activeCurr)) {
      setActiveCurr(currencies[0]);
    }
  }, [currencies]);

  const stats      = useMemo(() => calcStatsByCurrency(transactions), [transactions]);
  const breakdown  = useMemo(() => buildCategoryBreakdown(transactions, categories, currency), [transactions, categories, currency]);

  const filterLabel = getFilterLabel(filter);

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: FONT.largeTitle.size, fontWeight: FONT.bold,
            color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-0.5px',
          }}>
            Insights
          </h1>
          <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, marginTop: 3 }}>
            {filterLabel}
          </div>
        </div>
      </div>

      {/* ── Tab switcher ───────────────────────────────────────────────────── */}
      <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.md}px` }}>
        <SegmentedControl
          options={[
            { value: 'overview',  label: 'Overview'  },
            { value: 'trends',    label: 'Trends'    },
            { value: 'merchants', label: 'Merchants' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ── Currency tabs ──────────────────────────────────────────────────── */}
      {currencies.length > 1 && (
        <div style={{ display: 'flex', gap: SPACE.xs, padding: `0 ${SPACE.lg}px ${SPACE.md}px`, overflowX: 'auto' }}>
          {currencies.map(c => (
            <button key={c} onClick={() => setActiveCurr(c)} style={{
              padding: '5px 14px', borderRadius: RADIUS.full,
              background: currency === c ? COLORS.blue : COLORS.fillTertiary,
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: FONT.semibold,
              color: currency === c ? '#fff' : COLORS.labelSecondary,
              fontFamily: FONT.family, flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.sm }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 80, background: COLORS.surface, borderRadius: RADIUS.xl }} />)}
          </div>
          <div style={{ height: 260, background: COLORS.surface, borderRadius: RADIUS.xl }} />
          <div style={{ height: 200, background: COLORS.surface, borderRadius: RADIUS.xl }} />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="BarChart3"
          title="No data"
          message={`Nothing to analyze for ${filterLabel.toLowerCase()}`}
        />
      ) : (
        <>
          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              <SummaryStats stats={stats} currency={currency} />
              <Section title="Spending by Category">
                <SpendingDonut breakdown={breakdown} currency={currency} />
              </Section>
              <Section title="Income vs Expenses (Monthly)">
                <MonthlyBars transactions={allTx} currency={currency} />
              </Section>
            </>
          )}

          {/* ── TRENDS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'trends' && (
            <>
              <Section title="Daily Cash Flow">
                <SpendingTrend transactions={transactions} currency={currency} />
              </Section>
              <Section title="Monthly Overview">
                <MonthlyBars transactions={allTx} currency={currency} />
              </Section>

              {/* Net trend numbers */}
              <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
                <div style={{
                  background: COLORS.surface, borderRadius: RADIUS.xl,
                  overflow: 'hidden', boxShadow: SHADOW.sm,
                }}>
                  {Object.entries(stats).map(([curr, val], i, arr) => (
                    <React.Fragment key={curr}>
                      <div style={{ padding: `${SPACE.md}px ${SPACE.lg}px` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.labelTertiary, fontFamily: FONT.family, letterSpacing: '1px' }}>{curr}</span>
                          <span style={{
                            fontSize: FONT.callout.size, fontWeight: 700,
                            color: val.net >= 0 ? COLORS.income : COLORS.expense,
                            fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
                          }}>
                            {val.net >= 0 ? '+' : '−'}{formatAmount(Math.abs(val.net), curr)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: SPACE.xl }}>
                          <div>
                            <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 2 }}>In</div>
                            <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: COLORS.income, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(val.income, curr)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 2 }}>Out</div>
                            <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: COLORS.expense, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(val.expense, curr)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 2 }}>Txns</div>
                            <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{val.count}</div>
                          </div>
                        </div>
                      </div>
                      {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── MERCHANTS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'merchants' && (
            <>
              <Section title="Top Merchants / Notes">
                <TopMerchants transactions={transactions} currency={currency} />
              </Section>
              <Section title="Category Breakdown">
                <SpendingDonut breakdown={breakdown} currency={currency} />
              </Section>
            </>
          )}
        </>
      )}
    </div>
  );
}