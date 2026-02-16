import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Star, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import VendorFavoriteButton from "../vendor/VendorFavoriteButton";
import { formatPrice, detectUserCurrency } from "../utils/currency";

const CATEGORY_LABELS = {
  bridal_fashion: "Bridal Fashion",
  makeup_artistes: "Make-Up",
  decor_logistics: "Décor & Logistics",
  event_grounds: "Event Grounds",
  photography_videography: "Photo & Video",
  design_creatives: "Design",
  catering: "Catering",
  jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon",
  music_karaoke_mc: "Music & MC",
  car_rentals: "Car Rentals",
  social_media_support: "Social Media",
  ushers: "Ushers",
  dance_tutorials: "Dance",
  rent_a_team: "Rent-a-Team",
  conference_facilities: "Conference",
  rapporteur_services: "Rapporteur",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion & Wreaths",
  others: "Others"
};

export default function VendorCard({ vendor, reviews = [], size = "auto" }) {
  if (!vendor) return null;
  
  const [imageError, setImageError] = React.useState(false);
  const [currency, setCurrency] = React.useState(null);

  React.useEffect(() => {
    detectUserCurrency().then(setCurrency);
  }, []);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : vendor.rating;

  // Featured is determined by high ratings (4.5+) and having at least 3 reviews
  const isFeatured = useMemo(() => {
    if (reviews.length >= 3 && averageRating >= 4.5) {
      const hash = vendor.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return hash % 10 < 7;
    }
    return false;
  }, [reviews.length, averageRating, vendor.id]);

  // Handle arrays for category and event_type
  const categories = Array.isArray(vendor.category) ? vendor.category : (vendor.category ? [vendor.category] : []);
  const eventTypes = Array.isArray(vendor.event_type) ? vendor.event_type : (vendor.event_type ? [vendor.event_type] : []);

  return (
    <Link to={createPageUrl(`VendorDetail?id=${vendor.id}`)} className="block h-full">
      <Card className="group h-full flex flex-col overflow-hidden border border-slate-200 hover:border-slate-400 transition-all duration-500 bg-white rounded-none">
        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-slate-100 shrink-0">
          {vendor.image_url && !imageError ? (
            <img
              src={vendor.image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
              loading="lazy"
              width="400"
              height="300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-6xl font-serif text-slate-300">
                {vendor.business_name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          
          {isFeatured && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-slate-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-lg font-medium text-xs sm:text-sm">
              <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Top Rated</span>
              <span className="sm:hidden">Top</span>
            </div>
          )}

          <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
            <VendorFavoriteButton vendorId={vendor.id} size="icon" className="bg-white/90 hover:bg-white" />
          </div>

          {vendor.starting_price && currency && (
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-slate-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg shadow-lg font-semibold text-xs sm:text-sm">
              {formatPrice(vendor.starting_price, currency)}
            </div>
          )}

          {/* Gallery indicator */}
          {vendor.gallery_images && vendor.gallery_images.length > 0 && (
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/60 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center gap-1 sm:gap-1.5 text-xs">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {vendor.gallery_images.length + 1}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Categories Tags */}
          <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
            {categories.slice(0, 2).map((cat, i) => (
               <span key={i} className="text-[10px] sm:text-xs font-medium tracking-wide uppercase text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-sm">
                 {CATEGORY_LABELS[cat] || cat}
               </span>
            ))}
            {categories.length > 2 && (
              <span className="text-[10px] sm:text-xs font-medium text-slate-400 px-1">+ {categories.length - 2}</span>
            )}
          </div>

          <h3 className="font-serif font-bold text-base sm:text-lg lg:text-xl text-slate-900 group-hover:text-slate-600 transition-colors line-clamp-1 mb-1.5 sm:mb-2 tracking-tight">
            {vendor.business_name}
          </h3>

          <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3">
            {vendor.location && (
              <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}

            {(averageRating || reviews.length > 0) && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-400 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  {averageRating ? averageRating.toFixed(1) : 'New'}
                </span>
                {reviews.length > 0 && (
                  <span className="text-[10px] sm:text-xs text-slate-500">({reviews.length})</span>
                )}
              </div>
            )}
          </div>

          {vendor.description && (
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mt-auto">
              {vendor.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}