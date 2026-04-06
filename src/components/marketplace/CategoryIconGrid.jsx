import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const CATEGORY_ICONS = {
  weddings: [
    { key: "bridal_fashion", label: "Bridal Wear", icon: "👗" },
    { key: "event_grounds", label: "Venue Hire", icon: "🏛️" },
    { key: "catering", label: "Catering", icon: "🍽️" },
    { key: "photography_videography", label: "Photography", icon: "📸" },
    { key: "design_creatives", label: "Videography", icon: "🎬" },
    { key: "beauty_personal_care", label: "Hair Styling", icon: "💇" },
    { key: "jewellery", label: "Makeup & Beauty", icon: "💄" },
    { key: "music_karaoke_mc", label: "Entertainment", icon: "🎵" },
  ],
  parties: [
    { key: "event_planner", label: "Party Planner", icon: "🎉" },
    { key: "event_grounds", label: "Venue Hire", icon: "🏛️" },
    { key: "catering", label: "Catering", icon: "🍽️" },
    { key: "photography_videography", label: "Photography", icon: "📸" },
    { key: "decor_logistics", label: "Décor", icon: "🎈" },
    { key: "music_karaoke_mc", label: "DJ & Music", icon: "🎧" },
    { key: "car_rentals", label: "Car Rentals", icon: "🚗" },
    { key: "design_creatives", label: "Design", icon: "🎨" },
  ],
  conference: [
    { key: "conference_facilities", label: "Facilities", icon: "🏢" },
    { key: "event_planner", label: "Planner", icon: "📋" },
    { key: "catering", label: "Catering", icon: "🍽️" },
    { key: "rapporteur_services", label: "Rapporteur", icon: "📝" },
    { key: "music_karaoke_mc", label: "MC", icon: "🎤" },
    { key: "decor_logistics", label: "Logistics", icon: "📦" },
    { key: "car_rentals", label: "Transport", icon: "🚗" },
    { key: "photography_videography", label: "Photography", icon: "📸" },
  ],
  funeral: [
    { key: "caskets", label: "Caskets", icon: "⚱️" },
    { key: "catering_drinks", label: "Catering", icon: "🍽️" },
    { key: "event_planner", label: "Planner", icon: "📋" },
    { key: "decor_logistics", label: "Décor", icon: "🌸" },
    { key: "fashion_wreaths", label: "Wreaths", icon: "🌹" },
    { key: "car_rentals", label: "Transport", icon: "🚗" },
    { key: "photography_videography", label: "Photography", icon: "📸" },
    { key: "others", label: "Others", icon: "📦" },
  ],
  all: [
    { key: "event_planner", label: "Planner", icon: "📋" },
    { key: "event_grounds", label: "Venues", icon: "🏛️" },
    { key: "catering", label: "Catering", icon: "🍽️" },
    { key: "photography_videography", label: "Photography", icon: "📸" },
    { key: "beauty_personal_care", label: "Beauty", icon: "💄" },
    { key: "decor_logistics", label: "Décor", icon: "🎈" },
    { key: "music_karaoke_mc", label: "Music & MC", icon: "🎵" },
    { key: "car_rentals", label: "Car Rentals", icon: "🚗" },
  ],
};

export default function CategoryIconGrid({ eventType = "weddings" }) {
  const categories = CATEGORY_ICONS[eventType] || CATEGORY_ICONS.all;

  return (
    <div className="flex justify-between overflow-x-auto gap-3 py-2" style={{ scrollbarWidth: "none" }}>
      {categories.map((cat) => (
        <Link
          key={cat.key}
          to={createPageUrl(`CategoryPage?category=${cat.key}&event=${eventType === "all" ? "" : eventType}`)}
          className="flex flex-col items-center gap-2 min-w-[70px] group"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-orange-50 dark:group-hover:bg-orange-950/30 group-hover:ring-2 group-hover:ring-orange-200 dark:group-hover:ring-orange-800 transition-all">
            {cat.icon}
          </div>
          <span className="text-xs text-center text-slate-700 dark:text-slate-300 font-medium leading-tight">
            {cat.label}
          </span>
        </Link>
      ))}
    </div>
  );
}