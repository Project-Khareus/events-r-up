import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import VendorCard from "../marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocationCity } from "@/components/utils/formatLocation";
import StepHeading from "./StepHeading";
import { outlineBtn } from "./StepNav";

export default function VendorResults({ eventType, location, budget, selectedCategories, onBack }) {
  const [prioritize, setPrioritize] = useState("budget");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const filteredAndSortedVendors = useMemo(() => {
    const relevantCategories = selectedCategories || [];
    const budgetValue = parseFloat(budget);
    const selectedCity = getLocationCity(location?.name || location?.formatted_address);

    const filtered = vendors
      .filter(Boolean)
      .map((vendor) => (vendor.data ? { id: vendor.id, ...vendor.data } : vendor))
      .filter((vendor) => vendor?.id && vendor.status === "approved")
      .map((vendor) => ({ ...vendor, city: getLocationCity(vendor.location) }))
      .filter((vendor) => {
        const vendorEvents = Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type].filter(Boolean);
        const vendorCategories = Array.isArray(vendor.category) ? vendor.category : [vendor.category].filter(Boolean);

        if (eventType && !vendorEvents.includes(eventType)) return false;
        if (!relevantCategories.length || !vendorCategories.some((category) => relevantCategories.includes(category))) return false;
        if (vendor.starting_price && vendor.starting_price > budgetValue) return false;
        if (selectedCity && vendor.city !== selectedCity) return false;
        return true;
      });

    return filtered.sort((a, b) => {
      if (prioritize === "proximity") return a.city.localeCompare(b.city);
      return (a.starting_price || 0) - (b.starting_price || 0);
    });
  }, [vendors, eventType, selectedCategories, location, budget, prioritize]);

  // Group vendors by category for better display
  const vendorsByCategory = useMemo(() => {
    const relevant = selectedCategories || [];
    const grouped = {};
    filteredAndSortedVendors.forEach(vendor => {
      const cats = vendor.category ? (Array.isArray(vendor.category) ? vendor.category : [vendor.category]) : [];
      const matching = cats.filter((category) => relevant.includes(category));
      matching.forEach((c) => {
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(vendor);
      });
    });
    return grouped;
  }, [filteredAndSortedVendors, selectedCategories]);

  const categoryLabels = {
    event_planner: "Event Planner",
    bridal_fashion: "Bridal Fashion & Accessories",
    beauty_personal_care: "Make-Up Artists",
    decor_logistics: "Décor & Logistics Setup",
    event_grounds: "Event Grounds",
    photography_videography: "Photography & Videography",
    design_creatives: "Design & Creatives",
    catering: "Catering",
    jewellery: "Jewellery",
    honeymoon_packages: "Honeymoon / Destination Packages",
    music_karaoke_mc: "Music / Karaoke / MCs",
    car_rentals: "Car Rentals",
    social_media_support: "Social Media Support",
    ushers: "Ushers",
    dance_tutorials: "Dance Tutorials",
    rent_a_team: "Rent-a-Team",
    conference_facilities: "Conference Facilities",
    rapporteur_services: "Rapporteur Services",
    caskets: "Caskets",
    catering_drinks: "Catering & Drinks",
    wreaths: "Wreaths",
    others: "Other Services",
  };

  return (
    <div>
      <StepHeading
        title="Vendors matched to your plan"
        subtitle={`Found ${filteredAndSortedVendors.length} vendors within your GH₵ ${parseInt(budget || 0).toLocaleString()} budget`}
      />

      {/* Priority Toggle */}
      <div className="flex flex-wrap items-center justify-center gap-3 py-4 border-y border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
        <SlidersHorizontal className="h-4 w-4 text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]" />
        <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">Prioritize</span>
        {[
          { key: "budget", label: "Budget" },
          { key: "proximity", label: "Proximity" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPrioritize(option.key)}
            className={`min-h-[40px] px-5 rounded-none border text-[11px] font-medium tracking-[0.1em] uppercase transition-colors ${
              prioritize === option.key
                ? "border-[#A97E2E] bg-[rgba(169,126,46,0.08)] text-gold-text dark:text-gold-dark"
                : "border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] hover:border-[#A97E2E]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-none" />
          ))}
        </div>
      ) : filteredAndSortedVendors.length === 0 ? (
        <div className="text-center py-14">
          <p className="font-serif text-[22px] text-ink dark:text-[#F1E8E0]">
            No vendors match these criteria yet
          </p>
          <p className="mt-2 text-[13.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            Try raising your budget or widening your location radius.
          </p>
        </div>
      ) : (
        <div className="space-y-10 mt-8">
          {Object.entries(vendorsByCategory).map(([category, categoryVendors]) => (
            <div key={category}>
              <h3 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0] pb-3 mb-5 border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
                {categoryLabels[category] || category}
                <span className="ml-2 text-[10px] font-sans font-medium tracking-[0.14em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
                  {categoryVendors.length} options
                </span>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryVendors.map((vendor) => (
                  <div key={vendor.id} className="relative">
                    <VendorCard vendor={vendor} />
                    <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
                      {vendor.starting_price && (
                        <span className="px-2 py-1 bg-gold text-cream text-[10px] font-medium tracking-[0.12em] uppercase">
                          From GH₵ {vendor.starting_price.toLocaleString()}
                        </span>
                      )}
                      {vendor.city && (
                        <span className="px-2 py-1 bg-ink text-cream text-[10px] font-medium tracking-[0.12em] uppercase">
                          {vendor.city}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-10">
        <button type="button" onClick={onBack} className={`${outlineBtn} inline-flex items-center gap-1.5`}>
          <ChevronLeft className="h-4 w-4" />
          Adjust Criteria
        </button>
      </div>
    </div>
  );
}