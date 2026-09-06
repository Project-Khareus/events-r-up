import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VendorCard from "./VendorCard";
import VendorListItem from "./VendorListItem";

export default function VendorCategorySection({ title, eventType, category, vendors: rawVendors, allReviews = [] }) {
  const scrollRef = useRef(null);
  const vendors = (rawVendors || []).filter(v => v && v.id);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (vendors.length === 0) return null;

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
          className="text-[14px] font-medium tracking-[0.1em] uppercase text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] hover:text-ink dark:hover:text-[#F1E8E0] transition-colors whitespace-nowrap"
        >
          {title}
        </Link>
        <div className="flex-1 h-px bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)]" />
        <Link 
          to={targetUrl}
          className="text-[13px] text-gold-text dark:text-gold-dark hover:underline whitespace-nowrap"
        >
          See all
        </Link>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-3">
        {vendors.slice(0, 20).map((vendor) => (
          <div key={vendor.id}>
            <VendorCard vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
          </div>
        ))}
      </div>

      {/* Mobile Grid */}
      <div className="md:hidden grid grid-cols-2 gap-3 px-1">
        {vendors.slice(0, 12).map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} reviews={allReviews.filter(r => r.vendor_id === vendor.id)} />
        ))}
      </div>
      {vendors.length > 12 && (
        <div className="md:hidden flex justify-center mt-3">
          <Link
            to={targetUrl}
            className="flex items-center gap-1.5 text-[13px] text-gold-text dark:text-gold-dark hover:underline"
          >
            {`See all ${vendors.length} vendors`}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}