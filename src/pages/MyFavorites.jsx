import React, { useMemo } from "react";
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

// Helper to handle potential nested data structure
const normalizeData = (item) => {
  if (!item) return null;
  return item.data ? { id: item.id, ...item.data } : item;
};

export default function MyFavorites() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // 1. Fetch user's favorites
  const { data: rawFavorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['myFavorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        // RLS already filters by user_id, so just list all (which returns only user's favorites)
        const favorites = await base44.entities.Favorite.list('-created_date', 100);
        console.log('Raw favorites fetched:', favorites);
        console.log('User ID:', user.id);
        console.log('Normalized favorites:', favorites.map(normalizeData));
        return favorites;
      } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  const favorites = useMemo(() => rawFavorites.map(normalizeData), [rawFavorites]);

  // Separate favorites by type (handle legacy favorites without item_type)
  const eventFavorites = favorites.filter(f => f.item_type === 'event' || (f.event_id && !f.item_type));
  const vendorFavorites = favorites.filter(f => f.item_type === 'vendor' || (f.vendor_id && !f.item_type));

  // 2. Fetch the actual events for event favorites
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['favoritedEvents', eventFavorites],
    queryFn: async () => {
      if (eventFavorites.length === 0) return [];
      
      const eventPromises = eventFavorites.map(async (fav) => {
        if (!fav || !fav.event_id) return null;
        try {
          const results = await base44.entities.EventListing.filter({ id: fav.event_id });
          if (results && results.length > 0) {
            return normalizeData(results[0]);
          }
          return null;
        } catch (err) {
          console.error("Error fetching event", fav.event_id, err);
          return null;
        }
      });
      
      const results = await Promise.all(eventPromises);
      return results.filter(e => !!e);
    },
    enabled: eventFavorites.length > 0,
  });

  // 3. Fetch the actual vendors for vendor favorites
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ['favoritedVendors', vendorFavorites],
    queryFn: async () => {
      if (vendorFavorites.length === 0) return [];
      
      const vendorPromises = vendorFavorites.map(async (fav) => {
        if (!fav || !fav.vendor_id) return null;
        try {
          const results = await base44.entities.Vendor.filter({ id: fav.vendor_id });
          if (results && results.length > 0) {
            return normalizeData(results[0]);
          }
          return null;
        } catch (err) {
          console.error("Error fetching vendor", fav.vendor_id, err);
          return null;
        }
      });
      
      const results = await Promise.all(vendorPromises);
      return results.filter(v => !!v);
    },
    enabled: vendorFavorites.length > 0,
  });

  const isLoading = isLoadingFavorites || 
    (eventFavorites.length > 0 && isLoadingEvents) || 
    (vendorFavorites.length > 0 && isLoadingVendors);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Please Log In</h2>
          <p className="text-slate-600 mb-6">You need to be logged in to view your favorites.</p>
          <Link to={createPageUrl("Join")}>
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] }),
      queryClient.invalidateQueries({ queryKey: ['favoritedEvents'] }),
      queryClient.invalidateQueries({ queryKey: ['favoritedVendors'] }),
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <Heart className="h-6 w-6 text-red-600 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Favorites</h1>
            <p className="text-slate-600">Events you've saved for later</p>
          </div>
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
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Heart className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No favorites yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Start exploring vendors and events, then tap the heart icon to save them here for easy access.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl("VendorMarketplace")}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Store className="mr-2 h-4 w-4" />
                  Browse Vendors
                </Button>
              </Link>
              <Link to={createPageUrl("Classifieds")}>
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
    </div>
  );
}