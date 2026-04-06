import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VendorCard from "./VendorCard";

export default function VendorRow({ title, vendors = [], allReviews = [], seeAllUrl }) {
  const scrollRef = useRef(null);

  if (vendors.length === 0) return null;

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {seeAllUrl && (
          <Link
            to={seeAllUrl}
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-colors"
          >
            See all
          </Link>
        )}
      </div>

      {/* Desktop: 4-col grid */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {vendors.slice(0, 4).map((vendor) => (
          <div key={vendor.id}>
            <VendorCard
              vendor={vendor}
              reviews={allReviews.filter((r) => r.vendor_id === vendor.id)}
            />
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/3 -translate-y-1/2 z-10 w-7 h-7 bg-white/90 dark:bg-slate-700/90 rounded-full shadow flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/3 -translate-y-1/2 z-10 w-7 h-7 bg-white/90 dark:bg-slate-700/90 rounded-full shadow flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {vendors.map((vendor) => (
            <div key={vendor.id} className="flex-shrink-0 w-44 snap-start">
              <VendorCard
                vendor={vendor}
                reviews={allReviews.filter((r) => r.vendor_id === vendor.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}