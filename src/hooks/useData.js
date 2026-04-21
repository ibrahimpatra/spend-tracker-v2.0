import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection, onSnapshot, query,
  where, orderBy, Timestamp
} from 'firebase/firestore';

// ─── useAccounts ──────────────────────────────────────────────────────────────
export function useAccounts(uid) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(collection(db, `users/${uid}/accounts`),
      s => setData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [uid]);
  return data;
}

// ─── useCategories ────────────────────────────────────────────────────────────
export function useCategories(uid) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(collection(db, `users/${uid}/categories`),
      s => setData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [uid]);
  return data;
}

// ─── useTransactions ──────────────────────────────────────────────────────────
export function useTransactions(uid, filter) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!uid) return;
    let start = new Date(), end = new Date();
    end.setHours(23, 59, 59, 999);

    switch (filter?.dateRange) {
      case 'thisMonth':
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        end   = new Date(end.getFullYear(),   end.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisYear':
        start = new Date(start.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (filter.customStart && filter.customEnd) {
          start = new Date(filter.customStart);
          end   = new Date(filter.customEnd);
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        start = new Date('2000-01-01');
    }

    const q = query(
      collection(db, `users/${uid}/transactions`),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, s => {
      const all = s.docs.map(d => ({ id: d.id, ...d.data(), dateObj: d.data().date.toDate() }));
      const filtered = filter?.accountIds?.length
        ? all.filter(t => filter.accountIds.includes(t.accountId))
        : all;
      setData(filtered);
    });
  }, [uid, filter]);

  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const isTransfer = t => ['transfer', 'out_transfer', 'in_transfer'].includes(t);
export const isIncome   = t => t === 'income'  || t === 'in_transfer';
export const isExpense  = t => t === 'expense' || t === 'out_transfer';

// ─── useStats ─────────────────────────────────────────────────────────────────
export function useStats(transactions) {
  return useMemo(() => {
    const stats = {};
    transactions.forEach(t => {
      const c = t.currency;
      if (!stats[c]) stats[c] = { income: 0, expense: 0, net: 0 };
      if (isIncome(t.type))  stats[c].income  += t.amount;
      if (isExpense(t.type)) stats[c].expense += t.amount;
    });
    Object.values(stats).forEach(s => { s.net = s.income - s.expense; });
    return stats;
  }, [transactions]);
}

// ─── useTrendData ─────────────────────────────────────────────────────────────
export function useTrendData(transactions) {
  return useMemo(() => {
    const map = {};
    const sorted = [...transactions].sort((a, b) => a.dateObj - b.dateObj);
    sorted.forEach(t => {
      const k = t.dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      if (!map[k]) map[k] = { name: k, Income: 0, Expense: 0, _d: t.dateObj };
      if (isIncome(t.type))  map[k].Income  += t.amount;
      if (isExpense(t.type)) map[k].Expense += t.amount;
    });
    return Object.values(map);
  }, [transactions]);
}

// ─── usePieData ───────────────────────────────────────────────────────────────
export function usePieData(transactions, categories) {
  return useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat  = categories.find(c => c.id === t.categoryId);
      const name = cat?.name  || 'Uncategorized';
      const color= cat?.color || '#8E8E93';
      if (!map[name]) map[name] = { name, value: 0, color };
      map[name].value += t.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);
}
