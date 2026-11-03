import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";
import { Heart, Loader2, Calendar, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "../components/events/EventCard";
import VendorCard from "../components/marketplace/VendorCard";
import { Skeleton } from "@/components/ui/skeleton";



export default function MyFavorites() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // 1. Fetch user's favorites (RLS filters by user_id automatically)
  const { data: favorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['myFavorites', user?.id],
    queryFn: () => base44.entities.Favorite.list('-created_date', 100),
    enabled: !!user,
    staleTime: 60000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const eventFavorites = favorites.filter(f => f.item_type === 'event');
  const vendorFavorites = favorites.filter(f => f.item_type === 'vendor');

  // 2. Fetch the actual events for event favorites
  const eventIds = eventFavorites.map(f => f.event_id).filter(Boolean);
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['favoritedEvents', eventIds],
    queryFn: async () => {
      const results = await Promise.all(
        eventIds.map(id => base44.entities.EventListing.filter({ id }).then(r => r[0] || null).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: eventIds.length > 0,
    staleTime: 300000,
  });

  // 3. Fetch the actual vendors for vendor favorites
  const vendorIds = vendorFavorites.map(f => f.vendor_id).filter(Boolean);
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ['favoritedVendors', vendorIds],
    queryFn: async () => {
      const results = await Promise.all(
        vendorIds.map(id => base44.entities.Vendor.filter({ id }).then(r => r[0] || null).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: vendorIds.length > 0,
    staleTime: 300000,
  });

  const isLoading = isLoadingFavorites || 
    (eventFavorites.length > 0 && isLoadingEvents) || 
    (vendorFavorites.length > 0 && isLoadingVendors);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#1B1714] px-6">
        <div className="text-center max-w-sm">
          <Heart className="h-8 w-8 text-gold mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-ink dark:text-[#F1E8E0] mb-2">Log in to see your picks</h2>
          <p className="text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)] mb-6">Save vendors and events while you browse, then compare them here.</p>
          <Link to={createPageUrl("Join")}>
            <Button className="rounded-none bg-gold hover:bg-gold-text text-cream uppercase tracking-[0.12em] text-xs h-11 px-6">Log in</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] }),
      queryClient.invalidateQueries({ queryKey: ['allVendorFavorites'] }),
      queryClient.invalidateQueries({ queryKey: ['allEventFavorites'] }),
      queryClient.invalidateQueries({ queryKey: ['favoritedEvents'] }),
      queryClient.invalidateQueries({ queryKey: ['favoritedVendors'] }),
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}><div className="min-h-screen bg-cream dark:bg-[#1B1714] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-text dark:text-gold-dark mb-3">Saved</p>
          <h1 className="font-serif text-4xl md:text-5xl text-ink dark:text-[#F1E8E0]">My Picks</h1>
          <p className="mt-2 text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)]">Vendors and events you've saved to compare.</p>
          <div className="mt-6 h-px w-16 bg-gold" />
        </div>

        {isLoading ? (
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="h-80 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                 <Skeleton className="h-40 w-full rounded-lg" />
                 <Skeleton className="h-6 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
               </div>
             ))}
           </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 px-6 bg-linen dark:bg-[#221D19] border border-[rgba(59,50,43,0.16)] dark:border-[rgba(241,232,224,0.14)]">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold/40 mb-4">
              <Heart className="h-6 w-6 text-gold" />
            </div>
            <h3 className="font-serif text-2xl text-ink dark:text-[#F1E8E0] mb-2">Nothing saved yet</h3>
            <p className="text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)] mb-6 max-w-md mx-auto">
              Tap the heart on any vendor or event to save it here, then compare your favourites side by side.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl("VendorMarketplace")}>
                <Button className="bg-gold hover:bg-gold-text">
                  <Store className="mr-2 h-4 w-4" />
                  Browse Vendors
                </Button>
              </Link>
              <Link to={createPageUrl("PublicEvents")}>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Browse Events
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="vendors" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="vendors">
                Vendors ({vendors.length})
              </TabsTrigger>
              <TabsTrigger value="events">
                Events ({events.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vendors" className="space-y-6">
              {vendors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No favorite vendors yet</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {vendors.map(vendor => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No favorite events yet</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div></PullToRefresh>
  );
}