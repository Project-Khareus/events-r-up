import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store, Loader2, Plus, Edit2, ExternalLink, Clock, CheckCircle2,
  BarChart3, Eye, CalendarDays, Star, AlertCircle, ArrowRight,
  MessageCircle, ImageIcon, MapPin, TrendingUp, Users
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays } from "date-fns";

function StatusBadge({ vendor }) {
  if (vendor.status === "approved") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> Live
    </span>
  );
  if (vendor.status === "pending") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" /> Under Review
    </span>
  );
  if (vendor.status === "rejected") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
      <AlertCircle className="h-3 w-3" /> Rejected
    </span>
  );
  if (vendor.status === "suspended") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
      <AlertCircle className="h-3 w-3" /> Suspended
    </span>
  );
  return null;
}

function ProfileCompletion({ vendor }) {
  const checks = [
    { label: "Business name", done: !!vendor.business_name },
    { label: "Description", done: !!vendor.description },
    { label: "Cover image", done: !!vendor.image_url },
    { label: "Gallery photos", done: vendor.gallery_images?.length > 0 },
    { label: "Location", done: !!vendor.location },
    { label: "Contact info", done: !!vendor.contact_email || !!vendor.contact_phone },
    { label: "Services list", done: vendor.services?.length > 0 },
    { label: "Starting price", done: !!vendor.starting_price },
  ];
  const completed = checks.filter(c => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);
  const missing = checks.filter(c => !c.done);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-800 text-sm">Profile Strength</span>
        <span className={`text-sm font-bold ${pct === 100 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"}`}>{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {missing.length > 0 && (
        <div className="space-y-1">
          {missing.slice(0, 3).map(m => (
            <div key={m.label} className="flex items-center gap-2 text-xs text-slate-500">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Add {m.label}
            </div>
          ))}
          {missing.length > 3 && (
            <p className="text-xs text-slate-400">+{missing.length - 3} more items</p>
          )}
        </div>
      )}
    </div>
  );
}

function MiniSparkline({ data }) {
  if (!data || data.length === 0) return <div className="h-10 flex items-end text-xs text-slate-400">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Tooltip
          contentStyle={{ fontSize: 10, padding: "2px 6px", borderRadius: 4 }}
          labelFormatter={() => ""}
          formatter={(v) => [v, "Views"]}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function VendorDashboardCard({ vendor, analytics, bookings, reviews }) {
  const totalViews = analytics.reduce((s, a) => s + (a.profile_views || 0), 0);
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const sparkData = analytics.slice(-14).map(a => ({ views: a.profile_views || 0 }));

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200">
        {vendor.image_url && !imgError ? (
          <img
            src={vendor.image_url}
            alt={vendor.business_name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status + trial badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge vendor={vendor} />
          {vendor.is_trial && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Trial</span>
          )}
        </div>

        {/* Business name overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg leading-tight truncate">{vendor.business_name}</h3>
          {vendor.location && (
            <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
              <MapPin className="h-3 w-3" /> {vendor.location}
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-bold text-slate-900">{totalViews}</p>
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1"><Eye className="h-3 w-3" /> Views</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-bold text-slate-900">{pendingBookings}</p>
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1"><CalendarDays className="h-3 w-3" /> Pending</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-bold text-slate-900">{avgRating ?? "—"}</p>
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1"><Star className="h-3 w-3" /> Rating</p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[11px] text-slate-400 mb-1">Views (last 14 days)</p>
        <MiniSparkline data={sparkData} />
      </div>

      {/* Alerts */}
      {vendor.has_pending_changes && (
        <div className="mx-4 mb-3 mt-2 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Changes are pending admin review
        </div>
      )}
      {vendor.status === "rejected" && (
        <div className="mx-4 mb-3 mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Listing was rejected. Edit and resubmit.
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 flex gap-2">
        <Link to={`${createPageUrl("EditVendor")}?id=${vendor.id}`} className="flex-1">
          <Button variant="outline" className="w-full text-sm h-9 gap-1.5">
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
        </Link>
        <Link to={`${createPageUrl("VendorDetail")}?id=${vendor.id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-800">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
        <Link to={`${createPageUrl("VendorAnalytics")}?id=${vendor.id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-500 hover:text-indigo-700">
            <BarChart3 className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ManageListing() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return null;
      }
      return base44.auth.me();
    },
  });

  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ['userVendors', user?.id],
    queryFn: () => base44.entities.Vendor.filter({ user_id: user.id }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: allAnalytics = [] } = useQuery({
    queryKey: ['allVendorAnalytics', vendors.map(v => v.id).join(",")],
    queryFn: async () => {
      if (vendors.length === 0) return [];
      const results = await Promise.all(
        vendors.map(v => base44.entities.VendorAnalytics.filter({ vendor_id: v.id }))
      );
      return results.flat();
    },
    enabled: vendors.length > 0,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allVendorBookings', vendors.map(v => v.id).join(",")],
    queryFn: async () => {
      if (vendors.length === 0) return [];
      const results = await Promise.all(
        vendors.map(v => base44.entities.Booking.filter({ vendor_id: v.id }))
      );
      return results.flat();
    },
    enabled: vendors.length > 0,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allVendorReviews', vendors.map(v => v.id).join(",")],
    queryFn: async () => {
      if (vendors.length === 0) return [];
      const results = await Promise.all(
        vendors.map(v => base44.entities.Review.filter({ vendor_id: v.id }))
      );
      return results.flat();
    },
    enabled: vendors.length > 0,
  });

  const trialCount = vendors.filter(v => v.is_trial === true).length;
  const trialsLeft = Math.max(0, 3 - trialCount);

  // Aggregate totals for the summary bar
  const totalViews = allAnalytics.reduce((s, a) => s + (a.profile_views || 0), 0);
  const totalPending = allBookings.filter(b => b.status === "pending").length;
  const totalBookings = allBookings.length;
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null;

  const recentBookings = [...allBookings]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  const recentReviews = [...allReviews]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  if (isLoadingUser || isLoadingVendors) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
              <p className="text-slate-400 text-sm mt-0.5">Welcome back, {user.full_name?.split(" ")[0]}</p>
            </div>
            <Link to={createPageUrl("VendorSignup")}>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold gap-2">
                <Plus className="h-4 w-4" />
                Add Listing
                {trialsLeft > 0 && <span className="text-xs bg-slate-200 rounded-full px-2 py-0.5">{trialsLeft} free</span>}
              </Button>
            </Link>
          </div>

          {/* Summary stats */}
          {vendors.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Total Views", value: totalViews, icon: Eye },
                { label: "Bookings", value: totalBookings, icon: CalendarDays },
                { label: "Pending", value: totalPending, icon: Clock, highlight: totalPending > 0 },
                { label: "Avg Rating", value: avgRating ?? "—", icon: Star },
              ].map(({ label, value, icon: Icon, highlight }) => (
                <div key={label} className={`rounded-xl px-4 py-3 ${highlight ? "bg-amber-500/20 border border-amber-400/30" : "bg-white/10"}`}>
                  <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </div>
                  <p className={`text-2xl font-bold ${highlight ? "text-amber-300" : "text-white"}`}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {vendors.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
              <Store className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No listings yet</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              Create your first vendor listing to start connecting with customers and getting bookings.
            </p>
            <Link to={createPageUrl("VendorSignup")}>
              <Button className="bg-slate-900 hover:bg-black gap-2">
                <Plus className="h-4 w-4" /> Create Your First Listing
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="listings" className="space-y-6">
            <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-auto">
              <TabsTrigger value="listings" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white px-5 py-2 text-sm font-medium">
                My Listings
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white px-5 py-2 text-sm font-medium">
                Bookings {totalPending > 0 && <span className="ml-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{totalPending}</span>}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white px-5 py-2 text-sm font-medium">
                Reviews
              </TabsTrigger>
            </TabsList>

            {/* LISTINGS TAB */}
            <TabsContent value="listings">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map(vendor => (
                  <div key={vendor.id} className="flex flex-col gap-4">
                    <VendorDashboardCard
                      vendor={vendor}
                      analytics={allAnalytics.filter(a => a.vendor_id === vendor.id)}
                      bookings={allBookings.filter(b => b.vendor_id === vendor.id)}
                      reviews={allReviews.filter(r => r.vendor_id === vendor.id)}
                    />
                    <ProfileCompletion vendor={vendor} />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* BOOKINGS TAB */}
            <TabsContent value="bookings">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Recent Booking Requests</h2>
                  <Link to={createPageUrl("Bookings")}>
                    <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                {recentBookings.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No bookings yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentBookings.map(booking => {
                      const vendorName = vendors.find(v => v.id === booking.vendor_id)?.business_name;
                      return (
                        <div key={booking.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                              {booking.user_name?.[0] ?? "?"}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{booking.user_name}</p>
                              <p className="text-xs text-slate-500">
                                {vendorName && <span className="text-slate-400">{vendorName} · </span>}
                                {booking.event_date ? format(new Date(booking.event_date), "MMM d, yyyy") : "—"}
                                {booking.guest_count && ` · ${booking.guest_count} guests`}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                            booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* REVIEWS TAB */}
            <TabsContent value="reviews">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Recent Reviews</h2>
                </div>
                {recentReviews.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Star className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No reviews yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentReviews.map(review => {
                      const vendorName = vendors.find(v => v.id === review.vendor_id)?.business_name;
                      return (
                        <div key={review.id} className="px-6 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                  ))}
                                </div>
                                <span className="text-xs text-slate-500">{review.reviewer_name}</span>
                              </div>
                              <p className="text-sm text-slate-700 line-clamp-2">{review.review_text}</p>
                              {vendorName && <p className="text-xs text-slate-400 mt-1">{vendorName}</p>}
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {format(new Date(review.created_date), "MMM d")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}