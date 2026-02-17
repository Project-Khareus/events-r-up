import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

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
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <Skeleton className="h-16 w-1/3" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Categories Nav */}
      <div className="border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-8 h-14 text-sm font-medium text-slate-300 whitespace-nowrap">
            {categories.map(cat => (
              <button key={cat} className="hover:text-white transition-colors">
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
              <div className="overflow-hidden rounded-2xl">
                <img 
                  src={featuredPost.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000"} 
                  alt={featuredPost.title}
                  className="w-full aspect-[16/10] object-cover transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000"; }}
                />
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-semibold tracking-wide text-sm uppercase">{featuredPost.category}</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-tight group-hover:text-indigo-900 transition-colors dark:text-white dark:group-hover:text-indigo-400">
                  {featuredPost.title}
                </h2>
                <p className="text-lg text-slate-600 line-clamp-3 leading-relaxed dark:text-slate-300">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={featuredPost.author_avatar_url} />
                    <AvatarFallback>{featuredPost.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-white">{featuredPost.author_name}</p>
                    <p className="text-slate-500 dark:text-slate-400">
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
          <h3 className="text-2xl font-bold text-slate-900 mb-8 font-serif dark:text-white">Latest Stories</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {otherPosts.map(post => (
              <Link key={post.id} to={createPageUrl("BlogPostDetail") + `?id=${post.id}`} className="group flex flex-col h-full">
                <div className="overflow-hidden rounded-xl mb-5">
                  <img 
                    src={post.cover_image_url || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"} 
                    alt={post.title}
                    className="w-full aspect-[4/3] object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                   <div className="flex items-center gap-2 mb-3">
                     <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 rounded-sm dark:bg-slate-800 dark:text-slate-300">
                        {post.category}
                     </Badge>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors dark:text-white dark:group-hover:text-indigo-400">
                     {post.title}
                   </h3>
                   <p className="text-slate-600 line-clamp-2 mb-4 text-sm flex-1 dark:text-slate-400">
                     {post.excerpt}
                   </p>
                   <div className="flex items-center gap-2 mt-auto">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author_avatar_url} />
                        <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-900 dark:text-slate-200">{post.author_name}</span>
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