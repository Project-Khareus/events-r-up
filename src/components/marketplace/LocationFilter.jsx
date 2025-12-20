import React, { useState } from "react";
import { ChevronDown, Navigation, Video, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function LocationFilter({ location, onLocationChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onLocationChange(inputValue.trim());
      setIsOpen(false);
      setInputValue("");
    }
  };

  const handleOnline = () => {
    onLocationChange("Online");
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    // Mocking geolocation for demo purposes since we don't have reverse geocoding
    // In a real app: navigator.geolocation.getCurrentPosition(...)
    onLocationChange("Current Location"); 
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 text-sm md:text-base">
      <span className="text-slate-600 font-medium hidden sm:inline">Browsing events in</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold border-b-2 border-transparent hover:border-indigo-100 transition-all py-1">
            <span className="truncate max-w-[200px]">{location || "Choose a location"}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start" sideOffset={8}>
            <div className="p-3">
                <form onSubmit={handleInputSubmit} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Enter a city or zip code" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                        autoFocus
                    />
                </form>
            </div>
            <Separator />
          <div className="p-1">
            <button 
                onClick={handleCurrentLocation}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-colors text-left group"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                 <Navigation className="h-4 w-4 text-indigo-600 fill-indigo-600" />
              </div>
              <span className="font-medium">Use my current location</span>
            </button>
            
            <button 
                onClick={handleOnline}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-colors text-left group"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                 <Video className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="font-medium">Browse online events</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}