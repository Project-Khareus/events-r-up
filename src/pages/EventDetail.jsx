import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ArrowLeft, Calendar, MapPin, DollarSign, Tag, User, Flag, Pencil } from "lucide-react";
import ShareButton from "../components/shared/ShareButton";
import MetaTags from "../components/shared/MetaTags";
import { format } from "date-fns";
import EventCard from "../components/events/EventCard";
import FavoriteButton from "../components/events/FavoriteButton";
import AddToCalendarButton from "../components/events/AddToCalendarButton";
import MobileHeader from "../components/layout/MobileHeader";
import ReportDialog from "../components/reports/ReportDialog";

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

export default function EventDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");
  const [showMap, setShowMap] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.EventListing.list(),
  });

  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);

  const nearbyEvents = useMemo(() => {
    if (!event || !events.length) return [];
    return events
      .filter(e => e.id !== event.id && e.status === 'approved' && new Date(e.event_date) >= new Date())
      .map(e => ({
          ...e,
          distance: getDistanceFromLatLonInKm(event.location_lat, event.location_lng, e.location_lat, e.location_lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  }, [event, events]);

  const similarEvents = useMemo(() => {
    if (!event || !events.length) return [];
    return events
      .filter(e => e.id !== event.id && e.status === 'approved' && e.theme === event.theme && new Date(e.event_date) >= new Date())
      .slice(0, 4);
  }, [event, events]);

  if (isLoading) {
    return (
       <div className="min-h-screen bg-cream dark:bg-[#1B1714] p-6">
          <div className="max-w-6xl mx-auto space-y-8">
             <Skeleton className="h-8 w-32" />
             <Skeleton className="h-[400px] w-full rounded-2xl" />
             <div className="grid md:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-64 rounded-xl" />
             </div>
          </div>
       </div>
    );
  }

  if (!event) return <div className="p-12 text-center">Event not found</div>;

  const isPending = event.status === 'pending';
  const isRejected = event.status === 'rejected';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_address || "")}`;
  const canEdit = currentUser && (currentUser.role === 'admin' || event.user_id === currentUser.id || event.created_by_id === currentUser.id);


  return (
    <div className="min-h-screen bg-cream dark:bg-[#1B1714] text-ink dark:text-[#F1E8E0] pb-20">
      <MetaTags 
        title={event.title}
        description={event.description || `Join us at ${event.title} on ${format(new Date(event.event_date), 'MMMM d, yyyy')}`}
        image={event.image_url}
        url={window.location.href}
        type="event"
      />
      <MobileHeader title={event.title} />
      {/* Hero Image */}
      {(isPending || isRejected) && (
        <div className={`w-full py-3 px-6 text-center text-white font-medium ${isPending ? 'bg-yellow-500' : 'bg-red-500'}`}>
            {isPending ? 'This event is pending approval and is visible only to you and admins.' : 'This event has been rejected.'}
        </div>
      )}
      {/* Hero Image — full flyer at natural aspect, no overlay */}
      <div className="w-full bg-linen dark:bg-[#221B15] flex justify-center">
         <img 
            src={event.image_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2000"} 
            alt={event.title}
            className="w-auto max-w-full max-h-[75vh] object-contain"
         />
      </div>

      {/* Event info band below the image */}
      <div className="w-full bg-cream dark:bg-[#1B1714] text-ink dark:text-[#F1E8E0] border-b border-ink/10 dark:border-[#F1E8E0]/10">
         <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
             <Link to={createPageUrl("Classifieds")} className="hidden md:inline-flex items-center text-ink/60 dark:text-[#F1E8E0]/60 hover:text-gold-text dark:hover:text-gold-dark mb-4 transition-colors">
                 <ArrowLeft className="h-4 w-4 mr-2" /> Back to Public Events
             </Link>
             <div className="flex flex-wrap gap-3 mb-4">
                 <Badge className="bg-gold hover:bg-gold border-0 text-cream text-base px-4 py-1">
                     {event.theme}
                 </Badge>
                 <Badge variant="outline" className="bg-transparent border-ink/30 dark:border-[#F1E8E0]/30 text-ink dark:text-[#F1E8E0] text-base px-4 py-1">
                     {event.is_paid ? (event.price ? `GH₵${event.price}` : 'Paid') : 'Free Entry'}
                 </Badge>
             </div>
             <h1 className="text-3xl md:text-5xl font-serif font-bold text-ink dark:text-[#F1E8E0] mb-4">
                 {event.title}
             </h1>
             <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-ink/80 dark:text-[#F1E8E0]/80 text-base sm:text-lg">
                 <div className="flex items-center gap-2">
                     <Calendar className="h-5 w-5 shrink-0 text-gold-text dark:text-gold-dark" />
                     <span>{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
                 </div>
                 <a
                     href={mapsUrl}
                     target="_blank"
                     rel="noreferrer"
                     className="flex items-center gap-2 hover:underline underline-offset-4"
                 >
                     <MapPin className="h-5 w-5 shrink-0 text-gold-text dark:text-gold-dark" />
                     <span>{event.location_address}</span>
                 </a>
             </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
         <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
                <section>
                    <h2 className="text-2xl font-serif font-bold text-ink dark:text-[#F1E8E0] mb-4">About this Event</h2>
                    <div className="prose prose-lg text-ink/70 dark:text-[#F1E8E0]/70 leading-relaxed">
                        {event.description ? (
                            <p className="whitespace-pre-wrap">{event.description}</p>
                        ) : (
                            <p className="italic text-slate-400">No description provided.</p>
                        )}
                    </div>
                </section>

                {/* Map Section */}
                <section>
                    <h2 className="text-2xl font-serif font-bold text-ink dark:text-[#F1E8E0] mb-4">Location</h2>
                    
                    {!showMap ? (
                        <div className="rounded-none border border-ink/10 dark:border-[#F1E8E0]/10 bg-linen dark:bg-[#221B15] p-8 flex flex-col items-center justify-center text-center">
                            <div className="bg-gold/10 p-4 rounded-full mb-4 border border-gold/30">
                                <MapPin className="h-8 w-8 text-gold-text dark:text-gold-dark" />
                            </div>
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-lg font-semibold text-ink dark:text-[#F1E8E0] mb-2 hover:underline underline-offset-4"
                            >
                                {event.location_address}
                            </a>
                            <p className="text-sm text-ink/50 dark:text-[#F1E8E0]/50 mb-6">Tap to open in Google Maps and get directions</p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {(event.location_lat && event.location_lng) && (
                                    <Button onClick={() => setShowMap(true)} variant="outline" className="rounded-none border-ink/20 dark:border-[#F1E8E0]/20">
                                        View on Map
                                    </Button>
                                )}
                                <a 
                                    href={mapsUrl}
                                    target="_blank" 
                                    rel="noreferrer"
                                >
                                    <Button className="rounded-none bg-gold-text hover:bg-gold-text/90 text-cream">Get Directions</Button>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-none overflow-hidden border border-ink/10 dark:border-[#F1E8E0]/10 h-[400px] relative z-0">
                            <MapContainer 
                                center={[event.location_lat || 0, event.location_lng || 0]} 
                                zoom={14} 
                                scrollWheelZoom={false}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[event.location_lat || 0, event.location_lng || 0]}>
                                    <Popup>{event.location_address}</Popup>
                                </Marker>
                            </MapContainer>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="absolute top-4 right-4 z-[1000] bg-white hover:bg-cream text-ink rounded-none"
                                onClick={() => setShowMap(false)}
                            >
                                Hide Map
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            {/* Sidebar / Actions */}
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-linen dark:bg-[#221B15] p-6 rounded-none border border-ink/10 dark:border-[#F1E8E0]/10 sticky top-24">
                    <h3 className="font-serif font-bold text-ink dark:text-[#F1E8E0] mb-4">Event Details</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <Tag className="h-5 w-5 text-gold-text dark:text-gold-dark mt-0.5" />
                            <div>
                                <p className="text-sm text-ink/50 dark:text-[#F1E8E0]/50">Category</p>
                                <p className="font-medium text-ink dark:text-[#F1E8E0]">{event.theme}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <DollarSign className="h-5 w-5 text-gold-text dark:text-gold-dark mt-0.5" />
                            <div>
                                <p className="text-sm text-ink/50 dark:text-[#F1E8E0]/50">Cost</p>
                                <p className="font-medium text-ink dark:text-[#F1E8E0]">
                                    {event.is_paid ? (event.price ? `GH₵${event.price}` : 'Paid') : 'Free Entry'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Organizer Info - Modified */}
                    <div className="flex items-center gap-3 p-3 bg-cream dark:bg-[#1B1714] rounded-none border border-ink/10 dark:border-[#F1E8E0]/10 mb-4">
                        <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30 text-gold-text font-bold overflow-hidden">
                             {/* Note: In a real scenario we might fetch user details to get avatar, here we just show an icon or initial */}
                             <User className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-ink/50 dark:text-[#F1E8E0]/50 uppercase tracking-wider font-semibold">Organizer</p>
                            <p className="font-medium text-ink dark:text-[#F1E8E0] line-clamp-1">
                                {event.organizer_name || (event.user_id ? "Event Organizer" : "Unknown")}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <FavoriteButton eventId={event.id} className="flex-1" variant="outline" size="default" />
                            <div className="flex-1">
                                <AddToCalendarButton event={event} />
                            </div>
                        </div>
                        {canEdit && (
                            <Link to={createPageUrl("EditEvent") + `?id=${event.id}`}>
                                <Button variant="outline" className="w-full gap-2 rounded-none border-ink/20 dark:border-[#F1E8E0]/20">
                                    <Pencil className="h-4 w-4" />
                                    Edit Event
                                </Button>
                            </Link>
                        )}
                        <Button className="w-full bg-gold-text hover:bg-gold-text/90 text-cream rounded-none h-12 text-lg">
                            Register / Buy Ticket
                        </Button>
                        <ShareButton 
                          url={window.location.href}
                          title={event.title}
                          description={event.description || `Join us at ${event.title}`}
                          variant="outline"
                          className="w-full"
                        />
                        <ReportDialog
                          targetType="event"
                          targetId={event.id}
                          targetName={event.title}
                          trigger={
                            <Button variant="outline" size="default" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-none gap-2">
                              <Flag className="h-4 w-4" />
                              Report this event
                            </Button>
                          }
                        />
                    </div>
                </div>
            </div>
         </div>

         {/* Related Sections */}
         <div className="mt-20 space-y-16">
            {nearbyEvents.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-ink dark:text-[#F1E8E0]">Nearby Events</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {nearbyEvents.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                </section>
            )}

            {similarEvents.length > 0 && (
                <section>
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-ink dark:text-[#F1E8E0]">Similar Themes</h2>
                        <Link to={createPageUrl("Classifieds")} className="text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {similarEvents.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                </section>
            )}
         </div>
      </div>
    </div>
  );
}