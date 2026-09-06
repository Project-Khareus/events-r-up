import React from "react";
import { Wallet } from "lucide-react";
import StepHeading from "./StepHeading";
import StepNav from "./StepNav";

const BUDGET_PRESETS = [
  { label: "Under GH₵ 5,000", value: 5000, tag: "Intimate" },
  { label: "GH₵ 5,000 – 10,000", value: 10000, tag: "Standard" },
  { label: "GH₵ 10,000 – 25,000", value: 25000, tag: "Premium" },
  { label: "GH₵ 25,000 – 50,000", value: 50000, tag: "Luxury" },
  { label: "GH₵ 50,000+", value: 100000, tag: "Grand" }
];

const inputClass =
  "w-full h-14 rounded-none bg-transparent border border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] text-[15px] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.4)] focus:outline-none focus:border-[#A97E2E]";

export default function BudgetSelector({ value, onChange, onNext, onBack }) {
  return (
    <div>
      <StepHeading title="What's your budget?" subtitle="This helps us show vendors within your price range" />

      <div className="max-w-md mx-auto space-y-8">
        <div>
          <label className="text-[10px] font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">
            Enter custom amount
          </label>
          <div className="relative mt-2">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(59,50,43,0.45)]" />
            <span className="absolute left-11 top-1/2 -translate-y-1/2 text-[13px] text-[rgba(59,50,43,0.55)] dark:text-[rgba(241,232,224,0.6)]">GH₵</span>
            <input
              type="number"
              min="0"
              step="100"
              placeholder="10,000"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${inputClass} pl-[5.25rem]`}
            />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-center text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)] mb-3">
            or pick a range
          </p>
          <div className="grid gap-2">
            {BUDGET_PRESETS.map((preset) => {
              const isSelected = value === preset.value.toString();
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChange(preset.value.toString())}
                  className={`w-full min-h-[48px] px-5 rounded-none flex items-center justify-between text-[14px] border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E] ${
                    isSelected
                      ? "border-[#A97E2E] bg-[rgba(169,126,46,0.08)] text-ink dark:text-[#F1E8E0]"
                      : "border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] text-[rgba(59,50,43,0.8)] dark:text-[rgba(241,232,224,0.82)] hover:border-[#A97E2E]"
                  }`}
                >
                  <span className="font-light">{preset.label}</span>
                  <span className={`text-[10px] font-medium tracking-[0.14em] uppercase ${isSelected ? "text-gold-text dark:text-gold-dark" : "text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]"}`}>
                    {preset.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Find Vendors" nextDisabled={!value || value <= 0} />
    </div>
  );
}