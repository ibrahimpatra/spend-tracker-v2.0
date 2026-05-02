// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Categories.jsx
// • Expense / Income segmented tabs
// • Spending amount + progress bar per category for the global filter period
// • Per-currency support — tab to switch currency view
// • Tap category → /categories/:id (real URL drill-down)
// • Add Category modal: name, color (10 presets + custom), icon (30 icons)
// • Delete category (transactions become Uncategorized)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM,
  CATEGORY_COLORS, CATEGORY_ICONS,
  DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES,
} from '../constants';
import { useFilter } from '../context/FilterContext';
import { useCategories, useTransactions } from '../hooks/useData';
import { buildCategoryBreakdown, calcStatsByCurrency } from '../utils/currency';
import {
  Icon, SegmentedControl, BottomSheet, AlertDialog,
  Skeleton, EmptyState, Spinner, PillButton, toast,
} from '../components/ui';
import AddCategoryOverlay from '../components/AddCategoryOverlay';
import { openAddTransaction } from '../components/Layout';

// ─── Category Row ─────────────────────────────────────────────────────────────
function CategoryRow({ cat, amount, currency, percentage, max, onPress, onLongPress, index }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => onPress(cat)}
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
        animation: `mv6-fade-in ${ANIM.normal}ms ease ${Math.min(index * 40, 400)}ms both`,
      }}
    >
      {/* Icon blob */}
      <div style={{
        width: 44, height: 44, borderRadius: RADIUS.lg,
        background: `${cat.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={cat.icon} size={20} color={cat.color} strokeWidth={1.75} />
      </div>

      {/* Name + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{
            fontSize: FONT.callout.size, fontWeight: FONT.medium,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%',
          }}>
            {cat.name}
          </span>
          <span style={{
            fontSize: FONT.callout.size, fontWeight: FONT.semibold,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            {amount > 0 ? `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
          <div style={{ flex: 1, height: 4, background: COLORS.fillTertiary, borderRadius: RADIUS.full, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${max > 0 ? (amount / max) * 100 : 0}%`,
              background: cat.color,
              borderRadius: RADIUS.full,
              transition: `width 0.8s ${ANIM.spring}`,
            }} />
          </div>
          <span style={{
            fontSize: FONT.caption2.size, fontWeight: FONT.semibold,
            color: COLORS.labelTertiary, fontFamily: FONT.family, flexShrink: 0, minWidth: 28,
          }}>
            {percentage}%
          </span>
        </div>
      </div>

      <Icon name="ChevronRight" size={14} color={COLORS.labelQuaternary} strokeWidth={2.5} />
    </button>
  );
}

// ─── Add Category Sheet ───────────────────────────────────────────────────────

export default function Categories({ user }) {
  const navigate   = useNavigate();
  const { filter } = useFilter();

  const { categories, loading: catLoading, addCategory, deleteCategory } = useCategories(user.uid);
  const { transactions, loading: txLoading }  = useTransactions(user.uid, filter);

  const [activeTab,  setActiveTab]  = useState('expense');
  const [activeCurr, setActiveCurr] = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Available currencies from transactions
  const currencies = useMemo(() => {
    const s = new Set(transactions.map(t => t.currency).filter(Boolean));
    return [...s];
  }, [transactions]);

  const currency = activeCurr || currencies[0] || 'KWD';

  // Category breakdown for active tab + currency
  const breakdown = useMemo(() => {
    const expCats = categories.filter(c => c.type !== 'income');
    const incCats = categories.filter(c => c.type === 'income');
    const activeCats = activeTab === 'income' ? incCats : expCats;

    const txFiltered = transactions.filter(t =>
      activeTab === 'income'
        ? (t.type === 'income' || t.type === 'in_transfer')
        : (t.type === 'expense' || t.type === 'out_transfer')
    );

    const map = {};
    txFiltered.filter(t => t.currency === currency).forEach(t => {
      const cid = t.categoryId || '__uncategorized__';
      if (!map[cid]) map[cid] = 0;
      map[cid] += t.amount || 0;
    });

    const total = Object.values(map).reduce((s, v) => s + v, 0);

    return activeCats.map(cat => ({
      cat,
      amount: map[cat.id] || 0,
      percentage: total > 0 ? Math.round(((map[cat.id] || 0) / total) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [categories, transactions, activeTab, currency]);

  const max = breakdown[0]?.amount || 0;

  // Seed default categories if empty
  const handleInitDefaults = async () => {
    setSaving(true);
    try {
      const defaults = activeTab === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
      for (const cat of defaults) {
        await addCategory({ ...cat, type: activeTab });
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAdd = async (payload) => {
    setSaving(true);
    try { await addCategory(payload); setShowAdd(false); toast.show('Category added'); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteCategory(deleteTarget.id); }
    catch (e) { console.error(e); }
    finally { setDeleteTarget(null); }
  };

  const tabCategories = categories.filter(c =>
    activeTab === 'income' ? c.type === 'income' : c.type !== 'income'
  );

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{
          margin: 0, fontSize: FONT.largeTitle.size, fontWeight: FONT.bold,
          color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-0.5px',
        }}>
          Categories
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 36, height: 36, borderRadius: RADIUS.full,
            background: COLORS.blue, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: SHADOW.md,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="Plus" size={18} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      {/* Expense / Income tabs */}
      <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.md}px` }}>
        <SegmentedControl
          options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Currency tabs */}
      {currencies.length > 1 && (
        <div style={{ display: 'flex', gap: SPACE.xs, padding: `0 ${SPACE.lg}px ${SPACE.md}px`, overflowX: 'auto' }}>
          {currencies.map(c => (
            <button
              key={c} onClick={() => setActiveCurr(c)}
              style={{
                padding: '5px 14px', borderRadius: RADIUS.full,
                background: currency === c ? COLORS.blue : COLORS.fillTertiary,
                border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: FONT.semibold,
                color: currency === c ? '#fff' : COLORS.labelSecondary,
                fontFamily: FONT.family, flexShrink: 0,
                transition: `all ${ANIM.fast}ms ${ANIM.spring}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {catLoading || txLoading ? (
        <div style={{ padding: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={64} radius={i === 0 ? `${RADIUS.xl}px ${RADIUS.xl}px 0 0` : i === 4 ? `0 0 ${RADIUS.xl}px ${RADIUS.xl}px` : 0} />)}
        </div>
      ) : tabCategories.length === 0 ? (
        <EmptyState
            accentColor={COLORS.purple}
          icon="Tag"
          title={`No ${activeTab} categories`}
          message="Add your first category or load the defaults"
          action={handleInitDefaults}
          actionLabel={saving ? 'Loading...' : 'Load Defaults'}
        />
      ) : (
        <div style={{ margin: `0 ${SPACE.lg}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            {breakdown.map(({ cat, amount, percentage }, i, arr) => (
              <React.Fragment key={cat.id}>
                <CategoryRow
                  cat={cat} amount={amount} currency={currency}
                  percentage={percentage} max={max}
                  onPress={c => navigate(`/categories/${c.id}`)}
                  onLongPress={c => setDeleteTarget(c)}
                  index={i}
                />
                {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 72 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <AddCategoryOverlay
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          saving={saving}
          defaultType={activeTab}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Existing transactions will show as Uncategorized.`}
        confirmLabel="Delete" confirmDestructive
        onConfirm={handleDelete}
      />
    </div>
  );
}