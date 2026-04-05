import React from "react";

const PILLS = [
  { key: "all", label: "All" },
  { key: "best_events", label: "Best Events" },
  { key: "affordable", label: "Affordable" },
  { key: "see_alls", label: "See All" },
];

export default function FilterPills({ active, onSelect }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PILLS.map((pill) => (
        <button
          key={pill.key}
          onClick={() => onSelect(pill.key)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
            active === pill.key
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          }`}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}