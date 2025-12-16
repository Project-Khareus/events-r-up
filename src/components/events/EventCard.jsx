import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import FavoriteButton from "./FavoriteButton";

export default function EventCard({ event }) {
  return (
    <div className="h-full relative group">
      <Link to={createPageUrl("EventDetail") + `?id=${event.id}`} className="block h-full">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col border-slate-200">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={event.image_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800"} 
              alt={event.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex gap-2">
               <Badge variant="secondary" className="bg-white/90 text-slate-900 backdrop-blur-sm shadow-sm">
                   {event.theme}
               </Badge>
               {event.status === 'pending' && (
                 <Badge className="bg-yellow-500 text-white border-0 shadow-sm">
                   Pending
                 </Badge>
               )}
            </div>
            <div className="absolute bottom-3 left-3">
               <Badge className={`${event.is_paid ? 'bg-indigo-600' : 'bg-green-600'} text-white border-0`}>
                   {event.is_paid ? (event.price ? `$${event.price}` : 'Paid') : 'Free'}
               </Badge>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-xs font-medium text-indigo-600 mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {event.title}
            </h3>
            <div className="flex items-start gap-1.5 text-sm text-slate-500 mt-auto">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{event.location_address}</span>
            </div>
          </div>
        </Card>
      </Link>
      <div className="absolute top-3 right-3 z-20">
         <FavoriteButton eventId={event.id} className="bg-white/90 hover:bg-white shadow-sm border-0 h-8 w-8" size="icon" />
      </div>
    </div>
  );
}