import React, { useState } from "react";
import { Sparkles, Check } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-indigo-200 text-sm font-medium mb-5">
            <Sparkles className="h-4 w-4" />
            AI-Powered Vendor Matching
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 leading-tight">
            Plan Your Perfect Event
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
            Answer a few questions and we'll match you with the best vendors for your occasion
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-10 pb-16">
        {/* Progress Stepper */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <button
                  onClick={() => canNavigateToStep(s.number) && setStep(s.number)}
                  disabled={!canNavigateToStep(s.number)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step === s.number
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                        : step > s.number
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                    } ${canNavigateToStep(s.number) ? "cursor-pointer group-hover:scale-110" : "cursor-not-allowed"}`}
                  >
                    {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium hidden sm:block transition-colors ${
                      step === s.number ? "text-indigo-600" : step > s.number ? "text-indigo-500" : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-1 sm:mx-2">
                    <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          step > s.number ? "w-full bg-indigo-500" : "w-0 bg-indigo-500"
                        }`}
                        style={{ width: step > s.number ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-10">
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