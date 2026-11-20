import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Loader2, Check, AlertCircle, ArrowLeft, Info, ShieldCheck, Clock, XCircle, RotateCcw } from "lucide-react";
import { PANEL, H2, SUB, BTN_PRIMARY, BTN_GHOST } from "./wizardStyles";
import DiditVerificationDialog from "../DiditVerificationDialog";
import { isLiveCountry, getCountryName, countryFlag } from "@/lib/countries";

const PLANS = [
  { key: "trial", name: "Trial", desc: "1 month free (max 3)", price: "Free", unit: "/mo", isTrial: true,
    info: "Get started free for 1 month. You can have up to 3 trial listings at a time. After 1 month, upgrade to stay listed." },
  { key: "explorer", name: "Explorer", desc: "Try it out", price: "GHS 15", unit: "/mo",
    info: "A low-cost entry plan billed monthly. Great for new vendors testing the marketplace. Cancel anytime." },
  { key: "monthly", name: "Monthly", desc: "Pay as you go", price: "GHS 14", unit: "/mo",
    info: "Our standard monthly plan with full visibility and features. Renews automatically each month." },
  { key: "annual", name: "Annual", desc: "Save yearly", price: "GHS 150", unit: "/year", badge: "Best Value",
    info: "Pay once for the whole year and save over 15% compared to monthly. Best for established vendors." },
];

const GHANA_STATUS = {
  verified: { label: "Verified", icon: ShieldCheck, cls: "border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400",
    text: "Your Ghana Card and selfie have been verified." },
  pending: { label: "Pending", icon: Clock, cls: "border-[rgba(169,126,46,0.35)] bg-[rgba(169,126,46,0.08)] text-gold-text dark:text-gold-dark",
    text: "Your verification isn't complete yet. You can still submit; your listing stays pending until it's done." },
  failed: { label: "Not verified", icon: XCircle, cls: "border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-400",
    text: "We couldn't verify your Ghana Card. Try again, or submit with verification pending." },
};

export default function StepVerification({ formData, setFormData, onBack, onSubmit, isSubmitting, submitLabel, submitIcon, autoOpenVerification = false }) {
  const [diditOpen, setDiditOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  const selectedPlan = PLANS.find((p) => p.key === formData.subscription_type);
  const isWaitlist = !isLiveCountry(formData.country);
  const isGhana = (formData.country || "GH") === "GH";
  const ghanaStatus = formData.didit_session_id ? GHANA_STATUS[formData.ghana_card_status] || GHANA_STATUS.pending : null;
  const isVerified = formData.ghana_card_status === "verified" && !!formData.didit_session_id;

  // Open Didit as soon as a new vendor reaches the Ghana Card step
  useEffect(() => {
    if (!autoOpenVerification || autoOpenedRef.current || !isGhana || isWaitlist || formData.didit_session_id) return;
    autoOpenedRef.current = true;
    setDiditOpen(true);
  }, [autoOpenVerification, isGhana, isWaitlist, formData.didit_session_id]);

  // Refresh a saved session's result (e.g. after a reload, or an "In Review" that has since finished)
  useEffect(() => {
    if (!isGhana || !formData.didit_session_id || formData.ghana_card_status === "verified") return;
    let cancelled = false;
    base44.functions.invoke("getDiditSessionStatus", { session_id: formData.didit_session_id })
      .then(({ data }) => {
        if (!cancelled && data?.status) setFormData((prev) => ({ ...prev, ghana_card_status: data.status }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isGhana, formData.didit_session_id]);

  const handleDiditResult = useCallback(({ session_id, status }) => {
    setFormData((prev) => ({ ...prev, didit_session_id: session_id, ghana_card_status: status }));
  }, [setFormData]);

  return (
    <div className="space-y-6">
      {isWaitlist && (
        <div className={PANEL}>
          <h2 className={`${H2} flex items-center gap-2.5`}>
            <span aria-hidden="true">{countryFlag(formData.country)}</span>
            Coming soon to {getCountryName(formData.country)}
          </h2>
          <p className={SUB}>
            Khareus isn't live in {getCountryName(formData.country)} yet, so there's nothing to pay and no ID to upload today.
            Submit your listing and we'll save your spot. We'll email you as soon as we launch there.
          </p>
        </div>
      )}

      {/* Ghana Card Verification */}
      {isGhana && (
      <div className={PANEL}>
        <h2 className={`${H2} flex items-center gap-2.5`}>
          <CreditCard className="h-5 w-5 text-gold-text dark:text-gold-dark" />
          Ghana Card verification
        </h2>
        <p className={SUB}>Verify your identity with your Ghana Card and a quick selfie. It takes about 2 minutes and is handled securely by Didit.</p>

        <div className="mt-6 space-y-4">
          {ghanaStatus && (
            <div className={`flex items-start gap-2.5 p-3 border ${ghanaStatus.cls}`}>
              <ghanaStatus.icon className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12.5px] font-medium">Ghana Card: {ghanaStatus.label}</p>
                <p className="mt-0.5 text-[12.5px] font-light text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">{ghanaStatus.text}</p>
              </div>
            </div>
          )}
          {!isVerified && (
            <button type="button" onClick={() => setDiditOpen(true)} className={BTN_PRIMARY}>
              {formData.didit_session_id ? <RotateCcw className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {formData.didit_session_id ? "Verify again" : "Verify Ghana Card"}
            </button>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2.5 p-3 border border-[rgba(169,126,46,0.35)] bg-[rgba(169,126,46,0.08)]">
          <AlertCircle className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0 mt-0.5" />
          <span className="text-[12.5px] font-light text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">
            Your Ghana Card information is kept confidential and won't be displayed publicly.
          </span>
        </div>
      </div>
      )}

      <DiditVerificationDialog
        open={diditOpen}
        onOpenChange={setDiditOpen}
        onResult={handleDiditResult}
        onSubmitPending={onSubmit}
      />

      {/* Subscription Plan */}
      {!isWaitlist && (
      <div className={PANEL}>
        <h2 className={H2}>Choose a plan</h2>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLANS.map((plan) => {
            const isSelected = formData.subscription_type === plan.key;
            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setFormData({ ...formData, subscription_type: plan.key })}
                className={`relative p-4 text-left rounded-none border transition-colors ${
                  isSelected
                    ? "border-[#A97E2E] bg-[rgba(169,126,46,0.1)]"
                    : "border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] hover:border-[#A97E2E]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-3 bg-[#A97E2E] text-cream text-[12px] font-medium px-2 py-1">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-[20px] text-ink dark:text-[#F1E8E0]">{plan.name}</h3>
                  {isSelected && <Check className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0 mt-1" />}
                </div>
                <p className="mt-0.5 text-[12px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{plan.desc}</p>
                <p className="mt-3 font-medium text-[22px] text-ink dark:text-[#F1E8E0]">
                  {plan.price}
                  <span className="text-[11px] font-sans font-light text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">{plan.unit}</span>
                </p>
              </button>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="mt-5 flex items-start gap-2.5 p-3 border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-cream dark:bg-[#211B16]">
            <Info className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-medium text-gold-text dark:text-gold-dark">{selectedPlan.name} plan</p>
              <p className="mt-1 text-[12.5px] font-light leading-[1.6] text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">{selectedPlan.info}</p>
            </div>
          </div>
        )}
      </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={BTN_GHOST}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="button" disabled={isSubmitting} onClick={onSubmit} className={`${BTN_PRIMARY} px-8`}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing
            </>
          ) : (
            <>
              {submitIcon && <span>{submitIcon}</span>} {submitLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}