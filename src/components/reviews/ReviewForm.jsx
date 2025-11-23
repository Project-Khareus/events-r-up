import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";

export default function ReviewForm({ vendorId, vendorName }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [eventType, setEventType] = useState("");

  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.Review.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', vendorId] });
      setRating(0);
      setReviewText("");
      setReviewerName("");
      setEventType("");
      toast.success("Review submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit review. Please try again.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }

    createReviewMutation.mutate({
      vendor_id: vendorId,
      rating,
      review_text: reviewText,
      reviewer_name: reviewerName || "Anonymous",
      event_type: eventType
    });
  };

  return (
    <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Write a Review</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <Label className="text-base mb-3 block">Your Rating *</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-slate-600 mt-2">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <Label htmlFor="review-text" className="text-base mb-3 block">
            Your Review *
          </Label>
          <Textarea
            id="review-text"
            placeholder={`Tell others about your experience with ${vendorName}...`}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="min-h-32 resize-none rounded-xl"
            required
          />
        </div>

        {/* Reviewer Name */}
        <div>
          <Label htmlFor="reviewer-name" className="text-base mb-3 block">
            Your Name (optional)
          </Label>
          <Input
            id="reviewer-name"
            placeholder="Enter your name"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Event Type */}
        <div>
          <Label htmlFor="event-type" className="text-base mb-3 block">
            Event Type (optional)
          </Label>
          <Input
            id="event-type"
            placeholder="e.g., Wedding, Corporate Event, Birthday Party"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={createReviewMutation.isPending}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl h-12 text-base font-medium shadow-lg shadow-indigo-200"
        >
          {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Card>
  );
}