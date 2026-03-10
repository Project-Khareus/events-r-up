import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function FavoriteButton({ eventId, className, variant = "outline", size = "icon" }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['eventFavorites', eventId, user?.id],
    queryFn: () => base44.entities.Favorite.filter({ event_id: eventId, item_type: 'event' }),
    enabled: !!user && !!eventId,
  });

  const myFavorite = favorites[0];
  const isFavorited = !!myFavorite;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please log in to favorite events");
      }
      if (isFavorited) {
        await base44.entities.Favorite.delete(myFavorite.id);
        return { action: 'removed' };
      } else {
        await base44.entities.Favorite.create({
          user_id: user.id,
          event_id: eventId,
          item_type: 'event'
        });
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['eventFavorites', eventId] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      if (result.action === 'added') {
        toast.success("Added to your favorites!", { icon: "❤️" });
      } else {
        toast("Removed from favorites", { icon: "💔" });
      }
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
        "transition-all duration-200 relative overflow-hidden",
        isFavorited ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-red-200" : "text-slate-400 hover:text-red-500",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMutation.mutate();
      }}
      disabled={toggleMutation.isPending}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isFavorited ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="flex items-center justify-center"
        >
          <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}