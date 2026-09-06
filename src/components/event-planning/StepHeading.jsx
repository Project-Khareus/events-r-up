import React from "react";

export default function StepHeading({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      <h2 className="font-serif text-[26px] sm:text-[32px] leading-[1.2] text-ink dark:text-[#F1E8E0]">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-[14px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
          {subtitle}
        </p>
      )}
      <span className="mt-5 block w-10 h-px bg-gold mx-auto" />
    </div>
  );
}