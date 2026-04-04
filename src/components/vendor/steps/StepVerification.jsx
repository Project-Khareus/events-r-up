import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { compressImage } from "@/components/utils/imageCompress";
import { CreditCard, Upload, Loader2, X, Check, AlertCircle, ArrowLeft, Info } from "lucide-react";

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
      <Label className="mb-2 block">{label} *</Label>
      <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors bg-white">
        {fieldValue ? (
          <div className="relative">
            <img src={fieldValue} alt={label} className="w-full h-32 object-cover rounded-lg" />
            <button type="button" onClick={onClear} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <label className="cursor-pointer block py-4">
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
            {uploading ? <Loader2 className="h-8 w-8 mx-auto text-amber-600 animate-spin" /> : (
              <>
                <Upload className="h-8 w-8 mx-auto text-amber-400 mb-1" />
                <p className="text-sm text-slate-600">{hint}</p>
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

  return (
    <div className="space-y-6">
      {/* Ghana Card Verification */}
      <Card className="p-6 rounded-2xl border-amber-200 bg-amber-50/40">
        <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          Ghana Card Verification <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-slate-500 mb-4">Required to verify your identity before listing.</p>

        <div className="space-y-4">
          <div>
            <Label>Ghana Card Number *</Label>
            <Input
              value={formData.ghana_card_number}
              onChange={(e) => setFormData({ ...formData, ghana_card_number: e.target.value })}
              placeholder="e.g. GHA-XXXXXXXXX-X"
              className="mt-1"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ImageUploadBox
              label="Card Front"
              fieldValue={formData.ghana_card_image_url}
              onUpload={makeUploadHandler("ghana_card_image_url", setGhanaCardUploading)}
              onClear={() => setFormData((p) => ({ ...p, ghana_card_image_url: "" }))}
              uploading={ghanaCardUploading}
              hint="Front side"
            />
            <ImageUploadBox
              label="Card Back"
              fieldValue={formData.ghana_card_back_image_url}
              onUpload={makeUploadHandler("ghana_card_back_image_url", setGhanaCardBackUploading)}
              onClear={() => setFormData((p) => ({ ...p, ghana_card_back_image_url: "" }))}
              uploading={ghanaCardBackUploading}
              hint="Back side"
            />
            <ImageUploadBox
              label="Your Selfie"
              fieldValue={formData.ghana_card_selfie_url}
              onUpload={makeUploadHandler("ghana_card_selfie_url", setSelfieUploading)}
              onClear={() => setFormData((p) => ({ ...p, ghana_card_selfie_url: "" }))}
              uploading={selfieUploading}
              hint="Clear face photo"
            />
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-white rounded-lg p-3 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>Your Ghana Card information is kept confidential and won't be displayed publicly.</span>
        </div>
      </Card>

      {/* Subscription Plan */}
      <Card className="p-6 rounded-2xl border-slate-300 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Choose a Plan</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLANS.map((plan) => {
            const isSelected = formData.subscription_type === plan.key;
            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setFormData({ ...formData, subscription_type: plan.key })}
                className={cn(
                  "p-4 border-2 rounded-xl transition-all text-left relative",
                  isSelected
                    ? plan.isTrial
                      ? "border-green-600 bg-green-50 shadow-md"
                      : "border-indigo-600 bg-indigo-50 shadow-md"
                    : "border-slate-300 hover:border-slate-400 bg-white"
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-2 -right-2 bg-green-600 text-white hover:bg-green-700 text-xs">
                    {plan.badge}
                  </Badge>
                )}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-slate-900 font-bold">{plan.name}</h3>
                  {isSelected && (
                    <Check className={plan.isTrial ? "h-4 w-4 text-green-600" : "h-4 w-4 text-indigo-600"} />
                  )}
                </div>
                <p className="text-slate-600 text-xs mb-2">{plan.desc}</p>
                <div className="text-slate-900 text-xl font-bold">
                  {plan.price}
                  <span className="text-xs text-slate-500 font-normal">{plan.unit}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info bubble for selected plan */}
        {formData.subscription_type && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <Info className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-indigo-800">
                {PLANS.find((p) => p.key === formData.subscription_type)?.name} Plan
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                {PLANS.find((p) => p.key === formData.subscription_type)?.info}
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 px-8 h-12 text-base rounded-xl gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              {submitIcon && <span>{submitIcon}</span>} {submitLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}