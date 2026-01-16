import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import VendorCard from "../marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Perfect Vendors for Your Event</h2>
        <p className="text-slate-600">
          Found {filteredAndSortedVendors.length} vendors within your ${parseInt(budget).toLocaleString()} budget
        </p>
      </div>

      {/* Priority Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-xl">
        <SlidersHorizontal className="h-5 w-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Prioritize:</span>
        <div className="flex gap-2">
          <Button
            variant={prioritize === "budget" ? "default" : "outline"}
            onClick={() => setPrioritize("budget")}
            className="rounded-xl"
          >
            Budget
          </Button>
          <Button
            variant={prioritize === "proximity" ? "default" : "outline"}
            onClick={() => setPrioritize("proximity")}
            className="rounded-xl"
          >
            Proximity
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : filteredAndSortedVendors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-slate-600 mb-4">
            No vendors found matching your criteria
          </p>
          <p className="text-sm text-slate-500">
            Try increasing your budget or expanding your location radius
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(vendorsByCategory).map(([category, categoryVendors]) => (
            <div key={category}>
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">
                {categoryLabels[category] || category}
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({categoryVendors.length} options)
                </span>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryVendors.map((vendor) => (
                  <div key={vendor.id} className="relative">
                    <VendorCard vendor={vendor} />
                    <div className="absolute top-4 right-4 flex flex-col gap-1">
                      {vendor.starting_price && (
                        <Badge className="bg-green-600">
                          From ${vendor.starting_price.toLocaleString()}
                        </Badge>
                      )}
                      {vendor.distance < 999 && (
                        <Badge className="bg-indigo-600">
                          {vendor.distance.toFixed(1)} mi
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-8 h-12 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Adjust Criteria
        </Button>
      </div>
    </div>
  );
}