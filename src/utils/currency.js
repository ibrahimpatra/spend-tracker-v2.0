// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — utils/currency.js
// ALL financial math lives here. Rule #1: never sum across different currencies.
// ─────────────────────────────────────────────────────────────────────────────

import { getCurrencyMeta, isIncomeType, isExpenseType, isTransferType } from '../constants';

// Safe date conversion — handles: Date, Firestore Timestamp, JSON POJO {seconds}, string
const tsToDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d.toDate === 'function') return d.toDate();
  if (typeof d.seconds === 'number') return new Date(d.seconds * 1000);
  const p = new Date(d);
  return isNaN(p) ? new Date() : p;
};

// ─── Format a single amount ────────────────────────────────────────────────────
export const formatAmount = (amount, currencyCode, opts = {}) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const meta = getCurrencyMeta(currencyCode);
  const decimals = opts.decimals ?? meta.decimals;
  try {
    return num.toLocaleString(meta.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    return num.toFixed(decimals);
  }
};

export const formatWithSymbol = (amount, currencyCode, opts = {}) => {
  const meta = getCurrencyMeta(currencyCode);
  return `${meta.symbol}${formatAmount(amount, currencyCode, opts)}`;
};

export const formatWithCode = (amount, currencyCode, opts = {}) => {
  const meta = getCurrencyMeta(currencyCode);
  return `${meta.symbol} ${formatAmount(amount, currencyCode, opts)}`;
};

// ─── Per-currency stats ────────────────────────────────────────────────────────
export const calcStatsByCurrency = (transactions = []) => {
  const stats = {};
  transactions.forEach(t => {
    const c = t.currency;
    if (!c) return;
    if (!stats[c]) stats[c] = { income: 0, expense: 0, net: 0, count: 0 };
    stats[c].count++;
    if (isIncomeType(t.type))        stats[c].income  += t.amount || 0;
    else if (isExpenseType(t.type))  stats[c].expense += t.amount || 0;
  });
  Object.keys(stats).forEach(c => { stats[c].net = stats[c].income - stats[c].expense; });
  return stats;
};

// ─── Group transactions by currency ───────────────────────────────────────────
export const groupByCurrency = (transactions = []) => {
  return transactions.reduce((acc, t) => {
    const c = t.currency;
    if (!acc[c]) acc[c] = [];
    acc[c].push(t);
    return acc;
  }, {});
};

// ─── Account net worth (per currency) ────────────────────────────────────────
export const calcNetWorthByCurrency = (accounts = []) => {
  const worth = {};
  accounts.forEach(acc => {
    const c = acc.currency;
    if (!c) return;
    if (!worth[c]) worth[c] = 0;
    worth[c] += acc.balance || 0;
  });
  return worth;
};

// ─── Daily aggregates (for charts) ───────────────────────────────────────────
export const buildDailyTimeSeries = (transactions = [], currency) => {
  const filtered = transactions.filter(t => t.currency === currency);
  const map = {};

  filtered.forEach(t => {
    const d = tsToDate(t.dateObj).toISOString().split('T')[0];
    if (!map[d]) map[d] = { date: d, income: 0, expense: 0, net: 0 };
    if (isIncomeType(t.type))        map[d].income  += t.amount || 0;
    else if (isExpenseType(t.type))  map[d].expense += t.amount || 0;
  });

  return Object.values(map)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, net: d.income - d.expense }));
};

// ─── Monthly aggregates (for charts) ─────────────────────────────────────────
export const buildMonthlyTimeSeries = (transactions = [], currency) => {
  const filtered = transactions.filter(t => t.currency === currency);
  const map = {};

  filtered.forEach(t => {
    const dateObj = tsToDate(t.dateObj);
    const key   = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const label = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { month: key, label, income: 0, expense: 0, net: 0 };
    if (isIncomeType(t.type))        map[key].income  += t.amount || 0;
    else if (isExpenseType(t.type))  map[key].expense += t.amount || 0;
  });

  return Object.values(map)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(d => ({ ...d, net: d.income - d.expense }));
};

// ─── Category breakdown (for donut charts) ────────────────────────────────────
export const buildCategoryBreakdown = (transactions = [], categories = [], currency) => {
  const expenseTxs = transactions.filter(t => t.currency === currency && isExpenseType(t.type));
  const total = expenseTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
  if (total === 0) return [];

  const map = {};
  expenseTxs.forEach(t => {
    const cid = t.categoryId || '__uncategorized__';
    if (!map[cid]) map[cid] = 0;
    map[cid] += t.amount || 0;
  });

  return Object.entries(map)
    .map(([cid, amount]) => {
      const cat = categories.find(c => c.id === cid);
      return {
        categoryId:  cid,
        name:        cat?.name  || 'Uncategorized',
        color:       cat?.color || '#8E8E93',
        icon:        cat?.icon  || 'MoreHorizontal',
        amount,
        percentage:  total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
};

// ─── Running balance (for account drill-down) ─────────────────────────────────
export const buildRunningBalance = (transactions = [], openingBalance = 0) => {
  let balance = openingBalance;
  const sorted = [...transactions].sort((a, b) => {
    const da = tsToDate(a.dateObj);
    const db = tsToDate(b.dateObj);
    return da - db;
  });

  return sorted.map(t => {
    if (isIncomeType(t.type))        balance += t.amount || 0;
    else if (isExpenseType(t.type))  balance -= t.amount || 0;

    const dateObj = t.dateObj instanceof Date ? t.dateObj : new Date(t.date?.seconds * 1000);
    return {
      date:    dateObj.toISOString().split('T')[0],
      balance: parseFloat(balance.toFixed(getCurrencyMeta(t.currency).decimals)),
      tx: t,   // ← FIXED: was `tx` (undefined), now correctly `tx: t`
    };
  });
};

// ─── Trend helpers ────────────────────────────────────────────────────────────
export const calcTrend = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export const formatTrend = (pct) => {
  if (pct === null || pct === undefined) return null;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
};

// ─── Sorting helpers ──────────────────────────────────────────────────────────
export const sortByDateDesc = (transactions) =>
  [...transactions].sort((a, b) => {
    const da = tsToDate(a.dateObj);
    const db = tsToDate(b.dateObj);
    return db - da;
  });

export const sortByDateAsc = (transactions) =>
  [...transactions].sort((a, b) => {
    const da = a.dateObj instanceof Date ? a.dateObj : new Date(a.date?.seconds * 1000);
    const db = b.dateObj instanceof Date ? b.dateObj : new Date(b.date?.seconds * 1000);
    return da - db;
  });