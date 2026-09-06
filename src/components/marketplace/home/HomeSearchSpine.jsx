import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import SearchBar from "../SearchBar";
import { createPageUrl } from "../../../utils";

const EVENT_TYPES = [
  { value: "all", label: "Any occasion" },
  { value: "weddings", label: "Weddings" },
  { value: "parties", label: "Parties" },
  { value: "conference", label: "Conference" },
  { value: "funeral", label: "Funeral" },
];

const labelClass = "block text-[9.5px] font-medium tracking-[0.15em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)] mb-1";
const cellClass = "px-4 py-3 flex-1 min-w-0";

export default function HomeSearchSpine({
  eventType,
  onEventChange,
  location,
  onLocationChange,
  availableDate,
  onAvailableDateChange,
  searchInput,
  onSearchInputChange,
  onSearch,
}) {
  const [showSemantic, setShowSemantic] = useState(false);

  return (
    <section className="px-5 md:px-10 pb-8 md:pb-12">
      {/* Desktop spine */}
      <div className="hidden md:flex mx-auto w-full max-w-[880px] items-stretch bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] divide-x divide-[rgba(59,50,43,0.14)] dark:divide-[rgba(241,232,224,0.16)]">
        <div className={cellClass}>
          <span className={labelClass}>Occasion</span>
          <Select value={eventType} onValueChange={onEventChange}>
            <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none rounded-none text-[14.5px] text-ink dark:text-[#F1E8E0] focus:ring-0">
              <SelectValue placeholder="Any occasion" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cellClass}>
          <span className={labelClass}>City</span>
          <LocationAutocomplete
            value={location || ""}
            onChange={onLocationChange}
            placeholder="All Ghana"
            inputClassName="h-auto p-0 pl-0 border-0 bg-transparent shadow-none rounded-none text-[14.5px] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.45)] focus-visible:ring-0"
            className="[&>svg]:hidden"
          />
        </div>

        <div className={cellClass}>
          <span className={labelClass}>Date</span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`text-[14.5px] text-left w-full truncate ${availableDate ? "text-ink dark:text-[#F1E8E0]" : "text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]"}`}
              >
                {availableDate ? format(availableDate, "PPP") : "Any date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-none" align="start">
              <Calendar
                mode="single"
                selected={availableDate}
                onSelect={onAvailableDateChange}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <button
          type="button"
          onClick={() => onSearch((searchInput || "").trim())}
          className="shrink-0 px-7 bg-[#8A6522] hover:bg-[#75551C] text-cream text-[11.5px] font-medium tracking-[0.1em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]"
        >
          Search
        </button>
      </div>

      {/* Desktop semantic reveal */}
      <div className="hidden md:block mx-auto w-full max-w-[880px] mt-3 text-center">
        <button
          type="button"
          onClick={() => setShowSemantic((v) => !v)}
          aria-expanded={showSemantic}
          className="text-[12px] font-light text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)] hover:text-ink dark:hover:text-[#F1E8E0] transition-colors"
        >
          Or describe it plainly — 'affordable caterer in Kumasi for 300 guests'
        </button>
        <span className="mx-2 text-[rgba(59,50,43,0.25)]">·</span>
        <Link
          to={createPageUrl("EventPlanning")}
          className="text-[12px] text-gold-text dark:text-gold-dark hover:underline"
        >
          Plan an Event
        </Link>

        {showSemantic && (
          <div className="mt-4">
            <SearchBar
              value={searchInput}
              onChange={onSearchInputChange}
              onSearch={onSearch}
              location={location}
              onLocationChange={onLocationChange}
            />
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(59,50,43,0.45)] pointer-events-none" />
          <input
            type="text"
            aria-label="Search vendors"
            placeholder="Describe what you need"
            value={searchInput || ""}
            onChange={(e) => {
              onSearchInputChange(e.target.value);
              if (!e.target.value) onSearch("");
            }}
            onKeyDown={(e) => { if (e.key === "Enter") onSearch((searchInput || "").trim()); }}
            className="w-full h-12 pl-9 pr-3 text-[14.5px] rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.45)] focus:outline-none focus:ring-1 focus:ring-[#A97E2E]"
          />
        </div>
        <Link to={createPageUrl("EventPlanning")} className="block">
          <button className="w-full h-12 rounded-none bg-[#8A6522] hover:bg-[#75551C] text-cream text-[11.5px] font-medium tracking-[0.1em] uppercase transition-colors">
            Plan an event
          </button>
        </Link>
      </div>
    </section>
  );
}