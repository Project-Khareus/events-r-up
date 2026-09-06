import React from "react";
import FilterControls from "./FilterControls";

export default function FilterSidebar(props) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-4 bg-linen dark:bg-[#2A231D] rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] p-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h3 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gold-text dark:text-gold-dark mb-5">
          Filters
        </h3>
        <FilterControls {...props} layout="vertical" />
      </div>
    </aside>
  );
}