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

      {/* Mobile - Featured cards + compact rows */}
      <div className="md:hidden px-1">
        {/* Top 2 as visual cards */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {vendors.slice(0, 2).map((vendor) => (
            <VendorListItem key={vendor.id} vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} variant="card" />
          ))}
        </div>
        {/* Rest as compact rows */}
        <div className="space-y-1.5">
          {vendors.slice(2, 8).map((vendor) => (
            <VendorListItem key={vendor.id} vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} variant="row" />
          ))}
        </div>
        {vendors.length > 8 && (
          <Link
            to={targetUrl}
            className="flex items-center justify-center gap-1.5 py-3 mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
          >
            See all {vendors.length} vendors
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}