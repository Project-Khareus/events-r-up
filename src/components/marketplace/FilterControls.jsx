import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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
    { value: "conference_facilities", label: "Conference Facilities" },
    { value: "catering", label: "Catering" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "rapporteur_services", label: "Rapporteur Services" },
    { value: "music_karaoke_mc", label: "Music / MC" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
  ],
  funeral: [
    { value: "all", label: "All Categories" },
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

export default function FilterControls({ 
  eventType, 
  category, 
  priceRange, 
  onEventChange, 
  onCategoryChange, 
  onPriceChange, 
  onClearFilters 
}) {
  const categories = CATEGORIES_BY_EVENT[eventType] || CATEGORIES_BY_EVENT.all;
  const hasFilters = eventType !== "all" || category !== "all" || priceRange !== "all";

  const handleEventChange = (value) => {
    onEventChange(value);
    onCategoryChange("all"); // Reset category when event changes
  };

  return (
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

      {hasFilters && (
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-slate-200 gap-1 px-3 py-1.5"
          onClick={onClearFilters}
        >
          Clear Filters
          <X className="h-3 w-3" />
        </Badge>
      )}
    </div>
  );
}