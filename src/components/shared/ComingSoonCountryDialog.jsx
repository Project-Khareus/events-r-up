import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { countryFlag, getCountryName } from "@/lib/countries";

// Shown after someone outside a live country submits a vendor listing or event.
export default function ComingSoonCountryDialog({ open, onOpenChange, countryCode, kind = "listing", onDone }) {
  const name = getCountryName(countryCode);
  const thing = kind === "event" ? "event" : "vendor listing";
  // However the dialog is closed, move the person on so they can't resubmit.
  const handleOpenChange = (next) => {
    onOpenChange?.(next);
    if (!next) onDone?.();
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="text-4xl leading-none mb-2" aria-hidden="true">{countryFlag(countryCode)}</div>
          <DialogTitle className="font-serif text-[24px] font-normal">Khareus is coming to {name}</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">
            Thanks for submitting your {thing}. Khareus isn't available in {name} yet, but it will be soon.
            We've saved your details, and we'll email you as soon as we launch in {name}.
          </DialogDescription>
        </DialogHeader>
        <p className="text-[13px] font-light text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.7)]">
          Your {thing} won't appear publicly until then.
        </p>
        <DialogFooter>
          <Button
            onClick={() => handleOpenChange(false)}
            className="rounded-none bg-ink hover:bg-ink-deep text-cream text-[13px] font-medium min-h-[44px]"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
