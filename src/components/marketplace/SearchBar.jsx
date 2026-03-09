import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";

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

export default function SearchBar({ value, onChange, onSearch, location, onLocationChange }) {
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
    <div className="flex w-full items-center gap-0">
      {/* Location Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setLocationOpen(!locationOpen)}
          className="flex items-center gap-2 h-12 sm:h-14 px-4 sm:px-5 bg-white dark:bg-slate-700 border border-r-0 border-slate-200 dark:border-slate-600 rounded-l-xl sm:rounded-l-2xl text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
        >
          <MapPin className="h-4 w-4 text-slate-400 hidden sm:block" />
          <span className="max-w-[80px] sm:max-w-none truncate">{selectedLabel}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
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
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="I am looking for..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(value || ""); }}
          className="w-full h-12 sm:h-14 pl-4 sm:pl-5 pr-12 text-sm sm:text-base border border-slate-200 dark:border-slate-600 rounded-r-xl sm:rounded-r-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
        />
        <button
          onClick={() => onSearch && onSearch(value || "")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          <Search className="h-5 w-5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}