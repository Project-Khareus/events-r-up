import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, FileText, Edit, Loader2, Twitter, Instagram, Linkedin, Globe, Users, Heart } from "lucide-react";
import FollowButton from "../components/profile/FollowButton";
import EventCard from "../components/events/EventCard";
import { format } from "date-fns";

const PANEL =
  "bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] rounded-none";
const MUTED = "text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]";

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
  const { data: events = [] } = useQuery({
    queryKey: ['user_events', userId],
    queryFn: async () => {
        if (!userId) return [];
        const allEvents = await base44.entities.EventListing.list('-created_date', 50);
        return allEvents.filter(e => e.user_id === userId);
    },
    enabled: !!userId
  });

  // Fetch User's Blog Posts
  const { data: posts = [] } = useQuery({
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
    return (
      <div className="min-h-screen bg-cream dark:bg-[#211B16] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold-text dark:text-gold-dark" />
      </div>
    );
  }

  if (profileError || (!profile && !profileLoading)) {
    if (profileError) console.error("Profile fetch error:", profileError);
    return (
      <div className="min-h-screen bg-cream dark:bg-[#211B16] flex flex-col items-center justify-center px-5 text-center">
          <h2 className="font-serif text-[28px] text-ink dark:text-[#F1E8E0]">
            {profileError ? "We couldn't load this profile" : "Profile not found"}
          </h2>
          <p className={`mt-2 text-[14px] font-light ${MUTED}`}>
            {profileError ? "Please try again in a moment." : "This user hasn't set up their public profile yet."}
          </p>
          <Link
            to={createPageUrl("Classifieds")}
            className="mt-6 inline-flex items-center min-h-[48px] px-6 rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors"
          >
            Back to events
          </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#211B16] pb-[82px] md:pb-0">
        {/* Cover */}
        <div className="h-56 md:h-72 bg-ink dark:bg-[#3B322B] overflow-hidden">
            {profile.cover_image_url && (
                <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            )}
        </div>

        {/* Header */}
        <div className="bg-linen dark:bg-[#2A231D] border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
            <div className="max-w-[1100px] mx-auto px-5 md:px-10">
                <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-16 md:-mt-20 pb-5">
                    <Avatar className="w-28 h-28 md:w-36 md:h-36 border-2 border-cream dark:border-[#2A231D]">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="font-serif text-4xl md:text-5xl bg-[rgba(169,126,46,0.12)] text-gold-text dark:text-gold-dark">
                            {profile.display_name?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 md:pb-3">
                        <h1 className="font-serif text-[30px] md:text-[40px] leading-[1.15] text-ink dark:text-[#F1E8E0]">{profile.display_name}</h1>
                        <p className={`mt-1 text-[14.5px] font-light max-w-xl ${MUTED}`}>{profile.bio || "Event enthusiast"}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-5 text-[13px] font-light">
                            <span className={`flex items-center gap-2 ${MUTED}`}>
                                <Users className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                                <span className="text-ink dark:text-[#F1E8E0]">{followers.length}</span> followers
                            </span>
                            <span className={`flex items-center gap-2 ${MUTED}`}>
                                <Heart className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                                <span className="text-ink dark:text-[#F1E8E0]">{following.length}</span> following
                            </span>
                            {profile.location && (
                                <span className={`flex items-center gap-2 ${MUTED}`}>
                                    <MapPin className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                                    {profile.location}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 md:pb-3 [&_button]:rounded-none [&_button]:min-h-[44px]">
                        {isOwnProfile ? (
                            <Link
                                to={createPageUrl("Settings")}
                                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[10.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors"
                            >
                                <Edit className="h-4 w-4" />
                                Edit profile
                            </Link>
                        ) : (
                            <FollowButton targetUserId={userId} />
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-8 md:py-12">
            <div className="grid md:grid-cols-5 gap-6">
                {/* Intro */}
                <div className="md:col-span-2">
                    <section className={`${PANEL} p-5 md:p-6`}>
                        <h3 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0]">Intro</h3>
                        <div className="mt-4 space-y-3 text-[13.5px] font-light">
                            {profile.location && (
                                <div className={`flex items-center gap-3 ${MUTED}`}>
                                    <MapPin className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0" />
                                    <span>Lives in <span className="text-ink dark:text-[#F1E8E0]">{profile.location}</span></span>
                                </div>
                            )}
                            {profile.website && (
                                <div className={`flex items-center gap-3 ${MUTED}`}>
                                    <Globe className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0" />
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-gold-text dark:text-gold-dark hover:underline truncate">
                                        {profile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                            <div className={`flex items-center gap-3 ${MUTED}`}>
                                <Calendar className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0" />
                                <span>Joined {format(new Date(profile.created_date), 'MMMM yyyy')}</span>
                            </div>
                        </div>

                        {(profile.social_links?.twitter || profile.social_links?.instagram || profile.social_links?.linkedin) && (
                            <div className="mt-6 pt-5 border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] flex flex-wrap gap-3">
                                {profile.social_links?.twitter && (
                                    <a href={`https://twitter.com/${profile.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="h-11 w-11 flex items-center justify-center border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] hover:bg-[rgba(169,126,46,0.08)] transition-colors">
                                        <Twitter className="h-4 w-4 text-ink dark:text-[#F1E8E0]" />
                                    </a>
                                )}
                                {profile.social_links?.instagram && (
                                    <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="h-11 w-11 flex items-center justify-center border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] hover:bg-[rgba(169,126,46,0.08)] transition-colors">
                                        <Instagram className="h-4 w-4 text-ink dark:text-[#F1E8E0]" />
                                    </a>
                                )}
                                {profile.social_links?.linkedin && (
                                    <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="h-11 w-11 flex items-center justify-center border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] hover:bg-[rgba(169,126,46,0.08)] transition-colors">
                                        <Linkedin className="h-4 w-4 text-ink dark:text-[#F1E8E0]" />
                                    </a>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* Posts / Events */}
                <div className="md:col-span-3 space-y-6">
                    {events.length > 0 && (
                        <section className={`${PANEL} p-5 md:p-6`}>
                            <div className="flex items-center justify-between border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] pb-3">
                                <h3 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0]">Events</h3>
                                <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">{events.length} total</span>
                            </div>
                            <div className="mt-5 grid sm:grid-cols-2 gap-4">
                                {events.slice(0, 4).map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </section>
                    )}

                    {posts.length > 0 && (
                        <section className={`${PANEL} p-5 md:p-6`}>
                            <div className="flex items-center justify-between border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] pb-3">
                                <h3 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0]">Journal</h3>
                                <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">{posts.length} posts</span>
                            </div>
                            <div className="mt-2 divide-y divide-[rgba(59,50,43,0.14)] dark:divide-[rgba(241,232,224,0.16)]">
                                {posts.slice(0, 3).map(post => (
                                    <Link key={post.id} to={createPageUrl(`BlogPostDetail`) + `?id=${post.id}`} className="group flex gap-4 py-4">
                                        <div className="w-24 h-24 bg-cream dark:bg-[#211B16] overflow-hidden shrink-0">
                                            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-serif text-[19px] leading-[1.25] text-ink dark:text-[#F1E8E0] group-hover:text-gold-text dark:group-hover:text-gold-dark line-clamp-2">
                                                {post.title}
                                            </h4>
                                            <p className={`mt-1 text-[13px] font-light line-clamp-2 ${MUTED}`}>{post.excerpt}</p>
                                            <p className="mt-2 text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
                                                {format(new Date(post.created_date), 'MMM d, yyyy')} · {post.read_time || '5 min read'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {events.length === 0 && posts.length === 0 && (
                        <section className={`${PANEL} p-10 md:p-12 text-center`}>
                            <FileText className="h-8 w-8 mx-auto text-gold-text dark:text-gold-dark" />
                            <h3 className="mt-4 font-serif text-[24px] text-ink dark:text-[#F1E8E0]">Nothing published yet</h3>
                            <p className={`mt-2 text-[14px] font-light ${MUTED}`}>
                                When {isOwnProfile ? "you share" : `${profile.display_name} shares`} events or journal posts, they'll appear here.
                            </p>
                        </section>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}