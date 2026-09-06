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
  wreaths: "Wreaths",
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
      <Link to={getVendorUrl(vendor)} className="block h-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]">
        <div className="group h-full flex flex-col overflow-hidden rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] transition-colors duration-300 hover:border-[rgba(59,50,43,0.28)] dark:hover:border-[rgba(241,232,224,0.3)]">
          <div className="relative aspect-square overflow-hidden bg-linen dark:bg-[#211B16] shrink-0">
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
              <div className="w-full h-full flex items-center justify-center bg-linen dark:bg-[#211B16]">
                <span className="text-5xl font-serif text-[rgba(59,50,43,0.25)] dark:text-[rgba(241,232,224,0.25)]">
                  {vendor.business_name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}

            {vendor.gallery_images && vendor.gallery_images.length > 0 && (
              <div className="absolute bottom-2 right-2 bg-linen/95 dark:bg-[#2A231D]/95 text-ink dark:text-[#F1E8E0] px-1.5 py-0.5 rounded-none flex items-center gap-1 text-[11px] font-normal">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {vendor.gallery_images.length + 1}
              </div>
            )}
          </div>

          <div className="pt-2.5 pb-[13px] px-3 flex flex-col flex-1">
            {categories.length > 0 && (
              <span className="text-[9.5px] font-normal tracking-[0.14em] uppercase text-gold-text dark:text-gold-dark mb-1.5">
                {CATEGORY_LABELS[categories[0]] || categories[0]}
              </span>
            )}

            <h3 className="font-serif font-medium text-[19px] leading-tight text-ink dark:text-[#F1E8E0] line-clamp-1 mb-1">
              {vendor.business_name}
            </h3>

            {vendor.location && (
              <div className="flex items-center gap-1 text-[12px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] mb-2.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
              <div className="flex items-center gap-1">
                {(averageRating || reviews.length > 0) && (
                  <>
                    <Star className="h-3.5 w-3.5 fill-[#A97E2E] text-[#A97E2E] shrink-0" />
                    <span className="text-[12px] text-ink dark:text-[#F1E8E0]">
                      {averageRating ? averageRating.toFixed(1) : 'New'}
                    </span>
                    {reviews.length > 0 && (
                      <span className="text-[11px] text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">({reviews.length})</span>
                    )}
                  </>
                )}
              </div>
              {vendor.starting_price && currency && (
                <span className="font-serif text-[13px] text-ink dark:text-[#F1E8E0]">
                  {formatPrice(vendor.starting_price, currency)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2 z-10">
        <VendorFavoriteButton vendorId={vendor.id} size="icon" className="bg-linen/90 hover:bg-linen border-0 h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}