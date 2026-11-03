import { useState } from "react";
import { MapPin, Plus, X } from "lucide-react";
import LocationAutocomplete, { conciseLabel } from "@/components/shared/LocationAutocomplete";
import formatVendorLocation from "@/components/utils/formatLocation";
import { MAX_VENDOR_LOCATIONS } from "@/components/utils/vendorLocations";

// Lets a vendor list every town or city they serve. The first one is shown
// first on their listing.
export default function MultiLocationInput({ value = [], onChange, className }) {
  const [draft, setDraft] = useState("");
  const locations = Array.isArray(value) ? value : [];
  const full = locations.length >= MAX_VENDOR_LOCATIONS;

  const add = (raw) => {
    const loc = String(raw || "").trim();
    if (!loc || full) return;
    if (locations.some((l) => l.toLowerCase() === loc.toLowerCase())) { setDraft(""); return; }
    onChange([...locations, loc]);
    setDraft("");
  };

  const remove = (index) => onChange(locations.filter((_, i) => i !== index));

  return (
    <div className={className}>
      {locations.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2.5" aria-label="Locations you serve">
          {locations.map((loc, i) => (
            <li key={loc} className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 border border-gold/40 bg-gold/10 text-[13px] text-ink dark:text-[#F1E8E0]">
              <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span>{formatVendorLocation(loc)}</span>
              {i === 0 && locations.length > 1 && <span className="text-[10.5px] uppercase tracking-[0.12em] text-gold-text dark:text-gold-dark ml-0.5">Main</span>}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${loc}`}
                className="ml-0.5 h-6 w-6 grid place-items-center text-ink/60 hover:text-ink hover:bg-gold/15 dark:text-[#C5B9AC] dark:hover:text-[#F1E8E0]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full ? (
        <div
          className="flex gap-2"
          onKeyDown={(e) => {
            // Enter adds what's typed, unless the autocomplete already picked a suggestion
            if (e.key === "Enter" && !e.defaultPrevented && draft.trim()) {
              e.preventDefault();
              add(draft);
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <LocationAutocomplete
              value={draft}
              onChange={setDraft}
              onSelect={(s) => add(typeof s === "string" ? s : conciseLabel(s))}
              placeholder={locations.length ? "Add another town or city" : "e.g., Osu, Accra"}
            />
          </div>
          <button
            type="button"
            onClick={() => add(draft)}
            disabled={!draft.trim()}
            className="shrink-0 h-10 px-3 inline-flex items-center gap-1.5 border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.2)] text-[13px] text-ink dark:text-[#F1E8E0] hover:border-gold disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />Add
          </button>
        </div>
      ) : (
        <p className="text-xs text-[rgba(59,50,43,0.6)] dark:text-[rgba(241,232,224,0.6)]">You've added the maximum of {MAX_VENDOR_LOCATIONS} locations.</p>
      )}
      <p className="mt-1.5 text-xs text-[rgba(59,50,43,0.6)] dark:text-[rgba(241,232,224,0.6)]">
        Add every town or city you work in. Customers searching any of them will find you.
      </p>
    </div>
  );
}
