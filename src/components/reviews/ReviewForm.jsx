import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Star, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReviewForm({ vendorId, vendorName }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [eventType, setEventType] = useState("");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setReviewerName(currentUser.full_name || "");
      }
    };
    checkAuth();
  }, []);

  // Check if user has a confirmed or completed booking with this vendor
  const { data: bookings = [] } = useQuery({
    queryKey: ['user-bookings', vendorId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const allBookings = await base44.entities.Booking.list('-created_date', 500);
        return allBookings.filter(b => 
          b.vendor_id === vendorId && 
          (b.status === "confirmed" || b.status === "completed") &&
          (b.user_id === user.id || b.created_by === user.email)
        );
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Check if user already reviewed this vendor
  const { data: existingReviews = [] } = useQuery({
    queryKey: ['user-review', vendorId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const allReviews = await base44.entities.Review.list('-created_date', 500);
        return allReviews.filter(r => 
          r.vendor_id === vendorId && 
          r.created_by === user.email
        );
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const hasCompletedBooking = bookings.length > 0;
  const hasAlreadyReviewed = existingReviews.length > 0;

  console.log('Review eligibility check:', {
    isAuthenticated,
    userId: user?.id,
    vendorId,
    bookingsCount: bookings.length,
    hasCompletedBooking,
    existingReviewsCount: existingReviews.length,
    hasAlreadyReviewed
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.Review.create(reviewData),
    onSuccess: async (review) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', vendorId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
      // Update vendor rating
      try {
        await base44.functions.invoke('updateVendorRating', { vendorId });
      } catch (error) {
        console.error('Failed to update vendor rating:', error);
      }
      
      // Send email notification to vendor
      try {
        await base44.functions.invoke('notifyNewReview', { reviewId: review.id });
      } catch (error) {
        console.error('Failed to send review notification:', error);
      }
      
      setRating(0);
      setReviewText("");
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
      reviewer_name: reviewerName || user?.full_name || "Anonymous",
      event_type: eventType
    });
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="p-8 rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sign In to Review</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            You must be signed in to leave a review.
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </Button>
        </div>
      </Card>
    );
  }

  // Already reviewed
  if (hasAlreadyReviewed) {
    return (
      <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Thank You!</h2>
          <p className="text-slate-600">
            You have already submitted a review for this vendor.
          </p>
        </div>
      </Card>
    );
  }

  // No confirmed/completed booking
  if (!hasCompletedBooking) {
    return (
      <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verified Reviews Only</h2>
          <p className="text-slate-600">
            Only customers who have confirmed or completed bookings with this vendor can leave a review.
            This ensures all reviews are from genuine customers.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Verified Purchase</span>
      </div>
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
            Your Name
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