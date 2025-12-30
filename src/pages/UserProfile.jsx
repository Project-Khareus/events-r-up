import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MapPin, Link as LinkIcon, Calendar, FileText, Edit, Loader2 } from "lucide-react";
import FollowButton from "../components/profile/FollowButton";
import EventCard from "../components/events/EventCard";
import { format } from "date-fns";

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");
  
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch Profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user_profile', userId],
    queryFn: async () => {
        if (!userId) return null;
        const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
        return profiles[0] || null;
    },
    enabled: !!userId,
    retry: 2
  });

  // Fetch User's Events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['user_events', userId],
    queryFn: async () => {
        if (!userId) return [];
        const allEvents = await base44.entities.EventListing.list('-created_date', 50);
        return allEvents.filter(e => e.user_id === userId);
    },
    enabled: !!userId
  });

  // Fetch User's Blog Posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user_posts', userId],
    queryFn: async () => {
        if (!userId) return [];
        const allPosts = await base44.entities.BlogPost.list('-created_date', 50);
        return allPosts.filter(p => p.user_id === userId && p.status === 'published');
    },
    enabled: !!userId
  });

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Profile</h2>
          <p className="text-slate-500 mb-4">There was an error loading this profile. Please try again later.</p>
          <Link to={createPageUrl("Classifieds")}>
              <Button>Back to Events</Button>
          </Link>
      </div>
    );
  }

  if (!profile && !profileLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
            <p className="text-slate-500 mb-4">This user hasn't set up their public profile yet.</p>
            <Link to={createPageUrl("Classifieds")}>
                <Button>Back to Events</Button>
            </Link>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        {/* Header / Cover */}
        <div className="h-64 bg-slate-900 relative overflow-hidden">
            {profile.cover_image_url ? (
                <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-80" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-purple-900" />
            )}
        </div>

        <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
                <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                            {profile.display_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 text-white md:text-slate-900 md:pt-20">
                    <h1 className="text-3xl font-bold font-serif">{profile.display_name}</h1>
                    <p className="opacity-90 md:text-slate-600 font-medium">{profile.bio || "Event Enthusiast"}</p>
                </div>
                <div className="flex gap-3 md:pt-20">
                    <FollowButton targetUserId={userId} />
                    {/* If current user is owner, show Edit button - logic for checking owner would go here */}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold text-slate-900">About</h3>
                        {profile.location && (
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                                <MapPin className="h-4 w-4" /> {profile.location}
                            </div>
                        )}
                        {profile.website && (
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                                <LinkIcon className="h-4 w-4" /> 
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate">
                                    {profile.website}
                                </a>
                            </div>
                        )}
                        <div className="pt-4 border-t border-slate-100 flex gap-4">
                             {/* Socials placeholders */}
                        </div>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="events" className="w-full">
                        <TabsList className="w-full justify-start h-12 bg-white border-b border-slate-200 rounded-none p-0 mb-6">
                            <TabsTrigger 
                                value="events" 
                                className="h-full px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none bg-transparent"
                            >
                                Events ({events.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="posts" 
                                className="h-full px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none bg-transparent"
                            >
                                Blog Posts ({posts.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="events" className="space-y-6">
                            {events.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {events.map(event => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No upcoming events</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="posts" className="space-y-6">
                            {posts.length > 0 ? (
                                <div className="space-y-4">
                                    {posts.map(post => (
                                        <Card key={post.id} className="p-4 flex gap-4 hover:shadow-md transition-shadow">
                                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 mb-1">
                                                    <Link to={createPageUrl(`BlogPostDetail`) + `?id=${post.id}`} className="hover:text-indigo-600">
                                                        {post.title}
                                                    </Link>
                                                </h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{post.excerpt}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span>{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                                                    <span>•</span>
                                                    <span>{post.category}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No blog posts yet</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    </div>
  );
}