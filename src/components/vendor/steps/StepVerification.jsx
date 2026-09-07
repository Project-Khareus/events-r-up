import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { compressImage } from "@/components/utils/imageCompress";
import { CreditCard, Upload, Loader2, X, Check, AlertCircle, ArrowLeft, Info } from "lucide-react";
import { PANEL, H2, SUB, LABEL, INPUT, BTN_PRIMARY, BTN_GHOST, DROP } from "./wizardStyles";

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

function ImageUploadBox({ label, fieldValue, onUpload, onClear, uploading, hint }) {
  return (
    <div>
      <p className={`${LABEL} mb-2`}>{label}</p>
      <div className={`${DROP} text-center`}>
        {fieldValue ? (
          <div className="relative">
            <img src={fieldValue} alt={label} className="w-full h-32 object-cover" />
            <button type="button" onClick={onClear} className="absolute top-2 right-2 p-1.5 bg-ink text-cream hover:bg-ink-deep"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : (
          <label className="cursor-pointer block py-5">
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
            {uploading ? <Loader2 className="h-7 w-7 mx-auto text-gold-text dark:text-gold-dark animate-spin" /> : (
              <>
                <Upload className="h-7 w-7 mx-auto text-gold-text dark:text-gold-dark mb-2" />
                <p className="text-[12.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{hint}</p>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}

export default function StepVerification({ formData, setFormData, onBack, onSubmit, isSubmitting, submitLabel, submitIcon }) {
  const [ghanaCardUploading, setGhanaCardUploading] = useState(false);
  const [ghanaCardBackUploading, setGhanaCardBackUploading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);

  const makeUploadHandler = (field, setUploading) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      setFormData((prev) => ({ ...prev, [field]: file_url }));
      toast.success("Uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const selectedPlan = PLANS.find((p) => p.key === formData.subscription_type);

  return (
    <div className="space-y-6">
      {/* Ghana Card Verification */}
      <div className={PANEL}>
        <h2 className={`${H2} flex items-center gap-2.5`}>
          <CreditCard className="h-5 w-5 text-gold-text dark:text-gold-dark" />
          Ghana Card verification
          <span className="text-[10px] font-sans font-medium tracking-[0.16em] uppercase text-[rgba(59,50,43,0.45)] dark:text-[rgba(241,232,224,0.5)]">Optional</span>
        </h2>
        <p className={SUB}>Upload your Ghana Card to speed up verification. You can also add it later by editing your listing.</p>

        <div className="mt-6 space-y-5">
          <div>
            <p className={LABEL}>Ghana Card number *</p>
            <Input
              value={formData.ghana_card_number}
              onChange={(e) => setFormData({ ...formData, ghana_card_number: e.target.value })}
              placeholder="e.g. GHA-XXXXXXXXX-X"
              className={INPUT}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ImageUploadBox
              label="Card front"
              fieldValue={formData.ghana_card_image_url}
              onUpload={makeUploadHandler("ghana_card_image_url", setGhanaCardUploading)}
              onClear={() => setFormData((p) => ({ ...p, ghana_card_image_url: "" }))}
              uploading={ghanaCardUploading}
              hint="Front side"
            />
            <ImageUploadBox
              label="Card back"
              fieldValue={formData.ghana_card_back_image_url}
              onUpload={makeUploadHandler("ghana_card_back_image_url", setGhanaCardBackUploading)}
              onClear={() => setFormData((p) => ({ ...p, ghana_card_back_image_url: "" }))}
              uploading={ghanaCardBackUploading}
              hint="Back side"
            />
            <ImageUploadBox
              label="Your selfie"
              fieldValue={formData.ghana_card_selfie_url}
              onUpload={makeUploadHandler("ghana_card_selfie_url", setSelfieUploading)}
              onClear={() => setFormData((p) => ({ ...p, ghana_card_selfie_url: "" }))}
              uploading={selfieUploading}
              hint="Clear face photo"
            />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2.5 p-3 border border-[rgba(169,126,46,0.35)] bg-[rgba(169,126,46,0.08)]">
          <AlertCircle className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0 mt-0.5" />
          <span className="text-[12.5px] font-light text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">
            Your Ghana Card information is kept confidential and won't be displayed publicly.
          </span>
        </div>
      </div>

      {/* Subscription Plan */}
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
                  <span className="absolute -top-2.5 right-3 bg-[#A97E2E] text-cream text-[9px] font-medium tracking-[0.14em] uppercase px-2 py-1">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-[20px] text-ink dark:text-[#F1E8E0]">{plan.name}</h3>
                  {isSelected && <Check className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0 mt-1" />}
                </div>
                <p className="mt-0.5 text-[12px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">{plan.desc}</p>
                <p className="mt-3 font-serif text-[22px] text-ink dark:text-[#F1E8E0]">
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
              <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-gold-text dark:text-gold-dark">{selectedPlan.name} plan</p>
              <p className="mt-1 text-[12.5px] font-light leading-[1.6] text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">{selectedPlan.info}</p>
            </div>
          </div>
        )}
      </div>

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