import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import CategoryForm from '../components/CategoryForm';
import { SvgIcon } from '../utils/icons';

export default function Categories({ user }) {
  const [categories, setCategories] = useState([]);
  const [showAdd,    setShowAdd]    = useState(false);
  const [filterType, setFilterType] = useState('expense');

  useEffect(() => {
    return onSnapshot(
      collection(db, `users/${user.uid}/categories`),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category? Existing transactions will show as Uncategorized.')) {
      await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
    }
  };

  const filtered = categories.filter(c => c.type === filterType);

  return (
    <div className="max-w-2xl mx-auto pb-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-bank-900">Categories</h2>
          <p className="text-sm text-bank-500 mt-0.5">{filtered.length} {filterType} categories</p>
        </div>
        <button
          onClick={() => setShowAdd(o => !o)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
            showAdd
              ? 'bg-gray-100 text-bank-900'
              : 'bg-money-600 text-white hover:bg-money-700 shadow-sm'
          }`}
        >
          {showAdd ? 'Cancel' : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Add Category
            </>
          )}
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 mb-5">
        {['expense', 'income'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition ${
              filterType === t
                ? t === 'expense'
                  ? 'bg-[#FF3B30] text-white shadow-sm'
                  : 'bg-[#34C759] text-white shadow-sm'
                : 'bg-white text-bank-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'expense' ? '↑ Expense' : '↓ Income'}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-5">
          <CategoryForm
            user={user}
            type={filterType}
            onSuccess={() => setShowAdd(false)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Categories Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl text-bank-500 text-sm">
          <p className="text-3xl mb-3">{filterType === 'expense' ? '🧾' : '💰'}</p>
          No {filterType} categories. Create one above.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2.5 group relative hover:shadow-md transition"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(cat.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-[#FF3B30] flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
              >
                ✕
              </button>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: cat.color }}
              >
                <SvgIcon name={cat.icon} className="w-6 h-6" />
              </div>

              {/* Name */}
              <span className="text-xs font-bold text-bank-900 text-center truncate w-full">{cat.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
