import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Sparkles, TrendingUp, Wand2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/marketplace/SearchBar";
import FilterControls from "../components/marketplace/FilterControls";
import VendorCard from "../components/marketplace/VendorCard";
import VendorCategorySection from "../components/marketplace/VendorCategorySection";
import PromoAdBanner from "../components/marketplace/PromoAdBanner";
import SideAdPlaceholder from "../components/marketplace/SideAdPlaceholder";
import HorizontalAdPlaceholder from "../components/marketplace/HorizontalAdPlaceholder";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_LABELS = {
  event_planner: "Event Planner",
  bridal_fashion: "Fashion & Accessories",
  makeup_artistes: "Make-Up Artistes",
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
  const vendorsPerSection = 12; // Limit per event type section for performance

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

  const filteredVendors = useMemo(() => {
    let filtered = vendors.filter((vendor) => {
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
  }, [vendors, searchQuery, eventType, category, priceRange, sortBy, location, minRating, minYears]);

  const featuredVendors = useMemo(() => {
    return filteredVendors.filter((v) => v.rating >= 4).slice(0, 4); // Display up to 4 featured
  }, [filteredVendors]);

  const regularVendors = useMemo(() => {
    const featuredIds = new Set(featuredVendors.map((v) => v.id));
    return filteredVendors.filter((v) => !featuredIds.has(v.id));
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
              <div className="flex-1">
                <SearchBar value={searchInput} onChange={setSearchInput} onSearch={setSearchQuery} location={location} onLocationChange={setLocation} />
              </div>
              <Link to={createPageUrl("EventPlanning")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto h-full px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-xl font-medium shadow-lg shadow-slate-300 transition-all hover:scale-105 flex items-center gap-2 justify-center whitespace-nowrap text-sm sm:text-base">
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Plan an Event
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 sm:px-5 py-2.5 sm:py-3">
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

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex">

          <div className="flex-1 min-w-0">
        {searchQuery &&
            <div className="mb-6 sm:mb-8 px-2">
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredVendors.length}</span> vendors found
            </p>
          </div>
            }

        {isLoading ?
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-2">
            {[...Array(6)].map((_, i) =>
              <div key={i} className="space-y-3 sm:space-y-4">
                <Skeleton className="h-48 sm:h-56 lg:h-64 rounded-xl sm:rounded-2xl" />
                <Skeleton className="h-5 sm:h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              )}
          </div> :
            filteredVendors.length === 0 ?
            <div className="text-center py-12 sm:py-20 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 mb-3 sm:mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No vendors found</h3>
            <p className="text-sm sm:text-base text-slate-600">Try adjusting your filters or search terms</p>
          </div> :
            isHomepage ? (
            <div className="space-y-3 sm:space-y-4">
              {/* <div className="-mx-4 sm:-mx-6 lg:mx-auto mb-2">
                <PromoAdBanner vendor={promoVendor} className="lg:max-w-7xl lg:mx-auto lg:rounded-2xl" />
              </div> */}
              {vendorsByEvent.map((group, index) =>
              <div key={group.eventType}>
                  {group.vendors.length > 0 ?
                <VendorCategorySection
                  title={EVENT_LABELS[group.eventType] || group.eventType}
                  eventType={group.eventType}
                  category="all"
                  vendors={group.vendors}
                  allReviews={allReviews} /> : (
                <div className="px-2 py-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-4">{EVENT_LABELS[group.eventType]}</h2>
                      <div className="text-center py-12 bg-slate-50 rounded-2xl">
                        <p className="text-slate-600">New {EVENT_LABELS[group.eventType].toLowerCase()} vendors coming soon!</p>
                      </div>
                    </div>)
                }
                </div>
              )}
            </div>) : (
            <div className="space-y-8 sm:space-y-12 px-2">
            {featuredVendors.length > 0 &&
              <div>
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Vendors</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {featuredVendors.map((vendor) => (
                    <div key={vendor.id}>
                      <VendorCard vendor={vendor} reviews={allReviews.filter((r) => r.vendor_id === vendor.id)} />
                    </div>
                  ))}
                </div>
              </div>
              }
            {regularVendors.length > 0 &&
              <div>
                {featuredVendors.length > 0 &&
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">All Vendors</h2>
                }
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {regularVendors.map((vendor) => (
                      <div key={vendor.id}>
                        <VendorCard vendor={vendor} reviews={allReviews.filter((r) => r.vendor_id === vendor.id)} />
                      </div>
                    ))}
                  </div>
              </div>
              }
            {regularVendors.length >= vendorsPerPage * vendorPage &&
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setVendorPage((p) => p + 1)}
                  disabled={isFetching}
                  size="lg"
                  className="bg-slate-900 hover:bg-black">
                  {isFetching ?
                  <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </> :
                  'Load More Vendors'
                  }
                </Button>
              </div>
              }
            </div>)
            }
            </div>

          </div>
          </div>
    </div></PullToRefresh>
  );
}