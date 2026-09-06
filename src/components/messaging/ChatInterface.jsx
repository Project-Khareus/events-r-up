import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

  const panelClass = "h-[600px] border border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[rgba(241,232,224,0.04)] flex flex-col";

  if (isLoading) {
    return (
      <div className={`${panelClass} p-6`}>
        <Skeleton className="h-12 w-48 mb-6 rounded-none" />
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4 rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  const isVendorSide = conversation?.vendor_id === currentUser?.id;
  const displayName = isVendorSide ? conversation?.user_name : conversation?.vendor_name;

  return (
    <div className={`${panelClass} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.16)] bg-[#F3E9DD] dark:bg-[rgba(169,126,46,0.12)]">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-none min-h-[44px] min-w-[44px] text-ink dark:text-[#F1E8E0]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="h-10 w-10 rounded-full border border-[rgba(169,126,46,0.35)] flex items-center justify-center shrink-0">
            <span className="font-serif text-base text-[#8A6522] dark:text-[#C9A055]">
              {displayName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-serif text-xl leading-tight text-ink dark:text-[#F1E8E0]">{displayName}</h3>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[rgba(59,50,43,0.55)] dark:text-[rgba(241,232,224,0.55)]">
              {isVendorSide ? "Customer" : "Event Vendor"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-cream dark:bg-transparent">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[rgba(59,50,43,0.6)] dark:text-[rgba(241,232,224,0.55)]">
              No messages yet. Start the conversation!
            </p>
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
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-transparent"
      >
        <div className="flex gap-3">
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1 h-12 px-4 rounded-none bg-transparent border border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] text-[15px] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.4)] focus:outline-none focus:border-[#A97E2E]"
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="rounded-none h-12 px-6 bg-[#8A6522] hover:bg-[#A97E2E] text-[#F8F1EB]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}