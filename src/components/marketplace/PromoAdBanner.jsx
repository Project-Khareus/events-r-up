import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Sparkles, ArrowRight } from "lucide-react";

export default function PromoAdBanner({ vendor }) {
  if (!vendor) {
    // Placeholder when no vendor promo available
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
              <Sparkles className="h-3 w-3" />
              Featured Promotion
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Your Ad Could Be Here
            </h3>
            <p className="text-white/80 text-sm md:text-base">
              Reach thousands of event planners looking for services like yours.
            </p>
          </div>
          <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2">
            Learn More
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link to={createPageUrl(`VendorDetail?id=${vendor.id}`)}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 md:p-8 group cursor-pointer hover:shadow-xl transition-shadow">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {vendor.image_url && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-4 border-white/30 shadow-lg flex-shrink-0">
              <img 
                src={vendor.image_url} 
                alt={vendor.business_name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
              <Sparkles className="h-3 w-3" />
              Special Offer
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {vendor.business_name}
            </h3>
            <p className="text-white/90 text-sm md:text-base mb-2">
              {vendor.slogan || vendor.description?.slice(0, 80) + "..."}
            </p>
            {vendor.starting_price && (
              <p className="text-white font-semibold">
                Starting from ${vendor.starting_price.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold group-hover:bg-orange-50 transition-colors flex items-center gap-2 flex-shrink-0">
            View Deal
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}