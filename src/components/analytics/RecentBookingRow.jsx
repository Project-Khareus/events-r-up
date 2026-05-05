import React from "react";
import { format } from "date-fns";
import { Users } from "lucide-react";

const STATUS_STYLES = {
  confirmed: { bg: "bg-green-50 border-green-200", text: "text-green-700", dot: "bg-green-500" },
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  declined: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

export default function RecentBookingRow({ booking }) {
  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;

  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 text-base truncate">{booking.user_name || "Guest"}</p>
        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
          <span>{format(new Date(booking.event_date), "MMM dd, yyyy")}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {booking.guest_count} guests
          </span>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
      </span>
    </div>
  );
}