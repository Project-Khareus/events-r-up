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
import MediaGallery from "../components/vendor/MediaGallery";
import RelatedVendors from "../components/vendor/RelatedVendors";
import ContactBookingModal from "../components/vendor/ContactBookingModal";
import ShareButton from "../components/shared/ShareButton";
import MetaTags from "../components/shared/MetaTags";
import VendorFavoriteButton from "../components/vendor/VendorFavoriteButton";
import AvailabilityCalendar from "../components/vendor/AvailabilityCalendar";
import MobileHeader from "../components/layout/MobileHeader";
import ReportDialog from "../components/reports/ReportDialog";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import { capitalizeHtmlSentences } from "@/components/utils/capitalizeHtml";
import { useParams } from "react-router-dom";
import { parseVendorSlug, getVendorUrl } from "../utils/vendorUrl";

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
  makeup_artistes: "Beauty & Personal Care",
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
  fashion_wreaths: "Fashion & Wreaths",
  others: "Others"
};

export default function VendorDetail() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  // Support both /vendor/:slug and legacy ?id= URLs
  const vendorIdFromQuery = urlParams.get("id");
  const shortIdFromSlug = slug ? parseVendorSlug(slug) : null;
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', vendorIdFromQuery || shortIdFromSlug],
    queryFn: async () => {
      // Direct ID lookup (legacy ?id= param)
      if (vendorIdFromQuery) {
        const results = await base44.entities.Vendor.filter({ id: vendorIdFromQuery });
        return results[0] ?? null;
      }
      // Slug-based lookup: find vendor whose ID ends with the short ID
      if (shortIdFromSlug) {
        const allVendors = await base44.entities.Vendor.list('-created_date', 200);
        const match = allVendors.find(v => v.id.endsWith(shortIdFromSlug));
        return match ?? null;
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

  // Track profile view after vendor loads (non-critical, delayed)
  React.useEffect(() => {
    if (!vendor?.id) return;
    const timer = setTimeout(() => {
      base44.functions.invoke('trackProfileView', { vendorId: vendor.id }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [vendor?.id]);

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
    if (!isOwnerOrAdmin) {
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
  
  // Categories that need availability calendar
  const BOOKING_CATEGORIES = [
    'beauty_personal_care',
    'event_grounds',
    'photography_videography',
    'catering',
    'music_karaoke_mc',
    'conference_facilities',
    'decor_logistics',
    'car_rentals'
  ];
  
  const needsCalendar = vendor.category && (
    Array.isArray(vendor.category) 
      ? vendor.category.some(cat => BOOKING_CATEGORIES.includes(cat))
      : BOOKING_CATEGORIES.includes(vendor.category)
  );
  
  const isVendorOwner = currentUser && vendor.user_id === currentUser.id;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
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
        <nav className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-5">
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
          <div className="lg:col-span-7">
             <MediaGallery images={allImages} videos={allVideos} businessName={vendor.business_name} />
          </div>

          {/* Right Column: Product Info (5 cols) */}
          <div className="lg:col-span-5">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 leading-tight break-words">
                {vendor.business_name}
              </h1>
              
              {vendor.slogan && (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">{vendor.slogan}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-2">
                {(Array.isArray(vendor.category) ? vendor.category : [vendor.category]).slice(0, showAllCategories ? undefined : 3).map((cat, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                    {CATEGORY_LABELS[cat] || cat}
                  </Badge>
                ))}
                {Array.isArray(vendor.category) && vendor.category.length > 3 && !showAllCategories && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 cursor-pointer"
                    onClick={() => setShowAllCategories(true)}
                  >
                    +{vendor.category.length - 3} more
                  </Badge>
                )}
              </div>
              
              {vendor.location && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 mb-4">
            <div className="flex text-slate-900">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(averageRating) ? "fill-slate-900 dark:fill-slate-100 text-slate-900 dark:text-slate-100" : "text-slate-300 dark:text-slate-600"}`} />
              ))}
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{averageRating.toFixed(1)}/5</span>
            <span className="text-slate-500 dark:text-slate-400 underline decoration-slate-300 underline-offset-2">
                ({reviewCount} reviews)
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {vendor.starting_price ? formatPrice(vendor.starting_price, getCurrencyByCode(vendor.price_currency)) : "Price varies"}
                </span>
                {vendor.starting_price && <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal">starting price</span>}
              </div>
              {vendor.price_range && (
                <Badge variant="secondary" className="mt-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-100 border-0 rounded-sm font-medium">
                  Price Range: {vendor.price_range}
                </Badge>
              )}
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex gap-3">
                <div className="flex-1">
                  <ContactBookingModal 
                    vendor={vendor} 
                    trigger={
                      <Button className="w-full h-12 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-none transition-all active:scale-95">
                         Contact / Book Now
                      </Button>
                    }
                  />
                </div>
                <VendorFavoriteButton vendorId={vendor.id} size="icon" className="h-12 w-12 rounded-lg border-slate-300" />
              </div>
              <div className="flex gap-2">
                <ShareButton 
                  url={`${window.location.origin}${getVendorUrl(vendor)}`}
                  title={`${vendor.business_name} - Event Vendor`}
                  description={vendor.description || `Check out ${vendor.business_name} on Khareus!`}
                  variant="outline"
                  className="flex-1 h-11"
                />
                <ReportDialog
                  targetType="vendor"
                  targetId={vendor.id}
                  targetName={vendor.business_name}
                />
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
                   <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:underline">Verified Vendor Identity</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Background checked & approved</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
                   <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:underline">Secure Booking Payment</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your funds are held safely</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>

              {vendor.years_in_business && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
                     <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:underline">Experienced Pro</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{vendor.years_in_business}+ years in business</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              )}
            </div>

            {/* Social Media Links */}
            {(vendor.instagram || vendor.facebook || vendor.twitter || vendor.tiktok || vendor.linkedin || vendor.website) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Connect with us</h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.website && (
                    <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </a>
                  )}
                  {vendor.instagram && (
                    <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-pink-600 dark:group-hover:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.facebook && (
                    <a href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.twitter && (
                    <a href={`https://twitter.com/${vendor.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-sky-500 dark:group-hover:text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.tiktok && (
                    <a href={`https://tiktok.com/@${vendor.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </a>
                  )}
                  {vendor.linkedin && (
                    <a href={vendor.linkedin.startsWith('http') ? vendor.linkedin : `https://linkedin.com/in/${vendor.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12 grid lg:grid-cols-12 gap-6 lg:gap-8 border-t border-slate-200 dark:border-slate-700 pt-6 sm:pt-8 lg:pt-10">
          <div className="lg:col-span-7 space-y-8">
             
             {/* Description */}
             <section>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-3">Description</h2>
                 <div 
                   className="prose prose-slate max-w-none text-slate-600 dark:text-slate-300 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: capitalizeHtmlSentences(vendor.description) || "<p>No description provided.</p>" }}
                 />
             </section>

             {/* Services */}
             {vendor.services && vendor.services.length > 0 && (
               <section>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-3">Services Included</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {vendor.services.map((service, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-slate-900 dark:text-slate-300 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{service}</span>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* Reviews */}
             <section id="reviews" className="pt-6 border-t border-slate-200 dark:border-slate-700">
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
          <div className="lg:col-span-5 space-y-6">
             <div className="sticky top-24">
                <RatingStats reviews={reviews} />
                
                {needsCalendar && (
                  <div className="mt-6">
                    <AvailabilityCalendar vendorId={vendor.id} isOwner={isVendorOwner} />
                  </div>
                )}
                
                <div className="mt-8">
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