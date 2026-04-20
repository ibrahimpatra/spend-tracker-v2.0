import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ICON_SET, SvgIcon } from '../utils/icons';

const PRESET_COLORS = [
  '#007AFF', '#34C759', '#FF3B30', '#FF9500', '#FFCC00',
  '#AF52DE', '#FF2D55', '#5AC8FA', '#8E8E93', '#1C1C1E',
];

export default function CategoryForm({ user, type, onSuccess, onCancel }) {
  const [name,    setName]    = useState('');
  const [color,   setColor]   = useState('#007AFF');
  const [icon,    setIcon]    = useState('Shopping');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = { name: name.trim(), icon, color, type, userId: user.uid };
      const ref = await addDoc(collection(db, `users/${user.uid}/categories`), payload);
      if (onSuccess) onSuccess({ id: ref.id, ...payload });
    } catch (err) {
      console.error('Error adding category:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in-up">
      <h4 className="font-bold text-bank-900 mb-4">New {type === 'expense' ? 'Expense' : 'Income'} Category</h4>

      <div className="space-y-4">
        {/* Name + color preview row */}
        <div className="flex items-center gap-3">
          {/* Icon preview */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          >
            <SvgIcon name={icon} className="w-6 h-6" />
          </div>
          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-bank-900 focus:outline-none focus:border-money-400 focus:bg-white transition"
            autoFocus
          />
        </div>

        {/* Color presets */}
        <div>
          <p className="text-xs font-bold text-bank-500 uppercase tracking-wide mb-2">Color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
            {/* Custom color picker */}
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-dashed border-gray-300">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-0"
                title="Custom color"
              />
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs pointer-events-none">+</div>
            </div>
          </div>
        </div>

        {/* Icon grid */}
        <div>
          <p className="text-xs font-bold text-bank-500 uppercase tracking-wide mb-2">Icon</p>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {Object.keys(ICON_SET).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setIcon(k)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                  icon === k
                    ? 'shadow-md scale-110 text-white'
                    : 'bg-gray-50 text-bank-500 hover:bg-gray-100'
                }`}
                style={icon === k ? { backgroundColor: color } : {}}
                title={k}
              >
                <SvgIcon name={k} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-bank-500 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition disabled:opacity-50 active:scale-[0.98]"
            style={{ backgroundColor: color }}
          >
            {loading ? 'Saving...' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
