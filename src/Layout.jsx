import React from "react";
import Navbar from "./components/layout/Navbar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Footer from "./components/layout/Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="pb-20 md:pb-0 flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}