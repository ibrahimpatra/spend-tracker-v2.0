import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, onSnapshot, query, where, orderBy, Timestamp
} from 'firebase/firestore';

// ─── useAccounts ──────────────────────────────────────────────────────────────
export function useAccounts(uid) {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      collection(db, `users/${uid}/accounts`),
      snap => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);
  return accounts;
}

// ─── useCategories ────────────────────────────────────────────────────────────
export function useCategories(uid) {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      collection(db, `users/${uid}/categories`),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);
  return categories;
}

// ─── useTransactions ──────────────────────────────────────────────────────────
export function useTransactions(uid, filter) {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    if (!uid) return;

    let start = new Date(), end = new Date();
    if (filter.dateRange === 'thisMonth') {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    } else if (filter.dateRange === 'lastMonth') {
      start = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      end   = new Date(end.getFullYear(), end.getMonth(), 0);
    } else if (filter.dateRange === 'custom' && filter.customStart && filter.customEnd) {
      start = new Date(filter.customStart);
      end   = new Date(filter.customEnd);
      end.setHours(23, 59, 59);
    } else {
      start = new Date('2000-01-01');
    }

    const q = query(
      collection(db, `users/${uid}/transactions`),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({
        id: d.id, ...d.data(),
        dateObj: d.data().date.toDate(),
      }));
      const filtered = filter.accountIds?.length > 0
        ? all.filter(t => filter.accountIds.includes(t.accountId))
        : all;
      setTransactions(filtered);
    });
  }, [uid, filter]);

  return transactions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const TRANSFER_TYPES = new Set(['transfer', 'out_transfer', 'in_transfer']);
export const isTransfer = (type) => TRANSFER_TYPES.has(type);
export const isIncome   = (type) => type === 'income' || type === 'in_transfer';
export const isExpense  = (type) => type === 'expense' || type === 'out_transfer';
