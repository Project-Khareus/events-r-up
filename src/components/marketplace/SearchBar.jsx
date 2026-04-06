import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Wand2, Loader2 } from "lucide-react";

const LOCATIONS = [
  "All Ghana",
  "Accra",
  "Kumasi",
  "Takoradi",
  "Tamale",
  "Cape Coast",
  "Tema",
  "Koforidua",
  "Sunyani",
  "Ho",
  "Wa",
  "Bolgatanga"
];

export default function SearchBar({ value, onChange, onSearch, onAiSearch, isAiSearching, location, onLocationChange }) {
  const [locationOpen, setLocationOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = location || "All Ghana";

  return (
    <div className="flex w-full items-center gap-2">
      {/* Location Chip */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setLocationOpen(!locationOpen)}
          className="flex items-center gap-1.5 h-10 px-3.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
        >
          <span className="max-w-[80px] sm:max-w-none truncate">{selectedLabel}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
        </button>
        {locationOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  onLocationChange(loc === "All Ghana" ? "" : loc);
                  setLocationOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  (loc === "All Ghana" && !location) || loc === location
                    ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Try: 'photographer in Accra for wedding' or 'affordable caterer'"
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            if (!e.target.value && onSearch) onSearch("");
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(value || ""); }}
          className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all"
        />
      </div>

      {/* AI Button */}
      {onAiSearch && (
        <button
          onClick={() => onAiSearch(value || "")}
          disabled={isAiSearching}
          title="AI-powered search"
          className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60 transition-colors"
        >
          {isAiSearching ? (
            <Loader2 className="h-4 w-4 text-slate-600 dark:text-slate-300 animate-spin pointer-events-none" />
          ) : (
            <Wand2 className="h-4 w-4 text-slate-600 dark:text-slate-300 pointer-events-none" />
          )}
        </button>
      )}

      {/* Search Button */}
      <button
        onClick={() => onSearch && onSearch(value || "")}
        className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      >
        <Search className="h-4 w-4 text-slate-700 dark:text-slate-300 pointer-events-none" />
      </button>
    </div>
  );
}