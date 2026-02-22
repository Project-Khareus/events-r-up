import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Calendar, Store, Bell, CheckCircle2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const icons = {
  message: MessageCircle,
  event_update: Calendar,
  vendor_response: Store,
  system: Bell,
  vendor_approved: CheckCircle,
  vendor_rejected: XCircle,
  changes_approved: CheckCircle,
  changes_rejected: AlertCircle
};

const colors = {
  message: "bg-blue-100 text-blue-600",
  event_update: "bg-orange-100 text-orange-600",
  vendor_response: "bg-indigo-100 text-indigo-600",
  system: "bg-slate-100 text-slate-600",
  vendor_approved: "bg-green-100 text-green-600",
  vendor_rejected: "bg-red-100 text-red-600",
  changes_approved: "bg-green-100 text-green-600",
  changes_rejected: "bg-orange-100 text-orange-600"
};

export default function NotificationItem({ notification, onRead, compact = false }) {
  const Icon = icons[notification.type] || Bell;
  const colorClass = colors[notification.type] || colors.system;

  const Content = () => (
    <div className={cn(
      "flex gap-4 p-4 rounded-xl transition-all border",
      notification.is_read
        ? "bg-white dark:bg-slate-800 border-transparent dark:border-slate-700"
        : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40",
      !compact && "hover:shadow-md"
    )}>
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn("font-semibold text-slate-900 dark:text-slate-100 truncate", compact ? "text-sm" : "text-base")}>
            {notification.title}
          </h4>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
          </span>
        </div>
        <p className={cn("text-slate-600 mt-1", compact ? "text-xs line-clamp-2" : "text-sm")}>
          {notification.message}
        </p>
        {!compact && (
          <>
            {notification.action_by && (
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-medium">Action by:</span> {notification.action_by}
              </p>
            )}
            {notification.changes_summary && notification.changes_summary.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {notification.changes_summary.slice(0, 3).map((field, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {field.replace(/_/g, ' ')}
                  </span>
                ))}
                {notification.changes_summary.length > 3 && (
                  <span className="text-xs text-slate-500 px-1">+{notification.changes_summary.length - 3} more</span>
                )}
              </div>
            )}
            {notification.reason && (
              <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded mt-2">
                <span className="font-medium">Reason:</span> {notification.reason}
              </p>
            )}
          </>
        )}
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
    const linkPath = notification.link.startsWith('/') ? notification.link : createPageUrl(notification.link);
    return (
      <Link to={linkPath} onClick={() => onRead && onRead(notification)}>
        <Content />
      </Link>
    );
  }

  return <Content />;
}