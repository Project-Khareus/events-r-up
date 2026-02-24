import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Calendar, Filter, List, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import BookingCard from "../components/bookings/BookingCard";
import CalendarView from "../components/bookings/CalendarView";
import { Skeleton } from "@/components/ui/skeleton";

export default function Bookings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.list('-created_date', 100);
      console.log('All bookings fetched:', allBookings.length, allBookings);
      return allBookings;
    },
    refetchInterval: 10000,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const allVendors = await base44.entities.Vendor.list();
      console.log('All vendors fetched:', allVendors.length, allVendors);
      return allVendors;
    },
  });

  const myVendor = vendors.find(v => v.user_id === currentUser?.id || v.created_by === currentUser?.email);
  const isVendor = !!myVendor;
  console.log('Current user:', currentUser, 'Is vendor:', isVendor, 'My vendor:', myVendor);

  // Filter bookings based on user role
  const roleFilteredBookings = isVendor 
    ? bookings.filter(b => b.vendor_id === myVendor?.id)
    : bookings.filter(b => b.user_id === currentUser?.id);

  const filteredBookings = roleFilteredBookings.filter(booking => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  const stats = {
    pending: roleFilteredBookings.filter(b => b.status === "pending").length,
    confirmed: roleFilteredBookings.filter(b => b.status === "confirmed").length,
    declined: roleFilteredBookings.filter(b => b.status === "declined").length,
    completed: roleFilteredBookings.filter(b => b.status === "completed").length,
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {isVendor ? "Booking Requests" : "My Bookings"}
              </h1>
              <p className="text-slate-600">
                {isVendor ? "Manage incoming booking requests" : "View and track your booking requests"}
              </p>
            </div>
          </div>
          
          {isVendor && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-indigo-600" : ""}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={viewMode === "calendar" ? "bg-indigo-600" : ""}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </div>
          )}
        </div>

        {viewMode === "calendar" && isVendor ? (
          <CalendarView bookings={filteredBookings} isVendor={isVendor} />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-600 mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-600 mb-1">Declined</p>
                <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-slate-600">{stats.completed}</p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-6">
              <Filter className="h-5 w-5 text-slate-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bookings List */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No bookings found</h3>
                <p className="text-slate-600">
                  {statusFilter === "all" 
                    ? "You don't have any bookings yet" 
                    : `No ${statusFilter} bookings`}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isVendor={isVendor}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}