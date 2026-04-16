import React from "react";
import VendorCard from "./VendorCard";

export default function VendorGrid({ vendors, allReviews }) {
  if (!vendors || vendors.length === 0) return null;
  
  const items = vendors.filter(Boolean);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((vendor) => (
        <div key={vendor.id}>
          <VendorCard
            vendor={vendor}
            reviews={allReviews.filter((r) => r.vendor_id === vendor.id)}
          />
        </div>
      ))}
    </div>
  );
}