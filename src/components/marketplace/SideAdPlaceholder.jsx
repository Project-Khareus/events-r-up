import React from "react";
import { Megaphone } from "lucide-react";

export default function SideAdPlaceholder({ position = "left" }) {
  return (
    <div className={`hidden xl:flex flex-col gap-4 w-[160px] ${position === "left" ? "pr-4" : "pl-4"}`}>
      <div className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-4 h-[600px] flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
        <Megaphone className="h-6 w-6 text-slate-400 mb-2" />
        <span className="text-xs text-slate-500 font-medium">Ad Space</span>
        <span className="text-[10px] text-slate-400 mt-1">160 × 600</span>
      </div>
      <div className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-4 h-[250px] flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
        <Megaphone className="h-5 w-5 text-slate-400 mb-2" />
        <span className="text-xs text-slate-500 font-medium">Ad Space</span>
        <span className="text-[10px] text-slate-400 mt-1">160 × 250</span>
      </div>
    </div>
  );
}