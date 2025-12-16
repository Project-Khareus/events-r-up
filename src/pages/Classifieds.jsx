import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar as CalendarIcon, MapPin } from "lucide-react";
import EventCard from "../components/events/EventCard";
import { Skeleton } from "@/components/ui/skeleton";

const THEMES = ["All", "Music", "Food & Drink", "Business", "Arts & Culture", "Sports", "Community", "Party", "Other"];

export default function Classifieds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");

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

  // Filter approved events client-side just in case RLS returns non-approved for admins/owners mixed in list
  // or to be explicit about what we show.
  const approvedEvents = useMemo(() => events.filter(e => e.status === 'approved' || !e.status), [events]); // !e.status for backward compatibility with existing events


  const filteredEvents = useMemo(() => {
    return approvedEvents.filter(event => {
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        event.location_address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTheme = selectedTheme === "All" || event.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [approvedEvents, searchQuery, selectedTheme]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
               <h1 className="text-4xl font-bold text-slate-900 mb-2 font-serif">Event Classifieds</h1>
               <p className="text-lg text-slate-600">Discover local events, meetups, and gatherings near you.</p>
             </div>
             <Link to={createPageUrl("CreateEvent")}>
               <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                 <Plus className="h-4 w-4 mr-2" />
                 Post an Event
               </Button>
             </Link>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search events by title or location..." 
              className="pl-10 h-12 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {THEMES.map(theme => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedTheme === theme 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
               <CalendarIcon className="h-8 w-8 text-indigo-500" />
             </div>
             <h3 className="text-xl font-semibold text-slate-900 mb-2">No events found</h3>
             <p className="text-slate-600 mb-6">Try adjusting your filters or post the first event!</p>
             <Link to={createPageUrl("CreateEvent")}>
               <Button variant="outline">Post Event</Button>
             </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}