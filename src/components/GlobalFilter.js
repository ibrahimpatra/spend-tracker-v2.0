import React from 'react';

const DATE_RANGES = [
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'all',       label: 'All Time'   },
  { id: 'custom',    label: 'Custom'     },
];

export default function GlobalFilter({ filterState, setFilterState, accounts = [] }) {

  const toggleAccount = (id) => {
    const current = filterState.accountIds;
    const isSelected = current.includes(id);
    const newIds = isSelected
      ? current.filter(x => x !== id)
      : [...current, id];
    setFilterState({ ...filterState, accountIds: newIds });
  };

  const allActive = filterState.accountIds.length === 0;

  return (
    <div className="mb-6 space-y-3">

      {/* Date Range Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DATE_RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setFilterState({ ...filterState, dateRange: r.id })}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filterState.dateRange === r.id
                ? 'bg-money-600 text-white shadow-sm shadow-money-200'
                : 'bg-white text-bank-500 border border-gray-200 hover:border-money-200 hover:text-money-600'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {filterState.dateRange === 'custom' && (
        <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-gray-200 animate-fade-in-down">
          <span className="text-xs font-bold text-bank-500 uppercase tracking-wide flex-shrink-0">From</span>
          <input
            type="date"
            className="bg-gray-50 border border-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-money-400 transition flex-1"
            value={filterState.customStart || ''}
            onChange={(e) => setFilterState({ ...filterState, customStart: e.target.value })}
          />
          <span className="text-xs text-bank-500 flex-shrink-0">→</span>
          <input
            type="date"
            className="bg-gray-50 border border-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-money-400 transition flex-1"
            value={filterState.customEnd || ''}
            onChange={(e) => setFilterState({ ...filterState, customEnd: e.target.value })}
          />
        </div>
      )}

      {/* Account Filter Pills */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterState({ ...filterState, accountIds: [] })}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              allActive
                ? 'bg-bank-900 text-white'
                : 'bg-white text-bank-500 border border-gray-200 hover:border-gray-400'
            }`}
          >
            All Accounts
          </button>
          {accounts.map(acc => {
            const active = filterState.accountIds.includes(acc.id);
            return (
              <button
                key={acc.id}
                onClick={() => toggleAccount(acc.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? 'bg-money-50 text-money-700 border border-money-200'
                    : 'bg-white text-bank-500 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-money-600 flex-shrink-0" />}
                {acc.name}
                <span className="opacity-60">·{acc.currency}</span>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
