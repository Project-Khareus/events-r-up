import React, { Suspense, lazy } from "react";
import Navbar from "./components/layout/Navbar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import DeviceCheck from "./components/auth/DeviceCheck";
import { Toaster } from "@/components/ui/sonner";

const Footer = lazy(() => import("./components/layout/Footer"));
const CookieConsent = lazy(() => import("./components/layout/CookieConsent"));
const SupportChatBot = lazy(() => import("./components/support/SupportChatBot"));

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <style>{`
                    .font-serif {
                      font-family: 'Playfair Display', Georgia, serif;
                    }

                    /* ============================================
                       SEMANTIC COLOR TOKENS
                       ============================================
                       Light theme (default)
                    */
                    :root {
                      --color-bg-primary:       #f8fafc;   /* page background */
                      --color-bg-secondary:     #f1f5f9;   /* subtle tinted bg */
                      --color-surface:          #ffffff;   /* cards, panels */
                      --color-surface-elevated: #ffffff;   /* modals, dropdowns */
                      --color-text-primary:     #0f172a;   /* headings */
                      --color-text-secondary:   #334155;   /* body text */
                      --color-text-muted:       #64748b;   /* meta / timestamps */
                      --color-border:           #e2e8f0;   /* dividers */
                      --color-border-strong:    #cbd5e1;
                      --color-accent:           #4f46e5;   /* indigo-600 */
                      --color-accent-hover:     #4338ca;   /* indigo-700 */
                    }

                    /* Dark theme tokens */
                    .dark {
                      color-scheme: dark;
                      --color-bg-primary:       #0f172a;
                      --color-bg-secondary:     #1e293b;
                      --color-surface:          #1e293b;
                      --color-surface-elevated: #273549;
                      --color-text-primary:     #f1f5f9;
                      --color-text-secondary:   #cbd5e1;
                      --color-text-muted:       #94a3b8;
                      --color-border:           #334155;
                      --color-border-strong:    #475569;
                      --color-accent:           #6366f1;
                      --color-accent-hover:     #818cf8;
                    }

                    /* ============================================
                       GLOBAL DARK MODE OVERRIDES
                       ============================================ */

                    /* -- Page backgrounds -- */
                    .dark body { background-color: var(--color-bg-primary) !important; color: var(--color-text-secondary) !important; }
                    .dark .bg-slate-50 { background-color: var(--color-bg-primary) !important; }
                    .dark .bg-white { background-color: var(--color-surface) !important; }
                    .dark .bg-slate-100 { background-color: var(--color-bg-secondary) !important; }
                    .dark .bg-slate-200 { background-color: #334155 !important; }
                    .dark .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--color-bg-primary), var(--color-bg-secondary)) !important; }
                    .dark .bg-gradient-to-b { background: linear-gradient(to bottom, var(--color-bg-primary), var(--color-bg-secondary)) !important; }

                    /* -- Text -- */
                    .dark .text-slate-950,
                    .dark .text-slate-900 { color: var(--color-text-primary) !important; }
                    .dark .text-slate-800,
                    .dark .text-slate-700 { color: var(--color-text-secondary) !important; }
                    .dark .text-slate-600 { color: #94a3b8 !important; }
                    .dark .text-slate-500 { color: #7c8fa8 !important; }
                    .dark .text-slate-400 { color: #64748b !important; }
                    .dark .text-stone-800 { color: var(--color-text-primary) !important; }
                    .dark .text-gray-900 { color: var(--color-text-primary) !important; }
                    .dark .text-gray-800 { color: var(--color-text-secondary) !important; }
                    .dark .text-gray-700 { color: var(--color-text-secondary) !important; }
                    .dark .text-gray-600 { color: #94a3b8 !important; }
                    .dark .text-gray-500 { color: #7c8fa8 !important; }

                    /* -- Borders -- */
                    .dark .border-slate-100 { border-color: #1e293b !important; }
                    .dark .border-slate-200 { border-color: var(--color-border) !important; }
                    .dark .border-slate-300 { border-color: var(--color-border-strong) !important; }
                    .dark .border-gray-100 { border-color: #1e293b !important; }
                    .dark .border-gray-200 { border-color: var(--color-border) !important; }
                    .dark .border-gray-300 { border-color: var(--color-border-strong) !important; }
                    .dark .divide-slate-100 > * + * { border-color: #1e293b !important; }
                    .dark .divide-slate-200 > * + * { border-color: var(--color-border) !important; }

                    /* -- Cards (any rounded bg-white element) -- */
                    .dark [class*="rounded"].bg-white { background-color: var(--color-surface) !important; }

                    /* -- Inputs -- */
                    .dark input,
                    .dark textarea,
                    .dark select {
                      background-color: #0d1829 !important;
                      color: var(--color-text-primary) !important;
                      border-color: var(--color-border) !important;
                    }
                    .dark input::placeholder,
                    .dark textarea::placeholder { color: #475569 !important; }

                    /* -- Labels -- */
                    .dark label { color: var(--color-text-secondary) !important; }

                    /* -- Hover states (brighter, not darker) -- */
                    .dark .hover\:bg-slate-50:hover { background-color: var(--color-bg-secondary) !important; }
                    .dark .hover\:bg-slate-100:hover { background-color: #334155 !important; }
                    .dark .hover\:bg-slate-200:hover { background-color: #3d5068 !important; }

                    /* -- Table rows -- */
                    .dark tr:hover { background-color: var(--color-bg-secondary) !important; }

                    /* -- Shadows → subtle borders instead -- */
                    .dark .shadow-xl { box-shadow: 0 0 0 1px var(--color-border), 0 20px 25px -5px rgb(0 0 0 / 0.5) !important; }
                    .dark .shadow-lg { box-shadow: 0 0 0 1px var(--color-border), 0 10px 15px -3px rgb(0 0 0 / 0.4) !important; }
                    .dark .shadow-sm { box-shadow: 0 0 0 1px var(--color-border) !important; }

                    /* -- Badges / pills -- */
                    .dark .bg-slate-100.text-slate-700,
                    .dark .bg-slate-100.text-slate-600 { background-color: #334155 !important; color: #cbd5e1 !important; }

                    /* -- Gray palette (mirrors slate) -- */
                    .dark .bg-gray-50 { background-color: var(--color-bg-secondary) !important; }
                    .dark .bg-gray-100 { background-color: var(--color-bg-secondary) !important; }
                    .dark .bg-gray-200 { background-color: #334155 !important; }

                    /* -- Nav -- */
                    .dark nav.bg-white { background-color: var(--color-bg-primary) !important; }

                    /* -- Notification item unread bg -- */
                    .dark .bg-blue-50\/50 { background-color: rgba(30,58,138,0.15) !important; }
                    .dark .border-blue-100 { border-color: rgba(59,130,246,0.2) !important; }

                    /* -- Notification badge tags -- */
                    .dark .bg-slate-100.text-slate-600 { background-color: #334155 !important; color: #cbd5e1 !important; }

                    /* -- Amber / warning -- */
                    .dark .bg-amber-50,
                    .dark .bg-amber-50\/40 { background-color: #1c1208 !important; }
                    .dark .border-amber-200 { border-color: #78350f !important; }
                    .dark .border-amber-300 { border-color: #92400e !important; }
                    .dark .border-amber-100 { border-color: #44260a !important; }
                    .dark .text-amber-700 { color: #fbbf24 !important; }
                    .dark .text-amber-600,
                    .dark .text-amber-500 { color: #f59e0b !important; }

                    /* -- Orange notification bg -- */
                    .dark .bg-orange-50 { background-color: #1c0e05 !important; }
                    .dark .bg-orange-100 { background-color: #2c1507 !important; }
                    .dark .text-orange-700 { color: #fb923c !important; }

                    /* -- Reason box in notifications -- */
                    .dark .text-orange-700.bg-orange-50 { background-color: #2c1507 !important; color: #fdba74 !important; }

                    /* -- Green -- */
                    .dark .bg-green-50 { background-color: #052e16 !important; }
                    .dark .bg-green-100 { background-color: #0a3d1e !important; }
                    .dark .text-green-700 { color: #4ade80 !important; }
                    .dark .text-green-600 { color: #22c55e !important; }

                    /* -- Indigo tints -- */
                    .dark .bg-indigo-50 { background-color: #1e1b4b !important; }
                    .dark .bg-indigo-100 { background-color: #27236b !important; }
                    .dark .bg-indigo-950 { background-color: #1e1b4b !important; }
                    .dark .text-indigo-700 { color: #818cf8 !important; }

                    /* -- Red -- */
                    .dark .bg-red-50 { background-color: #1c0a0a !important; }
                    .dark .bg-red-100 { background-color: #2c1010 !important; }
                    .dark .text-red-700 { color: #f87171 !important; }
                    .dark .bg-red-950\/30 { background-color: rgba(69,10,10,0.3) !important; }
                    .dark .hover\:bg-red-950\/50:hover { background-color: rgba(69,10,10,0.5) !important; }
                    .dark .hover\:bg-red-100:hover { background-color: rgba(69,10,10,0.5) !important; }

                    /* -- Blue -- */
                    .dark .bg-blue-50 { background-color: #0d1f3a !important; }
                    .dark .bg-blue-100 { background-color: #122347 !important; }
                    .dark .text-blue-700 { color: #60a5fa !important; }
                    .dark .text-blue-600 { color: #3b82f6 !important; }

                    /* -- Dropdown / popover / combobox -- */
                    .dark [role="listbox"],
                    .dark [cmdk-root] { background-color: var(--color-surface-elevated) !important; border-color: var(--color-border) !important; }

                    /* -- "or import from" divider -- */
                    .dark .bg-white.px-2 { background-color: var(--color-surface) !important; }

                    /* -- Prose content -- */
                    .dark .prose { color: var(--color-text-secondary) !important; }
                    .dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4 { color: var(--color-text-primary) !important; }
                    .dark .prose a { color: #818cf8 !important; }
                    .dark .prose code { background-color: #334155 !important; color: #f1f5f9 !important; }
                    .dark .prose blockquote { border-color: var(--color-border) !important; color: var(--color-text-muted) !important; }

                    /* -- VendorDetail info cards (bg-slate-50 hover:bg-slate-100) -- */
                    .dark .bg-slate-50 { background-color: var(--color-bg-secondary) !important; }
                    .dark .bg-slate-50.rounded-lg { background-color: var(--color-bg-secondary) !important; }

                    /* -- Vendor card category tags -- */
                    .dark span.bg-slate-100 { background-color: #334155 !important; color: #cbd5e1 !important; }

                    /* -- Support chatbot window -- */
                    .dark .bg-slate-50.rounded-2xl { background-color: var(--color-bg-primary) !important; }

                    /* -- Dialog / modal overlays -- */
                    .dark [role="dialog"] { background-color: var(--color-surface) !important; border-color: var(--color-border) !important; }
                    .dark [data-state="open"][role="dialog"] .bg-white { background-color: var(--color-surface) !important; }

                    /* -- Tabs -- */
                    .dark [role="tablist"] { background-color: var(--color-bg-secondary) !important; }
                    .dark [role="tab"][data-state="active"] { background-color: var(--color-surface) !important; color: var(--color-text-primary) !important; }
                    .dark [role="tab"] { color: var(--color-text-muted) !important; }

                    /* -- Filter panel -- */
                    .dark .bg-slate-50.rounded-xl { background-color: var(--color-bg-secondary) !important; }

                    /* -- Advanced filters panel border -- */
                    .dark .border-slate-200.rounded-xl { border-color: var(--color-border) !important; }

                    /* -- VendorDetail: loading/not-found bg -- */
                    .dark .min-h-screen.bg-white { background-color: var(--color-bg-primary) !important; }
                    .dark .min-h-screen.text-slate-900 { color: var(--color-text-primary) !important; }

                    /* -- Card backgrounds in dark mode -- */
                    .dark .bg-white.rounded-2xl,
                    .dark .bg-white.rounded-xl { background-color: var(--color-surface) !important; }
                    .dark .bg-card { background-color: var(--color-surface) !important; }

                    /* -- Indigo icon backgrounds in dark mode -- */
                    .dark .bg-indigo-100 { background-color: rgba(99, 102, 241, 0.15) !important; }

                    /* -- Messages page gradient bg -- */
                    .dark .from-slate-50 { --tw-gradient-from: #0f172a !important; }
                    .dark .via-white { --tw-gradient-via: #1e293b !important; }

                    /* -- Breadcrumb links -- */
                    .dark .hover\:text-slate-900:hover { color: var(--color-text-primary) !important; }

                    /* -- Social links on vendor detail -- */
                    .dark a.border-slate-200 { border-color: var(--color-border) !important; }
                    .dark a.hover\:bg-slate-50:hover { background-color: var(--color-bg-secondary) !important; }

                    /* -- Star icons in dark mode (keep amber) -- */
                    .dark .fill-slate-900.text-slate-900 { fill: #f1f5f9 !important; color: #f1f5f9 !important; }
                    .dark .text-slate-300.fill-slate-300 { fill: #334155 !important; color: #334155 !important; }

                    /* -- Vendor services checkmark -- */
                    .dark .text-slate-900.shrink-0 { color: var(--color-text-primary) !important; }

                    /* -- Subscription plan cards -- */
                    .dark button.bg-green-50 { background-color: #052e16 !important; color: #f0fdf4 !important; }
                    .dark button.bg-indigo-50 { background-color: #1e1b4b !important; color: #eef2ff !important; }
                    .dark button h3, .dark button p, .dark button div { color: inherit; }

                    /* ============================================
                       SYSTEM PREFERENCE DARK MODE
                       ============================================ */
                    @media (prefers-color-scheme: dark) {
                      :root:not(.light-mode) {
                        color-scheme: dark;
                        --color-bg-primary:       #0f172a;
                        --color-bg-secondary:     #1e293b;
                        --color-surface:          #1e293b;
                        --color-surface-elevated: #273549;
                        --color-text-primary:     #f1f5f9;
                        --color-text-secondary:   #cbd5e1;
                        --color-text-muted:       #94a3b8;
                        --color-border:           #334155;
                        --color-border-strong:    #475569;
                        --color-accent:           #6366f1;
                        --color-accent-hover:     #818cf8;
                      }
                      :root:not(.light-mode) body { background-color: var(--color-bg-primary) !important; color: var(--color-text-secondary) !important; }
                      :root:not(.light-mode) .bg-slate-50 { background-color: var(--color-bg-primary) !important; }
                      :root:not(.light-mode) .bg-white { background-color: var(--color-surface) !important; }
                      :root:not(.light-mode) .bg-slate-100 { background-color: var(--color-bg-secondary) !important; }
                      :root:not(.light-mode) .bg-slate-200 { background-color: #334155 !important; }
                      :root:not(.light-mode) .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--color-bg-primary), var(--color-bg-secondary)) !important; }
                      :root:not(.light-mode) .text-slate-950,
                      :root:not(.light-mode) .text-slate-900 { color: var(--color-text-primary) !important; }
                      :root:not(.light-mode) .text-slate-800,
                      :root:not(.light-mode) .text-slate-700 { color: var(--color-text-secondary) !important; }
                      :root:not(.light-mode) .text-slate-600 { color: #94a3b8 !important; }
                      :root:not(.light-mode) .text-slate-500 { color: #7c8fa8 !important; }
                      :root:not(.light-mode) .text-gray-900 { color: var(--color-text-primary) !important; }
                      :root:not(.light-mode) .text-gray-800 { color: var(--color-text-secondary) !important; }
                      :root:not(.light-mode) .text-gray-700 { color: var(--color-text-secondary) !important; }
                      :root:not(.light-mode) .text-gray-600 { color: #94a3b8 !important; }
                      :root:not(.light-mode) .text-gray-500 { color: #7c8fa8 !important; }
                      :root:not(.light-mode) .border-slate-100 { border-color: #1e293b !important; }
                      :root:not(.light-mode) .border-slate-200 { border-color: var(--color-border) !important; }
                      :root:not(.light-mode) .border-slate-300 { border-color: var(--color-border-strong) !important; }
                      :root:not(.light-mode) .bg-slate-50 { background-color: var(--color-bg-secondary) !important; }
                      :root:not(.light-mode) .hover\:bg-slate-50:hover { background-color: var(--color-bg-secondary) !important; }
                      :root:not(.light-mode) .hover\:bg-slate-100:hover { background-color: #334155 !important; }
                      :root:not(.light-mode) .divide-slate-100 > * + * { border-color: #1e293b !important; }
                      :root:not(.light-mode) .divide-slate-200 > * + * { border-color: var(--color-border) !important; }
                      :root:not(.light-mode) input,
                      :root:not(.light-mode) textarea,
                      :root:not(.light-mode) select { background-color: #0d1829 !important; color: var(--color-text-primary) !important; border-color: var(--color-border) !important; }
                      :root:not(.light-mode) input::placeholder,
                      :root:not(.light-mode) textarea::placeholder { color: #475569 !important; }
                      :root:not(.light-mode) label { color: var(--color-text-secondary) !important; }
                      :root:not(.light-mode) .shadow-xl { box-shadow: 0 0 0 1px var(--color-border), 0 20px 25px -5px rgb(0 0 0 / 0.5) !important; }
                      :root:not(.light-mode) .shadow-lg { box-shadow: 0 0 0 1px var(--color-border), 0 10px 15px -3px rgb(0 0 0 / 0.4) !important; }
                      :root:not(.light-mode) .bg-green-50 { background-color: #052e16 !important; }
                      :root:not(.light-mode) .bg-indigo-50 { background-color: #1e1b4b !important; }
                      :root:not(.light-mode) .bg-amber-50,
                      :root:not(.light-mode) .bg-amber-50\/40 { background-color: #1c1208 !important; }
                      :root:not(.light-mode) .border-amber-200 { border-color: #78350f !important; }
                      :root:not(.light-mode) .border-amber-300 { border-color: #92400e !important; }
                      :root:not(.light-mode) .text-amber-600,
                      :root:not(.light-mode) .text-amber-500 { color: #f59e0b !important; }
                      :root:not(.light-mode) .bg-red-50 { background-color: #1c0a0a !important; }
                      :root:not(.light-mode) .bg-blue-50 { background-color: #0d1f3a !important; }
                      :root:not(.light-mode) .bg-slate-100.text-slate-700 { background-color: #334155 !important; color: #cbd5e1 !important; }
                      :root:not(.light-mode) nav.bg-white { background-color: var(--color-bg-primary) !important; }
                      :root:not(.light-mode) .prose { color: var(--color-text-secondary) !important; }
                      :root:not(.light-mode) .prose h1,
                      :root:not(.light-mode) .prose h2,
                      :root:not(.light-mode) .prose h3 { color: var(--color-text-primary) !important; }
                      :root:not(.light-mode) .min-h-screen.bg-white { background-color: var(--color-bg-primary) !important; }
                      :root:not(.light-mode) .fill-slate-900.text-slate-900 { fill: #f1f5f9 !important; color: #f1f5f9 !important; }
                      :root:not(.light-mode) .bg-white.rounded-2xl,
                      :root:not(.light-mode) .bg-white.rounded-xl { background-color: var(--color-surface) !important; }
                      :root:not(.light-mode) .bg-card { background-color: var(--color-surface) !important; }
                      :root:not(.light-mode) .bg-indigo-100 { background-color: rgba(99, 102, 241, 0.15) !important; }
                      :root:not(.light-mode) [role="dialog"] { background-color: var(--color-surface) !important; border-color: var(--color-border) !important; }
                      :root:not(.light-mode) [role="tablist"] { background-color: var(--color-bg-secondary) !important; }
                      :root:not(.light-mode) [role="tab"][data-state="active"] { background-color: var(--color-surface) !important; color: var(--color-text-primary) !important; }
                      :root:not(.light-mode) [role="tab"] { color: var(--color-text-muted) !important; }
                    }

                    /* ============================================
                       LEAFLET & MOBILE UTILITIES
                       ============================================ */
                    .leaflet-container { z-index: 0; }
                    body { overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }
                    button, a, [role="button"] { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
                    `}</style>
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