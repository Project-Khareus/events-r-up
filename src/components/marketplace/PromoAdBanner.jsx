import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ArrowRight } from "lucide-react";

export default function PromoAdBanner({ vendor }) {
  if (!vendor) {
    // Placeholder when no vendor promo available
    return (
      <div className="relative overflow-hidden rounded-xl bg-slate-900 flex flex-col md:flex-row">
        {/* Left Content */}
        <div className="flex-shrink-0 p-6 md:p-8 md:w-[320px] flex flex-col justify-center">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            Your Ad Could Be Here
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Reach thousands of event planners looking for services like yours.
          </p>
          <button className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors w-fit">
            Learn More
          </button>
        </div>
        
        {/* Right Image Grid */}
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-md">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get gallery images or create placeholders
  const displayImages = [
    vendor.image_url,
    ...(vendor.gallery_images || [])
  ].filter(Boolean).slice(0, 8);

  // Pad with placeholders if needed
  while (displayImages.length < 8) {
    displayImages.push(null);
  }

  return (
    <Link to={createPageUrl(`VendorDetail?id=${vendor.id}`)}>
      <div className="relative overflow-hidden rounded-xl bg-slate-900 flex flex-col md:flex-row group cursor-pointer hover:shadow-2xl transition-shadow">
        {/* Left Content */}
        <div className="flex-shrink-0 p-6 md:p-8 md:w-[320px] flex flex-col justify-center">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            {vendor.business_name}
          </h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
            {vendor.slogan || vendor.description?.slice(0, 80)}
          </p>
          <div className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors w-fit flex items-center gap-2">
            View Vendor
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        
        {/* Right Image Grid */}
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center relative">
          {/* Floating Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Special Offer
          </div>
          
          <div className="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-md">
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
    </Link>
  );
}