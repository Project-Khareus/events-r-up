import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Show after a small delay
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-2xl p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">We value your privacy</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
            By clicking "Accept All", you consent to our use of cookies. Read our{" "}
            <Link to={createPageUrl("CookiePolicy")} className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              Cookie Policy
            </Link>{" "}
            to learn more.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleDecline}
            className="flex-1 md:flex-none border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            Decline
          </Button>
          <Button 
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            Accept All
          </Button>
        </div>
        <button 
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 md:hidden p-2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}