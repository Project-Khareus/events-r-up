import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { X, SlidersHorizontal, Calendar as CalendarIcon, MapPin, Star } from "lucide-react";
import { format } from "date-fns";

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "weddings", label: "Weddings" },
  { value: "parties", label: "Parties" },
  { value: "conference", label: "Conference" },
  { value: "funeral", label: "Funeral" },
];

const CATEGORIES_BY_EVENT = {
  all: [
    { value: "all", label: "All Categories" },
    { value: "event_planner", label: "Event Planner" },
  ],
  weddings: [
    { value: "all", label: "All Categories" },
    { value: "event_planner", label: "Event Planner" },
    { value: "bridal_fashion", label: "Bridal Fashion & Accessories" },
    { value: "makeup_artistes", label: "Make-Up Artistes" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
    { value: "event_grounds", label: "Event Grounds" },
    { value: "photography_videography", label: "Photography & Videography" },
    { value: "design_creatives", label: "Design & Creatives" },
    { value: "catering", label: "Catering" },
    { value: "jewellery", label: "Jewellery" },
    { value: "honeymoon_packages", label: "Honeymoon / Destination Packages" },
    { value: "music_karaoke_mc", label: "Music / Karaoke / MCs" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "social_media_support", label: "Social Media Support" },
    { value: "ushers", label: "Ushers" },
    { value: "dance_tutorials", label: "Couple's First Dance Tutorials" },
    { value: "rent_a_team", label: "Rent-a-Team" },
  ],
  parties: [
    { value: "all", label: "All Categories" },
    { value: "event_planner", label: "Event Planner" },
    { value: "event_grounds", label: "Event Grounds" },
    { value: "makeup_artistes", label: "Make-Up Artistes" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
    { value: "photography_videography", label: "Photography & Videography" },
    { value: "design_creatives", label: "Design & Creatives" },
    { value: "catering", label: "Catering" },
    { value: "jewellery", label: "Jewellery" },
    { value: "music_karaoke_mc", label: "Music / Karaoke" },
    { value: "car_rentals", label: "Car Rentals" },
  ],
  conference: [
    { value: "all", label: "All Categories" },
    { value: "event_planner", label: "Event Planner" },
    { value: "conference_facilities", label: "Conference Facilities" },
    { value: "catering", label: "Catering" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "rapporteur_services", label: "Rapporteur Services" },
    { value: "music_karaoke_mc", label: "Music / MC" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
  ],
  funeral: [
    { value: "all", label: "All Categories" },
    { value: "event_planner", label: "Event Planner" },
    { value: "caskets", label: "Caskets" },
    { value: "catering_drinks", label: "Catering & Drinks" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
    { value: "fashion_wreaths", label: "Fashion / Wreaths" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "others", label: "Others" },
  ],
};

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "$", label: "$" },
  { value: "$$", label: "$$" },
  { value: "$$$", label: "$$$" },
  { value: "$$$$", label: "$$$$" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

export default function FilterControls({ 
  eventType, 
  category, 
  priceRange, 
  onEventChange, 
  onCategoryChange, 
  onPriceChange, 
  onClearFilters,
  // Advanced filters
  sortBy = "relevance",
  onSortChange,
  location = "",
  onLocationChange,
  availableDate,
  onAvailableDateChange,
  minRating = 0,
  onMinRatingChange,
  minYears = 0,
  onMinYearsChange
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const categories = CATEGORIES_BY_EVENT[eventType] || CATEGORIES_BY_EVENT.all;
  
  const hasBasicFilters = eventType !== "all" || category !== "all" || priceRange !== "all";
  const hasAdvancedFilters = location || availableDate || minRating > 0 || minYears > 0;
  const hasFilters = hasBasicFilters || hasAdvancedFilters;

  const handleEventChange = (value) => {
    onEventChange(value);
    onCategoryChange("all"); // Reset category when event changes
  };

  const handleClearAll = () => {
    onClearFilters();
    if (onLocationChange) onLocationChange("");
    if (onAvailableDateChange) onAvailableDateChange(undefined);
    if (onMinRatingChange) onMinRatingChange(0);
    if (onMinYearsChange) onMinYearsChange(0);
    if (onSortChange) onSortChange("relevance");
  };

  return (
    <div className="space-y-3">
      {/* Main Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={eventType} onValueChange={handleEventChange}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-56 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={onPriceChange}>
          <SelectTrigger className="w-32 rounded-xl">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((price) => (
              <SelectItem key={price.value} value={price.value}>
                {price.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onSortChange && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`rounded-xl gap-2 ${hasAdvancedFilters ? 'border-indigo-500 text-indigo-600' : ''}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced
          {hasAdvancedFilters && (
            <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {[location, availableDate, minRating > 0, minYears > 0].filter(Boolean).length}
            </Badge>
          )}
        </Button>

        {hasFilters && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-slate-200 gap-1 px-3 py-1.5"
            onClick={handleClearAll}
          >
            Clear All
            <X className="h-3 w-3" />
          </Badge>
        )}
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            {onLocationChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Input
                  placeholder="City or region..."
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {/* Available Date Filter */}
            {onAvailableDateChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Available Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-xl"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {availableDate ? format(availableDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
            )}

            {/* Minimum Rating Filter */}
            {onMinRatingChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Min. Rating: {minRating > 0 ? `${minRating}+` : 'Any'}
                </label>
                <Slider
                  value={[minRating]}
                  onValueChange={(value) => onMinRatingChange(value[0])}
                  max={5}
                  step={0.5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Any</span>
                  <span>5★</span>
                </div>
              </div>
            )}

            {/* Years in Business Filter */}
            {onMinYearsChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Min. Years: {minYears > 0 ? `${minYears}+` : 'Any'}
                </label>
                <Slider
                  value={[minYears]}
                  onValueChange={(value) => onMinYearsChange(value[0])}
                  max={20}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Any</span>
                  <span>20+ years</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}