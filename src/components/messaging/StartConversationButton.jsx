import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function StartConversationButton({ vendorId, vendorName }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleStartChat = async () => {
    try {
      setIsLoading(true);
      const user = await base44.auth.me();

      // Check if conversation already exists
      const allConvs = await base44.entities.Conversation.list();
      const existingConv = allConvs.find(
        c => c.vendor_id === vendorId && c.user_id === user.id
      );

      if (existingConv) {
        navigate(createPageUrl("Messages"));
        return;
      }

      // Create new conversation
      await base44.entities.Conversation.create({
        vendor_id: vendorId,
        vendor_name: vendorName,
        user_id: user.id,
        user_name: user.full_name || user.email,
        last_message: "",
        last_message_date: new Date().toISOString(),
        unread_count: 0,
        status: "active"
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success("Conversation started!");
      navigate(createPageUrl("Messages"));
    } catch (error) {
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl h-12 text-base font-medium shadow-lg shadow-indigo-200"
    >
      <MessageSquare className="h-5 w-5 mr-2" />
      {isLoading ? "Loading..." : "Send Message"}
    </Button>
  );
}