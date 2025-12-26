import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import ConversationsList from "../components/messaging/ConversationsList";
import ChatInterface from "../components/messaging/ChatInterface";

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreatingAdminConvo, setIsCreatingAdminConvo] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Check if user wants to message admin
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const messageAdmin = urlParams.get("admin");
    
    if (messageAdmin === "true" && currentUser && !isCreatingAdminConvo) {
      setIsCreatingAdminConvo(true);
      createAdminConversation();
    }
  }, [currentUser]);

  const createAdminConversation = async () => {
    try {
      // Get an admin user
      const admins = await base44.entities.User.filter({ role: 'admin' });
      if (admins.length === 0) {
        toast.error("No admin available");
        return;
      }
      const admin = admins[0];

      // Check if conversation already exists
      const existingConvos = await base44.entities.Conversation.list();
      const existingConvo = existingConvos.find(
        c => (c.user_id === currentUser.id && c.vendor_id === admin.id) ||
             (c.vendor_id === currentUser.id && c.user_id === admin.id)
      );

      if (existingConvo) {
        setSelectedConversationId(existingConvo.id);
      } else {
        // Create new conversation with admin
        const newConvo = await base44.entities.Conversation.create({
          user_id: currentUser.id,
          vendor_id: admin.id,
          user_name: currentUser.full_name,
          vendor_name: admin.full_name || "Admin",
          last_message: "Conversation started",
          last_message_date: new Date().toISOString(),
          unread_count: 0
        });
        setSelectedConversationId(newConvo.id);
      }
    } catch (error) {
      console.error("Failed to create admin conversation:", error);
      toast.error("Failed to start conversation with admin");
    } finally {
      setIsCreatingAdminConvo(false);
    }
  };

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      return await base44.entities.Conversation.list('-last_message_date', 100);
    },
    refetchInterval: 10000,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
            <p className="text-slate-600">Connect with vendors</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading conversations...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <ConversationsList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                currentUserId={currentUser?.id}
              />
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              {selectedConversationId ? (
                <ChatInterface
                  conversationId={selectedConversationId}
                  onBack={() => setSelectedConversationId(null)}
                />
              ) : (
                <div className="h-[600px] rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}