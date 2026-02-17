import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ArrowLeft, Sparkles, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import VendorCard from "./VendorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
    return rawVendors.map(v => v.data ? { id: v.id, ...v.data } : v);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <Link 
            to={createPageUrl("VendorMarketplace")}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4">
            {title}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex flex-col gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder={`Search ${title.toLowerCase()} vendors...`} 
                className="pl-10 h-12 text-lg bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor listings commented out */}
      {/* <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-slate-600 mb-8">
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Sparkles className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No vendors found</h3>
            <p className="text-slate-600">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}