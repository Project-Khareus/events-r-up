import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Skeleton } from "@/components/ui/skeleton";

import SearchBar from "../components/marketplace/SearchBar";
import HomeMasthead from "../components/marketplace/home/HomeMasthead";
import FilterSidebar from "../components/marketplace/FilterSidebar";
import HomeOccasionDoors from "../components/marketplace/home/HomeOccasionDoors";
import HomeVendorOfTheWeek from "../components/marketplace/home/HomeVendorOfTheWeek";
import HomeNewlyApproved from "../components/marketplace/home/HomeNewlyApproved";
import HomeTrustStrip from "../components/marketplace/home/HomeTrustStrip";
import FilterControls from "../components/marketplace/FilterControls";
import MarketplaceContent from "../components/marketplace/MarketplaceContent";
import { rankVendors } from "@/lib/semanticSearch";


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
  const vendorsPerSection = 50; // Limit per event type section

  // Advanced filters
  const [sortBy, setSortBy] = useState("relevance");
  const [location, setLocation] = useState("");
  const [availableDate, setAvailableDate] = useState(undefined);
  const [minRating, setMinRating] = useState(0);
  const [minYears, setMinYears] = useState(0);

  useEffect(() => {
    setEventType(eventParam);
    setCategory(categoryParam);
  }, [eventParam, categoryParam]);

  const { data: rawVendors = [], isLoading, isFetching } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date', 200),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    keepPreviousData: true
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all_reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 150),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1
  });

  // Normalize vendor data and shuffle for variety on each page reload
  const vendors = useMemo(() => {
    const approved = rawVendors
      .filter(Boolean)
      .map((v) => v.data ? { id: v.id, ...v.data } : v)
      .filter((v) => v && v.id && (!v.status || v.status === 'approved'));

    return [...approved].sort(() => Math.random() - 0.5);
  }, [rawVendors]);

  const filteredVendors = useMemo(() => {
    const searchRanked = searchQuery ? rankVendors(vendors, searchQuery, CATEGORY_LABELS) : vendors;

    let filtered = searchRanked.filter((vendor) => {
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

      return matchesEvent && matchesCategory && matchesPrice &&
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
  }, [vendors, searchQuery, eventType, category, priceRange, sortBy, location, minRating, minYears]);

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
  const isHomepage = eventType === "all" && category === "all" && !searchQuery;

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

  const rule = "h-px bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)] mx-5 md:mx-10";

  if (isHomepage) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-cream dark:bg-[#211B16] pb-[82px] md:pb-0">
          <div className="max-w-[1280px] mx-auto">
            <HomeMasthead />
            <div className="px-5 md:px-10 pb-8 md:pb-12 flex gap-8">
              <FilterSidebar
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
              <div className="flex-1 min-w-0 space-y-6">
                <div className="lg:hidden bg-linen dark:bg-[#2A231D] rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] px-4 py-3">
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
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={(q) => setSearchQuery((q || "").trim())}
                  location={location}
                  onLocationChange={setLocation}
                />

                <div className="-mx-5 md:-mx-10">
                  <HomeOccasionDoors vendorsByEvent={vendorsByEvent} />
                  {promoVendor && (
                    <>
                      <div className={rule} />
                      <HomeVendorOfTheWeek vendor={promoVendor} />
                    </>
                  )}
                  <div className={rule} />
                  {isLoading ? (
                    <div className="px-5 md:px-10 py-8 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="aspect-square rounded-none" />
                          <Skeleton className="h-5 w-3/4 rounded-none" />
                          <Skeleton className="h-4 w-1/2 rounded-none" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <HomeNewlyApproved
                      vendors={vendors}
                      allReviews={allReviews}
                      location={location}
                      totalCount={vendors.length}
                    />
                  )}
                </div>
              </div>
            </div>
            <HomeTrustStrip />
          </div>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}><div className="min-h-screen bg-cream dark:bg-[#211B16] pb-[82px] md:pb-0">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-6 md:py-10">
        <div className="mb-6">
          <SearchBar value={searchInput} onChange={setSearchInput} onSearch={(q) => setSearchQuery((q || "").trim())} location={location} onLocationChange={setLocation} />
        </div>

        <div className="flex gap-8">

          {/* Sidebar Filters - Desktop */}
          <FilterSidebar
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

          <div className="flex-1 min-w-0">
            {/* Mobile Filters - Top */}
            <div className="lg:hidden mb-4">
              <div className="bg-linen dark:bg-[#2A231D] rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] px-4 py-3">
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