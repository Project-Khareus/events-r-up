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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Where is your event?</h2>
        <p className="text-slate-600">Search for your event location</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="relative">
          <Label className="text-base mb-3 block flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            Event Location *
          </Label>
          <Input
            type="text"
            placeholder="Enter city, state, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 rounded-xl text-lg pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-[52px] h-5 w-5 text-slate-400 animate-spin" />
          )}

          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {suggestions.map((location, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{location.name}</p>
                      <p className="text-sm text-slate-600">{location.formatted_address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">{selectedLocation.name}</p>
                <p className="text-sm text-slate-600">{selectedLocation.formatted_address}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm mb-2 block">Search Radius (miles)</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="rounded-xl"
          />
          <p className="text-xs text-slate-500 mt-1">
            We'll show vendors within {radius} miles of your location
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-8 h-12 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedLocation}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}