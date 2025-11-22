import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "venue", label: "Venues" },
  { value: "catering", label: "Catering" },
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "dj_music", label: "DJ & Music" },
  { value: "florist", label: "Florist" },
  { value: "decorator", label: "Decorator" },
  { value: "planning", label: "Event Planning" },
  { value: "lighting", label: "Lighting" },
  { value: "entertainment", label: "Entertainment" },
  { value: "transportation", label: "Transportation" },
  { value: "rentals", label: "Rentals" },
  { value: "bakery", label: "Bakery & Desserts" }
];

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" }
];

export default function FilterControls({ category, priceRange, onCategoryChange, onPriceChange, onClearFilters }) {
  const hasActiveFilters = category !== "all" || priceRange !== "all";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-48 h-11 rounded-xl border-slate-200 bg-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priceRange} onValueChange={onPriceChange}>
        <SelectTrigger className="w-48 h-11 rounded-xl border-slate-200 bg-white">
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent>
          {PRICE_RANGES.map((price) => (
            <SelectItem key={price.value} value={price.value}>
              {price.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Badge
          variant="secondary"
          className="h-11 px-4 text-sm cursor-pointer hover:bg-slate-200 transition-colors rounded-xl bg-slate-100 text-slate-700"
          onClick={onClearFilters}
        >
          Clear Filters
          <X className="ml-2 h-4 w-4" />
        </Badge>
      )}
    </div>
  );
}