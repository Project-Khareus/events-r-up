import React from "react";
import { base44 } from "@/api/base44Client";
import formatVendorLocation from "@/components/utils/formatLocation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import VendorInfoCard from "@/components/vendor/VendorInfoCard";
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
  RotateCcw
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewsList from "../components/reviews/ReviewsList";
import MediaGallery from "../components/vendor/MediaGallery";
import RelatedVendors from "../components/vendor/RelatedVendors";
import ContactBookingModal from "../components/vendor/ContactBookingModal";
import ShareButton from "../components/shared/ShareButton";
import MetaTags from "../components/shared/MetaTags";
import VendorFavoriteButton from "../components/vendor/VendorFavoriteButton";
import MobileHeader from "../components/layout/MobileHeader";
import ReportDialog from "../components/reports/ReportDialog";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import { capitalizeHtmlSentences } from "@/components/utils/capitalizeHtml";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useParams } from "react-router-dom";
import { parseVendorSlug, getVendorUrl, getVendorNameFromSlug, normalizeVendorName } from "../utils/vendorUrl";
import "@/components/vendor/vendorDetailDark.css";

const CATEGORY_LABELS = {
  event_planner: "Event Planner",
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
  bridal_fashion: "Fashion & Accessories",
  beauty_personal_care: "Beauty & Personal Care",
  decor_logistics: "Décor & Logistics",
  event_grounds: "Event Venues",
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
  wreaths: "Wreaths",
  others: "Others"
};

export default function VendorDetail() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  // Support both /vendor/:slug and legacy ?id= URLs
  const vendorIdFromQuery = urlParams.get("id");
  const isAdminPreview = urlParams.get("preview") === "admin";
  const shortIdFromSlug = slug ? parseVendorSlug(slug) : null;
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', vendorIdFromQuery || shortIdFromSlug],
    queryFn: async () => {
      // Direct ID lookup (preferred — from ?id= param)
      if (vendorIdFromQuery) {
        const results = await base44.entities.Vendor.filter({ id: vendorIdFromQuery });
        if (results[0]) return results[0];
      }

      // Reliable fallback: fetch vendors and match by full ID or slug suffix
      const allVendors = await base44.entities.Vendor.list('-created_date', 1000);
      if (vendorIdFromQuery) {
        const directMatch = allVendors.find(v => v.id === vendorIdFromQuery);
        if (directMatch) return directMatch;
      }
      if (shortIdFromSlug) {
        const slugMatch = allVendors.find(v => v.id.endsWith(shortIdFromSlug));
        if (slugMatch) return slugMatch;
      }

      const slugName = getVendorNameFromSlug(slug);
      if (slugName) {
        return allVendors.find((v) => {
          const vendorName = normalizeVendorName(v.business_name);
          return vendorName === slugName || vendorName.startsWith(`${slugName}-`);
        }) ?? null;
      }

      return null;
    },
    enabled: !!(vendorIdFromQuery || shortIdFromSlug),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    staleTime: 300000,
  });

  // Redirect legacy ?id= URLs to clean slug URLs
  React.useEffect(() => {
    if (vendor && vendorIdFromQuery && !slug) {
      const cleanUrl = getVendorUrl(vendor);
      window.history.replaceState(null, '', cleanUrl);
    }
  }, [vendor, vendorIdFromQuery, slug]);

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) return null;
      return base44.auth.me();
    },
    staleTime: 600000,
  });

  // Only fetch reviews after vendor loads to avoid rate limits
  const vendorId = vendor?.id;

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', vendorId],
    queryFn: () => base44.entities.Review.filter({ vendor_id: vendorId }, '-created_date', 50),
    enabled: !!vendor,
    staleTime: 300000,
  });

  // Jump to top when a different vendor is opened (e.g. from Related Vendors)
  React.useEffect(() => {
    if (vendor) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [vendor?.id]);

  // Track profile view after vendor loads (non-critical, delayed)
  React.useEffect(() => {
    if (!vendor?.id || vendor.status !== 'approved') return;
    const timer = setTimeout(() => {
      base44.functions.invoke('trackProfileView', { vendorId: vendor.id }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [vendor?.id, vendor?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
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

  // Block access to non-approved vendors unless the user is the owner or an admin
  const isOwnerOrAdmin = currentUser && (
    vendor?.user_id === currentUser.id || currentUser.role === 'admin'
  );

  // Wait for user check before showing "not found" for non-approved vendors
  if (!vendor) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Vendor not found</h2>
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

  if (vendor.status && vendor.status !== 'approved') {
    if (isLoadingUser) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      );
    }
    if (!isOwnerOrAdmin && !isAdminPreview) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Vendor not found</h2>
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
  }

  const allImages = [vendor.image_url, ...(vendor.gallery_images || [])].filter(Boolean);
  const allVideos = vendor.gallery_videos || [];
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : (vendor.rating || 0);
    
  const reviewCount = reviews.length;
  
  return (
    <div className="vendor-espresso min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <MetaTags 
        title={vendor.business_name}
        description={vendor.description || `${vendor.business_name} - Professional ${CATEGORY_LABELS[vendor.category] || vendor.category} services for your special events.`}
        image={vendor.image_url || vendor.logo_url}
        url={window.location.href}
        type="business.business"
      />
      <MobileHeader title={vendor.business_name} />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Breadcrumbs */}
        <nav className="vendor-crumb hidden md:flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-5">
          <Link to={createPageUrl("VendorMarketplace")} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to={createPageUrl("VendorMarketplace")} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0">Vendors</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to={createPageUrl(`VendorMarketplace?category=${Array.isArray(vendor.category) ? vendor.category[0] : vendor.category}`)} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate">
            {CATEGORY_LABELS[Array.isArray(vendor.category) ? vendor.category[0] : vendor.category] || (Array.isArray(vendor.category) ? vendor.category[0] : vendor.category)}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[200px]">{vendor.business_name}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="vendor-gallery lg:col-span-7">
             <MediaGallery images={allImages} videos={allVideos} businessName={vendor.business_name} />
          </div>

          {/* Right Column: Product Info (5 cols) */}
          <div className="lg:col-span-5">
            <VendorInfoCard
              vendor={vendor}
              averageRating={averageRating}
              reviewCount={reviewCount}
              categoryLabels={CATEGORY_LABELS}
              showAllCategories={showAllCategories}
              setShowAllCategories={setShowAllCategories}
            />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="vendor-lower mt-8 sm:mt-10 lg:mt-12 grid lg:grid-cols-12 gap-6 lg:gap-8 border-t border-slate-200 dark:border-slate-700 pt-6 sm:pt-8 lg:pt-10">
          <div className="lg:col-span-7 space-y-8">
             
             {/* Description */}
             <section className="vendor-section">
                              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-3">Description</h2>
                 <style>{`
                   .vendor-description,
                   .vendor-description * {
                     color: inherit !important;
                     background: transparent !important;
                   }
                   .vendor-description b,
                   .vendor-description strong {
                     font-weight: inherit !important;
                   }
                 `}</style>
                 <div 
                   className="vendor-description prose prose-slate max-w-none text-slate-600 dark:text-slate-300 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: sanitizeHtml(capitalizeHtmlSentences(vendor.description)) || "<p>No description provided.</p>" }}
                 />
             </section>

             {/* Services */}
             {vendor.services && vendor.services.length > 0 && (
               <section className="vendor-section">
                                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-3">Services Included</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {vendor.services.map((service, index) => (
                      <div key={index} className="vendor-service flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-slate-900 dark:text-slate-300 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{service}</span>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* Reviews */}
             <section id="reviews" className="vendor-section pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">Reviews ({reviews.length})</h2>
                </div>
                
                <div className="space-y-6">
                   <ReviewForm vendorId={vendor.id} vendorName={vendor.business_name} />
                   <ReviewsList vendorId={vendor.id} />
                </div>
             </section>
          </div>

          {/* Sidebar - Ratings & Similar */}
          <div className="vendor-aside lg:col-span-5 space-y-6">
             <div className="sticky top-24">
                <div className="vendor-related">
                                    <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 mb-4 text-xl">You might also like</h3>
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