import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VendorCard from "./VendorCard";
import VendorListItem from "./VendorListItem";

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

  // Hide category if no vendors
  if (vendors.length === 0) return null;

  // Determine target link
  const pageName = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : "VendorMarketplace";
  const targetUrl = category === 'all' 
    ? createPageUrl(pageName)
    : createPageUrl(`CategoryPage?category=${category}&event=${eventType}`);

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

      {/* Desktop Grid - 4 columns compact */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-3">
        {vendors.slice(0, Math.min(vendors.length, 10)).map((vendor) => (
          <div key={vendor.id}>
            <VendorCard vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
          </div>
        ))}
      </div>

      {/* Mobile - Magazine Strips layout */}
      <div className="md:hidden px-1 space-y-2">
        {(() => {
          const items = vendors.slice(0, 9);
          const blocks = [];
          let i = 0;
          let blockIdx = 0;
          while (i < items.length) {
            if (blockIdx % 2 === 0) {
              // Hero card — full-width landscape overlay
              blocks.push(
                <VendorListItem key={items[i].id} vendor={items[i]} reviews={allReviews.filter(r => r.vendor_id === items[i].id)} variant="hero" />
              );
              i++;
            } else {
              // 2-column compact pair
              const pair = items.slice(i, i + 2);
              blocks.push(
                <div key={`pair-${i}`} className="grid grid-cols-2 gap-2">
                  {pair.map((v) => (
                    <VendorListItem key={v.id} vendor={v} reviews={allReviews.filter(r => r.vendor_id === v.id)} variant="card" />
                  ))}
                </div>
              );
              i += pair.length;
            }
            blockIdx++;
          }
          return blocks;
        })()}
        {vendors.length > 9 && (
          <Link
            to={targetUrl}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
          >
            See all {vendors.length} vendors
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}