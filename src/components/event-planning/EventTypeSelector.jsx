import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, PartyPopper, Building2, Flower2, ArrowRight } from "lucide-react";

const EVENT_TYPES = [
  { value: "weddings", label: "Weddings", icon: Heart, description: "Find the perfect vendors for your big day", color: "from-rose-500 to-pink-600", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
  { value: "parties", label: "Parties", icon: PartyPopper, description: "Birthday, anniversary, or any celebration", color: "from-amber-500 to-orange-600", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  { value: "conference", label: "Conference", icon: Building2, description: "Corporate events & professional meetings", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  { value: "funeral", label: "Funeral", icon: Flower2, description: "Respectful memorial & tribute services", color: "from-slate-500 to-slate-700", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-600" },
];

export default function EventTypeSelector({ value, onChange, onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">What type of event are you planning?</h2>
        <p className="text-slate-500">Choose one to get started</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {EVENT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          return (
            <button
              key={type.value}
              onClick={() => onChange(type.value)}
              className={`relative p-5 rounded-2xl text-left transition-all duration-200 border-2 group ${
                isSelected
                  ? `${type.border} ${type.bg} shadow-md scale-[1.02]`
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md bg-white"
              }`}
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${type.color} mb-3 shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{type.label}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{type.description}</p>
              {isSelected && (
                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={onNext}
          disabled={!value}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-base font-medium gap-2 shadow-lg shadow-indigo-200 transition-all disabled:shadow-none"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}