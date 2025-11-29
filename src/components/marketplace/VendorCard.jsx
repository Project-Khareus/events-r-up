import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";

import { MapPin, Star, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const CATEGORY_LABELS = {
  bridal_fashion: "Bridal Fashion",
  makeup_artistes: "Make-Up",
  decor_logistics: "Décor & Logistics",
  event_grounds: "Event Grounds",
  photography_videography: "Photo & Video",
  design_creatives: "Design",
  catering: "Catering",
  jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon",
  music_karaoke_mc: "Music & MC",
  car_rentals: "Car Rentals",
  social_media_support: "Social Media",
  ushers: "Ushers",
  dance_tutorials: "Dance",
  rent_a_team: "Rent-a-Team",
  conference_facilities: "Conference",
  rapporteur_services: "Rapporteur",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion & Wreaths",
  others: "Others"
};

export default function VendorCard({ vendor, size = "auto" }) {
  if (!vendor) return null;
  
  const [imageError, setImageError] = React.useState(false);
  
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', vendor.id],
    queryFn: () => base44.entities.Review.filter({ vendor_id: vendor.id }),
    staleTime: 60000,
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : vendor.rating;

  // Featured is determined by high ratings (4.5+) and having at least 3 reviews
  const isFeatured = useMemo(() => {
    if (reviews.length >= 3 && averageRating >= 4.5) {
      const hash = vendor.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return hash % 10 < 7;
    }
    return false;
  }, [reviews.length, averageRating, vendor.id]);

  // Determine card size based on vendor id hash for consistent but varied sizing
  const cardSize = useMemo(() => {
    if (size !== "auto") return size;
    const hash = vendor.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const sizes = ["small", "medium", "medium", "large"];
    return sizes[hash % 4];
  }, [vendor.id, size]);

  const imageHeights = {
    small: "h-40",
    medium: "h-56",
    large: "h-72"
  };

  return (
    <Link to={createPageUrl(`VendorDetail?id=${vendor.id}`)}>
      <Card className="group overflow-hidden border border-slate-200 hover:border-slate-400 transition-all duration-500 bg-white rounded-none">
        <div className={`relative ${imageHeights[cardSize]} overflow-hidden bg-slate-100`}>
          {vendor.image_url && !imageError ? (
            <img
              src={vendor.image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-6xl font-serif text-slate-300">
                {vendor.business_name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          
          {isFeatured && (
            <div className="absolute top-4 left-4 bg-slate-800 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg font-medium text-sm">
              <Crown className="h-3.5 w-3.5" />
              Top Rated
            </div>
          )}

          {vendor.starting_price && (
            <div className="absolute bottom-4 right-4 bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-lg font-semibold text-sm">
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

        <div className="p-4">
          {vendor.category && (
            <span className="text-xs font-medium tracking-widest uppercase text-slate-400 mb-1 block">
              {CATEGORY_LABELS[vendor.category] || vendor.category}
            </span>
          )}
          <h3 className="font-serif font-bold text-xl text-slate-900 group-hover:text-slate-600 transition-colors line-clamp-1 mb-2 tracking-tight">
            {vendor.business_name}
          </h3>

          <div className="space-y-1.5 mb-3">
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