import React from "react";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationsList({ conversations, selectedId, onSelect, currentUserId }) {
  if (conversations.length === 0) {
    return (
      <div className="p-8 border border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[rgba(241,232,224,0.04)] text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[rgba(169,126,46,0.4)] mb-4">
          <MessageSquare className="h-6 w-6 text-[#A97E2E]" />
        </div>
        <h3 className="font-serif text-xl text-ink dark:text-[#F1E8E0] mb-2">No conversations yet</h3>
        <p className="text-sm text-[rgba(59,50,43,0.65)] dark:text-[rgba(241,232,224,0.6)]">
          Start chatting with vendors to see your messages here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(59,50,43,0.14)] dark:divide-[rgba(241,232,224,0.12)] border border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.16)]">
      {conversations.map((conversation) => {
        const isVendor = conversation.vendor_id === currentUserId;
        const displayName = isVendor ? conversation.user_name : conversation.vendor_name;
        const isSelected = conversation.id === selectedId;

        return (
          <button
            type="button"
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "w-full text-left p-4 min-h-[44px] transition-colors",
              isSelected
                ? "bg-[#F3E9DD] dark:bg-[rgba(169,126,46,0.16)]"
                : "bg-linen hover:bg-[#F3E9DD] dark:bg-transparent dark:hover:bg-[rgba(241,232,224,0.05)]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full border border-[rgba(169,126,46,0.35)] flex items-center justify-center shrink-0">
                <span className="font-serif text-lg text-[#8A6522] dark:text-[#C9A055]">
                  {displayName?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-serif text-lg leading-tight text-ink dark:text-[#F1E8E0] truncate">
                    {displayName}
                  </h4>
                  {conversation.unread_count > 0 && (
                    <span className="shrink-0 px-2 py-0.5 text-[11px] tracking-[0.1em] bg-ink text-[#F8F1EB] dark:bg-[#A97E2E]">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)] truncate mb-1">
                  {conversation.last_message || "No messages yet"}
                </p>
                {conversation.last_message_date && (
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(59,50,43,0.5)] dark:text-[rgba(241,232,224,0.45)]">
                    {format(new Date(conversation.last_message_date), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}