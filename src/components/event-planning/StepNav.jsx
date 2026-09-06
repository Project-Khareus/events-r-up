import React from "react";
import { ChevronLeft } from "lucide-react";

export const primaryBtn =
  "min-h-[48px] px-8 rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]";

export const outlineBtn =
  "min-h-[48px] px-6 rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] text-ink dark:text-[#F1E8E0] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-[rgba(169,126,46,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E]";

export default function StepNav({ onBack, onNext, nextLabel = "Continue", nextDisabled = false }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-10">
      {onBack && (
        <button type="button" onClick={onBack} className={`${outlineBtn} inline-flex items-center gap-1.5`}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      )}
      {onNext && (
        <button type="button" onClick={onNext} disabled={nextDisabled} className={primaryBtn}>
          {nextLabel}
        </button>
      )}
    </div>
  );
}