import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FavoriteButton({ eventId, className, variant = "outline", size = "icon" }) {
  const queryClient = useQueryClient();

  // 1. Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // 2. Check if favorited
  // We fetch the user's favorites for this specific event
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', eventId],
    queryFn: async () => {
      if (!user) return [];
      // RLS ensures we only see our own, but filtering by event_id is good practice
      return base44.entities.Favorite.filter({ event_id: eventId });
    },
    enabled: !!user && !!eventId,
  });

  const myFavorite = favorites[0];
  const isFavorited = !!myFavorite;

  // 3. Mutations
  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please log in to favorite events");
      }
      if (isFavorited) {
        return base44.entities.Favorite.delete(myFavorite.id);
      } else {
        return base44.entities.Favorite.create({
          user_id: user.id,
          event_id: eventId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites', eventId]);
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
    },
    onError: (err) => {
      toast.error(err.message);
      if (err.message.includes("log in")) {
        base44.auth.redirectToLogin(window.location.href);
      }
    }
  });

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200",
        isFavorited ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-red-200" : "text-slate-400 hover:text-red-500",
        className
      )}
      onClick={(e) => {
        e.preventDefault(); // Prevent navigating if inside a link
        e.stopPropagation();
        toggleMutation.mutate();
      }}
      disabled={toggleMutation.isPending}
    >
      <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
    </Button>
  );
}