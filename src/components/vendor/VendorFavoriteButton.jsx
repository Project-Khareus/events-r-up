import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Hook to fetch ALL of user's vendor favorites ONCE (shared across all buttons)
function useAllVendorFavorites() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 600000,
  });

  const { data: allFavorites = [] } = useQuery({
    queryKey: ['allVendorFavorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ item_type: 'vendor' }),
    enabled: !!user,
    staleTime: 300000,
    retry: 2,
    retryDelay: 2000,
  });

  return { user, allFavorites };
}

export default function VendorFavoriteButton({ vendorId, className, variant = "outline", size = "icon" }) {
  const queryClient = useQueryClient();
  const { user, allFavorites } = useAllVendorFavorites();

  const myFavorite = allFavorites.find(f => f.vendor_id === vendorId);
  const isFavorited = !!myFavorite;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      console.log("Favorite toggle clicked", { user: user?.id, vendorId, isFavorited, myFavorite: myFavorite?.id });
      if (!user) {
        throw new Error("login");
      }
      if (isFavorited) {
        console.log("Deleting favorite", myFavorite.id);
        await base44.entities.Favorite.delete(myFavorite.id);
        return { action: 'removed' };
      } else {
        console.log("Creating favorite", { user_id: user.id, vendor_id: vendorId, item_type: 'vendor' });
        const result = await base44.entities.Favorite.create({
          user_id: user.id,
          vendor_id: vendorId,
          item_type: 'vendor'
        });
        console.log("Favorite created", result);
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['allVendorFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      toast.success(result.action === 'added' ? "Added to favorites!" : "Removed from favorites");
    },
    onError: (err) => {
      if (err.message === "login") {
        toast("Please log in to save favorites");
        base44.auth.redirectToLogin(window.location.href);
      } else {
        toast.error("Could not update favorite. Please try again.");
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
      <Heart className={cn("h-5 w-5 transition-transform", isFavorited && "fill-current scale-110")} />
    </Button>
  );
}