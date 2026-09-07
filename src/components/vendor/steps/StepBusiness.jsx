import React from "react";
import { Input } from "@/components/ui/input";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import { AlertCircle, Check, ArrowRight } from "lucide-react";
import { PANEL, H2, SUB, LABEL, INPUT, BTN_PRIMARY, CHIP, CHIP_ON } from "./wizardStyles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "weddings", label: "Weddings" },
  { value: "parties", label: "Parties" },
  { value: "conference", label: "Conference" },
  { value: "funeral", label: "Funeral" },
];

const CATEGORIES_BY_EVENT = {
  weddings: [
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
    { value: "dance_tutorials", label: "Dance Tutorials" },
    { value: "rent_a_team", label: "Rent-a-Team" },
  ],
  parties: [
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
    { value: "event_planner", label: "Event Planner" },
    { value: "conference_facilities", label: "Conference Facilities" },
    { value: "catering", label: "Catering" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "rapporteur_services", label: "Rapporteur Services" },
    { value: "music_karaoke_mc", label: "Music / MC" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
  ],
  funeral: [
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

export { EVENT_TYPES, CATEGORIES_BY_EVENT };

export default function StepBusiness({ formData, setFormData, onNext, initialData }) {
  const toggleEventType = (value) => {
    setFormData((prev) => {
      const newTypes = prev.event_type.includes(value)
        ? prev.event_type.filter((t) => t !== value)
        : [...prev.event_type, value];
      return { ...prev, event_type: newTypes };
    });
  };

  const toggleCategory = (value) => {
    setFormData((prev) => {
      const newCats = prev.category.includes(value)
        ? prev.category.filter((c) => c !== value)
        : [...prev.category, value];
      return { ...prev, category: newCats };
    });
  };

  const availableCategories = formData.event_type.reduce((acc, type) => {
    const cats = CATEGORIES_BY_EVENT[type] || [];
    cats.forEach((c) => {
      if (!acc.some((existing) => existing.value === c.value)) acc.push(c);
    });
    return acc;
  }, []);

  const handleNext = () => {
    if (!formData.business_name || formData.event_type.length === 0 || formData.category.length === 0) {
      toast.error("Please fill in Business Name, at least one Event Type, and at least one Category.");
      return;
    }
    onNext();
  };

  return (
    <div className={PANEL}>
      <h2 className={H2}>Tell us about your business</h2>
      <p className={SUB}>Start with the basics — your name and what you do.</p>

      <div className="mt-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className={LABEL}>Business name *</p>
            <Input
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Your business name"
              className={INPUT}
            />
            {initialData?.id && initialData?.business_name && (
              <p className="text-[12px] font-light text-gold-text dark:text-gold-dark mt-1.5 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" /> Name changes require admin approval
              </p>
            )}
          </div>
          <div>
            <p className={LABEL}>Slogan / tagline</p>
            <Input
              value={formData.slogan}
              onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
              placeholder="Your catchy tagline"
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <p className={LABEL}>Location</p>
          <LocationAutocomplete
            value={formData.location}
            onChange={(location) => setFormData({ ...formData, location })}
            placeholder="e.g., Osu, Accra, Ghana"
            className="mt-2"
          />
        </div>

        <div>
          <p className={`${LABEL} mb-3`}>Event types * (select all that apply)</p>
          <div className="flex flex-wrap gap-2.5">
            {EVENT_TYPES.map((type) => {
              const isSelected = formData.event_type.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleEventType(type.value)}
                  className={isSelected ? CHIP_ON : CHIP}
                >
                  {type.label}
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {formData.event_type.length > 0 && (
          <div>
            <p className={`${LABEL} mb-3`}>Categories * (select all that apply)</p>
            {availableCategories.length === 0 ? (
              <p className={SUB}>No specific categories found.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {availableCategories.map((cat) => {
                  const isSelected = formData.category.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={isSelected ? CHIP_ON : CHIP}
                    >
                      {cat.label}
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <button type="button" onClick={handleNext} className={BTN_PRIMARY}>
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}