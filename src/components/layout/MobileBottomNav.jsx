import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Home, Heart, Search, Bell, User } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "VendorMarketplace" },
  { name: "My Picks", icon: Heart, page: "MyPicks" },
  { name: "Search", icon: Search, page: "VendorMarketplace" },
  { name: "Notifications", icon: Bell, page: "Notifications" },
  { name: "Profile", icon: User, page: "MyProfile" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const pageUrl = createPageUrl(item.page);
          const isActive = currentPath.includes(item.page) || 
            (item.page === "VendorMarketplace" && currentPath === "/");
          
          return (
            <Link
              key={item.name}
              to={pageUrl}
              className="relative flex flex-col items-center justify-center flex-1 py-2 group"
            >
              <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isActive 
                  ? "scale-110" 
                  : "scale-100 group-hover:scale-105"
              }`}>
                <div className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? "bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50" 
                    : "bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                }`}>
                  <item.icon className={`h-5 w-5 transition-all duration-300 ${
                    isActive 
                      ? "text-white stroke-[2.5]" 
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  }`} />
                </div>
                <span className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                }`}>
                  {item.name}
                </span>
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-indigo-600 to-transparent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}