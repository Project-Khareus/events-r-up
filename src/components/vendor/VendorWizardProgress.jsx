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
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-9 h-9 rounded-none flex items-center justify-center text-[12px] border transition-colors",
                    isComplete
                      ? "bg-[#A97E2E] border-[#A97E2E] text-cream"
                      : isCurrent
                      ? "border-[#A97E2E] text-gold-text dark:text-gold-dark bg-[rgba(169,126,46,0.1)]"
                      : "border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]"
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-[0.14em] uppercase",
                    isCurrent
                      ? "text-gold-text dark:text-gold-dark"
                      : isComplete
                      ? "text-ink dark:text-[#F1E8E0]"
                      : "text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-4",
                    i < currentStep ? "bg-[#A97E2E]" : "bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)]"
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
          <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-gold-text dark:text-gold-dark">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-[12.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            {STEPS[currentStep].label}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 transition-colors",
                i <= currentStep ? "bg-[#A97E2E]" : "bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}