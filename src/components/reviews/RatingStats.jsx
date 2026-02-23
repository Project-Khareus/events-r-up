import React from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function RatingStats({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <Card className="p-6 rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800">
        <div className="text-center">
          <Star className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No ratings yet</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Be the first to review!</p>
        </div>
      </Card>
    );
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  // Count ratings by star level
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100
  }));

  return (
    <Card className="p-6 rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-800">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="h-10 w-10 fill-amber-400 text-amber-400" />
          <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
            {averageRating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= Math.round(averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            />
          ))}
        </div>
        <p className="text-slate-600 dark:text-slate-400">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {ratingCounts.map(({ stars, count, percentage }) => (
          <div key={stars} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-12 shrink-0">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stars}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}