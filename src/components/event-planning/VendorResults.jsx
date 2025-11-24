import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import VendorCard from "../marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_CATEGORY_MAP = {
  birthday: ["catering", "bakery", "dj_music", "entertainment", "decorator", "photography", "videography"],
  anniversary: ["venue", "catering", "florist", "photography", "videography", "dj_music"],
  wedding: ["venue", "catering", "florist", "decorator", "photography", "videography", "dj_music", "planning", "lighting", "transportation", "bakery"],
  funeral: ["florist", "catering", "venue"],
  graduation: ["venue", "catering", "photography", "videography", "decorator", "bakery"],
  other: ["venue", "catering", "photography", "videography", "dj_music", "florist", "decorator", "planning", "lighting", "entertainment", "transportation", "rentals", "bakery"]
};

const PRICE_VALUES = {
  "$": 1,
  "$$": 2,
  "$$$": 3,
  "$$$$": 4
};

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
  // Simple geocoding fallback - you'd use a real geocoding service in production
  const locationMap = {
    "San Francisco": { lat: 37.7749, lng: -122.4194 },
    "Los Angeles": { lat: 34.0522, lng: -118.2437 },
    "New York": { lat: 40.7128, lng: -74.0060 },
    "Chicago": { lat: 41.8781, lng: -87.6298 },
    "Miami": { lat: 25.7617, lng: -80.1918 }
  };
  
  for (const [city, coords] of Object.entries(locationMap)) {
    if (locationStr?.includes(city)) {
      return coords;
    }
  }
  
  return null;
}

export default function VendorResults({ eventType, location, budget, onBack }) {
  const [prioritize, setPrioritize] = useState("budget");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const filteredAndSortedVendors = useMemo(() => {
    const relevantCategories = EVENT_CATEGORY_MAP[eventType] || [];
    const budgetValue = parseFloat(budget);
    
    let filtered = vendors.filter(vendor => {
      // Filter by category
      if (!relevantCategories.includes(vendor.category)) return false;
      
      // Filter by budget (allow vendors within budget or slightly above)
      if (vendor.price_range) {
        const priceValue = PRICE_VALUES[vendor.price_range];
        const budgetTier = budgetValue < 5000 ? 1 : 
                          budgetValue < 15000 ? 2 : 
                          budgetValue < 35000 ? 3 : 4;
        if (priceValue > budgetTier + 1) return false;
      }
      
      // Filter by location radius
      const vendorCoords = parseLocation(vendor.location);
      if (vendorCoords) {
        const distance = calculateDistance(
          location.lat, location.lng,
          vendorCoords.lat, vendorCoords.lng
        );
        if (distance > location.radius) return false;
      }
      
      return true;
    });

    // Add distance to each vendor
    filtered = filtered.map(vendor => {
      const vendorCoords = parseLocation(vendor.location);
      const distance = vendorCoords 
        ? calculateDistance(location.lat, location.lng, vendorCoords.lat, vendorCoords.lng)
        : 999;
      return { ...vendor, distance };
    });

    // Sort by priority
    if (prioritize === "proximity") {
      filtered.sort((a, b) => a.distance - b.distance);
    } else {
      // Sort by budget compatibility
      filtered.sort((a, b) => {
        const priceA = PRICE_VALUES[a.price_range] || 2;
        const priceB = PRICE_VALUES[b.price_range] || 2;
        return priceA - priceB;
      });
    }

    return filtered;
  }, [vendors, eventType, location, budget, prioritize]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Perfect Vendors for Your Event</h2>
        <p className="text-slate-600">
          Found {filteredAndSortedVendors.length} vendors matching your criteria
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
            Try adjusting your budget or location radius
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedVendors.map((vendor) => (
            <div key={vendor.id} className="relative">
              <VendorCard vendor={vendor} />
              {vendor.distance < 999 && (
                <Badge className="absolute top-4 right-4 bg-indigo-600">
                  {vendor.distance.toFixed(1)} mi away
                </Badge>
              )}
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