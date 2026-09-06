import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

const HAIRLINE = "border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]";

export default function Blog() {
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['blog_posts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 50),
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Only show published posts on the public blog
  const posts = allPosts.filter(p => p.status === 'published' || !p.status); // fallback for legacy posts without status

  const featuredPost = posts.find(p => p.is_featured) || posts[0];
  const otherPosts = posts.filter(p => p.id !== featuredPost?.id);

  const categories = ["Trends", "Real Weddings", "Planning Tips", "Vendor Spotlights", "Company News"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#1B1714]">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <Skeleton className="h-16 w-1/3 rounded-none" />
          <Skeleton className="h-[400px] w-full rounded-none" />
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-none" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1B1714] text-ink dark:text-[#F1E8E0]">
      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold-text dark:text-gold-dark mb-3">Journal</p>
        <h1 className="font-serif text-5xl lg:text-6xl leading-[1.05]">The Khareus Journal</h1>
        <p className="mt-3 text-lg text-ink/70 dark:text-[#F1E8E0]/70 max-w-2xl">
          Stories, trends and planning notes from Ghana's event world.
        </p>
        <div className="mt-6 w-16 h-px bg-gold" />
      </div>

      {/* Categories Nav */}
      <div className={`border-y ${HAIRLINE} sticky top-0 bg-cream/95 dark:bg-[#1B1714]/95 backdrop-blur-md z-10`}>
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-8 h-14 text-[11px] uppercase tracking-[0.16em] text-ink/60 dark:text-[#F1E8E0]/60 whitespace-nowrap">
            {categories.map(cat => (
              <button key={cat} className="hover:text-gold-text dark:hover:text-gold-dark transition-colors">
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Featured Post */}
        {featuredPost && (
          <Link to={createPageUrl("BlogPostDetail") + `?id=${featuredPost.id}`} className="group block">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className={`overflow-hidden border ${HAIRLINE}`}>
                <img 
                  src={featuredPost.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000"} 
                  alt={featuredPost.title}
                  className="w-full aspect-[16/10] object-cover transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000"; }}
                />
              </div>
              <div className="space-y-5">
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold-text dark:text-gold-dark">{featuredPost.category}</span>
                <h2 className="font-serif text-4xl lg:text-5xl leading-tight group-hover:text-gold-text dark:group-hover:text-gold-dark transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-lg text-ink/70 dark:text-[#F1E8E0]/70 line-clamp-3 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className={`flex items-center gap-3 pt-4 border-t ${HAIRLINE}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={featuredPost.author_avatar_url} />
                    <AvatarFallback className="bg-transparent border border-gold text-gold-text">{featuredPost.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p>{featuredPost.author_name}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-ink/50 dark:text-[#F1E8E0]/50">
                      {format(new Date(featuredPost.created_date), 'MMM d')} • {featuredPost.read_time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Recent Posts Grid */}
        <div>
          <h3 className="font-serif text-3xl mb-8">Latest Stories</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {otherPosts.map(post => (
              <Link key={post.id} to={createPageUrl("BlogPostDetail") + `?id=${post.id}`} className="group flex flex-col h-full">
                <div className={`overflow-hidden mb-5 border ${HAIRLINE}`}>
                  <img 
                    src={post.cover_image_url || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"} 
                    alt={post.title}
                    className="w-full aspect-[4/3] object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                   <span className="text-[11px] uppercase tracking-[0.2em] text-gold-text dark:text-gold-dark mb-3">
                      {post.category}
                   </span>
                   <h3 className="font-serif text-2xl mb-3 line-clamp-2 group-hover:text-gold-text dark:group-hover:text-gold-dark transition-colors">
                     {post.title}
                   </h3>
                   <p className="text-ink/70 dark:text-[#F1E8E0]/70 line-clamp-2 mb-4 text-sm flex-1">
                     {post.excerpt}
                   </p>
                   <div className={`flex items-center gap-2 mt-auto pt-4 border-t ${HAIRLINE}`}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author_avatar_url} />
                        <AvatarFallback className="bg-transparent border border-gold text-gold-text text-[10px]">{post.author_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-[11px] uppercase tracking-[0.1em] text-ink/50 dark:text-[#F1E8E0]/50">
                        <span>{post.author_name}</span>
                        <span className="mx-1">•</span>
                        <span>{format(new Date(post.created_date), 'MMM d')}</span>
                        <span className="mx-1">•</span>
                        <span>{post.read_time}</span>
                      </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}