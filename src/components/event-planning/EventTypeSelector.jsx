import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Cake, Heart, Flower2, Music, GraduationCap, MoreHorizontal } from "lucide-react";

const EVENT_TYPES = [
  { value: "birthday", label: "Birthday", icon: Cake },
  { value: "anniversary", label: "Anniversary", icon: Heart },
  { value: "wedding", label: "Wedding/Nuptials", icon: Flower2 },
  { value: "funeral", label: "Funeral", icon: Flower2 },
  { value: "graduation", label: "Graduation", icon: GraduationCap },
  { value: "other", label: "Other", icon: MoreHorizontal }
];

export default function EventTypeSelector({ value, onChange, onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">What type of event are you planning?</h2>
        <p className="text-slate-600">This helps us recommend the right vendors for you</p>
      </div>

      <div className="max-w-md mx-auto">
        <Label className="text-base mb-3 block">Select Event Type *</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full h-14 rounded-xl text-lg">
            <SelectValue placeholder="Choose an event type..." />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value} className="text-lg py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-indigo-600" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={onNext}
          disabled={!value}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}