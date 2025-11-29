import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight } from "lucide-react";

export default function PromoAdBanner() {
  const { data: banners = [] } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: () => base44.entities.PromoBanner.filter({ is_active: true }),
  });

  // Get active banner (check dates)
  const today = new Date().toISOString().split('T')[0];
  const activeBanner = banners.find(b => {
    if (b.start_date && b.start_date > today) return false;
    if (b.end_date && b.end_date < today) return false;
    return true;
  });

  if (!activeBanner) {
    // Placeholder when no active promo
    return (
      <div className="bg-slate-900 flex flex-col md:flex-row">
        <div className="flex-shrink-0 p-6 md:p-10 md:w-[320px] flex flex-col justify-center">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            Advertise With Us
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Reach thousands of event planners looking for services like yours.
          </p>
          <button className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors w-fit">
            Learn More
          </button>
        </div>
        <div className="flex-1 p-4 md:py-6 md:pr-6 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-lg">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayImages = (activeBanner.images || []).slice(0, 8);
  while (displayImages.length < 8) {
    displayImages.push(null);
  }

  const linkTo = activeBanner.vendor_id 
    ? createPageUrl(`VendorDetail?id=${activeBanner.vendor_id}`)
    : activeBanner.link_url || "#";

  const isExternal = activeBanner.link_url?.startsWith('http');

  const content = (
    <div className="bg-slate-900 flex flex-col md:flex-row group cursor-pointer hover:bg-slate-800 transition-colors">
      <div className="flex-shrink-0 p-6 md:p-10 md:w-[320px] flex flex-col justify-center">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
          {activeBanner.title}
        </h3>
        {activeBanner.description && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
            {activeBanner.description}
          </p>
        )}
        <div className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors w-fit flex items-center gap-2">
          {activeBanner.button_text || "View Now"}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
      
      <div className="flex-1 p-4 md:py-6 md:pr-6 flex items-center justify-center relative">
        {activeBanner.badge_text && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-slate-600 to-slate-700 text-white px-5 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            {activeBanner.badge_text}
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-lg">
          {displayImages.map((img, i) => (
            <div key={i} className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
              {img ? (
                <img 
                  src={img} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return <a href={linkTo} target="_blank" rel="noopener noreferrer">{content}</a>;
  }

  return <Link to={linkTo}>{content}</Link>;
}