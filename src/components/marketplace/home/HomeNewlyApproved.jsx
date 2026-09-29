import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../../utils";
import VendorCard from "../VendorCard";

const EVENT_SECTIONS = [
  { key: "weddings", label: "Weddings" },
  { key: "parties", label: "Parties" },
  { key: "conference", label: "Conferences" },
  { key: "funeral", label: "Funerals" },
];

export default function HomeNewlyApproved({ vendors = [], allReviews = [], location, totalCount }) {
  if (!vendors.length) return null;

  // Group vendors by event type (a vendor can appear in more than one section)
  const groups = EVENT_SECTIONS.map((section) => ({
    ...section,
    vendors: vendors.filter((v) => {
      const events = v.event_type
        ? Array.isArray(v.event_type) ? v.event_type : [v.event_type]
        : [];
      return events.includes(section.key);
    }).slice(0, 8),
    count: vendors.filter((v) => {
      const events = v.event_type
        ? Array.isArray(v.event_type) ? v.event_type : [v.event_type]
        : [];
      return events.includes(section.key);
    }).length,
  })).filter((g) => g.vendors.length > 0);

  if (groups.length === 0) return null;

  const seeAllUrl = (key) => `${createPageUrl("VendorMarketplace")}?event=${key}`;

  return (
    <section className="px-5 md:px-10 py-8 md:py-12 space-y-8 md:space-y-10">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-baseline justify-between gap-4 mb-4 md:mb-5">
            <h2 className="font-serif text-[22px] md:text-[27px] text-ink dark:text-[#F1E8E0]">
              {group.label}
              {location ? ` in ${location}` : ""}
            </h2>
            <Link
              to={seeAllUrl(group.key)}
              className="text-[12.5px] text-gold-text dark:text-gold-dark hover:underline whitespace-nowrap"
            >
              {`See all ${group.count}`}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5">
            {group.vendors.map((vendor) => (
              <VendorCard
                key={`${group.key}-${vendor.id}`}
                vendor={vendor}
                reviews={allReviews.filter((r) => r.vendor_id === vendor.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}