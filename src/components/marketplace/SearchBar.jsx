import { Search } from "lucide-react";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";

export default function SearchBar({ value, onChange, onSearch, location, onLocationChange }) {
  return (
    <div className="flex w-full items-center gap-2">
      {/* Location Autocomplete */}
      <div className="w-44 shrink-0 sm:w-64">
        <LocationAutocomplete
          value={location || ""}
          onChange={(nextLocation) => onLocationChange(nextLocation)}
          placeholder="All Ghana"
          inputClassName="h-10 rounded-full bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-none"
        />
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

      {/* Search Button */}
      <button
        onClick={() => onSearch && onSearch(value || "")}
        title="Search vendors"
        className="group relative shrink-0 h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-500 hover:border-slate-900 dark:hover:border-slate-500 transition-all"
      >
        <Search className="h-4 w-4 text-slate-700 dark:text-slate-300 group-hover:text-white pointer-events-none" />
      </button>
    </div>
  );
}