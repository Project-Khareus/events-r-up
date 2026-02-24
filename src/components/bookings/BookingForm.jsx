import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { toast } from "sonner";

export default function BookingForm({ vendorId, vendorName, compact = false }) {
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        throw new Error("Please log in to submit a booking request");
      }
      
      const user = await base44.auth.me();
      
      const bookingPayload = {
        ...bookingData,
        vendor_id: vendorId,
        vendor_name: vendorName,
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email,
        status: "pending"
      };
      
      return base44.entities.Booking.create(bookingPayload);
    },
    onMutate: async (bookingData) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previousBookings = queryClient.getQueryData(['bookings']);
      const optimisticBooking = {
        ...bookingData,
        id: `optimistic_${Date.now()}`,
        vendor_id: vendorId,
        vendor_name: vendorName,
        status: "pending",
        created_date: new Date().toISOString(),
        _optimistic: true,
      };
      queryClient.setQueryData(['bookings'], (old = []) => [optimisticBooking, ...old]);
      // Immediately clear form for instant feedback
      setEventDate("");
      setGuestCount("");
      setMessage("");
      toast.success("Booking request submitted!");
      return { previousBookings, formSnapshot: bookingData };
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      try {
        await base44.functions.invoke('trackBookingMetrics', { bookingId: booking.id, action: 'created' });
      } catch {}
      try {
        await base44.functions.invoke('notifyNewBooking', { bookingId: booking.id });
      } catch {}
    },
    onError: (error, bookingData, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(['bookings'], context.previousBookings);
      }
      // Restore form on failure
      if (context?.formSnapshot) {
        setEventDate(context.formSnapshot.event_date || "");
        setGuestCount(String(context.formSnapshot.guest_count || ""));
        setMessage(context.formSnapshot.message || "");
      }
      if (error.message?.includes("log in")) {
        toast.error(error.message);
        setTimeout(() => base44.auth.redirectToLogin(window.location.href), 1500);
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to submit booking request");
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!eventDate) {
      toast.error("Please select an event date");
      return;
    }

    if (!guestCount || guestCount <= 0) {
      toast.error("Please enter a valid guest count");
      return;
    }

    if (!vendorId) {
      toast.error("Vendor information is missing");
      return;
    }

    createBookingMutation.mutate({
      event_date: eventDate,
      guest_count: parseInt(guestCount),
      message: message.trim()
    });
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="event-date-compact" className="text-sm mb-2 block flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            Event Date *
          </Label>
          <Input
            id="event-date-compact"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl"
            required
          />
        </div>

        <div>
          <Label htmlFor="guest-count-compact" className="text-sm mb-2 block flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            Number of Guests *
          </Label>
          <Input
            id="guest-count-compact"
            type="number"
            min="1"
            placeholder="e.g., 50"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>

        <div>
          <Label htmlFor="message-compact" className="text-sm mb-2 block">
            Additional Details
          </Label>
          <Textarea
            id="message-compact"
            placeholder="Tell us about your event..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-20 resize-none rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={createBookingMutation.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11"
        >
          {createBookingMutation.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    );
  }

  return (
    <Card className="p-8 rounded-2xl border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Request a Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Date */}
        <div>
          <Label htmlFor="event-date" className="text-base mb-3 block flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            Event Date *
          </Label>
          <Input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl"
            required
          />
        </div>

        {/* Guest Count */}
        <div>
          <Label htmlFor="guest-count" className="text-base mb-3 block flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            Number of Guests *
          </Label>
          <Input
            id="guest-count"
            type="number"
            min="1"
            placeholder="e.g., 50"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="message" className="text-base mb-3 block">
            Additional Details (optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Tell us more about your event, special requests, or questions..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-32 resize-none rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={createBookingMutation.isPending}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl h-12 text-base font-medium shadow-lg shadow-indigo-200"
        >
          {createBookingMutation.isPending ? "Submitting..." : "Submit Booking Request"}
        </Button>
      </form>
    </Card>
  );
}