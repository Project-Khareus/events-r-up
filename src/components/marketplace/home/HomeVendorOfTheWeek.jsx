import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { getVendorUrl } from "../../../utils/vendorUrl";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import VendorFavoriteButton from "../../vendor/VendorFavoriteButton";

export default function HomeVendorOfTheWeek({ vendor }) {
  if (!vendor) return null;

  const currency = getCurrencyByCode(vendor.price_currency);
  const description = (vendor.description || "").replace(/<[^>]*>/g, "");
  const truncated = description.length > 200 ? `${description.slice(0, 200).trim()}…` : description;

  return (
    <section className="px-5 md:px-10 py-8 md:py-14">
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-6 md:gap-10 items-center">
        <div className="h-[240px] md:h-[380px] overflow-hidden bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
          <img
            src={vendor.image_url}
            alt={vendor.business_name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="block h-px w-[34px] bg-[#A97E2E]" />
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-gold-text dark:text-gold-dark">
              Vendor of the week
            </span>
          </div>

          <h2 className="mt-3 font-serif text-[28px] md:text-[38px] leading-[1.15] text-ink dark:text-[#F1E8E0]">
            {vendor.business_name}
          </h2>

          <div className="mt-3 flex items-center gap-4 text-[12px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            {vendor.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {vendor.location}
              </span>
            )}
            {vendor.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[#A97E2E] text-[#A97E2E]" /> {vendor.rating.toFixed(1)}
              </span>
            )}
          </div>

          {truncated && (
            <p className="mt-4 text-[14.5px] font-light leading-[1.75] text-[rgba(59,50,43,0.82)] dark:text-[rgba(241,232,224,0.8)]">
              {truncated}
            </p>
          )}

          {vendor.starting_price && currency && (
            <p className="mt-5 font-serif text-[30px] text-ink dark:text-[#F1E8E0]">
              {formatPrice(vendor.starting_price, currency)}
              <span className="ml-2 font-sans text-[11.5px] font-light tracking-[0.1em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
                starting
              </span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={getVendorUrl(vendor)}
              className="px-5 py-3 min-h-[44px] flex items-center bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]"
            >
              View profile
            </Link>
            <div className="flex items-center gap-2 border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] pl-4 pr-1 min-h-[44px]">
              <span className="text-[11.5px] font-medium tracking-[0.1em] uppercase text-ink dark:text-[#F1E8E0]">
                Save to my picks
              </span>
              <VendorFavoriteButton vendorId={vendor.id} size="icon" className="rounded-none border-0 bg-transparent h-9 w-9" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}