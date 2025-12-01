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

  // Get strictly related vendors first
  let relatedVendors = vendors.filter(v => 
    v.id !== currentVendorId && 
    (v.category === category || v.event_type === eventType)
  );

  // If we don't have enough related vendors, fill with other random vendors
  const targetCount = compact ? 4 : 8;
  
  if (relatedVendors.length < targetCount) {
    const usedIds = new Set([currentVendorId, ...relatedVendors.map(v => v.id)]);
    const otherVendors = vendors.filter(v => !usedIds.has(v.id));
    
    // Shuffle other vendors to randomize
    const shuffled = [...otherVendors].sort(() => 0.5 - Math.random());
    
    relatedVendors = [...relatedVendors, ...shuffled.slice(0, targetCount - relatedVendors.length)];
  } else {
    relatedVendors = relatedVendors.slice(0, targetCount);
  }

  if (isLoading) {
    return (
      <div className={compact ? "mt-4" : "mt-0"}>
        <div className={compact ? "space-y-4" : "grid md:grid-cols-2 lg:grid-cols-4 gap-6"}>
          {[...Array(compact ? 2 : 4)].map((_, i) => (
            <Skeleton key={i} className={compact ? "h-64 rounded-xl" : "h-80 rounded-2xl"} />
          ))}
        </div>
      </div>
    );
  }

  if (relatedVendors.length === 0) return (
    <div className="text-center py-8 text-slate-500">
      No similar vendors found at the moment.
    </div>
  );

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
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedVendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </div>
  );
}