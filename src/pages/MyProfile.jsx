import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Calendar, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import BiometricLogin from "../components/auth/BiometricLogin";
import { useQuery } from "@tanstack/react-query";

export default function MyProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
              <p className="text-slate-600">Manage your account settings</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(createPageUrl("UserProfile") + `?userId=${user?.id}`)}>
              View Public Profile
            </Button>
            <Button onClick={() => navigate(createPageUrl("Settings"))}>
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl">
                    {user?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">{user?.full_name}</h3>
                  <p className="text-slate-600">{user?.email}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Full Name</Label>
                  <Input value={user?.full_name || ''} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium capitalize">{user?.role}</span>
                  </div>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">{new Date(user?.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biometric Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
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
            <CardHeader>
              <CardTitle>Trusted Devices</CardTitle>
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