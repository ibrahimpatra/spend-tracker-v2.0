// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/CategoryDetail.jsx  →  /categories/:id
// Real URL. Browser back button works natively.
// • Hero card (color gradient matching category)
// • Total spent, transaction count, avg per transaction
// • % of total expenses for the period
// • Daily spend trend chart (Recharts AreaChart)
// • Full transaction list for this category
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM } from '../constants';
import { useFilter } from '../context/FilterContext';
import { useCategories, useTransactions } from '../hooks/useData';
import { buildDailyTimeSeries, calcStatsByCurrency, formatAmount, sortByDateDesc } from '../utils/currency';
import { Icon, Skeleton, EmptyState, TxIcon } from '../components/ui';
import { openAddTransaction } from '../components/Layout';

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, sub, color }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.12)',
      borderRadius: RADIUS.lg, padding: `${SPACE.md}px`,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: FONT.family, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: FONT.family, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ t, category, accounts, index }) {
  const [pressed, setPressed] = useState(false);
  const acc    = accounts?.find(a => a.id === t.accountId);
  const isInc  = t.type === 'income' || t.type === 'in_transfer';

  return (
    <button
      onClick={() => openAddTransaction(t)}
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
        animation: `mv6-fade-in ${ANIM.normal}ms ease ${Math.min(index * 30, 300)}ms both`,
      }}
    >
      <TxIcon type={t.type} category={category} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: FONT.callout.size, fontWeight: FONT.medium,
          color: COLORS.labelPrimary, fontFamily: FONT.family,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t.note || category?.name || 'Transaction'}
        </div>
        <div style={{
          fontSize: FONT.caption1.size, color: COLORS.labelTertiary,
          fontFamily: FONT.family, marginTop: 2, display: 'flex', gap: 4,
        }}>
          <span>{safeDate(t.dateObj).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          {acc && <><span>·</span><span style={{ textTransform: 'uppercase', fontSize: '10px' }}>{acc.name}</span></>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: FONT.callout.size, fontWeight: FONT.bold,
          color: isInc ? COLORS.income : COLORS.labelPrimary,
          fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
        }}>
          {isInc ? '+' : '−'}{formatAmount(t.amount, t.currency)}
        </div>
        <div style={{ fontSize: '10px', color: COLORS.labelQuaternary, fontFamily: FONT.family, letterSpacing: '0.5px', marginTop: 1 }}>
          {t.currency}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DETAIL PAGE
// ─────────────────────────────────────────────────────────────────────────────

// ─── Safe date helper ────────────────────────────────────────────────────────
const safeDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d.toDate === 'function') return d.toDate();
  if (typeof d.seconds === 'number') return new Date(d.seconds * 1000);
  const p = new Date(d); return isNaN(p) ? new Date() : p;
};

export default function CategoryDetail({ user }) {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { filter }  = useFilter();

  const { categories, loading: catLoading } = useCategories(user.uid);
  const { transactions, loading: txLoading } = useTransactions(user.uid, filter);
  // All-time for totals calculation
  const { transactions: allTx } = useTransactions(user.uid, { dateRange: 'allTime', accountIds: [] });

  const category = categories.find(c => c.id === id);

  // Transactions for this category in the filtered period
  const catTx = useMemo(
    () => transactions.filter(t => t.categoryId === id),
    [transactions, id]
  );

  // All transactions for this category (all time) for "% of total" calc
  const catTxAll = useMemo(
    () => allTx.filter(t => t.categoryId === id),
    [allTx, id]
  );

  // Currencies used
  const currencies = useMemo(() => [...new Set(catTx.map(t => t.currency).filter(Boolean))], [catTx]);
  const [activeCurr, setActiveCurr] = useState(null);
  const currency = activeCurr || currencies[0] || 'KWD';

  // Stats for active currency
  const stats = useMemo(() => {
    const txForCurr = catTx.filter(t => t.currency === currency);
    const total = txForCurr.reduce((s, t) => s + (t.amount || 0), 0);
    const count = txForCurr.length;
    const avg   = count > 0 ? total / count : 0;

    // % of total expenses in this currency during the period
    const allExpenses = transactions
      .filter(t => t.currency === currency && (t.type === 'expense' || t.type === 'out_transfer'))
      .reduce((s, t) => s + (t.amount || 0), 0);
    const pct = allExpenses > 0 ? (total / allExpenses) * 100 : 0;

    return { total, count, avg, pct };
  }, [catTx, transactions, currency]);

  // Daily trend data
  const dailyData = useMemo(() => {
    const txForCurr = catTx.filter(t => t.currency === currency);
    const map = {};
    txForCurr.forEach(t => {
      const d = safeDate(t.dateObj).toISOString().split('T')[0];
      if (!map[d]) map[d] = 0;
      map[d] += t.amount || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        label: new Date(date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        amount,
      }));
  }, [catTx, currency]);

  const accentColor = category?.color || COLORS.blue;

  if (catLoading) return (
    <div style={{ padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
      <Skeleton height={200} radius={RADIUS.xxl} />
      <Skeleton height={160} radius={RADIUS.xl} />
      <Skeleton height={300} radius={RADIUS.xl} />
    </div>
  );

  if (!category) return (
    <EmptyState
      icon="Tag"
      title="Category not found"
      message="This category may have been deleted"
      action={() => navigate('/categories')}
      actionLabel="Back to Categories"
    />
  );

  return (
    <div>
      {/* ── Back ────────────────────────────────────────────────────────────────── */}
      <div style={{ padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px` }}>
        <button
          onClick={() => navigate('/categories')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.blue, fontFamily: FONT.family,
            fontSize: FONT.callout.size, padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="ChevronLeft" size={20} color={COLORS.blue} strokeWidth={2.5} />
          Categories
        </button>
      </div>

      {/* ── Hero card ─────────────────────────────────────────────────────────────── */}
      <div style={{
        margin: `0 ${SPACE.lg}px ${SPACE.lg}px`,
        background: `linear-gradient(145deg, ${accentColor}DD, ${accentColor}88)`,
        borderRadius: RADIUS.xxl, padding: SPACE.xl,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 8px 32px ${accentColor}44`,
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

        {/* Category icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg }}>
          <div style={{
            width: 52, height: 52, borderRadius: RADIUS.xl,
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={category.icon} size={26} color="#fff" strokeWidth={1.75} />
          </div>
          <div>
            <div style={{ fontSize: FONT.title2.size, fontWeight: FONT.bold, color: '#fff', fontFamily: FONT.family }}>{category.name}</div>
            <div style={{ fontSize: FONT.caption1.size, color: 'rgba(255,255,255,0.55)', fontFamily: FONT.family, textTransform: 'capitalize' }}>
              {category.type === 'income' ? 'Income' : 'Expense'} category
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: SPACE.sm }}>
          <StatPill
            label="Total"
            value={`${currency} ${formatAmount(stats.total, currency)}`}
          />
          <StatPill
            label="Transactions"
            value={stats.count}
          />
          <StatPill
            label="Avg"
            value={`${currency} ${formatAmount(stats.avg, currency)}`}
          />
        </div>

        {stats.pct > 0 && (
          <div style={{
            marginTop: SPACE.md,
            fontSize: FONT.footnote.size, color: 'rgba(255,255,255,0.55)',
            fontFamily: FONT.family,
          }}>
            {stats.pct.toFixed(1)}% of total {category.type === 'income' ? 'income' : 'expenses'} this period
          </div>
        )}
      </div>

      {/* ── Currency tabs ─────────────────────────────────────────────────────────── */}
      {currencies.length > 1 && (
        <div style={{ display: 'flex', gap: SPACE.xs, padding: `0 ${SPACE.lg}px ${SPACE.md}px`, overflowX: 'auto' }}>
          {currencies.map(c => (
            <button
              key={c} onClick={() => setActiveCurr(c)}
              style={{
                padding: '5px 14px', borderRadius: RADIUS.full,
                background: currency === c ? accentColor : COLORS.fillTertiary,
                border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: FONT.semibold,
                color: currency === c ? '#fff' : COLORS.labelSecondary,
                fontFamily: FONT.family, flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* ── Daily Trend Chart ─────────────────────────────────────────────────────── */}
      {dailyData.length > 1 && (
        <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            <div style={{ padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px` }}>
              <span style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>
                Daily Spend Trend
              </span>
            </div>
            <div style={{ padding: `0 ${SPACE.sm}px ${SPACE.lg}px` }}>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`catGrad_${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={accentColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={64} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: 'var(--mv6-surface-overlay, rgba(28,28,30,0.92))', borderRadius: RADIUS.lg, padding: '10px 14px', boxShadow: SHADOW.lg }}>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: FONT.family, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: accentColor, fontFamily: FONT.family }}>
                            {formatAmount(payload[0].value, currency)} {currency}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="amount" name="Spent"
                    stroke={accentColor} strokeWidth={2.5}
                    fill={`url(#catGrad_${id})`}
                    dot={false} activeDot={{ r: 4, fill: accentColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Transactions ──────────────────────────────────────────────────────────── */}
      <div style={{ margin: `0 ${SPACE.lg}px` }}>
        <div style={{
          fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
          color: COLORS.labelSecondary, textTransform: 'uppercase',
          letterSpacing: '0.8px', fontFamily: FONT.family,
          padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
        }}>
          {catTx.length} Transaction{catTx.length !== 1 ? 's' : ''}
        </div>
        {catTx.length === 0 ? (
          <EmptyState
            icon="ReceiptText"
            title="No transactions"
            message="Nothing in this category for the selected period"
            action={() => openAddTransaction()}
            actionLabel="Add Transaction"
          />
        ) : (
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            {sortByDateDesc(catTx).map((t, i, arr) => (
              <React.Fragment key={t.id}>
                <TxRow t={t} category={category} index={i} />
                {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 68 }} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}