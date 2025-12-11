import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  useEffect(() => {
    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: "SOCIAL_AUTH_SUCCESS", code }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({ type: "SOCIAL_AUTH_ERROR", error }, window.location.origin);
      }
      window.close();
    } else {
      // Fallback if not opened in popup (shouldn't happen with current implementation)
      navigate("/");
    }
  }, [code, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-600">Connecting to Facebook...</p>
        <p className="text-xs text-slate-400 mt-2">You can close this window if it doesn't close automatically.</p>
      </div>
    </div>
  );
}