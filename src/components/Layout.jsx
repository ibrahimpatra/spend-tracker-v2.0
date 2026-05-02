// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — Layout.jsx  (v4)
// • Odoo-style curtain drawer (hamburger top-left, same on all screen sizes)
// • No bottom nav, no sidebar — single navigation pattern everywhere  
// • Premium pill FAB (bottom-right, always Add Transaction)
// • Keyboard: Cmd+K → new transaction, Escape → close drawer
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM, NAV_ITEMS, DATE_RANGES } from '../constants';
import { useFilter, getFilterLabel } from '../context/FilterContext';
import { Icon, BottomSheet, PillButton, injectGlobalCSS, ToastHost } from './ui';

// ─── Scroll direction (auto-hide filter strip) ────────────────────────────────
function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      if (y < 60) setHidden(false);
      else if (y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 8) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return hidden;
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ icon, label, active, onPress, destructive }) {
  const [p, setP] = useState(false);
  const LI = LucideIcons[icon];
  const bg    = destructive ? `${COLORS.red}12`   : active ? `${COLORS.blue}15` : COLORS.surface;
  const color = destructive ? COLORS.red           : active ? COLORS.blue       : COLORS.labelSecondary;
  return (
    <button onClick={onPress} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: RADIUS.full,
        background: bg, border: `1px solid ${active || destructive ? color + '30' : COLORS.separatorOpaque}`,
        cursor: 'pointer', flexShrink: 0, transform: p ? 'scale(0.94)' : 'scale(1)',
        transition: `all ${ANIM.fast}ms ${ANIM.spring}`, WebkitTapHighlightColor: 'transparent' }}>
      {LI && <LI size={13} color={color} strokeWidth={2} />}
      <span style={{ fontSize: '13px', fontWeight: FONT.semibold, color, fontFamily: FONT.family, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

// ─── Global Filter Strip ──────────────────────────────────────────────────────
export function GlobalFilterStrip({ accounts, hidden }) {
  const { filter, setFilter, hasActiveFilter, resetFilter } = useFilter();
  const [showDate, setShowDate] = useState(false);
  const [showAcc,  setShowAcc]  = useState(false);
  const [showCust, setShowCust] = useState(false);
  const label    = getFilterLabel(filter);
  const accLabel = filter.accountIds.length === 0 ? 'All Accounts'
    : filter.accountIds.length === 1 ? (accounts.find(a => a.id === filter.accountIds[0])?.name || '1 Account')
    : `${filter.accountIds.length} Accounts`;
  const toggleAcc = id => setFilter(f => ({ ...f, accountIds: f.accountIds.includes(id) ? f.accountIds.filter(i => i !== id) : [...f.accountIds, id] }));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, padding: `${SPACE.xs}px ${SPACE.lg}px ${SPACE.sm}px`,
        overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)', opacity: hidden ? 0 : 1,
        transition: `transform 280ms ${ANIM.ease}, opacity 280ms ${ANIM.ease}`,
        pointerEvents: hidden ? 'none' : 'auto', willChange: 'transform, opacity' }}>
        <FilterChip icon="CalendarDays" label={label} active={filter.dateRange !== 'thisMonth'} onPress={() => setShowDate(true)} />
        <FilterChip icon="Wallet" label={accLabel} active={filter.accountIds.length > 0} onPress={() => setShowAcc(true)} />
        {hasActiveFilter && <FilterChip icon="X" label="Reset" destructive onPress={resetFilter} />}
      </div>

      <BottomSheet open={showDate} onClose={() => setShowDate(false)} title="Date Range" height={480}>
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.lg}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
            {DATE_RANGES.map((dr, i) => (
              <React.Fragment key={dr.value}>
                <button onClick={() => { if (dr.value === 'custom') setShowCust(true); else { setFilter({ dateRange: dr.value }); setShowDate(false); } }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT.family, WebkitTapHighlightColor: 'transparent' }}>
                  <span style={{ fontSize: FONT.callout.size, color: COLORS.labelPrimary }}>{dr.label}</span>
                  {filter.dateRange === dr.value && <LucideIcons.Check size={18} color={COLORS.blue} strokeWidth={2.5} />}
                </button>
                {i < DATE_RANGES.length - 1 && <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />}
              </React.Fragment>
            ))}
          </div>
          {(showCust || filter.dateRange === 'custom') && (
            <div style={{ marginTop: SPACE.lg, background: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE.lg, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
              <span style={{ fontSize: FONT.footnote.size, fontWeight: FONT.semibold, color: COLORS.labelSecondary, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: FONT.family }}>Custom Range</span>
              <div style={{ display: 'flex', gap: SPACE.md }}>
                {[['From','customStart'],['To','customEnd']].map(([lbl,key]) => (
                  <div key={key} style={{ flex: 1 }}>
                    <label style={{ fontSize: FONT.caption1.size, color: COLORS.labelSecondary, fontFamily: FONT.family }}>{lbl}</label>
                    <input type="date" value={filter[key] || ''} onChange={e => setFilter(f => ({ ...f, dateRange: 'custom', [key]: e.target.value }))}
                      style={{ width: '100%', marginTop: 4, padding: `${SPACE.sm}px ${SPACE.md}px`, borderRadius: RADIUS.lg, border: `1.5px solid ${COLORS.separatorOpaque}`, fontSize: FONT.callout.size, fontFamily: FONT.family, color: COLORS.labelPrimary, background: COLORS.bgPrimary, outline: 'none' }} />
                  </div>
                ))}
              </div>
              <PillButton label="Apply" variant="primary" size="md" style={{ alignSelf: 'flex-end' }}
                onPress={() => { if (filter.customStart && filter.customEnd) { setShowDate(false); setShowCust(false); } }} />
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet open={showAcc} onClose={() => setShowAcc(false)} title="Filter by Account" height={Math.min(160 + accounts.length * 56, 500)}>
        <div style={{ padding: `0 ${SPACE.lg}px ${SPACE.xl}px` }}>
          <div style={{ background: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
            <button onClick={() => { setFilter(f => ({ ...f, accountIds: [] })); setShowAcc(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT.family, WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: FONT.callout.size, color: COLORS.labelPrimary }}>All Accounts</span>
              {filter.accountIds.length === 0 && <LucideIcons.Check size={18} color={COLORS.blue} strokeWidth={2.5} />}
            </button>
            <div style={{ height: '0.5px', background: COLORS.separatorOpaque, marginLeft: SPACE.lg }} />
            {accounts.map((acc, i) => (
              <React.Fragment key={acc.id}>
                <button onClick={() => toggleAcc(acc.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.md}px ${SPACE.lg}px`, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT.family, WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: acc.color || COLORS.blue, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: FONT.callout.size, color: COLORS.labelPrimary, textAlign: 'left' }}>{acc.name}</span>
                  {acc.isDefault && <span style={{ fontSize: '10px', fontWeight: 600, color: COLORS.blue, fontFamily: FONT.family, background: `${COLORS.blue}12`, padding: '2px 6px', borderRadius: RADIUS.full }}>Default</span>}
                  {filter.accountIds.includes(acc.id) ? <LucideIcons.CheckSquare size={18} color={COLORS.blue} strokeWidth={2} /> : <LucideIcons.Square size={18} color={COLORS.labelTertiary} strokeWidth={1.5} />}
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

// ─── App Drawer ───────────────────────────────────────────────────────────────
function AppDrawer({ open, onClose, user, onAddPress, accounts }) {
  const location = useLocation();
  const isActive = p => location.pathname === p || location.pathname.startsWith(p + '/');
  const [visible, setVisible] = useState(open);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) { setVisible(true); requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true))); }
    else { setAnimate(false); const t = setTimeout(() => setVisible(false), 320); return () => clearTimeout(t); }
  }, [open]);

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  if (!visible) return null;
  const handleSignOut = () => { try { signOut(getAuth()); } catch (e) { console.error(e); } };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', opacity: animate ? 1 : 0, transition: `opacity 300ms ${ANIM.ease}` }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, maxWidth: '85vw', background: COLORS.surface, display: 'flex', flexDirection: 'column', transform: animate ? 'translateX(0)' : 'translateX(-100%)', transition: `transform 320ms ${ANIM.spring}`, boxShadow: '6px 0 40px rgba(0,0,0,0.18)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Brand */}
        <div style={{ padding: `max(${SPACE.xl}px, env(safe-area-inset-top, 20px)) ${SPACE.xl}px ${SPACE.lg}px`, background: `linear-gradient(160deg, ${COLORS.blue}15, transparent)`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg }}>
            <div style={{ width: 44, height: 44, borderRadius: RADIUS.lg, background: `linear-gradient(135deg, ${COLORS.blue}, #0044CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: SHADOW.md }}>
              <Icon name="Vault" size={22} color="#fff" strokeWidth={1.75} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: FONT.headline.size, fontWeight: FONT.bold, color: COLORS.labelPrimary, fontFamily: FONT.family }}>MyVault</div>
              <div style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || user?.email}</div>
            </div>
          </div>
          {/* New Transaction CTA */}
          <button onClick={() => { onAddPress(); onClose(); }}
            style={{ width: '100%', padding: '12px 16px', borderRadius: RADIUS.xl, background: `linear-gradient(135deg, ${COLORS.blue}, #0044CC)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACE.sm, boxShadow: SHADOW.md, WebkitTapHighlightColor: 'transparent' }}>
            <LucideIcons.Plus size={18} color="#fff" strokeWidth={2.5} />
            <span style={{ fontSize: FONT.callout.size, fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family, flex: 1 }}>New Transaction</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: FONT.family }}>⌘K</span>
          </button>
        </div>

        <div style={{ height: '0.5px', background: COLORS.separatorOpaque, flexShrink: 0 }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: `${SPACE.sm}px ${SPACE.sm}px`, overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            const LI = LucideIcons[item.icon];
            return (
              <Link key={item.path} to={item.path} onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `10px ${SPACE.md}px`, borderRadius: RADIUS.xl, background: active ? `${COLORS.blue}12` : 'transparent', textDecoration: 'none', marginBottom: 2, transition: `background ${ANIM.fast}ms`, WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.fillTertiary; }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? `${COLORS.blue}12` : 'transparent'; }}>
                {LI && (
                  <div style={{ width: 34, height: 34, borderRadius: RADIUS.md, background: active ? COLORS.blue : COLORS.fillTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: `background ${ANIM.fast}ms` }}>
                    <LI size={18} color={active ? '#fff' : COLORS.labelSecondary} strokeWidth={active ? 2.2 : 1.75} />
                  </div>
                )}
                <span style={{ fontSize: FONT.callout.size, fontWeight: active ? FONT.semibold : FONT.regular, color: active ? COLORS.blue : COLORS.labelSecondary, fontFamily: FONT.family, flex: 1, transition: `color ${ANIM.fast}ms` }}>{item.label}</span>
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.blue, flexShrink: 0 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ flexShrink: 0, paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
          {accounts?.length > 0 && (
            <div style={{ margin: `0 ${SPACE.sm}px ${SPACE.sm}px`, background: COLORS.fillTertiary, borderRadius: RADIUS.xl, padding: `${SPACE.sm}px ${SPACE.md}px`, display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <Icon name="Wallet" size={14} color={COLORS.labelTertiary} strokeWidth={2} />
              <span style={{ fontSize: FONT.caption1.size, color: COLORS.labelTertiary, fontFamily: FONT.family }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} linked</span>
            </div>
          )}
          <div style={{ height: '0.5px', background: COLORS.separatorOpaque, margin: `0 ${SPACE.sm}px ${SPACE.xs}px` }} />
          <button onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `10px ${SPACE.md}px`, borderRadius: RADIUS.xl, background: 'transparent', border: 'none', cursor: 'pointer', margin: `0 ${SPACE.sm}px`, width: 'calc(100% - 16px)', WebkitTapHighlightColor: 'transparent', transition: `background ${ANIM.fast}ms` }}
            onMouseEnter={e => e.currentTarget.style.background = `${COLORS.red}10`}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 34, height: 34, borderRadius: RADIUS.md, background: `${COLORS.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="LogOut" size={17} color={COLORS.red} strokeWidth={2} />
            </div>
            <span style={{ fontSize: FONT.callout.size, color: COLORS.red, fontFamily: FONT.family }}>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hamburger button (animated to X) ────────────────────────────────────────
function HamburgerBtn({ onPress, open }) {
  return (
    <button onClick={onPress}
      style={{ width: 36, height: 36, borderRadius: RADIUS.lg, background: COLORS.surface, border: `1px solid ${COLORS.separatorOpaque}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4.5, cursor: 'pointer', boxShadow: SHADOW.sm, WebkitTapHighlightColor: 'transparent', flexShrink: 0, transition: `all ${ANIM.fast}ms` }}>
      {[
        { transform: open ? 'rotate(45deg) translate(4px, 4.5px)' : 'none' },
        { opacity: open ? 0 : 1 },
        { transform: open ? 'rotate(-45deg) translate(4px, -4.5px)' : 'none' },
      ].map((s, i) => (
        <div key={i} style={{ width: 16, height: 1.5, background: COLORS.labelPrimary, borderRadius: 1, transition: `all ${ANIM.normal}ms ${ANIM.spring}`, ...s }} />
      ))}
    </button>
  );
}

// ─── Top Header Bar ───────────────────────────────────────────────────────────
function TopBar({ onMenuPress, drawerOpen }) {
  const location = useLocation();
  const label = NAV_ITEMS.find(n => location.pathname === n.path || location.pathname.startsWith(n.path + '/'))?.label || 'MyVault';
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 500, background: COLORS.bgPrimary, borderBottom: `0.5px solid ${COLORS.separatorOpaque}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: SPACE.md, padding: `${SPACE.sm}px ${SPACE.lg}px`, minHeight: 52 }}>
      <HamburgerBtn onPress={onMenuPress} open={drawerOpen} />
      <span style={{ flex: 1, fontSize: FONT.headline.size, fontWeight: FONT.semibold, color: COLORS.labelPrimary, fontFamily: FONT.family, letterSpacing: '-0.3px' }}>{label}</span>
    </div>
  );
}

// ─── Premium pill FAB ─────────────────────────────────────────────────────────
function FAB({ onPress }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); onPress(); }}
      style={{
        position: 'fixed',
        bottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
        right: 20,
        zIndex: 800,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 22px 14px 18px',
        borderRadius: RADIUS.full,
        background: `linear-gradient(135deg, ${COLORS.blue} 0%, #0044CC 100%)`,
        border: 'none',
        cursor: 'pointer',
        boxShadow: pressed
          ? '0 2px 12px rgba(0,122,255,0.3)'
          : '0 8px 28px rgba(0,122,255,0.42), 0 2px 8px rgba(0,0,0,0.12)',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: `transform ${ANIM.fast}ms ${ANIM.spring}, box-shadow ${ANIM.fast}ms`,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <LucideIcons.Plus size={14} color="#fff" strokeWidth={3} />
      </div>
      <span style={{ fontSize: '15px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family, letterSpacing: '-0.2px' }}>
        New Transaction
      </span>
    </button>
  );
}

// ─── LAYOUT ROOT ──────────────────────────────────────────────────────────────
export default function Layout({ user, accounts, children, AddTransactionComponent }) {
  const location     = useLocation();
  const filterHidden = useScrollDirection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editData,   setEditData]   = useState(null);

  useEffect(() => { injectGlobalCSS(); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    window.__mv6_openAdd = (data = null) => { setEditData(data); setShowAdd(true); };
    return () => { delete window.__mv6_openAdd; };
  }, []);

  useEffect(() => {
    const fn = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setEditData(null); setShowAdd(true); }
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const openAdd = useCallback(() => { setEditData(null); setShowAdd(true); }, []);

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.bgPrimary, fontFamily: FONT.family }}>
      <TopBar onMenuPress={() => setDrawerOpen(v => !v)} drawerOpen={drawerOpen} />

      <div style={{ background: COLORS.bgPrimary }}>
        <GlobalFilterStrip accounts={accounts || []} hidden={filterHidden} />
      </div>

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} onAddPress={openAdd} accounts={accounts} />

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <main key={location.pathname} style={{ paddingBottom: 120, animation: `mv6-page-fade ${ANIM.normal}ms ${ANIM.ease} both` }}>
          {children}
        </main>
      </div>

      <FAB onPress={openAdd} />

      {showAdd && AddTransactionComponent && (
        <AddTransactionComponent user={user} editData={editData} onClose={() => { setShowAdd(false); setEditData(null); }} />
      )}

      <ToastHost />
    </div>
  );
}

export const openAddTransaction = (data = null) => { window.__mv6_openAdd?.(data); };
