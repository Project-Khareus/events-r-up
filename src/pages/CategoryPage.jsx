import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import SearchBar from "../components/marketplace/SearchBar";
import VendorCard from "../components/marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_LABELS = {
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
  dance_tutorials: "Couple's First Dance Tutorials",
  rent_a_team: "Rent-a-Team",
  conference_facilities: "Conference Facilities",
  rapporteur_services: "Rapporteur Services",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion / Wreaths",
  others: "Others"
};

const EVENT_LABELS = {
  weddings: "Weddings",
  parties: "Parties",
  conference: "Conference",
  funeral: "Funeral"
};

export default function CategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "";
  const eventType = urlParams.get("event") || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("all");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', category],
    queryFn: () => base44.entities.Vendor.filter({ category }),
  });

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch = !searchQuery || 
        vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEvent = eventType === "all" || vendor.event_type === eventType;
      const matchesPrice = priceRange === "all" || vendor.price_range === priceRange;

      return matchesSearch && matchesEvent && matchesPrice;
    });
  }, [vendors, searchQuery, eventType, priceRange]);

  const categoryTitle = CATEGORY_LABELS[category] || category;
  const eventTitle = EVENT_LABELS[eventType] || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <Link 
            to={createPageUrl("VendorMarketplace")}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {categoryTitle}
          </h1>
          {eventTitle && (
            <p className="text-lg text-slate-300">
              For {eventTitle}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="$">$ Budget</SelectItem>
              <SelectItem value="$$">$$ Moderate</SelectItem>
              <SelectItem value="$$$">$$$ Premium</SelectItem>
              <SelectItem value="$$$$">$$$$ Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-slate-600 mb-6">
          <span className="font-semibold text-slate-900">{filteredVendors.length}</span> vendors found
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-4">
              <Sparkles className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No vendors found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}