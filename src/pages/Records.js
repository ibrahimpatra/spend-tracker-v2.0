import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import AddTransaction from '../components/AddTransactions';
import GlobalFilter from '../components/GlobalFilter';
import { SvgIcon } from '../utils/icons';

const DIMENSIONS = {
  year:     { label: 'Year',     getValue: (t)         => t.dateObj.getFullYear().toString() },
  month:    { label: 'Month',    getValue: (t)         => t.dateObj.toLocaleString('default', { month: 'long', year: 'numeric' }) },
  date:     { label: 'Date',     getValue: (t)         => t.dateObj.toLocaleDateString('default', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
  account:  { label: 'Account',  getValue: (t, accs)   => accs.find(a => a.id === t.accountId)?.name || 'Unknown' },
  currency: { label: 'Currency', getValue: (t)         => t.currency },
  type:     { label: 'Type',     getValue: (t)         => t.type === 'income' ? 'Income' : t.type === 'expense' ? 'Expense' : 'Transfer' },
};

// ─── Type helpers ─────────────────────────────────────────────────────────────
const isTransferType = (type) => ['transfer','out_transfer','in_transfer'].includes(type);
const isIncomeType   = (type) => type === 'income' || type === 'in_transfer';

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TransactionRow({ t, accounts, categories, onEdit }) {
  const isTransfer = isTransferType(t.type);
  const isIncome   = isIncomeType(t.type);
  const cat        = categories.find(c => c.id === t.categoryId);
  const accName    = accounts.find(a => a.id === t.accountId)?.name || '';

  return (
    <div
      onClick={() => onEdit(t)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer group border-b border-gray-50 last:border-0"
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
        style={{
          backgroundColor: isTransfer
            ? '#007AFF'
            : cat?.color || (isIncome ? '#34C759' : '#8E8E93'),
        }}
      >
        {isTransfer
          ? <span className="text-base font-bold">⇄</span>
          : cat
          ? <SvgIcon name={cat.icon} className="w-5 h-5" />
          : <span className="text-base">{isIncome ? '↓' : '↑'}</span>
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-bank-900 truncate group-hover:text-money-700 transition">
          {t.note || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}
        </p>
        <p className="text-xs text-bank-500 flex items-center gap-1.5">
          <span>{t.dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</span>
          {accName && <><span className="text-gray-300">·</span><span className="uppercase text-[10px] tracking-wide">{accName}</span></>}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${
          isIncome ? 'text-[#34C759]' : isTransfer ? 'text-[#007AFF]' : 'text-bank-900'
        }`}>
          {isIncome ? '+' : isTransfer ? '' : '-'}
          {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[10px] font-semibold text-bank-500 uppercase">{t.currency}</p>
      </div>
    </div>
  );
}

// ─── Stats badges ──────────────────────────────────────────────────────────────
function StatsBadges({ stats }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(stats).map(([curr, val]) => {
        const net = val.income - val.expense;
        return (
          <span key={curr} className="text-xs font-semibold text-bank-500 flex items-center gap-1">
            <span className="text-[10px] font-bold text-bank-900 opacity-40">{curr}</span>
            <span className={net >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
              {net >= 0 ? '+' : ''}{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Group node ───────────────────────────────────────────────────────────────
function GroupNode({ node, level, accounts, categories, onEdit }) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isLeaf) {
    return (
      <div>
        {node.items.map(t => (
          <TransactionRow key={t.id} t={t} accounts={accounts} categories={categories} onEdit={onEdit} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {node.children.map(child => (
        <div key={child.key}>
          <button
            onClick={() => setIsOpen(o => !o)}
            className={`w-full flex items-center justify-between px-4 py-2.5 transition border-b border-gray-100 ${
              level === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50 pl-8'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className={`w-4 h-4 text-bank-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-bold text-bank-900">{child.key}</span>
              <span className="text-xs text-bank-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{child.count}</span>
            </div>
            <StatsBadges stats={child.stats} />
          </button>
          {isOpen && (
            <div className={level > 0 ? 'border-l-2 border-money-100 ml-4' : ''}>
              <GroupNode node={child} level={level + 1} accounts={accounts} categories={categories} onEdit={onEdit} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Records page ─────────────────────────────────────────────────────────────
export default function Records({ user }) {
  const [filter, setFilter] = useState({ dateRange: 'thisMonth', accountIds: [], customStart: '', customEnd: '' });
  const [transactions, setTransactions] = useState([]);
  const [accounts,     setAccounts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [groupingPath, setGroupingPath] = useState([]);
  const [showGroupMenu,setShowGroupMenu] = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editData,     setEditData]     = useState(null);
  const groupMenuRef = useRef(null);

  // Close group menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) setShowGroupMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, `users/${user.uid}/accounts`),
      s => setAccounts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, `users/${user.uid}/categories`),
      s => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [user]);

  useEffect(() => {
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
      collection(db, `users/${user.uid}/transactions`),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data(), dateObj: d.data().date.toDate() }));
      const filtered = filter.accountIds.length > 0
        ? all.filter(t => filter.accountIds.includes(t.accountId))
        : all;
      setTransactions(filtered);
    });
  }, [user, filter]);

  const filteredList = useMemo(() =>
    transactions.filter(t => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (t.note && t.note.toLowerCase().includes(term)) || t.amount.toString().includes(term);
    }),
    [transactions, searchTerm]
  );

  // ─── Grouping engine ───────────────────────────────────────────────────────
  const calcStats = (items) => {
    const stats = {};
    items.forEach(t => {
      const c = t.currency;
      if (!stats[c]) stats[c] = { income: 0, expense: 0 };
      if (isIncomeType(t.type))   stats[c].income  += t.amount;
      else if (t.type === 'expense') stats[c].expense += t.amount;
    });
    return stats;
  };

  const buildGroups = (items, keys) => {
    if (keys.length === 0) return { isLeaf: true, items, stats: calcStats(items), count: items.length };
    const [head, ...tail] = keys;
    const map = {};
    items.forEach(t => {
      const k = DIMENSIONS[head].getValue(t, accounts);
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    const children = Object.entries(map)
      .map(([k, its]) => ({ key: k, ...buildGroups(its, tail) }))
      .sort((a, b) => b.key.localeCompare(a.key, undefined, { numeric: true }));
    return { isLeaf: false, children, stats: calcStats(items), count: items.length };
  };

  const grouped = useMemo(() => buildGroups(filteredList, groupingPath), [filteredList, groupingPath, accounts]);

  const toggleDim = (key) =>
    setGroupingPath(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);

  // ─── Totals bar ────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const stats = {};
    filteredList.forEach(t => {
      if (!stats[t.currency]) stats[t.currency] = { income: 0, expense: 0 };
      if (isIncomeType(t.type))    stats[t.currency].income  += t.amount;
      else if (t.type === 'expense') stats[t.currency].expense += t.amount;
    });
    return stats;
  }, [filteredList]);

  return (
    <div className="pb-28">
      <GlobalFilter filterState={filter} setFilterState={setFilter} accounts={accounts} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-extrabold text-bank-900 flex-1">Transaction History</h2>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bank-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm w-full sm:w-52 focus:outline-none focus:border-money-400 transition"
            />
          </div>

          {/* Group By */}
          <div className="relative" ref={groupMenuRef}>
            <button
              onClick={() => setShowGroupMenu(o => !o)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition ${
                groupingPath.length > 0
                  ? 'bg-money-600 text-white border-money-600'
                  : 'bg-white text-bank-900 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16"/>
              </svg>
              Group{groupingPath.length > 0 ? ` (${groupingPath.length})` : ''}
            </button>
            {showGroupMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-in-down p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-bank-500 uppercase tracking-wide">Group By</span>
                  {groupingPath.length > 0 && (
                    <button onClick={() => setGroupingPath([])} className="text-xs text-[#FF3B30] font-semibold hover:underline">
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {Object.entries(DIMENSIONS).map(([key, dim]) => {
                    const active = groupingPath.includes(key);
                    const idx    = groupingPath.indexOf(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleDim(key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition ${
                          active
                            ? 'bg-money-50 text-money-700 border border-money-200'
                            : 'text-bank-900 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        {dim.label}
                        {active && (
                          <span className="w-5 h-5 rounded-full bg-money-600 text-white text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Add */}
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-money-600 hover:bg-money-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Period totals bar */}
      {Object.keys(totals).length > 0 && (
        <div className="flex flex-wrap gap-4 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
          {Object.entries(totals).map(([curr, val]) => (
            <div key={curr} className="flex items-center gap-4 text-sm">
              <span className="font-bold text-bank-500 text-xs">{curr}</span>
              <span className="text-[#34C759] font-bold">
                +{val.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[#FF3B30] font-bold">
                -{val.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`font-bold ${val.income - val.expense >= 0 ? 'text-[#007AFF]' : 'text-[#FF3B30]'}`}>
                ={' '}
                {(val.income - val.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-bank-500 text-sm">No records found</div>
        ) : groupingPath.length === 0 ? (
          <div>
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex justify-between text-[11px] font-bold text-bank-500 uppercase tracking-wide">
              <span>Transaction</span>
              <span>Amount</span>
            </div>
            {filteredList.map(t => (
              <TransactionRow key={t.id} t={t} accounts={accounts} categories={categories}
                onEdit={(t) => { setEditData(t); setShowModal(true); }} />
            ))}
          </div>
        ) : (
          <GroupNode node={grouped} level={0} accounts={accounts} categories={categories}
            onEdit={(t) => { setEditData(t); setShowModal(true); }} />
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditData(null); setShowModal(true); }}
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-money-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 transition active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
        </svg>
      </button>

      {showModal && (
        <AddTransaction user={user} onClose={() => setShowModal(false)} editData={editData} />
      )}
    </div>
  );
}
