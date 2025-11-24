import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, DollarSign } from "lucide-react";

const BUDGET_PRESETS = [
  { label: "Under $5,000", value: 5000 },
  { label: "$5,000 - $10,000", value: 10000 },
  { label: "$10,000 - $25,000", value: 25000 },
  { label: "$25,000 - $50,000", value: 50000 },
  { label: "$50,000+", value: 100000 }
];

export default function BudgetSelector({ value, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">What's your budget?</h2>
        <p className="text-slate-600">This helps us show vendors within your price range</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <Label className="text-base mb-3 block">Enter Your Budget *</Label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="number"
              min="0"
              step="100"
              placeholder="10000"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="pl-12 h-14 rounded-xl text-lg"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm mb-3 block text-slate-600">Or select a range:</Label>
          <div className="grid gap-2">
            {BUDGET_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant={value === preset.value.toString() ? "default" : "outline"}
                onClick={() => onChange(preset.value.toString())}
                className="w-full h-12 rounded-xl justify-start text-base"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-8 h-12 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!value || value <= 0}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          Find Vendors
        </Button>
      </div>
    </div>
  );
}