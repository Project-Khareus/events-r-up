import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../../utils";

const OCCASIONS = [
  {
    eventType: "weddings",
    label: "Weddings",
    page: "Weddings",
    categories: [
      { name: "Photography & Videography", id: "photography_videography" },
      { name: "Catering", id: "catering" },
      { name: "Décor & Logistics", id: "decor_logistics" },
      { name: "Event Grounds", id: "event_grounds" },
    ],
  },
  {
    eventType: "parties",
    label: "Parties",
    page: "Parties",
    categories: [
      { name: "Event Venues", id: "event_grounds" },
      { name: "Music / Karaoke", id: "music_karaoke_mc" },
      { name: "Catering", id: "catering" },
      { name: "Design & Creatives", id: "design_creatives" },
    ],
  },
  {
    eventType: "conference",
    label: "Conferences",
    page: "Conference",
    categories: [
      { name: "Conference Facilities", id: "conference_facilities" },
      { name: "Rapporteur Services", id: "rapporteur_services" },
      { name: "Catering", id: "catering" },
    ],
  },
  {
    eventType: "funeral",
    label: "Funerals",
    page: "Funeral",
    categories: [
      { name: "Caskets", id: "caskets" },
      { name: "Catering & Drinks", id: "catering_drinks" },
      { name: "Décor & Logistics", id: "decor_logistics" },
    ],
  },
];

export default function HomeOccasionDoors({ vendorsByEvent = [] }) {
  const byEvent = React.useMemo(() => {
    const map = {};
    vendorsByEvent.forEach((group) => { map[group.eventType] = group.vendors || []; });
    return map;
  }, [vendorsByEvent]);

  const usedImages = new Set();

  return (
    <section className="px-5 md:px-10 py-8 md:py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {OCCASIONS.map((occasion) => {
          const groupVendors = byEvent[occasion.eventType] || [];
          const ranked = [...groupVendors]
            .filter((v) => v.image_url)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
          const best = ranked.find((v) => !usedImages.has(v.image_url)) || ranked[0];
          if (best?.image_url) usedImages.add(best.image_url);

          return (
            <div key={occasion.eventType}>
              <Link
                to={createPageUrl(occasion.page)}
                className="relative block h-[132px] md:h-[236px] overflow-hidden bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]"
              >
                {best?.image_url ? (
                  <img
                    src={best.image_url}
                    alt={`${occasion.label} vendors on Khareus`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div
                  className="absolute inset-x-0 bottom-0 h-2/3"
                  style={{ background: "linear-gradient(to top, rgba(42,35,29,0.92), rgba(42,35,29,0.35))" }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <p className="font-serif font-medium text-[16px] md:text-[21px] tracking-[0.05em] uppercase text-[#F8F1EB]">
                    {occasion.label}
                  </p>
                  <p className="mt-0.5 text-[11.5px] font-light text-[#F8F1EB]">
                    {groupVendors.length} approved vendors
                  </p>
                </div>
              </Link>

              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                {occasion.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={createPageUrl(`CategoryPage?category=${cat.id}&event=${occasion.eventType}`)}
                    className="text-[11px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] hover:underline"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}