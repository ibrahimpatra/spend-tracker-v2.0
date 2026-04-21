import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { IOS } from '../constants';

export default function Auth() {
  const [mode,    setMode]    = useState('login');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [name,    setName]    = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const iStyle = {
    width: '100%', padding: '10px 12px',
    background: IOS.gray9, border: `1px solid ${IOS.gray8}`,
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
    color: IOS.gray1, outline: 'none',
  };
  const lStyle = {
    fontSize: 11, fontWeight: 700, color: IOS.gray5,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 4,
  };

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, pass);
        if (name.trim()) await updateProfile(user, { displayName: name.trim() });
      }
    } catch (e) {
      setErr(e.message.replace('Firebase: ', '').replace(/\s*\(auth.*\)/, ''));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: IOS.gray9,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '32px 28px',
        width: '100%', maxWidth: 360,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: IOS.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: `0 6px 20px ${IOS.blue}44`,
          }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>MV</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: IOS.gray1, margin: '0 0 4px', letterSpacing: -0.5 }}>MyVault</h1>
          <p style={{ fontSize: 13, color: IOS.gray5, margin: 0 }}>Smart Personal Finance</p>
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', background: IOS.gray9, borderRadius: 12, padding: 4, marginBottom: 22, gap: 4 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(''); }} style={{
              flex: 1, padding: '7px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? IOS.gray1 : IOS.gray4,
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {err && (
            <div style={{ padding: '9px 12px', background: '#FFF0EE', border: '1px solid #FECACA', borderRadius: 10, fontSize: 12, color: IOS.red }}>
              {err}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label style={lStyle}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="John Smith" style={iStyle}
                onFocus={e => { e.target.style.borderColor = IOS.blue; e.target.style.background = '#fff'; }}
                onBlur={e  => { e.target.style.borderColor = IOS.gray8; e.target.style.background = IOS.gray9; }}
              />
            </div>
          )}

          <div>
            <label style={lStyle}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={iStyle}
              onFocus={e => { e.target.style.borderColor = IOS.blue; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.borderColor = IOS.gray8; e.target.style.background = IOS.gray9; }}
            />
          </div>

          <div>
            <label style={lStyle}>Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" required style={iStyle}
              onFocus={e => { e.target.style.borderColor = IOS.blue; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.borderColor = IOS.gray8; e.target.style.background = IOS.gray9; }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '13px', borderRadius: 14, border: 'none',
            background: loading ? IOS.gray7 : IOS.blue, color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', marginTop: 4, transition: 'all 0.15s',
            boxShadow: loading ? 'none' : `0 4px 16px ${IOS.blue}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="48" strokeDashoffset="36" />
                </svg>
                Please wait…
              </>
            ) : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: IOS.gray5 }}>
            Don't have an account?{' '}
            <button onClick={() => { setMode('register'); setErr(''); }}
              style={{ background: 'none', border: 'none', color: IOS.blue, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              Create one
            </button>
          </p>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
