// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Records.jsx
// Full transaction history.
// • Global filter (date + account) from FilterContext
// • Live search by note / amount
// • Group by: Date / Month / Account / Currency / Type (multi-level)
// • Per-currency totals bar (never mixed)
// • Click row → opens AddTransaction in edit mode
// • Grouping open/close is per-group (bug from v5 fixed)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFilter, getFilterLabel } from '../context/FilterContext';
import { useAccounts, useCategories, useTransactions } from '../hooks/useData';
import { calcStatsByCurrency, formatAmount, sortByDateDesc } from '../utils/currency';
import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM } from '../constants';
import {
  Icon, InsetCard, SectionHeader, TxIcon,
  Skeleton, EmptyState, CurrencyStatRow, Separator,
} from '../components/ui';
import { openAddTransaction } from '../components/Layout';

// ─── Dimension definitions ────────────────────────────────────────────────────
const DIMENSIONS = {
  date:     { label: 'Date',     getValue: (t)            => safeDate(t.dateObj).toLocaleDateString('default', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
  month:    { label: 'Month',    getValue: (t)            => safeDate(t.dateObj).toLocaleString('default', { month: 'long', year: 'numeric' }) },
  week:     { label: 'Week',     getValue: (t)            => { const d = safeDate(t.dateObj); const start = new Date(d); start.setDate(d.getDate() - d.getDay()); return 'Week of ' + start.toLocaleDateString('default', { month: 'short', day: 'numeric' }); } },
  account:  { label: 'Account',  getValue: (t, accs)      => accs.find(a => a.id === t.accountId)?.name || 'Unknown' },
  category: { label: 'Category', getValue: (t, _, cats)   => cats.find(c => c.id === t.categoryId)?.name || (t.type === 'income' ? 'Income' : ['transfer','out_transfer','in_transfer'].includes(t.type) ? 'Transfer' : 'Uncategorized') },
  currency: { label: 'Currency', getValue: (t)            => t.currency || '' },
  type:     { label: 'Type',     getValue: (t)            => t.type === 'income' ? 'Income' : ['transfer','out_transfer','in_transfer'].includes(t.type) ? 'Transfer' : 'Expense' },
};

const safeDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d.toDate === 'function') return d.toDate();
  if (typeof d.seconds === 'number') return new Date(d.seconds * 1000);
  const p = new Date(d); return isNaN(p) ? new Date() : p;
};

// ─── Build group tree ─────────────────────────────────────────────────────────
const buildGroups = (items, keys, accounts, categories = []) => {
  if (!keys.length) return { isLeaf: true, items };
  const [head, ...tail] = keys;
  const map = new Map();
  items.forEach(t => {
    const k = DIMENSIONS[head].getValue(t, accounts, categories);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(t);
  });
  const children = [...map.entries()]
    .map(([key, its]) => ({ key, ...buildGroups(its, tail, accounts, categories), stats: calcStatsByCurrency(its), count: its.length }))
    .sort((a, b) => b.key.localeCompare(a.key, undefined, { numeric: true }));
  return { isLeaf: false, children, stats: calcStatsByCurrency(items), count: items.length };
};

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ t, accounts, categories, indent = 0, index = 0 }) {
  const [pressed, setPressed] = useState(false);
  const cat   = categories.find(c => c.id === t.categoryId);
  const acc   = accounts.find(a => a.id === t.accountId);
  const isInc = t.type === 'income' || t.type === 'in_transfer';
  const isTx  = ['transfer','out_transfer','in_transfer'].includes(t.type);

  return (
    <button
      onClick={() => openAddTransaction(t)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md,
        padding: `${SPACE.md}px ${SPACE.lg}px ${SPACE.md}px ${SPACE.lg + indent}px`,
        background: pressed ? COLORS.fillTertiary : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: `background ${ANIM.fast}ms`,
        WebkitTapHighlightColor: 'transparent',
        animation: `mv6-fade-in ${ANIM.normal}ms ${ANIM.ease} ${Math.min(index * 30, 300)}ms both`,
      }}
    >
      <TxIcon type={t.type} category={cat} size={40} />

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
            {safeDate(t.dateObj).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
          </span>
          {acc && <><span>·</span><span style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.4px' }}>{acc.name}</span></>}
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

// ─── Group Header ─────────────────────────────────────────────────────────────
function GroupHeader({ groupKey, count, stats, level, open, onToggle }) {
  const currencies = Object.keys(stats);

  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        padding: `${SPACE.sm + 2}px ${SPACE.lg}px`,
        background: level === 0 ? COLORS.fillTertiary : `${COLORS.blue}05`,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        borderTop: level > 0 ? `0.5px solid ${COLORS.separatorOpaque}` : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Chevron */}
      <div style={{
        marginRight: SPACE.sm,
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: `transform ${ANIM.normal}ms ${ANIM.spring}`,
        display: 'flex', alignItems: 'center',
      }}>
        <Icon name="ChevronRight" size={14} color={COLORS.labelTertiary} strokeWidth={2.5} />
      </div>

      <span style={{
        fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
        color: COLORS.labelPrimary, fontFamily: FONT.family,
        flex: 1, letterSpacing: level === 0 ? '0.2px' : 0,
      }}>
        {groupKey}
      </span>

      {/* Count badge */}
      <span style={{
        fontSize: '11px', fontWeight: FONT.semibold,
        color: COLORS.labelTertiary, fontFamily: FONT.family,
        background: COLORS.fillSecondary,
        padding: '2px 7px', borderRadius: RADIUS.full, marginRight: SPACE.sm,
      }}>
        {count}
      </span>

      {/* Per-currency net — compact */}
      <div style={{ display: 'flex', gap: SPACE.sm, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {currencies.map(c => {
          const net = stats[c].net;
          return (
            <span key={c} style={{
              fontSize: '11px', fontWeight: FONT.semibold,
              color: net >= 0 ? COLORS.income : COLORS.expense,
              fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
            }}>
              {net >= 0 ? '+' : '−'}{formatAmount(Math.abs(net), c)} <span style={{ color: COLORS.labelQuaternary, fontWeight: 400 }}>{c}</span>
            </span>
          );
        })}
      </div>
    </button>
  );
}

// ─── Group Node — each group has its OWN open state ──────────────────────────
// This fixes the v5 bug where all groups shared one boolean.
function GroupNode({ node, level, accounts, categories }) {
  const [open, setOpen] = useState(true);

  if (node.isLeaf) {
    return (
      <div>
        {node.items.map((t, i) => (
          <React.Fragment key={t.id}>
            <TxRow t={t} accounts={accounts} categories={categories} indent={level * 8} index={i} />
            {i < node.items.length - 1 && (
              <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 70 + level * 8 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div>
      {node.children.map(child => (
        <ChildGroup
          key={child.key}
          child={child}
          level={level}
          accounts={accounts}
          categories={categories}
        />
      ))}
    </div>
  );
}

// Separate component so each child has its own useState for open/close
function ChildGroup({ child, level, accounts, categories }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <GroupHeader
        groupKey={child.key}
        count={child.count}
        stats={child.stats}
        level={level}
        open={open}
        onToggle={() => setOpen(o => !o)}
      />
      {open && (
        <div style={level > 0 ? { borderLeft: `2px solid ${COLORS.blue}15`, marginLeft: SPACE.lg } : {}}>
          <GroupNode
            node={child}
            level={level + 1}
            accounts={accounts}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
}

// ─── Group Menu ───────────────────────────────────────────────────────────────
function GroupMenu({ grouping, onChange, onClose }) {
  return (
    <div style={{
      background: COLORS.surface, borderRadius: RADIUS.xl,
      overflow: 'hidden', margin: `${SPACE.md}px ${SPACE.lg}px`,
      boxShadow: SHADOW.lg,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${SPACE.md}px ${SPACE.lg}px`,
        borderBottom: `0.5px solid ${COLORS.separatorOpaque}`,
      }}>
        <span style={{
          fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
          color: COLORS.labelSecondary, textTransform: 'uppercase',
          letterSpacing: '0.8px', fontFamily: FONT.family,
        }}>
          Group By
        </span>
        {grouping.length > 0 && (
          <button
            onClick={() => onChange([])}
            style={{
              fontSize: FONT.footnote.size, color: COLORS.red,
              fontWeight: FONT.semibold, fontFamily: FONT.family,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Reset
          </button>
        )}
      </div>
      {Object.entries(DIMENSIONS).map(([key, dim], i, arr) => {
        const idx    = grouping.indexOf(key);
        const active = idx > -1;
        return (
          <React.Fragment key={key}>
            <button
              onClick={() => {
                onChange(active
                  ? grouping.filter(k => k !== key)
                  : [...grouping, key]
                );
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACE.md}px ${SPACE.lg}px`,
                background: active ? `${COLORS.blue}08` : 'transparent',
                border: 'none', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{
                fontSize: FONT.callout.size,
                color: active ? COLORS.blue : COLORS.labelPrimary,
                fontWeight: active ? FONT.semibold : FONT.regular,
                fontFamily: FONT.family,
              }}>
                {dim.label}
              </span>
              {active && (
                <div style={{
                  width: 22, height: 22, borderRadius: RADIUS.full,
                  background: COLORS.blue,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: FONT.family }}>
                    {idx + 1}
                  </span>
                </div>
              )}
            </button>
            {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORDS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Records({ user }) {
  const { filter }                        = useFilter();
  const { accounts }                      = useAccounts(user.uid);
  const { categories }                    = useCategories(user.uid);
  const { transactions, loading }         = useTransactions(user.uid, filter);

  const [search,      setSearch]      = useState('');
  const [grouping,    setGrouping]    = useState([]);
  const [showGroup,   setShowGroup]   = useState(false);
  const searchRef                     = useRef(null);

  // ── filter by search ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const term = search.toLowerCase();
    return transactions.filter(t => {
      const cat  = categories.find(c => c.id === t.categoryId);
      const acc  = accounts.find(a => a.id === t.accountId);
      return (
        (t.note && t.note.toLowerCase().includes(term)) ||
        String(t.amount).includes(term) ||
        (cat?.name && cat.name.toLowerCase().includes(term)) ||
        (acc?.name && acc.name.toLowerCase().includes(term)) ||
        (t.currency && t.currency.toLowerCase().includes(term))
      );
    });
  }, [transactions, search, categories, accounts]);

  // ── totals bar ────────────────────────────────────────────────────────────────
  const totals = useMemo(() => calcStatsByCurrency(filtered), [filtered]);

  // ── grouped tree ──────────────────────────────────────────────────────────────
  const grouped = useMemo(
    () => buildGroups(sortByDateDesc(filtered), grouping, accounts, categories),
    [filtered, grouping, accounts]
  );

  const filterLabel = getFilterLabel(filter);

  return (
    <div>
      {/* ── Page Title ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: FONT.largeTitle.size, fontWeight: FONT.bold,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
            letterSpacing: '-0.5px',
          }}>
            Records
          </h1>
          <div style={{
            fontSize: FONT.caption1.size, color: COLORS.labelTertiary,
            fontFamily: FONT.family, marginTop: 3,
          }}>
            {filterLabel} · {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Search + Group toolbar ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: SPACE.sm,
        padding: `0 ${SPACE.lg}px ${SPACE.md}px`,
      }}>
        {/* Search */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: SPACE.sm,
          background: COLORS.surface, borderRadius: RADIUS.xl,
          padding: `0 ${SPACE.md}px`,
          boxShadow: SHADOW.sm,
          border: `1px solid ${COLORS.separatorOpaque}`,
        }}>
          <Icon name="Search" size={16} color={COLORS.labelTertiary} strokeWidth={2} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              padding: '11px 0',
              fontSize: FONT.callout.size, color: COLORS.labelPrimary,
              fontFamily: FONT.family,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <Icon name="X" size={15} color={COLORS.labelTertiary} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Group button */}
        <button
          onClick={() => setShowGroup(o => !o)}
          style={{
            width: 44, height: 44, borderRadius: RADIUS.xl,
            background: grouping.length > 0 ? COLORS.blue : COLORS.surface,
            border: `1px solid ${grouping.length > 0 ? COLORS.blue : COLORS.separatorOpaque}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, position: 'relative',
            boxShadow: SHADOW.sm,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon
            name="Layers" size={18}
            color={grouping.length > 0 ? '#fff' : COLORS.labelSecondary}
            strokeWidth={2}
          />
          {grouping.length > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 16, height: 16, borderRadius: RADIUS.full,
              background: COLORS.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: FONT.family }}>
                {grouping.length}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* ── Group menu (collapsible) ─────────────────────────────────────────────── */}
      {showGroup && (
        <GroupMenu
          grouping={grouping}
          onChange={setGrouping}
          onClose={() => setShowGroup(false)}
        />
      )}

      {/* ── Period totals bar — per currency, never mixed ────────────────────────── */}
      {Object.keys(totals).length > 0 && (
        <div style={{
          margin: `0 ${SPACE.lg}px ${SPACE.md}px`,
          background: COLORS.surface, borderRadius: RADIUS.xl,
          padding: `${SPACE.md}px ${SPACE.lg}px`,
          boxShadow: SHADOW.sm,
          display: 'flex', flexDirection: 'column', gap: SPACE.md,
        }}>
          {Object.entries(totals).map(([curr, val]) => (
            <CurrencyStatRow
              key={curr}
              currency={curr}
              income={val.income}
              expense={val.expense}
              net={val.net}
            />
          ))}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ margin: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={64} radius={i === 0 ? `${RADIUS.xl}px ${RADIUS.xl}px 0 0` : i === 5 ? `0 0 ${RADIUS.xl}px ${RADIUS.xl}px` : 0} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="ReceiptText"
          title={search ? 'No results' : 'No transactions'}
          message={search ? `Nothing matched "${search}"` : `No records for ${filterLabel.toLowerCase()}`}
          action={!search ? () => openAddTransaction() : undefined}
          actionLabel="Add Transaction"
        />
      ) : (
        <div style={{
          margin: `0 ${SPACE.lg}px`,
          background: COLORS.surface, borderRadius: RADIUS.xl,
          overflow: 'hidden', boxShadow: SHADOW.sm,
        }}>
          {grouping.length === 0 ? (
            /* ── Flat list ─────────────────────────────────────────────────────── */
            <div>
              {/* Column header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: `${SPACE.sm}px ${SPACE.lg}px`,
                borderBottom: `0.5px solid ${COLORS.separatorOpaque}`,
              }}>
                <span style={{ fontSize: '11px', fontWeight: FONT.semibold, color: COLORS.labelTertiary, fontFamily: FONT.family, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Transaction
                </span>
                <span style={{ fontSize: '11px', fontWeight: FONT.semibold, color: COLORS.labelTertiary, fontFamily: FONT.family, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Amount
                </span>
              </div>
              {sortByDateDesc(filtered).map((t, i, arr) => (
                <React.Fragment key={t.id}>
                  <TxRow t={t} accounts={accounts} categories={categories} index={i} />
                  {i < arr.length - 1 && (
                    <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 70 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            /* ── Grouped tree ──────────────────────────────────────────────────── */
            <GroupNode
              node={grouped}
              level={0}
              accounts={accounts}
              categories={categories}
            />
          )}
        </div>
      )}
    </div>
  );
}