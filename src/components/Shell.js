import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Icon, ICONS } from './ui';
import { IOS } from '../constants';

const NAV = [
  { path: '/',           label: 'Dashboard', icon: 'home'  },
  { path: '/records',    label: 'Records',   icon: 'list'  },
  { path: '/accounts',   label: 'Accounts',  icon: 'card'  },
  { path: '/categories', label: 'Categories',icon: 'tag'   },
];

// ─── Full-page Odoo-style app menu overlay ─────────────────────────────────────
function AppMenu({ open, onClose, user }) {
  if (!open) return null;
  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  return (
    <div className="anim-right" style={{
      position: 'fixed', inset: 0, zIndex: 8000,
      background: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: `1px solid ${IOS.gray9}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: IOS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>MV</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: IOS.gray1 }}>MyVault</span>
        </div>
        <button onClick={onClose} style={{ background: IOS.gray9, border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={15} color={IOS.gray3} />
        </button>
      </div>

      {/* User card */}
      <div style={{ margin: '16px 20px', padding: '14px 16px', background: IOS.gray9, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: IOS.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: IOS.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: IOS.gray5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Navigation grid */}
      <div style={{ padding: '0 20px', flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: IOS.gray5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Navigation</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {NAV.map(({ path, label, icon }) => (
            <Link key={path} to={path} onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '18px 16px', background: IOS.gray9, borderRadius: 16,
                display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = IOS.blue + '12'}
                onMouseLeave={e => e.currentTarget.style.background = IOS.gray9}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: IOS.blue + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} size={18} color={IOS.blue} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: IOS.gray1 }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '16px 20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom,0px))' }}>
        <button onClick={() => signOut(auth)} style={{
          width: '100%', padding: '13px', background: '#FFF0EE', border: 'none',
          borderRadius: 12, fontSize: 14, fontWeight: 700, color: IOS.red, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="logout" size={15} color={IOS.red} /> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ pathname, user, onMenuOpen }) {
  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  return (
    <aside style={{
      width: 224, height: '100vh', background: '#fff',
      borderRight: `1px solid ${IOS.gray8}`, display: 'flex',
      flexDirection: 'column', position: 'sticky', top: 0, flexShrink: 0,
      boxShadow: '1px 0 0 0 rgba(0,0,0,0.04)',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 12px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: `1px solid ${IOS.gray9}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: IOS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>MV</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: IOS.gray1, letterSpacing: -0.3 }}>MyVault</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV.map(({ path, label, icon }) => {
          const active = pathname === path;
          return (
            <Link key={path} to={path} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
                borderRadius: 10, marginBottom: 2,
                background:  active ? IOS.blue + '12' : 'transparent',
                color:       active ? IOS.blue : IOS.gray4,
                fontWeight:  active ? 700 : 500,
                fontSize: 13, transition: 'all 0.12s', cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = IOS.gray9; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name={icon} size={15} color={active ? IOS.blue : IOS.gray4} strokeWidth={active ? 2.2 : 1.8} />
                {label}
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: IOS.blue }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User + apps button */}
      <div style={{ borderTop: `1px solid ${IOS.gray9}`, padding: '10px 10px 14px' }}>
        <button onClick={onMenuOpen} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
          background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10,
          marginBottom: 6,
        }}
          onMouseEnter={e => e.currentTarget.style.background = IOS.gray9}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Icon name="grid" size={14} color={IOS.gray5} />
          <span style={{ fontSize: 12, fontWeight: 600, color: IOS.gray5 }}>All Sections</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: IOS.blue + '15', color: IOS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: IOS.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <button onClick={() => signOut(auth)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: IOS.gray5, display: 'flex', alignItems: 'center' }}>
            <Icon name="logout" size={13} color={IOS.gray5} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function Shell({ children, user }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const PAGE_TITLE = { '/': 'Dashboard', '/records': 'Records', '/accounts': 'Accounts', '/categories': 'Categories' };
  const title = PAGE_TITLE[pathname] || 'MyVault';
  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: IOS.gray9 }}>

      {/* Desktop sidebar — hidden on mobile */}
      <div style={{ display: 'none' }} id="desktop-sidebar" className="sidebar-container">
        <Sidebar pathname={pathname} user={user} onMenuOpen={() => setMenuOpen(true)} />
      </div>

      <style>{`
        @media (min-width: 768px) {
          #desktop-sidebar { display: block !important; }
          #mobile-topbar   { display: none   !important; }
          #mobile-tabnav   { display: none   !important; }
          #main-content    { padding-bottom: 0 !important; }
        }
        @media (max-width: 767px) {
          #desktop-sidebar { display: none   !important; }
          #mobile-topbar   { display: flex   !important; }
          #mobile-tabnav   { display: flex   !important; }
        }
      `}</style>

      {/* Right side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile topbar */}
        <header id="mobile-topbar" style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 16px', background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${IOS.gray8}`,
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <Icon name="menu" size={20} color={IOS.gray2} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: IOS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>MV</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: IOS.gray1 }}>{title}</span>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: IOS.blue + '15', color: IOS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{initial}</div>
        </header>

        {/* Main content */}
        <main id="main-content" style={{ flex: 1, overflowX: 'hidden', paddingBottom: 'calc(70px + env(safe-area-inset-bottom,0px))' }}>
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav id="mobile-tabnav" style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${IOS.gray8}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 0' }}>
            {NAV.map(({ path, label, icon }) => {
              const active = pathname === path;
              return (
                <Link key={path} to={path} style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 0', color: active ? IOS.blue : IOS.gray5 }}>
                    <Icon name={icon} size={22} color={active ? IOS.blue : IOS.gray5} strokeWidth={active ? 2.2 : 1.6} />
                    <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Full-page menu overlay */}
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
    </div>
  );
}
