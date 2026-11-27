import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import EventsCalendar from "../components/events/EventsCalendar";
import { addMonths, format, startOfMonth, startOfToday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const VIEWS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "calendar", label: "Calendar" },
  { key: "past", label: "Past events" },
];

const initialView = () => {
  if (typeof window === "undefined") return "upcoming";
  const v = new URLSearchParams(window.location.search).get("view");
  return VIEWS.some((x) => x.key === v) ? v : "upcoming";
};

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
  return R * c; // Distance in km
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default function PublicEvents() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [page, setPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const eventsPerPage = 24;
  const [view, setView] = useState(initialView);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  // event_date is stored as a local "yyyy-MM-ddTHH:mm" string; anything from today on counts as upcoming
  const today = format(startOfToday(), "yyyy-MM-dd");

  const changeView = (next) => {
    setView(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "upcoming") params.delete("view"); else params.set("view", next);
    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  };
  
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

  // Upcoming: from today on, soonest first (pending events are kept for their owner below)
  const { data: events = [], isLoading, isFetching } = useQuery({
    queryKey: ['events', 'upcoming', today, page],
    queryFn: async () => {
      return await base44.entities.EventListing.filter({ event_date: { $gte: today } }, 'event_date', eventsPerPage * page);
    },
    staleTime: 600000, // 10 minutes
    cacheTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    keepPreviousData: true, // Keep old data while fetching new
  });

  // Past: approved events before today, most recent first
  const { data: pastEvents = [], isLoading: pastLoading, isFetching: pastFetching } = useQuery({
    queryKey: ['events', 'past', today, pastPage],
    queryFn: () => base44.entities.EventListing.filter({ status: 'approved', event_date: { $lt: today } }, '-event_date', eventsPerPage * pastPage),
    enabled: view === 'past',
    staleTime: 600000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  // Calendar: approved events in the month on screen
  const monthStart = format(calendarMonth, "yyyy-MM-dd");
  const { data: monthEvents = [], isLoading: monthLoading } = useQuery({
    queryKey: ['events', 'month', monthStart],
    queryFn: () => base44.entities.EventListing.filter(
      { status: 'approved', event_date: { $gte: monthStart, $lt: format(addMonths(calendarMonth, 1), "yyyy-MM-dd") } },
      'event_date',
      500
    ),
    enabled: view === 'calendar',
    staleTime: 600000,
    refetchOnWindowFocus: false,
  });

  // Filter approved events or pending events owned by the current user, and exclude past events
  const approvedEvents = useMemo(() => {
    return events.filter(e => {
      // Only show approved events publicly, or pending/no-status events owned by the current user
      const isApproved = e.status === 'approved' || 
        (!e.status && user && e.created_by === user.email) ||
        (e.status === 'pending' && user && e.created_by === user.email);
      const eventDate = e.event_date ? new Date(e.event_date) : null;
      const isUpcoming = !eventDate || eventDate >= startOfToday();
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

  // Search, theme and location filters, shared by every view
  const matchesFilters = useCallback((event) => {
      // 1. Search Filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        (event.title || "").toLowerCase().includes(q) ||
        (event.location_address || "").toLowerCase().includes(q);
      
      // 2. Theme filter
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
  }, [searchQuery, selectedTheme, locationState]);

  const filteredPastEvents = useMemo(() => pastEvents.filter(matchesFilters), [pastEvents, matchesFilters]);
  const filteredMonthEvents = useMemo(() => monthEvents.filter(matchesFilters), [monthEvents, matchesFilters]);

  const filteredEvents = useMemo(() => {
    const filtered = approvedEvents.filter(matchesFilters);

    // Sort by event_date ascending (soonest first)
    return filtered.sort((a, b) => {
      const dateA = a.event_date ? new Date(a.event_date) : new Date('9999-12-31');
      const dateB = b.event_date ? new Date(b.event_date) : new Date('9999-12-31');
      return dateA - dateB;
    });
  }, [approvedEvents, matchesFilters]);

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
      <div className="min-h-screen bg-cream dark:bg-[#1B1714] text-ink dark:text-[#F1E8E0]">
      {/* Search Header - Sticky */}
      <div className="sticky top-0 z-30 bg-cream/95 dark:bg-[#1B1714]/95 backdrop-blur-md border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
          
          {/* Location Picker Header Row */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[13px] text-ink/50 dark:text-[#F1E8E0]/50">Browsing events in</span>
            <DropdownMenu open={locationDropdownOpen} onOpenChange={setLocationDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 font-medium text-xl text-gold-text dark:text-gold-dark px-2 py-1.5 rounded-none transition-colors outline-none hover:text-ink dark:hover:text-cream">
                  {locationState.label}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2 rounded-none bg-linen dark:bg-[#221D19] border-[rgba(59,50,43,0.14)]">
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
                      className="pl-9 h-10 text-sm rounded-none bg-transparent"
                    />
                  </div>
                  {locationInput.trim() && (
                    <button
                      onClick={() => {
                        setLocationState({ type: 'named', label: locationInput.trim(), lat: null, lng: null });
                        setLocationInput("");
                        setLocationDropdownOpen(false);
                      }}
                      className="w-full mt-2 flex items-center gap-2 p-2 text-sm text-gold-text dark:text-gold-dark rounded-none transition-colors hover:text-ink dark:hover:text-cream"
                    >
                      <Search className="h-4 w-4" />
                      Search "{locationInput.trim()}"
                    </button>
                  )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-none text-gold-text dark:text-gold-dark"
                  onClick={handleUseCurrentLocation}
                >
                  <Crosshair className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Use my current location</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setLocationState({ type: 'online', label: 'Online Events', lat: null, lng: null })}
                >
                  <MonitorPlay className="h-4 w-4 text-gold" />
                  <span>Browse online events</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setLocationState({ type: 'all', label: 'All Locations', lat: null, lng: null })}
                >
                  <Navigation className="h-4 w-4 text-gold" />
                  <span>All Locations</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
             {/* Search */}
             <div className="relative flex-1 w-full max-w-2xl">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
               <Input 
                 placeholder={`Search events in ${locationState.label === 'Choose a location' ? 'all locations' : locationState.label}`}
                 className="pl-11 h-12 bg-transparent border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] focus-visible:ring-0 focus-visible:border-gold rounded-none text-base"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             
             {/* Right Side Actions */}
             <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <Link to={createPageUrl("CreateEvent")}>
                   <Button className="rounded-none h-12 px-6 bg-ink hover:bg-ink-deep text-cream text-[13px]">
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
                className={`px-4 py-2 min-h-[44px] rounded-none text-[13px] whitespace-nowrap transition-colors border ${
                  selectedTheme === theme 
                    ? 'bg-ink text-cream border-ink dark:bg-cream dark:text-ink dark:border-cream' 
                    : 'bg-transparent text-ink/70 dark:text-[#F1E8E0]/70 border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] hover:text-gold-text dark:hover:text-gold-dark'
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
        <div className="mb-6">
            <h6 className={`${locationState.label === 'Choose a location' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-medium leading-tight`}>
              {view === 'past' ? 'Past ' : ''}
              {selectedTheme === "All" ? (view === 'past' ? "events in " : "Events in ") : `${selectedTheme} events in `}
              <span className="text-gold-text dark:text-gold-dark">
                {locationState.label === 'Choose a location' ? 'All Locations' : locationState.label}
              </span>
            </h6>
        </div>

        {/* Upcoming / Calendar / Past */}
        <div role="tablist" aria-label="Event views" className="mb-8 inline-flex border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => changeView(key)}
              className={`px-4 sm:px-5 min-h-[44px] text-[13px] whitespace-nowrap transition-colors ${
                view === key
                  ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                  : 'text-ink/70 dark:text-[#F1E8E0]/70 hover:text-gold-text dark:hover:text-gold-dark'
              }`}
            >
              {key === 'calendar' && <CalendarIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />}
              {label}
            </button>
          ))}
        </div>

        {view === 'calendar' && (
          <EventsCalendar
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            events={filteredMonthEvents}
            isLoading={monthLoading}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        )}

        {view === 'past' && (
          pastLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/2] w-full rounded-none" />
                  <Skeleton className="h-6 w-3/4 rounded-none" />
                  <Skeleton className="h-4 w-1/2 rounded-none" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredPastEvents.length === 0 ? (
                <p className="border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#221D19] px-4 py-6 text-sm text-ink/70 dark:text-[#F1E8E0]/70">
                  No past events match these filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {filteredPastEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
              {pastEvents.length >= eventsPerPage * pastPage && (
                <div className="flex justify-center mt-10">
                  <Button
                    onClick={() => setPastPage(p => p + 1)}
                    disabled={pastFetching}
                    className="rounded-none h-12 px-8 bg-ink hover:bg-ink-deep text-cream text-[13px]"
                  >
                    {pastFetching ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>) : 'Load More Past Events'}
                  </Button>
                </div>
              )}
            </>
          )
        )}

        {view === 'upcoming' && (
          <>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/2] w-full rounded-none" />
                <Skeleton className="h-6 w-3/4 rounded-none" />
                <Skeleton className="h-4 w-1/2 rounded-none" />
                <Skeleton className="h-4 w-1/4 rounded-none" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {usingFallback && (
              <div className="mb-6 rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#221D19] px-4 py-3 text-sm text-ink/70 dark:text-[#F1E8E0]/70">
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
                  className="rounded-none h-12 px-8 bg-ink hover:bg-ink-deep text-cream text-[13px]"
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