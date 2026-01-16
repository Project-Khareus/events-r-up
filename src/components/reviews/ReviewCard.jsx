import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { format } from "date-fns";

export default function ReviewCard({ review }) {
  return (
    <Card className="p-6 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">
              {review.reviewer_name || "Anonymous"}
            </h4>
            <p className="text-sm text-slate-500">
              {format(new Date(review.created_date), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full shrink-0">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-slate-900">{review.rating}</span>
        </div>
      </div>

      {review.event_type && (
        <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50">
          {review.event_type}
        </Badge>
      )}

      <p className="text-slate-700 leading-relaxed">{review.review_text}</p>
    </Card>
  );
}