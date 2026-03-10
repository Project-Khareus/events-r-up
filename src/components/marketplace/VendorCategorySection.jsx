import React, { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VendorCard from "./VendorCard";

export default function VendorCategorySection({ title, eventType, category, vendors, allReviews = [] }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Hide category if less than 2 vendors
  if (vendors.length < 2) return null;

  // Determine target link
  const pageName = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : "VendorMarketplace";
  const targetUrl = category === 'all' 
    ? createPageUrl(pageName)
    : createPageUrl(`CategoryPage?category=${category}&event=${eventType}`);

  const displayVendors = vendors.slice(0, Math.min(vendors.length, 10));

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Link 
              to={targetUrl}
              className="text-sm font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
            >
              {title}
            </Link>
        <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
        <Link 
          to={targetUrl}
          className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap"
        >
          See all
        </Link>
      </div>

      {/* Desktop Grid - first card is landscape hero, rest are standard */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-2">
        {displayVendors.map((vendor, idx) => {
          const isHero = idx === 0 && displayVendors.length >= 4;
          return (
            <div key={vendor.id} className={isHero ? 'col-span-2 row-span-2' : ''}>
              <VendorCard 
                vendor={vendor} 
                reviews={allReviews.filter(r => r.vendor_id === vendor.id)} 
                variant={isHero ? "hero" : "standard"}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden relative">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 dark:bg-slate-700/90 rounded-full shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 dark:bg-slate-700/90 rounded-full shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-700"
        >
          <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {vendors.map((vendor) => (
            <div key={vendor.id} className="flex-shrink-0 w-56 snap-start">
              <VendorCard vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}