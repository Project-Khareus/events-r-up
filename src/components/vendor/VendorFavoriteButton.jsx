import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const normalizeData = (item) => {
  if (!item) return null;
  return item.data ? { id: item.id, ...item.data } : item;
};

export default function VendorFavoriteButton({ vendorId, className, variant = "outline", size = "icon" }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: rawFavorites = [] } = useQuery({
    queryKey: ['vendorFavorites', vendorId],
    queryFn: async () => {
      if (!user) return [];
      try {
        const allFavorites = await base44.entities.Favorite.list();
        return allFavorites.filter(f => {
          const fav = normalizeData(f);
          return fav.vendor_id === vendorId && fav.item_type === 'vendor';
        });
      } catch (error) {
        console.error('Error fetching vendor favorites:', error);
        return [];
      }
    },
    enabled: !!user && !!vendorId,
  });

  const favorites = useMemo(() => rawFavorites.map(normalizeData), [rawFavorites]);
  const myFavorite = favorites[0];
  const isFavorited = !!myFavorite;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please log in to favorite vendors");
      }
      if (isFavorited) {
        return base44.entities.Favorite.delete(myFavorite.id);
      } else {
        return base44.entities.Favorite.create({
          user_id: user.id,
          vendor_id: vendorId,
          item_type: 'vendor'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorFavorites', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
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
        e.preventDefault();
        e.stopPropagation();
        toggleMutation.mutate();
      }}
      disabled={toggleMutation.isPending}
    >
      <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
    </Button>
  );
}