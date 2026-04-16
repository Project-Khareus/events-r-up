import React, { useState, useMemo, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import SearchBar from "../components/marketplace/SearchBar";
import FilterControls from "../components/marketplace/FilterControls";
import MarketplaceContent from "../components/marketplace/MarketplaceContent";


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
  wreaths: "Wreaths",
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
  const vendorsPerSection = 12; // Limit per event type section for performance

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
    queryFn: () => base44.entities.Vendor.list('-created_date', 200),
    staleTime: 60000,
    cacheTime: 300000,
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

  // Normalize vendor data and shuffle for variety on homepage
  const vendors = useMemo(() => {
    const approved = rawVendors
      .filter(Boolean)
      .map((v) => v.data ? { id: v.id, ...v.data } : v)
      .filter((v) => v && v.id && (!v.status || v.status === 'approved'));
    // Seeded daily shuffle so order changes each day but stays stable during a session
    const seed = Math.floor(Date.now() / 86400000);
    const shuffled = [...approved];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.abs(((seed * (i + 1) * 9301 + 49297) % 233280)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    return filteredVendors.filter((v) => v && v.rating >= 4).slice(0, 4);
  }, [filteredVendors]);

  const regularVendors = useMemo(() => {
    const featuredIds = new Set(featuredVendors.map((v) => v.id));
    return filteredVendors.filter((v) => v && !featuredIds.has(v.id));
  }, [filteredVendors, featuredVendors]);

  // Pick a random vendor for promo (vendors with high ratings)
  const promoVendor = useMemo(() => {
    const eligibleVendors = vendors.filter((v) => v.rating >= 4 && v.image_url);
    if (eligibleVendors.length === 0) return null;
    const randomIndex = Math.floor(Date.now() / 86400000) % eligibleVendors.length; // Changes daily
    return eligibleVendors[randomIndex];
  }, [vendors]);

  // Group vendors by event type for homepage display
  const isHomepage = eventType === "all" && category === "all" && !searchQuery && !aiMatchedIds;

  const vendorsByEvent = useMemo(() => {
    if (!isHomepage) return [];
    const eventOrder = ["weddings", "parties", "conference", "funeral"];
    const grouped = {};

    // Initialize groups
    eventOrder.forEach((e) => {
      grouped[e] = { eventType: e, vendors: [] };
    });

    vendors.forEach((vendor) => {
      // After normalization, event_type is directly on vendor
      const vendorEvents = vendor.event_type ? Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type] : [];
      if (vendorEvents.length === 0) return; // Skip vendors without event type
      vendorEvents.forEach((eventType) => {
        if (grouped[eventType]) {
          grouped[eventType].vendors.push(vendor);
        }
      });
    });

    // Return groups in the specified order (Weddings, Parties, Conference, Funeral)
    // ALWAYS show weddings and parties, limit vendors per section for performance
    return eventOrder.
    map((eventType) => ({
      ...grouped[eventType],
      vendors: grouped[eventType].vendors.slice(0, vendorsPerSection) // Limit to first 12 vendors per section
    })).
    filter((group) => {
      // Always show Weddings and Parties even if empty
      if (group.eventType === 'weddings' || group.eventType === 'parties') {
        return true;
      }
      // Show other sections only if they have vendors
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
    <PullToRefresh onRefresh={handleRefresh}><div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 sm:py-8 lg:py-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-2 leading-tight tracking-tight">
              Find Your Perfect
              <span className="inline sm:block text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 italic"> Event Vendors</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Discover exceptional vendors for your special moments.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-5 sm:-mt-6">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchBar value={searchInput} onChange={setSearchInput} onSearch={(q) => { setSearchQuery(q); setAiMatchedIds(null); }} onAiSearch={handleAiSearch} isAiSearching={isAiSearching} location={location} onLocationChange={setLocation} />
            </div>
            <Link to={createPageUrl("EventPlanning")} className="shrink-0">
              <button className="h-10 px-5 border border-slate-900 dark:border-slate-400 text-slate-900 dark:text-slate-200 rounded-full font-medium text-sm hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-all flex items-center gap-2 justify-center whitespace-nowrap">
                <Wand2 className="h-3.5 w-3.5" />
                Plan an Event
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex gap-6">

          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">Filters</h3>
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
                layout="vertical" />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Mobile Filters - Top */}
            <div className="lg:hidden mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 py-2.5">
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
                  onMinYearsChange={setMinYears} />
              </div>
            </div>
        <MarketplaceContent
              isLoading={isLoading}
              filteredVendors={filteredVendors}
              isHomepage={isHomepage}
              vendorsByEvent={vendorsByEvent}
              allReviews={allReviews}
              featuredVendors={featuredVendors}
              regularVendors={regularVendors}
              vendorsPerPage={vendorsPerPage}
              vendorPage={vendorPage}
              isFetching={isFetching}
              onLoadMore={() => setVendorPage((p) => p + 1)}
              searchQuery={searchQuery}
            />
          </div>{/* flex-1 */}
        </div>{/* flex */}
      </div>{/* max-w */}
    </div>{/* min-h-screen */}
    </PullToRefresh>
  );
}