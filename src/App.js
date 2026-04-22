import React, {useState, useEffect} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {auth} from './firebase';
import {onAuthStateChanged} from 'firebase/auth';
import Nav        from './components/Nav';
import Dashboard  from './pages/Dashboard';
import Records    from './pages/Records';
import Accounts   from './pages/Accounts';
import Categories from './pages/Categories';
import Budget     from './pages/Budget';
import Auth       from './pages/Auth';
import {T}        from './constants';

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, u => { setUser(u||null); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,fontFamily:'Inter,sans-serif'}}>
      <div style={{width:52,height:52,borderRadius:14,background:T.blue,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 6px 20px ${T.blue}44`}}>
        <span style={{color:'#fff',fontSize:18,fontWeight:800}}>MV</span>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" className="spin">
        <circle cx="12" cy="12" r="10" fill="none" stroke={T.blue} strokeWidth="2.5" strokeDasharray="48" strokeDashoffset="36"/>
      </svg>
    </div>
  );

  if (!user) return (
    <BrowserRouter>
      <Routes><Route path="*" element={<Auth/>}/></Routes>
    </BrowserRouter>
  );

  return (
    <BrowserRouter>
      <Nav user={user}>
        <Routes>
          <Route path="/"           element={<Dashboard  user={user}/>}/>
          <Route path="/records"    element={<Records    user={user}/>}/>
          <Route path="/accounts"   element={<Accounts   user={user}/>}/>
          <Route path="/categories" element={<Categories user={user}/>}/>
          <Route path="/budget"     element={<Budget     user={user}/>}/>
          <Route path="*"           element={<Navigate to="/" replace/>}/>
        </Routes>
      </Nav>
    </BrowserRouter>
  );
}
