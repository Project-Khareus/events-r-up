import React from "react";
import Navbar from "./components/layout/Navbar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Footer from "./components/layout/Footer";
import CookieConsent from "./components/layout/CookieConsent";
import DeviceCheck from "./components/auth/DeviceCheck";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    .font-serif {
                      font-family: 'Playfair Display', Georgia, serif;
                    }

                    /* Dark mode styles */
                    .dark {
                      color-scheme: dark;
                    }
                    .dark body,
                    .dark .bg-slate-50,
                    .dark .bg-white {
                      background-color: #0f172a !important;
                      color: #e2e8f0 !important;
                    }
                    .dark .bg-gradient-to-br {
                      background: linear-gradient(to bottom right, #0f172a, #1e293b) !important;
                    }
                    .dark .text-slate-900 {
                      color: #f1f5f9 !important;
                    }
                    .dark .text-slate-600,
                    .dark .text-slate-500 {
                      color: #94a3b8 !important;
                    }
                    .dark .border-slate-200 {
                      border-color: #334155 !important;
                    }
                    .dark .bg-white {
                      background-color: #1e293b !important;
                    }
                    .dark nav.bg-white {
                      background-color: #0f172a !important;
                    }
                    .dark .shadow-xl {
                      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3) !important;
                    }
                    /* Leaflet CSS fix */
                    .leaflet-container {
                      z-index: 0;
                    }
                    
                    /* Mobile app enhancements */
                    body {
                      overscroll-behavior-y: none;
                      -webkit-tap-highlight-color: transparent;
                    }
                    
                    button, a, [role="button"] {
                      user-select: none;
                      -webkit-user-select: none;
                      -webkit-touch-callout: none;
                    }
                    
                    /* Dark mode support */
                    @media (prefers-color-scheme: dark) {
                      :root:not(.light-mode) {
                        color-scheme: dark;
                      }
                      :root:not(.light-mode) body,
                      :root:not(.light-mode) .bg-slate-50,
                      :root:not(.light-mode) .bg-white {
                        background-color: #0f172a !important;
                        color: #e2e8f0 !important;
                      }
                      :root:not(.light-mode) .bg-gradient-to-br {
                        background: linear-gradient(to bottom right, #0f172a, #1e293b) !important;
                      }
                      :root:not(.light-mode) .text-slate-900 {
                        color: #f1f5f9 !important;
                      }
                      :root:not(.light-mode) .text-slate-600,
                      :root:not(.light-mode) .text-slate-500 {
                        color: #94a3b8 !important;
                      }
                      :root:not(.light-mode) .border-slate-200 {
                        border-color: #334155 !important;
                      }
                      :root:not(.light-mode) .bg-white {
                        background-color: #1e293b !important;
                      }
                      :root:not(.light-mode) nav.bg-white {
                        background-color: #0f172a !important;
                      }
                      :root:not(.light-mode) .shadow-xl {
                        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3) !important;
                      }
                    }
                    `}</style>
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      <DeviceCheck />
      <Navbar />
      <main className="pb-20 md:pb-0 flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <CookieConsent />
      <Toaster />
    </div>
  );
}