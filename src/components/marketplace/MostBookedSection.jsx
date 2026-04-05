import React from "react";
import { Link } from "react-router-dom";
import { getVendorUrl } from "../../utils/vendorUrl";
import { MapPin, Star, ShieldCheck, Camera } from "lucide-react";
import VendorFavoriteButton from "../vendor/VendorFavoriteButton";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";

export default function MostBookedSection({ title, vendors, allReviews = [] }) {
  const topVendors = vendors
    .filter((v) => v.rating >= 3 || v.image_url)
    .slice(0, 3);

  if (topVendors.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topVendors.map((vendor, index) => {
          const reviews = allReviews.filter((r) => r.vendor_id === vendor.id);
          const avgRating = reviews.length > 0
            ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
            : vendor.rating?.toFixed(1);
          const currency = getCurrencyByCode(vendor.price_currency);
          const isVerified = vendor.ghana_card_status === "verified";

          return (
            <Link to={getVendorUrl(vendor)} key={vendor.id} className="group">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {vendor.image_url ? (
                    <img
                      src={vendor.image_url}
                      alt={vendor.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <span className="text-4xl font-serif text-slate-300">{vendor.business_name?.[0]}</span>
                    </div>
                  )}

                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                    #{index + 1}
                  </div>

                  {/* Favorite */}
                  <div className="absolute top-2 right-2 z-10">
                    <VendorFavoriteButton vendorId={vendor.id} size="icon" className="bg-white/90 hover:bg-white shadow-sm h-7 w-7 rounded-full" />
                  </div>

                  {/* Verified + Stats overlay */}
                  {isVerified && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 rounded-full px-2 py-0.5 text-[10px] font-medium text-green-700">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </div>
                  )}

                  {/* Gallery count */}
                  {vendor.gallery_images?.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded-md px-1.5 py-0.5 text-[10px] flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {vendor.gallery_images.length + 1}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {vendor.business_name}
                  </h3>
                  {vendor.location && (
                    <p className="text-xs text-slate-500 mt-0.5">{vendor.location}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {avgRating && (
                        <>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{avgRating}</span>
                          {reviews.length > 0 && (
                            <span className="text-[10px] text-slate-400">({reviews.length})</span>
                          )}
                        </>
                      )}
                    </div>
                    {vendor.starting_price && currency && (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatPrice(vendor.starting_price, currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}