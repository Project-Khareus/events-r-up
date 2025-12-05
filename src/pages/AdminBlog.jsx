import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BlogEditor from "../components/blog/BlogEditor";
import { format } from "date-fns";

export default function AdminBlog() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Admins see all posts, users see only their own
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog_posts_cms'],
    queryFn: async () => {
        if (isAdmin) {
            return base44.entities.BlogPost.list('-created_date', 100);
        } else {
            // Filter for non-admins (client-side since simple filter might be limited)
            const allPosts = await base44.entities.BlogPost.list('-created_date', 100);
            return allPosts.filter(p => p.author_id === currentUser.id);
        }
    },
    enabled: !!currentUser
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create({
        ...data, 
        author_id: currentUser.id,
        // If admin creates, use status from form, else enforce pending/draft
        status: isAdmin ? data.status : (data.status === 'published' ? 'pending_approval' : data.status)
    }),
    onSuccess: async (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts_cms'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      toast.success(newPost.status === 'pending_approval' ? "Submitted for approval!" : "Post created successfully");
      setIsEditing(false);
      setCurrentPost(null);

      // Email Notification to Admin if submitted for approval
      if (newPost.status === 'pending_approval') {
          try {
            // In a real app, we'd loop through admins. Here we send to a designated address or app owner.
            // Using a placeholder for demonstration as we cannot fetch admins easily without backend functions.
            await base44.integrations.Core.SendEmail({
                to: "admin@omnievents.com", // Replace with real admin email
                subject: `New Blog Post Submission: ${newPost.title}`,
                body: `A new blog post has been submitted for approval by ${currentUser.full_name}.\n\nTitle: ${newPost.title}\nExcerpt: ${newPost.excerpt}\n\nPlease review it in the CMS.`
            });
          } catch (e) {
              console.error("Failed to send notification email", e);
          }
      }
    },
    onError: () => toast.error("Failed to create post")
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts_cms'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      toast.success("Post updated successfully");
      setIsEditing(false);
      setCurrentPost(null);

      // Notification logic for updates if status changes to pending
      if (updatedPost.status === 'pending_approval') {
         // Send notification
         base44.integrations.Core.SendEmail({
            to: "admin@omnievents.com",
            subject: `Blog Post Updated & Submitted: ${updatedPost.title}`,
            body: `The blog post "${updatedPost.title}" has been updated and submitted for approval by ${currentUser.full_name}.`
        }).catch(console.error);
      }
    },
    onError: () => toast.error("Failed to update post")
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts_cms'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      toast.success("Post deleted successfully");
    },
    onError: () => toast.error("Failed to delete post")
  });

  const handleSave = (formData) => {
    if (currentPost) {
      updatePostMutation.mutate({ id: currentPost.id, data: formData });
    } else {
      createPostMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    deletePostMutation.mutate(id);
  };

  const filteredPosts = posts.filter(post => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return post.status === 'pending_approval';
      if (activeTab === 'published') return post.status === 'published';
      if (activeTab === 'draft') return post.status === 'draft' || post.status === 'rejected';
      return true;
  });

  const pendingCount = posts.filter(p => p.status === 'pending_approval').length;

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
           <BlogEditor 
             post={currentPost} 
             onSave={handleSave} 
             onCancel={() => {
               setIsEditing(false);
               setCurrentPost(null);
             }} 
             userRole={currentUser.role}
           />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Blog")}>
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Blog CMS</h1>
                <p className="text-slate-500 text-sm">Manage content, approvals, and publications</p>
            </div>
          </div>
          <Button onClick={() => { setCurrentPost(null); setIsEditing(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-white border border-slate-200 p-1">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="published" className="data-[state=active]:text-green-700">Published</TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:text-amber-700 relative">
                    Pending Review
                    {pendingCount > 0 && (
                        <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">
                            {pendingCount}
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className="p-4 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-16 w-24 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <span className="text-xs">No img</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 truncate">{post.title}</h3>
                        {post.status === 'published' && <Badge className="bg-green-100 text-green-800 border-0 hover:bg-green-200">Published</Badge>}
                        {post.status === 'pending_approval' && <Badge className="bg-amber-100 text-amber-800 border-0 hover:bg-amber-200">Pending Review</Badge>}
                        {post.status === 'draft' && <Badge variant="outline" className="text-slate-500">Draft</Badge>}
                        {post.status === 'rejected' && <Badge className="bg-red-100 text-red-800 border-0 hover:bg-red-200">Rejected</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{post.author_name}</span>
                        <span>•</span>
                        <span>{post.category}</span>
                        <span>•</span>
                        <span className="text-xs text-slate-400">{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {isAdmin && post.status === 'pending_approval' && (
                      <>
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-9"
                            onClick={() => updatePostMutation.mutate({ id: post.id, data: { status: 'published' } })}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                            onClick={() => updatePostMutation.mutate({ id: post.id, data: { status: 'rejected' } })}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                      </>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setCurrentPost(post);
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete "{post.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
            
            {filteredPosts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">No posts found in this category.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}