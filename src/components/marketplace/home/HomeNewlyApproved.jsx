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

  // Each vendor appears in exactly ONE section so nothing repeats, but vendors
  // are spread evenly: each goes to the matching category with the fewest
  // vendors so far, so no section starves.
  const groups = EVENT_SECTIONS.map((section) => ({ ...section, count: 0, assigned: [] }));
  const groupByKey = Object.fromEntries(groups.map((g) => [g.key, g]));
  const matchCount = Object.fromEntries(EVENT_SECTIONS.map((s) => [s.key, 0]));

  vendors.forEach((v) => {
    const events = v.event_type
      ? Array.isArray(v.event_type) ? v.event_type : [v.event_type]
      : [];
    const matching = EVENT_SECTIONS.filter((s) => events.includes(s.key));
    if (!matching.length) return;
    matching.forEach((s) => { matchCount[s.key] += 1; });
    const target = matching.reduce((best, s) =>
      groupByKey[s.key].assigned.length < groupByKey[best.key].assigned.length ? s : best
    );
    groupByKey[target.key].assigned.push(v);
  });

  const displayGroups = groups.map((g) => ({
    ...g,
    count: matchCount[g.key],
    vendors: g.assigned.slice(0, 8),
  })).filter((g) => g.vendors.length > 0);

  if (displayGroups.length === 0) return null;

  const seeAllUrl = (key) => `${createPageUrl("VendorMarketplace")}?event=${key}`;

  return (
    <section className="px-5 md:px-10 py-8 md:py-12 space-y-8 md:space-y-10">
      {displayGroups.map((group) => (
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
                key={vendor.id}
                vendor={vendor}
                showCategory={false}
                reviews={allReviews.filter((r) => r.vendor_id === vendor.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}