// ── Design tokens ─────────────────────────────────────────────────────────────
export const T = {
  // Backgrounds
  bg:        '#FAFAFA',
  surface:   '#FFFFFF',
  surface2:  '#F2F2F7',  // grouped section backgrounds

  // Brand
  blue:      '#056DFF',
  blueLight: '#EAF1FF',
  blueMid:   'rgba(5,109,255,0.12)',

  // Semantic
  green:     '#30D158',
  greenLight:'#EDFBF1',
  red:       '#FF3B30',
  redLight:  '#FFF2F1',
  orange:    '#FF9500',
  orangeLight:'#FFF8EC',
  purple:    '#BF5AF2',
  teal:      '#32ADE6',

  // Text
  t1: '#000000',
  t2: '#3C3C43CC',   // 80% — secondary
  t3: '#3C3C4399',   // 60% — tertiary
  t4: '#3C3C4366',   // 40% — quaternary

  // Structural
  sep:    '#C6C6C8',      // separator lines
  border: 'rgba(0,0,0,0.07)',
  shadow: '0 0 0 0.5px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.05)',
  shadowMd: '0 2px 12px rgba(0,0,0,0.09)',

  // Radii
  r8:  8,
  r12: 12,
  r16: 16,
  r20: 20,
};

// ── Currencies ──────────────────────────────────────────────────────────────
export const CURRENCIES = [
  {code:'USD',symbol:'$',   name:'US Dollar'},
  {code:'KWD',symbol:'KD',  name:'Kuwaiti Dinar'},
  {code:'EUR',symbol:'€',   name:'Euro'},
  {code:'GBP',symbol:'£',   name:'British Pound'},
  {code:'INR',symbol:'₹',   name:'Indian Rupee'},
  {code:'AED',symbol:'AED', name:'UAE Dirham'},
  {code:'SAR',symbol:'﷼',   name:'Saudi Riyal'},
  {code:'JPY',symbol:'¥',   name:'Japanese Yen'},
  {code:'CAD',symbol:'C$',  name:'Canadian Dollar'},
  {code:'AUD',symbol:'A$',  name:'Australian Dollar'},
  {code:'SGD',symbol:'S$',  name:'Singapore Dollar'},
  {code:'CHF',symbol:'Fr',  name:'Swiss Franc'},
];

export const sym = code => CURRENCIES.find(c=>c.code===code)?.symbol || code;
export const fmt = (n,code='') => `${sym(code)}${Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── Account types ──────────────────────────────────────────────────────────
export const ACCOUNT_TYPES = [
  {value:'Bank',      label:'Bank Account', emoji:'🏦'},
  {value:'Cash',      label:'Cash Wallet',  emoji:'💵'},
  {value:'Savings',   label:'Savings',      emoji:'🏺'},
  {value:'Credit',    label:'Credit Card',  emoji:'💳'},
  {value:'Investment',label:'Investment',   emoji:'📈'},
];

// ── Transaction types ──────────────────────────────────────────────────────
export const TX = {
  INCOME:      'income',
  EXPENSE:     'expense',
  OUT_TRANSFER:'out_transfer',
  IN_TRANSFER: 'in_transfer',
};

// ── Type helpers ──────────────────────────────────────────────────────────
export const isIncome   = t => t==='income'  || t==='in_transfer';
export const isExpense  = t => t==='expense' || t==='out_transfer';
export const isTransfer = t => t==='out_transfer' || t==='in_transfer';

// ── Chart palette ─────────────────────────────────────────────────────────
export const PALETTE = [
  '#056DFF','#30D158','#FF3B30','#FF9500',
  '#BF5AF2','#FF375F','#32ADE6','#FFD60A',
];
