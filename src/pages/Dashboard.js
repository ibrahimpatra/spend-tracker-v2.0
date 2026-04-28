// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Dashboard.jsx
// Hero balance cards (one per currency, swipeable)
// Per-currency income / expense / net stats
// Cash flow area chart (Recharts, per currency)
// Top spending categories with progress bars
// Recent transactions list
// Everything reacts to global FilterContext — change date = entire page updates
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, CHART_PALETTE } from '../constants';
import { useFilter, getFilterLabel } from '../context/FilterContext';
import { useAccounts, useCategories, useTransactions, useHiddenBalances } from '../hooks/useData';
import {
  calcStatsByCurrency, buildDailyTimeSeries,
  buildCategoryBreakdown, formatAmount, formatWithSymbol,
  calcNetWorthByCurrency, sortByDateDesc,
} from '../utils/currency';
import {
  Icon, Card, CurrencyDisplay, CurrencyStatRow, ProgressBar,
  SectionHeader, TxIcon, Skeleton, EmptyState, Badge,
} from '../components/ui';
import { openAddTransaction } from '../components/Layout';

// ─── Greeting ─────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Hero Balance Card ────────────────────────────────────────────────────────
// One per currency. Swipe horizontally to see more.
function HeroCard({ currency, balance, stats, isHidden, onToggleHide, index }) {
  const net = stats?.net ?? 0;
  const gradients = [
    ['#1a1a2e', '#16213e'],   // deep navy
    ['#0f2027', '#203a43'],   // dark teal
    ['#1a0533', '#2d1b5e'],   // deep purple
    ['#0d1b2a', '#1b3a4b'],   // midnight blue
    ['#1c0a00', '#3d1a00'],   // dark ember
  ];
  const [g1, g2] = gradients[index % gradients.length];

  return (
    <div style={{
      minWidth: 300,
      background: `linear-gradient(145deg, ${g1}, ${g2})`,
      borderRadius: RADIUS.xxl,
      padding: SPACE.xl,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
    }}>
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -20, left: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
        pointerEvents: 'none',
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.xl }}>
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            fontFamily: FONT.family, letterSpacing: '1.2px', textTransform: 'uppercase',
          }}>
            Total Balance
          </div>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
            fontFamily: FONT.family, letterSpacing: '0.5px', marginTop: 2,
          }}>
            {currency}
          </div>
        </div>
        <button
          onClick={onToggleHide}
          style={{
            width: 34, height: 34, borderRadius: RADIUS.full,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon
            name={isHidden ? 'EyeOff' : 'Eye'}
            size={16} color="rgba(255,255,255,0.7)" strokeWidth={2}
          />
        </button>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: SPACE.xl }}>
        {isHidden ? (
          <div style={{
            fontSize: '36px', letterSpacing: '8px',
            color: 'rgba(255,255,255,0.4)', fontFamily: FONT.family,
          }}>
            ••••••
          </div>
        ) : (
          <div style={{
            fontSize: '38px', fontWeight: 700, color: '#fff',
            fontFamily: FONT.family, letterSpacing: '-1.5px',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
          }}>
            {formatAmount(balance, currency)}
          </div>
        )}
      </div>

      {/* Stats row */}
      {!isHidden && stats && (
        <div style={{ display: 'flex', gap: SPACE.xl }}>
          {[
            { label: 'Income',  value: stats.income,  color: COLORS.income },
            { label: 'Expense', value: stats.expense, color: COLORS.expense },
            { label: 'Net',     value: Math.abs(net), color: net >= 0 ? COLORS.income : COLORS.expense },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                fontFamily: FONT.family, letterSpacing: '0.8px', textTransform: 'uppercase',
                marginBottom: 3,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: '14px', fontWeight: 700, color: s.color,
                fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
              }}>
                {s.label === 'Net' && net < 0 ? '−' : ''}{formatAmount(s.value, currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cash Flow Chart ──────────────────────────────────────────────────────────
function CashFlowChart({ transactions, currency }) {
  const data = useMemo(
    () => buildDailyTimeSeries(transactions, currency),
    [transactions, currency]
  );

  if (data.length === 0) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: FONT.footnote.size, color: COLORS.labelTertiary, fontFamily: FONT.family }}>
        No data for this period
      </span>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(28,28,30,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: RADIUS.lg,
        padding: '10px 14px',
        boxShadow: SHADOW.lg,
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: FONT.family, marginBottom: 4 }}>
          {label}
        </div>
        {payload.map(p => (
          <div key={p.name} style={{ fontSize: '13px', fontWeight: 600, color: p.color, fontFamily: FONT.family }}>
            {p.name}: {formatAmount(p.value, currency)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLORS.income}  stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS.income}  stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLORS.expense} stopOpacity={0.20} />
            <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }}
          tickLine={false} axisLine={false}
          tickFormatter={d => {
            const dt = new Date(d);
            return dt.toLocaleDateString('default', { month: 'short', day: 'numeric' });
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }}
          tickLine={false} axisLine={false}
          tickFormatter={v => formatAmount(v, currency)}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="income"  name="Income"
          stroke={COLORS.income}  strokeWidth={2}
          fill="url(#incomeGrad)"  dot={false} activeDot={{ r: 4, fill: COLORS.income }} />
        <Area type="monotone" dataKey="expense" name="Expense"
          stroke={COLORS.expense} strokeWidth={2}
          fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: COLORS.expense }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Top Categories ────────────────────────────────────────────────────────────
function TopCategories({ transactions, categories, currency, onCategoryPress }) {
  const breakdown = useMemo(
    () => buildCategoryBreakdown(transactions, categories, currency).slice(0, 5),
    [transactions, categories, currency]
  );

  if (breakdown.length === 0) return (
    <div style={{ padding: `${SPACE.lg}px`, textAlign: 'center' }}>
      <span style={{ fontSize: FONT.footnote.size, color: COLORS.labelTertiary, fontFamily: FONT.family }}>
        No expenses this period
      </span>
    </div>
  );

  const max = breakdown[0]?.amount ?? 1;

  return (
    <div style={{ padding: `${SPACE.sm}px 0` }}>
      {breakdown.map((cat, i) => (
        <button
          key={cat.categoryId}
          onClick={() => onCategoryPress(cat.categoryId)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md,
            padding: `${SPACE.md}px ${SPACE.lg}px`,
            background: 'transparent', border: 'none', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            animation: `mv6-fade-in ${ANIM.normal}ms ${ANIM.ease} ${i * 60}ms both`,
          }}
        >
          {/* Color dot + icon */}
          <div style={{
            width: 36, height: 36, borderRadius: RADIUS.lg,
            background: `${cat.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name={cat.icon} size={18} color={cat.color} strokeWidth={1.75} />
          </div>

          {/* Bar + label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{
                fontSize: FONT.subheadline.size, fontWeight: FONT.medium,
                color: COLORS.labelPrimary, fontFamily: FONT.family,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: '60%',
              }}>
                {cat.name}
              </span>
              <span style={{
                fontSize: FONT.subheadline.size, fontWeight: FONT.semibold,
                color: COLORS.labelPrimary, fontFamily: FONT.family,
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>
                {formatAmount(cat.amount, currency)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <div style={{ flex: 1, height: 4, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(cat.amount / max) * 100}%`,
                  background: cat.color,
                  borderRadius: RADIUS.full,
                  transition: `width 0.8s ${ANIM.spring}`,
                }} />
              </div>
              <span style={{
                fontSize: FONT.caption2.size, fontWeight: FONT.semibold,
                color: COLORS.labelTertiary, fontFamily: FONT.family, flexShrink: 0,
              }}>
                {cat.percentage}%
              </span>
            </div>
          </div>

          <Icon name="ChevronRight" size={14} color={COLORS.labelQuaternary} strokeWidth={2.5} />
        </button>
      ))}
    </div>
  );
}

// ─── Recent Transaction Row ───────────────────────────────────────────────────
function RecentTxRow({ t, accounts, categories, onPress, index }) {
  const [pressed, setPressed] = useState(false);
  const cat    = categories.find(c => c.id === t.categoryId);
  const acc    = accounts.find(a => a.id === t.accountId);
  const isInc  = t.type === 'income' || t.type === 'in_transfer';
  const isTx   = ['transfer','out_transfer','in_transfer'].includes(t.type);

  return (
    <button
      onClick={() => onPress(t)}
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
        animation: `mv6-fade-in ${ANIM.normal}ms ${ANIM.ease} ${index * 40}ms both`,
      }}
    >
      <TxIcon type={t.type} category={cat} size={42} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: FONT.callout.size, fontWeight: FONT.medium,
          color: COLORS.labelPrimary, fontFamily: FONT.family,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t.note || cat?.name || (isTx ? 'Transfer' : 'Transaction')}
        </div>
        <div style={{
          fontSize: FONT.caption1.size, color: COLORS.labelTertiary,
          fontFamily: FONT.family, marginTop: 2,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span>
            {t.dateObj?.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
          </span>
          {acc && (
            <>
              <span>·</span>
              <span style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.4px' }}>
                {acc.name}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: FONT.callout.size, fontWeight: FONT.bold,
          color: isInc ? COLORS.income : isTx ? COLORS.transfer : COLORS.labelPrimary,
          fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
        }}>
          {isInc ? '+' : isTx ? '' : '−'}
          {formatAmount(t.amount, t.currency)}
        </div>
        <div style={{
          fontSize: '10px', fontWeight: 600, color: COLORS.labelQuaternary,
          fontFamily: FONT.family, letterSpacing: '0.5px', marginTop: 1,
        }}>
          {t.currency}
        </div>
      </div>
    </button>
  );
}

// ─── Currency Tabs ────────────────────────────────────────────────────────────
function CurrencyTabs({ currencies, active, onChange }) {
  if (currencies.length <= 1) return null;
  return (
    <div style={{
      display: 'flex', gap: SPACE.xs,
      padding: `${SPACE.sm}px ${SPACE.lg}px`,
      overflowX: 'auto', scrollbarWidth: 'none',
    }}>
      {currencies.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            padding: '5px 14px', borderRadius: RADIUS.full,
            background: active === c ? COLORS.blue : COLORS.fillTertiary,
            border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: FONT.semibold,
            color: active === c ? '#fff' : COLORS.labelSecondary,
            fontFamily: FONT.family, flexShrink: 0,
            transition: `all ${ANIM.fast}ms ${ANIM.spring}`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const navigate   = useNavigate();
  const { filter } = useFilter();

  const { accounts, loading: accLoading }             = useAccounts(user.uid);
  const { categories }                                = useCategories(user.uid);
  const { transactions, loading: txLoading }          = useTransactions(user.uid, filter);
  const { isHidden, toggle: toggleHide }              = useHiddenBalances(user.uid);

  // ── per-currency stats from transactions ─────────────────────────────────────
  const statsByCurrency = useMemo(
    () => calcStatsByCurrency(transactions),
    [transactions]
  );

  // ── net worth per currency from account balances ──────────────────────────────
  const netWorth = useMemo(
    () => calcNetWorthByCurrency(accounts),
    [accounts]
  );

  // ── currencies that appear (union of accounts + transactions) ────────────────
  const currencies = useMemo(() => {
    const set = new Set([
      ...accounts.map(a => a.currency).filter(Boolean),
      ...Object.keys(statsByCurrency),
    ]);
    return [...set];
  }, [accounts, statsByCurrency]);

  const [activeCurrency, setActiveCurrency] = useState(() => currencies[0] || 'KWD');

  // Keep activeCurrency valid when currencies list changes
  React.useEffect(() => {
    if (currencies.length > 0 && !currencies.includes(activeCurrency)) {
      setActiveCurrency(currencies[0]);
    }
  }, [currencies]);

  const recent = useMemo(
    () => sortByDateDesc(transactions).slice(0, 8),
    [transactions]
  );

  const isLoading = accLoading || txLoading;
  const filterLabel = getFilterLabel(filter);

  // ── Hero card scroll ──────────────────────────────────────────────────────────
  const scrollRef = useRef(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / 316);
    setHeroIndex(idx);
    if (currencies[idx]) setActiveCurrency(currencies[idx]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: SPACE.xl }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div style={{
        padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: FONT.subheadline.size, color: COLORS.labelTertiary,
            fontFamily: FONT.family, marginBottom: 2,
          }}>
            {greeting()},
          </div>
          <div style={{
            fontSize: FONT.title1.size, fontWeight: FONT.bold,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
            letterSpacing: '-0.5px',
          }}>
            {user.displayName?.split(' ')[0] || 'there'}
          </div>
          <div style={{
            fontSize: FONT.caption1.size, color: COLORS.labelTertiary,
            fontFamily: FONT.family, marginTop: 3,
          }}>
            {new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Period badge */}
        <div style={{
          padding: '6px 12px', borderRadius: RADIUS.full,
          background: COLORS.fillTertiary,
          fontSize: '12px', fontWeight: FONT.semibold,
          color: COLORS.labelSecondary, fontFamily: FONT.family,
        }}>
          {filterLabel}
        </div>
      </div>

      {/* ── Hero balance cards ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ padding: `0 ${SPACE.lg}px`, marginBottom: SPACE.lg }}>
          <Skeleton height={180} radius={RADIUS.xxl} />
        </div>
      ) : currencies.length === 0 ? (
        <div style={{ padding: `0 ${SPACE.lg}px`, marginBottom: SPACE.lg }}>
          <EmptyState
            icon="Wallet"
            title="No accounts yet"
            message="Add your first account to start tracking"
            action={() => navigate('/accounts')}
            actionLabel="Add Account"
          />
        </div>
      ) : (
        <div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: 'flex', gap: SPACE.md,
              padding: `0 ${SPACE.lg}px`,
              overflowX: 'auto', scrollbarWidth: 'none',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              marginBottom: SPACE.md,
            }}
          >
            {currencies.map((c, i) => (
              <div key={c} style={{ scrollSnapAlign: 'start' }}>
                <HeroCard
                  currency={c}
                  balance={netWorth[c] ?? 0}
                  stats={statsByCurrency[c]}
                  isHidden={isHidden(`hero_${c}`)}
                  onToggleHide={() => toggleHide(`hero_${c}`)}
                  index={i}
                />
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          {currencies.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: SPACE.sm }}>
              {currencies.map((_, i) => (
                <div key={i} style={{
                  width: i === heroIndex ? 18 : 6, height: 6,
                  borderRadius: RADIUS.full,
                  background: i === heroIndex ? COLORS.blue : COLORS.fillSecondary,
                  transition: `all ${ANIM.normal}ms ${ANIM.spring}`,
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Currency selector tabs ──────────────────────────────────────────────── */}
      <CurrencyTabs
        currencies={currencies}
        active={activeCurrency}
        onChange={setActiveCurrency}
      />

      {/* ── Cash Flow Chart ─────────────────────────────────────────────────────── */}
      <div style={{ margin: `${SPACE.md}px ${SPACE.lg}px` }}>
        <div style={{
          background: COLORS.surface, borderRadius: RADIUS.xl,
          overflow: 'hidden', boxShadow: SHADOW.sm,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px`,
          }}>
            <span style={{
              fontSize: FONT.headline.size, fontWeight: FONT.semibold,
              color: COLORS.labelPrimary, fontFamily: FONT.family,
            }}>
              Cash Flow
            </span>
            <div style={{ display: 'flex', gap: SPACE.md }}>
              {[{ color: COLORS.income, label: 'In' }, { color: COLORS.expense, label: 'Out' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: '11px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div style={{ padding: SPACE.lg }}><Skeleton height={140} radius={RADIUS.md} /></div>
          ) : (
            <div style={{ padding: `0 ${SPACE.sm}px ${SPACE.lg}px` }}>
              <CashFlowChart transactions={transactions} currency={activeCurrency} />
            </div>
          )}
        </div>
      </div>

      {/* ── Top Categories ──────────────────────────────────────────────────────── */}
      <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.md}px` }}>
        <div style={{
          background: COLORS.surface, borderRadius: RADIUS.xl,
          overflow: 'hidden', boxShadow: SHADOW.sm,
        }}>
          <SectionHeader
            title="Top Categories"
            action={() => navigate('/insights')}
            actionLabel="See All"
            style={{ padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px` }}
          />
          {isLoading ? (
            <div style={{ padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
              {[1,2,3].map(i => <Skeleton key={i} height={40} radius={RADIUS.lg} />)}
            </div>
          ) : (
            <TopCategories
              transactions={transactions}
              categories={categories}
              currency={activeCurrency}
              onCategoryPress={id => navigate(`/categories/${id}`)}
            />
          )}
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────────── */}
      <div style={{ margin: `0 ${SPACE.lg}px` }}>
        <div style={{
          background: COLORS.surface, borderRadius: RADIUS.xl,
          overflow: 'hidden', boxShadow: SHADOW.sm,
        }}>
          <SectionHeader
            title="Recent Activity"
            action={() => navigate('/records')}
            actionLabel="See All"
            style={{ padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px` }}
          />

          {isLoading ? (
            <div style={{ padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
              {[1,2,3,4].map(i => <Skeleton key={i} height={56} radius={RADIUS.lg} />)}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon="ReceiptText"
              title="No transactions"
              message={`Nothing recorded for ${filterLabel.toLowerCase()}`}
              action={() => openAddTransaction()}
              actionLabel="Add First Transaction"
            />
          ) : (
            <div>
              {recent.map((t, i) => (
                <React.Fragment key={t.id}>
                  <RecentTxRow
                    t={t} accounts={accounts} categories={categories}
                    onPress={openAddTransaction}
                    index={i}
                  />
                  {i < recent.length - 1 && (
                    <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 74 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}