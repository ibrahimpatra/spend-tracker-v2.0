import {useState, useEffect, useMemo} from 'react';
import {db} from '../firebase';
import {
  collection, onSnapshot, query, where,
  orderBy, Timestamp, addDoc, doc, updateDoc,
  deleteDoc, getDocs, increment,
} from 'firebase/firestore';
import {isIncome, isExpense, TX} from '../constants';

// ─── Generic listener ─────────────────────────────────────────────────────
function useCollection(path) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!path) return;
    return onSnapshot(collection(db, path),
      s => setData(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [path]);
  return data;
}

export const useAccounts   = uid => useCollection(uid ? `users/${uid}/accounts`   : null);
export const useCategories = uid => useCollection(uid ? `users/${uid}/categories` : null);

// ─── Transactions with date filter ─────────────────────────────────────────
export function useTransactions(uid, filter) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!uid) return;
    let start = new Date(), end = new Date();
    end.setHours(23, 59, 59, 999);
    switch (filter?.range) {
      case 'lastMonth':
        start = new Date(start.getFullYear(), start.getMonth()-1, 1);
        end   = new Date(end.getFullYear(),   end.getMonth(),    0);
        end.setHours(23,59,59,999); break;
      case 'thisYear':
        start = new Date(start.getFullYear(), 0, 1); break;
      case 'all':
        start = new Date('2000-01-01'); break;
      case 'custom':
        if (filter.from && filter.to) {
          start = new Date(filter.from);
          end   = new Date(filter.to); end.setHours(23,59,59,999);
        } break;
      default: // thisMonth
        start = new Date(start.getFullYear(), start.getMonth(), 1);
    }
    const q = query(
      collection(db, `users/${uid}/transactions`),
      where('date','>=',Timestamp.fromDate(start)),
      where('date','<=',Timestamp.fromDate(end)),
      orderBy('date','desc'),
    );
    return onSnapshot(q, s => {
      const rows = s.docs.map(d => ({id:d.id,...d.data(),dateObj:d.data().date.toDate()}));
      const out  = filter?.accountId
        ? rows.filter(t => t.accountId === filter.accountId)
        : rows;
      setData(out);
    });
  }, [uid, filter]);
  return data;
}

// ─── Budgets for a given month (YYYY-MM) ──────────────────────────────────
export function useBudgets(uid, monthYear) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!uid || !monthYear) return;
    const q = query(collection(db, `users/${uid}/budgets`), where('monthYear','==',monthYear));
    return onSnapshot(q, s => setData(s.docs.map(d => ({id:d.id,...d.data()}))));
  }, [uid, monthYear]);
  return data;
}

// ─── Computed stats ────────────────────────────────────────────────────────
export function useStats(txns) {
  return useMemo(() => {
    const s = {};
    txns.forEach(t => {
      const c = t.currency;
      if (!s[c]) s[c] = {income:0, expense:0};
      if (isIncome(t.type))  s[c].income  += t.amount;
      if (isExpense(t.type)) s[c].expense += t.amount;
    });
    return s;
  }, [txns]);
}

export function useTrend(txns) {
  return useMemo(() => {
    const m = {};
    [...txns].sort((a,b)=>a.dateObj-b.dateObj).forEach(t => {
      const k = t.dateObj.toLocaleDateString('default',{month:'short',day:'numeric'});
      if (!m[k]) m[k] = {name:k, Income:0, Expense:0, _d:t.dateObj};
      if (isIncome(t.type))  m[k].Income  += t.amount;
      if (isExpense(t.type)) m[k].Expense += t.amount;
    });
    return Object.values(m);
  }, [txns]);
}

export function useCatSpend(txns, categories) {
  return useMemo(() => {
    const m = {};
    txns.filter(t => t.type==='expense').forEach(t => {
      const cat   = categories.find(c => c.id===t.categoryId);
      const name  = cat?.name  || 'Uncategorized';
      const color = cat?.color || '#8E8E93';
      if (!m[name]) m[name] = {name, value:0, color, catId:t.categoryId};
      m[name].value += t.amount;
    });
    return Object.values(m).sort((a,b)=>b.value-a.value);
  }, [txns, categories]);
}

// ─── Firestore write helpers ───────────────────────────────────────────────
export async function saveTx({uid, payload, editId, editOriginal}) {
  const txCol  = collection(db, `users/${uid}/transactions`);
  const accRef = (id) => doc(db, `users/${uid}/accounts`, id);

  // Revert original if editing
  if (editId && editOriginal) {
    const ref = accRef(editOriginal.accountId);
    if (isIncome(editOriginal.type))  await updateDoc(ref, {currentBalance: increment(-editOriginal.amount)});
    else if (isExpense(editOriginal.type)) await updateDoc(ref, {currentBalance: increment(editOriginal.amount)});
    await deleteDoc(doc(db, `users/${uid}/transactions`, editId));
  }

  const {type, amount, fromId, toId, fromAcc, toAcc, date, note, categoryId, receivedAmount} = payload;

  if (type==='internal_transfer') {
    const recv = receivedAmount || amount;
    await addDoc(txCol,{type:TX.OUT_TRANSFER,amount,date,accountId:fromId,currency:fromAcc.currency,note:note?`${note} → ${toAcc.name}`:`Transfer → ${toAcc.name}`,userId:uid});
    await updateDoc(accRef(fromId), {currentBalance: increment(-amount)});
    await addDoc(txCol,{type:TX.IN_TRANSFER,amount:recv,date,accountId:toId,currency:toAcc.currency,note:note?`${note} ← ${fromAcc.name}`:`Transfer ← ${fromAcc.name}`,userId:uid});
    await updateDoc(accRef(toId), {currentBalance: increment(recv)});
  } else {
    await addDoc(txCol, {type,amount,date,accountId:fromId,currency:fromAcc.currency,note,categoryId:categoryId||null,userId:uid});
    if (isIncome(type))  await updateDoc(accRef(fromId), {currentBalance: increment(amount)});
    if (isExpense(type)) await updateDoc(accRef(fromId), {currentBalance: increment(-amount)});
  }
}

export async function deleteTx(uid, tx) {
  const ref = doc(db, `users/${uid}/accounts`, tx.accountId);
  if (isIncome(tx.type))  await updateDoc(ref, {currentBalance: increment(-tx.amount)});
  if (isExpense(tx.type)) await updateDoc(ref, {currentBalance: increment(tx.amount)});
  await deleteDoc(doc(db, `users/${uid}/transactions`, tx.id));
}
