import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { 
  Menu, X, Home, Compass, MessageCircle, CalendarDays, 
  Bell, User, LogOut, Settings, PlusCircle, ShieldCheck, FileText, CheckSquare, Store, Heart
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationItem from "../notifications/NotificationItem";

const EVENT_MENUS = [
  {
    title: "Weddings",
    categories: [
      { name: "Bridal Fashion & Accessories", id: "bridal_fashion" },
      { name: "Make-Up Artistes", id: "makeup_artistes" },
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
      { name: "Event Grounds", id: "event_grounds" },
      { name: "Make-Up Artistes", id: "makeup_artistes" },
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
      { name: "Caskets", id: "caskets" },
      { name: "Catering & Drinks", id: "catering_drinks" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Fashion / Wreaths", id: "fashion_wreaths" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Others", id: "others" },
    ]
  }
];

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
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

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate(createPageUrl("Home"));
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to={createPageUrl("VendorMarketplace")} className="flex items-center group">
            <span className="font-sans font-semibold text-2xl text-white tracking-[0.15em] uppercase group-hover:scale-105 transition-transform">
              Khareus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to={createPageUrl("VendorMarketplace")} className="text-sm font-semibold text-slate-200 hover:text-white transition-colors">
              Home
            </Link>
            
            <div className="flex items-center gap-6">
              {EVENT_MENUS.map((menu) => (
                <div key={menu.title} className="relative group">
                  <Link 
                    to={createPageUrl(menu.title)}
                    className="text-sm font-semibold text-slate-200 hover:text-white transition-colors py-2 flex items-center gap-1"
                  >
                    {menu.title}
                  </Link>
                  <div className="absolute top-full left-0 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="py-1">
                      {menu.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`${createPageUrl(menu.title)}?category=${cat.id}`}
                          className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to={createPageUrl("Classifieds")} className="text-sm font-semibold text-slate-200 hover:text-white transition-colors">
              Public Events
            </Link>
            <Link to={createPageUrl("Blog")} className="text-sm font-semibold text-slate-200 hover:text-white transition-colors">
              Blog
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full relative">
                        <Bell className="h-5 w-5 text-slate-200" />
                        {unreadCount > 0 && (
                          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h4 className="font-semibold">Notifications</h4>
                        <Link to={createPageUrl("Notifications")} className="text-xs text-indigo-600 hover:underline">
                          View all
                        </Link>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {notifications.map(notification => (
                              <div key={notification.id} className="p-2 hover:bg-slate-50">
                                <NotificationItem notification={notification} compact={true} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link to={createPageUrl("Messages")}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MessageCircle className="h-5 w-5 text-slate-200" />
                    </Button>
                  </Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={user.avatar_url} alt={user.full_name} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                          {user.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
                <Link to={createPageUrl("Join")}>
                  <Button variant="ghost" className="text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white font-semibold">
                    Log in
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-full px-6">
                      For Vendors
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 border-0">
                <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center">
                    <span className="font-sans font-semibold text-xl text-stone-800 dark:text-stone-100 tracking-[0.15em] uppercase">
                      Khareus
                    </span>
                  </div>
                </div>

                  {/* Nav Links */}
                  <div className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="space-y-1">
                      <Link 
                        to={createPageUrl("VendorMarketplace")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Home</span>
                      </Link>
                      
                      <Link 
                        to={createPageUrl("Weddings")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <div className="h-5 w-5 flex items-center justify-center group-hover:scale-110 transition-transform">💍</div>
                        <span className="font-medium">Weddings</span>
                      </Link>
                      
                      <Link 
                        to={createPageUrl("Parties")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <div className="h-5 w-5 flex items-center justify-center group-hover:scale-110 transition-transform">🎉</div>
                        <span className="font-medium">Parties</span>
                      </Link>
                      
                      <Link 
                        to={createPageUrl("Conference")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <div className="h-5 w-5 flex items-center justify-center group-hover:scale-110 transition-transform">🎤</div>
                        <span className="font-medium">Conferences</span>
                      </Link>
                      
                      <Link 
                        to={createPageUrl("Funeral")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <div className="h-5 w-5 flex items-center justify-center group-hover:scale-110 transition-transform">🕊️</div>
                        <span className="font-medium">Funerals</span>
                      </Link>
                      
                      <Link 
                        to={createPageUrl("Blog")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Blog</span>
                      </Link>
                      
                      <Link 
                        to={createPageUrl("Classifieds")} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                      >
                        <CalendarDays className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Public Events</span>
                      </Link>
                    </div>

                    {user && (
                      <>
                        <div className="my-6 px-4">
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
                        </div>
                        
                        <div className="space-y-1">
                          <Link 
                            to={createPageUrl("MyProfile")} 
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                          >
                            <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">My Profile</span>
                          </Link>
                          
                          <Link 
                            to={createPageUrl("Settings")} 
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                          >
                            <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Settings</span>
                          </Link>
                          
                          <Link 
                            to={createPageUrl("ManageListing")} 
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                          >
                            <Store className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Manage Listing</span>
                          </Link>
                          
                          {user.role === 'admin' && (
                            <Link 
                              to={createPageUrl("AdminVendors")} 
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all group"
                            >
                              <ShieldCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              <span className="font-medium">Admin Panel</span>
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    {user ? (
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all font-medium"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Log out</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <Link to={createPageUrl("Join")} className="block">
                          <button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-all font-medium shadow-lg shadow-indigo-200 dark:shadow-none">
                            Sign Up / Login
                          </button>
                        </Link>
                        <Link to={createPageUrl("VendorSignup")} className="block">
                          <button className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium">
                            List Your Business
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