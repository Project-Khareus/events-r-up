import React from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getVendorUrl } from "../../utils/vendorUrl";
import { Badge } from "@/components/ui/badge";
import VendorFavoriteButton from "../vendor/VendorFavoriteButton";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";

const CATEGORY_LABELS = {
  bridal_fashion: "Bridal Fashion",
  beauty_personal_care: "Beauty",
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
  const [imageError, setImageError] = React.useState(false);
  const currency = vendor ? getCurrencyByCode(vendor.price_currency) : null;

  const displayImage = React.useMemo(() => {
    const allImages = [vendor?.image_url, ...(vendor?.gallery_images || [])].filter(Boolean);
    if (allImages.length === 0) return null;
    return allImages[Math.floor(Math.random() * allImages.length)];
  }, [vendor?.id]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : vendor?.rating;

  const categories = Array.isArray(vendor?.category) ? vendor.category : (vendor?.category ? [vendor.category] : []);

  if (!vendor) return null;

  return (
    <div className="relative block h-full">
      <Link to={getVendorUrl(vendor)} className="block h-full">
        <Card className="group h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-300 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md">
          <div className="relative aspect-square overflow-hidden bg-slate-100 shrink-0">
            {displayImage && !imageError ? (
              <img
                src={displayImage}
                alt={vendor.business_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
                width="400"
                height="400"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span className="text-5xl font-serif text-slate-300">
                  {vendor.business_name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}

            {vendor.gallery_images && vendor.gallery_images.length > 0 && (
              <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1 text-xs font-medium">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {vendor.gallery_images.length + 1}
              </div>
            )}
          </div>

          <div className="p-2 flex flex-col flex-1">
            {categories.length > 0 && (
              <span className="text-[10px] font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded self-start mb-1">
                {CATEGORY_LABELS[categories[0]] || categories[0]}
              </span>
            )}

            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 mb-0.5">
              {vendor.business_name}
            </h3>

            {vendor.location && (
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                {(averageRating || reviews.length > 0) && (
                  <>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {averageRating ? averageRating.toFixed(1) : 'New'}
                    </span>
                    {reviews.length > 0 && (
                      <span className="text-[10px] text-slate-400">({reviews.length})</span>
                    )}
                  </>
                )}
              </div>
              {vendor.starting_price && currency && (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formatPrice(vendor.starting_price, currency)}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
      <div className="absolute top-2 right-2 z-10">
        <VendorFavoriteButton vendorId={vendor.id} size="icon" className="bg-white/90 hover:bg-white shadow-sm h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}