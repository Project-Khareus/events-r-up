import React from "react";
import { Megaphone } from "lucide-react";

export default function AdPlaceholderCard() {
  return (
    <div className="relative">
      {/* Fixed height container that doesn't affect grid alignment */}
      <div className="h-[420px] overflow-hidden border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 text-center group hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3 group-hover:bg-slate-300 transition-colors">
          <Megaphone className="h-6 w-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">Ad Space</p>
        <p className="text-xs text-slate-500">Promote your business here</p>
      </div>
    </div>
  );
}