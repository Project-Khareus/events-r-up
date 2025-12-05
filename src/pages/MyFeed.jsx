import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Loader2, User, Calendar, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EventCard from "../components/events/EventCard";
import { format } from "date-fns";

export default function MyFeed() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
        if (!u) base44.auth.redirectToLogin();
        setUser(u);
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  // Fetch followed users
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ['my_following', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allFollows = await base44.entities.Follow.list();
      return allFollows.filter(f => f.follower_id === user.id);
    },
    enabled: !!user
  });

  // Fetch content from followed users
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['feed_content', following],
    queryFn: async () => {
        if (following.length === 0) return { events: [], posts: [] };
        
        const followedIds = following.map(f => f.followed_user_id);
        
        // Fetch all recent content (optimization would be needed for scale)
        const [allEvents, allPosts, allProfiles] = await Promise.all([
            base44.entities.EventListing.list('-created_date', 100),
            base44.entities.BlogPost.list('-created_date', 100),
            base44.entities.UserProfile.list()
        ]);

        const normalizedEvents = allEvents.map(e => e.data ? { id: e.id, ...e.data } : e);

        const filteredEvents = normalizedEvents
            .filter(e => followedIds.includes(e.user_id))
            .map(e => {
                const author = allProfiles.find(p => p.user_id === e.user_id);
                return { ...e, type: 'event', author };
            });

        const normalizedPosts = allPosts.map(p => p.data ? { id: p.id, ...p.data } : p);

        const filteredPosts = normalizedPosts
            .filter(p => followedIds.includes(p.user_id) && p.status === 'published')
            .map(p => {
                const author = allProfiles.find(u => u.user_id === p.user_id);
                return { ...p, type: 'post', author };
            });

        // Combine and sort by date
        const mixed = [...filteredEvents, ...filteredPosts].sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        );
        
        return {
            items: mixed,
            profiles: allProfiles.filter(p => followedIds.includes(p.user_id))
        };
    },
    enabled: following.length > 0
  });

  if (!user || followingLoading || feedLoading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">My Feed</h1>
                    <p className="text-slate-600">Latest updates from people you follow</p>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                    {feedData?.profiles?.slice(0, 5).map(p => (
                        <Avatar key={p.id} className="border-2 border-white w-10 h-10">
                            <AvatarImage src={p.avatar_url} />
                            <AvatarFallback>{p.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                    {feedData?.profiles?.length > 5 && (
                        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-500">
                            +{feedData.profiles.length - 5}
                        </div>
                    )}
                </div>
            </div>

            {following.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Your feed is empty</h2>
                    <p className="text-slate-500 mb-6">Follow authors and event creators to see their latest updates here.</p>
                    <Link to={createPageUrl("Classifieds")}>
                        <Button>Explore Events</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {feedData?.items?.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex gap-4">
                             <div className="flex flex-col items-center gap-2 pt-2 min-w-[3rem]">
                                 <Link to={createPageUrl(`UserProfile`) + `?userId=${item.user_id}`}>
                                    <Avatar className="w-10 h-10 border border-slate-200 hover:border-indigo-300 transition-colors">
                                        <AvatarImage src={item.author?.avatar_url} />
                                        <AvatarFallback>{item.author?.display_name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                 </Link>
                             </div>
                             <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-3 text-sm">
                                     <Link to={createPageUrl(`UserProfile`) + `?userId=${item.user_id}`} className="font-bold text-slate-900 hover:text-indigo-600">
                                         {item.author?.display_name || "Unknown User"}
                                     </Link>
                                     <span className="text-slate-400">posted a new {item.type}</span>
                                     <span className="text-slate-400">•</span>
                                     <span className="text-slate-400">{format(new Date(item.created_date), 'MMM d')}</span>
                                 </div>
                                 
                                 {item.type === 'event' ? (
                                     <div className="max-w-md">
                                         <EventCard event={item} />
                                     </div>
                                 ) : (
                                     <Card className="p-0 overflow-hidden hover:shadow-md transition-shadow max-w-2xl group">
                                         <Link to={createPageUrl("BlogPostDetail") + `?id=${item.id}`} className="flex">
                                             <div className="w-32 bg-slate-100 shrink-0">
                                                 <img src={item.cover_image_url} alt="" className="w-full h-full object-cover" />
                                             </div>
                                             <div className="p-4">
                                                 <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                                 <p className="text-sm text-slate-600 line-clamp-2">{item.excerpt}</p>
                                             </div>
                                         </Link>
                                     </Card>
                                 )}
                             </div>
                        </div>
                    ))}
                    
                    {feedData?.items?.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No recent activity from people you follow.
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}