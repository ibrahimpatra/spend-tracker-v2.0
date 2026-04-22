import React, {useState} from 'react';
import {auth} from '../firebase';
import {signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {T} from '../constants';

export default function Auth() {
  const [mode, setMode]   = useState('login');
  const [email,setEmail]  = useState('');
  const [pass, setPass]   = useState('');
  const [name, setName]   = useState('');
  const [err,  setErr]    = useState('');
  const [busy, setBusy]   = useState(false);

  const iStyle = {
    width:'100%',padding:'12px 14px',background:T.surface2,
    border:`1.5px solid ${T.sep}`,borderRadius:11,fontSize:15,
    fontFamily:'Inter,sans-serif',color:T.t1,outline:'none',
  };

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode==='login') {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const {user} = await createUserWithEmailAndPassword(auth, email, pass);
        if (name.trim()) await updateProfile(user,{displayName:name.trim()});
      }
    } catch(e){
      setErr(e.message.replace('Firebase:','').replace(/\s*\(auth.*\)/,'').trim());
      setBusy(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:'Inter,sans-serif'}}>
      <div style={{background:T.surface,borderRadius:20,padding:'32px 28px',width:'100%',maxWidth:360,boxShadow:'0 4px 40px rgba(0,0,0,0.1)'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:58,height:58,borderRadius:16,background:T.blue,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 13px',boxShadow:`0 6px 20px ${T.blue}44`}}>
            <span style={{color:'#fff',fontSize:21,fontWeight:800}}>MV</span>
          </div>
          <h1 style={{fontSize:23,fontWeight:800,color:T.t1,margin:'0 0 4px',letterSpacing:-0.5}}>MyVault</h1>
          <p style={{fontSize:14,color:T.t3,margin:0}}>Personal Finance Tracker</p>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',background:T.surface2,borderRadius:11,padding:3,marginBottom:22,gap:3}}>
          {['login','register'].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr('');}} style={{
              flex:1,padding:'8px 0',borderRadius:9,border:'none',cursor:'pointer',
              fontFamily:'inherit',fontSize:14,fontWeight:600,transition:'all 0.15s',
              background:mode===m?T.surface:'transparent',
              color:mode===m?T.t1:T.t3,
              boxShadow:mode===m?T.shadow:'none',
            }}>{m==='login'?'Sign In':'Create Account'}</button>
          ))}
        </div>

        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12}}>
          {err && <div style={{padding:'10px 13px',background:T.redLight,border:`1px solid ${T.red}33`,borderRadius:10,fontSize:13,color:T.red}}>{err}</div>}

          {mode==='register' && (
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" style={iStyle}
              onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.background='#fff';}}
              onBlur ={e=>{e.target.style.borderColor=T.sep; e.target.style.background=T.surface2;}}
            />
          )}

          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required style={iStyle}
            onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.background='#fff';}}
            onBlur ={e=>{e.target.style.borderColor=T.sep; e.target.style.background=T.surface2;}}
          />

          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" required style={iStyle}
            onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.background='#fff';}}
            onBlur ={e=>{e.target.style.borderColor=T.sep; e.target.style.background=T.surface2;}}
          />

          <button type="submit" disabled={busy} style={{
            marginTop:4,padding:'14px',borderRadius:13,border:'none',
            background:busy?T.sep:T.blue,color:'#fff',fontSize:16,fontWeight:700,
            cursor:busy?'not-allowed':'pointer',fontFamily:'inherit',
            boxShadow:busy?'none':`0 4px 16px ${T.blue}44`,transition:'all 0.15s',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          }}>
            {busy ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" className="spin"><circle cx="12" cy="12" r="10" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="48" strokeDashoffset="36"/></svg>Please wait…</>
            ) : mode==='login'?'Sign In →':'Create Account →'}
          </button>
        </form>

        {mode==='login' && (
          <p style={{textAlign:'center',marginTop:18,fontSize:13,color:T.t3}}>
            No account?{' '}
            <button onClick={()=>{setMode('register');setErr('');}} style={{background:'none',border:'none',color:T.blue,fontWeight:600,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Create one</button>
          </p>
        )}
      </div>
    </div>
  );
}
