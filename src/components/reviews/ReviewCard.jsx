import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ReviewCard({ review }) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
  });

  const { data: userVendors = [] } = useQuery({
    queryKey: ['userVendors', user?.id],
    queryFn: () => base44.entities.Vendor.filter({ user_id: user.id }),
    enabled: !!user?.id,
    staleTime: 300000,
  });

  const isVendorOwner = userVendors.some(v => v.id === review.vendor_id);

  const respondMutation = useMutation({
    mutationFn: async (response) => {
      await base44.entities.Review.update(review.id, {
        vendor_response: response,
        vendor_response_date: new Date().toISOString()
      });
    },
    onMutate: async (response) => {
      await queryClient.cancelQueries({ queryKey: ['reviews'] });
      await queryClient.cancelQueries({ queryKey: ['vendor_reviews'] });
      const previousReviews = queryClient.getQueryData(['reviews']);
      const previousVendorReviews = queryClient.getQueryData(['vendor_reviews']);
      // Optimistically hide form and show response
      setShowResponseForm(false);
      setResponseText("");
      return { previousReviews, previousVendorReviews, optimisticResponse: response };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['vendor_reviews'] });
      toast.success("Response posted successfully");
    },
    onError: (err, response, context) => {
      if (context?.previousReviews) queryClient.setQueryData(['reviews'], context.previousReviews);
      if (context?.previousVendorReviews) queryClient.setQueryData(['vendor_reviews'], context.previousVendorReviews);
      setShowResponseForm(true);
      setResponseText(context?.optimisticResponse || "");
      toast.error("Failed to post response");
    }
  });
  return (
    <Card className="p-6 rounded-2xl border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow dark:bg-slate-800">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              {review.reviewer_name || "Anonymous"}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {format(new Date(review.created_date), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full shrink-0">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">{review.rating}</span>
        </div>
      </div>

      {review.event_type && (
        <Badge variant="outline" className="mb-3 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30">
          {review.event_type}
        </Badge>
      )}

      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{review.review_text}</p>

      {/* Vendor Response */}
      {review.vendor_response && (
        <div className="mt-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-sm text-indigo-900 dark:text-indigo-300">Vendor Response</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              • {format(new Date(review.vendor_response_date), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{review.vendor_response}</p>
        </div>
      )}

      {/* Response Form for Vendor */}
      {isVendorOwner && !review.vendor_response && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {!showResponseForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(true)}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Respond to Review
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Thank the customer and address their feedback..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => respondMutation.mutate(responseText)}
                  disabled={!responseText.trim() || respondMutation.isLoading}
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {respondMutation.isLoading ? "Posting..." : "Post Response"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}