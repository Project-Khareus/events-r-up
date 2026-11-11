import { Link } from "react-router-dom";
import { format } from "date-fns";
import { createPageUrl } from "../../utils";
import FavoriteButton from "./FavoriteButton";

export const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800";

export const formatEventWhen = (value, pattern = "EEE d MMM · h:mm a") => {
  const date = value ? new Date(value) : null;
  if (!date || isNaN(date.getTime())) return "Date TBA";
  return format(date, pattern);
};

// Pinterest-style card: the image keeps its natural shape and the caption
// sits on a band across the bottom of it. `tone` switches the band between
// dark (default) and light so a grid of them doesn't feel heavy.
export default function MasonryEventCard({ event, tone = "dark" }) {
  const light = tone === "light";

  return (
    <article className="relative group break-inside-avoid">
      <Link
        to={createPageUrl("EventDetail") + `?id=${event.id}`}
        className="relative block overflow-hidden bg-[#3B322B]"
      >
        <img
          src={event.image_url || FALLBACK_EVENT_IMAGE}
          alt={event.title}
          loading="lazy"
          className="block w-full h-auto min-h-[160px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_EVENT_IMAGE) e.currentTarget.src = FALLBACK_EVENT_IMAGE;
          }}
        />

        {event.status === "pending" && (
          <span className="absolute left-3 top-3 bg-yellow-500 text-white text-[10px] uppercase tracking-[0.14em] px-2 py-1">
            Pending
          </span>
        )}
        {event.status !== "pending" && event.is_paid && event.price ? (
          <span className="absolute left-3 top-3 bg-cream text-ink text-[11px] font-medium px-2 py-1">
            GH₵{event.price}
          </span>
        ) : null}

        <div
          className={`absolute inset-x-0 bottom-0 px-4 pt-3 pb-4 flex flex-col gap-1 ${
            light ? "bg-[rgba(248,241,235,0.94)] text-ink" : "bg-[rgba(27,23,20,0.9)] text-[#F1E8E0]"
          }`}
        >
          <span className={`text-[10px] uppercase tracking-[0.16em] ${light ? "text-gold-text" : "text-gold-dark"}`}>
            {formatEventWhen(event.event_date)}
          </span>
          <h3 className="font-serif text-[19px] sm:text-[21px] font-medium leading-[1.1] line-clamp-2">
            {event.title}
          </h3>
          <span className={`text-xs truncate ${light ? "text-[#6E6259]" : "text-[#B3A698]"}`}>
            {event.location_address || "Online event"}
          </span>
        </div>
      </Link>

      <div className="absolute top-2.5 right-2.5 z-10">
        <FavoriteButton
          eventId={event.id}
          size="icon"
          className="h-8 w-8 rounded-full border-0 bg-[rgba(248,241,235,0.92)] hover:bg-cream text-ink hover:text-red-500 shadow-sm"
        />
      </div>
    </article>
  );
}
