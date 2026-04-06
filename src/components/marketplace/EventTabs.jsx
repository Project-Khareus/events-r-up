import React from "react";

const TABS = [
  { value: "weddings", label: "Weddings" },
  { value: "parties", label: "Parties" },
  { value: "conference", label: "Conferences" },
  { value: "funeral", label: "Funerals" },
  { value: "all", label: "All" },
];

export default function EventTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-6 py-3 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors relative ${
              activeTab === tab.value
                ? "text-orange-500"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
            {activeTab === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500 rounded-t" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}