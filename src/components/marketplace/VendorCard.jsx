import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', vendor.id],
    queryFn: () => base44.entities.Review.filter({ vendor_id: vendor.id }),
    staleTime: 60000,
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : vendor.rating;

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
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.business_name} className="max-h-32 max-w-[80%] object-contain" />
              ) : (
                <span className="text-6xl text-indigo-200">
                  {vendor.business_name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
          )}
          
          {vendor.featured && (
            <div className="absolute top-4 left-4 bg-amber-400 text-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg font-medium text-sm">
              <Crown className="h-3.5 w-3.5" />
              Featured
            </div>
          )}

          {vendor.starting_price && (
            <div className="absolute bottom-4 right-4 bg-amber-400 text-slate-900 px-3 py-1.5 rounded-lg shadow-lg font-semibold text-sm">
              From ${vendor.starting_price.toLocaleString()}
            </div>
          )}

          {/* Gallery indicator */}
          {vendor.gallery_images && vendor.gallery_images.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-2 py-1 rounded-md flex items-center gap-1.5 text-xs">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {vendor.gallery_images.length + 1}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {vendor.business_name}
              </h3>
              {vendor.slogan && (
                <p className="text-sm text-slate-500 italic line-clamp-1 mt-0.5">"{vendor.slogan}"</p>
              )}
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                {CATEGORY_LABELS[vendor.category]}
              </Badge>
              {vendor.years_in_business && (
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  {vendor.years_in_business}+ years
                </Badge>
              )}
            </div>

            {vendor.location && (
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{vendor.location}</span>
              </div>
            )}

            {(averageRating || reviews.length > 0) && (
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-slate-700">
                  {averageRating ? averageRating.toFixed(1) : 'New'}
                </span>
                {reviews.length > 0 && (
                  <span className="text-xs text-slate-500">({reviews.length})</span>
                )}
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