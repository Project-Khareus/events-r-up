import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VendorCard from "../marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function RelatedVendors({ currentVendorId, category, eventType, compact = false }) {
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const relatedVendors = vendors.filter(v => 
    v.id !== currentVendorId && 
    (v.category === category || v.event_type === eventType)
  ).slice(0, compact ? 2 : 4);

  if (isLoading) {
    return (
      <div className={compact ? "mt-4" : "mt-16"}>
        {!compact && <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Similar Vendors</h2>}
        <div className={compact ? "space-y-4" : "grid md:grid-cols-2 lg:grid-cols-4 gap-6"}>
          {[1, 2].map((i) => (
            <Skeleton key={i} className={compact ? "h-64 rounded-xl" : "h-80 rounded-2xl"} />
          ))}
        </div>
      </div>
    );
  }

  if (relatedVendors.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-4">
        {relatedVendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-16 border-t border-slate-200 dark:border-slate-700 pt-12">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Similar Vendors You May Like</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedVendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </div>
  );
}