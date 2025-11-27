import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";

const EVENT_MENUS = [
  { 
    name: "Weddings", 
    value: "weddings",
    categories: [
      { label: "Bridal Fashion & Accessories", value: "bridal_fashion" },
      { label: "Make-Up Artistes", value: "makeup_artistes" },
      { label: "Décor & Logistics Setup", value: "decor_logistics" },
      { label: "Event Grounds", value: "event_grounds" },
      { label: "Photography & Videography", value: "photography_videography" },
      { label: "Design & Creatives", value: "design_creatives" },
      { label: "Catering", value: "catering" },
      { label: "Jewellery", value: "jewellery" },
      { label: "Honeymoon / Destination Packages", value: "honeymoon_packages" },
      { label: "Music / Karaoke / MCs", value: "music_karaoke_mc" },
      { label: "Car Rentals", value: "car_rentals" },
      { label: "Social Media Support", value: "social_media_support" },
      { label: "Ushers", value: "ushers" },
      { label: "Couple's First Dance Tutorials", value: "dance_tutorials" },
      { label: "Rent-a-Team", value: "rent_a_team" },
    ]
  },
  { 
    name: "Parties", 
    value: "parties",
    categories: [
      { label: "Event Grounds", value: "event_grounds" },
      { label: "Make-Up Artistes", value: "makeup_artistes" },
      { label: "Décor & Logistics Setup", value: "decor_logistics" },
      { label: "Photography & Videography", value: "photography_videography" },
      { label: "Design & Creatives", value: "design_creatives" },
      { label: "Catering", value: "catering" },
      { label: "Jewellery", value: "jewellery" },
      { label: "Music / Karaoke", value: "music_karaoke_mc" },
      { label: "Car Rentals", value: "car_rentals" },
    ]
  },
  { 
    name: "Conference", 
    value: "conference",
    categories: [
      { label: "Conference Facilities", value: "conference_facilities" },
      { label: "Catering", value: "catering" },
      { label: "Car Rentals", value: "car_rentals" },
      { label: "Rapporteur Services", value: "rapporteur_services" },
      { label: "Music / MC", value: "music_karaoke_mc" },
      { label: "Décor & Logistics Setup", value: "decor_logistics" },
    ]
  },
  { 
    name: "Funeral", 
    value: "funeral",
    categories: [
      { label: "Caskets", value: "caskets" },
      { label: "Catering & Drinks", value: "catering_drinks" },
      { label: "Décor & Logistics Setup", value: "decor_logistics" },
      { label: "Fashion / Wreaths", value: "fashion_wreaths" },
      { label: "Car Rentals", value: "car_rentals" },
      { label: "Others", value: "others" },
    ]
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={createPageUrl("VendorMarketplace")} className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Events R' Up
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {EVENT_MENUS.map((menu) => (
              <DropdownMenu key={menu.value}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 font-medium">
                    {menu.name}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
                  {menu.categories.map((cat) => (
                    <DropdownMenuItem key={cat.value} asChild>
                      <Link 
                        to={createPageUrl(`VendorMarketplace?event=${menu.value}&category=${cat.value}`)}
                        className="cursor-pointer"
                      >
                        {cat.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.full_name || "Account"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Bookings")}>My Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Messages")}>Messages</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("VendorSignup")}>List Your Business</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="font-medium"
                >
                  Sign In
                </Button>
                <Link to={createPageUrl("VendorSignup")}>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 font-medium">
                    List Your Business
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div 
            className="md:hidden fixed inset-0 top-16 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto">
            <div className="py-4 px-4">
              {EVENT_MENUS.map((menu) => (
                <div key={menu.value} className="py-2">
                  <p className="font-semibold text-slate-900 px-2 mb-2">{menu.name}</p>
                  <div className="space-y-1">
                    {menu.categories.map((cat) => (
                      <Link
                        key={cat.value}
                        to={createPageUrl(`VendorMarketplace?event=${menu.value}&category=${cat.value}`)}
                        className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                        onClick={() => setIsOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 mt-4 pt-4 px-2 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link to={createPageUrl("Bookings")} className="block py-2 text-slate-700" onClick={() => setIsOpen(false)}>
                      My Bookings
                    </Link>
                    <Link to={createPageUrl("Messages")} className="block py-2 text-slate-700" onClick={() => setIsOpen(false)}>
                      Messages
                    </Link>
                    <Link to={createPageUrl("VendorSignup")} className="block py-2 text-slate-700" onClick={() => setIsOpen(false)}>
                      List Your Business
                    </Link>
                    <button onClick={handleLogout} className="block py-2 text-red-600">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => base44.auth.redirectToLogin()}
                    >
                      Sign In
                    </Button>
                    <Link to={createPageUrl("VendorSignup")} className="w-full" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                        List Your Business
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}