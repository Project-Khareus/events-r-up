import React from "react";

export default function CategoryViewBreakdown({ items = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Views by Category</h2>
      <p className="text-sm text-slate-400 mb-4">Profile views grouped by your services</p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No category view data yet</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}