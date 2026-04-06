import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getVendorUrl } from "../../utils/vendorUrl";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function FeaturedCarousel({ vendors = [] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const featured = vendors.filter((v) => v && v.image_url).slice(0, 5);

  // Reset current index when featured list changes
  const safeCurrent = featured.length > 0 ? current % featured.length : 0;

  useEffect(() => {
    if (featured.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % featured.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const goTo = (idx) => {
    setCurrent(idx % featured.length);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % featured.length);
    }, 4000);
  };

  // Show 3 cards at a time on desktop, 1 on mobile
  const getVisibleVendors = () => {
    const result = [];
    for (let i = 0; i < Math.min(3, featured.length); i++) {
      const v = featured[(safeCurrent + i) % featured.length];
      if (v) result.push(v);
    }
    return result;
  };

  const visible = getVisibleVendors();

  return (
    <div className="relative">
      {/* Desktop: 3-card grid */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {visible.map((vendor, idx) => (
          <Link
            key={vendor.id + "-" + idx}
            to={getVendorUrl(vendor)}
            className="block relative aspect-[4/3] rounded-xl overflow-hidden group"
          >
            <img
              src={vendor.image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-bold text-sm drop-shadow">{vendor.business_name}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: single card with swipe */}
      <div className="sm:hidden">
        <Link
          to={getVendorUrl(featured[safeCurrent])}
          className="block relative aspect-[16/9] rounded-xl overflow-hidden"
        >
          <img
            src={featured[safeCurrent].image_url}
            alt={featured[safeCurrent].business_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-bold text-base drop-shadow">{featured[safeCurrent].business_name}</p>
          </div>
        </Link>
      </div>

      {/* Dots */}
      {featured.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === safeCurrent ? "w-5 bg-slate-800 dark:bg-slate-200" : "w-2 bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      )}

      {/* Nav arrows for desktop */}
      {featured.length > 3 && (
        <>
          <button
            onClick={() => goTo((current - 1 + featured.length) % featured.length)}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-slate-700/90 rounded-full shadow items-center justify-center hover:bg-white z-10"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </button>
          <button
            onClick={() => goTo((current + 1) % featured.length)}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-slate-700/90 rounded-full shadow items-center justify-center hover:bg-white z-10"
          >
            <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </button>
        </>
      )}
    </div>
  );
}