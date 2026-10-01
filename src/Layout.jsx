import React, { Suspense, lazy } from "react";
import Navbar from "./components/layout/Navbar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import DeviceCheck from "./components/auth/DeviceCheck";
import { Toaster } from "@/components/ui/sonner";

const Footer = lazy(() => import("./components/layout/Footer"));
const CookieConsent = lazy(() => import("./components/layout/CookieConsent"));
const SupportChatBot = lazy(() => import("./components/support/SupportChatBot"));

function useDarkModeClass() {
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
}

export default function Layout({ children }) {
  useDarkModeClass();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      <DeviceCheck />
      <Navbar />
      <main className="pb-20 md:pb-0 flex-1">{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <MobileBottomNav />
      <Suspense fallback={null}>
        <CookieConsent />
        <SupportChatBot />
      </Suspense>
      <Toaster />
    </div>
  );
}