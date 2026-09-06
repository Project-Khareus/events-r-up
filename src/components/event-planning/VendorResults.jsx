import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import VendorCard from "../marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";
import StepHeading from "./StepHeading";
import { outlineBtn } from "./StepNav";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseLocation(locationStr) {
  const locationMap = {
    "San Francisco": { lat: 37.7749, lng: -122.4194 },
    "Oakland": { lat: 37.8044, lng: -122.2712 },
    "San Jose": { lat: 37.3382, lng: -121.8863 },
    "Berkeley": { lat: 37.8716, lng: -122.2727 },
    "Napa": { lat: 38.2975, lng: -122.2869 },
    "Los Angeles": { lat: 34.0522, lng: -118.2437 },
    "New York": { lat: 40.7128, lng: -74.0060 },
  };
  
  for (const [city, coords] of Object.entries(locationMap)) {
    if (locationStr?.includes(city)) {
      return coords;
    }
  }
  
  return null;
}

export default function VendorResults({ eventType, location, budget, selectedCategories, onBack }) {
  const [prioritize, setPrioritize] = useState("budget");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const filteredAndSortedVendors = useMemo(() => {
    const relevantCategories = selectedCategories || [];
    const budgetValue = parseFloat(budget);
    
    let filtered = vendors.filter(vendor => {
      // Filter by event type
      if (vendor.event_type !== eventType) return false;
      
      // Filter by category
      if (!relevantCategories.includes(vendor.category)) return false;
      
      // Filter by budget using starting_price
      if (vendor.starting_price && vendor.starting_price > budgetValue) {
        return false;
      }
      
      // Filter by location radius
      if (location?.lat && location?.lng) {
        const vendorCoords = parseLocation(vendor.location);
        if (vendorCoords) {
          const distance = calculateDistance(
            location.lat, location.lng,
            vendorCoords.lat, vendorCoords.lng
          );
          if (distance > (location.radius || 50)) return false;
        }
      }
      
      return true;
    });

    // Add distance to each vendor
    filtered = filtered.map(vendor => {
      const vendorCoords = parseLocation(vendor.location);
      const distance = vendorCoords && location?.lat && location?.lng
        ? calculateDistance(location.lat, location.lng, vendorCoords.lat, vendorCoords.lng)
        : 999;
      return { ...vendor, distance };
    });

    // Sort by priority
    if (prioritize === "proximity") {
      filtered.sort((a, b) => a.distance - b.distance);
    } else {
      // Sort by starting price (budget-friendly first)
      filtered.sort((a, b) => {
        const priceA = a.starting_price || 0;
        const priceB = b.starting_price || 0;
        return priceA - priceB;
      });
    }

    return filtered;
  }, [vendors, eventType, selectedCategories, location, budget, prioritize]);

  // Group vendors by category for better display
  const vendorsByCategory = useMemo(() => {
    const grouped = {};
    filteredAndSortedVendors.forEach(vendor => {
      if (!grouped[vendor.category]) {
        grouped[vendor.category] = [];
      }
      grouped[vendor.category].push(vendor);
    });
    return grouped;
  }, [filteredAndSortedVendors]);

  const categoryLabels = {
    bridal_fashion: "Bridal Fashion & Accessories",
    makeup_artistes: "Make-Up Artistes",
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
    fashion_wreaths: "Fashion / Wreaths",
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
                      {vendor.distance < 999 && (
                        <span className="px-2 py-1 bg-ink text-cream text-[10px] font-medium tracking-[0.12em] uppercase">
                          {vendor.distance.toFixed(1)} mi
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