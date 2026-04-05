import React from "react";
import { ShieldCheck, Bell, MapPin, Star, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { getVendorUrl } from "../../utils/vendorUrl";
import VendorFavoriteButton from "../vendor/VendorFavoriteButton";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";

export default function VerifiedVendorsSection({ vendors, allReviews = [] }) {
  const verifiedVendors = vendors.filter((v) => v.ghana_card_status === "verified" || v.rating >= 4);
  const topVerified = verifiedVendors.slice(0, 3);

  if (topVerified.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Green Verified Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-green-700 dark:text-green-400 text-base">Verified Vendors</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {verifiedVendors.length} <span className="text-sm font-normal text-slate-500">Vendors Verified</span>
          </p>
        </div>
        <Bell className="h-5 w-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
      </div>

      {/* Verified Vendor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topVerified.map((vendor) => {
          const reviews = allReviews.filter((r) => r.vendor_id === vendor.id);
          const avgRating = reviews.length > 0
            ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
            : vendor.rating?.toFixed(1);
          const currency = getCurrencyByCode(vendor.price_currency);

          return (
            <Link to={getVendorUrl(vendor)} key={vendor.id} className="group">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {vendor.image_url ? (
                    <img src={vendor.image_url} alt={vendor.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <span className="text-4xl font-serif text-slate-300">{vendor.business_name?.[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-10">
                    <VendorFavoriteButton vendorId={vendor.id} size="icon" className="bg-white/90 hover:bg-white shadow-sm h-7 w-7 rounded-full" />
                  </div>
                  {vendor.gallery_images?.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded-md px-1.5 py-0.5 text-[10px] flex items-center gap-1">
                      <Camera className="h-3 w-3" />{vendor.gallery_images.length + 1}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{vendor.business_name}</h3>
                  {vendor.location && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{vendor.location}</p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      {avgRating && (
                        <>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold">{avgRating}</span>
                        </>
                      )}
                    </div>
                    {vendor.starting_price && currency && (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatPrice(vendor.starting_price, currency)}</span>
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