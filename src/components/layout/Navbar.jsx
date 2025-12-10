import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { 
  Menu, X, Home, Compass, MessageCircle, CalendarDays, 
  Bell, User, LogOut, Settings, PlusCircle, ShieldCheck, FileText, CheckSquare, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    title: "Conference",
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
    title: "Funeral",
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
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate(createPageUrl("Home"));
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform">
              Ob
            </div>
            <span className="font-serif font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
              Omnievents
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to={createPageUrl("Home")} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors">
              Home
            </Link>
            
            <div className="flex items-center gap-6">
              {EVENT_MENUS.map((menu) => (
                <div key={menu.title} className="relative group">
                  <button className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors py-2 flex items-center gap-1">
                    {menu.title}
                  </button>
                  <div className="absolute top-full left-0 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="py-1">
                      {menu.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`${createPageUrl("VendorMarketplace")}?event=${menu.title.toLowerCase()}&category=${cat.id}`}
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

            <Link to={createPageUrl("Blog")} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors">
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
                  <Link to={createPageUrl("Notifications")}>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                      <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Messages")}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MessageCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
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
                      <Link to={`${createPageUrl("UserProfile")}?userId=${user.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
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
                            <Link to={createPageUrl("AdminBlog")}>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Blog CMS</span>
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
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
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
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-slate-900 dark:text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <Link to={createPageUrl("Home")} className="text-lg font-medium">Home</Link>
                  <Link to={createPageUrl("VendorMarketplace")} className="text-lg font-medium">Marketplace</Link>
                  <Link to={createPageUrl("Blog")} className="text-lg font-medium">Blog</Link>
                  <Link to={createPageUrl("Classifieds")} className="text-lg font-medium">Classifieds</Link>
                  
                  {user ? (
                    <>
                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                      <Link to={`${createPageUrl("UserProfile")}?userId=${user.id}`} className="text-lg font-medium">My Profile</Link>
                      <Link to={createPageUrl("ManageListing")} className="text-lg font-medium">Manage Listing</Link>
                      {user.role === 'admin' && (
                          <Link to={createPageUrl("AdminVendors")} className="text-lg font-medium text-indigo-600">Admin: Approvals</Link>
                      )}
                      <button onClick={handleLogout} className="text-lg font-medium text-left text-red-600">Log out</button>
                    </>
                  ) : (
                    <>
                       <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                       <Link to={createPageUrl("Join")} className="text-lg font-medium text-indigo-600">Sign Up / Login</Link>
                       <Link to={createPageUrl("VendorSignup")} className="text-lg font-medium">List Your Business</Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}