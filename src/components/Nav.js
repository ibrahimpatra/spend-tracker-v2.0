import React, {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {auth} from '../firebase';
import {signOut} from 'firebase/auth';
import {T} from '../constants';
import {Icon, P} from './Ui';

const NAV = [
  {path:'/',           label:'Dashboard', icon:'home'},
  {path:'/records',    label:'Records',   icon:'list'},
  {path:'/accounts',   label:'Accounts',  icon:'wallet'},
  {path:'/categories', label:'Categories',icon:'tag'},
  {path:'/budget',     label:'Budget',    icon:'budget'},
];

const PAGE = {'/':'Dashboard','/records':'Records','/accounts':'Accounts','/categories':'Categories','/budget':'Budget'};

function SidebarInner({pathname, user, onClose}) {
  const init = (user?.displayName?.[0]||user?.email?.[0]||'U').toUpperCase();
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:T.surface}}>
      {/* Logo */}
      <div style={{padding:'18px 20px 14px',borderBottom:`0.5px solid ${T.sep}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:T.blue,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{color:'#fff',fontSize:11,fontWeight:800,letterSpacing:-0.5}}>MV</span>
          </div>
          <span style={{fontSize:15,fontWeight:700,color:T.t1,letterSpacing:-0.3}}>MyVault</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:T.t3,display:'flex',alignItems:'center'}}>
            <Icon name="close" size={16} color={T.t3}/>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{flex:1,padding:'10px 10px',overflowY:'auto'}}>
        {NAV.map(({path,label,icon})=>{
          const active = pathname===path;
          return (
            <Link key={path} to={path} onClick={onClose} style={{textDecoration:'none',display:'block'}}>
              <div style={{
                display:'flex',alignItems:'center',gap:9,padding:'8px 11px',
                borderRadius:9,marginBottom:3,cursor:'pointer',
                background:active?T.blueMid:'transparent',
                transition:'background 0.1s',
              }}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.surface2}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}
              >
                <Icon name={icon} size={16} color={active?T.blue:T.t3} sw={active?2.2:1.7}/>
                <span style={{fontSize:14,fontWeight:active?600:400,color:active?T.blue:T.t2}}>{label}</span>
                {active && <div style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:T.blue,flexShrink:0}}/>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div style={{borderTop:`0.5px solid ${T.sep}`,padding:'12px 10px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,padding:'6px 10px',marginBottom:4}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:T.blueMid,color:T.blue,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
            {init}
          </div>
          <div style={{minWidth:0}}>
            <p style={{margin:0,fontSize:12,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {user?.displayName||user?.email?.split('@')[0]||'User'}
            </p>
            <p style={{margin:0,fontSize:11,color:T.t3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</p>
          </div>
        </div>
        <button onClick={()=>signOut(auth)} style={{
          display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 11px',
          borderRadius:9,border:'none',background:'none',cursor:'pointer',
          color:T.red,fontSize:13,fontFamily:'inherit',
        }}>
          <Icon name="logout" size={14} color={T.red}/>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Nav({children, user, headerAction}) {
  const {pathname} = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = PAGE[pathname]||'MyVault';

  return (
    <div style={{display:'flex',minHeight:'100vh',background:T.bg}}>
      {/* ── Desktop sidebar (always visible ≥768px) */}
      <aside id="sidebar" style={{
        width:220,flexShrink:0,
        borderRight:`0.5px solid ${T.sep}`,
        position:'sticky',top:0,height:'100vh',
      }}>
        <SidebarInner pathname={pathname} user={user}/>
      </aside>

      {/* ── Mobile overlay */}
      {menuOpen && (
        <div className="fade-in" style={{position:'fixed',inset:0,zIndex:800}}
          onClick={()=>setMenuOpen(false)}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(4px)'}}/>
          <div className="slide-left" style={{position:'relative',width:260,height:'100%',zIndex:1}}
            onClick={e=>e.stopPropagation()}>
            <SidebarInner pathname={pathname} user={user} onClose={()=>setMenuOpen(false)}/>
          </div>
        </div>
      )}

      {/* ── Content area */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        {/* Mobile top bar */}
        <header id="mobile-header" style={{
          background:'rgba(250,250,250,0.92)',backdropFilter:'blur(20px)',
          borderBottom:`0.5px solid ${T.sep}`,
          padding:'11px 16px',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          position:'sticky',top:0,zIndex:100,
        }}>
          <button onClick={()=>setMenuOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',alignItems:'center',color:T.t2}}>
            <Icon name="menu" size={20} color={T.t2}/>
          </button>
          <span style={{fontSize:16,fontWeight:700,color:T.t1}}>{title}</span>
          <div>{headerAction||<div style={{width:28}}/>}</div>
        </header>

        <main style={{flex:1,overflowX:'hidden',paddingBottom:'calc(62px + env(safe-area-inset-bottom,0px))'}}
          id="main-pad">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav id="mobile-tabnav" style={{
          position:'fixed',bottom:0,left:0,right:0,
          background:'rgba(250,250,250,0.96)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
          borderTop:`0.5px solid ${T.sep}`,zIndex:200,
          paddingBottom:'env(safe-area-inset-bottom,0px)',
        }}>
          <div style={{display:'flex',justifyContent:'space-around',padding:'6px 0'}}>
            {NAV.map(({path,label,icon})=>{
              const active=pathname===path;
              return (
                <Link key={path} to={path} onClick={()=>setMenuOpen(false)} style={{textDecoration:'none',flex:1,textAlign:'center'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'2px 0',color:active?T.blue:T.t3}}>
                    <Icon name={icon} size={22} color={active?T.blue:T.t3} sw={active?2.2:1.6}/>
                    <span style={{fontSize:10,fontWeight:active?700:500,fontFamily:'Inter,sans-serif'}}>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Responsive CSS — sidebar visible only on desktop */}
      <style>{`
        @media(min-width:768px){
          #sidebar        { display:flex!important; }
          #mobile-header  { display:none!important; }
          #mobile-tabnav  { display:none!important; }
          #main-pad       { padding-bottom: 0!important; }
        }
        @media(max-width:767px){
          #sidebar        { display:none!important; }
          #mobile-header  { display:flex!important; }
          #mobile-tabnav  { display:block!important; }
        }
      `}</style>
    </div>
  );
}
