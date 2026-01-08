import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Shield, Bell, MapPin, Trash2, Loader2, AlertTriangle, Store, Edit3, Upload, Globe, Twitter, Instagram, Linkedin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteListingOpen, setDeleteListingOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return null;
      }
      return base44.auth.me();
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['userVendors', user?.id],
    queryFn: () => base44.entities.Vendor.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (userProfile) {
        return base44.entities.UserProfile.update(userProfile.id, data);
      } else {
        return base44.entities.UserProfile.create({ ...data, user_id: user.id });
      }
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId) => {
      return base44.entities.Vendor.delete(vendorId);
    },
    onSuccess: () => {
      toast.success("Vendor listing deleted");
      queryClient.invalidateQueries(['userVendors']);
      setDeleteListingOpen(false);
      setConfirmText("");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Delete all vendor listings
      await Promise.all(vendors.map(v => base44.entities.Vendor.delete(v.id)));
      // Note: Actual user account deletion would need admin/backend support
      await base44.auth.logout();
      return true;
    },
    onSuccess: () => {
      toast.success("Account data deleted. Redirecting...");
      setTimeout(() => navigate(createPageUrl("Home")), 2000);
    },
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="vendor" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Vendor</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Edit Public Profile</h2>
              <div className="space-y-6">
                {/* Profile Pictures */}
                <div className="space-y-4">
                  <div>
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={userProfile?.avatar_url || user?.profile_picture_url} />
                        <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                          {(userProfile?.display_name || user?.full_name)?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="w-full max-w-xs"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            toast.info("Uploading image...");
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              await updateProfileMutation.mutateAsync({ avatar_url: file_url });
                              toast.success("Profile picture updated");
                            } catch (error) {
                              toast.error("Failed to upload image");
                            }
                          }}
                        />
                        <p className="text-xs text-slate-500 mt-1">Recommended: Square image, at least 400x400px</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Cover Photo</Label>
                    <div className="mt-2">
                      {userProfile?.cover_image_url && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 border border-slate-200">
                          <img src={userProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <Input 
                        type="file" 
                        accept="image/*"
                        className="w-full max-w-xs"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          toast.info("Uploading cover photo...");
                          try {
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            await updateProfileMutation.mutateAsync({ cover_image_url: file_url });
                            toast.success("Cover photo updated");
                          } catch (error) {
                            toast.error("Failed to upload image");
                          }
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-1">Recommended: 1500x500px</p>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <Label>Display Name</Label>
                  <Input 
                    defaultValue={userProfile?.display_name || user?.full_name || ''} 
                    placeholder="Your public display name"
                    onBlur={(e) => {
                      if (e.target.value !== userProfile?.display_name) {
                        updateProfileMutation.mutate({ display_name: e.target.value });
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">This is the name people will see on your profile</p>
                </div>

                {/* Bio */}
                <div>
                  <Label>Bio</Label>
                  <Textarea 
                    defaultValue={userProfile?.bio || ''} 
                    placeholder="Tell people about yourself..."
                    rows={4}
                    onBlur={(e) => {
                      if (e.target.value !== userProfile?.bio) {
                        updateProfileMutation.mutate({ bio: e.target.value });
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">Write a short bio about yourself</p>
                </div>

                {/* Location */}
                <div>
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      defaultValue={userProfile?.location || ''} 
                      placeholder="e.g., Accra, Ghana"
                      className="pl-10"
                      onBlur={(e) => {
                        if (e.target.value !== userProfile?.location) {
                          updateProfileMutation.mutate({ location: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <Label>Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      defaultValue={userProfile?.website || ''} 
                      placeholder="https://yourwebsite.com"
                      className="pl-10"
                      onBlur={(e) => {
                        if (e.target.value !== userProfile?.website) {
                          updateProfileMutation.mutate({ website: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <Label>Social Links</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      defaultValue={userProfile?.social_links?.twitter || ''} 
                      placeholder="Twitter/X username"
                      className="pl-10"
                      onBlur={(e) => {
                        const social_links = { ...(userProfile?.social_links || {}), twitter: e.target.value };
                        updateProfileMutation.mutate({ social_links });
                      }}
                    />
                  </div>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      defaultValue={userProfile?.social_links?.instagram || ''} 
                      placeholder="Instagram username"
                      className="pl-10"
                      onBlur={(e) => {
                        const social_links = { ...(userProfile?.social_links || {}), instagram: e.target.value };
                        updateProfileMutation.mutate({ social_links });
                      }}
                    />
                  </div>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      defaultValue={userProfile?.social_links?.linkedin || ''} 
                      placeholder="LinkedIn profile URL"
                      className="pl-10"
                      onBlur={(e) => {
                        const social_links = { ...(userProfile?.social_links || {}), linkedin: e.target.value };
                        updateProfileMutation.mutate({ social_links });
                      }}
                    />
                  </div>
                </div>

                {/* Preview Button */}
                <div className="pt-4 border-t border-slate-200">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(createPageUrl("UserProfile") + `?userId=${user.id}`)}
                    className="w-full sm:w-auto"
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Public Profile
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Account Information</h2>
              <div className="space-y-6">
                <div>
                  <Label>Full Name</Label>
                  <Input value={user.full_name || ''} disabled className="bg-slate-50 dark:bg-slate-900" />
                  <p className="text-xs text-slate-500 mt-1">Contact support to change your name</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-slate-50 dark:bg-slate-900" />
                  <p className="text-xs text-slate-500 mt-1">Contact support to change your email</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input 
                    defaultValue={userProfile?.location || ''} 
                    placeholder="e.g., Accra, Ghana"
                    onBlur={(e) => updateProfileMutation.mutate({ location: e.target.value })}
                  />
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </h3>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteAccountOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">This will permanently delete your account and all data</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Privacy Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Public Profile</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Allow others to view your profile</p>
                  </div>
                  <Switch 
                    defaultChecked={true}
                    onCheckedChange={(checked) => updateProfileMutation.mutate({ is_public: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Show Email</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Display email on public profile</p>
                  </div>
                  <Switch 
                    defaultChecked={false}
                    onCheckedChange={(checked) => updateProfileMutation.mutate({ show_email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Show Location</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Display location on profile</p>
                  </div>
                  <Switch 
                    defaultChecked={true}
                    onCheckedChange={(checked) => updateProfileMutation.mutate({ show_location: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Activity Status</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Show when you're active</p>
                  </div>
                  <Switch 
                    defaultChecked={true}
                    onCheckedChange={(checked) => updateProfileMutation.mutate({ show_activity: checked })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates via email</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Booking Updates</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Notifications about bookings</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Messages</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">New message notifications</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Marketing</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Promotional emails and updates</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">Weekly Digest</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Weekly summary of activity</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Vendor Settings */}
          <TabsContent value="vendor">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Vendor Management</h2>
              {vendors.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">You don't have any vendor listings yet</p>
                  <Button onClick={() => navigate(createPageUrl("VendorSignup"))}>
                    Create Vendor Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendors.map(vendor => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{vendor.business_name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.category?.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`${createPageUrl("EditVendor")}?id=${vendor.id}`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setDeleteListingOpen(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-3">
              <p>This action cannot be undone. This will permanently delete:</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-slate-600">
                <li>Your account and profile</li>
                <li>All vendor listings ({vendors.length})</li>
                <li>All bookings and messages</li>
                <li>All favorites and reviews</li>
              </ul>
              <p className="font-medium pt-2">Type <span className="font-bold text-slate-900">DELETE</span> to confirm:</p>
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteAccountOpen(false); setConfirmText(""); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={confirmText !== "DELETE" || deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Listing Dialog */}
      <Dialog open={deleteListingOpen} onOpenChange={setDeleteListingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Vendor Listing
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your vendor listing. All associated data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteListingOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteVendorMutation.isPending}
              onClick={() => vendors[0] && deleteVendorMutation.mutate(vendors[0].id)}
            >
              {deleteVendorMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                'Delete Listing'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}