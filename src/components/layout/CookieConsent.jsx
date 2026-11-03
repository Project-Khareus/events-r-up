import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export const COOKIE_CONSENT_EVENT = "cookie-consent-change";

function readConsent() {
  try { return localStorage.getItem("cookie_consent"); } catch { return null; }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!readConsent()) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const decide = (value) => {
    try { localStorage.setItem("cookie_consent", value); } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-ink-deep text-cream border-t border-gold/40 animate-in slide-in-from-bottom duration-500"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="flex-1 text-[13px] leading-relaxed text-cream/85">
          <span className="font-serif text-base text-cream mr-1.5">We value your privacy.</span>
          We use cookies to improve your experience and understand our traffic.{" "}
          <Link to={createPageUrl("CookiePolicy")} className="text-gold-dark underline underline-offset-2 hover:text-cream">
            Cookie Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="flex-1 sm:flex-none h-9 px-4 text-xs font-medium uppercase tracking-[0.12em] border border-cream/30 text-cream hover:bg-cream/10 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="flex-1 sm:flex-none h-9 px-5 text-xs font-medium uppercase tracking-[0.12em] bg-gold text-cream hover:bg-gold-text transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
