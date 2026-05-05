import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Eye, Calendar, CheckCircle, Star, ArrowLeft, Loader2, BarChart3, TrendingUp, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format, subDays } from "date-fns";
import MetricCard from "../components/analytics/MetricCard";
import RecentBookingRow from "../components/analytics/RecentBookingRow";

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function VendorAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("views");

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href))
      .finally(() => setLoading(false));
  }, []);

  const { data: vendors = [] } = useQuery({
    queryKey: ['my_vendor', user?.id],
    queryFn: () => base44.entities.Vendor.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const vendor = vendors[0];

  const { data: analytics = [] } = useQuery({
    queryKey: ['vendor_analytics', vendor?.id, dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const all = await base44.entities.VendorAnalytics.filter({ vendor_id: vendor.id });
      return all.filter(a => a.date >= startDate).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!vendor,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['vendor_bookings', vendor?.id],
    queryFn: () => base44.entities.Booking.filter({ vendor_id: vendor.id }),
    enabled: !!vendor,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['vendor_reviews', vendor?.id],
    queryFn: () => base44.entities.Review.filter({ vendor_id: vendor.id }),
    enabled: !!vendor,
  });

  const metrics = useMemo(() => {
    const totalViews = analytics.reduce((s, a) => s + (a.profile_views || 0), 0);
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const responded = confirmedBookings + bookings.filter(b => b.status === 'declined').length;
    const responseRate = bookings.length > 0 ? ((responded / bookings.length) * 100).toFixed(0) : 0;
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

    return { totalViews, totalBookings: bookings.length, confirmedBookings, pendingBookings, responseRate, avgRating, reviewCount: reviews.length };
  }, [analytics, bookings, reviews]);

  const viewsChartData = useMemo(() =>
    analytics.map(a => ({ date: format(new Date(a.date), 'MMM dd'), views: a.profile_views || 0 })),
    [analytics]
  );

  const bookingsChartData = useMemo(() =>
    analytics.map(a => ({ date: format(new Date(a.date), 'MMM dd'), bookings: a.total_bookings || 0, confirmed: a.confirmed_bookings || 0 })),
    [analytics]
  );

  const bookingStatusData = useMemo(() => {
    const counts = { Confirmed: 0, Pending: 0, Declined: 0, Completed: 0 };
    bookings.forEach(b => {
      const key = b.status?.charAt(0).toUpperCase() + b.status?.slice(1);
      if (counts[key] !== undefined) counts[key]++;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center p-10">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Vendor Profile</h2>
          <p className="text-slate-500 mb-6">Create a vendor profile to start tracking your performance.</p>
          <Link to={createPageUrl("VendorSignup")}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Create Vendor Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const charts = {
    views: {
      title: "Profile Views",
      description: "How many people visited your listing",
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={viewsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
            <Line type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3, fill: '#4f46e5' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    bookings: {
      title: "Booking Requests",
      description: "Total requests vs confirmed bookings",
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bookingsChartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
            <Bar dataKey="bookings" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Requests" />
            <Bar dataKey="confirmed" fill="#10b981" radius={[4, 4, 0, 0]} name="Confirmed" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    status: {
      title: "Booking Breakdown",
      description: "How your bookings are distributed",
      content: bookingStatusData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={bookingStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {bookingStatusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
          No booking data yet
        </div>
      ),
    },
  };

  const activeChartConfig = charts[activeChart];

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("ManageListing")}>
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-slate-300">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h1>
              <p className="text-slate-500 text-sm sm:text-base">{vendor.business_name}</p>
            </div>
          </div>
          <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {[
              { days: 7, label: "7d" },
              { days: 30, label: "30d" },
              { days: 90, label: "90d" },
            ].map(({ days, label }) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dateRange === days
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <MetricCard icon={Eye} iconColor="bg-indigo-500" label="Profile Views" value={metrics.totalViews.toLocaleString()} subtitle={`Last ${dateRange} days`} />
          <MetricCard icon={Calendar} iconColor="bg-blue-500" label="Bookings" value={metrics.totalBookings} subtitle={`${metrics.pendingBookings} pending`} />
          <MetricCard icon={CheckCircle} iconColor="bg-emerald-500" label="Response Rate" value={`${metrics.responseRate}%`} subtitle={`${metrics.confirmedBookings} confirmed`} />
          <MetricCard icon={Star} iconColor="bg-amber-500" label="Avg Rating" value={metrics.avgRating} subtitle={`${metrics.reviewCount} review${metrics.reviewCount !== 1 ? 's' : ''}`} />
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
          {/* Chart Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{activeChartConfig.title}</h2>
              <p className="text-sm text-slate-400">{activeChartConfig.description}</p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
              {[
                { key: "views", icon: TrendingUp, label: "Views" },
                { key: "bookings", icon: ClipboardList, label: "Bookings" },
                { key: "status", icon: BarChart3, label: "Breakdown" },
              ].map(({ key, icon: TabIcon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeChart === key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chart Body */}
          {activeChartConfig.content}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Recent Bookings</h2>
          <p className="text-sm text-slate-400 mb-4">Your latest booking requests</p>

          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No bookings yet</p>
              <p className="text-slate-400 text-xs mt-1">When customers book you, they'll appear here</p>
            </div>
          ) : (
            <div>
              {bookings.slice(0, 5).map(b => (
                <RecentBookingRow key={b.id} booking={b} />
              ))}
              {bookings.length > 5 && (
                <p className="text-center text-sm text-indigo-600 font-medium mt-4 cursor-pointer hover:underline">
                  View all {bookings.length} bookings
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}