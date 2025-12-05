import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error("Access denied. Admins only.");
          navigate(createPageUrl("Blog"));
        }
      } catch (error) {
        toast.error("Please log in to access admin area");
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog_posts_admin'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 100),
    enabled: isAdmin
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts_admin'] });
      toast.success("Post created successfully");
      setIsEditing(false);
      setCurrentPost(null);
    },
    onError: () => toast.error("Failed to create post")
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts_admin'] });
      toast.success("Post updated successfully");
      setIsEditing(false);
      setCurrentPost(null);
    },
    onError: () => toast.error("Failed to update post")
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog_posts_admin'] });
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
           <BlogEditor 
             post={currentPost} 
             onSave={handleSave} 
             onCancel={() => {
               setIsEditing(false);
               setCurrentPost(null);
             }} 
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
            <h1 className="text-3xl font-bold text-slate-900">Blog CMS</h1>
          </div>
          <Button onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map(post => (
              <Card key={post.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
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
                    <h3 className="font-bold text-slate-900 line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-slate-500">
                        {post.category} • {format(new Date(post.created_date), 'MMM d, yyyy')}
                        {post.is_featured && <span className="ml-2 text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded text-xs">Featured</span>}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
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
                      <Button variant="destructive" size="sm">
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
            
            {posts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">No blog posts found. Create your first one!</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}