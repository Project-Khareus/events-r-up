import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MessageBubble({ message, isOwnMessage }) {
  return (
    <div className={cn("flex gap-3 mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && (
        <div className="h-8 w-8 rounded-full border border-[rgba(169,126,46,0.35)] bg-[#F3E9DD] dark:bg-[rgba(169,126,46,0.18)] flex items-center justify-center shrink-0 mt-1">
          <span className="font-serif text-sm text-[#8A6522] dark:text-[#C9A055]">
            {message.sender_name?.[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <div className={cn("max-w-[70%]", isOwnMessage && "flex flex-col items-end")}>
        {!isOwnMessage && (
          <p className="text-[11px] uppercase tracking-[0.14em] text-[rgba(59,50,43,0.55)] dark:text-[rgba(241,232,224,0.55)] mb-1">
            {message.sender_name}
          </p>
        )}
        <div
          className={cn(
            "rounded-none px-4 py-2.5 break-words border",
            isOwnMessage
              ? "bg-ink border-ink text-[#F8F1EB] dark:bg-[#A97E2E] dark:border-[#A97E2E] dark:text-[#F8F1EB]"
              : "bg-linen border-[rgba(59,50,43,0.18)] text-ink dark:bg-[rgba(241,232,224,0.06)] dark:border-[rgba(241,232,224,0.16)] dark:text-[#F1E8E0]"
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <p className="text-[11px] text-[rgba(59,50,43,0.5)] dark:text-[rgba(241,232,224,0.45)] mt-1">
          {format(new Date(message.created_date), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}