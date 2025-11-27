import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Home, Heart, Search, Bell, Store } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "VendorMarketplace" },
  { name: "My Picks", icon: Heart, page: "MyPicks" },
  { name: "Search", icon: Search, page: "VendorMarketplace" },
  { name: "Notifications", icon: Bell, page: "Notifications" },
  { name: "My Listing", icon: Store, page: "VendorSignup" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          const pageUrl = createPageUrl(item.page);
          const isActive = currentPath.includes(item.page) || 
            (item.page === "VendorMarketplace" && currentPath === "/");
          
          return (
            <Link
              key={item.name}
              to={pageUrl}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive 
                  ? "text-indigo-600" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}