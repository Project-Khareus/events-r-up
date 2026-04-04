import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ChevronLeft, Loader2 } from "lucide-react";

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
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Find and return geocoded locations for the search query: "${searchQuery}". Return the top 5 most relevant results with their coordinates. Include cities, states, and countries in the results.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              locations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    formatted_address: { type: "string" },
                    lat: { type: "number" },
                    lng: { type: "number" }
                  }
                }
              }
            }
          }
        });
        setSuggestions(response.locations || []);
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Where is your event?</h2>
        <p className="text-slate-600 dark:text-slate-300">We'll find vendors near your location</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="relative">
          <Label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200">
            Event Location *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for a city or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-xl text-base pl-12 pr-10 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 animate-spin" />
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto">
              {suggestions.map((location, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors border-b border-slate-100 dark:border-slate-600 last:border-b-0 group"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{location.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{location.formatted_address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedLocation.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedLocation.formatted_address}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-200">Search Radius</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max="100"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="rounded-xl h-11 w-24 text-center"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">miles from your location</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 h-12 rounded-xl border-slate-300 text-slate-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedLocation}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:shadow-none"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}