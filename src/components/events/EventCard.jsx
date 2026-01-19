import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import FavoriteButton from "./FavoriteButton";

export default function EventCard({ event }) {
  const date = new Date(event.event_date);
  
  return (
    <div className="h-full relative group bg-white">
      <Link to={createPageUrl("EventDetail") + `?id=${event.id}`} className="block h-full">
        <div className="flex flex-col h-full hover:bg-slate-50 transition-colors rounded-lg overflow-hidden">
          {/* Image Container */}
          <div className="relative aspect-[2/1] overflow-hidden">
            <img 
              src={event.image_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800"} 
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              width="800"
              height="400"
            />
            {event.status === 'pending' && (
               <Badge className="absolute top-3 left-3 bg-yellow-500 text-white border-0 shadow-sm z-10">
                 Pending
               </Badge>
             )}
            <div className="absolute top-3 right-3 z-20">
               <FavoriteButton eventId={event.id} className="bg-white hover:bg-slate-100 border-0 h-8 w-8 rounded-full shadow-md text-slate-500 hover:text-red-500" size="icon" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 flex flex-col gap-1">
            <h3 className="text-[1.15rem] font-bold text-[#1e0a3c] leading-[1.3] mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors tracking-tight">
              {event.title}
            </h3>
            
            <div className="text-sm font-bold text-[#d1410c] truncate">
              {format(date, 'EEE, MMM d • h:mm a')}
            </div>

            <div className="text-sm text-[#6f7287] truncate">
              {event.location_address || "Online Event"}
            </div>

            <div className="text-sm font-medium text-[#6f7287] mt-1">
               {event.is_paid ? (event.price ? `$${event.price}` : 'Starts at $0') : 'Free'}
            </div>
            
            <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium text-[#6f7287] border-slate-200 bg-slate-50/50">
                    {event.theme}
                </Badge>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}