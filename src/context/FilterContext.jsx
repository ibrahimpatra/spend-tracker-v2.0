// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — context/FilterContext.jsx
// Global filter: date range + account selection.
// Any page that reads transactions should use useFilter().
// Changes here instantly update Dashboard, Records, AND Insights.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CACHE } from '../constants';

// ─── Default filter state ──────────────────────────────────────────────────────
const DEFAULT_FILTER = {
  dateRange:    'thisMonth',   // one of DATE_RANGES values
  accountIds:   [],            // empty = all accounts
  customStart:  '',            // ISO string 'YYYY-MM-DD', only used when dateRange = 'custom'
  customEnd:    '',
};

// ─── Context ───────────────────────────────────────────────────────────────────
const FilterContext = createContext(null);

// ─── Provider ──────────────────────────────────────────────────────────────────
export function FilterProvider({ uid, children }) {
  // Restore last filter from localStorage so it persists across sessions
  const [filter, setFilterRaw] = useState(() => {
    if (!uid) return DEFAULT_FILTER;
    try {
      const stored = localStorage.getItem(CACHE.KEYS.filterState(uid));
      if (stored) return { ...DEFAULT_FILTER, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return DEFAULT_FILTER;
  });

  // Persist filter to localStorage on every change
  useEffect(() => {
    if (!uid) return;
    try {
      localStorage.setItem(CACHE.KEYS.filterState(uid), JSON.stringify(filter));
    } catch { /* ignore */ }
  }, [filter, uid]);

  const setFilter = useCallback((updater) => {
    setFilterRaw(prev =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
    );
  }, []);

  const resetFilter = useCallback(() => setFilterRaw(DEFAULT_FILTER), []);

  // ─── Computed date bounds ────────────────────────────────────────────────────
  const dateBounds = useMemo(() => getDateBounds(filter), [filter]);

  const value = useMemo(() => ({
    filter,
    setFilter,
    resetFilter,
    dateBounds,
    hasActiveFilter: filter.dateRange !== 'thisMonth' || filter.accountIds.length > 0,
  }), [filter, setFilter, resetFilter, dateBounds]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilter must be used inside <FilterProvider>');
  return ctx;
}

// ─── getDateBounds ─────────────────────────────────────────────────────────────
/**
 * Given a filter state, return { start: Date, end: Date }.
 * end is always set to 23:59:59 of that day so queries are inclusive.
 * Pure function — no side effects, easy to test.
 */
export function getDateBounds(filter) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let start, end;

  switch (filter.dateRange) {

    case 'today':
      start = new Date(today);
      end   = new Date(today);
      break;

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = new Date(y);
      end   = new Date(y);
      break;
    }

    case 'thisWeek': {
      const day = today.getDay();                         // 0 = Sun
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Mon
      start = new Date(today.getFullYear(), today.getMonth(), diff);
      end   = new Date(today);
      break;
    }

    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(today);
      break;

    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end   = new Date(now.getFullYear(), now.getMonth(), 0);      // last day of prev month
      break;

    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1);
      end   = new Date(today);
      break;

    case 'custom':
      if (filter.customStart && filter.customEnd) {
        start = new Date(filter.customStart);
        end   = new Date(filter.customEnd);
      } else {
        // fallback to this month if custom dates not set
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end   = new Date(today);
      }
      break;

    case 'allTime':
    default:
      start = new Date('2000-01-01');
      end   = new Date(today);
      break;
  }

  // Always set end to end of day
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// ─── Human-readable label for current filter ─────────────────────────────────
export function getFilterLabel(filter) {
  switch (filter.dateRange) {
    case 'today':      return 'Today';
    case 'yesterday':  return 'Yesterday';
    case 'thisWeek':   return 'This Week';
    case 'thisMonth':  return 'This Month';
    case 'lastMonth':  return 'Last Month';
    case 'thisYear':   return 'This Year';
    case 'allTime':    return 'All Time';
    case 'custom': {
      if (filter.customStart && filter.customEnd) {
        const fmt = (s) => new Date(s).toLocaleDateString('default', { month: 'short', day: 'numeric' });
        return `${fmt(filter.customStart)} – ${fmt(filter.customEnd)}`;
      }
      return 'Custom';
    }
    default: return 'This Month';
  }
}