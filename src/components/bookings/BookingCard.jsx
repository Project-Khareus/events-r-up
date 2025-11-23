import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mail } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-300" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-800 border-slate-300" }
};

export default function BookingCard({ booking, isVendor, currentUserId }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.Booking.update(booking.id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success("Booking status updated");
    },
    onError: () => {
      toast.error("Failed to update booking status");
    }
  });

  const statusConfig = STATUS_CONFIG[booking.status];
  const canManage = isVendor && booking.vendor_id === currentUserId && booking.status === "pending";

  return (
    <Card className="p-6 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 mb-1">
            {isVendor ? booking.user_name : booking.vendor_name}
          </h3>
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
            Confirm
          </Button>
          <Button
            onClick={() => updateStatusMutation.mutate("declined")}
            disabled={updateStatusMutation.isPending}
            variant="outline"
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
          >
            Decline
          </Button>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">
        Submitted {format(new Date(booking.created_date), "MMM d, yyyy")}
      </p>
    </Card>
  );
}