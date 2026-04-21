export const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'KWD', symbol: 'KD',  name: 'Kuwaiti Dinar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
];

export const TRANSACTION_TYPES = {
  INCOME:       'income',
  EXPENSE:      'expense',
  TRANSFER:     'transfer',
  OUT_TRANSFER: 'out_transfer',
  IN_TRANSFER:  'in_transfer',
};

export const ACCOUNT_TYPES = [
  { value: 'Bank',       label: 'Bank Account',  emoji: '🏦' },
  { value: 'Cash',       label: 'Cash Wallet',   emoji: '💵' },
  { value: 'Savings',    label: 'Savings',       emoji: '🏺' },
  { value: 'Credit',     label: 'Credit Card',   emoji: '💳' },
  { value: 'Investment', label: 'Investment',    emoji: '📈' },
];

export const IOS = {
  blue:    '#007AFF',
  green:   '#30D158',
  red:     '#FF453A',
  orange:  '#FF9F0A',
  yellow:  '#FFD60A',
  purple:  '#BF5AF2',
  pink:    '#FF375F',
  teal:    '#5AC8FA',
  indigo:  '#5E5CE6',
  gray1:   '#1C1C1E',
  gray2:   '#3A3A3C',
  gray3:   '#636366',
  gray4:   '#8E8E93',
  gray5:   '#AEAEB2',
  gray6:   '#C7C7CC',
  gray7:   '#D1D1D6',
  gray8:   '#E5E5EA',
  gray9:   '#F2F2F7',
  white:   '#FFFFFF',
};

// Chart palette using iOS colors
export const CHART_COLORS = [
  '#007AFF','#30D158','#FF453A','#FF9F0A','#BF5AF2','#FF375F','#5AC8FA','#FFD60A',
];
