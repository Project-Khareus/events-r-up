import React, { useState } from "react";
import { Check } from "lucide-react";
import EventTypeSelector from "@/components/event-planning/EventTypeSelector";
import LocationSelector from "@/components/event-planning/LocationSelector";
import BudgetSelector from "@/components/event-planning/BudgetSelector";
import CategorySelector from "@/components/event-planning/CategorySelector";
import VendorResults from "@/components/event-planning/VendorResults";

const STEPS = [
  { number: 1, title: "Event Type" },
  { number: 2, title: "Location" },
  { number: 3, title: "Budget" },
  { number: 4, title: "Vendors" },
  { number: 5, title: "Results" },
];

export default function HomeEventPlanner() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("");
  const [location, setLocation] = useState(null);
  const [budget, setBudget] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const canNavigateToStep = (n) => {
    if (n === 1) return true;
    if (n === 2) return eventType !== "";
    if (n === 3) return eventType !== "" && location !== null;
    if (n === 4) return eventType !== "" && location !== null && budget !== "";
    return eventType !== "" && location !== null && budget !== "" && selectedCategories.length > 0;
  };

  return (
    <section>
      <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-gold-text dark:text-gold-dark">
        Plan an event
      </p>
      <h2 className="mt-2 font-serif text-[24px] md:text-[30px] leading-[1.2] text-ink dark:text-[#F1E8E0]">
        Tell us the occasion, we'll shortlist the vendors
      </h2>

      <div className="mt-5 border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.number}>
              <button
                onClick={() => canNavigateToStep(s.number) && setStep(s.number)}
                disabled={!canNavigateToStep(s.number)}
                className={canNavigateToStep(s.number) ? "flex flex-col items-center gap-2 cursor-pointer" : "flex flex-col items-center gap-2 cursor-not-allowed"}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-[14px] border transition-colors ${
                    step === s.number
                      ? "bg-gold text-cream border-gold"
                      : step > s.number
                      ? "bg-transparent text-gold-text dark:text-gold-dark border-gold"
                      : "bg-transparent text-[rgba(59,50,43,0.42)] dark:text-[rgba(241,232,224,0.42)] border-[rgba(59,50,43,0.22)] dark:border-[rgba(241,232,224,0.18)]"
                  }`}
                >
                  {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                </span>
                <span
                  className={`text-[9.5px] font-medium tracking-[0.12em] uppercase hidden sm:block ${
                    step >= s.number ? "text-ink dark:text-[#F1E8E0]" : "text-[rgba(59,50,43,0.42)] dark:text-[rgba(241,232,224,0.42)]"
                  }`}
                >
                  {s.title}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-2 h-px bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)] relative">
                  <div className="absolute inset-y-0 left-0 bg-gold transition-all duration-500" style={{ width: step > s.number ? "100%" : "0%" }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-4 border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] p-5 sm:p-8">
        {step === 1 && <EventTypeSelector value={eventType} onChange={setEventType} onNext={() => setStep(2)} />}
        {step === 2 && <LocationSelector value={location} onChange={setLocation} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <BudgetSelector value={budget} onChange={setBudget} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && (
          <CategorySelector
            eventType={eventType}
            budget={budget}
            selectedCategories={selectedCategories}
            onChange={setSelectedCategories}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <VendorResults
            eventType={eventType}
            location={location}
            budget={budget}
            selectedCategories={selectedCategories}
            onBack={() => setStep(4)}
          />
        )}
      </div>
    </section>
  );
}