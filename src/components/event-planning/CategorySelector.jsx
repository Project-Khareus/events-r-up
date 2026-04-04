import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Check } from "lucide-react";

const EVENT_CATEGORY_MAP = {
  weddings: [
    { value: "bridal_fashion", label: "Bridal Fashion & Accessories", description: "Wedding dresses, veils, suits" },
    { value: "makeup_artistes", label: "Make-Up Artistes", description: "Bridal makeup & hair" },
    { value: "decor_logistics", label: "Décor & Logistics Setup", description: "Venue decoration & setup" },
    { value: "event_grounds", label: "Event Grounds", description: "Wedding venues" },
    { value: "photography_videography", label: "Photography & Videography", description: "Photos & video coverage" },
    { value: "design_creatives", label: "Design & Creatives", description: "Invitations & stationery" },
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "jewellery", label: "Jewellery", description: "Rings & accessories" },
    { value: "honeymoon_packages", label: "Honeymoon / Destination Packages", description: "Travel & honeymoon" },
    { value: "music_karaoke_mc", label: "Music / Karaoke / MCs", description: "DJ, band, MC services" },
    { value: "car_rentals", label: "Car Rentals", description: "Wedding transportation" },
    { value: "social_media_support", label: "Social Media Support", description: "Live coverage & content" },
    { value: "ushers", label: "Ushers", description: "Guest management" },
    { value: "dance_tutorials", label: "Couple's First Dance Tutorials", description: "Dance lessons" },
    { value: "rent_a_team", label: "Rent-a-Team", description: "Bridal train, groomsmen" },
  ],
  parties: [
    { value: "event_grounds", label: "Event Grounds", description: "Party venues" },
    { value: "makeup_artistes", label: "Make-Up Artistes", description: "Party makeup & styling" },
    { value: "decor_logistics", label: "Décor & Logistics Setup", description: "Party decorations" },
    { value: "photography_videography", label: "Photography & Videography", description: "Event coverage" },
    { value: "design_creatives", label: "Design & Creatives", description: "Invitations & graphics" },
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "jewellery", label: "Jewellery", description: "Accessories" },
    { value: "music_karaoke_mc", label: "Music / Karaoke", description: "DJ & entertainment" },
    { value: "car_rentals", label: "Car Rentals", description: "Transportation" },
  ],
  conference: [
    { value: "conference_facilities", label: "Conference Facilities", description: "Meeting rooms & venues" },
    { value: "catering", label: "Catering", description: "Corporate catering" },
    { value: "car_rentals", label: "Car Rentals", description: "Executive transport" },
    { value: "rapporteur_services", label: "Rapporteur Services", description: "Note-taking & documentation" },
    { value: "music_karaoke_mc", label: "Music / MC", description: "Speakers & entertainment" },
    { value: "decor_logistics", label: "Décor & Logistics Setup", description: "Event branding & setup" },
  ],
  funeral: [
    { value: "caskets", label: "Caskets", description: "Burial caskets" },
    { value: "catering_drinks", label: "Catering & Drinks", description: "Reception catering" },
    { value: "decor_logistics", label: "Décor & Logistics Setup", description: "Memorial decorations" },
    { value: "fashion_wreaths", label: "Fashion / Wreaths", description: "Attire & floral tributes" },
    { value: "car_rentals", label: "Car Rentals", description: "Funeral transportation" },
    { value: "others", label: "Others", description: "Additional services" },
  ],
};

export default function CategorySelector({ eventType, budget, selectedCategories, onChange, onNext, onBack }) {
  const availableCategories = EVENT_CATEGORY_MAP[eventType] || [];

  const toggleCategory = (categoryValue) => {
    if (selectedCategories.includes(categoryValue)) {
      onChange(selectedCategories.filter(c => c !== categoryValue));
    } else {
      onChange([...selectedCategories, categoryValue]);
    }
  };

  const selectAll = () => {
    onChange(availableCategories.map(c => c.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Which vendors do you need?
        </h2>
        <p className="text-slate-500">
          Select services your GH₵ {parseInt(budget).toLocaleString()} budget should cover
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={selectAll}
          className="rounded-xl text-sm h-9 border-slate-300"
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearAll}
          className="rounded-xl text-sm h-9 border-slate-300"
        >
          Clear All
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {availableCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          return (
            <button
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={`relative p-4 rounded-xl text-left transition-all duration-200 border-2 group ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm mb-0.5 ${
                    isSelected ? "text-indigo-700" : "text-slate-800"
                  }`}>
                    {category.label}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {category.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "bg-indigo-600"
                    : "border-2 border-slate-300 group-hover:border-slate-400"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
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
          onClick={onNext}
          disabled={selectedCategories.length === 0}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:shadow-none"
        >
          View Results ({selectedCategories.length} selected)
        </Button>
      </div>
    </div>
  );
}