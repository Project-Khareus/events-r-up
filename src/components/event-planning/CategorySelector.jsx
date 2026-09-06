import React from "react";
import { Check } from "lucide-react";
import StepHeading from "./StepHeading";
import StepNav, { outlineBtn } from "./StepNav";

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
    <div>
      <StepHeading
        title="Which vendors do you need?"
        subtitle={`Select services your GH₵ ${parseInt(budget || 0).toLocaleString()} budget should cover`}
      />

      <div className="flex justify-center gap-3 mb-6">
        <button type="button" onClick={selectAll} className={`${outlineBtn} min-h-[40px] px-5`}>
          Select All
        </button>
        <button type="button" onClick={clearAll} className={`${outlineBtn} min-h-[40px] px-5`}>
          Clear All
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {availableCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          return (
            <button
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={`relative p-4 min-h-[48px] text-left rounded-none border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E] ${
                isSelected
                  ? "border-[#A97E2E] bg-[rgba(169,126,46,0.08)]"
                  : "border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] hover:border-[#A97E2E]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[16px] leading-snug text-ink dark:text-[#F1E8E0]">
                    {category.label}
                  </h3>
                  <p className="mt-0.5 text-[12px] font-light leading-relaxed text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
                    {category.description}
                  </p>
                </div>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected
                    ? "bg-gold"
                    : "border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.2)]"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-cream" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel={`View Results (${selectedCategories.length})`}
        nextDisabled={selectedCategories.length === 0}
      />
    </div>
  );
}