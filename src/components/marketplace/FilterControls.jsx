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
  ],
  weddings: [
    { value: "all", label: "All Categories" },
    { value: "event_planner", label: "Event Planner" },
    { value: "bridal_fashion", label: "Fashion & Accessories" },
    { value: "beauty_personal_care", label: "Beauty & Personal Care" },
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
    { value: "event_grounds", label: "Event Venues" },
    { value: "beauty_personal_care", label: "Beauty & Personal Care" },
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
    { value: "bridal_fashion", label: "Fashion & Accessories" },
    { value: "wreaths", label: "Wreaths" },
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
  onMinYearsChange,
  layout = "horizontal"
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

  const vLabel = "block text-[9.5px] font-medium tracking-[0.15em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]";
  const vSubLabel = "text-[11px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] flex items-center gap-1.5";
  const vTrigger = "w-full h-10 text-[14px] rounded-none bg-cream dark:bg-[#211B16] border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] shadow-none focus:ring-1 focus:ring-[#A97E2E]";

  if (layout === "vertical") {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <label className={vLabel}>Event Type</label>
          <Select value={eventType} onValueChange={handleEventChange}>
            <SelectTrigger className={vTrigger}>
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={vLabel}>Category</label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className={vTrigger}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={vLabel}>Price Range</label>
          <Select value={priceRange} onValueChange={onPriceChange}>
            <SelectTrigger className={vTrigger}>
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {PRICE_RANGES.map((price) => (
                <SelectItem key={price.value} value={price.value}>{price.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {onSortChange && (
          <div className="space-y-2">
            <label className={vLabel}>Sort By</label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className={vTrigger}>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] pt-5 mt-5 space-y-4">
          <p className={vLabel}>Advanced</p>

          {onLocationChange && (
            <div className="space-y-2">
              <label className={vSubLabel}>
                <MapPin className="h-3.5 w-3.5 text-gold-text dark:text-gold-dark" /> Location
              </label>
              <Input placeholder="City or region..." value={location} onChange={(e) => onLocationChange(e.target.value)} className="rounded-none h-10 text-[14px] bg-cream dark:bg-[#211B16] border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] shadow-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]" />
            </div>
          )}

          {onAvailableDateChange && (
            <div className="space-y-2">
              <label className={vSubLabel}>
                <CalendarIcon className="h-3.5 w-3.5 text-gold-text dark:text-gold-dark" /> Available Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal rounded-none h-10 text-[14px] bg-cream dark:bg-[#211B16] border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] shadow-none hover:bg-cream dark:hover:bg-[#211B16]">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {availableDate ? format(availableDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none" align="start">
                  <Calendar mode="single" selected={availableDate} onSelect={onAvailableDateChange} disabled={(date) => date < new Date()} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {onMinRatingChange && (
            <div className="space-y-2">
              <label className={vSubLabel}>
                <Star className="h-3.5 w-3.5 text-gold-text dark:text-gold-dark" /> Min. Rating: {minRating > 0 ? `${minRating}+` : 'Any'}
              </label>
              <Slider value={[minRating]} onValueChange={(value) => onMinRatingChange(value[0])} max={5} step={0.5} />
            </div>
          )}

          {onMinYearsChange && (
            <div className="space-y-2">
              <label className={vSubLabel}>
                Min. Years: {minYears > 0 ? `${minYears}+` : 'Any'}
              </label>
              <Slider value={[minYears]} onValueChange={(value) => onMinYearsChange(value[0])} max={20} step={1} />
            </div>
          )}
        </div>

        {hasFilters && (
          <Button variant="outline" size="sm" className="w-full rounded-none gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase h-10 bg-transparent border-[#A97E2E] text-gold-text dark:text-gold-dark hover:bg-[rgba(169,126,46,0.08)]" onClick={handleClearAll}>
            <X className="h-3.5 w-3.5" /> Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Filters Row - horizontally scrollable on mobile */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 -mb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mb-0" style={{scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
        <Select value={eventType} onValueChange={handleEventChange}>
          <SelectTrigger className="w-[120px] sm:w-40 h-9 sm:h-10 text-xs sm:text-sm rounded-none shrink-0">
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
          <SelectTrigger className="w-[130px] sm:w-56 h-9 sm:h-10 text-xs sm:text-sm rounded-none shrink-0">
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
          <SelectTrigger className="w-[100px] sm:w-32 h-9 sm:h-10 text-xs sm:text-sm rounded-none shrink-0">
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
            <SelectTrigger className="w-[130px] sm:w-48 h-9 sm:h-10 text-xs sm:text-sm rounded-none shrink-0">
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
          className={`rounded-none gap-1.5 h-9 sm:h-10 text-xs sm:text-sm shrink-0 ${hasAdvancedFilters ? 'border-indigo-500 text-indigo-600' : ''}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Advanced</span>
          {hasAdvancedFilters && (
            <Badge variant="default" className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs">
              {[location, availableDate, minRating > 0, minYears > 0].filter(Boolean).length}
            </Badge>
          )}
        </Button>

        {hasFilters && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-slate-200 gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs shrink-0"
            onClick={handleClearAll}
          >
            Clear
            <X className="h-3 w-3" />
          </Badge>
        )}
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-none p-4 space-y-4 border border-slate-200 dark:border-slate-700">
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
                  className="rounded-none"
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
                      className="w-full justify-start text-left font-normal rounded-none"
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