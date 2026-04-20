import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';

import GlobalFilter from '../components/GlobalFilter';
import AddTransaction from '../components/AddTransactions';
import BalanceCard from '../components/analytics/BalanceCard';
import BalanceComparison from '../components/analytics/BalanceComparison';
import CashFlowTrend from '../components/analytics/CashFlowTrend';
import ExpenseBreakdown from '../components/analytics/ExpenseBreakdown';

// ─── Tiny stat card ───────────────────────────────────────────────────────────
function StatPill({ label, value, color = 'text-bank-900' }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-bank-500 uppercase tracking-wide truncate">{label}</p>
      <p className={`text-base font-extrabold mt-0.5 truncate ${color}`}>{value}</p>
    </div>
  );
}

// ─── Recent transaction row ───────────────────────────────────────────────────
function RecentRow({ t, categories }) {
  const isTransfer = ['transfer','out_transfer','in_transfer'].includes(t.type);
  const cat = categories.find(c => c.id === t.categoryId);
  const isIncome = t.type === 'income' || t.type === 'in_transfer';

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-default">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
        isTransfer ? 'bg-blue-50 text-[#007AFF]' :
        isIncome   ? 'bg-green-50 text-[#34C759]' :
                     'bg-red-50   text-[#FF3B30]'
      }`}>
        {isTransfer ? '⇄' : isIncome ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-bank-900 truncate">{t.note || cat?.name || 'Transaction'}</p>
        <p className="text-[11px] text-bank-500">
          {t.dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${
          isIncome ? 'text-[#34C759]' : isTransfer ? 'text-[#007AFF]' : 'text-bank-900'
        }`}>
          {isIncome ? '+' : '-'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[10px] text-bank-500 uppercase">{t.currency}</p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({
    dateRange: 'thisMonth', accountIds: [], customStart: '', customEnd: ''
  });
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);  // ← FIX: needed for pie chart names
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch accounts
  useEffect(() => {
    return onSnapshot(
      collection(db, `users/${user.uid}/accounts`),
      snap => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  // Fetch categories (needed to resolve names in pie chart)
  useEffect(() => {
    return onSnapshot(
      collection(db, `users/${user.uid}/categories`),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  // Fetch transactions by date range
  useEffect(() => {
    let start = new Date();
    let end   = new Date();

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
      collection(db, `users/${user.uid}/transactions`),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end))
    );

    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ ...d.data(), dateObj: d.data().date.toDate() }));
      const filtered = filter.accountIds.length > 0
        ? all.filter(t => filter.accountIds.includes(t.accountId))
        : all;
      setTransactions(filtered.sort((a, b) => b.dateObj - a.dateObj));
    });
  }, [user, filter]);

  // ── Logic ─────────────────────────────────────────────────────────────────
  const selectedAccounts = filter.accountIds.length > 0
    ? accounts.filter(a => filter.accountIds.includes(a.id))
    : accounts;

  const isSingleAccount = filter.accountIds.length === 1;
  const uniqueCurrencies = new Set(selectedAccounts.map(a => a.currency));
  const isSameCurrency   = uniqueCurrencies.size <= 1;

  const showTrend      = isSingleAccount;
  const showExpense    = isSingleAccount || isSameCurrency;
  const showComparison = !isSingleAccount;

  // Balance cards data
  const balancesByCurrency = selectedAccounts.reduce((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + a.currentBalance;
    return acc;
  }, {});

  // Summary stats (single currency only)
  const primaryCurrency = selectedAccounts[0]?.currency;
  const periodIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const periodExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const periodNet     = periodIncome - periodExpense;

  // Area chart data
  const trendDataMap = transactions.reduce((acc, t) => {
    const key = t.dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    if (!acc[key]) acc[key] = { name: key, Income: 0, Expense: 0, _d: t.dateObj };
    if (t.type === 'income') acc[key].Income  += t.amount;
    if (t.type === 'expense') acc[key].Expense += t.amount;
    return acc;
  }, {});
  const trendData = Object.values(trendDataMap).sort((a, b) => a._d - b._d);

  // Bar chart data
  const barData = selectedAccounts.map(a => ({
    name: a.name, Balance: a.currentBalance, currency: a.currency
  }));

  // Pie chart data — FIX: resolve category names
  const pieData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const catName = categories.find(c => c.id === t.categoryId)?.name
          || (t.categoryId === 'INITIAL_SETUP' ? 'Initial Setup' : 'Uncategorized');
        acc[catName] = (acc[catName] || 0) + t.amount;
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="relative">

      {/* Filter + Add button row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2">
        <div className="flex-1">
          <GlobalFilter filterState={filter} setFilterState={setFilter} accounts={accounts} />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center gap-2 flex-shrink-0 bg-money-600 hover:bg-money-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition active:scale-95 mt-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Summary Stats Row */}
      {selectedAccounts.length > 0 && isSameCurrency && (
        <div className="flex gap-3 mb-5 overflow-x-auto pb-1 no-scrollbar">
          <StatPill
            label="Income"
            value={`${primaryCurrency} ${fmt(periodIncome)}`}
            color="text-[#34C759]"
          />
          <StatPill
            label="Expenses"
            value={`${primaryCurrency} ${fmt(periodExpense)}`}
            color="text-[#FF3B30]"
          />
          <StatPill
            label="Net"
            value={`${primaryCurrency} ${fmt(periodNet)}`}
            color={periodNet >= 0 ? 'text-[#007AFF]' : 'text-[#FF3B30]'}
          />
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-5 pb-28">

        {/* ── Left column ─── */}
        <div className="md:col-span-7 space-y-5">

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(balancesByCurrency).map(([curr, total], idx) => (
              <BalanceCard
                key={curr}
                currency={curr}
                balance={total}
                label={isSingleAccount ? selectedAccounts[0]?.name : 'Total Balance'}
                index={idx}
              />
            ))}
            {selectedAccounts.length === 0 && (
              <div className="col-span-2 border-2 border-dashed border-gray-200 p-10 rounded-2xl text-bank-500 text-center text-sm">
                No accounts found. <a href="/accounts" className="text-money-600 font-bold">Create one →</a>
              </div>
            )}
          </div>

          {/* Charts */}
          {showTrend      && <CashFlowTrend data={trendData} />}
          {showComparison && <BalanceComparison data={barData} />}
          {showExpense    && (
            <div className="h-[260px]">
              <ExpenseBreakdown data={pieData} />
            </div>
          )}
        </div>

        {/* ── Right column — Recent Activity ─── */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col max-h-[680px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-bank-900">Recent Activity</h3>
              <button
                onClick={() => navigate('/records')}
                className="text-xs font-bold text-money-600 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
              {transactions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-bank-500 text-sm py-12">
                  No transactions this period
                </div>
              ) : (
                transactions.slice(0, 20).map((t, i) => (
                  <RecentRow key={i} t={t} categories={categories} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-money-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:bg-money-700 transition active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <AddTransaction user={user} onClose={() => setShowAddModal(false)} />
        </div>
      )}
    </div>
  );
}
