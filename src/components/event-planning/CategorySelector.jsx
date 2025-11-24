import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Check } from "lucide-react";

const EVENT_CATEGORY_MAP = {
  birthday: [
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "bakery", label: "Bakery", description: "Cakes & desserts" },
    { value: "dj_music", label: "DJ & Music", description: "Entertainment" },
    { value: "entertainment", label: "Entertainment", description: "Performers & activities" },
    { value: "decorator", label: "Decorator", description: "Venue decoration" },
    { value: "photography", label: "Photography", description: "Photo services" },
    { value: "videography", label: "Videography", description: "Video services" }
  ],
  anniversary: [
    { value: "venue", label: "Venue", description: "Event space" },
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "florist", label: "Florist", description: "Flowers & arrangements" },
    { value: "photography", label: "Photography", description: "Photo services" },
    { value: "videography", label: "Videography", description: "Video services" },
    { value: "dj_music", label: "DJ & Music", description: "Entertainment" }
  ],
  wedding: [
    { value: "venue", label: "Venue", description: "Wedding venue" },
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "florist", label: "Florist", description: "Flowers & arrangements" },
    { value: "decorator", label: "Decorator", description: "Venue decoration" },
    { value: "photography", label: "Photography", description: "Photo services" },
    { value: "videography", label: "Videography", description: "Video services" },
    { value: "dj_music", label: "DJ & Music", description: "Entertainment" },
    { value: "planning", label: "Event Planning", description: "Wedding planner" },
    { value: "lighting", label: "Lighting", description: "Event lighting" },
    { value: "transportation", label: "Transportation", description: "Guest transport" },
    { value: "bakery", label: "Bakery", description: "Wedding cake" }
  ],
  funeral: [
    { value: "florist", label: "Florist", description: "Funeral flowers" },
    { value: "catering", label: "Catering", description: "Reception food" },
    { value: "venue", label: "Venue", description: "Reception venue" }
  ],
  graduation: [
    { value: "venue", label: "Venue", description: "Party venue" },
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "photography", label: "Photography", description: "Photo services" },
    { value: "videography", label: "Videography", description: "Video services" },
    { value: "decorator", label: "Decorator", description: "Venue decoration" },
    { value: "bakery", label: "Bakery", description: "Cakes & desserts" }
  ],
  other: [
    { value: "venue", label: "Venue", description: "Event space" },
    { value: "catering", label: "Catering", description: "Food & beverages" },
    { value: "photography", label: "Photography", description: "Photo services" },
    { value: "videography", label: "Videography", description: "Video services" },
    { value: "dj_music", label: "DJ & Music", description: "Entertainment" },
    { value: "florist", label: "Florist", description: "Flowers" },
    { value: "decorator", label: "Decorator", description: "Decoration" },
    { value: "planning", label: "Event Planning", description: "Event planner" },
    { value: "lighting", label: "Lighting", description: "Event lighting" },
    { value: "entertainment", label: "Entertainment", description: "Performers" },
    { value: "transportation", label: "Transportation", description: "Transport" },
    { value: "rentals", label: "Rentals", description: "Equipment rental" },
    { value: "bakery", label: "Bakery", description: "Desserts" }
  ]
};

export default function CategorySelector({ eventType, budget, selectedCategories, onChange, onNext, onBack }) {
  const availableCategories = EVENT_CATEGORY_MAP[eventType] || [];

  const toggleCategory = (categoryValue) => {
    if (selectedCategories.includes(categoryValue)) {
      onChange(selectedCategories.filter(c => c !== categoryValue));
    } else {
      onChange([...selectedCategories, categoryValue]);
    }
  };

  const selectAll = () => {
    onChange(availableCategories.map(c => c.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Which vendors do you need?
        </h2>
        <p className="text-slate-600">
          Select the vendor types your ${parseInt(budget).toLocaleString()} budget should cover
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={selectAll}
          className="rounded-xl"
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearAll}
          className="rounded-xl"
        >
          Clear All
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {availableCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          return (
            <Card
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50 border-2"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {category.label}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {category.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 ml-2">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
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
          disabled={selectedCategories.length === 0}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          Find Vendors ({selectedCategories.length} selected)
        </Button>
      </div>
    </div>
  );
}