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
          inputClassName="h-11 rounded-none bg-linen dark:bg-[#2A231D] border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] shadow-none text-[14.5px]"
        />
      </div>

      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(59,50,43,0.45)] pointer-events-none" />
        <input
          type="text"
          aria-label="Search vendors"
          placeholder="Try: 'photographer in Accra for wedding' or 'affordable caterer'"
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            if (!e.target.value && onSearch) onSearch("");
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(value || ""); }}
          className="w-full h-11 pl-9 pr-3 text-[14.5px] rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.45)] focus:outline-none focus:ring-1 focus:ring-[#A97E2E] focus:border-[#A97E2E] transition-colors"
        />
      </div>

      {/* Search Button */}
      <button
        type="button"
        onClick={() => onSearch && onSearch(value || "")}
        title="Search vendors"
        aria-label="Search vendors"
        className="shrink-0 h-11 w-11 flex items-center justify-center rounded-none bg-[#8A6522] hover:bg-[#75551C] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]"
      >
        <Search className="h-4 w-4 text-cream pointer-events-none" />
      </button>
    </div>
  );
}