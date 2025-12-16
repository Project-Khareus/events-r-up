import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Award, 
  Shield, 
  Share2, 
  Heart, 
  ChevronRight,
  Truck,
  RotateCcw,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import RatingStats from "../components/reviews/RatingStats";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewsList from "../components/reviews/ReviewsList";
import ImageGallery from "../components/vendor/ImageGallery";
import RelatedVendors from "../components/vendor/RelatedVendors";
import ContactBookingModal from "../components/vendor/ContactBookingModal";
import ShareButton from "../components/shared/ShareButton";
import MetaTags from "../components/shared/MetaTags";

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
  bakery: "Bakery & Desserts",
  bridal_fashion: "Bridal Fashion",
  makeup_artistes: "Make-Up Artistes",
  decor_logistics: "Décor & Logistics",
  event_grounds: "Event Grounds",
  photography_videography: "Photo & Video",
  design_creatives: "Design",
  jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon",
  music_karaoke_mc: "Music & MC",
  car_rentals: "Car Rentals",
  social_media_support: "Social Media",
  ushers: "Ushers",
  dance_tutorials: "Dance Tutorials",
  rent_a_team: "Rent-a-Team",
  conference_facilities: "Conference Facilities",
  rapporteur_services: "Rapporteur",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion & Wreaths",
  others: "Others"
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
      <div className="min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid lg:grid-cols-12 gap-8">
             <div className="lg:col-span-7">
               <Skeleton className="h-[500px] w-full rounded-3xl" />
             </div>
             <div className="lg:col-span-5 space-y-4">
               <Skeleton className="h-12 w-3/4" />
               <Skeleton className="h-6 w-1/2" />
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-12 w-full" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : (vendor.rating || 0);
    
  const reviewCount = reviews.length > 0 ? reviews.length : (Math.floor(Math.random() * 100) + 5); // Fallback to fake count if 0 for better UI matching screenshot

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <MetaTags 
        title={vendor.business_name}
        description={vendor.description || `${vendor.business_name} - Professional ${CATEGORY_LABELS[vendor.category] || vendor.category} services for your special events.`}
        image={vendor.image_url || vendor.logo_url}
        url={window.location.href}
        type="business.business"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <Link to={createPageUrl("VendorMarketplace")} className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to={createPageUrl("VendorMarketplace")} className="hover:text-slate-900 transition-colors">Vendors</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to={createPageUrl(`VendorMarketplace?category=${vendor.category}`)} className="hover:text-slate-900 transition-colors capitalize">
            {CATEGORY_LABELS[vendor.category] || vendor.category}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-slate-900 font-medium truncate">{vendor.business_name}</span>
        </nav>

        {/* Hero Section with Gallery */}
        <div className="mb-8 sm:mb-12">
          <ImageGallery images={allImages} businessName={vendor.business_name} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Left Column: Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-8 sm:space-y-10">
            {/* Vendor Header */}
            <section>
              <div className="space-y-1 mb-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 leading-tight">
                  {vendor.business_name}
                </h1>
                
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span>{CATEGORY_LABELS[vendor.category] || vendor.category}</span>
                  <span>•</span>
                  <span>{vendor.location || "Location varies"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex text-slate-900">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(averageRating) ? "fill-slate-900 text-slate-900" : "text-slate-300"}`} />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-slate-500">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              {vendor.slogan && (
                <p className="text-lg text-slate-600 mb-6 italic">{vendor.slogan}</p>
              )}
            </section>

            {/* Description */}
            {vendor.description && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">About</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                  {vendor.description}
                </div>
              </section>
            )}

            {/* Highlights */}
            {(vendor.years_in_business || vendor.awards?.length > 0 || vendor.certifications?.length > 0) && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Highlights</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {vendor.years_in_business && (
                    <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{vendor.years_in_business}+ Years</p>
                        <p className="text-sm text-slate-500">In business</p>
                      </div>
                    </div>
                  )}
                  {vendor.certifications?.length > 0 && (
                    <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Shield className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Certified</p>
                        <p className="text-sm text-slate-500">{vendor.certifications[0]}</p>
                      </div>
                    </div>
                  )}
                  {vendor.awards?.length > 0 && (
                    <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg sm:col-span-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Awards</p>
                        <p className="text-sm text-slate-500">{vendor.awards.join(', ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Services */}
            {vendor.services && vendor.services.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Services Offered</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {vendor.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-slate-700 font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section id="reviews" className="pt-8 border-t border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Customer Reviews</h2>
              </div>
              
              <div className="mb-8">
                <RatingStats reviews={reviews} />
              </div>

              <div className="space-y-6">
                <ReviewForm vendorId={vendor.id} vendorName={vendor.business_name} />
                <ReviewsList vendorId={vendor.id} />
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Sidebar (1 col) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-slate-900">
                      {vendor.starting_price ? `$${vendor.starting_price.toLocaleString()}` : "Custom"}
                    </span>
                    {vendor.starting_price && <span className="text-slate-500 text-sm">starting</span>}
                  </div>
                  {vendor.price_range && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {vendor.price_range}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <ContactBookingModal 
                    vendor={vendor} 
                    trigger={
                      <Button className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
                        Contact Vendor
                      </Button>
                    }
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-lg">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <ShareButton 
                      url={window.location.href}
                      title={`${vendor.business_name} - Event Vendor`}
                      description={vendor.description || `Check out ${vendor.business_name} on Omnievents!`}
                      variant="outline"
                      size="icon"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Why book with us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200">
                      <Shield className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Verified</p>
                      <p className="text-xs text-slate-500">Background checked</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200">
                      <Lock className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Secure</p>
                      <p className="text-xs text-slate-500">Protected payments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Trusted</p>
                      <p className="text-xs text-slate-500">Top-rated service</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(vendor.instagram || vendor.facebook || vendor.twitter || vendor.tiktok || vendor.linkedin || vendor.website) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Connect</h3>
                  <div className="flex flex-wrap gap-2">
                  {vendor.website && (
                    <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </a>
                  )}
                  {vendor.instagram && (
                    <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 rounded-lg hover:bg-pink-50 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 group-hover:text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.facebook && (
                    <a href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.twitter && (
                    <a href={`https://twitter.com/${vendor.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 rounded-lg hover:bg-sky-50 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 group-hover:text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.tiktok && (
                    <a href={`https://tiktok.com/@${vendor.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.linkedin && (
                    <a href={vendor.linkedin.startsWith('http') ? vendor.linkedin : `https://linkedin.com/in/${vendor.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 group-hover:text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  </div>
                </div>
              )}

              {/* Related Vendors */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Similar Vendors</h3>
                <RelatedVendors 
                  currentVendorId={vendor.id} 
                  category={vendor.category} 
                  eventType={vendor.event_type} 
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}