import React from "react";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getVendorUrl } from "../../utils/vendorUrl";
import VendorFavoriteButton from "../vendor/VendorFavoriteButton";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";

const CATEGORY_LABELS = {
  bridal_fashion: "Bridal Fashion",
  beauty_personal_care: "Beauty",
  decor_logistics: "Décor & Logistics",
  event_grounds: "Venues",
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
  event_planner: "Planner",
  conference_facilities: "Conference",
  rapporteur_services: "Rapporteur",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion & Wreaths",
  others: "Others"
};

export default function VendorListItem({ vendor, reviews = [] }) {
  const [imgError, setImgError] = React.useState(false);
  const currency = vendor ? getCurrencyByCode(vendor.price_currency) : null;
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : vendor?.rating;
  const categories = Array.isArray(vendor?.category) ? vendor.category : (vendor?.category ? [vendor.category] : []);

  if (!vendor) return null;

  return (
    <div className="relative">
      <Link to={getVendorUrl(vendor)} className="flex gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all active:scale-[0.98]">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
          {vendor.image_url && !imgError ? (
            <img
              src={vendor.image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
              width="80"
              height="80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
              <span className="text-2xl font-serif text-slate-400 dark:text-slate-500">
                {vendor.business_name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          {vendor.gallery_images?.length > 0 && (
            <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] font-medium px-1 py-0.5 rounded">
              +{vendor.gallery_images.length}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {categories.length > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  {CATEGORY_LABELS[categories[0]] || categories[0]}
                </span>
              )}
            </div>
            <h3 className="font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight line-clamp-1">
              {vendor.business_name}
            </h3>
            {vendor.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{vendor.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              {avgRating > 0 && (
                <>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{avgRating.toFixed(1)}</span>
                  {reviews.length > 0 && (
                    <span className="text-[10px] text-slate-400">({reviews.length})</span>
                  )}
                </>
              )}
            </div>
            {vendor.starting_price && currency && (
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                From {formatPrice(vendor.starting_price, currency)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute top-2 right-2 z-10">
        <VendorFavoriteButton vendorId={vendor.id} size="icon" className="bg-white/90 hover:bg-white dark:bg-slate-700/90 dark:hover:bg-slate-700 shadow-sm h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}