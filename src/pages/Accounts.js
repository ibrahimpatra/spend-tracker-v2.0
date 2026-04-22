import React, {useState} from 'react';
import {db} from '../firebase';
import {doc, deleteDoc} from 'firebase/firestore';
import {useAccounts, useTransactions} from '../hooks/useData';
import {AccountModal} from '../components/Modals';
import DrillDown from '../components/DrillDown';
import {T, CURRENCIES, ACCOUNT_TYPES, fmt} from '../constants';
import {Group, Row, Icon, Empty, Btn} from '../components/Ui';

const TYPE_COLOR = {Bank:'#056DFF',Cash:'#30D158',Savings:'#FF9500',Credit:'#FF3B30',Investment:'#BF5AF2'};
const emoji = type => ACCOUNT_TYPES.find(t=>t.value===type)?.emoji||'💳';

export default function Accounts({user}) {
  const accounts = useAccounts(user.uid);
  const allTxns  = useTransactions(user.uid, {range:'all'});
  const [showAdd, setShowAdd] = useState(false);
  const [drill,   setDrill]   = useState(null);
  const [hidden,  setHidden]  = useState(()=>{try{return JSON.parse(localStorage.getItem('mv_hide')||'{}')}catch{return{}}});
  const saveHide = h=>{setHidden(h);localStorage.setItem('mv_hide',JSON.stringify(h));};

  const totals = accounts.reduce((acc,a)=>({...acc,[a.currency]:(acc[a.currency]||0)+a.currentBalance}),{});

  const delAcc = async acc => {
    if (!window.confirm(`Delete "${acc.name}"?`)) return;
    await deleteDoc(doc(db,`users/${user.uid}/accounts`,acc.id));
  };

  const openDrill = acc => {
    const txns = allTxns.filter(t=>t.accountId===acc.id);
    setDrill({type:'account',label:acc.name,color:TYPE_COLOR[acc.type]||T.blue,txns,cats:[],accs:accounts,accObj:acc});
  };

  // Group accounts by type
  const groups = ACCOUNT_TYPES.filter(t=>accounts.some(a=>a.type===t.value));

  return (
    <div style={{padding:'16px 16px 32px',maxWidth:680,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.t1,letterSpacing:-0.4}}>Accounts</h1>
        <Btn icon="plus" onClick={()=>setShowAdd(true)}>Add Account</Btn>
      </div>

      {/* Net worth cards */}
      {Object.keys(totals).length>0 && (
        <Group label="Net Worth">
          {Object.entries(totals).map(([cur,total],i,arr)=>{
            const sym = CURRENCIES.find(c=>c.code===cur)?.symbol||cur;
            const neg = total<0;
            return (
              <Row key={cur} label={`${cur} Total`}
                value={<span style={{fontSize:17,fontWeight:700,color:neg?T.red:T.t1,letterSpacing:-0.3}}>{neg?'-':''}{sym}{Math.abs(total).toLocaleString(undefined,{minimumFractionDigits:2})}</span>}
                last={i===arr.length-1}
              />
            );
          })}
        </Group>
      )}

      {/* Accounts grouped by type */}
      {accounts.length===0
        ? <div style={{border:`2px dashed ${T.sep}`,borderRadius:16,padding:'32px'}}><Empty emoji="🏦" title="No accounts yet" sub="Create your first account to get started." action={<Btn onClick={()=>setShowAdd(true)}>Create Account</Btn>}/></div>
        : groups.map(g=>(
          <Group key={g.value} label={g.label}>
            {accounts.filter(a=>a.type===g.value).map((acc,i,arr)=>{
              const sym    = CURRENCIES.find(c=>c.code===acc.currency)?.symbol||acc.currency;
              const isHid  = !!hidden[acc.id];
              const neg    = acc.currentBalance<0;
              return (
                <div key={acc.id} style={{display:'flex',alignItems:'center',gap:0,borderBottom:i<arr.length-1?`0.5px solid ${T.sep}`:'none'}}>
                  <div onClick={()=>openDrill(acc)} style={{flex:1,display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer',transition:'background 0.1s',minWidth:0}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:34,height:34,borderRadius:9,background:(TYPE_COLOR[acc.type]||T.blue)+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                      {emoji(acc.type)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:0,fontSize:15,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{acc.name}</p>
                      <p style={{margin:0,fontSize:12,color:T.t3}}>{acc.currency}</p>
                    </div>
                    <p style={{
                      margin:0,fontSize:15,fontWeight:600,color:neg?T.red:T.t1,flexShrink:0,marginRight:4,
                      filter:isHid?'blur(6px)':'none',userSelect:isHid?'none':'auto',transition:'filter 0.2s',
                    }}>
                      {sym}{Math.abs(acc.currentBalance).toLocaleString(undefined,{minimumFractionDigits:2})}
                    </p>
                    <Icon name="chevR" size={13} color={T.t4}/>
                  </div>
                  {/* Actions */}
                  <div style={{display:'flex',gap:0,padding:'0 10px',borderLeft:`0.5px solid ${T.sep}`}}>
                    <button onClick={()=>saveHide({...hidden,[acc.id]:!isHid})} style={{background:'none',border:'none',cursor:'pointer',padding:'6px 8px',color:T.t3,display:'flex',alignItems:'center',borderRadius:7}}>
                      <Icon name={isHid?'eyeOff':'eye'} size={14} color={T.t3}/>
                    </button>
                    <button onClick={()=>delAcc(acc)} style={{background:'none',border:'none',cursor:'pointer',padding:'6px 8px',color:T.t3,display:'flex',alignItems:'center',borderRadius:7}}
                      onMouseEnter={e=>e.currentTarget.style.color=T.red}
                      onMouseLeave={e=>e.currentTarget.style.color=T.t3}>
                      <Icon name="trash" size={14} color="currentColor"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </Group>
        ))
      }

      <AccountModal user={user} open={showAdd} onClose={()=>setShowAdd(false)}/>
      <DrillDown ctx={drill} onClose={()=>setDrill(null)}/>
    </div>
  );
}
