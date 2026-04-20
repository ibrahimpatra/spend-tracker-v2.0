import React from 'react';
import { CURRENCIES } from '../../constants';

const CARD_STYLES = [
  // Primary — deep iOS blue gradient
  { bg: 'bg-gradient-to-br from-[#007AFF] to-[#0047AB]', text: 'text-white', sub: 'text-white/70', shine: true },
  // Slate dark — for second account
  { bg: 'bg-gradient-to-br from-[#1C1C1E] to-[#3A3A3C]', text: 'text-white', sub: 'text-white/60', shine: true },
  // Light blue card
  { bg: 'bg-white', text: 'text-bank-900', sub: 'text-bank-500', shine: false, border: 'border border-gray-100' },
  { bg: 'bg-white', text: 'text-bank-900', sub: 'text-bank-500', shine: false, border: 'border border-gray-100' },
];

export default function BalanceCard({ currency, balance, label, index }) {
  const style = CARD_STYLES[index] || CARD_STYLES[2];
  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const isNegative = balance < 0;

  return (
    <div className={`relative p-5 rounded-2xl shadow-sm overflow-hidden transition-transform active:scale-[0.98] cursor-default select-none ${style.bg} ${style.border || ''}`}>

      {/* Shine / gloss effect for colored cards */}
      {style.shine && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl pointer-events-none" />
      )}
      {style.shine && (
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-black/10 pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col gap-3">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${style.sub}`}>
            {label}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            style.shine ? 'bg-white/20 text-white' : 'bg-gray-100 text-bank-500'
          }`}>
            {currency}
          </span>
        </div>

        {/* Balance */}
        <div className={`text-2xl font-extrabold tracking-tight ${style.text} ${isNegative ? 'text-red-300' : ''}`}>
          {isNegative ? '-' : ''}{symbol}{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <div className={`text-[11px] font-medium ${style.sub}`}>
          Current Balance
        </div>
      </div>
    </div>
  );
}
