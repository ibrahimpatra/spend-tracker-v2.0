import React from 'react';
import { IOS } from '../constants';

const RANGES = [
  { id:'thisMonth', label:'This Month' },
  { id:'lastMonth', label:'Last Month' },
  { id:'thisYear',  label:'This Year'  },
  { id:'all',       label:'All Time'   },
  { id:'custom',    label:'Custom'     },
];

export default function GlobalFilter({ filterState, setFilterState, accounts=[] }) {
  const toggle = id => {
    const ids = filterState.accountIds.includes(id)
      ? filterState.accountIds.filter(x=>x!==id)
      : [...filterState.accountIds, id];
    setFilterState({ ...filterState, accountIds:ids });
  };
  const allActive = filterState.accountIds.length===0;

  return (
    <div style={{ marginBottom:14, display:'flex', flexDirection:'column', gap:6 }}>
      {/* Single scrollable pill row: date ranges + account pills */}
      <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:2 }}>
        {RANGES.map(r=>{
          const active=filterState.dateRange===r.id;
          return (
            <button key={r.id} onClick={()=>setFilterState({...filterState,dateRange:r.id})} style={{
              flexShrink:0, padding:'5px 11px', borderRadius:20, border:'1px solid',
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
              background: active?IOS.blue:          '#fff',
              borderColor:active?IOS.blue:          IOS.gray8,
              color:      active?'#fff':             IOS.gray3,
              transition:'all 0.12s',
            }}>{r.label}</button>
          );
        })}

        {accounts.length>0&&<div style={{width:1,height:18,background:IOS.gray8,alignSelf:'center',flexShrink:0}}/>}

        {accounts.length>0&&(
          <button onClick={()=>setFilterState({...filterState,accountIds:[]})} style={{
            flexShrink:0, padding:'5px 11px', borderRadius:20, border:'1px solid',
            fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
            background:allActive?IOS.gray1:'#fff', borderColor:allActive?IOS.gray1:IOS.gray8, color:allActive?'#fff':IOS.gray3,
          }}>All</button>
        )}

        {accounts.map(acc=>{
          const active=filterState.accountIds.includes(acc.id);
          return (
            <button key={acc.id} onClick={()=>toggle(acc.id)} style={{
              flexShrink:0, display:'flex', alignItems:'center', gap:4,
              padding:'5px 11px', borderRadius:20, border:'1px solid',
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
              background: active?IOS.blue+'10':'#fff',
              borderColor:active?IOS.blue+'55':IOS.gray8,
              color:      active?IOS.blue:    IOS.gray3,
            }}>
              {active&&<span style={{width:5,height:5,borderRadius:'50%',background:IOS.blue,flexShrink:0}}/>}
              {acc.name}<span style={{opacity:.6}}>·{acc.currency}</span>
            </button>
          );
        })}
      </div>

      {/* Custom date row */}
      {filterState.dateRange==='custom'&&(
        <div className="anim-down" style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', background:'#fff', border:`1px solid ${IOS.gray8}`, borderRadius:12 }}>
          <span style={{ fontSize:10, fontWeight:700, color:IOS.gray5, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>From</span>
          <input type="date" className="filter-date-input" value={filterState.customStart||''} onChange={e=>setFilterState({...filterState,customStart:e.target.value})}
            style={{ flex:1, border:'none', background:'transparent', fontSize:12, fontFamily:'inherit', color:IOS.gray1, outline:'none' }}/>
          <span style={{ color:IOS.gray6, fontSize:12 }}>→</span>
          <input type="date" className="filter-date-input" value={filterState.customEnd||''} onChange={e=>setFilterState({...filterState,customEnd:e.target.value})}
            style={{ flex:1, border:'none', background:'transparent', fontSize:12, fontFamily:'inherit', color:IOS.gray1, outline:'none' }}/>
        </div>
      )}
    </div>
  );
}
