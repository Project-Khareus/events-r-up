import React from "react";
import { Heart, PartyPopper, Building2, Flower2, Check } from "lucide-react";
import StepHeading from "./StepHeading";
import StepNav from "./StepNav";

const EVENT_TYPES = [
  { value: "weddings", label: "Weddings", icon: Heart, description: "Find the perfect vendors for your big day" },
  { value: "parties", label: "Parties", icon: PartyPopper, description: "Birthday, anniversary, or any celebration" },
  { value: "conference", label: "Conference", icon: Building2, description: "Corporate events & professional meetings" },
  { value: "funeral", label: "Funeral", icon: Flower2, description: "Respectful memorial & tribute services" },
];

export default function EventTypeSelector({ value, onChange, onNext }) {
  return (
    <div>
      <StepHeading title="What type of event are you planning?" subtitle="Choose one to get started" />

      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {EVENT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          return (
            <button
              key={type.value}
              onClick={() => onChange(type.value)}
              className={`relative p-5 min-h-[48px] text-left rounded-none border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A97E2E] ${
                isSelected
                  ? "border-[#A97E2E] bg-[rgba(169,126,46,0.08)]"
                  : "border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.16)] hover:border-[#A97E2E]"
              }`}
            >
              <Icon className={`h-5 w-5 ${isSelected ? "text-[#A97E2E]" : "text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]"}`} />
              <h3 className="mt-3 font-serif text-[21px] text-ink dark:text-[#F1E8E0]">{type.label}</h3>
              <p className="mt-1 text-[13px] font-light leading-relaxed text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
                {type.description}
              </p>
              {isSelected && (
                <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                  <Check className="h-3 w-3 text-cream" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <StepNav onNext={onNext} nextDisabled={!value} />
    </div>
  );
}