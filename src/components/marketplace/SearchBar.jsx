import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";

const DEFAULT_LOCATIONS = [
  "Accra",
  "Kumasi",
  "Tema",
  "Tamale",
  "Cape Coast",
  "Takoradi",
  "Koforidua",
  "Ho",
  "Sunyani",
  "Bolgatanga"
];

export default function SearchBar({ value, onChange, location, onLocationChange, vendorLocations = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [locQuery, setLocQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const displayLocation = location || "All Ghana";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setIsEditing(false);
        setLocQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge vendor locations with defaults, deduplicate, sort alphabetically
  const allLocations = React.useMemo(() => {
    const merged = new Set([...DEFAULT_LOCATIONS, ...vendorLocations]);
    const sorted = Array.from(merged).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return ["All Ghana", ...sorted];
  }, [vendorLocations]);

  const filteredLocations = allLocations.filter((loc) =>
    loc.toLowerCase().includes(locQuery.toLowerCase())
  );

  const handleOpen = () => {
    setIsEditing(true);
    setShowDropdown(true);
    setLocQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (loc) => {
    onLocationChange?.(loc === "All Ghana" ? "" : loc);
    setShowDropdown(false);
    setIsEditing(false);
    setLocQuery("");
  };

  return (
    <div className="flex w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
      {/* Location selector */}
      <div className="relative" ref={dropdownRef}>
        {isEditing ? (
          <div className="flex items-center h-12 sm:h-14 bg-slate-50 dark:bg-slate-600 border-r border-slate-200 dark:border-slate-500">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 ml-3 hidden sm:block" />
            <input
              ref={inputRef}
              type="text"
              value={locQuery}
              onChange={(e) => setLocQuery(e.target.value)}
              placeholder="Type a city..."
              className="h-full w-28 sm:w-36 px-2 text-sm sm:text-base bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-1.5 h-12 sm:h-14 px-3 sm:px-4 bg-slate-50 dark:bg-slate-600 border-r border-slate-200 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
            <span className="font-medium truncate max-w-[80px] sm:max-w-none">{displayLocation}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>
        )}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
            {filteredLocations.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No locations found</div>
            ) : (
              filteredLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleSelect(loc)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors ${
                    (loc === "All Ghana" && !location) || location === loc
                      ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-900/20"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {loc}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {/* Search input */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="I am looking for..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 sm:h-14 px-4 pr-12 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      </div>
    </div>
  );
}