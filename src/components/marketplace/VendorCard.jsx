import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const CATEGORY_LABELS = {
  venue: "Venue",
  catering: "Catering",
  photography: "Photography",
  videography: "Videography",
  dj_music: "DJ & Music",
  florist: "Florist",
  decorator: "Decorator",
  planning: "Event Planning",
  lighting: "Lighting",
  entertainment: "Entertainment",
  transportation: "Transportation",
  rentals: "Rentals",
  bakery: "Bakery & Desserts"
};

export default function VendorCard({ vendor }) {
  return (
    <Link to={createPageUrl(`VendorDetail?id=${vendor.id}`)}>
      <Card className="group overflow-hidden border-slate-200 hover:border-indigo-300 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 bg-white rounded-2xl">
        <div className="relative h-64 overflow-hidden bg-slate-100">
          {vendor.image_url ? (
            <img
              src={vendor.image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
              <span className="text-6xl text-indigo-200">
                {vendor.business_name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          
          {vendor.featured && (
            <div className="absolute top-4 right-4 bg-amber-400 text-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg font-medium text-sm">
              <Crown className="h-3.5 w-3.5" />
              Featured
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {vendor.business_name}
            </h3>
            {vendor.price_range && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 font-medium shrink-0">
                {vendor.price_range}
              </Badge>
            )}
          </div>

          <div className="space-y-2.5 mb-4">
            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
              {CATEGORY_LABELS[vendor.category]}
            </Badge>

            {vendor.location && (
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{vendor.location}</span>
              </div>
            )}

            {vendor.rating && (
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-slate-700">{vendor.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {vendor.description && (
            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
              {vendor.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}