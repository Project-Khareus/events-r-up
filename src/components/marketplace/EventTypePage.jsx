import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ArrowLeft, Sparkles, Search } from "lucide-react";
import VendorCard from "./VendorCard";
import { Skeleton } from "@/components/ui/skeleton";

const HAIRLINE = "border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]";

export default function EventTypePage({ eventType, title, description, categories = [] }) {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const categoryFromUrl = urlParams.get("category") || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  // Update selected category when URL changes (e.g. navigation from navbar)
  React.useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl, location.search]);

  const { data: rawVendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date', 100),
  });

  const vendors = useMemo(() => {
    return rawVendors
      .map(v => v.data ? { id: v.id, ...v.data } : v)
      .filter(v => v.status === 'approved');
  }, [rawVendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
       const vendorEvents = Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type];
       if (!vendorEvents.includes(eventType)) return false;

       const matchesSearch = !searchQuery || 
        vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());

       const vendorCategories = Array.isArray(vendor.category) ? vendor.category : [vendor.category];
       const matchesCategory = selectedCategory === "all" || vendorCategories.includes(selectedCategory);

       return matchesSearch && matchesCategory;
    });
  }, [vendors, eventType, searchQuery, selectedCategory]);

  const pill = (active) =>
    `px-4 py-2 min-h-[44px] rounded-none text-[13px] tracking-[0.06em] uppercase transition-colors ${
      active
        ? "bg-ink text-cream dark:bg-cream dark:text-ink"
        : `bg-transparent text-ink/70 dark:text-cream/70 hover:text-gold-text dark:hover:text-gold-dark ${HAIRLINE}`
    }`;

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1B1714] text-ink dark:text-[#F1E8E0]">
      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-8 lg:pt-14">
        <Link
          to={createPageUrl("VendorMarketplace")}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold-text dark:text-gold-dark hover:text-ink dark:hover:text-cream transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Marketplace
        </Link>
        <h1 className="font-serif text-5xl lg:text-6xl leading-[1.05] mb-3">
          {title}
        </h1>
        <p className="text-lg text-ink/70 dark:text-[#F1E8E0]/70 max-w-2xl">
          {description}
        </p>
        <div className="mt-6 w-16 h-px bg-gold" />
      </div>

      {/* Search + filters */}
      <div className="max-w-7xl mx-auto px-6">
        <div className={`bg-linen dark:bg-[#221D19] ${HAIRLINE} p-6`}>
          <div className="flex flex-col gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <input
                placeholder={`Search ${title.toLowerCase()} vendors`}
                className={`w-full pl-10 pr-4 h-12 bg-transparent rounded-none ${HAIRLINE} text-base text-ink dark:text-[#F1E8E0] placeholder:text-ink/40 dark:placeholder:text-[#F1E8E0]/40 focus:outline-none focus:border-gold`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCategory("all")} className={pill(selectedCategory === "all")}>
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={pill(selectedCategory === cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/60 dark:text-[#F1E8E0]/60 mb-8">
          {filteredVendors.length} vendors found
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 rounded-none" />
                <Skeleton className="h-5 w-3/4 rounded-none" />
                <Skeleton className="h-4 w-full rounded-none" />
              </div>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className={`text-center py-16 ${HAIRLINE} bg-linen dark:bg-[#221D19]`}>
            <Sparkles className="h-7 w-7 text-gold mx-auto mb-4" />
            <h3 className="font-serif text-2xl mb-2">No vendors found</h3>
            <p className="text-ink/60 dark:text-[#F1E8E0]/60">Try adjusting your search or category filter</p>
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