import React, { useState, useMemo, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import SearchBar from "../components/marketplace/SearchBar";
import FilterControls from "../components/marketplace/FilterControls";
import VendorCard from "../components/marketplace/VendorCard";
import VendorCategorySection from "../components/marketplace/VendorCategorySection";
import PromoAdBanner from "../components/marketplace/PromoAdBanner";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_LABELS = {
  event_planner: "Event Planner",
  bridal_fashion: "Fashion & Accessories",
  beauty_personal_care: "Beauty & Personal Care",
  decor_logistics: "Décor & Logistics Setup",
  event_grounds: "Event Venues",
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
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventParam = urlParams.get("event") || "all";
  const categoryParam = urlParams.get("category") || "all";

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventType, setEventType] = useState(eventParam);
  const [category, setCategory] = useState(categoryParam);
  const [priceRange, setPriceRange] = useState("all");
  const [vendorPage, setVendorPage] = useState(1);
  const vendorsPerPage = 32;
  const vendorsPerSection = 12;

  // Advanced filters
  const [sortBy, setSortBy] = useState("relevance");
  const [location, setLocation] = useState("");
  const [availableDate, setAvailableDate] = useState(undefined);
  const [minRating, setMinRating] = useState(0);
  const [minYears, setMinYears] = useState(0);

  // AI search
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    setEventType(eventParam);
    setCategory(categoryParam);
  }, [eventParam, categoryParam]);

  const { data: rawVendors = [], isLoading, isFetching } = useQuery({
    queryKey: ['vendors', vendorPage],
    queryFn: () => base44.entities.Vendor.list('-created_date', 80),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    keepPreviousData: true
  });

  // Batch fetch reviews with pagination
  const { data: allReviews = [] } = useQuery({
    queryKey: ['all_reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 150),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1
  });

  // Normalize vendor data - handle both flat and nested data structures
  const vendors = useMemo(() => {
    return rawVendors.
    map((v) => v.data ? { id: v.id, ...v.data } : v).
    filter((v) => !v.status || v.status === 'approved');
  }, [rawVendors]);

  const handleAiSearch = useCallback(async (query) => {
    if (!query?.trim()) {
      setAiMatchedIds(null);
      return;
    }
    setIsAiSearching(true);
    const vendorsForAi = vendors.map(v => ({
      id: v.id,
      name: v.business_name,
      description: (v.description || "").slice(0, 120),
      categories: v.category,
      event_types: v.event_type,
      location: v.location,
      services: v.services?.slice(0, 5),
      price: v.starting_price,
    }));
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a vendor search engine. Given the user query and list of vendors, return the IDs of ALL vendors that match. Consider name, description, categories, services, location, and event types. Be generous — include partial matches.\n\nUser query: "${query}"\n\nVendors:\n${JSON.stringify(vendorsForAi)}`,
      response_json_schema: {
        type: "object",
        properties: {
          matched_ids: { type: "array", items: { type: "string" } }
        }
      }
    });
    setAiMatchedIds(new Set(result.matched_ids || []));
    setIsAiSearching(false);
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    let filtered = vendors.filter((vendor) => {
      // AI search filter
      if (aiMatchedIds) {
        return aiMatchedIds.has(vendor.id);
      }

      const matchesSearch = !searchQuery ||
      vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.services?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const vendorEvents = vendor.event_type ? Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type] : [];
      const vendorCategories = vendor.category ? Array.isArray(vendor.category) ? vendor.category : [vendor.category] : [];

      const matchesEvent = eventType === "all" || vendorEvents.length === 0 || vendorEvents.includes(eventType);
      const matchesCategory = category === "all" || vendorCategories.length === 0 || vendorCategories.includes(category);
      const matchesPrice = priceRange === "all" || !vendor.price_range || vendor.price_range === priceRange;

      // Advanced filters — location from search bar only applies when searching
      const matchesLocation = !location || !searchQuery ||
      vendor.location?.toLowerCase().includes(location.toLowerCase());

      const matchesRating = minRating === 0 ||
      vendor.rating && vendor.rating >= minRating;

      const matchesYears = minYears === 0 ||
      vendor.years_in_business && vendor.years_in_business >= minYears;

      return matchesSearch && matchesEvent && matchesCategory && matchesPrice &&
      matchesLocation && matchesRating && matchesYears;
    });

    // Apply sorting
    if (sortBy === "rating") {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "price_low") {
      filtered = filtered.sort((a, b) => (a.starting_price || Infinity) - (b.starting_price || Infinity));
    } else if (sortBy === "price_high") {
      filtered = filtered.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
    } else if (sortBy === "newest") {
      filtered = filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return filtered;
  }, [vendors, searchQuery, eventType, category, priceRange, sortBy, location, minRating, minYears, aiMatchedIds]);
  const featuredVendors = useMemo(() => {
    return filteredVendors.filter((v) => v.rating >= 4).slice(0, 4);
  }, [filteredVendors]);

  const regularVendors = useMemo(() => {
    const featuredIds = new Set(featuredVendors.map((v) => v.id));
    return filteredVendors.filter((v) => !featuredIds.has(v.id));
  }, [filteredVendors, featuredVendors]);

  // Pick a random vendor for promo (vendors with high ratings)
  const promoVendor = useMemo(() => {
    const eligibleVendors = vendors.filter((v) => v.rating >= 4 && v.image_url);
    if (eligibleVendors.length === 0) return null;
    const randomIndex = Math.floor(Date.now() / 86400000) % eligibleVendors.length;
    return eligibleVendors[randomIndex];
  }, [vendors]);

  // Group vendors by event type for homepage display
  const isHomepage = eventType === "all" && category === "all" && !searchQuery && !aiMatchedIds;

  const EVENT_LABELS = {
    weddings: "Weddings",
    parties: "Parties",
    conference: "Conference",
    funeral: "Funeral"
  };

  const vendorsByEvent = useMemo(() => {
    if (!isHomepage) return [];
    const eventOrder = ["weddings", "parties", "conference", "funeral"];
    const grouped = {};

    eventOrder.forEach((e) => {
      grouped[e] = { eventType: e, vendors: [] };
    });

    vendors.forEach((vendor) => {
      const vendorEvents = vendor.event_type ? Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type] : [];
      if (vendorEvents.length === 0) return;
      vendorEvents.forEach((eventType) => {
        if (grouped[eventType]) {
          grouped[eventType].vendors.push(vendor);
        }
      });
    });

    return eventOrder.
    map((eventType) => ({
      ...grouped[eventType],
      vendors: grouped[eventType].vendors.slice(0, vendorsPerSection)
    })).
    filter((group) => {
      if (group.eventType === 'weddings' || group.eventType === 'parties') {
        return true;
      }
      return group.vendors.length > 0;
    });
  }, [vendors, isHomepage, vendorsPerSection]);

  const handleClearFilters = () => {
    setEventType("all");
    setCategory("all");
    setPriceRange("all");
    setSearchInput("");
    setSearchQuery("");
    setAiMatchedIds(null);
    setSortBy("relevance");
    setLocation("");
    setAvailableDate(undefined);
    setMinRating(0);
    setMinYears(0);
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['vendors'] }),
      queryClient.invalidateQueries({ queryKey: ['all_reviews'] }),
    ]);
  };



  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Search Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="flex-1">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={(q) => { setSearchQuery(q); setAiMatchedIds(null); }}
                  onAiSearch={handleAiSearch}
                  isAiSearching={isAiSearching}
                  location={location}
                  onLocationChange={setLocation}
                />
              </div>
              <Link to={createPageUrl("EventPlanning")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto h-full px-5 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 justify-center whitespace-nowrap text-sm">
                  <Wand2 className="h-4 w-4" />
                  Plan an Event
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2">
            <FilterControls
              eventType={eventType}
              category={category}
              priceRange={priceRange}
              onEventChange={setEventType}
              onCategoryChange={setCategory}
              onPriceChange={setPriceRange}
              onClearFilters={handleClearFilters}
              sortBy={sortBy}
              onSortChange={setSortBy}
              location={location}
              onLocationChange={setLocation}
              availableDate={availableDate}
              onAvailableDateChange={setAvailableDate}
              minRating={minRating}
              onMinRatingChange={setMinRating}
              minYears={minYears}
              onMinYearsChange={setMinYears}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-48 sm:h-56 rounded-xl" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-40 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : isHomepage ? (
            /* Homepage with event-grouped sections */
            <div className="space-y-4">
              {/* Promo Banner */}
              <PromoAdBanner vendor={promoVendor} />

              {/* Event Type Sections */}
              {vendorsByEvent.map((group) => (
                <VendorCategorySection
                  key={group.eventType}
                  title={EVENT_LABELS[group.eventType] || group.eventType}
                  eventType={group.eventType}
                  category="all"
                  vendors={group.vendors}
                  allReviews={allReviews}
                />
              ))}
            </div>
          ) : (
            /* Filtered / search results view */
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredVendors.length}</span> vendors found
              </p>
              {filteredVendors.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-3">
                    <Sparkles className="h-7 w-7 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No vendors found</h3>
                  <p className="text-sm text-slate-600">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredVendors.map((vendor) => (
                    <div key={vendor.id}>
                      <VendorCard vendor={vendor} reviews={allReviews.filter((r) => r.vendor_id === vendor.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}