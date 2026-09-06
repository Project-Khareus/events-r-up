import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 100);

    // After 2.5s start fade out then redirect
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        navigate(createPageUrl("VendorMarketplace"));
      }, 600);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        transition: "opacity 0.6s ease",
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            top: -150,
            right: -100,
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            bottom: -100,
            left: -100,
            background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        className="flex flex-col items-center gap-6 px-8 text-center"
        style={{
          transition: "opacity 0.8s ease, transform 0.8s ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
        }}
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 20px 60px rgba(99,102,241,0.4)",
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 42,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            K
          </span>
        </div>

        {/* App name */}
        <div>
          <h1
            style={{
              fontFamily: "sans-serif",
              fontSize: 40,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            Khareus
          </h1>

          {/* Divider */}
          <div
            style={{
              width: 48,
              height: 2,
              background: "linear-gradient(90deg, transparent, #6366f1, transparent)",
              margin: "0 auto 14px",
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 15,
              fontStyle: "italic",
              color: "#94a3b8",
              letterSpacing: "0.04em",
            }}
          >
            Lasting memories, perfectly planned.
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div
        className="absolute bottom-16 flex items-center gap-2"
        style={{
          transition: "opacity 0.8s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: "#6366f1",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}