import React from 'react';

const DATE_RANGES = [
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'all',       label: 'All Time'   },
  { id: 'custom',    label: 'Custom'     },
];

export default function GlobalFilter({ filterState, setFilterState, accounts = [] }) {
  const toggleAccount = (id) => {
    const ids = filterState.accountIds.includes(id)
      ? filterState.accountIds.filter(x => x !== id)
      : [...filterState.accountIds, id];
    setFilterState({ ...filterState, accountIds: ids });
  };
  const allActive = filterState.accountIds.length === 0;

  return (
    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* Date + account pills in one scrollable row */}
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }} className="scroll">

        {/* Date range pills */}
        {DATE_RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setFilterState({ ...filterState, dateRange: r.id })}
            style={{
              flexShrink: 0, padding: '4px 10px',
              borderRadius: 'var(--r-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              border: filterState.dateRange === r.id ? '1px solid var(--c-primary-muted)' : '1px solid var(--c-border)',
              background: filterState.dateRange === r.id ? 'var(--c-primary-light)' : 'var(--c-surface)',
              color: filterState.dateRange === r.id ? 'var(--c-primary)' : 'var(--c-text-3)',
              cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}
          >
            {r.label}
          </button>
        ))}

        {/* Divider */}
        {accounts.length > 0 && (
          <div style={{ width: 1, height: 20, background: 'var(--c-border)', alignSelf: 'center', flexShrink: 0 }} />
        )}

        {/* All accounts button */}
        {accounts.length > 0 && (
          <button
            onClick={() => setFilterState({ ...filterState, accountIds: [] })}
            style={{
              flexShrink: 0, padding: '4px 10px',
              borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 600,
              border: allActive ? '1px solid var(--c-text-1)' : '1px solid var(--c-border)',
              background: allActive ? 'var(--c-text-1)' : 'var(--c-surface)',
              color: allActive ? '#fff' : 'var(--c-text-3)',
              cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}
          >
            All
          </button>
        )}

        {/* Account pills */}
        {accounts.map(acc => {
          const active = filterState.accountIds.includes(acc.id);
          return (
            <button
              key={acc.id}
              onClick={() => toggleAccount(acc.id)}
              style={{
                flexShrink: 0, padding: '4px 9px',
                borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 600,
                border: active ? '1px solid var(--c-primary-muted)' : '1px solid var(--c-border)',
                background: active ? 'var(--c-primary-light)' : 'var(--c-surface)',
                color: active ? 'var(--c-primary)' : 'var(--c-text-3)',
                cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--c-primary)', flexShrink: 0 }} />}
              {acc.name}
              <span style={{ opacity: 0.6 }}>·{acc.currency}</span>
            </button>
          );
        })}
      </div>

      {/* Custom date range row */}
      {filterState.dateRange === 'custom' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px', background: 'var(--c-surface)',
          border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)',
        }} className="anim-fade">
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>From</span>
          <input
            type="date"
            className="input"
            style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
            value={filterState.customStart || ''}
            onChange={e => setFilterState({ ...filterState, customStart: e.target.value })}
          />
          <span style={{ fontSize: 10, color: 'var(--c-text-4)' }}>→</span>
          <input
            type="date"
            className="input"
            style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
            value={filterState.customEnd || ''}
            onChange={e => setFilterState({ ...filterState, customEnd: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
