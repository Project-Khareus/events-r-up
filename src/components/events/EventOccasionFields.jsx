import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OCCASIONS } from "@/lib/eventOccasions";

export default function EventOccasionFields({ occasion, subcategory, onChange }) {
  const choices = OCCASIONS[occasion]?.subcategories || [];
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>Celebration Occasion</Label>
        <Select value={occasion || "none"} onValueChange={(value) => onChange({ occasion: value === "none" ? "" : value, occasion_subcategory: "" })}>
          <SelectTrigger><SelectValue placeholder="Select an occasion" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {Object.entries(OCCASIONS).map(([value, item]) => <SelectItem key={value} value={value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {occasion && <div className="space-y-2">
        <Label>{OCCASIONS[occasion].label} Subcategory</Label>
        <Select value={subcategory || "none"} onValueChange={(value) => onChange({ occasion_subcategory: value === "none" ? "" : value })}>
          <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {choices.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>}
    </div>
  );
}