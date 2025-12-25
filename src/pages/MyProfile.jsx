import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Bell, 
  Heart, 
  MessageSquare, 
  Store, 
  Camera, 
  Mail, 
  MapPin, 
  Globe, 
  ChevronRight,
  LogOut
} from "lucide-react";
import { toast } from "sonner";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    display_name: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: ""
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_messages: true,
    email_bookings: true,
    email_reviews: true,
    email_promotions: false
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load user profile if exists
        const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
        if (profiles.length > 0) {
          setProfileData(profiles[0]);
        } else {
          // Initialize profile data with user info
          setProfileData({
            display_name: currentUser.full_name || "",
            bio: "",
            location: "",
            website: "",
            avatar_url: ""
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        toast.error("Please log in to view your profile");
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    loadUser();
  }, []);

  const { data: vendor } = useQuery({
    queryKey: ['my_vendor', user?.id],
    queryFn: async () => {
      const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
      return vendors[0];
    },
    enabled: !!user?.id,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['my_favorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['my_conversations', user?.id],
    queryFn: () => base44.entities.Conversation.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        return base44.entities.UserProfile.update(profiles[0].id, data);
      } else {
        return base44.entities.UserProfile.create({ ...data, user_id: user.id });
      }
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(['user_profile']);
    },
    onError: () => {
      toast.error("Failed to update profile");
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({ ...profileData, avatar_url: file_url });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="text-2xl bg-slate-200">
                  {user?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{user?.full_name}</h1>
              <p className="text-slate-600">{user?.email}</p>
              {user?.role === 'admin' && (
                <Badge className="mt-2 bg-indigo-100 text-indigo-700">Admin</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("UserProfile") + `?userId=${user?.id}`}>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  View Public Profile
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Heart className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Display Name</Label>
                    <Input 
                      value={profileData.display_name}
                      onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email} disabled className="bg-slate-50" />
                  </div>
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea 
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input 
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </Label>
                    <Input 
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Vendor Listing Card */}
            {vendor ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Vendor Listing</CardTitle>
                  <CardDescription>Manage your business listing on Omnievents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {vendor.logo_url && (
                        <img src={vendor.logo_url} alt={vendor.business_name} className="h-12 w-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900">{vendor.business_name}</h3>
                        <p className="text-sm text-slate-600">{vendor.category}</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("ManageListing")}>
                      <Button variant="outline" className="gap-2">
                        Manage Listing
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Become a Vendor</CardTitle>
                  <CardDescription>List your business and reach more customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={createPageUrl("VendorSignup")}>
                    <Button className="w-full sm:w-auto gap-2">
                      <Store className="h-4 w-4" />
                      Create Vendor Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates from Omnievents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Messages</p>
                    <p className="text-sm text-slate-600">Get notified when you receive messages from vendors</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_messages}
                    onCheckedChange={(val) => setNotificationSettings({...notificationSettings, email_messages: val})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Booking Updates</p>
                    <p className="text-sm text-slate-600">Receive updates about your bookings</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_bookings}
                    onCheckedChange={(val) => setNotificationSettings({...notificationSettings, email_bookings: val})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Reviews</p>
                    <p className="text-sm text-slate-600">Get notified when vendors respond to your reviews</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_reviews}
                    onCheckedChange={(val) => setNotificationSettings({...notificationSettings, email_reviews: val})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Promotions & Tips</p>
                    <p className="text-sm text-slate-600">Receive special offers and event planning tips</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_promotions}
                    onCheckedChange={(val) => setNotificationSettings({...notificationSettings, email_promotions: val})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Favorites</CardTitle>
                    <CardDescription>{favorites.length} saved items</CardDescription>
                  </div>
                  <Heart className="h-8 w-8 text-pink-500" />
                </CardHeader>
                <CardContent>
                  <Link to={createPageUrl("MyFavorites")}>
                    <Button variant="outline" className="w-full gap-2">
                      View Favorites
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>{conversations.length} conversations</CardDescription>
                  </div>
                  <MessageSquare className="h-8 w-8 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <Link to={createPageUrl("Messages")}>
                    <Button variant="outline" className="w-full gap-2">
                      View Messages
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}