import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_OPTIONS, countryFlag, isLiveCountry, getCountryName, DEFAULT_COUNTRY_CODE } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

// Country picker limited to African countries. Shows a gentle note when the
// chosen country isn't live yet.
export default function CountrySelect({ value, onChange, className, triggerClassName, noun = "listing" }) {
  const code = value || DEFAULT_COUNTRY_CODE;
  return (
    <div className={className}>
      <Select value={code} onValueChange={onChange}>
        <SelectTrigger className={cn("h-11", triggerClassName)} aria-label="Country">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {COUNTRY_OPTIONS.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="mr-2" aria-hidden="true">{countryFlag(c.code)}</span>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!isLiveCountry(code) && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.7)]">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gold-text dark:text-gold-dark" />
          Khareus isn't live in {getCountryName(code)} yet. You can still submit your {noun}. We'll save it and let you know as soon as we launch there.
        </p>
      )}
    </div>
  );
}
