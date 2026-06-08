import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Calendar, Smartphone, Camera, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import BiometricLogin from "../components/auth/BiometricLogin";
import { useQuery } from "@tanstack/react-query";

export default function MyProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(createPageUrl("MyProfile"));
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: devices = [] } = useQuery({
    queryKey: ['userDevices', user?.id],
    queryFn: () => base44.entities.UserDevice.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: biometricCreds = [] } = useQuery({
    queryKey: ['biometricCredentials', user?.id],
    queryFn: () => base44.entities.BiometricCredential.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: userProfiles = [], refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const userProfile = userProfiles[0];

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (userProfile) {
      await base44.entities.UserProfile.update(userProfile.id, { cover_image_url: file_url });
    } else {
      await base44.entities.UserProfile.create({
        user_id: user.id,
        display_name: user.full_name || "User",
        cover_image_url: file_url,
      });
    }
    await refetchProfile();
    setUploadingCover(false);
    toast.success("Cover image updated");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <Skeleton className="h-44 sm:h-56 rounded-xl mb-6" />
          <div className="grid gap-4 sm:gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>We couldn't load your profile. Please sign in again to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="w-full">
              Sign in again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Profile Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-20 sm:h-24 group">
            {userProfile?.cover_image_url ? (
              <img src={userProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-indigo-500" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                {uploadingCover ? "Uploading..." : "Change Cover"}
              </span>
            </label>
          </div>
          <div className="px-4 sm:px-6 pb-5 -mt-10 sm:-mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-md">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl sm:text-3xl">
                  {user?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{user?.full_name}</h1>
                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="flex gap-2 sm:gap-3 shrink-0">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(createPageUrl("UserProfile") + `?userId=${user?.id}`)}>
                  View Public Profile
                </Button>
                <Button size="sm" className="text-xs sm:text-sm" onClick={() => navigate(createPageUrl("Settings"))}>
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Account Details</CardTitle>
              <CardDescription>Your basic account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Full Name</Label>
                  <Input value={user?.full_name || ''} disabled className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Email</Label>
                  <Input value={user?.email || ''} disabled className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Role</Label>
                  <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 rounded-md border border-slate-200">
                    <Shield className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium capitalize text-slate-700">{user?.role}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Member Since</Label>
                  <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 rounded-md border border-slate-200">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm text-slate-700">{new Date(user?.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biometric Authentication */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                Biometric Authentication
              </CardTitle>
              <CardDescription>
                Enable Face ID or Touch ID for quick and secure login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {biometricCreds.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Face ID Enabled</p>
                        <p className="text-sm text-slate-600">{biometricCreds[0].device_name}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    You can now use Face ID to quickly log in to your account
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Secure your account with biometric authentication. Once enabled, you can use Face ID or Touch ID to log in instantly.
                  </p>
                  <BiometricLogin />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trusted Devices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Trusted Devices</CardTitle>
              <CardDescription>Devices you've used to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <p className="text-sm text-slate-500">No devices registered yet</p>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{device.device_name}</p>
                          <p className="text-sm text-slate-500">
                            Last used: {new Date(device.last_login).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">{device.ip_address}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}