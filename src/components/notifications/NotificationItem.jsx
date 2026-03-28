import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Calendar, Store, Bell, CheckCircle2, CheckCircle, XCircle, AlertCircle, Shield, Monitor } from "lucide-react";
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
  message: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  event_update: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  vendor_response: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  system: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  vendor_approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  vendor_rejected: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  changes_approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  changes_rejected: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
};

export default function NotificationItem({ notification, onRead, compact = false }) {
  const Icon = icons[notification.type] || Bell;
  const colorClass = colors[notification.type] || colors.system;

  const timeAgo = formatDistanceToNow(new Date(notification.created_date), { addSuffix: true });

  // Compact layout for dropdown
  if (compact) {
    const CompactContent = () => (
      <div className={cn(
        "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
        notification.is_read
          ? "hover:bg-slate-50 dark:hover:bg-slate-800"
          : "bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
      )}>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {notification.title}
            </h4>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
              {timeAgo}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {notification.message}
          </p>
        </div>
        {!notification.is_read && (
          <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
        )}
      </div>
    );

    if (notification.link) {
      const linkPath = notification.link.startsWith('/') ? notification.link : createPageUrl(notification.link);
      return (
        <Link to={linkPath} onClick={() => onRead && onRead(notification)}>
          <CompactContent />
        </Link>
      );
    }
    return <CompactContent />;
  }

  // Full layout for Notifications page
  const Content = () => (
    <div className={cn(
      "flex gap-4 p-4 rounded-xl transition-all",
      notification.is_read
        ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
        : "bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-100 dark:ring-indigo-900/30",
      "hover:shadow-sm"
    )}>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base truncate">
            {notification.title}
          </h4>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap mt-0.5">
            {timeAgo}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {notification.message}
        </p>
        {notification.action_by && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="font-medium">Action by:</span> {notification.action_by}
          </p>
        )}
        {notification.changes_summary && notification.changes_summary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {notification.changes_summary.slice(0, 3).map((field, idx) => (
              <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                {field.replace(/_/g, ' ')}
              </span>
            ))}
            {notification.changes_summary.length > 3 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 px-1">+{notification.changes_summary.length - 3} more</span>
            )}
          </div>
        )}
        {notification.reason && (
          <p className="text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1.5 rounded-md mt-2">
            <span className="font-medium">Reason:</span> {notification.reason}
          </p>
        )}
      </div>
      {!notification.is_read && onRead && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRead(notification);
          }}
          className="shrink-0 self-center text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
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