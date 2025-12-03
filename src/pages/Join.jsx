import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Facebook, Instagram, Mail } from "lucide-react";

export default function Join() {
  const handleAuth = () => {
    // Redirect to platform authentication which handles social providers
    base44.auth.redirectToLogin(createPageUrl("VendorMarketplace"));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <Card className="w-full max-w-md p-8 space-y-8 shadow-xl bg-white border-slate-100">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Join Omnievents
          </h1>
          <p className="text-slate-600">
            Plan your perfect event with top-rated vendors
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium relative hover:bg-slate-50 border-slate-300"
            onClick={handleAuth}
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </Button>

          <Button 
            className="w-full h-12 text-base font-medium bg-[#1877F2] hover:bg-[#1864D9] text-white shadow-sm"
            onClick={handleAuth}
          >
            <Facebook className="h-5 w-5 mr-3" />
            Sign up with Facebook
          </Button>

          <Button 
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white border-0 shadow-sm"
            onClick={handleAuth}
          >
            <Instagram className="h-5 w-5 mr-3" />
            Sign up with Instagram
          </Button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium tracking-wider">Or continue with</span>
            </div>
          </div>

           <Button 
            variant="secondary" 
            className="w-full h-12 text-base font-medium bg-slate-100 hover:bg-slate-200 text-slate-900"
            onClick={handleAuth}
          >
            <Mail className="h-5 w-5 mr-3" />
            Sign up with Email
          </Button>
        </div>

        <div className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <button 
            onClick={handleAuth}
            className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline underline-offset-2 transition-colors"
          >
            Log in
          </button>
        </div>
        
        <div className="text-xs text-center text-slate-400 px-4 leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link to={createPageUrl("LegalPage") + "?slug=terms"} className="underline hover:text-slate-600 transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link to={createPageUrl("LegalPage") + "?slug=privacy"} className="underline hover:text-slate-600 transition-colors">Privacy Policy</Link>
        </div>
      </Card>
    </div>
  );
}