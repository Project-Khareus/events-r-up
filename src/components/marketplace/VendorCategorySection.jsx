import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VendorCard from "./VendorCard";

export default function VendorCategorySection({ title, eventType, category, vendors }) {
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

  // Hide category if less than 4 vendors (can't fill a complete row on desktop)
  if (vendors.length < 4) return null;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Link 
          to={createPageUrl(`CategoryPage?category=${category}&event=${eventType}`)}
          className="text-xl font-bold text-slate-900 hover:text-indigo-600 transition-colors"
        >
          {title}
        </Link>
        <Link 
          to={createPageUrl(`CategoryPage?category=${category}&event=${eventType}`)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          See all
        </Link>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayVendors.slice(0, 4).map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden relative">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {vendors.map((vendor) => (
            <div key={vendor.id} className="flex-shrink-0 w-72 snap-start">
              <VendorCard vendor={vendor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}