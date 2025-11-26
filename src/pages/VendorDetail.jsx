import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Star, CheckCircle2, Award, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import RatingStats from "../components/reviews/RatingStats";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewsList from "../components/reviews/ReviewsList";

import ImageGallery from "../components/vendor/ImageGallery";
import RelatedVendors from "../components/vendor/RelatedVendors";
import ContactBookingModal from "../components/vendor/ContactBookingModal";

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

export default function VendorDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const vendorId = urlParams.get("id");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', vendorId],
    queryFn: () => base44.entities.Review.filter({ vendor_id: vendorId }, '-created_date', 50),
    enabled: !!vendorId,
  });

  const vendor = vendors.find(v => v.id === vendorId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-96 w-full rounded-3xl mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Vendor not found</h2>
          <Link to={createPageUrl("VendorMarketplace")}>
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allImages = [vendor.image_url, ...(vendor.gallery_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link to={createPageUrl("VendorMarketplace")}>
          <Button variant="ghost" className="mb-8 hover:bg-slate-100 rounded-xl -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <div className="relative">
            <ImageGallery images={allImages} businessName={vendor.business_name} />
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  {CATEGORY_LABELS[vendor.category] || vendor.category}
                </Badge>
                {vendor.starting_price && (
                  <Badge variant="secondary" className="bg-amber-400 text-slate-900 font-semibold">
                    From ${vendor.starting_price.toLocaleString()}
                  </Badge>
                )}
                {vendor.years_in_business && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {vendor.years_in_business}+ years in business
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
                {vendor.business_name}
              </h1>
              {vendor.slogan && (
                <p className="text-xl text-slate-600 italic mb-2">"{vendor.slogan}"</p>
              )}
              {vendor.location && (
                <div className="flex items-center gap-2 text-slate-600 text-lg">
                  <MapPin className="h-5 w-5" />
                  <span>{vendor.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                {vendor.description || "No description available."}
              </p>
            </Card>

            {/* Services */}
            {vendor.services && vendor.services.length > 0 && (
              <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Services Offered</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {vendor.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Awards */}
            {vendor.awards && vendor.awards.length > 0 && (
              <Card className="p-8 rounded-2xl border-slate-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-6 w-6 text-amber-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Awards & Recognition</h2>
                </div>
                <div className="space-y-2">
                  {vendor.awards.map((award, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{award}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Certifications */}
            {vendor.certifications && vendor.certifications.length > 0 && (
              <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Certifications</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {vendor.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Stats */}
            <RatingStats reviews={reviews} />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <ReviewForm vendorId={vendor.id} vendorName={vendor.business_name} />
            <ReviewsList vendorId={vendor.id} />
          </div>
        </div>

        {/* Floating Contact/Booking Button */}
        <ContactBookingModal vendor={vendor} />

        {/* Related Vendors */}
        <RelatedVendors 
          currentVendorId={vendor.id} 
          category={vendor.category} 
          eventType={vendor.event_type} 
        />
      </div>
    </div>
  );
}