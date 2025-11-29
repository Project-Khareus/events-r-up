import React from "react";
import Navbar from "./components/layout/Navbar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Footer from "./components/layout/Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&display=swap');
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
      `}</style>
      <Navbar />
      <main className="pb-20 md:pb-0 flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}