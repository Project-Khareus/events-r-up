import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (!currentUser) {
          toast.error("Please log in to access the Blog CMS");
          base44.auth.redirectToLogin(window.location.href);
        }
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog_posts_cms'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 100),
    enabled: !!user
  });

  // Filter posts based on role
  const filteredPosts = useMemo(() => {
      if (isAdmin) {
          if (activeTab === 'pending') return posts.filter(p => p.status === 'pending');
          if (activeTab === 'my_posts') return posts.filter(p => p.user_id === user?.id);
          return posts;
      } else {
          // Non-admins only see their own posts
          return posts.filter(p => p.user_id === user?.id);
      }
  }, [posts, isAdmin, activeTab, user]);

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create({ ...data, user_id: user.id }),
    onSuccess: async (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts_cms'] });
      
      if (newPost.status === 'pending' && !isAdmin) {
          toast.success("Post submitted for approval!");
          try {
              // Notify admin (using a generic placeholder or app owner if available)
              await base44.integrations.Core.SendEmail({
                  to: "admin@omnievents.com", // Ideally this would be dynamic
                  subject: "New Blog Post Submission",
                  body: `User ${user.full_name} has submitted a new blog post titled "${newPost.title}" for approval.`
              });
          } catch (e) {
              console.error("Failed to send notification email", e);
          }
      } else {
          toast.success("Post saved successfully");
      }
      
      setIsEditing(false);
      setCurrentPost(null);
    },
    onError: () => toast.error("Failed to create post")
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts_cms'] });
      
      if (updatedPost.status === 'pending' && !isAdmin) {
           toast.success("Post submitted for approval!");
             try {
              base44.integrations.Core.SendEmail({
                  to: "admin@omnievents.com",
                  subject: "Blog Post Submission Updated",
                  body: `User ${user.full_name} has updated and submitted the blog post titled "${updatedPost.title}" for approval.`
              });
          } catch (e) {}
      } else {
          toast.success("Post updated successfully");
      }
      
      setIsEditing(false);
      setCurrentPost(null);
    },
    onError: () => toast.error("Failed to update post")
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts_cms'] });
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

  const handleStatusChange = (post, newStatus) => {
      updatePostMutation.mutate({ 
          id: post.id, 
          data: { ...post, status: newStatus } 
      });
  };

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
        <div className="max-w-6xl mx-auto">
           <BlogEditor 
             post={currentPost} 
             onSave={handleSave} 
             onCancel={() => {
               setIsEditing(false);
               setCurrentPost(null);
             }}
             isAdmin={isAdmin}
           />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Blog")}>
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Blog CMS</h1>
                <p className="text-slate-500">{isAdmin ? "Manage and approve content" : "Manage your contributions"}</p>
            </div>
          </div>
          <Button onClick={() => { setCurrentPost(null); setIsEditing(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {isAdmin && (
            <div className="mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All Posts</TabsTrigger>
                        <TabsTrigger value="pending" className="relative">
                            Pending Approval
                            {posts.filter(p => p.status === 'pending').length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {posts.filter(p => p.status === 'pending').length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="my_posts">My Posts</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 bg-slate-100 rounded overflow-hidden shrink-0">
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-200">
                        <span className="text-xs">No img</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 line-clamp-1">{post.title}</h3>
                        <Badge variant={
                            post.status === 'published' ? 'default' : 
                            post.status === 'pending' ? 'secondary' : 
                            post.status === 'rejected' ? 'destructive' : 'outline'
                        } className="capitalize text-xs h-5">
                            {post.status || 'draft'}
                        </Badge>
                        {post.is_featured && <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">Featured</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {post.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                        {isAdmin && post.author_name && (
                            <>
                                <span>•</span>
                                <span>by {post.author_name}</span>
                            </>
                        )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-center">
                  {isAdmin && post.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleStatusChange(post, 'published')}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleStatusChange(post, 'rejected')}>
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setCurrentPost(post);
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the blog post "{post.title}".
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
                    <p className="text-slate-500">
                        {activeTab === 'pending' ? "No pending posts to review." : "No blog posts found. Create your first one!"}
                    </p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}