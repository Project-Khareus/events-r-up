import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import ReviewCard from "./ReviewCard";

export default function ReviewsList({ vendorId }) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', vendorId],
    queryFn: () => base44.entities.Review.filter({ vendor_id: vendorId }, '-created_date', 50),
  });

  if (isLoading) {
    return (
      <Card className="p-8 rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
        <span className="text-slate-500">({reviews.length})</span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <MessageSquare className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No reviews yet</h3>
          <p className="text-slate-600">Be the first to review this vendor!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </Card>
  );
}