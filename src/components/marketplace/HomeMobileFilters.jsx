import React from "react";
import FilterControls from "./FilterControls";

export default function HomeMobileFilters(props) {
  return (
    <div className="lg:hidden bg-linen dark:bg-[#2A231D] rounded-none border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] px-4 py-3">
      <FilterControls {...props} />
    </div>
  );
}