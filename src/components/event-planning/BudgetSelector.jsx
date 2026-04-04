import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Wallet } from "lucide-react";

const BUDGET_PRESETS = [
  { label: "Under GH₵ 5,000", value: 5000, tag: "Intimate" },
  { label: "GH₵ 5,000 – 10,000", value: 10000, tag: "Standard" },
  { label: "GH₵ 10,000 – 25,000", value: 25000, tag: "Premium" },
  { label: "GH₵ 25,000 – 50,000", value: 50000, tag: "Luxury" },
  { label: "GH₵ 50,000+", value: 100000, tag: "Grand" }
];

export default function BudgetSelector({ value, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">What's your budget?</h2>
        <p className="text-slate-600 dark:text-slate-300">This helps us show vendors within your price range</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">Enter custom amount</label>
          <div className="relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">GH₵</span>
            <Input
              type="number"
              min="0"
              step="100"
              placeholder="10,000"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="pl-[5.5rem] h-14 rounded-xl text-lg border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-400 mb-3 text-center">— or pick a range —</p>
          <div className="grid gap-2">
            {BUDGET_PRESETS.map((preset) => {
              const isSelected = value === preset.value.toString();
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChange(preset.value.toString())}
                  className={`w-full h-12 rounded-xl flex items-center justify-between px-5 text-sm font-medium transition-all border-2 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                  }`}>{preset.tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 h-12 rounded-xl border-slate-300 text-slate-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!value || value <= 0}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:shadow-none"
        >
          Find Vendors
        </Button>
      </div>
    </div>
  );
}