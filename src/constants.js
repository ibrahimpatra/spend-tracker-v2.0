export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  // 'transfer' key is kept for UI tab state, but DB will strictly use in/out
  TRANSFER: 'transfer',       
  OUT_TRANSFER: 'out_transfer', 
  IN_TRANSFER: 'in_transfer'
};

export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};