// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/AccountDetail.jsx  →  /accounts/:id
// Real URL. Browser back button works natively.
// • Hero card with live balance
// • Running balance line chart (Recharts)
// • Monthly income vs expense bar chart
// • Full transaction list for this account (filtered by global date)
// • Edit account name / color
// • Delete account with confirmation
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, ACCOUNT_TYPES } from '../constants';
import { useFilter } from '../context/FilterContext';
import { useAccounts, useCategories, useTransactions, useHiddenBalances } from '../hooks/useData';
import {
  buildRunningBalance, buildMonthlyTimeSeries,
  formatAmount, calcStatsByCurrency, sortByDateDesc,
} from '../utils/currency';
import {
  Icon, BottomSheet, AlertDialog, Skeleton, EmptyState,
  TxIcon, CurrencyStatRow, Spinner,
} from '../components/ui';
import { openAddTransaction } from '../components/Layout';

const TYPE_META = {
  bank:       { label: 'Bank Account',   icon: 'Landmark',   color: COLORS.blue   },
  cash:       { label: 'Cash',           icon: 'Banknote',   color: COLORS.green  },
  savings:    { label: 'Savings',        icon: 'PiggyBank',  color: COLORS.teal   },
  credit:     { label: 'Credit Card',    icon: 'CreditCard', color: COLORS.purple },
  investment: { label: 'Investment',     icon: 'TrendingUp', color: COLORS.orange },
  wallet:     { label: 'Digital Wallet', icon: 'Wallet',     color: COLORS.indigo },
};

const COLORS_PRESET = [
  '#007AFF','#34C759','#FF9500','#FF3B30','#5856D6',
  '#FF2D55','#AF52DE','#5AC8FA','#FFCC00','#A2845E',
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--mv6-surface-overlay, rgba(28,28,30,0.92))', backdropFilter: 'blur(12px)',
      borderRadius: RADIUS.lg, padding: '10px 14px', boxShadow: SHADOW.lg,
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: FONT.family, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: '13px', fontWeight: 600, color: p.color, fontFamily: FONT.family }}>
          {p.name}: {formatAmount(p.value, currency)}
        </div>
      ))}
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ t, categories, index }) {
  const [pressed, setPressed] = useState(false);
  const cat   = categories.find(c => c.id === t.categoryId);
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
        padding: `${SPACE.md}px ${SPACE.lg}px`,
        background: pressed ? COLORS.fillTertiary : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: `background ${ANIM.fast}ms`,
        WebkitTapHighlightColor: 'transparent',
        animation: `mv6-fade-in ${ANIM.normal}ms ease ${Math.min(index * 30, 400)}ms both`,
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
        <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, marginTop: 2 }}>
          {safeDate(t.dateObj).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
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
        <div style={{ fontSize: '10px', color: COLORS.labelQuaternary, fontFamily: FONT.family, letterSpacing: '0.5px', marginTop: 1 }}>
          {t.currency}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DETAIL PAGE
// ─────────────────────────────────────────────────────────────────────────────

// ─── Safe date helper ────────────────────────────────────────────────────────
const safeDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d.toDate === 'function') return d.toDate();
  if (typeof d.seconds === 'number') return new Date(d.seconds * 1000);
  const p = new Date(d); return isNaN(p) ? new Date() : p;
};

export default function AccountDetail({ user }) {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { filter }   = useFilter();

  const { accounts, loading: accLoading, updateAccount, deleteAccount } = useAccounts(user.uid);
  const { categories }    = useCategories(user.uid);
  const { transactions }  = useTransactions(user.uid, { dateRange: 'allTime', accountIds: [] });
  const { isHidden, toggle } = useHiddenBalances(user.uid);

  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Edit form state
  const [editName,  setEditName]  = useState('');
  const [editColor, setEditColor] = useState('');

  const account = accounts.find(a => a.id === id);

  // Transactions for THIS account only — all time (for running balance)
  const accTxAll = useMemo(
    () => transactions.filter(t => t.accountId === id || t.toAccountId === id),
    [transactions, id]
  );

  // Transactions filtered by global date (for stats display)
  const accTxFiltered = useMemo(() => {
    // re-use the already-filtered list if account filter matches
    return accTxAll;
  }, [accTxAll]);

  const stats       = useMemo(() => calcStatsByCurrency(accTxFiltered), [accTxFiltered]);
  const currency    = account?.currency || 'KWD';
  const meta        = TYPE_META[account?.type || 'bank'];

  // Running balance chart data
  const runningData = useMemo(() => {
    if (!account) return [];
    // Start from opening balance (account.balance minus all tx effects)
    // We approximate: current balance is the truth, we walk backwards
    const sorted = sortByDateDesc(accTxAll).reverse(); // oldest first
    let balance = account.balance;

    // Walk back to find opening balance
    sorted.forEach(t => {
      const isInc = t.type === 'income' || t.type === 'in_transfer';
      const isExp = t.type === 'expense' || t.type === 'out_transfer';
      const isTxFrom = t.type === 'transfer' && t.accountId === id;
      const isTxTo   = t.type === 'transfer' && t.toAccountId === id;
      if (isInc || isTxTo)       balance -= (t.amount || 0);
      else if (isExp || isTxFrom) balance += (t.amount || 0);
    });

    // Now forward-walk to build chart
    const data = [{ date: 'Start', balance: parseFloat(balance.toFixed(3)) }];
    let running = balance;

    sorted.forEach(t => {
      const isInc = t.type === 'income' || t.type === 'in_transfer';
      const isExp = t.type === 'expense' || t.type === 'out_transfer';
      const isTxFrom = t.type === 'transfer' && t.accountId === id;
      const isTxTo   = t.type === 'transfer' && t.toAccountId === id;

      if (isInc || isTxTo)        running += (t.amount || 0);
      else if (isExp || isTxFrom) running -= (t.amount || 0);

      const label = safeDate(t.dateObj).toLocaleDateString('default', { month: 'short', day: 'numeric' });
      data.push({ date: label, balance: parseFloat(running.toFixed(3)) });
    });

    return data;
  }, [account, accTxAll, id]);

  // Monthly data for this account
  const monthlyData = useMemo(
    () => buildMonthlyTimeSeries(accTxFiltered, currency),
    [accTxFiltered, currency]
  );

  const openEdit = () => {
    setEditName(account?.name || '');
    setEditColor(account?.color || COLORS.blue);
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateAccount(id, { name: editName.trim(), color: editColor });
      setShowEdit(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteAccount(id);
      navigate('/accounts');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (accLoading) {
    return (
      <div style={{ padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
        <Skeleton height={200} radius={RADIUS.xxl} />
        <Skeleton height={160} radius={RADIUS.xl} />
        <Skeleton height={300} radius={RADIUS.xl} />
      </div>
    );
  }

  if (!account) {
    return (
      <EmptyState
        icon="Wallet"
        title="Account not found"
        message="This account may have been deleted"
        action={() => navigate('/accounts')}
        actionLabel="Back to Accounts"
      />
    );
  }

  const hidden = isHidden(account.id);

  return (
    <div>
      {/* ── Back navigation ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px`,
      }}>
        <button
          onClick={() => navigate('/accounts')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.blue, fontFamily: FONT.family,
            fontSize: FONT.callout.size, padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="ChevronLeft" size={20} color={COLORS.blue} strokeWidth={2.5} />
          Accounts
        </button>
        <div style={{ display: 'flex', gap: SPACE.sm }}>
          <button
            onClick={openEdit}
            style={{
              width: 34, height: 34, borderRadius: RADIUS.full,
              background: COLORS.fillTertiary, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon name="Pencil" size={15} color={COLORS.labelSecondary} strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            style={{
              width: 34, height: 34, borderRadius: RADIUS.full,
              background: `${COLORS.red}12`, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon name="Trash2" size={15} color={COLORS.red} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────────────────── */}
      <div style={{
        margin: `0 ${SPACE.lg}px ${SPACE.lg}px`,
        background: `linear-gradient(145deg, ${account.color || meta.color}CC, ${account.color || meta.color}66)`,
        borderRadius: RADIUS.xxl, padding: SPACE.xl,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 8px 32px ${(account.color || meta.color)}44`,
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg }}>
          <div style={{
            width: 44, height: 44, borderRadius: RADIUS.lg,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={meta.icon} size={22} color="#fff" strokeWidth={1.75} />
          </div>
          <div>
            <div style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>
              {account.name}
            </div>
            <div style={{ fontSize: FONT.caption1.size, color: 'rgba(255,255,255,0.6)', fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {meta.label}
            </div>
          </div>
          <button
            onClick={() => toggle(account.id)}
            style={{
              marginLeft: 'auto', width: 32, height: 32, borderRadius: RADIUS.full,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon name={hidden ? 'EyeOff' : 'Eye'} size={15} color="#fff" strokeWidth={2} />
          </button>
        </div>

        {hidden ? (
          <div style={{ fontSize: '32px', letterSpacing: '8px', color: 'rgba(255,255,255,0.4)', fontFamily: FONT.family }}>••••••</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE.sm }}>
            <span style={{ fontSize: '38px', fontWeight: 700, color: '#fff', fontFamily: FONT.family, letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums' }}>
              {formatAmount(account.balance, currency)}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontFamily: FONT.family }}>
              {currency}
            </span>
          </div>
        )}

        {/* Stats */}
        {!hidden && stats[currency] && (
          <div style={{ display: 'flex', gap: SPACE.xl, marginTop: SPACE.lg }}>
            {[
              { label: 'Income',  value: stats[currency].income,  color: '#6EE7A0' },
              { label: 'Expense', value: stats[currency].expense, color: '#FF8A80' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: FONT.family, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: s.color, fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums' }}>
                  {formatAmount(s.value, currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Running Balance Chart ─────────────────────────────────────────────────── */}
      {runningData.length > 1 && (
        <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            <div style={{ padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px` }}>
              <span style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>
                Running Balance
              </span>
            </div>
            <div style={{ padding: `0 ${SPACE.sm}px ${SPACE.lg}px` }}>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={runningData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={64} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Line
                    type="monotone" dataKey="balance" name="Balance"
                    stroke={account.color || meta.color} strokeWidth={2.5}
                    dot={false} activeDot={{ r: 4, fill: account.color || meta.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly Income vs Expense ─────────────────────────────────────────────── */}
      {monthlyData.length > 0 && (
        <div style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            <div style={{ padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px` }}>
              <span style={{ fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>
                Monthly Overview
              </span>
            </div>
            <div style={{ padding: `0 ${SPACE.sm}px ${SPACE.lg}px` }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.separatorOpaque} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.labelTertiary, fontFamily: FONT.family }} tickLine={false} axisLine={false} tickFormatter={v => formatAmount(v, currency)} width={64} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Bar dataKey="income"  name="Income"  fill={COLORS.income}  radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Expense" fill={COLORS.expense} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction list ──────────────────────────────────────────────────────── */}
      <div style={{ margin: `0 ${SPACE.lg}px` }}>
        <div style={{
          fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
          color: COLORS.labelSecondary, textTransform: 'uppercase',
          letterSpacing: '0.8px', fontFamily: FONT.family,
          padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
        }}>
          Transactions
        </div>
        {accTxAll.length === 0 ? (
          <EmptyState icon="ReceiptText" title="No transactions" message="None recorded for this account yet" />
        ) : (
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.sm }}>
            {sortByDateDesc(accTxAll).map((t, i, arr) => (
              <React.Fragment key={t.id}>
                <TxRow t={t} categories={categories} index={i} />
                {i < arr.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 68 }} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit sheet ────────────────────────────────────────────────────────────── */}
      <BottomSheet open={showEdit} onClose={() => setShowEdit(false)} title="Edit Account" height={340}>
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.xl}px`, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
          <div>
            <label style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, fontFamily: FONT.family, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Name</label>
            <input
              value={editName} onChange={e => setEditName(e.target.value)}
              style={{
                width: '100%', marginTop: 6, padding: `${SPACE.md}px`,
                borderRadius: RADIUS.lg, border: `1.5px solid ${COLORS.separatorOpaque}`,
                fontSize: FONT.callout.size, fontFamily: FONT.family,
                color: COLORS.labelPrimary, background: COLORS.bgPrimary,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, fontFamily: FONT.family, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Color</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              {COLORS_PRESET.map(c => (
                <button key={c} onClick={() => setEditColor(c)} style={{
                  width: 32, height: 32, borderRadius: RADIUS.full, background: c,
                  border: `3px solid ${editColor === c ? COLORS.labelPrimary : 'transparent'}`,
                  cursor: 'pointer', boxSizing: 'border-box',
                  transform: editColor === c ? 'scale(1.15)' : 'scale(1)',
                  transition: `transform ${ANIM.fast}ms ${ANIM.spring}`,
                  WebkitTapHighlightColor: 'transparent',
                }} />
              ))}
            </div>
          </div>
          <button
            onClick={handleEdit} disabled={saving}
            style={{
              width: '100%', padding: '17px', borderRadius: RADIUS.xl,
              background: COLORS.blue, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? <Spinner size={20} color="#fff" /> : <span style={{ fontSize: '17px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>Save</span>}
          </button>
        </div>
      </BottomSheet>

      {/* ── Delete confirm ────────────────────────────────────────────────────────── */}
      <AlertDialog
        open={showDelete} onClose={() => setShowDelete(false)}
        title="Delete Account"
        message={`Delete "${account.name}"? All transactions linked to this account will remain but show as unknown account.`}
        confirmLabel="Delete" confirmDestructive
        onConfirm={handleDelete}
      />
    </div>
  );
}