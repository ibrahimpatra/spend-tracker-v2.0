import React from 'react';
import {T} from '../constants';

// ─── SVG icon paths ──────────────────────────────────────────────────────────
export const P = {
  home:     "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H15v-6h-6v6H4a1 1 0 01-1-1V9.5z",
  list:     "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  wallet:   "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  tag:      "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z",
  budget:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  plus:     "M12 4v16m8-8H4",
  close:    "M6 18L18 6M6 6l12 12",
  back:     "M15 19l-7-7 7-7",
  chevR:    "M9 5l7 7-7 7",
  chevD:    "M19 9l-7 7-7-7",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  eyeOff:   "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  check:    "M5 13l4 4L19 7",
  trash:    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  transfer: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  menu:     "M4 6h16M4 12h16M4 18h16",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  logout:   "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  info:     "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  edit:     "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
};

// ─── Icon ──────────────────────────────────────────────────────────────────
export const Icon = ({name, size=16, color='currentColor', sw=1.8, fill='none'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d={P[name]||P.info}/>
  </svg>
);

// ─── Spinner ───────────────────────────────────────────────────────────────
export const Spin = ({size=16, color=T.blue}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="spin">
    <circle cx="12" cy="12" r="10" fill="none" stroke={color}
      strokeWidth="2.5" strokeDasharray="48" strokeDashoffset="36"/>
  </svg>
);

// ─── Button ────────────────────────────────────────────────────────────────
export const Btn = ({children, onClick, variant='primary', size='md', icon, loading, disabled, block, style, type='button'}) => {
  const sizes = {sm:{p:'5px 11px',fs:12,r:8}, md:{p:'8px 16px',fs:13,r:10}, lg:{p:'13px 20px',fs:15,r:14}};
  const variants = {
    primary:{bg:T.blue,       color:'#fff', border:'none'},
    danger: {bg:T.red,        color:'#fff', border:'none'},
    ghost:  {bg:'transparent',color:T.blue, border:'none'},
    outline:{bg:'transparent',color:T.t2,   border:`1px solid ${T.sep}`},
    tinted: {bg:T.blueMid,    color:T.blue, border:'none'},
  };
  const sz = sizes[size];
  const vt = variants[variant]||variants.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      style={{
        display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,
        padding:sz.p, fontSize:sz.fs, fontWeight:600, borderRadius:sz.r,
        width:block?'100%':'auto', border:vt.border,
        background:vt.bg, color:vt.color, cursor:disabled||loading?'not-allowed':'pointer',
        opacity:disabled?0.5:1, transition:'opacity 0.15s, transform 0.1s',
        fontFamily:'inherit', ...style,
      }}
      onMouseDown={e=>!disabled&&!loading&&(e.currentTarget.style.transform='scale(0.97)')}
      onMouseUp  ={e=>e.currentTarget.style.transform='scale(1)'}
      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
    >
      {loading ? <Spin size={13} color={vt.color}/> : icon ? <Icon name={icon} size={13} color={vt.color}/> : null}
      {children}
    </button>
  );
};

// ─── iOS Settings Row ─────────────────────────────────────────────────────
export const Row = ({icon, iconBg, label, value, chevron, onClick, danger, last, children, badge}) => (
  <div onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:12,
    padding:'11px 16px',
    borderBottom: last ? 'none' : `0.5px solid ${T.sep}`,
    cursor:onClick?'pointer':'default',
    background:T.surface, transition:'background 0.1s',
  }}
    onMouseEnter={e=>{if(onClick)e.currentTarget.style.background=T.surface2}}
    onMouseLeave={e=>e.currentTarget.style.background=T.surface}
  >
    {icon && (
      <div style={{width:30,height:30,borderRadius:7,background:iconBg||T.blue,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon name={icon} size={15} color="#fff"/>
      </div>
    )}
    <div style={{flex:1,minWidth:0}}>
      <span style={{fontSize:15,color:danger?T.red:T.t1,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
      {children}
    </div>
    {value && <span style={{fontSize:15,color:T.t3,flexShrink:0}}>{value}</span>}
    {badge && <span style={{fontSize:11,fontWeight:700,background:T.red,color:'#fff',borderRadius:10,padding:'1px 6px',flexShrink:0}}>{badge}</span>}
    {chevron && <Icon name="chevR" size={13} color={T.t4}/>}
  </div>
);

// ─── Group (iOS settings section) ─────────────────────────────────────────
export const Group = ({label, children, footer, style}) => (
  <div style={{marginBottom:24,...style}}>
    {label && <p style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em',padding:'0 16px',marginBottom:6}}>{label}</p>}
    <div style={{background:T.surface,borderRadius:12,overflow:'hidden',boxShadow:T.shadow}}>{children}</div>
    {footer && <p style={{fontSize:12,color:T.t3,padding:'6px 16px 0'}}>{footer}</p>}
  </div>
);

// ─── Input field ───────────────────────────────────────────────────────────
export const Field = React.forwardRef(({label, error, prefix, suffix, style, ...p}, ref) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,...style}}>
      {label && <label style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>}
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {prefix && <span style={{position:'absolute',left:11,fontSize:14,fontWeight:600,color:T.t3,pointerEvents:'none'}}>{prefix}</span>}
        <input ref={ref} {...p}
          onFocus={e=>{setFocused(true);p.onFocus?.(e)}}
          onBlur ={e=>{setFocused(false);p.onBlur?.(e)}}
          style={{
            width:'100%',padding:'10px 12px',
            paddingLeft:prefix?28:12, paddingRight:suffix?28:12,
            background:T.surface2, border:`1.5px solid ${focused?T.blue:T.sep}`,
            borderRadius:10, fontSize:14, color:T.t1, outline:'none',
            fontFamily:'inherit', transition:'border-color 0.15s',
            ...p.style,
          }}
        />
        {suffix && <span style={{position:'absolute',right:11,fontSize:13,color:T.t3,pointerEvents:'none'}}>{suffix}</span>}
      </div>
      {error && <p style={{fontSize:11,color:T.red}}>{error}</p>}
    </div>
  );
});

// ─── Select ───────────────────────────────────────────────────────────────
export const Sel = ({label, children, style, ...p}) => (
  <div style={{display:'flex',flexDirection:'column',gap:4,...style}}>
    {label && <label style={{fontSize:12,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>}
    <select {...p} style={{
      padding:'10px 32px 10px 12px',
      background:T.surface2, border:`1.5px solid ${T.sep}`,
      borderRadius:10, fontSize:14, color:T.t1, outline:'none',
      fontFamily:'inherit', appearance:'none', cursor:'pointer',
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
      ...p.style,
    }}
      onFocus={e=>e.target.style.borderColor=T.blue}
      onBlur ={e=>e.target.style.borderColor=T.sep}
    >{children}</select>
  </div>
);

// ─── Bottom sheet modal ────────────────────────────────────────────────────
export const Sheet = ({open, onClose, title, children, footer, maxWidth=480}) => {
  React.useEffect(()=>{
    document.body.style.overflow = open ? 'hidden' : '';
    return ()=>{document.body.style.overflow=''};
  },[open]);
  if (!open) return null;
  return (
    <div className="fade-in" style={{position:'fixed',inset:0,zIndex:900,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={e=>e.target===e.currentTarget&&onClose?.()}>
      <div className="slide-up" style={{background:T.surface,borderRadius:'20px 20px 0 0',width:'100%',maxWidth,maxHeight:'95dvh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.18)'}}>
        <div style={{padding:'12px 0 0',display:'flex',justifyContent:'center'}}>
          <div style={{width:36,height:4,borderRadius:2,background:T.sep}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 20px 12px'}}>
          <h3 style={{fontSize:17,fontWeight:700,color:T.t1,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:T.surface2,border:'none',width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <Icon name="close" size={13} color={T.t3}/>
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'0 20px'}}>{children}</div>
        {footer && <div style={{padding:'12px 20px 20px',borderTop:`0.5px solid ${T.sep}`}}>{footer}</div>}
      </div>
    </div>
  );
};

// ─── Empty state ───────────────────────────────────────────────────────────
export const Empty = ({emoji='📭', title, sub, action}) => (
  <div style={{textAlign:'center',padding:'40px 20px'}}>
    <div style={{fontSize:36,marginBottom:10}}>{emoji}</div>
    {title && <p style={{fontSize:15,fontWeight:600,color:T.t1,marginBottom:5}}>{title}</p>}
    {sub   && <p style={{fontSize:13,color:T.t3,marginBottom:16}}>{sub}</p>}
    {action}
  </div>
);

// ─── Stat card ─────────────────────────────────────────────────────────────
export const Stat = ({label, value, color, onClick}) => (
  <div onClick={onClick} style={{
    flex:1,minWidth:0,padding:'10px 12px',
    background:T.surface,borderRadius:12,boxShadow:T.shadow,
    cursor:onClick?'pointer':'default',
  }}>
    <p style={{margin:'0 0 2px',fontSize:11,fontWeight:500,color:T.t3,textTransform:'uppercase',letterSpacing:'0.04em'}}>{label}</p>
    <p style={{margin:0,fontSize:14,fontWeight:700,color:color||T.t1,letterSpacing:-0.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</p>
  </div>
);

// ─── Tooltip for recharts ──────────────────────────────────────────────────
export const ChartTip = ({active, payload, label}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'rgba(255,255,255,0.96)',border:`1px solid ${T.sep}`,borderRadius:10,padding:'7px 11px',boxShadow:T.shadowMd,fontSize:11}}>
      {label && <p style={{margin:'0 0 4px',fontWeight:600,color:T.t2}}>{label}</p>}
      {payload.map((e,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:e.color,flexShrink:0}}/>
          <span style={{color:T.t3}}>{e.name}:</span>
          <span style={{fontWeight:700,color:T.t1}}>{typeof e.value==='number'?e.value.toLocaleString(undefined,{minimumFractionDigits:2}):e.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── iOS-style number keypad ───────────────────────────────────────────────
export const Keypad = ({onKey, onClear, onDone}) => {
  const keys = [['7','8','9'],['4','5','6'],['1','2','3'],['.','0','⌫']];
  return (
    <div style={{padding:'8px 16px 12px'}}>
      {keys.map((row,ri)=>(
        <div key={ri} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:6}}>
          {row.map(k=>(
            <button key={k} type="button"
              onPointerDown={e=>{e.preventDefault();k==='⌫'?onClear():onKey(k)}}
              style={{
                height:50,borderRadius:11,border:'none',
                background:k==='⌫'?T.redLight:T.surface2,
                color:k==='⌫'?T.red:T.t1,
                fontSize:k==='⌫'?18:20,fontWeight:k==='⌫'?600:400,
                cursor:'pointer',fontFamily:'inherit',transition:'transform 0.1s',
              }}
              onMouseDown={e=>e.currentTarget.style.transform='scale(0.92)'}
              onMouseUp  ={e=>e.currentTarget.style.transform='scale(1)'}
            >{k}</button>
          ))}
        </div>
      ))}
      <button type="button" onClick={onDone}
        style={{width:'100%',height:50,borderRadius:11,border:'none',background:T.blue,color:'#fff',fontSize:16,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
        Done
      </button>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────
export const Progress = ({pct, color=T.blue, height=6, style}) => (
  <div style={{height,background:T.surface2,borderRadius:height,overflow:'hidden',...style}}>
    <div style={{height:'100%',width:`${Math.min(100,Math.max(0,pct))}%`,background:color,borderRadius:height,transition:'width 0.5s ease'}}/>
  </div>
);
