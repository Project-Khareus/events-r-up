import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import NotificationItem from "../components/notifications/NotificationItem";
import { toast } from "sonner";

export default function Notifications() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setUser(currentUser);
    };
    checkAuth();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (notification) => {
        if (notification.is_read) return Promise.resolve();
        return base44.entities.Notification.update(notification.id, { is_read: true });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
        const unread = notifications.filter(n => !n.is_read);
        const promises = unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }));
        await Promise.all(promises);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
        toast.success("All marked as read");
    }
  });

  const handleRead = (notification) => {
      markReadMutation.mutate(notification);
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}><div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
                <p className="text-slate-600">Stay updated on vendor submissions, bookings, and messages</p>
            </div>
            {unreadCount > 0 && (
                <Button 
                    variant="outline" 
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="gap-2"
                >
                    <CheckCheck className="h-4 w-4" /> Mark all as read
                </Button>
            )}
        </div>
        
        {notifications.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-slate-200">
            <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No notifications yet</h2>
            <p className="text-slate-500">
                You'll see booking updates and messages here
            </p>
            </Card>
        ) : (
            <div className="space-y-4">
                {notifications.map(notification => (
                    <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onRead={handleRead}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}