// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — pages/Accounts.jsx
// • Net worth summary per currency at top (never mixed)
// • Accounts grouped by type (Bank / Cash / Savings / Credit / Investment / Wallet)
// • Per-account balance with hide/show toggle
// • Tap account → /accounts/:id (real URL drill-down)
// • Add Account bottom sheet with full form
// • Delete with confirmation
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, ACCOUNT_TYPES, CURRENCIES, DEFAULT_CURRENCY } from '../constants';
import { useAccounts, useHiddenBalances } from '../hooks/useData';
import { calcNetWorthByCurrency, formatAmount } from '../utils/currency';
import {
  Icon, Card, InsetCard, SectionHeader, Separator,
  BottomSheet, AlertDialog, PillButton, Skeleton, EmptyState, Spinner, toast,
} from '../components/ui';
import AddAccountOverlay from '../components/AddAccountOverlay';
import { openAddTransaction } from '../components/Layout';

// ─── Account type meta ────────────────────────────────────────────────────────
const TYPE_META = {
  bank:       { label: 'Bank Accounts',    icon: 'Landmark',   color: COLORS.blue    },
  cash:       { label: 'Cash',             icon: 'Banknote',   color: COLORS.green   },
  savings:    { label: 'Savings',          icon: 'PiggyBank',  color: COLORS.teal    },
  credit:     { label: 'Credit Cards',     icon: 'CreditCard', color: COLORS.purple  },
  investment: { label: 'Investments',      icon: 'TrendingUp', color: COLORS.orange  },
  wallet:     { label: 'Digital Wallets',  icon: 'Wallet',     color: COLORS.indigo  },
};

// ─── Net Worth Card ───────────────────────────────────────────────────────────
function NetWorthCard({ accounts }) {
  const worth = useMemo(() => calcNetWorthByCurrency(accounts), [accounts]);
  const currencies = Object.keys(worth);

  if (!currencies.length) return null;

  return (
    <div style={{
      margin: `0 ${SPACE.lg}px ${SPACE.lg}px`,
      background: 'linear-gradient(145deg, #0f2027, #203a43)',
      borderRadius: RADIUS.xxl,
      padding: SPACE.xl,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
    }}>
      {/* Decoration */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 130, height: 130,
        borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
        fontFamily: FONT.family, letterSpacing: '1.2px',
        textTransform: 'uppercase', marginBottom: SPACE.md,
      }}>
        Total Net Worth
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
        {currencies.map((c, i) => (
          <div key={c} style={{ display: 'flex', alignItems: 'baseline', gap: SPACE.sm }}>
            <span style={{
              fontSize: i === 0 ? '34px' : '22px',
              fontWeight: 700, color: '#fff',
              fontFamily: FONT.family, letterSpacing: '-1px',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}>
              {formatAmount(worth[c], c)}
            </span>
            <span style={{
              fontSize: i === 0 ? '14px' : '12px',
              fontWeight: 600, color: 'rgba(255,255,255,0.45)',
              fontFamily: FONT.family, letterSpacing: '0.5px',
            }}>
              {c}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: SPACE.lg,
        fontSize: FONT.caption1.size, color: 'rgba(255,255,255,0.35)',
        fontFamily: FONT.family,
      }}>
        {accounts.length} account{accounts.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ─── Account Row ──────────────────────────────────────────────────────────────
function AccountRow({ account, onPress, isHidden, onToggleHide, last }) {
  const [pressed, setPressed] = useState(false);
  const meta = TYPE_META[account.type] || TYPE_META.bank;

  return (
    <>
      <button
        onClick={() => onPress(account)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md,
          padding: `${SPACE.md}px ${SPACE.lg}px`,
          background: pressed ? COLORS.fillTertiary : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: `background ${ANIM.fast}ms`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Icon blob */}
        <div style={{
          width: 44, height: 44, borderRadius: RADIUS.lg,
          background: `${account.color || meta.color}18`,
          border: `1.5px solid ${account.color || meta.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name={meta.icon} size={20} color={account.color || meta.color} strokeWidth={1.75} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: FONT.callout.size, fontWeight: FONT.semibold,
            color: COLORS.labelPrimary, fontFamily: FONT.family,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {account.name}
          </div>
          <div style={{
            fontSize: FONT.caption1.size, color: COLORS.labelTertiary,
            fontFamily: FONT.family, marginTop: 2,
            textTransform: 'uppercase', letterSpacing: '0.4px',
          }}>
            {meta.label.replace('s', '')} · {account.currency}
          </div>
        </div>

        {/* Balance + hide toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            {isHidden ? (
              <div style={{ fontSize: '16px', letterSpacing: '4px', color: COLORS.labelTertiary }}>••••</div>
            ) : (
              <>
                <div style={{
                  fontSize: FONT.callout.size, fontWeight: FONT.bold,
                  color: account.balance < 0 ? COLORS.expense : COLORS.labelPrimary,
                  fontFamily: FONT.family, fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatAmount(account.balance, account.currency)}
                </div>
                <div style={{
                  fontSize: '10px', fontWeight: 600, color: COLORS.labelQuaternary,
                  fontFamily: FONT.family, letterSpacing: '0.5px', marginTop: 1,
                }}>
                  {account.currency}
                </div>
              </>
            )}
          </div>

          {/* Hide/show */}
          <button
            onClick={e => { e.stopPropagation(); onToggleHide(account.id); }}
            style={{
              width: 30, height: 30, borderRadius: RADIUS.full,
              background: COLORS.fillTertiary, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon name={isHidden ? 'EyeOff' : 'Eye'} size={14} color={COLORS.labelTertiary} strokeWidth={2} />
          </button>

          <Icon name="ChevronRight" size={14} color={COLORS.labelQuaternary} strokeWidth={2.5} />
        </div>
      </button>
      {!last && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: 72 }} />}
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Accounts({ user }) {
  const navigate = useNavigate();
  const { accounts, loading, addAccount } = useAccounts(user.uid);
  const { isHidden, toggle }              = useHiddenBalances(user.uid);
  const [showAdd, setShowAdd]             = useState(false);
  const [saving,  setSaving]              = useState(false);

  // Group by type
  const grouped = useMemo(() => {
    const map = {};
    accounts.forEach(a => {
      const t = a.type || 'bank';
      if (!map[t]) map[t] = [];
      map[t].push(a);
    });
    return map;
  }, [accounts]);

  const typeOrder = ['bank','cash','savings','credit','investment','wallet'];

  const handleAdd = async (payload) => {
    setSaving(true);
    try {
      await addAccount(payload);
      setShowAdd(false);
      toast.show('Account added');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: `${SPACE.xl}px ${SPACE.lg}px ${SPACE.md}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{
          margin: 0, fontSize: FONT.largeTitle.size, fontWeight: FONT.bold,
          color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-0.5px',
        }}>
          Accounts
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 36, height: 36, borderRadius: RADIUS.full,
            background: COLORS.blue, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: SHADOW.md,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="Plus" size={18} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: `0 ${SPACE.lg}px`, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
          <Skeleton height={160} radius={RADIUS.xxl} />
          {[1,2,3].map(i => <Skeleton key={i} height={64} radius={RADIUS.xl} />)}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
            accentColor={COLORS.blue}
          icon="Wallet"
          title="No accounts yet"
          message="Add your first account to start tracking your finances"
          action={() => setShowAdd(true)}
          actionLabel="Add Account"
        />
      ) : (
        <>
          {/* Net worth */}
          <NetWorthCard accounts={accounts} />

          {/* Grouped list */}
          {typeOrder.filter(t => grouped[t]?.length).map(type => {
            const meta = TYPE_META[type];
            const accs = grouped[type];
            return (
              <div key={type} style={{ margin: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
                <div style={{
                  fontSize: FONT.footnote.size, fontWeight: FONT.semibold,
                  color: COLORS.labelSecondary, textTransform: 'uppercase',
                  letterSpacing: '0.8px', fontFamily: FONT.family,
                  padding: `0 ${SPACE.xs}px ${SPACE.xs}px`,
                }}>
                  {meta.label}
                </div>
                <div style={{
                  background: COLORS.surface, borderRadius: RADIUS.xl,
                  overflow: 'hidden', boxShadow: SHADOW.sm,
                }}>
                  {accs.map((acc, i) => (
                    <div key={acc.id} style={{ animation: `mv6-fade-in ${ANIM.normal}ms ${ANIM.ease} ${i * 40}ms both` }}>
                      <AccountRow
                        account={acc}
                        isHidden={isHidden(acc.id)}
                        onToggleHide={toggle}
                        onPress={a => navigate(`/accounts/${a.id}`)}
                        last={i === accs.length - 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {showAdd && (
        <AddAccountOverlay
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
    </div>
  );
}