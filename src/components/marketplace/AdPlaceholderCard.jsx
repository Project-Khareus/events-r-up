import React from "react";
import { Megaphone } from "lucide-react";

export default function AdPlaceholderCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/50 flex flex-col items-center justify-center p-6 text-center group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer row-span-1 self-stretch">
      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
        <Megaphone className="h-6 w-6 text-indigo-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">Ad Space</p>
      <p className="text-xs text-slate-500">Promote your business here</p>
    </div>
  );
}