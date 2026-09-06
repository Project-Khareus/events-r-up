import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Menu, Home, MessageCircle, CalendarDays,
  Bell, User, LogOut, Settings, ShieldCheck, FileText, CheckSquare, Store, Heart,
  PartyPopper, Mic, Bird
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationItem from "../notifications/NotificationItem";

const EVENT_MENUS = [
  {
    title: "Weddings",
    categories: [
      { name: "Event Planner", id: "event_planner" },
      { name: "Fashion & Accessories", id: "bridal_fashion" },
      { name: "Beauty & Personal Care", id: "beauty_personal_care" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Event Grounds", id: "event_grounds" },
      { name: "Photography & Videography", id: "photography_videography" },
      { name: "Design & Creatives", id: "design_creatives" },
      { name: "Catering", id: "catering" },
      { name: "Jewellery", id: "jewellery" },
      { name: "Honeymoon / Destination Packages", id: "honeymoon_packages" },
      { name: "Music / Karaoke / MCs", id: "music_karaoke_mc" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Social Media Support", id: "social_media_support" },
      { name: "Ushers", id: "ushers" },
      { name: "Couple's First Dance Tutorials", id: "dance_tutorials" },
      { name: "Rent-a-Team", id: "rent_a_team" },
    ]
  },
  {
    title: "Parties",
    categories: [
      { name: "Event Planner", id: "event_planner" },
      { name: "Event Venues", id: "event_grounds" },
      { name: "Beauty & Personal Care", id: "beauty_personal_care" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Photography & Videography", id: "photography_videography" },
      { name: "Design & Creatives", id: "design_creatives" },
      { name: "Catering", id: "catering" },
      { name: "Jewellery", id: "jewellery" },
      { name: "Music / Karaoke", id: "music_karaoke_mc" },
      { name: "Car Rentals", id: "car_rentals" },
    ]
  },
  {
    title: "Conferences",
    categories: [
      { name: "Event Planner", id: "event_planner" },
      { name: "Conference Facilities", id: "conference_facilities" },
      { name: "Catering", id: "catering" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Rapporteur Services", id: "rapporteur_services" },
      { name: "Music / MC", id: "music_karaoke_mc" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
    ]
  },
  {
    title: "Funerals",
    categories: [
      { name: "Event Planner", id: "event_planner" },
      { name: "Caskets", id: "caskets" },
      { name: "Catering & Drinks", id: "catering_drinks" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Fashion / Wreaths", id: "fashion_wreaths" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Others", id: "others" },
    ]
  }
];

const MOBILE_EVENT_LINKS = [
  { label: "Weddings", page: "Weddings", icon: Heart },
  { label: "Parties", page: "Parties", icon: PartyPopper },
  { label: "Conferences", page: "Conference", icon: Mic },
  { label: "Funerals", page: "Funeral", icon: Bird },
];

const mobileLinkClass = "flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-none text-ink dark:text-[#F1E8E0] hover:bg-[rgba(169,126,46,0.1)] transition-colors";

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    staleTime: 300000,
    cacheTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      return profiles?.[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 300000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const avatarUrl = userProfile?.avatar_url || user?.avatar_url;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Notification.list('-created_date', 10);
    },
    enabled: !!user?.id,
    staleTime: 60000,
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const queryClient = useQueryClient();

  const handleNotificationRead = useCallback(async (notification) => {
    if (notification.is_read) return;
    await base44.entities.Notification.update(notification.id, { is_read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
  }, [queryClient]);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate(createPageUrl("Home"));
  };

  return (
    <nav className="bg-cream dark:bg-[#211B16] sticky top-0 z-50 border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10">
        <div className="flex justify-between items-center h-[72px]">

          {/* Wordmark */}
          <Link to={createPageUrl("VendorMarketplace")} className="flex items-center">
            <span className="font-serif font-medium text-[20px] text-ink dark:text-[#F1E8E0] tracking-[0.36em] uppercase">
              Khareus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
            <div className="flex items-center gap-6">
              {EVENT_MENUS.map((menu) => (
                <div key={menu.title} className="relative group">
                  <Link
                    to={createPageUrl(menu.title)}
                    className="text-[13.5px] text-ink dark:text-[#F1E8E0] hover:text-gold-text dark:hover:text-gold-dark transition-colors py-2 flex items-center gap-1"
                  >
                    {menu.title}
                  </Link>
                  <div className="absolute top-full left-0 w-64 bg-linen dark:bg-[#2A231D] rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50">
                    <div className="py-1">
                      {menu.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`${createPageUrl(menu.title)}?category=${cat.id}`}
                          className="block px-4 py-2 text-[13px] font-light rounded-none text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] hover:text-ink dark:hover:text-[#F1E8E0] hover:bg-cream dark:hover:bg-[#211B16] transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to={createPageUrl("Classifieds")} className="text-[13px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] hover:text-ink dark:hover:text-[#F1E8E0] transition-colors">
              Public Events
            </Link>
            <Link to={createPageUrl("Blog")} className="text-[13px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] hover:text-ink dark:hover:text-[#F1E8E0] transition-colors">
              Blog
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-24 bg-linen dark:bg-[#2A231D] animate-pulse" />
            ) : user ? (
              <>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
                        <Bell className="h-5 w-5 text-ink dark:text-[#F1E8E0]" />
                        {unreadCount > 0 && (
                          <span className="absolute top-2 right-2 h-2 w-2 bg-[#A97E2E] rounded-full" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-96 p-0 rounded-none border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D]">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-[17px] text-ink dark:text-[#F1E8E0]">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[11px] text-cream bg-[#8A6522] px-1.5 py-0.5">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <Link to={createPageUrl("Notifications")} className="text-[12px] text-gold-text dark:text-gold-dark hover:underline">
                          View all
                        </Link>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto py-1">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell className="h-8 w-8 text-[rgba(59,50,43,0.25)] mx-auto mb-2" />
                            <p className="text-[13px] text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="px-1">
                            {notifications.map(notification => (
                              <NotificationItem key={notification.id} notification={notification} compact={true} onRead={handleNotificationRead} />
                            ))}
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link to={createPageUrl("Messages")} aria-label="Messages">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MessageCircle className="h-5 w-5 text-ink dark:text-[#F1E8E0]" />
                    </Button>
                  </Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Account menu">
                      <Avatar className="h-10 w-10 border border-[rgba(59,50,43,0.14)]">
                        <AvatarImage src={avatarUrl} alt={user.full_name} />
                        <AvatarFallback className="bg-linen text-gold-text font-medium">
                          {user.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-none bg-linen dark:bg-[#2A231D] border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-[13px] text-ink dark:text-[#F1E8E0] leading-none">{user.full_name || 'User'}</p>
                        <p className="text-[11.5px] leading-none text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("MyProfile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`${createPageUrl("UserProfile")}?userId=${user.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Public Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("ManageListing")}>
                        <Store className="mr-2 h-4 w-4" />
                        <span>Manage Vendor Listing</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Bookings")}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        <span>My Bookings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("MyFavorites")}>
                        <Heart className="mr-2 h-4 w-4" />
                        <span>My Favorites</span>
                      </Link>
                    </DropdownMenuItem>

                    {user.role === 'admin' && (
                       <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Admin</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminVendors")}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              <span>Vendor Approvals</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminEvents")}>
                              <CalendarDays className="mr-2 h-4 w-4" />
                              <span>Event Approvals</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminBlog")}>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Blog CMS</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminLegal")}>
                              <CheckSquare className="mr-2 h-4 w-4" />
                              <span>Legal Pages</span>
                            </Link>
                          </DropdownMenuItem>
                       </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to={createPageUrl("Join")} className="text-[13px] text-ink dark:text-[#F1E8E0] hover:text-gold-text dark:hover:text-gold-dark transition-colors px-2">
                  Log in
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-[#8A6522] hover:bg-[#75551C] text-cream text-[11.5px] font-medium tracking-[0.1em] uppercase px-[18px] py-[10px] rounded-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]">
                      List your business
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-none bg-linen dark:bg-[#2A231D] border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to={createPageUrl("ManageListing")}>Manage Listing</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open menu">
                  <Menu className="h-5 w-5 text-ink dark:text-[#F1E8E0]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 border-0 bg-cream dark:bg-[#211B16]">
                <div className="flex flex-col h-full bg-cream dark:bg-[#211B16]">
                  {/* Header */}
                  <div className="p-6 border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
                    <span className="font-serif font-medium text-[18px] text-ink dark:text-[#F1E8E0] tracking-[0.3em] uppercase">
                      Khareus
                    </span>
                  </div>

                  {/* Nav Links */}
                  <div className="flex-1 overflow-y-auto py-5 px-3">
                    <div className="space-y-1">
                      <Link to={createPageUrl("VendorMarketplace")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                        <Home className="h-5 w-5" />
                        <span className="text-[14.5px]">Home</span>
                      </Link>

                      {MOBILE_EVENT_LINKS.map((item) => (
                        <Link key={item.page} to={createPageUrl(item.page)} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                          <item.icon className="h-5 w-5" />
                          <span className="text-[14.5px]">{item.label}</span>
                        </Link>
                      ))}

                      <Link to={createPageUrl("Blog")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                        <FileText className="h-5 w-5" />
                        <span className="text-[14.5px]">Blog</span>
                      </Link>

                      <Link to={createPageUrl("Classifieds")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                        <CalendarDays className="h-5 w-5" />
                        <span className="text-[14.5px]">Public Events</span>
                      </Link>
                    </div>

                    {user && (
                      <>
                        <div className="my-5 h-px bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)]" />

                        <div className="space-y-1">
                          <Link to={createPageUrl("MyProfile")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                            <User className="h-5 w-5" />
                            <span className="text-[14.5px]">My Profile</span>
                          </Link>

                          <Link to={createPageUrl("Settings")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                            <Settings className="h-5 w-5" />
                            <span className="text-[14.5px]">Settings</span>
                          </Link>

                          <Link to={createPageUrl("ManageListing")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                            <Store className="h-5 w-5" />
                            <span className="text-[14.5px]">Manage Listing</span>
                          </Link>

                          <Link to={createPageUrl("Bookings")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                            <CalendarDays className="h-5 w-5" />
                            <span className="text-[14.5px]">My Bookings</span>
                          </Link>

                          <Link to={createPageUrl("MyFavorites")} onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>
                            <Heart className="h-5 w-5" />
                            <span className="text-[14.5px]">My Favorites</span>
                          </Link>

                          {user.role === 'admin' && (
                            <Link to={createPageUrl("AdminVendors")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 min-h-[44px] text-gold-text dark:text-gold-dark hover:bg-[rgba(169,126,46,0.1)] transition-colors">
                              <ShieldCheck className="h-5 w-5" />
                              <span className="text-[14.5px]">Admin Panel</span>
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
                    {user ? (
                      <button
                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] hover:bg-[rgba(169,126,46,0.1)] transition-colors text-[11.5px] font-medium tracking-[0.1em] uppercase"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <Link to={createPageUrl("Join")} onClick={() => setMobileMenuOpen(false)} className="block">
                          <button className="w-full px-4 py-3 min-h-[44px] rounded-none bg-[#8A6522] hover:bg-[#75551C] text-cream text-[11.5px] font-medium tracking-[0.1em] uppercase transition-colors">
                            Sign up / Log in
                          </button>
                        </Link>
                        <Link to={createPageUrl("VendorSignup")} onClick={() => setMobileMenuOpen(false)} className="block">
                          <button className="w-full px-4 py-3 min-h-[44px] rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] hover:bg-[rgba(169,126,46,0.1)] transition-colors text-[11.5px] font-medium tracking-[0.1em] uppercase">
                            List your business
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}