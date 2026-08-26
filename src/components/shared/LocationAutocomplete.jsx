import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Start typing a Ghana location...",
  className,
  inputClassName,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const query = (value || "").trim();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3 || !open) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "gh",
        limit: "6",
        viewbox: "-3.4,11.2,1.3,4.5",
      });

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const results = await response.json();
        const unique = Array.from(
          new Map(
            results
              .filter((item) => item.display_name)
              .map((item) => [item.display_name, item])
          ).values()
        );
        setSuggestions(unique);
        setActiveIndex(unique.length ? 0 : -1);
      } catch (error) {
        if (error.name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const selectSuggestion = (suggestion) => {
    onChange(suggestion.display_name);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
    if (event.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
      <input
        type="text"
        value={value || ""}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        aria-autocomplete="list"
        aria-expanded={open}
        className={cn(
          "w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName
        )}
      />

      {open && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {query.length < 3 ? (
            <div className="px-4 py-3 text-sm text-slate-500">Type at least 3 characters for suggestions.</div>
          ) : loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching Ghana locations...
            </div>
          ) : suggestions.length ? (
            <div role="listbox" className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id || suggestion.display_name}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                    index === activeIndex ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{suggestion.display_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">No Ghana locations found.</div>
          )}
        </div>
      )}
    </div>
  );
}