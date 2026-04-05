import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ChevronDown, ChevronUp, Heart, PartyPopper, Briefcase, Cross, Calendar } from "lucide-react";

const EVENT_ITEMS = [
  {
    key: "weddings",
    label: "Weddings",
    icon: Heart,
    page: "Weddings",
    subcategories: [
      { key: "parties", label: "Parties", page: "Parties" },
      { key: "parties2", label: "Parties", page: "Parties" },
    ],
  },
  {
    key: "parties",
    label: "Parties",
    icon: PartyPopper,
    page: "Parties",
    subcategories: [],
  },
  {
    key: "conference",
    label: "Conferences",
    icon: Briefcase,
    page: "Conferences",
    subcategories: [
      { key: "conferences_sub", label: "Conferences", page: "Conferences" },
    ],
  },
  {
    key: "funeral",
    label: "Funerals",
    icon: Cross,
    page: "Funerals",
    subcategories: [],
  },
  {
    key: "public_events",
    label: "Public Events",
    icon: Calendar,
    page: "Classifieds",
    subcategories: [
      { key: "public_events_sub", label: "Public Events", page: "Classifieds" },
    ],
  },
];

export default function CategorySidebar({ activeEvent, onEventChange }) {
  const [expanded, setExpanded] = useState({ weddings: true, conference: true, public_events: true });

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden text-white w-full">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="font-bold text-sm tracking-wide">Event Categories</h3>
      </div>
      <nav className="py-1">
        {EVENT_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeEvent === item.key;
          const isExpanded = expanded[item.key];
          const hasSubs = item.subcategories.length > 0;

          return (
            <div key={item.key}>
              <button
                onClick={() => {
                  onEventChange(item.key);
                  if (hasSubs) toggle(item.key);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {hasSubs && (
                  isExpanded ? <ChevronUp className="h-3.5 w-3.5 opacity-60" /> : <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                )}
              </button>
              {hasSubs && isExpanded && (
                <div className="bg-slate-750">
                  {item.subcategories.map((sub) => (
                    <Link
                      key={sub.key}
                      to={createPageUrl(sub.page)}
                      className="flex items-center gap-2.5 pl-11 pr-4 py-2 text-xs text-indigo-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}