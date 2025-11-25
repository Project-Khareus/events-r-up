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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Which vendors do you need?
        </h2>
        <p className="text-slate-600">
          Select the vendor types your ${parseInt(budget).toLocaleString()} budget should cover
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={selectAll}
          className="rounded-xl"
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearAll}
          className="rounded-xl"
        >
          Clear All
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {availableCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          return (
            <Card
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50 border-2"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {category.label}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {category.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 ml-2">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
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
          onClick={onNext}
          disabled={selectedCategories.length === 0}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          Find Vendors ({selectedCategories.length} selected)
        </Button>
      </div>
    </div>
  );
}