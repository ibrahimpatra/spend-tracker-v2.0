// ─────────────────────────────────────────────────────────────────────────────
// MyVault v6 — constants.js
// Single source of truth. Never import colours or config from anywhere else.
// ─────────────────────────────────────────────────────────────────────────────

// ─── iOS System Color Palette ────────────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bgPrimary:        '#F2F2F7',   // iOS grouped table background
  bgSecondary:      '#FFFFFF',   // iOS secondary grouped background
  bgTertiary:       '#F2F2F7',   // iOS tertiary grouped background

  // Cards & Surfaces
  surface:          '#FFFFFF',
  surfaceRaised:    '#FFFFFF',
  surfaceOverlay:   'rgba(255,255,255,0.92)',

  // iOS System Colors
  blue:             '#007AFF',
  green:            '#34C759',
  red:              '#FF3B30',
  orange:           '#FF9500',
  yellow:           '#FFCC00',
  teal:             '#5AC8FA',
  indigo:           '#5856D6',
  purple:           '#AF52DE',
  pink:             '#FF2D55',
  brown:            '#A2845E',

  // Text
  labelPrimary:     '#1C1C1E',
  labelSecondary:   '#6C6C70',
  labelTertiary:    '#AEAEB2',
  labelQuaternary:  '#C7C7CC',

  // Separators
  separator:        '#C6C6C8',
  separatorOpaque:  '#E5E5EA',

  // Fill (for overlays)
  fillPrimary:      'rgba(120,120,128,0.20)',
  fillSecondary:    'rgba(120,120,128,0.16)',
  fillTertiary:     'rgba(118,118,128,0.12)',

  // Semantic aliases
  income:           '#34C759',
  expense:          '#FF3B30',
  transfer:         '#007AFF',
  warning:          '#FF9500',
  neutral:          '#8E8E93',
};

// ─── Typography Scale ─────────────────────────────────────────────────────────
// Uses SF Pro via -apple-system stack — closest to native iOS on all platforms
export const FONT = {
  family: "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', sans-serif",

  // Weights
  ultralight: 100,
  thin:       200,
  light:      300,
  regular:    400,
  medium:     500,
  semibold:   600,
  bold:       700,
  heavy:      800,
  black:      900,

  // iOS type scale
  largeTitle:   { size: '34px', weight: 700, lineHeight: '41px', letterSpacing: '0.37px' },
  title1:       { size: '28px', weight: 700, lineHeight: '34px', letterSpacing: '0.36px' },
  title2:       { size: '22px', weight: 700, lineHeight: '28px', letterSpacing: '0.35px' },
  title3:       { size: '20px', weight: 600, lineHeight: '25px', letterSpacing: '0.38px' },
  headline:     { size: '17px', weight: 600, lineHeight: '22px', letterSpacing: '-0.41px' },
  body:         { size: '17px', weight: 400, lineHeight: '22px', letterSpacing: '-0.41px' },
  callout:      { size: '16px', weight: 400, lineHeight: '21px', letterSpacing: '-0.32px' },
  subheadline:  { size: '15px', weight: 400, lineHeight: '20px', letterSpacing: '-0.24px' },
  footnote:     { size: '13px', weight: 400, lineHeight: '18px', letterSpacing: '-0.08px' },
  caption1:     { size: '12px', weight: 400, lineHeight: '16px', letterSpacing: '0px' },
  caption2:     { size: '11px', weight: 400, lineHeight: '13px', letterSpacing: '0.07px' },
};

// ─── Spacing & Radius ────────────────────────────────────────────────────────
export const SPACE = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  md:  '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg:  '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)',
  xl:  '0 16px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
  pill: '0 8px 32px rgba(0,122,255,0.24)',
  fab:  '0 8px 24px rgba(0,122,255,0.35)',
};

// ─── Currencies ───────────────────────────────────────────────────────────────
// IMPORTANT: Currencies are NEVER summed across types. Each is always shown separately.
export const CURRENCIES = [
  { code: 'KWD', name: 'Kuwaiti Dinar',    symbol: 'KD',  decimals: 3, locale: 'ar-KW' },
  { code: 'USD', name: 'US Dollar',         symbol: '$',   decimals: 2, locale: 'en-US' },
  { code: 'EUR', name: 'Euro',              symbol: '€',   decimals: 2, locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound',     symbol: '£',   decimals: 2, locale: 'en-GB' },
  { code: 'AED', name: 'UAE Dirham',        symbol: 'AED', decimals: 2, locale: 'ar-AE' },
  { code: 'SAR', name: 'Saudi Riyal',       symbol: '⃁',  decimals: 2, locale: 'ar-SA' },
  { code: 'QAR', name: 'Qatari Riyal',      symbol: 'QR',  decimals: 2, locale: 'ar-QA' },
  { code: 'BHD', name: 'Bahraini Dinar',    symbol: 'BD',  decimals: 3, locale: 'ar-BH' },
  { code: 'OMR', name: 'Omani Rial',        symbol: 'RO',  decimals: 3, locale: 'ar-OM' },
  { code: 'JOD', name: 'Jordanian Dinar',   symbol: 'JD',  decimals: 3, locale: 'ar-JO' },
  { code: 'EGP', name: 'Egyptian Pound',    symbol: 'E£',  decimals: 2, locale: 'ar-EG' },
  { code: 'TRY', name: 'Turkish Lira',      symbol: '₺',   decimals: 2, locale: 'tr-TR' },
  { code: 'INR', name: 'Indian Rupee',      symbol: '₹',   decimals: 2, locale: 'en-IN' },
  { code: 'CAD', name: 'Canadian Dollar',   symbol: 'CA$', decimals: 2, locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$',  decimals: 2, locale: 'en-AU' },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥',   decimals: 0, locale: 'ja-JP' },
  { code: 'CHF', name: 'Swiss Franc',       symbol: 'Fr',  decimals: 2, locale: 'de-CH' },
  { code: 'CNY', name: 'Chinese Yuan',      symbol: '¥',   decimals: 2, locale: 'zh-CN' },
  { code: 'SGD', name: 'Singapore Dollar',  symbol: 'S$',  decimals: 2, locale: 'en-SG' },
  { code: 'HKD', name: 'Hong Kong Dollar',  symbol: 'HK$', decimals: 2, locale: 'en-HK' },
];

export const DEFAULT_CURRENCY = 'KWD';

export const getCurrencyMeta = (code) =>
  CURRENCIES.find(c => c.code === code) || { code, symbol: code, decimals: 2, locale: 'en-US' };

// ─── Transaction Types ────────────────────────────────────────────────────────
export const TX_TYPES = {
  EXPENSE:      'expense',
  INCOME:       'income',
  TRANSFER_INT: 'transfer',        // internal between own accounts
  TRANSFER_OUT: 'out_transfer',    // sent externally
  TRANSFER_IN:  'in_transfer',     // received externally
};

export const isIncomeType   = (type) => type === TX_TYPES.INCOME || type === TX_TYPES.TRANSFER_IN;
export const isExpenseType  = (type) => type === TX_TYPES.EXPENSE || type === TX_TYPES.TRANSFER_OUT;
export const isTransferType = (type) => [TX_TYPES.TRANSFER_INT, TX_TYPES.TRANSFER_OUT, TX_TYPES.TRANSFER_IN].includes(type);

// ─── Account Types ────────────────────────────────────────────────────────────
export const ACCOUNT_TYPES = [
  { value: 'bank',       label: 'Bank Account',   icon: 'Landmark' },
  { value: 'cash',       label: 'Cash',            icon: 'Banknote' },
  { value: 'savings',    label: 'Savings',         icon: 'PiggyBank' },
  { value: 'credit',     label: 'Credit Card',     icon: 'CreditCard' },
  { value: 'investment', label: 'Investment',      icon: 'TrendingUp' },
  { value: 'wallet',     label: 'Digital Wallet',  icon: 'Wallet' },
];

// ─── Date Range Options ───────────────────────────────────────────────────────
export const DATE_RANGES = [
  { value: 'today',      label: 'Today' },
  { value: 'yesterday',  label: 'Yesterday' },
  { value: 'thisWeek',   label: 'This Week' },
  { value: 'thisMonth',  label: 'This Month' },
  { value: 'lastMonth',  label: 'Last Month' },
  { value: 'thisYear',   label: 'This Year' },
  { value: 'allTime',    label: 'All Time' },
  { value: 'custom',     label: 'Custom' },
];

// ─── Default Expense Categories ───────────────────────────────────────────────
// Lucide icon names only — no emoji
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining',    icon: 'UtensilsCrossed', color: '#FF6B6B' },
  { name: 'Transport',        icon: 'Car',             color: '#4ECDC4' },
  { name: 'Shopping',         icon: 'ShoppingBag',     color: '#45B7D1' },
  { name: 'Housing',          icon: 'Home',            color: '#96CEB4' },
  { name: 'Healthcare',       icon: 'Heart',           color: '#FF8B94' },
  { name: 'Education',        icon: 'GraduationCap',   color: '#A8E6CF' },
  { name: 'Entertainment',    icon: 'Clapperboard',    color: '#FFEAA7' },
  { name: 'Travel',           icon: 'Plane',           color: '#74B9FF' },
  { name: 'Utilities',        icon: 'Zap',             color: '#FD79A8' },
  { name: 'Subscriptions',    icon: 'RefreshCw',       color: '#6C5CE7' },
  { name: 'Fitness',          icon: 'Dumbbell',        color: '#00B894' },
  { name: 'Personal Care',    icon: 'Sparkles',        color: '#E17055' },
  { name: 'Gifts',            icon: 'Gift',            color: '#FDCB6E' },
  { name: 'Insurance',        icon: 'Shield',          color: '#0984E3' },
  { name: 'Taxes',            icon: 'Receipt',         color: '#B2BEC3' },
  { name: 'Other',            icon: 'MoreHorizontal',  color: '#DFE6E9' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary',           icon: 'Briefcase',       color: '#34C759' },
  { name: 'Freelance',        icon: 'Laptop',          color: '#007AFF' },
  { name: 'Investment',       icon: 'TrendingUp',      color: '#FF9500' },
  { name: 'Rental',           icon: 'Building2',       color: '#5856D6' },
  { name: 'Business',         icon: 'Store',           color: '#FF2D55' },
  { name: 'Gift Received',    icon: 'Gift',            color: '#5AC8FA' },
  { name: 'Refund',           icon: 'RotateCcw',       color: '#4CD964' },
  { name: 'Other Income',     icon: 'CirclePlus',      color: '#8E8E93' },
];

// ─── Category Colors (10 presets) ─────────────────────────────────────────────
export const CATEGORY_COLORS = [
  '#FF6B6B', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E',
];

// ─── Category Icons (Lucide names) ────────────────────────────────────────────
export const CATEGORY_ICONS = [
  'UtensilsCrossed', 'Car', 'ShoppingBag', 'Home', 'Heart',
  'GraduationCap', 'Clapperboard', 'Plane', 'Zap', 'RefreshCw',
  'Dumbbell', 'Sparkles', 'Gift', 'Shield', 'Receipt',
  'Briefcase', 'Laptop', 'TrendingUp', 'Building2', 'Store',
  'Coffee', 'Music', 'Camera', 'Gamepad2', 'Book',
  'Baby', 'PawPrint', 'Fuel', 'Wrench', 'Phone',
];

// ─── Navigation Items ─────────────────────────────────────────────────────────
// Icon names from Lucide React
export const NAV_ITEMS = [
  { path: '/dashboard',  label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/records',    label: 'Records',   icon: 'ListFilter' },
  { path: '/insights',   label: 'Insights',  icon: 'BarChart3' },
  { path: '/accounts',   label: 'Accounts',  icon: 'Wallet' },
  { path: '/budget',     label: 'Budget',    icon: 'Target' },
];

// ─── LocalStorage Cache Config ────────────────────────────────────────────────
export const CACHE = {
  TTL_MS:       5 * 60 * 1000,  // 5 minutes
  KEYS: {
    accounts:     (uid) => `mv6_accounts_${uid}`,
    categories:   (uid) => `mv6_categories_${uid}`,
    transactions: (uid, hash) => `mv6_tx_${uid}_${hash}`,
    hiddenBals:   (uid) => `mv6_hidden_${uid}`,
    filterState:  (uid) => `mv6_filter_${uid}`,
  },
};

// ─── Chart Colors (for donut / category breakdowns) ───────────────────────────
export const CHART_PALETTE = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6',
  '#FF2D55', '#AF52DE', '#5AC8FA', '#FFCC00', '#A2845E',
  '#4CD964', '#FF6B6B', '#FF8B94', '#74B9FF', '#6C5CE7',
];

// ─── Animation Durations ──────────────────────────────────────────────────────
export const ANIM = {
  fast:   150,
  normal: 250,
  slow:   350,
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease:   'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut:'cubic-bezier(0, 0, 0.2, 1)',
};