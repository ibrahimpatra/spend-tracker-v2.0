// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — components/Layout.jsx  (fully responsive)
//
// Mobile  (<768px): Floating frosted-glass pill nav + FAB inside pill
// Desktop (≥768px): Fixed 240px sidebar + full Add Transaction button in sidebar
//
// Global filter strip sticky at top of content area on both layouts.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, NAV_ITEMS, DATE_RANGES } from '../constants';
import { useFilter, getFilterLabel } from '../context/FilterContext';
import { Icon, BottomSheet, PillButton, injectGlobalCSS } from './ui';

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ icon, label, active, onPress, destructive }) {
  const [pressed, setPressed] = useState(false);
  const bg    = destructive ? `${COLORS.red}12`   : active ? `${COLORS.blue}15` : COLORS.surface;
  const color = destructive ? COLORS.red           : active ? COLORS.blue       : COLORS.labelSecondary;
  const LI    = LucideIcons[icon];

  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 11px', borderRadius: RADIUS.full,
        background: bg,
        border: `1px solid ${active || destructive ? color + '30' : COLORS.separatorOpaque}`,
        cursor: 'pointer', flexShrink: 0,
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: `transform ${ANIM.fast}ms ${ANIM.spring}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {LI && <LI size={13} color={color} strokeWidth={2} />}
      <span style={{ fontSize: '13px', fontWeight: FONT.semibold, color, fontFamily: FONT.family, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
}

// ─── Global Filter Strip ──────────────────────────────────────────────────────
export function GlobalFilterStrip({ accounts }) {
  const { filter, setFilter, hasActiveFilter, resetFilter } = useFilter();
  const [showDateMenu,    setShowDateMenu]    = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCustom,      setShowCustom]      = useState(false);

  const label       = getFilterLabel(filter);
  const accountLabel = filter.accountIds.length === 0
    ? 'All Accounts'
    : filter.accountIds.length === 1
      ? accounts.find(a => a.id === filter.accountIds[0])?.name || '1 Account'
      : `${filter.accountIds.length} Accounts`;

  const toggleAccount = (id) =>
    setFilter(prev => ({
      ...prev,
      accountIds: prev.accountIds.includes(id)
        ? prev.accountIds.filter(i => i !== id)
        : [...prev.accountIds, id],
    }));

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: SPACE.sm,
        padding: `${SPACE.xs}px ${SPACE.lg}px ${SPACE.sm}px`,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      }}>
        <FilterChip icon="CalendarDays" label={label}
          active={filter.dateRange !== 'thisMonth'}
          onPress={() => { setShowDateMenu(true); setShowAccountMenu(false); }} />
        <FilterChip icon="Wallet" label={accountLabel}
          active={filter.accountIds.length > 0}
          onPress={() => { setShowAccountMenu(true); setShowDateMenu(false); }} />
        {hasActiveFilter && (
          <FilterChip icon="X" label="Reset" active={false} onPress={resetFilter} destructive />
        )}
      </div>

      {/* Date range sheet */}
      <BottomSheet open={showDateMenu} onClose={() => setShowDateMenu(false)} title="Date Range" height={480}>
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
            {DATE_RANGES.map((dr, i) => (
              <React.Fragment key={dr.value}>
                <button
                  onClick={() => {
                    if (dr.value === 'custom') { setShowCustom(true); }
                    else { setFilter({ dateRange: dr.value, customStart: '', customEnd: '' }); setShowDateMenu(false); }
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT.family, WebkitTapHighlightColor: 'transparent' }}
                >
                  <span style={{ fontSize: FONT.callout.size, color: COLORS.labelPrimary }}>{dr.label}</span>
                  {filter.dateRange === dr.value && <LucideIcons.Check size={18} color={COLORS.blue} strokeWidth={2.5} />}
                </button>
                {i < DATE_RANGES.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />}
              </React.Fragment>
            ))}
          </div>

          {(showCustom || filter.dateRange === 'custom') && (
            <div style={{ marginTop: SPACE.lg, background: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
              <span style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: FONT.family }}>
                Custom Range
              </span>
              <div style={{ display: 'flex', gap: SPACE.md }}>
                {[['From', 'customStart'], ['To', 'customEnd']].map(([lbl, key]) => (
                  <div key={key} style={{ flex: 1 }}>
                    <label style={{ fontSize: FONT.caption1.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{lbl}</label>
                    <input
                      type="date" value={filter[key]}
                      onChange={e => setFilter(f => ({ ...f, dateRange: 'custom', [key]: e.target.value }))}
                      style={{ width: '100%', marginTop: 4, padding: `${SPACE.sm}px ${SPACE.md}px`, borderRadius: RADIUS.lg, border: `1.5px solid ${COLORS.separatorOpaque}`, fontSize: FONT.callout.size, fontFamily: FONT.family, color: COLORS.labelPrimary, background: COLORS.bgPrimary, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <PillButton label="Apply" variant="primary" size="md" style={{ alignSelf: 'flex-end' }}
                onPress={() => { if (filter.customStart && filter.customEnd) { setShowDateMenu(false); setShowCustom(false); } }} />
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Account filter sheet */}
      <BottomSheet open={showAccountMenu} onClose={() => setShowAccountMenu(false)} title="Filter by Account" height={Math.min(120 + accounts.length * 60, 480)}>
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.xl}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
            <button onClick={() => { setFilter({ accountIds: [] }); setShowAccountMenu(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT.family, WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: FONT.callout.size, color: COLORS.labelPrimary }}>All Accounts</span>
              {filter.accountIds.length === 0 && <LucideIcons.Check size={18} color={COLORS.blue} strokeWidth={2.5} />}
            </button>
            <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />
            {accounts.map((acc, i) => (
              <React.Fragment key={acc.id}>
                <button onClick={() => toggleAccount(acc.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT.family, WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: acc.color || COLORS.blue, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: FONT.callout.size, color: COLORS.labelPrimary, textAlign: 'left' }}>{acc.name}</span>
                  {filter.accountIds.includes(acc.id)
                    ? <LucideIcons.CheckSquare size={18} color={COLORS.blue} strokeWidth={2} />
                    : <LucideIcons.Square size={18} color={COLORS.labelTertiary} strokeWidth={1.5} />}
                </button>
                {i < accounts.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

// ─── Mobile Floating Pill Nav ─────────────────────────────────────────────────
function MobilePillNav({ onAddPress }) {
  const location = useLocation();
  const [pressed, setPressed] = useState(null);
  const isActive  = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{
      position: 'fixed',
      bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
      left: '50%', transform: 'translateX(-50%)',
      zIndex: 900,
      display: 'flex', alignItems: 'center', gap: 2, padding: '6px',
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: RADIUS.full,
      boxShadow: `${SHADOW.pill}, 0 1px 0 rgba(255,255,255,0.6) inset`,
      border: '1px solid rgba(255,255,255,0.9)',
    }}>
      {NAV_ITEMS.map((item) => {
        const active  = isActive(item.path);
        const isPress = pressed === item.path;
        const LI      = LucideIcons[item.icon];
        return (
          <Link key={item.path} to={item.path}
            onMouseDown={() => setPressed(item.path)}
            onMouseUp={() => setPressed(null)}
            onTouchStart={() => setPressed(item.path)}
            onTouchEnd={() => setPressed(null)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 11px', borderRadius: RADIUS.full,
              background: active ? COLORS.blue : isPress ? COLORS.fillTertiary : 'transparent',
              textDecoration: 'none', minWidth: 46,
              transition: `all ${ANIM.normal}ms ${ANIM.spring}`,
              transform: isPress ? 'scale(0.92)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {LI && <LI size={20} color={active ? '#fff' : COLORS.labelSecondary} strokeWidth={active ? 2.2 : 1.75} />}
            <span style={{
              fontSize: '9px', fontWeight: active ? FONT.semibold : FONT.medium,
              color: active ? '#fff' : COLORS.labelSecondary,
              fontFamily: FONT.family, letterSpacing: '0.2px', lineHeight: 1,
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
      <div style={{ width: 1, height: 28, background: COLORS.separatorOpaque, margin: '0 2px', flexShrink: 0 }} />
      {/* FAB */}
      <MobileFAB onPress={onAddPress} />
    </div>
  );
}

function MobileFAB({ onPress }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); onPress?.(); }}
      style={{
        width: 42, height: 42, borderRadius: RADIUS.full,
        background: `linear-gradient(135deg, ${COLORS.blue}, #0044CC)`,
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transform: pressed ? 'scale(0.88) rotate(45deg)' : 'scale(1) rotate(0deg)',
        transition: `transform ${ANIM.fast}ms ${ANIM.spring}`,
        boxShadow: pressed ? 'none' : SHADOW.fab,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <LucideIcons.Plus size={22} color="#fff" strokeWidth={2.5} />
    </button>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ user, onAddPress }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleSignOut = () => {
    try { signOut(getAuth()); } catch (e) { console.error(e); }
  };

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
      background: COLORS.surface,
      borderRight: `0.5px solid ${COLORS.separatorOpaque}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 800, boxShadow: '2px 0 16px rgba(0,0,0,0.05)',
    }}>
      {/* Brand */}
      <div style={{ padding: `${SPACE.xl}px ${SPACE.xl}px ${SPACE.lg}px`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md }}>
          <div style={{
            width: 42, height: 42, borderRadius: RADIUS.lg,
            background: `linear-gradient(135deg, ${COLORS.blue}, #0044CC)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: SHADOW.md, flexShrink: 0,
          }}>
            <Icon name="Vault" size={21} color="#fff" strokeWidth={1.75} />
          </div>
          <div>
            <div style={{ fontSize: FONT.headline.size, fontWeight: FONT.bold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>MyVault</div>
            <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              {user?.displayName || user?.email || ''}
            </div>
          </div>
        </div>
      </div>

      {/* Add transaction */}
      <div style={{ padding: `0 ${SPACE.md}px ${SPACE.lg}px`, flexShrink: 0 }}>
        <button
          onClick={onAddPress}
          style={{
            width: '100%', padding: '11px',
            borderRadius: RADIUS.xl,
            background: `linear-gradient(135deg, ${COLORS.blue}, #0044CC)`,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm,
            boxShadow: SHADOW.fab, transition: `opacity ${ANIM.fast}ms`,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <LucideIcons.Plus size={17} color="#fff" strokeWidth={2.5} />
          <span style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>
            Add Transaction
          </span>
        </button>
      </div>

      <div style={{ height: '0.5px', background: COLORS.separatorOpaque, margin: `0 ${SPACE.md}px`, flexShrink: 0 }} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: `${SPACE.sm}px ${SPACE.sm}px` }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const LI = LucideIcons[item.icon];
          return (
            <Link
              key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: SPACE.md,
                padding: `9px ${SPACE.md}px`, borderRadius: RADIUS.xl,
                background: active ? `${COLORS.blue}12` : 'transparent',
                textDecoration: 'none', marginBottom: 2,
                transition: `background ${ANIM.fast}ms`,
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.fillTertiary; }}
              onMouseLeave={e => { e.currentTarget.style.background = active ? `${COLORS.blue}12` : 'transparent'; }}
            >
              {LI && (
                <div style={{
                  width: 32, height: 32, borderRadius: RADIUS.md,
                  background: active ? COLORS.blue : COLORS.fillTertiary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: `background ${ANIM.fast}ms`,
                }}>
                  <LI size={17} color={active ? '#fff' : COLORS.labelSecondary} strokeWidth={active ? 2.2 : 1.75} />
                </div>
              )}
              <span style={{
                fontSize: FONT.callout.size,
                fontWeight: active ? FONT.semibold : FONT.regular,
                color: active ? COLORS.blue : COLORS.labelSecondary,
                fontFamily: FONT.family,
                transition: `color ${ANIM.fast}ms`,
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div style={{ height: '0.5px', background: COLORS.separatorOpaque, margin: `0 ${SPACE.md}px`, flexShrink: 0 }} />

      {/* Sign out */}
      <div style={{ padding: `${SPACE.sm}px ${SPACE.sm}px`, flexShrink: 0 }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md,
            padding: `9px ${SPACE.md}px`, borderRadius: RADIUS.xl,
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: `background ${ANIM.fast}ms`,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${COLORS.red}10`}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name="LogOut" size={16} color={COLORS.red} strokeWidth={2} />
          <span style={{ fontSize: FONT.callout.size, color: COLORS.red, fontFamily: FONT.family }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function Layout({ user, accounts, children, AddTransactionComponent }) {
  const location  = useLocation();
  const isDesktop = useIsDesktop();
  const [showAdd,  setShowAdd]  = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => { injectGlobalCSS(); }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Global open-add hook so any page can trigger the form
  useEffect(() => {
    window.__mv6_openAdd = (data = null) => {
      setEditData(data);
      setShowAdd(true);
    };
    return () => { delete window.__mv6_openAdd; };
  }, []);

  const openAdd = () => { setEditData(null); setShowAdd(true); };

  return (
    <div style={{
      minHeight: '100dvh',
      background: COLORS.bgPrimary,
      fontFamily: FONT.family,
      // Push content right on desktop to make room for sidebar
      marginLeft: isDesktop ? 240 : 0,
      transition: `margin-left ${ANIM.normal}ms ${ANIM.ease}`,
    }}>
      {/* Desktop sidebar */}
      {isDesktop && (
        <DesktopSidebar user={user} onAddPress={openAdd} />
      )}

      {/* Centered content column */}
      <div style={{
        maxWidth: isDesktop ? 860 : 560,
        margin: '0 auto',
        minHeight: '100dvh',
        position: 'relative',
      }}>
        {/* Sticky filter strip */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 500,
          background: COLORS.bgPrimary,
          paddingTop: SPACE.xs,
        }}>
          <GlobalFilterStrip accounts={accounts || []} />
        </div>

        {/* Page */}
        <main
          key={location.pathname}
          style={{
            paddingBottom: isDesktop ? 48 : 140,
            animation: `mv6-fade-in ${ANIM.normal}ms ${ANIM.ease} both`,
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile pill nav */}
      {!isDesktop && <MobilePillNav onAddPress={openAdd} />}

      {/* Add / Edit Transaction sheet */}
      {showAdd && AddTransactionComponent && (
        <AddTransactionComponent
          user={user}
          editData={editData}
          onClose={() => { setShowAdd(false); setEditData(null); }}
        />
      )}
    </div>
  );
}

export const openAddTransaction = (data = null) => {
  window.__mv6_openAdd?.(data);
};