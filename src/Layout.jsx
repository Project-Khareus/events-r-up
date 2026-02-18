import React from "react";
import Navbar from "./components/layout/Navbar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Footer from "./components/layout/Footer";
import CookieConsent from "./components/layout/CookieConsent";
import DeviceCheck from "./components/auth/DeviceCheck";
import SupportChatBot from "./components/support/SupportChatBot";
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
                      color: #f1f5f9 !important;
                    }
                    .dark .bg-gradient-to-br {
                      background: linear-gradient(to bottom right, #0f172a, #1e293b) !important;
                    }
                    /* High contrast text */
                    .dark .text-slate-950,
                    .dark .text-slate-900,
                    .dark [class*="text-slate-950"],
                    .dark [class*="text-gray-900"] {
                      color: #f8fafc !important;
                    }
                    .dark .text-slate-800,
                    .dark .text-slate-700 {
                      color: #e2e8f0 !important;
                    }
                    .dark .text-slate-600 {
                      color: #cbd5e1 !important;
                    }
                    .dark .text-slate-500 {
                      color: #94a3b8 !important;
                    }
                    .dark .text-slate-400 {
                      color: #64748b !important;
                    }
                    /* Backgrounds */
                    .dark .bg-white {
                      background-color: #1e293b !important;
                    }
                    .dark .bg-slate-50 {
                      background-color: #0f172a !important;
                    }
                    .dark .bg-slate-100 {
                      background-color: #1e293b !important;
                    }
                    .dark .bg-slate-200 {
                      background-color: #334155 !important;
                    }
                    /* Cards */
                    .dark .rounded-2xl,
                    .dark .rounded-xl,
                    .dark .rounded-lg {
                      background-color: #1e293b;
                    }
                    /* Borders */
                    .dark .border-slate-100 {
                      border-color: #1e293b !important;
                    }
                    .dark .border-slate-200 {
                      border-color: #334155 !important;
                    }
                    .dark .border-slate-300 {
                      border-color: #475569 !important;
                    }
                    /* Dividers */
                    .dark .divide-slate-100 > * + * {
                      border-color: #1e293b !important;
                    }
                    .dark .divide-slate-200 > * + * {
                      border-color: #334155 !important;
                    }
                    /* Inputs */
                    .dark input,
                    .dark textarea,
                    .dark select {
                      background-color: #0f172a !important;
                      color: #f1f5f9 !important;
                      border-color: #334155 !important;
                    }
                    .dark input::placeholder,
                    .dark textarea::placeholder {
                      color: #475569 !important;
                    }
                    /* Nav */
                    .dark nav.bg-white {
                      background-color: #0f172a !important;
                    }
                    /* Shadows */
                    .dark .shadow-xl {
                      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.4) !important;
                    }
                    .dark .shadow-lg {
                      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4) !important;
                    }
                    /* Badges / pills */
                    .dark .bg-slate-100.text-slate-700 {
                      background-color: #334155 !important;
                      color: #e2e8f0 !important;
                    }
                    /* Hover states */
                    .dark .hover\:bg-slate-50:hover {
                      background-color: #1e293b !important;
                    }
                    .dark .hover\:bg-slate-100:hover {
                      background-color: #334155 !important;
                    }
                    /* Muted text (prose) */
                    .dark p, .dark span, .dark li {
                      color: inherit;
                    }
                    /* Table rows */
                    .dark tr:hover {
                      background-color: #1e293b !important;
                    }
                    /* Subscription plan cards - fix dark bg blending */
                    .dark .bg-green-50,
                    .dark button.bg-green-50 {
                      background-color: #052e16 !important;
                      color: #f0fdf4 !important;
                    }
                    .dark .bg-indigo-50,
                    .dark button.bg-indigo-50 {
                      background-color: #1e1b4b !important;
                      color: #eef2ff !important;
                    }
                    .dark .bg-amber-50\/40,
                    .dark .bg-amber-50 {
                      background-color: #1c1208 !important;
                    }
                    /* Force all text inside plan buttons to be visible */
                    .dark button h3,
                    .dark button p,
                    .dark button div {
                      color: inherit;
                    }
                    .dark .border-amber-200 {
                      border-color: #78350f !important;
                    }
                    .dark .border-amber-300 {
                      border-color: #92400e !important;
                    }
                    .dark .text-amber-600 {
                      color: #f59e0b !important;
                    }
                    .dark .text-amber-500 {
                      color: #f59e0b !important;
                    }
                    /* Fix "or import from" divider in dark mode */
                    .dark .bg-white.px-2 {
                      background-color: #1e293b !important;
                    }
                    /* Labels */
                    .dark label {
                      color: #cbd5e1 !important;
                    }
                    /* Combobox / popover */
                    .dark [role="listbox"],
                    .dark [cmdk-root] {
                      background-color: #1e293b !important;
                      border-color: #334155 !important;
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
                    
                    /* Dark mode support - system preference */
                    @media (prefers-color-scheme: dark) {
                      :root:not(.light-mode) {
                        color-scheme: dark;
                      }
                      :root:not(.light-mode) body,
                      :root:not(.light-mode) .bg-slate-50,
                      :root:not(.light-mode) .bg-white {
                        background-color: #0f172a !important;
                        color: #f1f5f9 !important;
                      }
                      :root:not(.light-mode) .bg-gradient-to-br {
                        background: linear-gradient(to bottom right, #0f172a, #1e293b) !important;
                      }
                      :root:not(.light-mode) .text-slate-950,
                      :root:not(.light-mode) .text-slate-900 {
                        color: #f8fafc !important;
                      }
                      :root:not(.light-mode) .text-slate-800,
                      :root:not(.light-mode) .text-slate-700 {
                        color: #e2e8f0 !important;
                      }
                      :root:not(.light-mode) .text-slate-600 {
                        color: #cbd5e1 !important;
                      }
                      :root:not(.light-mode) .text-slate-500 {
                        color: #94a3b8 !important;
                      }
                      :root:not(.light-mode) .border-slate-100 {
                        border-color: #1e293b !important;
                      }
                      :root:not(.light-mode) .border-slate-200 {
                        border-color: #334155 !important;
                      }
                      :root:not(.light-mode) .border-slate-300 {
                        border-color: #475569 !important;
                      }
                      :root:not(.light-mode) .bg-slate-100 {
                        background-color: #1e293b !important;
                      }
                      :root:not(.light-mode) .bg-slate-200 {
                        background-color: #334155 !important;
                      }
                      :root:not(.light-mode) .bg-white {
                        background-color: #1e293b !important;
                      }
                      :root:not(.light-mode) nav.bg-white {
                        background-color: #0f172a !important;
                      }
                      :root:not(.light-mode) .shadow-xl {
                        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.4) !important;
                      }
                      :root:not(.light-mode) .shadow-lg {
                        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4) !important;
                      }
                      :root:not(.light-mode) input,
                      :root:not(.light-mode) textarea,
                      :root:not(.light-mode) select {
                        background-color: #0f172a !important;
                        color: #f1f5f9 !important;
                        border-color: #334155 !important;
                      }
                      :root:not(.light-mode) input::placeholder,
                      :root:not(.light-mode) textarea::placeholder {
                        color: #475569 !important;
                      }
                      :root:not(.light-mode) .hover\:bg-slate-50:hover {
                        background-color: #1e293b !important;
                      }
                      :root:not(.light-mode) .hover\:bg-slate-100:hover {
                        background-color: #334155 !important;
                      }
                      :root:not(.light-mode) .divide-slate-100 > * + * {
                        border-color: #1e293b !important;
                      }
                      :root:not(.light-mode) .divide-slate-200 > * + * {
                        border-color: #334155 !important;
                      }
                      :root:not(.light-mode) .bg-green-50 {
                        background-color: #052e16 !important;
                      }
                      :root:not(.light-mode) .bg-indigo-50 {
                        background-color: #1e1b4b !important;
                      }
                      :root:not(.light-mode) .bg-amber-50\/40,
                      :root:not(.light-mode) .bg-amber-50 {
                        background-color: #1c1208 !important;
                      }
                      :root:not(.light-mode) .border-amber-200 {
                        border-color: #78350f !important;
                      }
                      :root:not(.light-mode) .border-amber-300 {
                        border-color: #92400e !important;
                      }
                      :root:not(.light-mode) .text-amber-600,
                      :root:not(.light-mode) .text-amber-500 {
                        color: #f59e0b !important;
                      }
                      :root:not(.light-mode) label {
                        color: #cbd5e1 !important;
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
      <SupportChatBot />
      <Toaster />
    </div>
  );
}