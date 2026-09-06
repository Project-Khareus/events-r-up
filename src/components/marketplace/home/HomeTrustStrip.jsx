import React from "react";
import { ShieldCheck, Lock, MapPin } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Reviewed before listing", body: "Every vendor is checked and approved by our team first." },
  { icon: Lock, title: "Bookings held safely", body: "Requests are held until the vendor confirms your date." },
  { icon: MapPin, title: "Priced in cedis", body: "Listed by city, so you know who works near you." },
];

export default function HomeTrustStrip() {
  return (
    <section className="bg-ink dark:bg-[#2A231D] px-5 md:px-10 py-10 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon className="h-5 w-5 shrink-0 text-[#A97E2E]" />
            <div>
              <p className="text-[14px] font-medium text-cream">{item.title}</p>
              <p className="mt-1 text-[12px] font-light leading-relaxed text-[rgba(248,241,235,0.65)]">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}