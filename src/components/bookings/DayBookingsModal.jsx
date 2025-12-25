import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Users, Mail, Check, X, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-300" },
  completed: { label: "Completed", className: "bg-indigo-100 text-indigo-800 border-indigo-300" }
};

export default function DayBookingsModal({ date, bookings, isVendor, open, onClose }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, newStatus, booking }) => {
      await base44.entities.Booking.update(bookingId, { status: newStatus });
      
      try {
        const statusMessages = {
          confirmed: "Your booking request has been confirmed!",
          declined: "Unfortunately, your booking request has been declined."
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
          `
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success("Booking updated");
    },
    onError: () => {
      toast.error("Failed to update booking");
    }
  });

  const handleStartChat = async (booking) => {
    try {
      const user = await base44.auth.me();
      
      const allConvs = await base44.entities.Conversation.list();
      const existingConv = allConvs.find(
        c => c.vendor_id === booking.vendor_id && c.user_id === booking.user_id
      );

      if (existingConv) {
        navigate(createPageUrl("Messages"));
        return;
      }

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
      navigate(createPageUrl("Messages"));
    } catch (error) {
      toast.error("Failed to start chat");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Bookings for {format(date, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {bookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status];
            const canManage = isVendor && booking.status === "pending";

            return (
              <Card key={booking.id} className="p-4 border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link
                      to={createPageUrl("UserProfile") + `?userId=${isVendor ? booking.user_id : booking.vendor_id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors underline decoration-transparent hover:decoration-indigo-600 block"
                    >
                      {isVendor ? booking.user_name : booking.vendor_name}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Mail className="h-3 w-3" />
                      <span>{booking.user_email}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-700 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>{booking.guest_count} guests</span>
                  </div>
                </div>

                {booking.message && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-3">
                    {booking.message}
                  </p>
                )}

                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateStatusMutation.mutate({ 
                        bookingId: booking.id, 
                        newStatus: "confirmed",
                        booking 
                      })}
                      disabled={updateStatusMutation.isPending}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ 
                        bookingId: booking.id, 
                        newStatus: "declined",
                        booking 
                      })}
                      disabled={updateStatusMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}