import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mail, MessageSquare, Check, X, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-300" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-800 border-slate-300" }
};

export default function BookingCard({ booking, isVendor, currentUserId }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.Booking.update(booking.id, { status: newStatus });
      
      // Send email notification
      try {
        const statusMessages = {
          confirmed: "Your booking request has been confirmed!",
          declined: "Unfortunately, your booking request has been declined.",
          completed: "Your booking has been marked as completed."
        };
        
        await base44.integrations.Core.SendEmail({
          to: booking.user_email,
          subject: `Booking Update: ${statusMessages[newStatus]}`,
          body: `
            <h2>Booking Status Update</h2>
            <p>Dear ${booking.user_name},</p>
            <p>${statusMessages[newStatus]}</p>
            
            <h3>Booking Details:</h3>
            <ul>
              <li><strong>Vendor:</strong> ${booking.vendor_name}</li>
              <li><strong>Event Date:</strong> ${format(new Date(booking.event_date), "MMMM d, yyyy")}</li>
              <li><strong>Guest Count:</strong> ${booking.guest_count}</li>
            </ul>
            
            <p><a href="${window.location.origin}${createPageUrl('Bookings')}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Booking</a></p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
      
      return newStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success("Booking status updated and customer notified");
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

  const statusConfig = STATUS_CONFIG[booking.status];
  const canManage = isVendor && booking.status === "pending";
  const canComplete = isVendor && booking.status === "confirmed";

  return (
    <Card className="p-6 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <button
            onClick={handleStartChat}
            disabled={isStartingChat}
            className="font-semibold text-lg text-slate-900 mb-1 hover:text-indigo-600 transition-colors underline decoration-transparent hover:decoration-indigo-600 text-left"
          >
            {isVendor ? booking.user_name : booking.vendor_name}
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="h-4 w-4" />
            <span>{booking.user_email}</span>
          </div>
        </div>
        <Badge variant="outline" className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span className="font-medium">Event Date:</span>
          <span>{format(new Date(booking.event_date), "MMMM d, yyyy")}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <Users className="h-4 w-4 text-indigo-600" />
          <span className="font-medium">Guests:</span>
          <span>{booking.guest_count}</span>
        </div>
      </div>

      {booking.message && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-700 leading-relaxed">{booking.message}</p>
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl"
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
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      </div>
    </Card>
  );
}