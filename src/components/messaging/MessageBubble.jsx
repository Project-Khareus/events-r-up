import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MessageBubble({ message, isOwnMessage }) {
  return (
    <div className={cn("flex gap-3 mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0 mt-1">
          <span className="text-sm font-medium text-indigo-600">
            {message.sender_name?.[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <div className={cn("max-w-[70%]", isOwnMessage && "flex flex-col items-end")}>
        {!isOwnMessage && (
          <p className="text-xs font-medium text-slate-600 mb-1">{message.sender_name}</p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 break-words",
            isOwnMessage
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
              : "bg-slate-100 text-slate-900"
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {format(new Date(message.created_date), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}