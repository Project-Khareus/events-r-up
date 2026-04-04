import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Calendar as CalendarIcon, MapPin, 
  ChevronDown, Crosshair, MonitorPlay, Navigation, Loader2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EventCard from "../components/events/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const THEMES = ["All", "Music", "Food & Drink", "Business", "Arts & Culture", "Sports", "Community", "Party", "Other"];

// Haversine formula to calculate distance between two points in km
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default function Classifieds() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [page, setPage] = useState(1);
  const eventsPerPage = 24;
  
  // Location state: type can be 'all', 'online', 'coords', 'named'
  const [locationState, setLocationState] = useState({ 
    type: 'all', 
    label: 'Choose a location',
    lat: null, 
    lng: null 
  });
  const [locationInput, setLocationInput] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const debugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

  useEffect(() => {
    if (!debugMode) return;
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        console.log('[Debug] isAuthenticated:', isAuth);
        if (isAuth) {
          const me = await base44.auth.me();
          console.log('[Debug] me:', me);
        }
        const schema = await base44.entities.EventListing.schema();
        console.log('[Debug] EventListing schema:', schema);
      } catch (e) {
        console.log('[Debug] Error getting debug info', e);
      }
    })();
  }, [debugMode]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    staleTime: 300000,
  });

  const { data: events = [], isLoading, isFetching } = useQuery({
    queryKey: ['events', page],
    queryFn: async () => {
      return await base44.entities.EventListing.list('-event_date', eventsPerPage * page);
    },
    staleTime: 600000, // 10 minutes
    cacheTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    keepPreviousData: true, // Keep old data while fetching new
  });

  // Filter approved events or pending events owned by the current user, and exclude past events
  const approvedEvents = useMemo(() => {
    const now = new Date();
    return events.filter(e => {
      // Only show approved events publicly, or pending/no-status events owned by the current user
      const isApproved = e.status === 'approved' || 
        (!e.status && user && e.created_by === user.email) ||
        (e.status === 'pending' && user && e.created_by === user.email);
      const eventDate = e.event_date ? new Date(e.event_date) : null;
      const isUpcoming = !eventDate || eventDate >= now;
      return isApproved && isUpcoming;
    });
  }, [events, user]);


  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          type: 'coords',
          label: 'Current Location',
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success("Location found!");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to retrieve your location");
      }
    );
  };

  const filteredEvents = useMemo(() => {
    const filtered = approvedEvents.filter(event => {
      // 1. Search Filter
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        event.location_address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Theme Filter
      const matchesTheme = selectedTheme === "All" || event.theme === selectedTheme;
      
      // 3. Location Filter
      let matchesLocation = true;
      
      if (locationState.type === 'online') {
        matchesLocation = event.location_address?.toLowerCase().includes('online') || event.title?.toLowerCase().includes('webinar');
      } else if (locationState.type === 'named') {
        const query = locationState.label.toLowerCase();
        matchesLocation = event.location_address?.toLowerCase().includes(query) ||
          event.title?.toLowerCase().includes(query);
      } else if (locationState.type === 'coords' && locationState.lat && locationState.lng) {
        // 100km radius filter
        if (event.location_lat && event.location_lng) {
          const distance = getDistanceFromLatLonInKm(
            locationState.lat, 
            locationState.lng, 
            event.location_lat, 
            event.location_lng
          );
          matchesLocation = distance <= 100;
        } else {
          // Keep events with no coords if filtering by coords? 
          // Usually better to hide them or put them at the end, but strict filtering is safer for "near me"
          matchesLocation = false; 
        }
      }
      
      return matchesSearch && matchesTheme && matchesLocation;
    });
    
    // Sort by event_date ascending (soonest first)
    return filtered.sort((a, b) => {
      const dateA = a.event_date ? new Date(a.event_date) : new Date('9999-12-31');
      const dateB = b.event_date ? new Date(b.event_date) : new Date('9999-12-31');
      return dateA - dateB;
    });
  }, [approvedEvents, searchQuery, selectedTheme, locationState]);

  // Fallbacks: always show something
  const { displayEvents, usingFallback } = useMemo(() => {
    if (filteredEvents.length > 0) {
      return { displayEvents: filteredEvents, usingFallback: false };
    }

    // Prefer upcoming approved events first
    const now = new Date();
    const parseDate = (d) => {
      const t = d ? new Date(d) : null;
      return isNaN(t?.getTime?.()) ? null : t;
    };

    const upcoming = approvedEvents
      .filter(e => {
        const dt = parseDate(e.event_date);
        return !dt || dt >= now; // keep undated or future
      })
      .sort((a, b) => {
        const da = parseDate(a.event_date);
        const db = parseDate(b.event_date);
        if (!da && !db) return 0;
        if (!da) return 1; // undated go last
        if (!db) return -1;
        return da - db; // soonest first
      });

    if (upcoming.length > 0) {
      return { displayEvents: upcoming, usingFallback: true };
    }

    // Last resort: all approved events
    return { displayEvents: approvedEvents, usingFallback: true };
  }, [filteredEvents, approvedEvents]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['events']);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-white">
      {/* Search Header - Sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
          
          {/* Location Picker Header Row */}
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Browsing events in</span>
            <DropdownMenu open={locationDropdownOpen} onOpenChange={setLocationDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-indigo-600 font-bold text-lg hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-indigo-100">
                  {locationState.label}
                  <ChevronDown className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2">
                {/* Custom location input */}
                <div className="p-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Type a city or region..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && locationInput.trim()) {
                          setLocationState({ type: 'named', label: locationInput.trim(), lat: null, lng: null });
                          setLocationInput("");
                          setLocationDropdownOpen(false);
                        }
                      }}
                      className="pl-9 h-10 text-sm rounded-lg"
                    />
                  </div>
                  {locationInput.trim() && (
                    <button
                      onClick={() => {
                        setLocationState({ type: 'named', label: locationInput.trim(), lat: null, lng: null });
                        setLocationInput("");
                        setLocationDropdownOpen(false);
                      }}
                      className="w-full mt-2 flex items-center gap-2 p-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Search className="h-4 w-4" />
                      Search "{locationInput.trim()}"
                    </button>
                  )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer text-indigo-600 font-medium focus:text-indigo-700 focus:bg-indigo-50"
                  onClick={handleUseCurrentLocation}
                >
                  <Crosshair className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span>Use my current location</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setLocationState({ type: 'online', label: 'Online Events', lat: null, lng: null })}
                >
                  <MonitorPlay className="h-5 w-5 text-slate-500" />
                  <span>Browse online events</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setLocationState({ type: 'all', label: 'All Locations', lat: null, lng: null })}
                >
                  <Navigation className="h-5 w-5 text-slate-500" />
                  <span>All Locations</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
             {/* Search */}
             <div className="relative flex-1 w-full max-w-2xl">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
               <Input 
                 placeholder={`Search events in ${locationState.label === 'Choose a location' ? 'all locations' : locationState.label}`}
                 className="pl-11 h-12 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-full text-base"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             
             {/* Right Side Actions */}
             <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <Link to={createPageUrl("CreateEvent")}>
                   <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-medium">
                     <Plus className="h-4 w-4 mr-2" />
                     Create Event
                   </Button>
                </Link>
             </div>
          </div>
          
          {/* Categories / Filters */}
          <div className="flex gap-2 overflow-x-auto py-2 mt-4 no-scrollbar items-center">
            {THEMES.map(theme => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTheme === theme 
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' 
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
            <h6 className={`${locationState.label === 'Choose a location' ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'} font-bold text-slate-900 font-serif`}>
              {selectedTheme === "All" ? "Events in " : `${selectedTheme} events in `}
              <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4 decoration-4">
                {locationState.label === 'Choose a location' ? 'All Locations' : locationState.label}
              </span>
            </h6>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/2] w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {usingFallback && (
              <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-indigo-800">
                No events near {locationState.label === 'Choose a location' ? 'your area' : locationState.label}. Showing upcoming events instead.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {displayEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {displayEvents.length >= eventsPerPage * page && (
              <div className="flex justify-center mt-10">
                <Button 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={isFetching}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Events'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    {debugMode && (
      <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur border border-slate-200 shadow-lg rounded-lg p-3 text-xs text-slate-700">
        <div className="font-semibold mb-1">Debug: Events</div>
        <div>User: {user?.email || 'guest'}</div>
        <div>Total fetched: {events?.length || 0}</div>
        <div>Approved after filter: {approvedEvents?.length || 0}</div>
        <div>After UI filters: {filteredEvents?.length || 0}</div>
        <div>Fallback active: {usingFallback ? 'yes' : 'no'}</div>
      </div>
    )}
      </div>
    </PullToRefresh>
  );
}