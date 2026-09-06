import React, { useState } from "react";
import { Check } from "lucide-react";
import EventTypeSelector from "../components/event-planning/EventTypeSelector";
import LocationSelector from "../components/event-planning/LocationSelector";
import BudgetSelector from "../components/event-planning/BudgetSelector";
import VendorResults from "../components/event-planning/VendorResults";
import CategorySelector from "../components/event-planning/CategorySelector";

export default function EventPlanning() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("");
  const [location, setLocation] = useState(null);
  const [budget, setBudget] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const steps = [
    { number: 1, title: "Event Type" },
    { number: 2, title: "Location" },
    { number: 3, title: "Budget" },
    { number: 4, title: "Select Vendors" },
    { number: 5, title: "Results" }
  ];

  const canNavigateToStep = (stepNumber) => {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return eventType !== "";
    if (stepNumber === 3) return eventType !== "" && location !== null;
    if (stepNumber === 4) return eventType !== "" && location !== null && budget !== "";
    if (stepNumber === 5) return eventType !== "" && location !== null && budget !== "" && selectedCategories.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#211B16]">
      {/* Masthead */}
      <div className="bg-ink dark:bg-[#2A231D] px-6 py-12 sm:py-16 text-center">
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#C9A055]">
          Plan an event
        </p>
        <h1 className="mt-4 font-serif text-[30px] sm:text-[42px] leading-[1.15] text-cream max-w-2xl mx-auto">
          Tell us the occasion, we'll shortlist the vendors
        </h1>
        <p className="mt-4 text-[14.5px] font-light leading-[1.7] text-[rgba(248,241,235,0.72)] max-w-xl mx-auto">
          Five short steps — occasion, city, budget, the services you need — and we match you to approved listings.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Progress stepper */}
        <div className="border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <button
                  onClick={() => canNavigateToStep(s.number) && setStep(s.number)}
                  disabled={!canNavigateToStep(s.number)}
                  className={`flex flex-col items-center gap-2 ${canNavigateToStep(s.number) ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-[15px] border transition-colors ${
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
                    className={`text-[10px] font-medium tracking-[0.12em] uppercase hidden sm:block ${
                      step >= s.number
                        ? "text-ink dark:text-[#F1E8E0]"
                        : "text-[rgba(59,50,43,0.42)] dark:text-[rgba(241,232,224,0.42)]"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 h-px bg-[rgba(59,50,43,0.14)] dark:bg-[rgba(241,232,224,0.16)] relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-gold transition-all duration-500"
                      style={{ width: step > s.number ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] p-6 sm:p-10">
          {step === 1 && (
            <EventTypeSelector
              value={eventType}
              onChange={setEventType}
              onNext={handleNext}
            />
          )}

          {step === 2 && (
            <LocationSelector
              value={location}
              onChange={setLocation}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <BudgetSelector
              value={budget}
              onChange={setBudget}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 4 && (
            <CategorySelector
              eventType={eventType}
              budget={budget}
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 5 && (
            <VendorResults
              eventType={eventType}
              location={location}
              budget={budget}
              selectedCategories={selectedCategories}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}