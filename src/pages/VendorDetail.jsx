import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Star, Mail, Phone, Globe, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import RatingStats from "../components/reviews/RatingStats";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewsList from "../components/reviews/ReviewsList";
import StartConversationButton from "../components/messaging/StartConversationButton";

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

        {/* Hero Image */}
        {vendor.image_url && (
          <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl">
            <img
              src={vendor.image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/90 text-slate-900 backdrop-blur-sm">
                  {CATEGORY_LABELS[vendor.category]}
                </Badge>
                {vendor.price_range && (
                  <Badge variant="secondary" className="bg-amber-400/90 text-slate-900 backdrop-blur-sm font-medium">
                    {vendor.price_range}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                {vendor.business_name}
              </h1>
              {vendor.location && (
                <div className="flex items-center gap-2 text-white/90 text-lg">
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

            {/* Gallery */}
            {allImages.length > 1 && (
              <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {allImages.slice(1).map((imageUrl, index) => (
                    <div key={index} className="relative h-48 rounded-xl overflow-hidden group">
                      <img
                        src={imageUrl}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
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

            {/* Contact Card */}
            <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Get in Touch</h3>
              <div className="space-y-4">
                {vendor.contact_email && (
                  <a
                    href={`mailto:${vendor.contact_email}`}
                    className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Mail className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-sm break-all">{vendor.contact_email}</span>
                  </a>
                )}
                
                {vendor.contact_phone && (
                  <a
                    href={`tel:${vendor.contact_phone}`}
                    className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Phone className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-sm">{vendor.contact_phone}</span>
                  </a>
                )}
                
                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Globe className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-sm break-all">Visit Website</span>
                  </a>
                )}
              </div>

              <div className="mt-6">
                <StartConversationButton vendorId={vendor.id} vendorName={vendor.business_name} />
              </div>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <ReviewForm vendorId={vendor.id} vendorName={vendor.business_name} />
          <ReviewsList vendorId={vendor.id} />
        </div>
      </div>
    </div>
  );
}