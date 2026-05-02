// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — hooks/useData.js
// Single Firebase source of truth.
// All reads go through localStorage cache (5-min TTL).
// All writes invalidate the relevant cache keys.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, Timestamp, writeBatch, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CACHE, TX_TYPES, isIncomeType, isExpenseType } from '../constants';
import { getDateBounds } from '../context/FilterContext';

// ─── Cache helpers ────────────────────────────────────────────────────────────
const cacheWrite = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded — silently skip */ }
};

const cacheRead = (key, ttl = CACHE.TTL_MS) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) return null;    // stale
    return data;
  } catch {
    return null;
  }
};

const cacheIsFresh = (key, freshMs = 20000) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < freshMs;
  } catch { return false; }
};

const cacheDelete = (key) => {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
};

const cacheClear = (prefix) => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
};

// ─── filterHash — stable string key for a given filter state ─────────────────
const filterHash = (filter) => {
  const bounds = getDateBounds(filter);
  const accPart = (filter.accountIds || []).slice().sort().join(',');
  return `${bounds.start.getTime()}_${bounds.end.getTime()}_${accPart}`;
};

// ─── Firestore timestamp → Date ───────────────────────────────────────────────
export const tsToDate = (ts) => {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

// ─────────────────────────────────────────────────────────────────────────────
// useAccounts
// ─────────────────────────────────────────────────────────────────────────────
export function useAccounts(uid) {
  const [accounts, setAccounts] = useState(() => {
    const cached = cacheRead(CACHE.KEYS.accounts(uid));
    return cached || [];
  });
  const [loading, setLoading] = useState(!accounts.length && !cacheIsFresh(CACHE.KEYS.accounts(uid)));

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, `users/${uid}/accounts`),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAccounts(data);
        setLoading(false);
        cacheWrite(CACHE.KEYS.accounts(uid), data);
      },
      (err) => { console.error('useAccounts:', err); setLoading(false); }
    );
    return unsub;
  }, [uid]);

  // ── mutations ──
  const addAccount = useCallback(async (payload) => {
    const ref = await addDoc(collection(db, `users/${uid}/accounts`), payload);
    cacheDelete(CACHE.KEYS.accounts(uid));
    return ref.id;
  }, [uid]);

  const updateAccount = useCallback(async (id, payload) => {
    await updateDoc(doc(db, `users/${uid}/accounts`, id), payload);
    cacheDelete(CACHE.KEYS.accounts(uid));
  }, [uid]);

  const deleteAccount = useCallback(async (id) => {
    await deleteDoc(doc(db, `users/${uid}/accounts`, id));
    cacheDelete(CACHE.KEYS.accounts(uid));
    // Also clear transaction cache since account is gone
    cacheClear(`mv6_tx_${uid}`);
  }, [uid]);

  return { accounts, loading, addAccount, updateAccount, deleteAccount };
}

// ─────────────────────────────────────────────────────────────────────────────
// useCategories
// ─────────────────────────────────────────────────────────────────────────────
export function useCategories(uid) {
  const [categories, setCategories] = useState(() => {
    const cached = cacheRead(CACHE.KEYS.categories(uid));
    return cached || [];
  });
  const [loading, setLoading] = useState(!categories.length && !cacheIsFresh(CACHE.KEYS.categories(uid)));

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, `users/${uid}/categories`),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCategories(data);
        setLoading(false);
        cacheWrite(CACHE.KEYS.categories(uid), data);
      },
      (err) => { console.error('useCategories:', err); setLoading(false); }
    );
    return unsub;
  }, [uid]);

  // ── mutations ──
  const addCategory = useCallback(async (payload) => {
    const ref = await addDoc(collection(db, `users/${uid}/categories`), payload);
    cacheDelete(CACHE.KEYS.categories(uid));
    return ref.id;
  }, [uid]);

  const updateCategory = useCallback(async (id, payload) => {
    await updateDoc(doc(db, `users/${uid}/categories`, id), payload);
    cacheDelete(CACHE.KEYS.categories(uid));
  }, [uid]);

  const deleteCategory = useCallback(async (id) => {
    await deleteDoc(doc(db, `users/${uid}/categories`, id));
    cacheDelete(CACHE.KEYS.categories(uid));
  }, [uid]);

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTransactions
// ─────────────────────────────────────────────────────────────────────────────
export function useTransactions(uid, filter) {
  const hashRef   = useRef(null);
  const cacheKey  = uid ? CACHE.KEYS.transactions(uid, filterHash(filter)) : null;

  const [transactions, setTransactions] = useState(() => {
    if (!cacheKey) return [];
    const cached = cacheRead(cacheKey);
    if (!cached) return [];
    // Restore dateObj as real Date (JSON.stringify serialises it to string/POJO)
    return cached.map(t => ({ ...t, dateObj: tsToDate(t.dateObj) }));
  });
  const [loading, setLoading] = useState(!transactions.length && !cacheIsFresh(cacheKey));

  useEffect(() => {
    if (!uid || !filter) return;

    const hash = filterHash(filter);

    // Don't re-subscribe if filter hasn't changed
    if (hashRef.current === hash) return;
    hashRef.current = hash;

    const { start, end } = getDateBounds(filter);

    // Attempt cache first
    const cached = cacheRead(CACHE.KEYS.transactions(uid, hash));
    if (cached) {
      setTransactions(cached.map(t => ({ ...t, dateObj: tsToDate(t.dateObj) })));
      setLoading(false);
    } else {
      setLoading(true);
    }

    let q = query(
      collection(db, `users/${uid}/transactions`),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        dateObj: d.data().date?.toDate?.() ?? new Date(d.data().date?.seconds * 1000)
      }));

      // Apply account filter client-side
      if (filter.accountIds?.length > 0) {
        data = data.filter(t => filter.accountIds.includes(t.accountId));
      }

      setTransactions(data);
      setLoading(false);
      cacheWrite(CACHE.KEYS.transactions(uid, hash), data);
    }, (err) => {
      console.error('useTransactions:', err);
      setLoading(false);
    });

    return unsub;
  }, [uid, filterHash(filter)]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Invalidate transaction cache (all hashes) ─────────────────────────────
  const invalidateTxCache = useCallback(() => {
    cacheClear(`mv6_tx_${uid}`);
  }, [uid]);

  // ─── ADD TRANSACTION ───────────────────────────────────────────────────────
  const addTransaction = useCallback(async (payload, accounts) => {
    const batch = writeBatch(db);

    // Ensure date is a Firestore Timestamp
    const txPayload = {
      ...payload,
      date: payload.date instanceof Timestamp
        ? payload.date
        : Timestamp.fromDate(new Date(payload.date)),
    };

    const txRef = doc(collection(db, `users/${uid}/transactions`));
    batch.set(txRef, txPayload);

    // Update account balance(s)
    const { type, accountId, toAccountId, amount, receivedAmount, currency } = payload;

    if (type === TX_TYPES.EXPENSE || type === TX_TYPES.TRANSFER_OUT) {
      const acc = accounts.find(a => a.id === accountId);
      if (acc) {
        batch.update(doc(db, `users/${uid}/accounts`, accountId), {
          balance: (acc.balance || 0) - amount,
        });
      }
    } else if (type === TX_TYPES.INCOME || type === TX_TYPES.TRANSFER_IN) {
      const acc = accounts.find(a => a.id === accountId);
      if (acc) {
        batch.update(doc(db, `users/${uid}/accounts`, accountId), {
          balance: (acc.balance || 0) + amount,
        });
      }
    } else if (type === TX_TYPES.TRANSFER_INT) {
      // Internal transfer: deduct from source, add to destination
      const fromAcc = accounts.find(a => a.id === accountId);
      const toAcc   = accounts.find(a => a.id === toAccountId);

      if (fromAcc) {
        batch.update(doc(db, `users/${uid}/accounts`, accountId), {
          balance: (fromAcc.balance || 0) - amount,
        });
      }
      if (toAcc) {
        const received = receivedAmount ?? amount; // use receivedAmount for cross-currency
        batch.update(doc(db, `users/${uid}/accounts`, toAccountId), {
          balance: (toAcc.balance || 0) + received,
        });
      }
    }

    await batch.commit();
    invalidateTxCache();
    cacheDelete(CACHE.KEYS.accounts(uid));
    return txRef.id;
  }, [uid, invalidateTxCache]);

  // ─── EDIT TRANSACTION ──────────────────────────────────────────────────────
  const editTransaction = useCallback(async (txId, newPayload, oldTx, accounts) => {
    const batch = writeBatch(db);

    const txPayload = {
      ...newPayload,
      date: newPayload.date instanceof Timestamp
        ? newPayload.date
        : Timestamp.fromDate(new Date(newPayload.date)),
    };

    batch.update(doc(db, `users/${uid}/transactions`, txId), txPayload);

    // Revert OLD balance effect, then apply NEW balance effect
    const revertEffect = (tx, accs, factor = -1) => {
      const { type, accountId, toAccountId, amount, receivedAmount } = tx;
      if (type === TX_TYPES.EXPENSE || type === TX_TYPES.TRANSFER_OUT) {
        const acc = accs.find(a => a.id === accountId);
        if (acc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
          balance: acc.balance + (amount * factor * -1), // revert = add back
        });
      } else if (type === TX_TYPES.INCOME || type === TX_TYPES.TRANSFER_IN) {
        const acc = accs.find(a => a.id === accountId);
        if (acc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
          balance: acc.balance - (amount * factor * -1),
        });
      } else if (type === TX_TYPES.TRANSFER_INT) {
        const fromAcc = accs.find(a => a.id === accountId);
        const toAcc   = accs.find(a => a.id === toAccountId);
        if (fromAcc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
          balance: fromAcc.balance + amount,              // revert deduction
        });
        if (toAcc) {
          const received = receivedAmount ?? amount;
          batch.update(doc(db, `users/${uid}/accounts`, toAccountId), {
            balance: toAcc.balance - received,            // revert addition
          });
        }
      }
    };

    // Revert old, apply new — we need fresh account balances here.
    // For simplicity: revert old effect first, then apply new
    // (Firestore batch runs in order, so this is safe for same-account edits)
    revertEffect(oldTx, accounts);

    // Get updated accounts after revert for applying new effect
    // (We approximate by adjusting in-memory — batch applies atomically)
    const adjustedAccounts = accounts.map(a => {
      let bal = a.balance;
      const { type: ot, accountId: oAid, toAccountId: oTid, amount: oAmt, receivedAmount: oRec } = oldTx;
      if (ot === TX_TYPES.EXPENSE || ot === TX_TYPES.TRANSFER_OUT) {
        if (a.id === oAid) bal += oAmt;
      } else if (ot === TX_TYPES.INCOME || ot === TX_TYPES.TRANSFER_IN) {
        if (a.id === oAid) bal -= oAmt;
      } else if (ot === TX_TYPES.TRANSFER_INT) {
        if (a.id === oAid) bal += oAmt;
        if (a.id === oTid) bal -= (oRec ?? oAmt);
      }
      return { ...a, balance: bal };
    });

    // Apply new effect
    const { type, accountId, toAccountId, amount, receivedAmount } = newPayload;
    if (type === TX_TYPES.EXPENSE || type === TX_TYPES.TRANSFER_OUT) {
      const acc = adjustedAccounts.find(a => a.id === accountId);
      if (acc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
        balance: acc.balance - amount,
      });
    } else if (type === TX_TYPES.INCOME || type === TX_TYPES.TRANSFER_IN) {
      const acc = adjustedAccounts.find(a => a.id === accountId);
      if (acc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
        balance: acc.balance + amount,
      });
    } else if (type === TX_TYPES.TRANSFER_INT) {
      const fromAcc = adjustedAccounts.find(a => a.id === accountId);
      const toAcc   = adjustedAccounts.find(a => a.id === toAccountId);
      if (fromAcc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
        balance: fromAcc.balance - amount,
      });
      if (toAcc) {
        const received = receivedAmount ?? amount;
        batch.update(doc(db, `users/${uid}/accounts`, toAccountId), {
          balance: toAcc.balance + received,
        });
      }
    }

    await batch.commit();
    invalidateTxCache();
    cacheDelete(CACHE.KEYS.accounts(uid));
  }, [uid, invalidateTxCache]);

  // ─── DELETE TRANSACTION ────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (txId, tx, accounts) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${uid}/transactions`, txId));

    // Revert balance effect
    const { type, accountId, toAccountId, amount, receivedAmount } = tx;

    if (type === TX_TYPES.EXPENSE || type === TX_TYPES.TRANSFER_OUT) {
      const acc = accounts.find(a => a.id === accountId);
      if (acc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
        balance: acc.balance + amount,
      });
    } else if (type === TX_TYPES.INCOME || type === TX_TYPES.TRANSFER_IN) {
      const acc = accounts.find(a => a.id === accountId);
      if (acc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
        balance: acc.balance - amount,
      });
    } else if (type === TX_TYPES.TRANSFER_INT) {
      const fromAcc = accounts.find(a => a.id === accountId);
      const toAcc   = accounts.find(a => a.id === toAccountId);
      if (fromAcc) batch.update(doc(db, `users/${uid}/accounts`, accountId), {
        balance: fromAcc.balance + amount,
      });
      if (toAcc) {
        const received = receivedAmount ?? amount;
        batch.update(doc(db, `users/${uid}/accounts`, toAccountId), {
          balance: toAcc.balance - received,
        });
      }
    }

    await batch.commit();
    invalidateTxCache();
    cacheDelete(CACHE.KEYS.accounts(uid));
  }, [uid, invalidateTxCache]);

  return {
    transactions,
    loading,
    addTransaction,
    editTransaction,
    deleteTransaction,
    invalidateTxCache,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useBudgets
// ─────────────────────────────────────────────────────────────────────────────
export function useBudgets(uid) {
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, `users/${uid}/budgets`),
      (snap) => setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('useBudgets:', err)
    );
    return unsub;
  }, [uid]);

  const setBudget = useCallback(async (categoryId, month, amount) => {
    // month format: 'YYYY-MM'
    const id  = `${categoryId}_${month}`;
    const ref = doc(db, `users/${uid}/budgets`, id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, { amount, categoryId, month });
    } else {
      await addDoc(collection(db, `users/${uid}/budgets`), { amount, categoryId, month, id });
    }
  }, [uid]);

  const removeBudget = useCallback(async (id) => {
    await deleteDoc(doc(db, `users/${uid}/budgets`, id));
  }, [uid]);

  return { budgets, setBudget, removeBudget };
}

// ─────────────────────────────────────────────────────────────────────────────
// useHiddenBalances — persisted to localStorage
// ─────────────────────────────────────────────────────────────────────────────
export function useHiddenBalances(uid) {
  const key = uid ? CACHE.KEYS.hiddenBals(uid) : null;

  const [hidden, setHidden] = useState(() => {
    if (!key) return {};
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  });

  const toggle = useCallback((accountId) => {
    setHidden(prev => {
      const next = { ...prev, [accountId]: !prev[accountId] };
      if (key) {
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  }, [key]);

  const isHidden = useCallback((accountId) => !!hidden[accountId], [hidden]);

  return { hidden, toggle, isHidden };
}