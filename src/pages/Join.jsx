import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Facebook, Instagram, Mail, Check, CalendarHeart, Store } from "lucide-react";
import BiometricLogin from "../components/auth/BiometricLogin";

const INTENT_KEY = "khareus:join_intent";

const BENEFITS = [
  "Save vendors to My Picks and compare quotes",
  "Message vendors and track bookings in one place",
  "Vendors get approved, then take bookings and payments",
];

const ROLES = [
  { value: "planner", title: "Plan an event", body: "Find, shortlist and book vendors", icon: CalendarHeart },
  { value: "vendor", title: "List a business", body: "Get approved and take bookings", icon: Store },
];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Join() {
  const navigate = useNavigate();
  const [email] = useState("");
  const [role, setRole] = useState("planner");

  const resolveDestination = () => {
    let stored = null;
    try {
      stored = sessionStorage.getItem(INTENT_KEY);
      sessionStorage.removeItem(INTENT_KEY);
    } catch {
      stored = null;
    }
    return stored === "vendor" ? createPageUrl("VendorSignup") : createPageUrl("VendorMarketplace");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        navigate(resolveDestination());
      }
    };
    checkAuth();
  }, [navigate]);

  const selectRole = (value) => {
    setRole(value);
    try {
      sessionStorage.setItem(INTENT_KEY, value);
    } catch {
      /* storage unavailable — falls back to the safe default */
    }
  };

  const handleAuth = () => {
    try {
      sessionStorage.setItem(INTENT_KEY, role);
    } catch {
      /* ignore */
    }
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-[720px] bg-cream dark:bg-[#211B16] pb-[82px] md:pb-0">
      {/* Left / header panel */}
      <div className="bg-ink dark:bg-[#2A231D] px-6 md:px-12 py-8 md:py-12 flex flex-col justify-between min-h-[190px]">
        <Link to={createPageUrl("VendorMarketplace")} className="font-serif font-medium text-[20px] tracking-[0.36em] uppercase text-cream">
          Khareus
        </Link>

        <div className="md:my-10">
          <h2 className="mt-6 md:mt-0 font-serif text-[27px] md:text-[42px] leading-[1.15] text-cream max-w-[440px]">
            Two ways in, and we ask which one first
          </h2>
          <p className="mt-4 text-[14.5px] font-light leading-[1.7] text-[rgba(248,241,235,0.72)] max-w-[420px] hidden md:block">
            Whether you are planning an occasion or running the business behind one, Khareus starts you in the right place.
          </p>
          <ul className="mt-6 space-y-3 hidden md:block">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5">
                <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#C9A055]" />
                <span className="text-[13.5px] font-light text-[rgba(248,241,235,0.82)]">{benefit}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13.5px] font-light text-[rgba(248,241,235,0.72)] md:hidden">
            Free to join. No card, no listing fee to browse.
          </p>
        </div>

        <div className="hidden md:block h-[180px] overflow-hidden">
          <img
            src="https://media.base44.com/images/public/69224d81efa2f499554b5019/6a3bb8090_generated_image.png"
            alt="Candlelit table setting at a Ghanaian celebration"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Right / form panel */}
      <div className="px-6 md:px-14 py-10 md:py-14 flex flex-col justify-center">
        <div className="w-full max-w-[440px] mx-auto">
          <h1 className="font-serif text-[28px] md:text-[34px] text-ink dark:text-[#F1E8E0]">Join Khareus</h1>
          <p className="mt-2 text-[14.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            Free to join. No card, no listing fee to browse.
          </p>

          {/* Role selector */}
          <p className="mt-8 text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
            I am here to
          </p>
          <div role="radiogroup" aria-label="I am here to" className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLES.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectRole(option.value)}
                  className={`text-left p-4 min-h-[48px] rounded-none border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E] ${
                    selected
                      ? "border-[#A97E2E] bg-[rgba(169,126,46,0.08)]"
                      : "border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] hover:border-[#A97E2E]"
                  }`}
                >
                  <option.icon className={`h-5 w-5 ${selected ? "text-[#A97E2E]" : "text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]"}`} />
                  <span className="mt-2.5 block font-serif text-[19px] text-ink dark:text-[#F1E8E0]">{option.title}</span>
                  <span className="mt-0.5 block text-[12px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{option.body}</span>
                </button>
              );
            })}
          </div>

          {/* Primary auth */}
          <button
            type="button"
            onClick={handleAuth}
            className="mt-7 w-full min-h-[48px] flex items-center justify-center gap-3 rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleAuth}
            className="mt-3 w-full min-h-[48px] flex items-center justify-center gap-3 rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-[rgba(169,126,46,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]"
          >
            <Mail className="h-5 w-5" />
            Continue with email
          </button>

          {/* Face ID — promoted above the social row on mobile */}
          <div className="mt-3 md:hidden [&_button]:rounded-none [&_button]:min-h-[48px] [&_button]:border-[rgba(59,50,43,0.28)] [&_button]:text-[11.5px] [&_button]:font-medium [&_button]:tracking-[0.1em] [&_button]:uppercase">
            <BiometricLogin email={email} onSuccess={() => navigate(resolveDestination())} />
          </div>

          {/* More ways */}
          <div className="relative mt-7 mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-cream dark:bg-[#211B16] px-3 text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
                More ways
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleAuth}
              aria-label="Continue with Facebook"
              className="min-h-[48px] flex items-center justify-center gap-2 rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] text-[11px] font-medium tracking-[0.08em] uppercase hover:bg-[rgba(169,126,46,0.08)] transition-colors"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </button>
            <button
              type="button"
              onClick={handleAuth}
              aria-label="Continue with Instagram"
              className="min-h-[48px] flex items-center justify-center gap-2 rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] text-[11px] font-medium tracking-[0.08em] uppercase hover:bg-[rgba(169,126,46,0.08)] transition-colors"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </button>
            <div className="hidden md:block [&_button]:rounded-none [&_button]:min-h-[48px] [&_button]:w-full [&_button]:border-[rgba(59,50,43,0.28)] [&_button]:text-[11px] [&_button]:font-medium [&_button]:tracking-[0.08em] [&_button]:uppercase [&_p]:hidden">
              <BiometricLogin email={email} onSuccess={() => navigate(resolveDestination())} />
            </div>
          </div>

          <p className="mt-7 text-center text-[13px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            Already have an account?{" "}
            <button onClick={handleAuth} className="text-gold-text dark:text-gold-dark hover:underline">
              Log in
            </button>
          </p>

          <p className="mt-3 text-center text-[12px] font-light leading-relaxed text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
            By creating an account, you agree to our{" "}
            <Link to={createPageUrl("LegalPage") + "?slug=terms"} className="underline hover:text-ink dark:hover:text-[#F1E8E0]">Terms of Service</Link>
            {" "}and{" "}
            <Link to={createPageUrl("LegalPage") + "?slug=privacy"} className="underline hover:text-ink dark:hover:text-[#F1E8E0]">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}