import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Star, CheckCircle2, Award, Shield, Share2, Heart } from "lucide-react";
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
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid lg:grid-cols-2 gap-12">
             <Skeleton className="h-[500px] w-full rounded-3xl" />
             <div className="space-y-4">
               <Skeleton className="h-12 w-3/4" />
               <Skeleton className="h-6 w-full" />
               <Skeleton className="h-6 w-5/6" />
             </div>
          </div>
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
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Back Button */}
        {/* <Link to={createPageUrl("VendorMarketplace")}>
          <Button variant="ghost" className="mb-6 hover:bg-slate-100 rounded-xl -ml-2 text-slate-500">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link> */}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7">
             {allImages.length > 0 ? (
                <ImageGallery images={allImages} businessName={vendor.business_name} />
             ) : (
                <div className="h-96 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                   No images available
                </div>
             )}
          </div>

          {/* Right Column: Product Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border-b border-slate-200 pb-6">
               <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                 {vendor.business_name}
               </h1>
               {vendor.slogan && (
                 <p className="text-slate-600 text-lg mb-4">{vendor.slogan}</p>
               )}
               
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(averageRating) ? "fill-current" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4">
                      {reviews.length} reviews
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-300" />
                  <div className="text-sm text-slate-500">
                    ID: {vendor.id.slice(0, 8)}
                  </div>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="mb-6">
                 <div className="flex items-baseline gap-2 mb-1">
                   <span className="text-4xl font-bold text-slate-900">
                     {vendor.starting_price ? `$${vendor.starting_price.toLocaleString()}` : "Price upon request"}
                   </span>
                   {vendor.starting_price && <span className="text-slate-500 font-medium">starting price</span>}
                 </div>
                 <div className="text-sm text-indigo-600 font-medium">
                   Get customized quote available
                 </div>
              </div>

              <div className="space-y-4 mb-8">
                 <ContactBookingModal 
                    vendor={vendor} 
                    trigger={
                      <Button className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md shadow-blue-200">
                         Book / Contact Vendor
                      </Button>
                    }
                 />
                 <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-full border-slate-300 text-slate-700 hover:bg-slate-100">
                       <Heart className="h-4 w-4 mr-2" />
                       Save
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-full border-slate-300 text-slate-700 hover:bg-slate-100">
                       <Share2 className="h-4 w-4 mr-2" />
                       Share
                    </Button>
                 </div>
              </div>
              
              <div className="space-y-3 text-sm text-slate-600 pt-4 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-medium text-slate-900">{CATEGORY_LABELS[vendor.category] || vendor.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-medium text-slate-900">{vendor.location || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Experience:</span>
                  <span className="font-medium text-slate-900">{vendor.years_in_business ? `${vendor.years_in_business}+ Years` : "New Vendor"}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Event Types:</span>
                   <span className="font-medium text-slate-900 capitalize">{vendor.event_type || "Various"}</span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4">
               <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-2">
                     <Shield className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-600">Verified Vendor</div>
               </div>
               <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-2">
                     <Award className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-600">Top Rated</div>
               </div>
               <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-2">
                     <CheckCircle2 className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-xs font-medium text-slate-600">Secure Booking</div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Details & Reviews */}
        <div className="mt-16 grid lg:grid-cols-12 gap-12 border-t border-slate-200 pt-12">
          <div className="lg:col-span-8 space-y-10">
             
             {/* Description */}
             <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Item Description from the Seller</h2>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                   {vendor.description || "No description provided."}
                </div>
             </section>

             {/* Services */}
             {vendor.services && vendor.services.length > 0 && (
               <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Services Included</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {vendor.services.map((service, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg bg-white">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <span className="text-slate-700">{service}</span>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* Awards & Certs */}
             {(vendor.awards?.length > 0 || vendor.certifications?.length > 0) && (
                <section className="grid sm:grid-cols-2 gap-6">
                   {vendor.awards?.length > 0 && (
                      <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                         <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Award className="h-5 w-5 text-amber-600" /> Awards
                         </h3>
                         <ul className="space-y-2">
                            {vendor.awards.map((award, i) => (
                               <li key={i} className="text-slate-700 text-sm list-disc list-inside">{award}</li>
                            ))}
                         </ul>
                      </div>
                   )}
                   {vendor.certifications?.length > 0 && (
                      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                         <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-600" /> Certifications
                         </h3>
                         <ul className="space-y-2">
                            {vendor.certifications.map((cert, i) => (
                               <li key={i} className="text-slate-700 text-sm list-disc list-inside">{cert}</li>
                            ))}
                         </ul>
                      </div>
                   )}
                </section>
             )}

             {/* Reviews */}
             <section id="reviews" className="pt-8 border-t border-slate-200">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-bold text-slate-900">Seller Reviews</h2>
                   <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-slate-900">{averageRating.toFixed(1)}</span>
                      <div className="flex flex-col">
                         <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.round(averageRating) ? "fill-current" : "text-slate-200"}`} />
                            ))}
                         </div>
                         <span className="text-xs text-slate-500">{reviews.length} ratings</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-8">
                   <ReviewForm vendorId={vendor.id} vendorName={vendor.business_name} />
                   <ReviewsList vendorId={vendor.id} />
                </div>
             </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             <div className="sticky top-24">
                <RatingStats reviews={reviews} />
                
                {/* Related Vendors Mini */}
                <div className="mt-8">
                   <h3 className="font-bold text-slate-900 mb-4">Similar Vendors</h3>
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