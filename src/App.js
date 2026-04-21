import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Shell      from './components/Shell';
import Dashboard  from './pages/Dashboard';
import Records    from './pages/Records';
import Accounts   from './pages/Accounts';
import Categories from './pages/Categories';
import Auth       from './pages/Auth';
import { IOS }   from './constants';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, u => { setUser(u || null); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:IOS.gray9, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
      <div style={{ width:48, height:48, borderRadius:14, background:IOS.blue, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 20px ${IOS.blue}44` }}>
        <span style={{ color:'#fff', fontSize:17, fontWeight:800 }}>MV</span>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation:'spin 0.7s linear infinite' }}>
        <circle cx="12" cy="12" r="10" fill="none" stroke={IOS.blue} strokeWidth="2.5" strokeDasharray="48" strokeDashoffset="36"/>
      </svg>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!user) return (
    <BrowserRouter>
      <Routes><Route path="*" element={<Auth />} /></Routes>
    </BrowserRouter>
  );

  return (
    <BrowserRouter>
      <Shell user={user}>
        <Routes>
          <Route path="/"           element={<Dashboard  user={user} />} />
          <Route path="/records"    element={<Records    user={user} />} />
          <Route path="/accounts"   element={<Accounts   user={user} />} />
          <Route path="/categories" element={<Categories user={user} />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
