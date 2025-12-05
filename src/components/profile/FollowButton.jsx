import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FollowButton({ targetUserId, className = "" }) {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  // Check if following
  const { data: followStatus, isLoading } = useQuery({
    queryKey: ['follow_status', targetUserId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || !targetUserId) return null;
      const follows = await base44.entities.Follow.list(); // Using list then filter locally for now as per sdk limitations if any, or use filter if robust
      // Better to use filter if possible:
      // const follows = await base44.entities.Follow.filter({ follower_id: currentUser.id, followed_user_id: targetUserId });
      // Fallback to list for safety if filter isn't fully confirmed for composite
      return follows.find(f => f.follower_id === currentUser.id && f.followed_user_id === targetUserId);
    },
    enabled: !!currentUser && !!targetUserId && currentUser.id !== targetUserId
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Follow.create({
        follower_id: currentUser.id,
        followed_user_id: targetUserId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follow_status', targetUserId]);
      toast.success("Followed!");
    },
    onError: () => toast.error("Failed to follow")
  });

  const unfollowMutation = useMutation({
    mutationFn: async (followId) => {
      return base44.entities.Follow.delete(followId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follow_status', targetUserId]);
      toast.success("Unfollowed");
    },
    onError: () => toast.error("Failed to unfollow")
  });

  const handleToggleFollow = () => {
    if (!currentUser) {
      toast.error("Please login to follow");
      return;
    }
    if (followStatus) {
      unfollowMutation.mutate(followStatus.id);
    } else {
      followMutation.mutate();
    }
  };

  if (!currentUser || currentUser.id === targetUserId) return null;

  const isPending = followMutation.isPending || unfollowMutation.isPending || isLoading;

  return (
    <Button 
      variant={followStatus ? "outline" : "default"} 
      onClick={handleToggleFollow}
      disabled={isPending}
      className={`${className} ${followStatus ? 'bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : followStatus ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}