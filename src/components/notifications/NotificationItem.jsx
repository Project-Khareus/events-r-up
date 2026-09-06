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

const HAIRLINE = "border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]";
const INK = "text-ink dark:text-[#F1E8E0]";
const MUTED = "text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]";

export default function NotificationItem({ notification, onRead, compact = false }) {
  const Icon = icons[notification.type] || Bell;
  const timeAgo = formatDistanceToNow(new Date(notification.created_date), { addSuffix: true });

  const iconBox = cn(
    "flex items-center justify-center shrink-0 rounded-none border",
    HAIRLINE,
    "bg-cream dark:bg-[#211B16] text-gold-text dark:text-gold-dark"
  );

  // Compact layout for dropdown
  if (compact) {
    const CompactContent = () => (
      <div className={cn(
        "flex items-start gap-3 px-3 py-3 rounded-none transition-colors cursor-pointer border-b",
        HAIRLINE,
        notification.is_read
          ? "hover:bg-[rgba(169,126,46,0.07)]"
          : "bg-[rgba(169,126,46,0.08)] hover:bg-[rgba(169,126,46,0.13)]"
      )}>
        <div className={cn(iconBox, "h-8 w-8 mt-0.5")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className={cn("font-serif text-[15px] truncate", INK)}>
              {notification.title}
            </h4>
            <span className={cn("text-[11px] shrink-0 whitespace-nowrap", MUTED)}>
              {timeAgo}
            </span>
          </div>
          <p className={cn("text-[12.5px] font-light mt-0.5 line-clamp-1", MUTED)}>
            {notification.message}
          </p>
        </div>
        {!notification.is_read && (
          <div className="h-1.5 w-1.5 rounded-full bg-[#A97E2E] shrink-0 mt-2" />
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
      "flex gap-4 p-4 rounded-none border transition-colors",
      HAIRLINE,
      notification.is_read
        ? "bg-linen dark:bg-[#2A231D] hover:bg-[rgba(169,126,46,0.07)]"
        : "bg-[rgba(169,126,46,0.08)] hover:bg-[rgba(169,126,46,0.13)]"
    )}>
      <div className={cn(iconBox, "h-10 w-10")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn("font-serif text-[17px] truncate", INK)}>
            {notification.title}
          </h4>
          <span className={cn("text-[11.5px] shrink-0 whitespace-nowrap mt-0.5", MUTED)}>
            {timeAgo}
          </span>
        </div>
        <p className={cn("text-[13.5px] font-light mt-1", MUTED)}>
          {notification.message}
        </p>
        {notification.action_by && (
          <p className={cn("text-[12px] font-light mt-1.5", MUTED)}>
            <span className="font-medium">Action by:</span> {notification.action_by}
          </p>
        )}
        {notification.changes_summary && notification.changes_summary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {notification.changes_summary.slice(0, 3).map((field, idx) => (
              <span key={idx} className={cn("text-[11px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-none border", HAIRLINE, MUTED)}>
                {field.replace(/_/g, ' ')}
              </span>
            ))}
            {notification.changes_summary.length > 3 && (
              <span className={cn("text-[11px] px-1", MUTED)}>+{notification.changes_summary.length - 3} more</span>
            )}
          </div>
        )}
        {notification.reason && (
          <p className={cn("text-[12px] px-2.5 py-1.5 mt-2 rounded-none border", HAIRLINE, "text-gold-text dark:text-gold-dark bg-cream dark:bg-[#211B16]")}>
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
          className="shrink-0 self-center text-gold-text dark:text-gold-dark p-1.5 rounded-none hover:bg-[rgba(169,126,46,0.13)] transition-colors"
          title="Mark as read"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const handleClick = () => {
    if (!notification.is_read && onRead) onRead(notification);
  };

  if (notification.link) {
    const linkPath = notification.link.startsWith('/') ? notification.link : createPageUrl(notification.link);
    return (
      <Link to={linkPath} onClick={handleClick}>
        <Content />
      </Link>
    );
  }

  return <div onClick={handleClick} className="cursor-pointer"><Content /></div>;
}