import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mail, MessageSquare, Check, X, CheckCircle, MapPin, Wallet, FileText, Phone } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-300" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-800 border-slate-300" },
  quoted: { label: "Quote received", className: "bg-gold/10 text-gold-text border-gold/30" }
};

const EVENT_LABELS = { weddings: "Wedding", parties: "Party", conference: "Conference", funeral: "Funeral", other: "Other" };
const cedis = (n, cur = "GHS") => {
  try { return new Intl.NumberFormat("en-GH", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); } catch { return `${cur} ${n}`; }
};

export default function BookingCard({ booking, isVendor, currentUserId }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.Booking.update(booking.id, { status: newStatus });
      
      // Track metrics
      try {
        const action = newStatus === 'confirmed' ? 'confirmed' : 'updated';
        await base44.functions.invoke('trackBookingMetrics', { 
          bookingId: booking.id, 
          action 
        });
      } catch (metricsError) {
        console.error("Failed to track metrics:", metricsError);
      }
      
      // Send email notification
      try {
        await base44.functions.invoke('notifyBookingStatusChange', { 
          bookingId: booking.id, 
          newStatus 
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
      
      return newStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(isVendor ? "Updated. The customer has been notified." : "Updated. The vendor has been notified.");
    },
    onError: () => {
      toast.error("Failed to update booking status");
    }
  });

  const handleStartChat = async () => {
    try {
      setIsStartingChat(true);
      const user = await base44.auth.me();
      
      // Determine chat partner based on role
      const otherUserId = isVendor ? booking.user_id : booking.vendor_id;
      const otherUserName = isVendor ? booking.user_name : booking.vendor_name;

      // Check if conversation already exists
      const allConvs = await base44.entities.Conversation.list();
      const existingConv = allConvs.find(
        c => (c.vendor_id === booking.vendor_id && c.user_id === booking.user_id) ||
             (c.user_id === booking.vendor_id && c.vendor_id === booking.user_id)
      );

      if (existingConv) {
        navigate(createPageUrl("Messages"));
        return;
      }

      // Create new conversation
      await base44.entities.Conversation.create({
        vendor_id: booking.vendor_id,
        vendor_name: booking.vendor_name,
        user_id: booking.user_id,
        user_name: booking.user_name,
        last_message: "",
        last_message_date: new Date().toISOString(),
        unread_count: 0,
        status: "active"
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success("Opening chat...");
      navigate(createPageUrl("Messages"));
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to start chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const isQuote = booking.request_type === "quote";
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNote, setQuoteNote] = useState("");

  const sendQuoteMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(quoteAmount);
      if (!amount || amount <= 0) throw new Error("Enter your price.");
      await base44.entities.Booking.update(booking.id, {
        quote_amount: amount,
        quote_currency: booking.budget_currency || "GHS",
        vendor_note: quoteNote.trim(),
        status: "quoted",
      });
      try { await base44.functions.invoke("notifyBookingStatusChange", { bookingId: booking.id, newStatus: "quoted" }); } catch { /* email is best-effort */ }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Quote sent. The customer has been notified.");
    },
    onError: (e) => toast.error(e?.message === "Enter your price." ? e.message : "Couldn't send the quote. Try again."),
  });

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const canManage = isVendor && booking.status === "pending" && !isQuote;
  const canQuote = isVendor && booking.status === "pending" && isQuote;
  const canRespondToQuote = !isVendor && booking.status === "quoted";
  const canComplete = isVendor && booking.status === "confirmed";

  return (
    <Card className="p-6 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            to={createPageUrl("UserProfile") + `?userId=${isVendor ? booking.user_id : booking.vendor_id}`}
            className="font-semibold text-lg text-slate-900 mb-1 hover:text-gold-text transition-colors underline decoration-transparent hover:decoration-gold block"
          >
            {isVendor ? booking.user_name : booking.vendor_name}
          </Link>
          {isVendor && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4" />
              <span>{booking.user_email}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
          {isQuote && <span className="text-[11px] uppercase tracking-[0.14em] text-gold-text">Quote request</span>}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="h-4 w-4 text-gold-text" />
          <span className="font-medium">Event Date:</span>
          <span>{format(new Date(booking.event_date), "MMMM d, yyyy")}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <Users className="h-4 w-4 text-gold-text" />
          <span className="font-medium">Guests:</span>
          <span>{booking.guest_count || "Not given"}</span>
        </div>

        {isQuote && (
          <>
            {booking.event_type && (
              <div className="flex items-center gap-2 text-slate-700">
                <FileText className="h-4 w-4 text-gold-text" />
                <span className="font-medium">Event:</span>
                <span>{EVENT_LABELS[booking.event_type] || booking.event_type}</span>
              </div>
            )}
            {booking.location && (
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-gold-text" />
                <span className="font-medium">Location:</span>
                <span>{booking.location}</span>
              </div>
            )}
            {(booking.budget_min || booking.budget_max) && (
              <div className="flex items-center gap-2 text-slate-700">
                <Wallet className="h-4 w-4 text-gold-text" />
                <span className="font-medium">Budget:</span>
                <span>
                  {booking.budget_min && booking.budget_max
                    ? `${cedis(booking.budget_min, booking.budget_currency)} – ${cedis(booking.budget_max, booking.budget_currency)}`
                    : booking.budget_max ? `Up to ${cedis(booking.budget_max, booking.budget_currency)}` : `From ${cedis(booking.budget_min, booking.budget_currency)}`}
                </span>
              </div>
            )}
            {isVendor && booking.contact_phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-4 w-4 text-gold-text" />
                <span className="font-medium">Phone:</span>
                <a href={`tel:${booking.contact_phone}`} className="underline underline-offset-2">{booking.contact_phone}</a>
              </div>
            )}
          </>
        )}
      </div>

      {booking.message && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-700 leading-relaxed">{booking.message}</p>
        </div>
      )}

      {booking.quote_amount > 0 && (
        <div className="border border-gold/30 bg-gold/5 p-4 mb-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold-text mb-1">{isVendor ? "Your quote" : `Quote from ${booking.vendor_name}`}</p>
          <p className="font-serif text-3xl text-ink lining-nums">{cedis(booking.quote_amount, booking.quote_currency)}</p>
          {booking.vendor_note && <p className="mt-2 text-sm text-slate-700 leading-relaxed">{booking.vendor_note}</p>}
        </div>
      )}

      {canQuote && (
        <form
          className="mt-4 space-y-3 border-t border-slate-200 pt-4"
          onSubmit={(e) => { e.preventDefault(); sendQuoteMutation.mutate(); }}
        >
          <p className="text-sm font-medium text-slate-900">Reply with your price</p>
          <div className="flex gap-2">
            <span className="h-10 px-3 inline-flex items-center border border-slate-300 bg-slate-50 text-sm text-slate-600">{booking.budget_currency || "GHS"}</span>
            <input
              id={`quote-amount-${booking.id}`}
              aria-label="Your price"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="e.g. 4500"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              className="flex-1 min-w-0 h-10 px-3 border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
            />
          </div>
          <textarea
            id={`quote-note-${booking.id}`}
            aria-label="Message to the customer"
            rows={2}
            placeholder="What's included, deposit terms, availability..."
            value={quoteNote}
            onChange={(e) => setQuoteNote(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={sendQuoteMutation.isPending} className="flex-1 bg-gold hover:bg-gold-text rounded-xl">
              <FileText className="h-4 w-4 mr-2" />
              {sendQuoteMutation.isPending ? "Sending..." : "Send quote"}
            </Button>
            <Button
              type="button"
              onClick={() => updateStatusMutation.mutate("declined")}
              disabled={updateStatusMutation.isPending}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Can't do it
            </Button>
          </div>
        </form>
      )}

      {canRespondToQuote && (
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => updateStatusMutation.mutate("confirmed")}
            disabled={updateStatusMutation.isPending}
            className="flex-1 bg-gold hover:bg-gold-text rounded-xl"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept quote
          </Button>
          <Button
            onClick={() => updateStatusMutation.mutate("declined")}
            disabled={updateStatusMutation.isPending}
            variant="outline"
            className="flex-1 rounded-xl"
          >
            <X className="h-4 w-4 mr-2" />
            Decline
          </Button>
        </div>
      )}

      {canManage && (
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => updateStatusMutation.mutate("confirmed")}
            disabled={updateStatusMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm
          </Button>
          <Button
            onClick={() => updateStatusMutation.mutate("declined")}
            disabled={updateStatusMutation.isPending}
            variant="outline"
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
          >
            <X className="h-4 w-4 mr-2" />
            Decline
          </Button>
        </div>
      )}

      {canComplete && (
        <div className="mt-4">
          <Button
            onClick={() => updateStatusMutation.mutate("completed")}
            disabled={updateStatusMutation.isPending}
            className="w-full bg-gold hover:bg-gold-text rounded-xl"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Completed
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Submitted {format(new Date(booking.created_date), "MMM d, yyyy")}
        </p>
        <Button
          onClick={handleStartChat}
          disabled={isStartingChat}
          variant="ghost"
          size="sm"
          className="text-gold-text hover:text-gold-text hover:bg-gold/10 rounded-lg"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      </div>
    </Card>
  );
}