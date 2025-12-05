import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Loader2, Image as ImageIcon, Save, X, Send, Eye } from "lucide-react";

const CATEGORIES = ["Trends", "Real Weddings", "Planning Tips", "Vendor Spotlights", "Company News"];

export default function BlogEditor({ post, onSave, onCancel, userRole }) {
  const [isLoading, setIsLoading] = useState(false);
  const quillRef = useRef(null);
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
    author_avatar_url: "",
    status: "draft"
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
        author_avatar_url: post.author_avatar_url || "",
        status: post.status || "draft"
      });
    } else {
        base44.auth.me().then(user => {
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    author_name: user.full_name || "",
                    author_avatar_url: user.profile_picture_url || "",
                    status: "draft"
                }));
            }
        });
    }
  }, [post]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Custom image handler for Quill to upload to server instead of base64
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
            const loadingToast = toast.loading("Uploading image...");
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            toast.dismiss(loadingToast);
            
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection();
            quill.insertEmbed(range.index, 'image', file_url);
        } catch (error) {
            toast.error("Failed to upload image");
            console.error(error);
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        ['clean'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }]
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading cover image...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("cover_image_url", file_url);
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async (e, targetStatus) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // If user is not admin and trying to publish, force pending_approval
      let finalStatus = targetStatus || formData.status;
      if (userRole !== 'admin' && finalStatus === 'published') {
          finalStatus = 'pending_approval';
      }
      
      await onSave({ ...formData, status: finalStatus });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white shadow-lg max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {post ? "Edit Post" : "Create New Post"}
        </h2>
        <div className="flex items-center gap-2">
             <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                 formData.status === 'published' ? 'bg-green-100 text-green-800' :
                 formData.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                 formData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                 'bg-slate-100 text-slate-800'
             }`}>
                 {formData.status.replace('_', ' ')}
             </span>
            <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
            </Button>
        </div>
      </div>

      <form className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Post title"
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea 
                    value={formData.excerpt}
                    onChange={(e) => handleChange("excerpt", e.target.value)}
                    placeholder="Short summary..."
                    rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <div className="h-[500px] pb-12">
                    <ReactQuill 
                    ref={quillRef}
                    theme="snow"
                    modules={modules}
                    value={formData.content}
                    onChange={(content) => handleChange("content", content)}
                    className="h-full"
                    />
                </div>
              </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                    {formData.cover_image_url ? (
                        <div className="relative group">
                            <img 
                                src={formData.cover_image_url} 
                                alt="Cover" 
                                className="w-full h-32 object-cover rounded-md"
                            />
                            <button
                                type="button"
                                onClick={() => handleChange("cover_image_url", "")}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="py-4">
                            <ImageIcon className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                            <div className="relative">
                                <Input 
                                type="file" 
                                onChange={handleCoverImageUpload}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                />
                                <span className="text-xs text-indigo-600 font-medium">Upload Image</span>
                            </div>
                        </div>
                    )}
                </div>
             </div>

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

             <div className="space-y-2">
                <Label>Slug</Label>
                <Input 
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="url-slug"
                className="text-sm text-slate-500"
                />
             </div>
            
             {userRole === 'admin' && (
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 mt-4">
                    <Switch 
                    checked={formData.is_featured}
                    onCheckedChange={(val) => handleChange("is_featured", val)}
                    id="featured-mode"
                    />
                    <Label htmlFor="featured-mode">Featured Post</Label>
                </div>
             )}

             <div className="pt-4 space-y-3">
                 {/* Action Buttons */}
                 <Button 
                    type="button" 
                    onClick={(e) => handleSubmit(e, 'draft')} 
                    variant="outline" 
                    className="w-full"
                    disabled={isLoading}
                 >
                     <Save className="h-4 w-4 mr-2" />
                     Save as Draft
                 </Button>

                 {userRole === 'admin' ? (
                     <Button 
                        type="button" 
                        onClick={(e) => handleSubmit(e, 'published')} 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                     >
                         <Eye className="h-4 w-4 mr-2" />
                         Publish Now
                     </Button>
                 ) : (
                    <Button 
                        type="button" 
                        onClick={(e) => handleSubmit(e, 'pending_approval')} 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={isLoading}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Submit for Review
                    </Button>
                 )}
             </div>
          </div>
        </div>
      </form>
    </Card>
  );
}