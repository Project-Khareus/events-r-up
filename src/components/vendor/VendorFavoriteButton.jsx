import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorFavoriteButton({ vendorId, className, variant = "outline", size = "icon" }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 600000,
  });

  const { data: allFavorites = [] } = useQuery({
    queryKey: ['allVendorFavorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ item_type: 'vendor' }),
    enabled: !!user,
    staleTime: 30000,
    retry: 2,
  });

  const myFavorite = allFavorites.find(f => f.vendor_id === vendorId);
  const isFavorited = !!myFavorite;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("login");
      }
      if (isFavorited) {
        await base44.entities.Favorite.delete(myFavorite.id);
        return { action: 'removed', id: myFavorite.id };
      } else {
        const result = await base44.entities.Favorite.create({
          user_id: user.id,
          vendor_id: vendorId,
          item_type: 'vendor'
        });
        return { action: 'added', record: result };
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['allVendorFavorites', user?.id] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['allVendorFavorites', user?.id]);
      
      // Optimistic update
      queryClient.setQueryData(['allVendorFavorites', user?.id], (old = []) => {
        if (isFavorited) {
          return old.filter(f => f.vendor_id !== vendorId);
        } else {
          return [...old, { vendor_id: vendorId, user_id: user.id, item_type: 'vendor', id: 'temp_' + vendorId }];
        }
      });
      
      return { previous };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['allVendorFavorites', user?.id], context.previous);
      }
      if (err.message === "login") {
        toast("Please log in to save favorites");
        base44.auth.redirectToLogin(window.location.href);
      } else {
        toast.error("Could not update favorite. Please try again.");
      }
    },
    onSuccess: (result) => {
      toast.success(result.action === 'added' ? "Added to favorites!" : "Removed from favorites");
    },
    onSettled: () => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey: ['allVendorFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
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