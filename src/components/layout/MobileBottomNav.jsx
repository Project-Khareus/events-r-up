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

  const getIsActive = (item) => {
    const pagePath = "/" + item.page;
    if (item.page === "VendorMarketplace") {
      return currentPath === pagePath || currentPath === "/";
    }
    return currentPath === pagePath;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-linen/95 dark:bg-[#2A231D]/95 backdrop-blur-sm border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item);

          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-2 no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8A6522]"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div
                  className={`h-8 w-10 flex items-center justify-center rounded-full transition-colors duration-200 ${
                    isActive ? "bg-[#8A6522]" : "bg-transparent"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive
                        ? "text-cream"
                        : "text-[rgba(59,50,43,0.55)] dark:text-[rgba(241,232,224,0.6)]"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9.5px] ${
                    isActive
                      ? "text-[#8A6522] dark:text-gold-dark"
                      : "text-[rgba(59,50,43,0.55)] dark:text-[rgba(241,232,224,0.6)]"
                  }`}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}