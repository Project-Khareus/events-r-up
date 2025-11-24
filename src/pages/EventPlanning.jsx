import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import EventTypeSelector from "../components/event-planning/EventTypeSelector";
import LocationSelector from "../components/event-planning/LocationSelector";
import BudgetSelector from "../components/event-planning/BudgetSelector";
import VendorResults from "../components/event-planning/VendorResults";

export default function EventPlanning() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("");
  const [location, setLocation] = useState(null);
  const [budget, setBudget] = useState("");

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const steps = [
    { number: 1, title: "Event Type" },
    { number: 2, title: "Location" },
    { number: 3, title: "Budget" },
    { number: 4, title: "Find Vendors" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Plan Your Perfect Event
          </h1>
          <p className="text-xl text-slate-600">
            Let's find the best vendors for your special occasion
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s.number
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {s.number}
                  </div>
                  <span
                    className={`text-sm mt-2 font-medium ${
                      step >= s.number ? "text-indigo-600" : "text-slate-500"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 rounded-full transition-all ${
                      step > s.number ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 rounded-2xl border-slate-200 shadow-lg">
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
            <VendorResults
              eventType={eventType}
              location={location}
              budget={budget}
              onBack={handleBack}
            />
          )}
        </Card>
      </div>
    </div>
  );
}