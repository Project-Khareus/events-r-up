import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../../utils";
import VendorCard from "../VendorCard";

export default function HomeNewlyApproved({ vendors = [], allReviews = [], location, totalCount }) {
  const items = vendors.slice(0, 8);
  if (items.length === 0) return null;

  return (
    <section className="px-5 md:px-10 py-8 md:py-12">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="font-serif text-[22px] md:text-[27px] text-ink dark:text-[#F1E8E0]">
          Newly approved in {location ? location : "Accra"}
        </h2>
        <Link
          to={createPageUrl("VendorMarketplace")}
          className="text-[12.5px] text-gold-text dark:text-gold-dark hover:underline whitespace-nowrap"
        >
          {`See all ${totalCount}`}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5">
        {items.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            reviews={allReviews.filter((r) => r.vendor_id === vendor.id)}
          />
        ))}
      </div>
    </section>
  );
}