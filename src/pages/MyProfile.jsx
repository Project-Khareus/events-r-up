import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Calendar, Smartphone, Camera, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import BiometricLogin from "../components/auth/BiometricLogin";
import { useQuery } from "@tanstack/react-query";

const PANEL =
  "bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] rounded-none";
const EYEBROW =
  "text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]";
const FIELD =
  "flex items-center gap-2 min-h-[44px] px-3 bg-cream dark:bg-[#211B16] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] rounded-none text-[14px] text-ink dark:text-[#F1E8E0]";

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
      <div className="min-h-screen bg-cream dark:bg-[#211B16]">
        <div className="max-w-[1000px] mx-auto px-5 md:px-10 py-8 md:py-12 space-y-6">
          <Skeleton className="h-44 rounded-none" />
          <Skeleton className="h-48 rounded-none" />
          <Skeleton className="h-32 rounded-none" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#211B16] flex items-center justify-center px-5">
        <div className={`${PANEL} max-w-md w-full text-center p-8`}>
          <h1 className="font-serif text-[26px] text-ink dark:text-[#F1E8E0]">Profile unavailable</h1>
          <p className="mt-2 text-[14px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            We couldn't load your profile. Please sign in again to continue.
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
            className="mt-6 w-full min-h-[48px] rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#211B16] pb-[82px] md:pb-0">
      <div className="max-w-[1000px] mx-auto px-5 md:px-10 py-8 md:py-12">
        {/* Header */}
        <div className={`${PANEL} overflow-hidden mb-6`}>
          <div className="relative h-24 md:h-28 group bg-ink dark:bg-[#3B322B]">
            {userProfile?.cover_image_url && (
              <img src={userProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-cream text-[10px] font-medium tracking-[0.16em] uppercase bg-[rgba(42,35,29,0.72)] px-4 py-2">
                {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                {uploadingCover ? "Uploading" : "Change cover"}
              </span>
            </label>
          </div>
          <div className="px-5 md:px-6 pb-5 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-cream dark:border-[#2A231D]">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-[rgba(169,126,46,0.12)] text-gold-text dark:text-gold-dark font-serif text-3xl">
                  {user?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="font-serif text-[26px] md:text-[32px] text-ink dark:text-[#F1E8E0] truncate">{user?.full_name}</h1>
                <p className="text-[13.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] truncate">{user?.email}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => navigate(createPageUrl("UserProfile") + `?userId=${user?.id}`)}
                  className="min-h-[44px] px-4 rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] text-[10.5px] font-medium tracking-[0.1em] uppercase hover:bg-[rgba(169,126,46,0.08)] transition-colors"
                >
                  Public profile
                </button>
                <button
                  onClick={() => navigate(createPageUrl("Settings"))}
                  className="min-h-[44px] px-4 rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[10.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors"
                >
                  Edit profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Details */}
          <section className={`${PANEL} p-5 md:p-7`}>
            <h2 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0]">Account details</h2>
            <p className="mt-1 text-[13.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
              Your basic account information
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className={EYEBROW}>Full name</p>
                <div className={FIELD}>{user?.full_name || '—'}</div>
              </div>
              <div className="space-y-2">
                <p className={EYEBROW}>Email</p>
                <div className={`${FIELD} truncate`}>{user?.email || '—'}</div>
              </div>
              <div className="space-y-2">
                <p className={EYEBROW}>Role</p>
                <div className={FIELD}>
                  <Shield className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className={EYEBROW}>Member since</p>
                <div className={FIELD}>
                  <Calendar className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                  <span>{new Date(user?.created_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Biometric */}
          <section className={`${PANEL} p-5 md:p-7`}>
            <h2 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0] flex items-center gap-2.5">
              <Smartphone className="h-5 w-5 text-gold-text dark:text-gold-dark" />
              Biometric authentication
            </h2>
            <p className="mt-1 text-[13.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
              Enable Face ID or Touch ID for quick and secure login
            </p>
            {biometricCreds.length > 0 ? (
              <div className="mt-5">
                <div className="flex items-center gap-3 p-4 border border-[#A97E2E] bg-[rgba(169,126,46,0.08)] rounded-none">
                  <Smartphone className="h-5 w-5 text-gold-text dark:text-gold-dark shrink-0" />
                  <div>
                    <p className="text-[14px] text-ink dark:text-[#F1E8E0]">Face ID enabled</p>
                    <p className="text-[13px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
                      {biometricCreds[0].device_name}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
                  You can now use Face ID to quickly log in to your account
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-[13.5px] font-light leading-[1.7] text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
                  Secure your account with biometric authentication. Once enabled, you can use Face ID or Touch ID to log in instantly.
                </p>
                <div className="[&_button]:rounded-none [&_button]:min-h-[48px] [&_button]:w-full [&_button]:border-[rgba(59,50,43,0.28)] [&_button]:text-[11.5px] [&_button]:font-medium [&_button]:tracking-[0.1em] [&_button]:uppercase">
                  <BiometricLogin />
                </div>
              </div>
            )}
          </section>

          {/* Trusted Devices */}
          <section className={`${PANEL} p-5 md:p-7`}>
            <h2 className="font-serif text-[22px] text-ink dark:text-[#F1E8E0]">Trusted devices</h2>
            <p className="mt-1 text-[13.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
              Devices you've used to access your account
            </p>
            {devices.length === 0 ? (
              <p className="mt-5 text-[13.5px] font-light text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
                No devices registered yet
              </p>
            ) : (
              <div className="mt-5 divide-y divide-[rgba(59,50,43,0.14)] dark:divide-[rgba(241,232,224,0.16)] border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Smartphone className="h-5 w-5 text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[14px] text-ink dark:text-[#F1E8E0] truncate">{device.device_name}</p>
                        <p className="text-[12.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
                          Last used {new Date(device.last_login).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-light text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)] shrink-0">
                      {device.ip_address}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}