import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <Input
        type="text"
        placeholder="Search vendors by name or service..."
        value={value || ""}
        onChange={handleChange}
        className="pl-12 h-14 text-base border-slate-200 dark:border-slate-600 focus:border-indigo-400 focus:ring-indigo-400 rounded-2xl shadow-sm bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
      />
    </div>
  );
}