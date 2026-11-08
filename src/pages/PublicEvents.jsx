import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, MapPin, ChevronDown, Crosshair, MonitorPlay, Navigation, Loader2, Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MasonryEventCard, { FALLBACK_EVENT_IMAGE, formatEventWhen } from "../components/events/MasonryEventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, addDays, startOfDay, endOfMonth } from "date-fns";

const THEMES = ["All", "Music", "Food & Drink", "Business", "Arts & Culture", "Sports", "Community", "Party", "Other"];

const DATE_FILTERS = [
  { id: "any", label: "Any date" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "This month" },
];

// Masonry layout settings
const MIN_CARD_WIDTH = 220; // px; columns are added as the screen widens
const CARD_GAP = 4; // px between cards

const CONTAINER = "w-full max-w-[2200px] mx-auto px-4 md:px-8 lg:px-12";

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

const parseDate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !isNaN(t.getTime()) ? t : null;
};

const matchesDateFilter = (event, filterId) => {
  if (filterId === "any") return true;
  const date = parseDate(event.event_date);
  if (!date) return false;
  const today = startOfDay(new Date());
  if (filterId === "today") return date < addDays(today, 1);
  if (filterId === "week") return date < addDays(today, 7);
  if (filterId === "month") return date <= endOfMonth(today);
  if (filterId === "weekend") {
    // Upcoming Friday 00:00 → Monday 00:00 (or the current weekend if we're in it)
    const day = today.getDay(); // 0 Sun … 6 Sat
    const daysToFri = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
    const start = addDays(today, daysToFri);
    const end = addDays(start, 3);
    return date >= start && date < end;
  }
  return true;
};

// Split events (already sorted soonest first) into date sections.
const groupByWeek = (events) => {
  const today = startOfDay(new Date());
  const in7 = addDays(today, 7);
  const in14 = addDays(today, 14);
  const rangeLabel = (a, b) =>
    a.getMonth() === b.getMonth()
      ? `${format(a, "d")} – ${format(b, "d MMMM")}`
      : `${format(a, "d MMM")} – ${format(b, "d MMM")}`;

  const sections = [
    { id: "week", title: "This week", range: rangeLabel(today, addDays(in7, -1)), events: [] },
    { id: "next", title: "Next week", range: rangeLabel(in7, addDays(in14, -1)), events: [] },
    { id: "later", title: "Further ahead", range: `From ${format(in14, "d MMMM")}`, events: [] },
  ];
  events.forEach((e) => {
    const d = parseDate(e.event_date);
    if (d && d < in7) sections[0].events.push(e);
    else if (d && d < in14) sections[1].events.push(e);
    else sections[2].events.push(e);
  });
  return sections.filter((s) => s.events.length > 0);
};

// Works out how many masonry columns fit the element's width.
// Returns a callback ref so it follows whichever grid element is mounted.
function useColumnCount() {
  const [el, setEl] = useState(null);
  const [count, setCount] = useState(2);
  useEffect(() => {
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      setCount(Math.max(2, Math.floor((width + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP))));
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, count];
}

// Deals cards out left to right so the soonest events stay along the top row.
function Masonry({ events, columns, startIndex = 0 }) {
  const cols = Array.from({ length: columns }, () => []);
  events.forEach((event, i) => cols[i % columns].push({ event, index: startIndex + i }));
  return (
    <div className="flex items-start" style={{ gap: CARD_GAP }}>
      {cols.map((col, c) => (
        <div key={c} className="flex-1 min-w-0 flex flex-col" style={{ gap: CARD_GAP }}>
          {col.map(({ event, index }) => (
            <MasonryEventCard key={event.id} event={event} tone={index % 4 === 2 ? "light" : "dark"} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Spotlight({ event }) {
  return (
    <section aria-label="Editor's pick" className="bg-[#1B1714] text-[#F1E8E0]">
      <div className={`${CONTAINER} py-5 md:py-10`}>
        <Link
          to={createPageUrl("EventDetail") + `?id=${event.id}`}
          className="group relative flex flex-col justify-end min-h-[260px] md:min-h-[480px] overflow-hidden bg-[#3B322B]"
        >
          <img
            src={event.image_url || FALLBACK_EVENT_IMAGE}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <span className="absolute left-3 top-3 md:left-5 md:top-5 bg-gold-dark text-[#1B1714] text-[10px] uppercase tracking-[0.24em] px-2.5 py-1.5">
            Editor’s pick
          </span>
          <div className="relative m-3 md:m-5 bg-[#1B1714] px-4 py-3 md:px-6 md:py-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-gold-dark">
                {formatEventWhen(event.event_date, "EEE d MMM · h:mm a")}
                {event.theme ? ` · ${event.theme}` : ""}
              </span>
              <h2 className="font-serif text-2xl md:text-[40px] font-medium leading-[1.05]">{event.title}</h2>
              <span className="text-xs md:text-[13px] text-[#B3A698]">{event.location_address || "Online event"}</span>
            </div>
            {event.is_paid && event.price ? (
              <span className="font-serif text-lg md:text-2xl">GH₵{event.price}</span>
            ) : null}
          </div>
        </Link>
      </div>
    </section>
  );
}

export default function PublicEvents() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [dateFilter, setDateFilter] = useState("any");
  const [page, setPage] = useState(1);
  const eventsPerPage = 48;

  // Location state: type can be 'all', 'online', 'coords', 'named'
  const [locationState, setLocationState] = useState({
    type: 'all',
    label: 'All locations',
    lat: null,
    lng: null
  });
  const [locationInput, setLocationInput] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const [gridRef, columns] = useColumnCount();

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
          label: 'Near me',
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

  const sortSoonestFirst = (list) => [...list].sort((a, b) => {
    const da = parseDate(a.event_date);
    const db = parseDate(b.event_date);
    if (!da && !db) return 0;
    if (!da) return 1; // undated go last
    if (!db) return -1;
    return da - db;
  });

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = approvedEvents.filter(event => {
      // 1. Search Filter
      const matchesSearch = !q ||
        event.title?.toLowerCase().includes(q) ||
        event.location_address?.toLowerCase().includes(q);

      // 2. Theme filter
      const matchesTheme = selectedTheme === "All" || event.theme === selectedTheme;

      // 3. Date filter
      const matchesDate = matchesDateFilter(event, dateFilter);

      // 4. Location Filter
      let matchesLocation = true;

      if (locationState.type === 'online') {
        matchesLocation = event.location_address?.toLowerCase().includes('online') || event.title?.toLowerCase().includes('webinar');
      } else if (locationState.type === 'named') {
        const query = locationState.label.toLowerCase();
        matchesLocation = event.location_address?.toLowerCase().includes(query) ||
          event.title?.toLowerCase().includes(query);
      } else if (locationState.type === 'coords' && locationState.lat && locationState.lng) {
        // 100km radius filter; events without coordinates are hidden for "near me"
        matchesLocation = !!(event.location_lat && event.location_lng) &&
          getDistanceFromLatLonInKm(locationState.lat, locationState.lng, event.location_lat, event.location_lng) <= 100;
      }

      return matchesSearch && matchesTheme && matchesDate && matchesLocation;
    });

    return sortSoonestFirst(filtered);
  }, [approvedEvents, searchQuery, selectedTheme, dateFilter, locationState]);

  // Fallback: if the filters match nothing, show all upcoming events instead
  const { displayEvents, usingFallback } = useMemo(() => {
    if (filteredEvents.length > 0) {
      return { displayEvents: filteredEvents, usingFallback: false };
    }
    return { displayEvents: sortSoonestFirst(approvedEvents), usingFallback: approvedEvents.length > 0 };
  }, [filteredEvents, approvedEvents]);

  // Spotlight: the soonest event that has its own image; it is left out of the grid below
  const spotlight = useMemo(
    () => displayEvents.find(e => e.image_url && e.status !== 'pending') || null,
    [displayEvents]
  );
  const sections = useMemo(
    () => groupByWeek(displayEvents.filter(e => e !== spotlight)),
    [displayEvents, spotlight]
  );

  const hasMore = events.length >= eventsPerPage * page;
  const dateLabel = DATE_FILTERS.find(d => d.id === dateFilter)?.label || "Any date";

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['events']);
  };

  const setNamedLocation = () => {
    if (!locationInput.trim()) return;
    setLocationState({ type: 'named', label: locationInput.trim(), lat: null, lng: null });
    setLocationInput("");
    setLocationDropdownOpen(false);
  };

  const controlClass = "h-11 md:h-12 border border-[#D6CABD] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#221D19] rounded-none";

  let cardIndex = 0;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-cream dark:bg-[#1B1714] text-ink dark:text-[#F1E8E0] font-sans">

      {/* Masthead + filters */}
      <section className={`${CONTAINER} pt-6 md:pt-10`}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-8">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-[#6E6259] dark:text-[#B3A698]">
                Public events<span className="hidden sm:inline"> · Week of {format(new Date(), "d MMMM")}</span>
              </p>
              <h1 className="font-serif font-normal text-[30px] md:text-[54px] leading-[1.05]">
                Upcoming <em className="text-gold-text dark:text-gold-dark">Events</em>
              </h1>
            </div>
            <Link to={createPageUrl("CreateEvent")} className="lg:hidden shrink-0">
              <Button className="rounded-none h-10 px-3 bg-ink hover:bg-ink-deep text-cream text-[10px] uppercase tracking-[0.16em]">
                <Plus className="h-4 w-4 mr-1.5" />
                Create
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:max-w-[760px] lg:flex-1">
            {/* Search */}
            <div className="relative w-full lg:w-auto lg:flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <Input
                type="search"
                aria-label="Search events"
                placeholder="Search events, venues, artists"
                className={`${controlClass} pl-10 text-base md:text-sm focus-visible:ring-0 focus-visible:border-gold`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Location */}
            <DropdownMenu open={locationDropdownOpen} onOpenChange={setLocationDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className={`${controlClass} flex-1 lg:flex-none px-3.5 flex items-center justify-center gap-2 text-[11px] md:text-xs uppercase tracking-[0.14em] whitespace-nowrap outline-none`}>
                  <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span className="truncate max-w-[160px]">{locationState.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2 rounded-none bg-linen dark:bg-[#221D19] border-[rgba(59,50,43,0.14)]">
                <div className="p-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Type a city or region..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setNamedLocation(); }}
                      className="pl-9 h-10 text-sm rounded-none bg-transparent"
                    />
                  </div>
                  {locationInput.trim() && (
                    <button
                      onClick={setNamedLocation}
                      className="w-full mt-2 flex items-center gap-2 p-2 text-sm text-gold-text dark:text-gold-dark rounded-none transition-colors hover:text-ink dark:hover:text-cream"
                    >
                      <Search className="h-4 w-4" />
                      Search "{locationInput.trim()}"
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer rounded-none text-gold-text dark:text-gold-dark" onClick={handleUseCurrentLocation}>
                  <Crosshair className="h-4 w-4" />
                  <span>Use my current location</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setLocationState({ type: 'online', label: 'Online events', lat: null, lng: null })}>
                  <MonitorPlay className="h-4 w-4 text-gold" />
                  <span>Browse online events</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setLocationState({ type: 'all', label: 'All locations', lat: null, lng: null })}>
                  <Navigation className="h-4 w-4 text-gold" />
                  <span>All locations</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`${controlClass} flex-1 lg:flex-none px-3.5 flex items-center justify-center gap-2 text-[11px] md:text-xs uppercase tracking-[0.14em] whitespace-nowrap outline-none`}>
                  {dateLabel}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1 rounded-none bg-linen dark:bg-[#221D19] border-[rgba(59,50,43,0.14)]">
                {DATE_FILTERS.map(d => (
                  <DropdownMenuItem key={d.id} className="flex items-center justify-between p-3 cursor-pointer rounded-none" onClick={() => setDateFilter(d.id)}>
                    {d.label}
                    {dateFilter === d.id && <Check className="h-4 w-4 text-gold" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to={createPageUrl("CreateEvent")} className="hidden lg:block shrink-0">
              <Button className="rounded-none h-12 px-5 bg-ink hover:bg-ink-deep text-cream text-[11px] uppercase tracking-[0.16em]">
                <Plus className="h-4 w-4 mr-2" />
                Create event
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-5 md:mt-7 flex items-center justify-between gap-4 border-y border-[#E3D9CF] dark:border-[rgba(241,232,224,0.16)]">
          <nav aria-label="Categories" className="flex gap-5 md:gap-7 overflow-x-auto no-scrollbar">
            {THEMES.map(theme => {
              const active = selectedTheme === theme;
              return (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  aria-pressed={active}
                  className={`py-3.5 md:py-4 -mb-px whitespace-nowrap text-[11px] md:text-xs uppercase tracking-[0.16em] border-b-2 transition-colors ${
                    active
                      ? 'border-gold text-ink dark:text-[#F1E8E0]'
                      : 'border-transparent text-[#6E6259] dark:text-[#B3A698] hover:text-gold-text dark:hover:text-gold-dark'
                  }`}
                >
                  {theme}
                </button>
              );
            })}
          </nav>
          {!isLoading && (
            <span className="hidden md:block shrink-0 text-xs uppercase tracking-[0.14em] text-[#6E6259] dark:text-[#B3A698]">
              {displayEvents.length} {displayEvents.length === 1 ? 'event' : 'events'}
            </span>
          )}
        </div>
      </section>

      {isLoading ? (
        <div className={`${CONTAINER} pt-8`}>
          <Skeleton className="h-[260px] md:h-[480px] w-full rounded-none" />
          <div ref={gridRef} className="mt-10 flex" style={{ gap: CARD_GAP }}>
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="flex-1 flex flex-col" style={{ gap: CARD_GAP }}>
                <Skeleton className={`w-full rounded-none ${c % 2 ? 'h-[220px]' : 'h-[300px]'}`} />
                <Skeleton className={`w-full rounded-none ${c % 2 ? 'h-[300px]' : 'h-[220px]'}`} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {usingFallback && (
            <div className={`${CONTAINER} pt-6`}>
              <div className="border border-[#E3D9CF] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#221D19] px-4 py-3 text-sm text-[#6E6259] dark:text-[#B3A698]">
                No events match those filters. Showing all upcoming events instead.
              </div>
            </div>
          )}

          {spotlight && <div className="mt-6 md:mt-9"><Spotlight event={spotlight} /></div>}

          <div ref={gridRef} className={CONTAINER}>
            {sections.map(section => {
              const start = cardIndex;
              cardIndex += section.events.length;
              return (
                <section key={section.id} className="pt-10 md:pt-14">
                  <div className="flex items-baseline gap-3 md:gap-5 mb-4 md:mb-5">
                    <h2 className="font-serif font-normal text-2xl md:text-[34px] whitespace-nowrap">{section.title}</h2>
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.16em] text-[#6E6259] dark:text-[#B3A698] whitespace-nowrap">{section.range}</span>
                    <span aria-hidden="true" className="flex-1 h-px bg-[#E3D9CF] dark:bg-[rgba(241,232,224,0.16)]" />
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.16em] text-gold-text dark:text-gold-dark whitespace-nowrap">
                      {section.events.length}
                    </span>
                  </div>
                  <Masonry events={section.events} columns={columns} startIndex={start} />
                </section>
              );
            })}

            {!spotlight && sections.length === 0 && (
              <p className="py-20 text-center font-serif text-2xl text-[#6E6259] dark:text-[#B3A698]">
                No upcoming events yet.
              </p>
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center px-4 pt-12 pb-20">
              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={isFetching}
                variant="outline"
                className="rounded-none h-12 px-9 bg-transparent border-ink dark:border-[#F1E8E0] text-ink dark:text-[#F1E8E0] hover:bg-ink hover:text-cream text-[11px] uppercase tracking-[0.18em]"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show more events'
                )}
              </Button>
            </div>
          )}
          {!hasMore && <div className="pb-20" />}
        </>
      )}

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
