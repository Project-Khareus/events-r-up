import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2 } from "lucide-react";
import StepHeading from "./StepHeading";
import StepNav from "./StepNav";

const inputClass =
  "w-full h-14 rounded-none bg-transparent border border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] text-[15px] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.4)] focus:outline-none focus:border-[#A97E2E]";

const labelClass =
  "text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]";

export default function LocationSelector({ value, onChange, onNext, onBack }) {
  const [searchQuery, setSearchQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(value);
  const [radius, setRadius] = useState(value?.radius || 25);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await base44.functions.invoke("geocodeLocation", { query: searchQuery });
        setSuggestions(data?.locations || []);
      } catch (error) {
        console.error("Location search failed:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.formatted_address);
    setSuggestions([]);
  };

  const handleContinue = () => {
    if (!selectedLocation) return;
    onChange({ ...selectedLocation, radius });
    onNext();
  };

  return (
    <div>
      <StepHeading title="Where is your event?" subtitle="We'll find vendors near your location" />

      <div className="max-w-md mx-auto space-y-6">
        <div className="relative">
          <label className={labelClass}>Event location *</label>
          <div className="relative mt-2">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(59,50,43,0.45)]" />
            <input
              type="text"
              placeholder="Search for a city or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-11 pr-10`}
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gold animate-spin" />
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] max-h-64 overflow-y-auto">
              {suggestions.map((location, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full px-4 py-3 min-h-[48px] text-left hover:bg-[rgba(169,126,46,0.08)] transition-colors border-b border-[rgba(59,50,43,0.1)] dark:border-[rgba(241,232,224,0.1)] last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[14px] text-ink dark:text-[#F1E8E0]">{location.name}</p>
                      <p className="text-[12px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{location.formatted_address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="p-4 border border-[#A97E2E] bg-[rgba(169,126,46,0.08)]">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <div>
                <p className="font-serif text-[17px] text-ink dark:text-[#F1E8E0]">{selectedLocation.name}</p>
                <p className="text-[12.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{selectedLocation.formatted_address}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Search radius</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min="1"
              max="100"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="h-12 w-24 rounded-none bg-transparent border border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] text-[15px] text-center text-ink dark:text-[#F1E8E0] focus:outline-none focus:border-[#A97E2E]"
            />
            <span className="text-[13px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">miles from your location</span>
          </div>
        </div>
      </div>

      <StepNav onBack={onBack} onNext={handleContinue} nextDisabled={!selectedLocation} />
    </div>
  );
}