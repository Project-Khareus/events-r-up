import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import MessageBubble from "./MessageBubble";

export default function ChatInterface({ conversationId, onBack }) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const convs = await base44.entities.Conversation.list();
      return convs.find(c => c.id === conversationId);
    },
    enabled: !!conversationId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date', 100),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await base44.entities.Message.create(messageData);
      await base44.entities.Conversation.update(conversationId, {
        last_message: messageData.content,
        last_message_date: new Date().toISOString(),
      });
      return msg;
    },
    onMutate: async (messageData) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);
      const optimisticMessage = {
        ...messageData,
        id: `optimistic_${Date.now()}`,
        created_date: new Date().toISOString(),
        _optimistic: true,
      };
      queryClient.setQueryData(['messages', conversationId], (old = []) => [...old, optimisticMessage]);
      setMessageText("");
      return { previousMessages };
    },
    onSuccess: async (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      try {
        await base44.functions.invoke('notifyNewMessage', { messageId: message.id });
      } catch (error) {
        console.error("Failed to send message notification:", error);
      }
    },
    onError: (err, messageData, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      setMessageText(messageData.content);
      toast.error("Failed to send message");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser) return;

    const isVendor = conversation?.vendor_id === currentUser.id;
    
    sendMessageMutation.mutate({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.email,
      sender_type: isVendor ? "vendor" : "user",
      content: messageText.trim(),
      is_read: false,
    });
    // Note: setMessageText("") is handled in onMutate for immediate feedback
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] rounded-2xl border-slate-200 shadow-sm flex flex-col p-6">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] rounded-2xl border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-indigo-600">
              {(() => {
                const isVendor = conversation?.vendor_id === currentUser?.id;
                const displayName = isVendor ? conversation?.user_name : conversation?.vendor_name;
                return displayName?.[0]?.toUpperCase();
              })()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {(() => {
                const isVendor = conversation?.vendor_id === currentUser?.id;
                return isVendor ? conversation?.user_name : conversation?.vendor_name;
              })()}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {conversation?.vendor_id === currentUser?.id ? "Customer" : "Event Vendor"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === currentUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-3">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-xl"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}