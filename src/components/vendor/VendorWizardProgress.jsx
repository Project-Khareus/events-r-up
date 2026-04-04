import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Business Info", shortLabel: "Business" },
  { label: "Media & Services", shortLabel: "Media" },
  { label: "Contact & Social", shortLabel: "Contact" },
  { label: "Verify & Plan", shortLabel: "Verify" },
];

export default function VendorWizardProgress({ currentStep }) {
  return (
    <div className="mb-8">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                    isComplete
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isCurrent
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                      : "border-slate-300 text-slate-400 bg-white"
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-indigo-700" : isComplete ? "text-slate-700" : "text-slate-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3",
                    i < currentStep ? "bg-indigo-600" : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-indigo-700">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-slate-500">{STEPS[currentStep].label}</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                i <= currentStep ? "bg-indigo-600" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}