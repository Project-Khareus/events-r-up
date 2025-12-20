import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Calendar as CalendarIcon, MapPin, 
  ChevronDown, Crosshair, MonitorPlay, Navigation 
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  
  // Location state: type can be 'all', 'online', 'coords', 'named'
  const [locationState, setLocationState] = useState({ 
    type: 'all', 
    label: 'Choose a location',
    lat: null, 
    lng: null 
  });

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

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.EventListing.list('-created_date', 50),
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Filter approved events or pending events owned by the current user
  const approvedEvents = useMemo(() => {
    return events.filter(e => 
      e.status === 'approved' || 
      !e.status || 
      (user && e.created_by === user.email)
    );
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
    return approvedEvents.filter(event => {
      // 1. Search Filter
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        event.location_address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Theme Filter
      const matchesTheme = selectedTheme === "All" || event.theme === selectedTheme;
      
      // 3. Location Filter
      let matchesLocation = true;
      
      if (locationState.type === 'online') {
        // Assume online events might have "Online" in address or specific flag (schema doesn't have is_online, so checking address/title)
        matchesLocation = event.location_address?.toLowerCase().includes('online') || event.title?.toLowerCase().includes('webinar');
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
  }, [approvedEvents, searchQuery, selectedTheme, locationState]);

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header - Sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
          
          {/* Location Picker Header Row */}
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Browsing events in</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-indigo-600 font-bold text-lg hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-indigo-100">
                  {locationState.label}
                  <ChevronDown className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2">
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
          <div className="flex gap-2 overflow-x-auto pb-1 mt-4 no-scrollbar items-center">
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
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-serif">
              {selectedTheme === "All" ? "Events in " : `${selectedTheme} events in `}
              <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4 decoration-4">
                {locationState.label === 'Choose a location' ? 'All Locations' : locationState.label}
              </span>
            </h1>
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
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-32 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm mb-6">
               <CalendarIcon className="h-10 w-10 text-slate-400" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-3">No events found</h3>
             <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find any matches for your search. Try different keywords or browse all categories.</p>
             <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => {setSearchQuery(""); setSelectedTheme("All");}}>Clear Filters</Button>
                <Link to={createPageUrl("CreateEvent")}>
                  <Button>Create an Event</Button>
                </Link>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}