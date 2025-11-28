import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import SearchBar from "../components/marketplace/SearchBar";
import FilterControls from "../components/marketplace/FilterControls";
import VendorCard from "../components/marketplace/VendorCard";
import VendorCategorySection from "../components/marketplace/VendorCategorySection";
import PromoAdBanner from "../components/marketplace/PromoAdBanner";
import AdPlaceholderCard from "../components/marketplace/AdPlaceholderCard";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function VendorMarketplace() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventParam = urlParams.get("event") || "all";
  const categoryParam = urlParams.get("category") || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [eventType, setEventType] = useState(eventParam);
  const [category, setCategory] = useState(categoryParam);
  const [priceRange, setPriceRange] = useState("all");

  useEffect(() => {
    setEventType(eventParam);
    setCategory(categoryParam);
  }, [eventParam, categoryParam]);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date', 100),
  });

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch = !searchQuery || 
        vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesEvent = eventType === "all" || vendor.event_type === eventType;
      const matchesCategory = category === "all" || vendor.category === category;
      const matchesPrice = priceRange === "all" || vendor.price_range === priceRange;

      return matchesSearch && matchesEvent && matchesCategory && matchesPrice;
    });
  }, [vendors, searchQuery, eventType, category, priceRange]);

  const featuredVendors = useMemo(() => {
    return filteredVendors.filter(v => v.rating >= 4).slice(0, 4); // Display up to 4 featured
  }, [filteredVendors]);

  const regularVendors = useMemo(() => {
    const featuredIds = new Set(featuredVendors.map(v => v.id));
    return filteredVendors.filter(v => !featuredIds.has(v.id));
  }, [filteredVendors, featuredVendors]);

  // Pick a random vendor for promo (vendors with high ratings)
  const promoVendor = useMemo(() => {
    const eligibleVendors = vendors.filter(v => v.rating >= 4 && v.image_url);
    if (eligibleVendors.length === 0) return null;
    const randomIndex = Math.floor(Date.now() / 86400000) % eligibleVendors.length; // Changes daily
    return eligibleVendors[randomIndex];
  }, [vendors]);

  // Group vendors by event type then category for homepage display
  const isHomepage = eventType === "all" && category === "all" && !searchQuery;
  const vendorsByEventAndCategory = useMemo(() => {
    if (!isHomepage) return [];
    const eventOrder = ["weddings", "parties", "conference", "funeral"];
    const grouped = {};
    
    vendors.forEach((vendor) => {
      const key = `${vendor.event_type}_${vendor.category}`;
      if (!grouped[key]) {
        grouped[key] = {
          eventType: vendor.event_type,
          category: vendor.category,
          vendors: []
        };
      }
      grouped[key].vendors.push(vendor);
    });
    
    // Sort by event order, then by category
    return Object.values(grouped).sort((a, b) => {
      const eventA = eventOrder.indexOf(a.eventType);
      const eventB = eventOrder.indexOf(b.eventType);
      if (eventA !== eventB) return eventA - eventB;
      return (a.category || "").localeCompare(b.category || "");
    });
  }, [vendors, isHomepage]);

  const handleClearFilters = () => {
    setEventType("all");
    setCategory("all");
    setPriceRange("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-amber-400" />
              <span className="text-amber-400 font-medium tracking-wide">Omnievents, lasting memories</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Event Vendors
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Discover exceptional vendors for your special moments. Curated professionals ready to bring your vision to life.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="flex-1">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <Link to={createPageUrl("EventPlanning")}>
                <button className="h-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:scale-105 flex items-center gap-2 justify-center whitespace-nowrap">
                  <Wand2 className="h-5 w-5" />
                  Plan an Event
                </button>
              </Link>
            </div>
            <FilterControls
                eventType={eventType}
                category={category}
                priceRange={priceRange}
                onEventChange={setEventType}
                onCategoryChange={setCategory}
                onPriceChange={setPriceRange}
                onClearFilters={handleClearFilters}
              />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Results Count - only show when searching */}
        {searchQuery && (
          <div className="mb-8">
            <p className="text-slate-600">
              <span className="font-semibold text-slate-900">{filteredVendors.length}</span> vendors found
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Sparkles className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No vendors found</h3>
            <p className="text-slate-600">Try adjusting your filters or search terms</p>
          </div>
        ) : isHomepage ? (
          /* Homepage - Grouped by Category with Carousels */
          <div className="space-y-8">
            {/* Promo Ad Banner */}
            <div className="-mx-6 lg:mx-auto">
              <PromoAdBanner vendor={promoVendor} className="lg:max-w-7xl lg:mx-auto lg:rounded-2xl lg:mb-8" />
            </div>

            {/* Category Sections with Ad Placeholders */}
            {vendorsByEventAndCategory.slice(0, 2).map((group) => (
              <VendorCategorySection
                key={`${group.eventType}_${group.category}`}
                title={CATEGORY_LABELS[group.category] || group.category}
                eventType={group.eventType}
                category={group.category}
                vendors={group.vendors}
              />
            ))}

            {/* Ad Placeholder Row */}
            <div className="hidden md:grid md:grid-cols-4 gap-6">
              <AdPlaceholderCard />
              {vendors.slice(0, 3).map((vendor) => (
                <VendorCard key={`ad-row-${vendor.id}`} vendor={vendor} />
              ))}
            </div>

            {/* Remaining Category Sections */}
            {vendorsByEventAndCategory.slice(2, 5).map((group) => (
              <VendorCategorySection
                key={`${group.eventType}_${group.category}`}
                title={CATEGORY_LABELS[group.category] || group.category}
                eventType={group.eventType}
                category={group.category}
                vendors={group.vendors}
              />
            ))}

            {/* Another Ad Row */}
            {vendorsByEventAndCategory.length > 5 && (
              <div className="hidden md:grid md:grid-cols-4 gap-6">
                {vendors.slice(3, 6).map((vendor) => (
                  <VendorCard key={`ad-row2-${vendor.id}`} vendor={vendor} />
                ))}
                <AdPlaceholderCard />
              </div>
            )}

            {/* Rest of Categories */}
            {vendorsByEventAndCategory.slice(5).map((group) => (
              <VendorCategorySection
                key={`${group.eventType}_${group.category}`}
                title={CATEGORY_LABELS[group.category] || group.category}
                eventType={group.eventType}
                category={group.category}
                vendors={group.vendors}
              />
            ))}
          </div>
        ) : (
          /* Filtered View - Grid Layout */
          <div className="space-y-12">
            {/* Featured Vendors */}
            {featuredVendors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  <h2 className="text-2xl font-bold text-slate-900">Featured Vendors</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredVendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Vendors */}
            {regularVendors.length > 0 && (
              <div>
                {featuredVendors.length > 0 && (
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">All Vendors</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {regularVendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}