import React, { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Home, Heart, Search, Bell, User } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", key: "home", icon: Home, page: "VendorMarketplace" },
  { name: "My Picks", key: "picks", icon: Heart, page: "MyPicks" },
  { name: "Search", key: "search", icon: Search, page: "VendorMarketplace" },
  { name: "Notifications", key: "notifications", icon: Bell, page: "Notifications" },
  { name: "Profile", key: "profile", icon: User, page: "MyProfile" },
];

// Save the last visited URL for each tab key
const saveTabUrl = (key, url) => {
  try { sessionStorage.setItem(`tab_url_${key}`, url); } catch {}
};
const getTabUrl = (key, fallback) => {
  try { return sessionStorage.getItem(`tab_url_${key}`) || fallback; } catch { return fallback; }
};

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname + location.search;

  // Persist current path to whichever tab is active
  React.useEffect(() => {
    const active = NAV_ITEMS.find(item =>
      currentPath.includes(item.page) || (item.page === "VendorMarketplace" && currentPath === "/")
    );
    if (active) saveTabUrl(active.key, currentPath);
  }, [currentPath]);

  const handleTabPress = useCallback((item) => {
    const defaultUrl = createPageUrl(item.page);
    const savedUrl = getTabUrl(item.key, defaultUrl);
    const isActive = currentPath.includes(item.page) ||
      (item.page === "VendorMarketplace" && currentPath === "/");

    if (isActive) {
      // Already on this tab — scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(savedUrl);
    }
  }, [currentPath, navigate]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath.includes(item.page) || 
            (item.page === "VendorMarketplace" && currentPath === "/");
          
          return (
            <button
              key={item.name}
              onClick={() => handleTabPress(item)}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}