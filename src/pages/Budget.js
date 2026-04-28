// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Budget.jsx
// Budget Baker style. Per-category monthly budgets.
// • Month navigator (back / forward arrows)
// • Overall budget ring — total spent vs total budgeted
// • Per-category rows: progress bar blue → orange @80% → red @100%
// • Unbudgeted spending shown separately below
// • Set budget via bottom sheet (amount + currency)
// • Remove individual budgets
// • Reacts to global filter's currency selection
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, CURRENCIES, DEFAULT_CURRENCY } from '../constants';
import { useCategories, useTransactions, useBudgets } from '../hooks/useData';
import { formatAmount } from '../utils/currency';
import {
  Icon, BottomSheet, AlertDialog, Skeleton, EmptyState, Spinner,
  SegmentedControl,
} from '../components/ui';

// ─── helpers ──────────────────────────────────────────────────────────────────
const monthKey   = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;
const monthLabel = (y, m) => new Date(y, m, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

// ─── Overall ring ─────────────────────────────────────────────────────────────
function BudgetRing({ spent, budgeted, currency }) {
  const pct    = budgeted > 0 ? Math.min(spent / budgeted, 1) : 0;
  const over   = spent > budgeted && budgeted > 0;
  const r      = 54;
  const circ   = 2 * Math.PI * r;
  const dash   = circ * pct;
  const ringColor = pct >= 1 ? COLORS.red : pct >= 0.8 ? COLORS.orange : COLORS.blue;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE.sm }}>
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="64" cy="64" r={r} fill="none" stroke={COLORS.fillTertiary} strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke={ringColor} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: `stroke-dasharray 0.8s ${ANIM.spring}, stroke 0.3s` }}
          />
        </svg>
        {/* Centre text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: ringColor,
            fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(pct * 100)}%
          </div>
          <div style={{ fontSize: '10px', color: COLORS.labelTertiary, fontFamily: FONT.family }}>
            {over ? 'over' : 'used'}
          </div>
        </div>
      </div>

      {budgeted > 0 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: FONT.subheadline.size, fontFamily: FONT.family }}>
            <span style={{ fontWeight: 700, color: over ? COLORS.red : COLORS.labelPrimary, fontVariantNumeric: 'tabular-nums' }}>
              {currency} {formatAmount(spent, currency)}
            </span>
            <span style={{ color: COLORS.labelTertiary }}>
              {' '}/ {formatAmount(budgeted, currency)}
            </span>
          </div>
          <div style={{
            fontSize: FONT.caption1.size, color: over ? COLORS.red : COLORS.labelSecondary,
            fontFamily: FONT.family, marginTop: 2,
          }}>
            {over
              ? `${currency} ${formatAmount(spent - budgeted, currency)} over budget`
              : `${currency} ${formatAmount(budgeted - spent, currency)} remaining`
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Budget Row ───────────────────────────────────────────────────────────────
function BudgetRow({ cat, spent, budgeted, currency, onSetBudget, onRemove, onPress, index }) {
  const [pressed, setPressed] = useState(false);
  const pct       = budgeted > 0 ? Math.min(spent / budgeted, 1) : 0;
  const pctNum    = Math.round(pct * 100);
  const barColor  = pct >= 1 ? COLORS.red : pct >= 0.8 ? COLORS.orange : COLORS.blue;
  const over      = spent > budgeted && budgeted > 0;

  return (
    <button
      onClick={() => onPress(cat)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: SPACE.md,
        padding: `${SPACE.md}px ${SPACE.lg}px`,
        background: pressed ? COLORS.fillTertiary : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: `background ${ANIM.fast}ms`,
        WebkitTapHighlightColor: 'transparent',
        animation: `mv6-fade-in ${ANIM.normal}ms ease ${Math.min(index * 50, 400)}ms both`,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: RADIUS.lg,
        background: `${cat.color}18`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={cat.icon} size={19} color={cat.color} strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{
            fontSize: FONT.callout.size, fontWeight: FONT.medium,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
          }}>
            {cat.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, flexShrink: 0 }}>
            {budgeted > 0 ? (
              <span style={{
                fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
                color: over ? COLORS.red : COLORS.labelSecondary,
                fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
              }}>
                {formatAmount(spent, currency)} / {formatAmount(budgeted, currency)}
              </span>
            ) : (
              <span style={{ fontSize: FONT.footnote.size, color: COLORS.labelTertiary, fontFamily: FONT.family }}>
                {spent > 0 ? formatAmount(spent, currency) : 'No budget'}
              </span>
            )}
            {/* Edit / set budget */}
            <button
              onClick={e => { e.stopPropagation(); onSetBudget(cat); }}
              style={{
                width: 26, height: 26, borderRadius: RADIUS.full,
                background: COLORS.fillTertiary, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon name={budgeted > 0 ? 'Pencil' : 'Plus'} size={12} color={COLORS.blue} strokeWidth={2} />
            </button>
            {budgeted > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onRemove(cat); }}
                style={{
                  width: 26, height: 26, borderRadius: RADIUS.full,
                  background: `${COLORS.red}12`, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon name="X" size={12} color={COLORS.red} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar — only if budget set */}
        {budgeted > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
            <div style={{ flex: 1, height: 5, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pctNum}%`,
                background: barColor,
                borderRadius: RADIUS.full,
                transition: `width 0.7s ${ANIM.spring}, background 0.3s`,
              }} />
            </div>
            <span style={{
              fontSize: FONT.caption2.size, fontWeight: FONT.semibold,
              color: barColor, fontFamily: FONT.family, minWidth: 30,
            }}>
              {pctNum}%
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Set Budget Sheet ─────────────────────────────────────────────────────────
function SetBudgetSheet({ open, onClose, category, onSave, month, saving }) {
  const [amount,   setAmount]   = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  React.useEffect(() => {
    if (open) { setAmount(''); }
  }, [open, category?.id]);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onSave(category.id, month, val, currency);
  };

  if (!category) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title={`Budget — ${category.name}`} height={340}>
      <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.xl}px`, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
        {/* Category preview */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: SPACE.md,
          background: COLORS.fillTertiary, borderRadius: RADIUS.xl,
          padding: `${SPACE.md}px`,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: RADIUS.lg,
            background: `${category.color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={category.icon} size={22} color={category.color} strokeWidth={1.75} />
          </div>
          <div>
            <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>{category.name}</div>
            <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family }}>{month}</div>
          </div>
        </div>

        {/* Amount + Currency */}
        <div style={{ display: 'flex', gap: SPACE.md }}>
          <input
            type="number" inputMode="decimal"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.000"
            style={{
              flex: 1, padding: `${SPACE.md}px`, borderRadius: RADIUS.lg,
              border: `1.5px solid ${COLORS.separatorOpaque}`,
              fontSize: '24px', fontWeight: 700, textAlign: 'right',
              fontFamily: FONT.family, color: COLORS.labelPrimary,
              background: COLORS.bgPrimary, outline: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <select
            value={currency} onChange={e => setCurrency(e.target.value)}
            style={{
              width: 90, padding: `${SPACE.md}px`, borderRadius: RADIUS.lg,
              border: `1.5px solid ${COLORS.separatorOpaque}`,
              fontSize: FONT.callout.size, fontFamily: FONT.family,
              color: COLORS.labelPrimary, background: COLORS.bgPrimary,
              outline: 'none',
            }}
          >
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>

        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '17px', borderRadius: RADIUS.xl,
            background: COLORS.blue, border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving
            ? <Spinner size={20} color="#fff" />
            : <span style={{ fontSize: '17px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>Set Budget</span>
          }
        </button>
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Budget({ user }) {
  const navigate = useNavigate();
  const now = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [activeCurr, setActiveCurr] = useState(DEFAULT_CURRENCY);
  const [setBudgetFor,  setSetBudgetFor]  = useState(null);
  const [removeTarget,  setRemoveTarget]  = useState(null);
  const [saving, setSaving] = useState(false);

  const { categories, loading: catLoading }  = useCategories(user.uid);
  const { budgets, setBudget, removeBudget } = useBudgets(user.uid);

  // Transactions for the selected month — all time filter, scoped to month
  const monthFilter = useMemo(() => ({
    dateRange: 'custom',
    accountIds: [],
    customStart: new Date(year, month, 1).toISOString().split('T')[0],
    customEnd:   new Date(year, month + 1, 0).toISOString().split('T')[0],
  }), [year, month]);

  const { transactions } = useTransactions(user.uid, monthFilter);

  const mKey = monthKey(year, month);
  const mLabel = monthLabel(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Expense categories only
  const expenseCats = useMemo(
    () => categories.filter(c => c.type !== 'income'),
    [categories]
  );

  // Spending per category for this month + currency
  const spending = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === 'expense' && t.currency === activeCurr)
      .forEach(t => {
        const cid = t.categoryId || '__none__';
        map[cid] = (map[cid] || 0) + (t.amount || 0);
      });
    return map;
  }, [transactions, activeCurr]);

  // Budgets for this month + currency
  const getBudget = useCallback((catId) => {
    const b = budgets.find(b => b.categoryId === catId && b.month === mKey);
    return b?.amount || 0;
  }, [budgets, mKey]);

  // Totals
  const { totalSpent, totalBudgeted } = useMemo(() => {
    let spent = 0, budgeted = 0;
    expenseCats.forEach(cat => {
      spent    += spending[cat.id] || 0;
      budgeted += getBudget(cat.id);
    });
    return { totalSpent: spent, totalBudgeted: budgeted };
  }, [expenseCats, spending, getBudget]);

  // Unbudgeted spending
  const unbudgeted = useMemo(() => {
    const unbudgetedCatIds = expenseCats.filter(c => !getBudget(c.id)).map(c => c.id);
    return unbudgetedCatIds.reduce((s, id) => s + (spending[id] || 0), 0)
      + (spending['__none__'] || 0);
  }, [expenseCats, spending, getBudget]);

  // Currencies from transactions
  const currencies = useMemo(() => [...new Set(transactions.map(t => t.currency).filter(Boolean))], [transactions]);

  const handleSetBudget = async (catId, month, amount) => {
    setSaving(true);
    try { await setBudget(catId, month, amount); setSetBudgetFor(null); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleRemoveBudget = async () => {
    if (!removeTarget) return;
    const b = budgets.find(b => b.categoryId === removeTarget.id && b.month === mKey);
    if (b) await removeBudget(b.id);
    setRemoveTarget(null);
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────────── */}
      <div style={{ padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px` }}>
        <h1 style={{
          margin: 0, fontSize: FONT.largeTitle.size, fontWeight: FONT.bold,
          color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-0.5px',
        }}>
          Budget
        </h1>
      </div>

      {/* ── Month navigator ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${SPACE.lg}px ${SPACE.lg}px`,
      }}>
        <button
          onClick={prevMonth}
          style={{
            width: 38, height: 38, borderRadius: RADIUS.full,
            background: COLORS.fillTertiary, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="ChevronLeft" size={18} color={COLORS.labelSecondary} strokeWidth={2.5} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: FONT.title3.size, fontWeight: FONT.semibold,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
          }}>
            {mLabel}
          </div>
          {isCurrentMonth && (
            <div style={{
              fontSize: FONT.caption2.size, color: COLORS.blue,
              fontFamily: FONT.family, fontWeight: FONT.semibold,
            }}>
              Current Month
            </div>
          )}
        </div>

        <button
          onClick={nextMonth}
          style={{
            width: 38, height: 38, borderRadius: RADIUS.full,
            background: COLORS.fillTertiary, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="ChevronRight" size={18} color={COLORS.labelSecondary} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Currency tabs ────────────────────────────────────────────────────────── */}
      {currencies.length > 1 && (
        <div style={{ display: 'flex', gap: SPACE.xs, padding: `0 ${SPACE.lg}px ${SPACE.md}px`, overflowX: 'auto' }}>
          {currencies.map(c => (
            <button key={c} onClick={() => setActiveCurr(c)} style={{
              padding: '5px 14px', borderRadius: RADIUS.full,
              background: activeCurr === c ? COLORS.blue : COLORS.fillTertiary,
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: FONT.semibold,
              color: activeCurr === c ? '#fff' : COLORS.labelSecondary,
              fontFamily: FONT.family, flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}>{c}</button>
          ))}
        </div>
      )}

      {/* ── Overall ring ─────────────────────────────────────────────────────────── */}
      {totalBudgeted > 0 && (
        <div style={{
          margin: `0 ${SPACE.lg}px ${SPACE.lg}px`,
          background: COLORS.surface, borderRadius: RADIUS.xxl,
          padding: SPACE.xl, boxShadow: SHADOW.sm,
          display: 'flex', justifyContent: 'center',
        }}>
          <BudgetRing spent={totalSpent} budgeted={totalBudgeted} currency={activeCurr} />
        </div>
      )}

      {/* ── Category budgets ─────────────────────────────────────────────────────── */}
      {catLoading ? (
        <div style={{ margin: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => <div key={i} style={{ height: 68, background: COLORS.surface, borderRadius: i === 0 ? `${RADIUS.xl}px ${RADIUS.xl}px 0 0` : i === 4 ? `0 0 ${RADIUS.xl}px ${RADIUS.xl}px` : 0 }} />)}
        </div>
      ) : expenseCats.length === 0 ? (
        <EmptyState
          icon="Target"
          title="No expense categories"
          message="Add categories first, then set budgets for them"
          action={() => navigate('/categories')}
          actionLabel="Go to Categories"
        />
      ) : (
        <div style={{ margin: `0 ${SPACE.lg}px` }}>
          {/* Budgeted categories */}
          {(() => {
            const budgeted = expenseCats.filter(c => getBudget(c.id) > 0);
            const unset    = expenseCats.filter(c => getBudget(c.id) === 0);

            return (
              <>
                {budgeted.length > 0 && (
                  <div style={{ marginBottom: SPACE.md }}>
                    <div style={{
                      fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
                      color: COLORS.labelSecondary, textTransform: 'uppercase',
                      letterSpacing: '0.8px', fontFamily: FONT.family,
                      padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
                    }}>
                      Budgeted
                    </div>
                    <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
                      {budgeted.map((cat, i, arr) => (
                        <React.Fragment key={cat.id}>
                          <BudgetRow
                            cat={cat}
                            spent={spending[cat.id] || 0}
                            budgeted={getBudget(cat.id)}
                            currency={activeCurr}
                            onSetBudget={setSetBudgetFor}
                            onRemove={setRemoveTarget}
                            onPress={c => navigate(`/categories/${c.id}`)}
                            index={i}
                          />
                          {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 68 }} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unbudgeted spending total */}
                {unbudgeted > 0 && (
                  <div style={{
                    margin: `0 0 ${SPACE.md}px`,
                    background: `${COLORS.orange}10`,
                    borderRadius: RADIUS.xl, padding: `${SPACE.md}px ${SPACE.lg}px`,
                    display: 'flex', alignItems: 'center', gap: SPACE.md,
                    border: `1px solid ${COLORS.orange}25`,
                  }}>
                    <Icon name="AlertCircle" size={18} color={COLORS.orange} strokeWidth={2} />
                    <div>
                      <div style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>
                        Unbudgeted Spending
                      </div>
                      <div style={{ fontSize: FONT.footnote.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>
                        {activeCurr} {formatAmount(unbudgeted, activeCurr)} across untracked categories
                      </div>
                    </div>
                  </div>
                )}

                {/* No-budget categories */}
                {unset.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
                      color: COLORS.labelSecondary, textTransform: 'uppercase',
                      letterSpacing: '0.8px', fontFamily: FONT.family,
                      padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
                    }}>
                      No Budget Set
                    </div>
                    <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
                      {unset.map((cat, i, arr) => (
                        <React.Fragment key={cat.id}>
                          <BudgetRow
                            cat={cat}
                            spent={spending[cat.id] || 0}
                            budgeted={0}
                            currency={activeCurr}
                            onSetBudget={setSetBudgetFor}
                            onRemove={() => {}}
                            onPress={c => navigate(`/categories/${c.id}`)}
                            index={budgeted.length + i}
                          />
                          {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 68 }} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Set budget sheet ─────────────────────────────────────────────────────── */}
      <SetBudgetSheet
        open={!!setBudgetFor}
        onClose={() => setSetBudgetFor(null)}
        category={setBudgetFor}
        month={mKey}
        onSave={handleSetBudget}
        saving={saving}
      />

      {/* ── Remove confirm ────────────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Budget"
        message={`Remove the budget for "${removeTarget?.name}" in ${mLabel}?`}
        confirmLabel="Remove" confirmDestructive
        onConfirm={handleRemoveBudget}
      />
    </div>
  );
}