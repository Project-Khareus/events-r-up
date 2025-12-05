import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ArrowLeft, Share2, Clock, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function BlogPostDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog_post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link to={createPageUrl("Blog")}>
          <Button>Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to={createPageUrl("Blog")} className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        <div className="space-y-6 text-center max-w-3xl mx-auto mb-12">
          <span className="text-indigo-600 font-semibold tracking-wide text-sm uppercase">{post.category}</span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">
            {post.title}
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-center gap-6 py-6 border-t border-b border-slate-100 mt-8">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author_avatar_url} />
                <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-slate-900 text-sm">{post.author_name}</p>
                <p className="text-xs text-slate-500">Editor</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.created_date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.read_time}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden mb-12 shadow-xl">
          <img 
            src={post.cover_image_url} 
            alt={post.title}
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="prose prose-lg prose-slate mx-auto prose-headings:font-serif prose-a:text-indigo-600 hover:prose-a:text-indigo-700 prose-img:rounded-xl">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
          <p className="font-serif font-bold text-slate-900 text-xl">Share this article</p>
          <div className="flex gap-2">
             <Button variant="outline" size="icon" className="rounded-full">
               <Share2 className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}