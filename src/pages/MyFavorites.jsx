import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";
import { Heart, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "../components/events/EventCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyFavorites() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // 1. Fetch user's favorites
  const { data: favorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Favorite.filter({ user_id: user.id });
    },
    enabled: !!user,
  });

  // 2. Fetch the actual events for those favorites
  // We'll fetch all events and filter in memory for simplicity in this demo,
  // or we could fetch them individually if we had a bulk get. 
  // Given standard list limits, fetching list and matching is okay for now,
  // but ideally we'd filter by IDs in the query if supported.
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['favoritedEvents', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      // Fetching all events to filter. In a real app with pagination this would be different.
      // Trying to be efficient: if we have few favorites, maybe fetch individually?
      // Let's stick to listing recent events for now to find matches.
      const allEvents = await base44.entities.EventListing.list('-created_date', 100);
      const favoriteIds = new Set(favorites.map(f => f.event_id));
      return allEvents.filter(e => favoriteIds.has(e.id));
    },
    enabled: favorites.length > 0,
  });

  const isLoading = isLoadingFavorites || (favorites.length > 0 && isLoadingEvents);

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

  return (
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
              Start exploring events and tap the heart icon to save them here for easy access.
            </p>
            <Link to={createPageUrl("Classifieds")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Calendar className="mr-2 h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}