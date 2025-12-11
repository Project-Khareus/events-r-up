import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Calendar, Store, Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const icons = {
  message: MessageCircle,
  event_update: Calendar,
  vendor_response: Store,
  system: Bell
};

const colors = {
  message: "bg-blue-100 text-blue-600",
  event_update: "bg-orange-100 text-orange-600",
  vendor_response: "bg-indigo-100 text-indigo-600",
  system: "bg-slate-100 text-slate-600"
};

export default function NotificationItem({ notification, onRead, compact = false }) {
  const Icon = icons[notification.type] || Bell;
  const colorClass = colors[notification.type] || colors.system;

  const Content = () => (
    <div className={cn(
      "flex gap-4 p-4 rounded-xl transition-all border",
      notification.is_read ? "bg-white border-transparent" : "bg-blue-50/50 border-blue-100",
      !compact && "hover:shadow-md"
    )}>
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn("font-semibold text-slate-900 truncate", compact ? "text-sm" : "text-base")}>
            {notification.title}
          </h4>
          <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
          </span>
        </div>
        <p className={cn("text-slate-600 line-clamp-2 mt-1", compact ? "text-xs" : "text-sm")}>
          {notification.message}
        </p>
      </div>
      {!notification.is_read && !compact && onRead && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRead(notification);
          }}
          className="shrink-0 self-center text-blue-600 hover:text-blue-700 p-2"
          title="Mark as read"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link} onClick={() => onRead && onRead(notification)}>
        <Content />
      </Link>
    );
  }

  return <Content />;
}