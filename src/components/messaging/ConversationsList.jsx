import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationsList({ conversations, selectedId, onSelect, currentUserId }) {
  if (conversations.length === 0) {
    return (
      <Card className="p-8 rounded-2xl border-slate-200 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <MessageSquare className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No conversations yet</h3>
        <p className="text-slate-600">Start chatting with vendors to see your messages here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const isVendor = conversation.vendor_id === currentUserId;
        const displayName = isVendor ? conversation.user_name : conversation.vendor_name;
        const isSelected = conversation.id === selectedId;
        
        return (
          <Card
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all hover:shadow-md",
              isSelected
                ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-950"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0">
                <span className="text-lg font-medium text-indigo-600">
                  {displayName?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName}</h4>
                  {conversation.unread_count > 0 && (
                    <Badge className="bg-indigo-600 text-white shrink-0">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate mb-1">
                  {conversation.last_message || "No messages yet"}
                </p>
                {conversation.last_message_date && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(conversation.last_message_date), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}