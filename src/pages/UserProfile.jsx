import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Link as LinkIcon, Calendar, FileText, Edit, Loader2, Twitter, Instagram, Linkedin, Globe, Users, Heart } from "lucide-react";
import FollowButton from "../components/profile/FollowButton";
import EventCard from "../components/events/EventCard";
import { format } from "date-fns";

export default function UserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");
  
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch or Create Profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user_profile', userId],
    queryFn: async () => {
        if (!userId) return null;
        
        // Check if profile exists
        const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
        if (profiles && profiles.length > 0) {
            return profiles[0];
        }
        
        // If no profile exists, get user info and create a basic profile
        try {
            const users = await base44.entities.User.filter({ id: userId });
            if (users && users.length > 0) {
                const user = users[0];
                const newProfile = await base44.entities.UserProfile.create({
                    user_id: userId,
                    display_name: user.full_name || "User",
                    bio: "",
                    avatar_url: user.profile_picture_url || ""
                });
                return newProfile;
            }
        } catch (err) {
            console.error("Error creating profile:", err);
        }
        
        return null;
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

  // Fetch follower/following counts
  const { data: followers = [] } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
        if (!userId) return [];
        return await base44.entities.Follow.filter({ followed_user_id: userId });
    },
    enabled: !!userId
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
        if (!userId) return [];
        return await base44.entities.Follow.filter({ follower_id: userId });
    },
    enabled: !!userId
  });

  const isOwnProfile = currentUser?.id === userId;

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
    <div className="min-h-screen bg-slate-50">
        {/* Cover Photo */}
        <div className="h-80 md:h-96 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
            {profile.cover_image_url && (
                <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            )}
        </div>

        {/* Profile Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-20 md:-mt-24 pb-4">
                    {/* Avatar */}
                    <Avatar className="w-32 h-32 md:w-44 md:h-44 border-4 md:border-8 border-white shadow-xl ring-2 ring-slate-100">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-3xl md:text-5xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold">
                            {profile.display_name?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    {/* Name & Bio */}
                    <div className="flex-1 md:pb-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{profile.display_name}</h1>
                        <p className="text-slate-600 mb-3 max-w-xl">{profile.bio || "Event Enthusiast"}</p>
                        
                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <Users className="h-4 w-4" />
                                <span className="font-semibold text-slate-900">{followers.length}</span> followers
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <Heart className="h-4 w-4" />
                                <span className="font-semibold text-slate-900">{following.length}</span> following
                            </div>
                            {profile.location && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <MapPin className="h-4 w-4" />
                                    {profile.location}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 md:pb-4">
                        {isOwnProfile ? (
                            <Link to={createPageUrl("Settings")}>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </Link>
                        ) : (
                            <FollowButton targetUserId={userId} />
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-1 -mb-px">
                    <button className="px-6 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50">
                        Posts
                    </button>
                    <button className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 border-b-2 border-transparent">
                        About
                    </button>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            <div className="grid md:grid-cols-5 gap-6">
                {/* Left Sidebar - About */}
                <div className="md:col-span-2 space-y-4">
                    {/* Intro Card */}
                    <Card className="p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-lg mb-4">Intro</h3>
                        <div className="space-y-3">
                            {profile.bio && (
                                <p className="text-slate-700 text-center py-2">{profile.bio}</p>
                            )}
                            {profile.location && (
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin className="h-5 w-5 text-slate-400" />
                                    <span>Lives in <span className="font-semibold text-slate-900">{profile.location}</span></span>
                                </div>
                            )}
                            {profile.website && (
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Globe className="h-5 w-5 text-slate-400" />
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline truncate">
                                        {profile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-slate-600">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <span>Joined {format(new Date(profile.created_date), 'MMMM yyyy')}</span>
                            </div>
                        </div>

                        {/* Social Links */}
                        {(profile.social_links?.twitter || profile.social_links?.instagram || profile.social_links?.linkedin) && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex flex-wrap gap-2">
                                    {profile.social_links?.twitter && (
                                        <a href={`https://twitter.com/${profile.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                            <Twitter className="h-5 w-5 text-slate-600" />
                                        </a>
                                    )}
                                    {profile.social_links?.instagram && (
                                        <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                            <Instagram className="h-5 w-5 text-slate-600" />
                                        </a>
                                    )}
                                    {profile.social_links?.linkedin && (
                                        <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                            <Linkedin className="h-5 w-5 text-slate-600" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Content - Posts/Events */}
                <div className="md:col-span-3 space-y-4">
                    {/* Events */}
                    {events.length > 0 && (
                        <Card className="p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 text-lg">Events</h3>
                                <Badge variant="secondary">{events.length}</Badge>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {events.slice(0, 4).map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                            {events.length > 4 && (
                                <div className="mt-4 text-center">
                                    <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700">
                                        See all events
                                    </Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Blog Posts */}
                    {posts.length > 0 && (
                        <Card className="p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 text-lg">Blog Posts</h3>
                                <Badge variant="secondary">{posts.length}</Badge>
                            </div>
                            <div className="space-y-4">
                                {posts.slice(0, 3).map(post => (
                                    <div key={post.id} className="group cursor-pointer">
                                        <Link to={createPageUrl(`BlogPostDetail`) + `?id=${post.id}`} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 line-clamp-2">
                                                    {post.title}
                                                </h4>
                                                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{post.excerpt}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span>{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                                                    <span>•</span>
                                                    <span>{post.read_time || '5 min read'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            {posts.length > 3 && (
                                <div className="mt-4 text-center">
                                    <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700">
                                        See all posts
                                    </Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Empty State */}
                    {events.length === 0 && posts.length === 0 && (
                        <Card className="p-12 text-center shadow-sm">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts yet</h3>
                            <p className="text-slate-500">When {isOwnProfile ? "you share" : `${profile.display_name} shares`} events or blog posts, they'll appear here.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}