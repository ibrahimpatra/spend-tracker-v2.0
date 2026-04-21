import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { IOS, CURRENCIES, CHART_COLORS } from '../constants';
import { isIncome, isTransfer, isExpense } from '../hooks/useData';
import { SvgIcon } from '../utils/icons';

// ─── Shared tooltip ───────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)',
      border: `1px solid ${IOS.gray8}`,
      borderRadius: 10, padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 11,
    }}>
      {label && <p style={{ margin: '0 0 4px', fontWeight: 700, color: IOS.gray3 }}>{label}</p>}
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
          <span style={{ color: IOS.gray4 }}>{e.name}:</span>
          <span style={{ fontWeight: 700, color: IOS.gray1 }}>
            {typeof e.value === 'number'
              ? e.value.toLocaleString(undefined, { minimumFractionDigits: 2 })
              : e.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Small section card ───────────────────────────────────────────────────────
const Section = ({ title, children, style }) => (
  <div style={{
    background: '#fff', borderRadius: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)',
    overflow: 'hidden', marginBottom: 12, ...style,
  }}>
    {title && (
      <div style={{ padding: '12px 16px 0' }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
      </div>
    )}
    {children}
  </div>
);

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ t, categories, accounts, onDrillFurther }) {
  const isTrf = isTransfer(t.type);
  const isIn  = isIncome(t.type);
  const cat   = categories.find(c => c.id === t.categoryId);
  const acc   = accounts.find(a => a.id === t.accountId)?.name || '';

  return (
    <div
      onClick={() => onDrillFurther && onDrillFurther(t)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        borderBottom: `1px solid ${IOS.gray9}`,
        cursor: onDrillFurther ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = IOS.gray9}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: isTrf ? IOS.blue + '14' : isIn ? IOS.green + '14' : IOS.red + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isTrf ? <span style={{ fontSize: 14 }}>⇄</span>
          : cat ? <SvgIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
          : <span style={{ fontSize: 12 }}>{isIn ? '↓' : '↑'}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: IOS.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.note || cat?.name || 'Transaction'}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: IOS.gray5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{t.dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          {acc && <><span style={{ color: IOS.gray8 }}>·</span><span style={{ textTransform: 'uppercase', fontSize: 10 }}>{acc}</span></>}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 700,
          color: isIn ? IOS.green : t.type === 'out_transfer' ? IOS.red : isTrf ? IOS.blue : IOS.gray1,
        }}>
          {isIn ? '+' : (!isTrf ? '-' : '')}
          {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p style={{ margin: 0, fontSize: 9, color: IOS.gray5, textTransform: 'uppercase', fontWeight: 600 }}>{t.currency}</p>
      </div>
    </div>
  );
}

// ─── Context-specific charts ──────────────────────────────────────────────────

// CATEGORY drilldown: daily trend + % of total
function CategoryDrill({ txns, cat, allExpenses }) {
  const daily = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      if (!m[k]) m[k] = { name: k, Amount: 0, _d: t.dateObj };
      m[k].Amount += t.amount;
    });
    return Object.values(m).sort((a, b) => a._d - b._d);
  }, [txns]);

  const totalCat   = txns.reduce((s, t) => s + t.amount, 0);
  const totalAll   = allExpenses.reduce((s, t) => s + t.amount, 0);
  const pct        = totalAll > 0 ? ((totalCat / totalAll) * 100).toFixed(1) : 0;
  const avg        = txns.length > 0 ? (totalCat / txns.length) : 0;
  const currency   = txns[0]?.currency || '';
  const sym        = CURRENCIES.find(c => c.code === currency)?.symbol || currency;

  return (
    <>
      {/* Stats row */}
      <Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
            { l: 'Total Spent', v: `${sym}${totalCat.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            { l: '% of Expenses', v: `${pct}%` },
            { l: 'Per Transaction', v: `${sym}${avg.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${IOS.gray9}` : 'none', textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: IOS.gray1, letterSpacing: -0.3 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Daily spend trend */}
      {daily.length > 1 && (
        <Section title="Daily Spending Trend">
          <div style={{ padding: '12px 16px 16px', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cat?.color || IOS.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={cat?.color || IOS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="Amount" stroke={cat?.color || IOS.blue} strokeWidth={2}
                  fill="url(#ddGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}
    </>
  );
}

// ACCOUNT drilldown: running balance + income vs expense bars
function AccountDrill({ txns, account }) {
  const sym = CURRENCIES.find(c => c.code === account?.currency)?.symbol || '';

  const runningBalance = useMemo(() => {
    const sorted = [...txns].sort((a, b) => a.dateObj - b.dateObj);
    let bal = account?.initialBalance || 0;
    return sorted.map(t => {
      if (isIncome(t.type)) bal += t.amount;
      else if (isExpense(t.type)) bal -= t.amount;
      return {
        name: t.dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        Balance: parseFloat(bal.toFixed(2)),
        _d: t.dateObj,
      };
    });
  }, [txns, account]);

  const monthlyFlow = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!m[k]) m[k] = { name: k, Income: 0, Expense: 0, _d: t.dateObj };
      if (isIncome(t.type))  m[k].Income  += t.amount;
      if (isExpense(t.type)) m[k].Expense += t.amount;
    });
    return Object.values(m).sort((a, b) => a._d - b._d);
  }, [txns]);

  const totalIn  = txns.filter(t => isIncome(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = txns.filter(t => isExpense(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <>
      {/* Stats */}
      <Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
            { l: 'Current Balance', v: `${sym}${(account?.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, c: (account?.currentBalance || 0) >= 0 ? IOS.blue : IOS.red },
            { l: 'Total In', v: `${sym}${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, c: IOS.green },
            { l: 'Total Out', v: `${sym}${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, c: IOS.red },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${IOS.gray9}` : 'none', textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: s.c, letterSpacing: -0.3 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Running balance */}
      {runningBalance.length > 1 && (
        <Section title="Running Balance">
          <div style={{ padding: '12px 16px 16px', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runningBalance} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="Balance" stroke={IOS.blue} strokeWidth={2}
                  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Monthly income vs expense */}
      {monthlyFlow.length > 0 && (
        <Section title="Monthly Income vs Expense">
          <div style={{ padding: '12px 16px 16px', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlow} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <Tooltip content={<Tip />} cursor={{ fill: IOS.gray9 + '88' }} />
                <Bar dataKey="Income"  fill={IOS.green} radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="Expense" fill={IOS.red}   radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}
    </>
  );
}

// MONTH drilldown: category donut + daily trend
function MonthDrill({ txns, categories }) {
  const catBreakdown = useMemo(() => {
    const m = {};
    txns.filter(t => t.type === 'expense').forEach(t => {
      const cat   = categories.find(c => c.id === t.categoryId);
      const name  = cat?.name  || 'Uncategorized';
      const color = cat?.color || IOS.gray5;
      if (!m[name]) m[name] = { name, value: 0, color };
      m[name].value += t.amount;
    });
    return Object.values(m).sort((a, b) => b.value - a.value);
  }, [txns, categories]);

  const daily = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj.toLocaleDateString('default', { day: 'numeric' });
      if (!m[k]) m[k] = { name: k, Income: 0, Expense: 0, _d: t.dateObj };
      if (isIncome(t.type))  m[k].Income  += t.amount;
      if (isExpense(t.type)) m[k].Expense += t.amount;
    });
    return Object.values(m).sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [txns]);

  const currency = txns[0]?.currency || '';
  const sym      = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const totalIn  = txns.filter(t => isIncome(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = txns.filter(t => isExpense(t.type)).reduce((s, t) => s + t.amount, 0);
  const net      = totalIn - totalOut;
  const total    = catBreakdown.reduce((s, d) => s + d.value, 0);

  return (
    <>
      {/* Stats */}
      <Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
            { l: 'Income',   v: `${sym}${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,  c: IOS.green },
            { l: 'Expenses', v: `${sym}${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, c: IOS.red },
            { l: 'Net',      v: `${sym}${net.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,      c: net >= 0 ? IOS.blue : IOS.red },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${IOS.gray9}` : 'none', textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: s.c, letterSpacing: -0.3 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Category donut + legend */}
      {catBreakdown.length > 0 && (
        <Section title="Spending by Category">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 16px' }}>
            <div style={{ width: 110, height: 110, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catBreakdown} dataKey="value" innerRadius={32} outerRadius={50} paddingAngle={3} startAngle={90} endAngle={-270}>
                    {catBreakdown.map((d, i) => <Cell key={i} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [v.toLocaleString(undefined, { minimumFractionDigits: 2 }), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catBreakdown.slice(0, 6).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color || CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: IOS.gray2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: IOS.gray4, flexShrink: 0 }}>
                    {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Daily cash flow */}
      {daily.length > 1 && (
        <Section title="Daily Cash Flow">
          <div style={{ padding: '12px 16px 16px', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <Tooltip content={<Tip />} cursor={{ fill: IOS.gray9 + '88' }} />
                <Bar dataKey="Income"  fill={IOS.green} radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Expense" fill={IOS.red}   radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}
    </>
  );
}

// TYPE drilldown (income / expense overview)
function TypeDrill({ txns, categories, type }) {
  const catBreakdown = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const cat   = categories.find(c => c.id === t.categoryId);
      const name  = cat?.name  || 'Uncategorized';
      const color = cat?.color || IOS.gray5;
      if (!m[name]) m[name] = { name, value: 0, color };
      m[name].value += t.amount;
    });
    return Object.values(m).sort((a, b) => b.value - a.value);
  }, [txns, categories]);

  const trend = useMemo(() => {
    const m = {};
    txns.forEach(t => {
      const k = t.dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!m[k]) m[k] = { name: k, Amount: 0, _d: t.dateObj };
      m[k].Amount += t.amount;
    });
    return Object.values(m).sort((a, b) => a._d - b._d);
  }, [txns]);

  const total   = txns.reduce((s, t) => s + t.amount, 0);
  const avg     = txns.length > 0 ? total / txns.length : 0;
  const currency = txns[0]?.currency || '';
  const sym      = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const color    = type === 'income' ? IOS.green : IOS.red;

  return (
    <>
      <Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
            { l: 'Total', v: `${sym}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            { l: 'Transactions', v: txns.length.toString() },
            { l: 'Avg per tx', v: `${sym}${avg.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${IOS.gray9}` : 'none', textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: IOS.gray1, letterSpacing: -0.3 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {trend.length > 1 && (
        <Section title="Monthly Trend">
          <div style={{ padding: '12px 16px 16px', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="typeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={IOS.gray9} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: IOS.gray5, fontSize: 9 }} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="Amount" stroke={color} strokeWidth={2} fill="url(#typeGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {catBreakdown.length > 0 && (
        <Section title={`Top Categories`}>
          <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {catBreakdown.slice(0, 6).map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color || CHART_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: IOS.gray2 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: IOS.gray1 }}>
                    {sym}{d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ height: 4, background: IOS.gray9, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.value / catBreakdown[0].value) * 100}%`, background: d.color || CHART_COLORS[i], borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

// ─── DrillDown panel ──────────────────────────────────────────────────────────
/**
 * context = {
 *   type:         'category' | 'account' | 'month' | 'income' | 'expense',
 *   label:        display name
 *   color:        accent color
 *   emoji:        optional
 *   transactions: filtered transactions for this context
 *   allExpenses:  full expense list (for category % calculation)
 *   categories:   all categories
 *   accounts:     all accounts
 *   accountObj:   account object (for account drill)
 *   catObj:       category object (for category drill)
 * }
 */
export default function DrillDown({ context, onClose }) {
  const [txSearch, setTxSearch] = useState('');

  if (!context) return null;

  const {
    type, label, color = IOS.blue, emoji,
    transactions = [], allExpenses = [], categories = [], accounts = [],
    accountObj, catObj,
  } = context;

  const filteredTxns = txSearch
    ? transactions.filter(t =>
        (t.note || '').toLowerCase().includes(txSearch.toLowerCase()) ||
        t.amount.toString().includes(txSearch)
      )
    : transactions;

  const total    = transactions.reduce((s, t) => s + t.amount, 0);
  const currency = transactions[0]?.currency || '';
  const sym      = CURRENCIES.find(c => c.code === currency)?.symbol || currency;

  return createPortal(
    <div
      className="anim-right"
      style={{
        position: 'fixed', inset: 0, zIndex: 9800,
        background: IOS.gray9,
        display: 'flex', flexDirection: 'column',
        overflowY: 'hidden',
      }}
    >
      {/* iOS navigation header */}
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${IOS.gray8}`,
        padding: '0 16px',
        display: 'flex', alignItems: 'center',
        height: 52, flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          color: IOS.blue, fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
          padding: '4px 0', marginRight: 'auto',
        }}>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1 7.5L8 14" stroke={IOS.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 15, fontWeight: 700, color: IOS.gray1 }}>
          {label}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        {/* Hero summary card */}
        <div style={{
          background: color,
          borderRadius: 20, padding: '20px 20px',
          marginBottom: 14, position: 'relative', overflow: 'hidden',
          boxShadow: `0 6px 24px ${color}55`,
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -10, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {type === 'category' ? 'Category Total' : type === 'account' ? 'Account' : type === 'month' ? 'Month Total' : 'Period Total'}
            </p>
            <p style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1.2 }}>
              {sym}{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              {emoji ? ` · ${emoji}` : ''}
            </p>
          </div>
        </div>

        {/* Context-specific charts */}
        {type === 'category' && <CategoryDrill txns={transactions} cat={catObj} allExpenses={allExpenses} />}
        {type === 'account'  && <AccountDrill  txns={transactions} account={accountObj} />}
        {type === 'month'    && <MonthDrill    txns={transactions} categories={categories} />}
        {(type === 'income' || type === 'expense') && <TypeDrill txns={transactions} categories={categories} type={type} />}

        {/* Transaction list */}
        <Section title={`Transactions (${filteredTxns.length})`}>
          {/* Search inside drilldown */}
          <div style={{ padding: '10px 16px 8px', borderBottom: `1px solid ${IOS.gray9}` }}>
            <div style={{ position: 'relative' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.gray5} strokeWidth="2.2"
                style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  width: '100%', paddingLeft: 28, paddingRight: 12, height: 32,
                  borderRadius: 9, border: `1px solid ${IOS.gray8}`,
                  background: IOS.gray9, fontSize: 12, fontFamily: 'inherit',
                  color: IOS.gray1, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = IOS.blue}
                onBlur={e  => e.target.style.borderColor = IOS.gray8}
              />
            </div>
          </div>
          {filteredTxns.length === 0
            ? <p style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: IOS.gray5 }}>No transactions found</p>
            : filteredTxns.map(t => (
                <TxRow key={t.id} t={t} categories={categories} accounts={accounts} />
              ))
          }
        </Section>

        <div style={{ height: 32 }} />
      </div>
    </div>,
    document.body
  );
}