import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, Save, X } from "lucide-react";

const CATEGORIES = ["Trends", "Real Weddings", "Planning Tips", "Vendor Spotlights", "Company News"];

export default function BlogEditor({ post, onSave, onCancel }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    category: "Planning Tips",
    read_time: "5 min read",
    is_featured: false,
    author_name: "",
    author_avatar_url: ""
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        cover_image_url: post.cover_image_url || "",
        category: post.category || "Planning Tips",
        read_time: post.read_time || "5 min read",
        is_featured: post.is_featured || false,
        author_name: post.author_name || "",
        author_avatar_url: post.author_avatar_url || ""
      });
    } else {
        // Set default author from current user if creating new
        base44.auth.me().then(user => {
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    author_name: user.full_name || "",
                    author_avatar_url: user.profile_picture_url || "" // assuming this might exist or can be empty
                }));
            }
        });
    }
  }, [post]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading image...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("cover_image_url", file_url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {post ? "Edit Post" : "Create New Post"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Post title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (URL friendly)</Label>
            <Input 
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="my-awesome-post"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Excerpt</Label>
          <Textarea 
            value={formData.excerpt}
            onChange={(e) => handleChange("excerpt", e.target.value)}
            placeholder="Short summary for card display..."
            rows={3}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(val) => handleChange("category", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Read Time</Label>
            <Input 
              value={formData.read_time}
              onChange={(e) => handleChange("read_time", e.target.value)}
              placeholder="e.g. 5 min read"
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Switch 
              checked={formData.is_featured}
              onCheckedChange={(val) => handleChange("is_featured", val)}
              id="featured-mode"
            />
            <Label htmlFor="featured-mode">Featured Post</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cover Image</Label>
          <div className="flex items-center gap-4">
             {formData.cover_image_url && (
               <img 
                 src={formData.cover_image_url} 
                 alt="Cover" 
                 className="h-20 w-32 object-cover rounded-md border border-slate-200"
               />
             )}
             <div className="flex-1">
               <Input 
                 value={formData.cover_image_url}
                 onChange={(e) => handleChange("cover_image_url", e.target.value)}
                 placeholder="Image URL"
                 className="mb-2"
               />
               <div className="relative">
                 <Input 
                   type="file" 
                   onChange={handleImageUpload}
                   className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                 />
                 <Button type="button" variant="outline" className="w-full">
                   <ImageIcon className="h-4 w-4 mr-2" />
                   Or Upload Image
                 </Button>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <div className="h-96 pb-12">
            <ReactQuill 
              theme="snow"
              value={formData.content}
              onChange={(content) => handleChange("content", content)}
              className="h-full"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
                <Label>Author Name</Label>
                <Input 
                    value={formData.author_name}
                    onChange={(e) => handleChange("author_name", e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label>Author Avatar URL</Label>
                <Input 
                    value={formData.author_avatar_url}
                    onChange={(e) => handleChange("author_avatar_url", e.target.value)}
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Post
          </Button>
        </div>
      </form>
    </Card>
  );
}