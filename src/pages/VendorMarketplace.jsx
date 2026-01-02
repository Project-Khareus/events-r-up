import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Wand2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import SearchBar from "../components/marketplace/SearchBar";
import FilterControls from "../components/marketplace/FilterControls";
import VendorCard from "../components/marketplace/VendorCard";
import VendorCategorySection from "../components/marketplace/VendorCategorySection";
import PromoAdBanner from "../components/marketplace/PromoAdBanner";
import SideAdPlaceholder from "../components/marketplace/SideAdPlaceholder";
import HorizontalAdPlaceholder from "../components/marketplace/HorizontalAdPlaceholder";
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
  const [vendorPage, setVendorPage] = useState(1);
  const vendorsPerPage = 32;

  useEffect(() => {
    setEventType(eventParam);
    setCategory(categoryParam);
  }, [eventParam, categoryParam]);

  const { data: rawVendors = [], isLoading, isFetching } = useQuery({
    queryKey: ['vendors', vendorPage],
    queryFn: () => base44.entities.Vendor.list('-created_date', vendorsPerPage * vendorPage),
    staleTime: 600000, // 10 minutes
    cacheTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    keepPreviousData: true,
  });

  // Batch fetch reviews with pagination
  const { data: allReviews = [] } = useQuery({
    queryKey: ['all_reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 500),
    staleTime: 600000, // 10 minutes
    cacheTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  
  // Normalize vendor data - handle both flat and nested data structures
  const vendors = useMemo(() => {
    return rawVendors
      .map(v => v.data ? { id: v.id, ...v.data } : v)
      .filter(v => !v.status || v.status === 'approved');
  }, [rawVendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch = !searchQuery || 
        vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const vendorEvents = vendor.event_type ? (Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type]) : [];
      const vendorCategories = vendor.category ? (Array.isArray(vendor.category) ? vendor.category : [vendor.category]) : [];

      const matchesEvent = eventType === "all" || vendorEvents.length === 0 || vendorEvents.includes(eventType);
      const matchesCategory = category === "all" || vendorCategories.length === 0 || vendorCategories.includes(category);
      const matchesPrice = priceRange === "all" || !vendor.price_range || vendor.price_range === priceRange;

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

  // Group vendors by event type for homepage display
  const isHomepage = eventType === "all" && category === "all" && !searchQuery;
  
  const EVENT_LABELS = {
    weddings: "Weddings",
    parties: "Parties",
    conference: "Conference",
    funeral: "Funeral"
  };
  
  const vendorsByEvent = useMemo(() => {
    if (!isHomepage) return [];
    const eventOrder = ["weddings", "parties"];
    const grouped = {};

    // Initialize groups
    eventOrder.forEach(e => {
        grouped[e] = { eventType: e, vendors: [] };
    });

    vendors.forEach((vendor) => {
      const vendorEvents = vendor.event_type ? (Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type]) : [];
      if (vendorEvents.length === 0) return; // Skip vendors without event type
      vendorEvents.forEach(eventType => {
          if (grouped[eventType]) {
              grouped[eventType].vendors.push(vendor);
          }
      });
    });

    // Return all groups that have vendors
    return Object.values(grouped)
      .filter(group => group.vendors.length > 0);
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
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-slate-400" />
              <span className="text-slate-400 font-medium tracking-wide">Omnievents, lasting memories</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight tracking-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 italic">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
              <div className="flex-1">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <Link to={createPageUrl("EventPlanning")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto h-full px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-xl font-medium shadow-lg shadow-slate-300 transition-all hover:scale-105 flex items-center gap-2 justify-center whitespace-nowrap text-sm sm:text-base">
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
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

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex">
          {/* Left Side Ad - Hidden on mobile */}
          <div className="hidden xl:block">
            <SideAdPlaceholder position="left" />
          </div>

          <div className="flex-1 min-w-0">
        {/* Results Count - only show when searching */}
        {searchQuery && (
          <div className="mb-6 sm:mb-8 px-2">
            <p className="text-sm sm:text-base text-slate-600">
              <span className="font-semibold text-slate-900">{filteredVendors.length}</span> vendors found
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3 sm:space-y-4">
                <Skeleton className="h-48 sm:h-56 lg:h-64 rounded-xl sm:rounded-2xl" />
                <Skeleton className="h-5 sm:h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 mb-3 sm:mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No vendors found</h3>
            <p className="text-sm sm:text-base text-slate-600">Try adjusting your filters or search terms</p>
          </div>
        ) : isHomepage ? (
          /* Homepage - Grouped by Category with Carousels */
          vendorsByEvent.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Promo Ad Banner */}
              <div className="-mx-4 sm:-mx-6 lg:mx-auto mb-2">
                <PromoAdBanner vendor={promoVendor} className="lg:max-w-7xl lg:mx-auto lg:rounded-2xl" />
              </div>

              {/* Event Type Sections with Horizontal Ads */}
              {vendorsByEvent.map((group, index) => (
                <React.Fragment key={group.eventType}>
                  <VendorCategorySection
                    title={EVENT_LABELS[group.eventType] || group.eventType}
                    eventType={group.eventType}
                    category="all"
                    vendors={group.vendors}
                    allReviews={allReviews}
                  />
                  {/* Insert horizontal ad after every 2 sections */}
                  {(index + 1) % 2 === 0 && index < vendorsByEvent.length - 1 && (
                    <HorizontalAdPlaceholder size="medium" />
                  )}
                </React.Fragment>
              ))}
              
              {/* Bottom Horizontal Ad */}
              <HorizontalAdPlaceholder size="large" />
            </div>
          ) : (
            /* Show all vendors when no event type grouping available */
            <div className="space-y-8 sm:space-y-12 px-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">All Vendors</h2>
                <div className="columns-1 sm:columns-2 lg:columns-4 gap-2 sm:gap-3 space-y-2 sm:space-y-3">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="break-inside-avoid">
                      <VendorCard vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Filtered View - Grid Layout */
          <div className="space-y-8 sm:space-y-12 px-2">
            {/* Featured Vendors */}
            {featuredVendors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Vendors</h2>
                </div>
                <div className="columns-1 sm:columns-2 lg:columns-4 gap-2 sm:gap-3 space-y-2 sm:space-y-3">
                  {featuredVendors.map((vendor) => (
                    <div key={vendor.id} className="break-inside-avoid">
                      <VendorCard vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horizontal Ad between sections - Hidden on mobile */}
            {featuredVendors.length > 0 && regularVendors.length > 0 && (
              <div className="hidden sm:block">
                <HorizontalAdPlaceholder size="small" />
              </div>
            )}

            {/* Regular Vendors */}
            {regularVendors.length > 0 && (
              <div>
                {featuredVendors.length > 0 && (
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">All Vendors</h2>
                )}
                <div className="columns-1 sm:columns-2 lg:columns-4 gap-2 sm:gap-3 space-y-2 sm:space-y-3">
                    {regularVendors.map((vendor) => (
                      <div key={vendor.id} className="break-inside-avoid">
                        <VendorCard vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {/* Bottom Horizontal Ad - Hidden on mobile */}
            <div className="hidden sm:block">
              <HorizontalAdPlaceholder size="large" />
            </div>

            {/* Load More Button */}
            {regularVendors.length >= vendorsPerPage * vendorPage && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={() => setVendorPage(p => p + 1)}
                  disabled={isFetching}
                  size="lg"
                  className="bg-slate-900 hover:bg-black"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Vendors'
                  )}
                </Button>
              </div>
            )}
            </div>
            )}
            </div>

          {/* Right Side Ad - Hidden on mobile */}
          <div className="hidden xl:block">
            <SideAdPlaceholder position="right" />
          </div>
          </div>
          </div>
    </div>
  );
}