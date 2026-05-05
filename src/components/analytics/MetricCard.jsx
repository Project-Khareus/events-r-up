import React from "react";

export default function MetricCard({ icon: Icon, iconColor, label, value, subtitle }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{value}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}