import React from "react";
import { Megaphone } from "lucide-react";

export default function HorizontalAdPlaceholder({ size = "medium" }) {
  const heights = {
    small: "h-16",
    medium: "h-24",
    large: "h-32"
  };

  return (
    <div className={`w-full bg-slate-100 border border-dashed border-slate-300 rounded-lg ${heights[size]} flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer`}>
      <Megaphone className="h-5 w-5 text-slate-400" />
      <div className="text-center">
        <span className="text-sm text-slate-500 font-medium block">Advertise Here</span>
        <span className="text-xs text-slate-400">Promote your business to thousands of event planners</span>
      </div>
    </div>
  );
}