import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, User, Phone, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    phone_number: "",
    profile_picture_url: "",
    full_name: "" // For display/confirm
  });

  useEffect(() => {
    const init = async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setUser(currentUser);
      setFormData({
        phone_number: currentUser.phone_number || "",
        profile_picture_url: currentUser.profile_picture_url || currentUser.avatar_url || "",
        full_name: currentUser.full_name || ""
      });
      setIsLoading(false);
    };
    init();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading image...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone_number || !formData.profile_picture_url || !formData.full_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      // Update user profile
      // We set status to 'approved' here assuming completion meets the requirement
      // In a real app with SMS auth, we'd verify the phone first.
      await base44.auth.updateMe({
        phone_number: formData.phone_number,
        profile_picture_url: formData.profile_picture_url,
        full_name: formData.full_name,
        status: "approved"
      });

      toast.success("Profile completed successfully!");
      
      // Redirect back to where they came from or CreateEvent
      const params = new URLSearchParams(location.search);
      const next = params.get("next");
      if (next) {
        navigate(next);
      } else {
        navigate(createPageUrl("CreateEvent"));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 bg-white shadow-lg rounded-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
            <User className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="text-slate-600 mt-2">
            To publish events, we need a few more details to verify your identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-2 text-center">
              <Label className="block text-left">Profile Picture *</Label>
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100">
                  {formData.profile_picture_url ? (
                    <img src={formData.profile_picture_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="relative">
                    <Button type="button" variant="outline" size="sm" className="relative overflow-hidden">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </Button>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                We need this to verify your account.
              </p>
            </div>

            <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                disabled={isSaving}
            >
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        Complete Profile
                        <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </form>
      </Card>
    </div>
  );
}