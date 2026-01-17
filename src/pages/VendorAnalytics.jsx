import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Eye, Calendar, CheckCircle, TrendingUp, DollarSign, MessageSquare, Star, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function VendorAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState(30); // 7, 30, or 90 days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch vendor
  const { data: vendors = [] } = useQuery({
    queryKey: ['my_vendor', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Vendor.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const vendor = vendors[0];

  // Fetch analytics data
  const { data: analytics = [] } = useQuery({
    queryKey: ['vendor_analytics', vendor?.id, dateRange],
    queryFn: async () => {
      if (!vendor) return [];
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const allAnalytics = await base44.entities.VendorAnalytics.filter({ vendor_id: vendor.id });
      return allAnalytics.filter(a => a.date >= startDate).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!vendor
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['vendor_bookings', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      return await base44.entities.Booking.filter({ vendor_id: vendor.id });
    },
    enabled: !!vendor
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['vendor_reviews', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      return await base44.entities.Review.filter({ vendor_id: vendor.id });
    },
    enabled: !!vendor
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalViews = analytics.reduce((sum, a) => sum + (a.profile_views || 0), 0);
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const responseRate = totalBookings > 0 ? ((confirmedBookings + bookings.filter(b => b.status === 'declined').length) / totalBookings * 100).toFixed(1) : 0;
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
    const totalRevenue = analytics.reduce((sum, a) => sum + (a.revenue || 0), 0);

    return {
      totalViews,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      responseRate,
      avgRating,
      totalRevenue,
      reviewCount: reviews.length
    };
  }, [analytics, bookings, reviews]);

  // Chart data
  const viewsChartData = useMemo(() => {
    return analytics.map(a => ({
      date: format(new Date(a.date), 'MMM dd'),
      views: a.profile_views || 0
    }));
  }, [analytics]);

  const bookingsChartData = useMemo(() => {
    return analytics.map(a => ({
      date: format(new Date(a.date), 'MMM dd'),
      bookings: a.total_bookings || 0,
      confirmed: a.confirmed_bookings || 0
    }));
  }, [analytics]);

  const revenueChartData = useMemo(() => {
    return analytics.map(a => ({
      date: format(new Date(a.date), 'MMM dd'),
      revenue: a.revenue || 0
    }));
  }, [analytics]);

  const bookingStatusData = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const declined = bookings.filter(b => b.status === 'declined').length;
    const completed = bookings.filter(b => b.status === 'completed').length;

    return [
      { name: 'Confirmed', value: confirmed },
      { name: 'Pending', value: pending },
      { name: 'Declined', value: declined },
      { name: 'Completed', value: completed }
    ].filter(item => item.value > 0);
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
        <Card className="max-w-md w-full text-center p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Vendor Profile</h2>
          <p className="text-slate-600 mb-6">You need to create a vendor profile first to access analytics.</p>
          <Link to={createPageUrl("VendorSignup")}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Create Vendor Profile</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("ManageListing")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-slate-500">{vendor.business_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(days => (
              <Button
                key={days}
                variant={dateRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(days)}
                className={dateRange === days ? "bg-indigo-600" : ""}
              >
                {days} Days
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.totalViews}</div>
              <p className="text-xs text-slate-500 mt-1">Last {dateRange} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Booking Requests</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.totalBookings}</div>
              <p className="text-xs text-slate-500 mt-1">{metrics.pendingBookings} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Response Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.responseRate}%</div>
              <p className="text-xs text-slate-500 mt-1">{metrics.confirmedBookings} confirmed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.avgRating}</div>
              <p className="text-xs text-slate-500 mt-1">{metrics.reviewCount} reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="views" className="space-y-6">
          <TabsList>
            <TabsTrigger value="views">Profile Views</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="status">Status Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="views">
            <Card>
              <CardHeader>
                <CardTitle>Profile Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Requests Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#06b6d4" />
                    <Bar dataKey="confirmed" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-900">${metrics.totalRevenue.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.slice(0, 5).map(booking => (
              <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-slate-900">{booking.user_name}</p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(booking.event_date), 'MMM dd, yyyy')} • {booking.guest_count} guests
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-slate-500 text-center py-8">No bookings yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}