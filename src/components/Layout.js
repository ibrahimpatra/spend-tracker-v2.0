import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Icon } from './ui/index';

const NAV = [
  { path: '/',           label: 'Dashboard', icon: 'dashboard'  },
  { path: '/records',    label: 'Records',   icon: 'records'    },
  { path: '/accounts',   label: 'Accounts',  icon: 'accounts'   },
  { path: '/categories', label: 'Categories',icon: 'categories' },
];
const PAGE_TITLE = { '/':'Dashboard','/records':'Records','/accounts':'Accounts','/categories':'Categories' };

function SidebarContent({ user, pathname, onClose }) {
  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  return (
    <aside style={{
      width: 'var(--sidebar-w)', background: 'var(--c-surface)',
      borderRight: '1px solid var(--c-border)', display: 'flex',
      flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid var(--c-border-light)', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, background:'var(--c-primary)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ color:'#fff', fontSize:10, fontWeight:800, letterSpacing:-0.5 }}>MV</span>
        </div>
        <span style={{ fontSize:13, fontWeight:800, color:'var(--c-text-1)', letterSpacing:-0.3 }}>MyVault</span>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto' }}>
        {NAV.map(({ path, label, icon }) => {
          const active = pathname === path;
          return (
            <Link key={path} to={path} style={{ textDecoration:'none' }} onClick={onClose}>
              <div style={{
                display:'flex', alignItems:'center', gap:8, padding:'6px 9px',
                borderRadius:'var(--r-md)', marginBottom:2, cursor:'pointer',
                background: active ? 'var(--c-primary-light)' : 'transparent',
                color: active ? 'var(--c-primary)' : 'var(--c-text-3)',
                fontWeight: active ? 600 : 500, fontSize:'var(--text-sm)',
                transition:'all 0.12s',
              }}>
                <Icon name={icon} size={14} strokeWidth={active ? 2.2 : 1.8} />
                {label}
                {active && <span style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'var(--c-primary)', flexShrink:0 }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ borderTop:'1px solid var(--c-border-light)', padding:'8px 8px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', marginBottom:4 }}>
          <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--c-primary-light)', color:'var(--c-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, flexShrink:0 }}>
            {initial}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontSize:11, fontWeight:700, color:'var(--c-text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut(auth)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 9px', borderRadius:'var(--r-md)', border:'none', background:'none', cursor:'pointer', color:'var(--c-danger)', fontSize:11, fontWeight:600, width:'100%', textAlign:'left' }}
        >
          <Icon name="logout" size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function Layout({ children, user }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = PAGE_TITLE[pathname] || 'MyVault';
  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--c-bg)' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ position:'sticky', top:0, height:'100vh', flexShrink:0 }}>
        <SidebarContent user={user} pathname={pathname} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }} className="anim-fade">
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(3px)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position:'relative', height:'100%', width:'var(--sidebar-w)' }}>
            <SidebarContent user={user} pathname={pathname} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Right side */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>

        {/* Mobile topbar */}
        <header className="md:hidden" style={{ background:'var(--c-surface)', borderBottom:'1px solid var(--c-border)', padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setMobileOpen(true)} style={{ background:'none', border:'none', padding:4, cursor:'pointer', color:'var(--c-text-3)', display:'flex', alignItems:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{ width:22, height:22, background:'var(--c-primary)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#fff', fontSize:8, fontWeight:800 }}>MV</span>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--c-text-1)' }}>{title}</span>
          </div>
          <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--c-primary-light)', color:'var(--c-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800 }}>{initial}</div>
        </header>

        {/* Main */}
        <main style={{ flex:1, padding:'14px', width:'100%', maxWidth:1300, margin:'0 auto' }} className="md:p-5">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden" style={{
          position:'fixed', bottom:0, left:0, right:0,
          background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
          borderTop:'1px solid var(--c-border)',
          display:'flex', justifyContent:'space-around',
          padding:`6px 0 calc(6px + env(safe-area-inset-bottom,0px))`,
          zIndex:50,
        }}>
          {NAV.map(({ path, label, icon }) => {
            const active = pathname === path;
            return (
              <Link key={path} to={path} style={{ textDecoration:'none', flex:1, textAlign:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'2px 0', color: active ? 'var(--c-primary)' : 'var(--c-text-4)' }}>
                  <Icon name={icon} size={18} strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ fontSize:10, fontWeight: active ? 700 : 500 }}>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
