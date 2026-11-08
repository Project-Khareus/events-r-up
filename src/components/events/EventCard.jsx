import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "./FavoriteButton";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800";

const safeFormat = (date, pattern) => {
  if (!date || isNaN(date.getTime())) return "Date TBA";
  return format(date, pattern);
};

// Dense card for showing many events at once (6–8 per row on wide screens).
function CompactEventCard({ event, date }) {
  return (
    <div className="h-full relative group">
      <Link to={createPageUrl("EventDetail") + `?id=${event.id}`} className="flex flex-col h-full">
        <div className="relative aspect-[3/2] overflow-hidden bg-linen dark:bg-[#221D19]">
          <img
            src={event.image_url || FALLBACK_IMAGE}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            width="600"
            height="400"
          />
          {event.status === 'pending' && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white border-0 shadow-sm z-10 text-[10px] px-1.5 py-0">
              Pending
            </Badge>
          )}
          {event.is_paid && event.price ? (
            <span className="absolute bottom-2 left-2 z-10 bg-ink/85 text-cream text-[10px] font-semibold px-1.5 py-0.5 tracking-wide">
              GH₵{event.price}
            </span>
          ) : null}
        </div>
        <div className="flex-1 pt-2 flex flex-col gap-0.5 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400 truncate">
            {safeFormat(date, 'EEE, MMM d • h:mm a')}
          </div>
          <h3 className="text-sm font-semibold text-ink dark:text-[#F1E8E0] leading-snug line-clamp-2 group-hover:text-gold-text dark:group-hover:text-gold-dark transition-colors">
            {event.title}
          </h3>
          <div className="text-xs text-ink/55 dark:text-[#F1E8E0]/55 truncate">
            {event.location_address || "Online Event"}
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2 z-20">
        <FavoriteButton eventId={event.id} className="bg-white/95 hover:bg-white border-0 h-7 w-7 rounded-full shadow-md text-slate-500 hover:text-red-500" size="icon" />
      </div>
    </div>
  );
}

// Horizontal row: thumbnail on the left, details on the right.
function ListEventCard({ event, date }) {
  return (
    <div className="relative group border border-[rgba(59,50,43,0.12)] dark:border-[rgba(241,232,224,0.14)] bg-white/60 dark:bg-[#221D19] hover:border-gold transition-colors">
      <Link to={createPageUrl("EventDetail") + `?id=${event.id}`} className="flex gap-3 sm:gap-4 p-2.5">
        <div className="relative w-28 sm:w-36 shrink-0 aspect-[3/2] overflow-hidden bg-linen dark:bg-[#1B1714]">
          <img
            src={event.image_url || FALLBACK_IMAGE}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
            width="300"
            height="200"
          />
          {event.status === 'pending' && (
            <Badge className="absolute top-1 left-1 bg-yellow-500 text-white border-0 text-[10px] px-1.5 py-0">
              Pending
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 pr-8">
          <div className="text-[11px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400 truncate">
            {safeFormat(date, 'EEE, MMM d • h:mm a')}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-ink dark:text-[#F1E8E0] leading-snug line-clamp-2 group-hover:text-gold-text dark:group-hover:text-gold-dark transition-colors">
            {event.title}
          </h3>
          <div className="text-xs text-ink/55 dark:text-[#F1E8E0]/55 truncate">
            {event.location_address || "Online Event"}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-ink/60 dark:text-[#F1E8E0]/60">
            {event.theme && <span className="uppercase tracking-[0.12em] text-[10px]">{event.theme}</span>}
            {event.is_paid && event.price ? (
              <span className="font-semibold text-ink dark:text-[#F1E8E0]">GH₵{event.price}</span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="absolute top-2.5 right-2.5 z-20">
        <FavoriteButton eventId={event.id} className="bg-transparent hover:bg-linen dark:hover:bg-[#1B1714] border-0 h-7 w-7 rounded-full text-slate-500 hover:text-red-500" size="icon" />
      </div>
    </div>
  );
}

export default function EventCard({ event, variant = "default" }) {
  const date = new Date(event.event_date);

  if (variant === "compact") return <CompactEventCard event={event} date={date} />;
  if (variant === "list") return <ListEventCard event={event} date={date} />;
  
  return (
    <div className="h-full relative group bg-white dark:bg-slate-800">
      <Link to={createPageUrl("EventDetail") + `?id=${event.id}`} className="block h-full">
        <div className="flex flex-col h-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-lg overflow-hidden">
          {/* Image Container */}
          <div className="relative aspect-[2/1] overflow-hidden">
            <img 
              src={event.image_url || FALLBACK_IMAGE} 
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
            <h3 className="text-[1.15rem] font-bold text-slate-900 dark:text-slate-100 leading-[1.3] mb-1 line-clamp-2 group-hover:text-gold-text dark:group-hover:text-gold-dark transition-colors tracking-tight">
              {event.title}
            </h3>
            
            <div className="text-sm font-bold text-orange-600 dark:text-orange-400 truncate">
              {safeFormat(date, 'EEE, MMM d • h:mm a')}
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {event.location_address || "Online Event"}
            </div>

            {(event.is_paid && event.price) && (
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                GH₵{event.price}
              </div>
            )}
            
            <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50">
                  {event.theme}
                </Badge>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}