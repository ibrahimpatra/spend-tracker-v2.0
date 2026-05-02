// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — App.jsx
// Root of the application.
// • Firebase Auth (email/password) with session persistence
// • React Router v6 — all real URLs
// • FilterProvider wrapping everything → global filter shared across all pages
// • Layout shell (floating pill nav + FAB) wrapping all authenticated pages
// • Route: /dashboard, /records, /insights, /accounts, /accounts/:id,
//          /budget, /categories, /categories/:id
// • Auth pages: /login, /register (not wrapped in Layout)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, useLocation,
} from 'react-router-dom';
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, signOut,
} from 'firebase/auth';

import { COLORS, FONT, RADIUS, SHADOW, SPACE, ANIM } from './constants';
import { FilterProvider }   from './context/FilterContext';
import { useAccounts }      from './hooks/useData';
import { injectGlobalCSS, Icon, Spinner } from './components/ui';
import Layout               from './components/Layout';
import AddTransaction       from './components/AddTransaction';

// Pages
import Dashboard       from './pages/Dashboard';
import Records         from './pages/Records';
import Insights        from './pages/Insights';
import Accounts        from './pages/Accounts';
import AccountDetail   from './pages/AccountDetail';
import Budget          from './pages/Budget';
import Categories      from './pages/Categories';
import CategoryDetail  from './pages/CategoryDetail';

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode,     setMode]     = useState('login');   // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const auth = getAuth();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (mode === 'register' && !name.trim()) { setError('Enter your name'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (e) {
      const msgs = {
        'auth/user-not-found':   'No account found with this email',
        'auth/wrong-password':   'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/invalid-email':    'Invalid email address',
        'auth/weak-password':    'Password must be at least 6 characters',
        'auth/invalid-credential': 'Invalid email or password',
      };
      setError(msgs[e.code] || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: `${SPACE.md}px ${SPACE.md}px`,
    borderRadius: RADIUS.xl, border: `1.5px solid ${COLORS.separatorOpaque}`,
    fontSize: FONT.callout.size, fontFamily: FONT.family,
    color: COLORS.labelPrimary, background: COLORS.bgPrimary,
    outline: 'none', boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };

  return (
    <div style={{
      minHeight: '100dvh', background: COLORS.bgPrimary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: SPACE.xl, fontFamily: FONT.family,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: SPACE.xxxl }}>
          <div style={{
            width: 72, height: 72, borderRadius: RADIUS.xxl,
            background: `linear-gradient(135deg, ${COLORS.blue}, #0040CC)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', boxShadow: SHADOW.fab,
            marginBottom: SPACE.lg,
          }}>
            <Icon name="Vault" size={34} color="#fff" strokeWidth={1.75} />
          </div>
          <h1 style={{
            margin: 0, fontSize: '28px', fontWeight: 800,
            color: COLORS.labelPrimary, letterSpacing: '-0.8px',
          }}>
            MyVault
          </h1>
          <p style={{
            margin: '6px 0 0', fontSize: FONT.subheadline.size,
            color: COLORS.labelSecondary,
          }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: COLORS.surface, borderRadius: RADIUS.xxl,
          padding: SPACE.xl, boxShadow: SHADOW.lg,
        }}>
          {/* Tab */}
          <div style={{
            display: 'flex', background: COLORS.fillTertiary,
            borderRadius: RADIUS.lg, padding: 3, marginBottom: SPACE.lg, gap: 3,
          }}>
            {['login','register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '9px',
                  borderRadius: RADIUS.md, border: 'none',
                  background: mode === m ? COLORS.surface : 'transparent',
                  boxShadow: mode === m ? SHADOW.sm : 'none',
                  fontSize: FONT.subheadline.size,
                  fontWeight: mode === m ? FONT.semibold : FONT.regular,
                  color: mode === m ? COLORS.labelPrimary : COLORS.labelSecondary,
                  fontFamily: FONT.family, cursor: 'pointer',
                  transition: `all ${ANIM.fast}ms`,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
            {mode === 'register' && (
              <input
                type="text" placeholder="Full name"
                value={name} onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            )}
            <input
              type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={inputStyle}
            />
            <input
              type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={inputStyle}
            />

            {error && (
              <div style={{
                background: `${COLORS.red}12`, borderRadius: RADIUS.lg,
                padding: `${SPACE.sm}px ${SPACE.md}px`,
                fontSize: FONT.footnote.size, color: COLORS.red, fontFamily: FONT.family,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '16px',
                borderRadius: RADIUS.xl,
                background: loading ? `${COLORS.blue}80` : COLORS.blue,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm,
                marginTop: SPACE.sm,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {loading
                ? <Spinner size={20} color="#fff" />
                : <span style={{ fontSize: '17px', fontWeight: FONT.semibold, color: '#fff', fontFamily: FONT.family }}>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </span>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Authenticated App ────────────────────────────────────────────────────────
// Wrapped in FilterProvider so every page shares the same filter state.
function AuthenticatedApp({ user }) {
  const { accounts } = useAccounts(user.uid);

  // Stable reference — inline arrow here causes React to unmount AddTransaction every re-render
  const AddTransactionComponent = useCallback((props) => (
    <AddTransaction {...props} key={props.editData?.id || 'new'} />
  ), []);

  return (
    <FilterProvider uid={user.uid}>
      <Layout
        user={user}
        accounts={accounts}
        AddTransactionComponent={AddTransactionComponent}
      >
        <Routes>
          <Route path="/"               element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<Dashboard     user={user} />} />
          <Route path="/records"        element={<Records       user={user} />} />
          <Route path="/insights"       element={<Insights      user={user} />} />
          <Route path="/accounts"       element={<Accounts      user={user} />} />
          <Route path="/accounts/:id"   element={<AccountDetail user={user} />} />
          <Route path="/budget"         element={<Budget        user={user} />} />
          <Route path="/categories"     element={<Categories    user={user} />} />
          <Route path="/categories/:id" element={<CategoryDetail user={user} />} />
          {/* Catch-all */}
          <Route path="*"               element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </FilterProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppRoot() {
  const [user,        setUser]        = useState(undefined); // undefined = loading
  const [authChecked, setAuthChecked] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    injectGlobalCSS();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  // Full-screen loader while Firebase checks auth state
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100dvh', background: COLORS.bgPrimary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: SPACE.lg,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: RADIUS.xxl,
          background: `linear-gradient(135deg, ${COLORS.blue}, #0040CC)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: SHADOW.fab,
        }}>
          <Icon name="Vault" size={30} color="#fff" strokeWidth={1.75} />
        </div>
        <Spinner size={24} color={COLORS.blue} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? (
        <AuthenticatedApp user={user} />
      ) : (
        <Routes>
          <Route path="*" element={<AuthPage onAuth={setUser} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default AppRoot;