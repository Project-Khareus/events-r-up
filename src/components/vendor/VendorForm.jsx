import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, AlertTriangle, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

import VendorWizardProgress from "./VendorWizardProgress";
import StepBusiness from "./steps/StepBusiness";
import StepMedia from "./steps/StepMedia";
import StepContact from "./steps/StepContact";
import StepVerification from "./steps/StepVerification";

const DRAFT_STORAGE_KEY = 'vendor_form_draft';
const DRAFT_STEP_KEY = 'vendor_form_step';

const DEFAULT_FORM_DATA = {
  business_name: "",
  slogan: "",
  event_type: [],
  category: [],
  description: "",
  location: "",
  starting_price: "",
  contact_email: "",
  contact_phone: "",
  website: "",
  instagram: "",
  facebook: "",
  twitter: "",
  tiktok: "",
  linkedin: "",
  image_url: "",
  gallery_images: [],
  gallery_videos: [],
  services: [],
  years_in_business: "",
  price_currency: "GHS",
  subscription_type: "trial",
  ghana_card_number: "",
  ghana_card_image_url: "",
  ghana_card_back_image_url: "",
  ghana_card_selfie_url: "",
};

const NAME_CHANGE_REASONS = [
  "Rebranding / Business name change",
  "Spelling correction",
  "Legal name change",
  "Merger or acquisition",
  "Franchise name update",
  "Other",
];

export default function VendorForm({ initialData, onSubmit, isSubmitting, submitLabel = "Submit Listing", submitIcon = null }) {
  const isEditMode = !!initialData?.id;

  // Load draft from localStorage for new listings
  const [formData, setFormData] = useState(() => {
    if (!isEditMode) {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) return { ...DEFAULT_FORM_DATA, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_FORM_DATA;
  });

  const [step, setStep] = useState(() => {
    if (!isEditMode) {
      try {
        const savedStep = localStorage.getItem(DRAFT_STEP_KEY);
        if (savedStep) return parseInt(savedStep, 10) || 0;
      } catch {}
    }
    return 0;
  });

  const [nameChangeDialogOpen, setNameChangeDialogOpen] = useState(false);
  const [nameChangeReasons, setNameChangeReasons] = useState([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [ghanaCardPendingDialogOpen, setGhanaCardPendingDialogOpen] = useState(false);
  const [submittedVendorId, setSubmittedVendorId] = useState(null);
  const navigate = useNavigate();

  // Save draft to localStorage whenever formData or step changes (new listings only)
  useEffect(() => {
    if (isEditMode) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      localStorage.setItem(DRAFT_STEP_KEY, String(step));
    } catch {}
  }, [formData, step, isEditMode]);

  // Load verification data for edit mode
  useEffect(() => {
    if (initialData?.id) {
      base44.entities.VendorVerification.filter({ vendor_id: initialData.id })
        .then((verifications) => {
          if (verifications.length > 0) {
            const v = verifications[0];
            setFormData((prev) => ({
              ...prev,
              ghana_card_number: v.ghana_card_number || "",
              ghana_card_image_url: v.ghana_card_image_url || "",
              ghana_card_back_image_url: v.ghana_card_back_image_url || "",
              ghana_card_selfie_url: v.ghana_card_selfie_url || "",
            }));
          }
        })
        .catch(() => {});
    }
  }, [initialData?.id]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => {
        const merged = { ...prev };
        // For new listings, only apply initialData fields that have actual values
        // so we don't overwrite localStorage draft data with empty values
        if (!isEditMode) {
          Object.entries(initialData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              merged[key] = value;
            }
          });
        } else {
          // In edit mode, apply all initialData
          Object.assign(merged, initialData);
        }
        return {
          ...merged,
          gallery_images: merged.gallery_images || [],
          gallery_videos: merged.gallery_videos || [],
          event_type: Array.isArray(merged.event_type) ? merged.event_type : merged.event_type ? [merged.event_type] : [],
          category: Array.isArray(merged.category) ? merged.category : merged.category ? [merged.category] : [],
          services: Array.isArray(merged.services) ? merged.services : merged.services ? merged.services.split(", ") : [],
          starting_price: merged.starting_price?.toString() || "",
          years_in_business: merged.years_in_business?.toString() || "",
        };
      });
    }
  }, [initialData]);

  const hasGhanaCard = formData.ghana_card_number && formData.ghana_card_image_url && formData.ghana_card_back_image_url && formData.ghana_card_selfie_url;

  const handleSubmit = () => {
    if (!formData.business_name || formData.event_type.length === 0 || formData.category.length === 0) {
      toast.error("Please fill in all required fields (Business Name, Event Type, Category)");
      setStep(0);
      return;
    }

    // Check if name has changed (edit mode only — existing approved listing)
    if (isEditMode && initialData.business_name && formData.business_name !== initialData.business_name) {
      setNameChangeDialogOpen(true);
      return;
    }

    setReviewDialogOpen(true);
  };

  const confirmSubmit = async () => {
    setReviewDialogOpen(false);
    // Clear draft on successful submit
    if (!isEditMode) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_STEP_KEY);
      } catch {}
    }
    const result = await onSubmit(formData);
    // If no Ghana Card and we got a vendorId back, show pending dialog
    if (!hasGhanaCard && result?.vendorId) {
      setSubmittedVendorId(result.vendorId);
      setGhanaCardPendingDialogOpen(true);
    }
  };

  const confirmNameChange = () => {
    if (nameChangeReasons.length === 0) {
      toast.error("Please select at least one reason for the name change");
      return;
    }
    setNameChangeDialogOpen(false);
    onSubmit({ ...formData, name_change_reasons: nameChangeReasons });
  };

  return (
    <div>
      <VendorWizardProgress currentStep={step} />

      {step === 0 && (
        <StepBusiness
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(1)}
          initialData={initialData}
        />
      )}

      {step === 1 && (
        <StepMedia
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <StepContact
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepVerification
          formData={formData}
          setFormData={setFormData}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          submitIcon={submitIcon}
        />
      )}

      {/* Review Confirmation Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Submit Listing for Review
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your listing <strong>"{formData.business_name}"</strong> will be submitted and reviewed by our team before it goes live on Khareus.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-cream dark:bg-[#211B16] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] rounded-none p-4 space-y-2 text-[13.5px] font-light text-ink dark:text-[#F1E8E0]">
            <p><strong>Business:</strong> {formData.business_name}</p>
            {formData.event_type.length > 0 && <p><strong>Event Types:</strong> {formData.event_type.join(", ")}</p>}
            {formData.category.length > 0 && <p><strong>Categories:</strong> {formData.category.length} selected</p>}
            {formData.location && <p><strong>Location:</strong> {formData.location}</p>}
            <p><strong>Plan:</strong> {formData.subscription_type?.charAt(0).toUpperCase() + formData.subscription_type?.slice(1)}</p>
          </div>
          {!hasGhanaCard && (
            <div className="flex items-start gap-2 bg-[rgba(169,126,46,0.08)] border border-[rgba(169,126,46,0.35)] rounded-none p-3">
              <AlertTriangle className="h-4 w-4 text-gold-text dark:text-gold-dark shrink-0 mt-0.5" />
              <p className="text-[13px] font-light text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">You haven't uploaded your Ghana Card yet. Your listing will be submitted but will remain pending until verification is completed. You can add it later by editing your listing.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Go Back</Button>
            <Button onClick={confirmSubmit} className="rounded-none bg-ink hover:bg-ink-deep text-cream text-[11px] font-medium tracking-[0.1em] uppercase min-h-[44px]">Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ghana Card Pending Dialog */}
      <Dialog open={ghanaCardPendingDialogOpen} onOpenChange={setGhanaCardPendingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Listing Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your listing <strong>"{formData.business_name}"</strong> has been submitted for review.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[rgba(169,126,46,0.08)] border border-[rgba(169,126,46,0.35)] rounded-none p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-gold-text dark:text-gold-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-gold-text dark:text-gold-dark">Ghana Card verification pending</p>
                <p className="text-[13px] font-light text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)] mt-1.5">
                  Your listing will remain pending until you upload your Ghana Card for identity verification. You can add it by editing your listing.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600">A confirmation email has been sent with a link to edit your listing.</p>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setGhanaCardPendingDialogOpen(false);
                if (submittedVendorId) {
                  navigate(`/EditVendor?id=${submittedVendorId}`);
                }
              }}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" /> Edit Listing Now
            </Button>
            <Button
              onClick={() => {
                setGhanaCardPendingDialogOpen(false);
                navigate('/ManageListing');
              }}
              className="rounded-none bg-ink hover:bg-ink-deep text-cream text-[11px] font-medium tracking-[0.1em] uppercase min-h-[44px]"
            >
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Name Change Dialog */}
      <Dialog open={nameChangeDialogOpen} onOpenChange={setNameChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Business Name Change
            </DialogTitle>
            <DialogDescription>
              You're changing your business name from <strong>{initialData?.business_name}</strong> to <strong>{formData.business_name}</strong>.
              This requires admin approval. Please select the reason(s):
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {NAME_CHANGE_REASONS.map((reason) => (
              <div key={reason} className="flex items-start space-x-3">
                <Checkbox
                  id={reason}
                  checked={nameChangeReasons.includes(reason)}
                  onCheckedChange={(checked) => {
                    if (checked) setNameChangeReasons([...nameChangeReasons, reason]);
                    else setNameChangeReasons(nameChangeReasons.filter((r) => r !== reason));
                  }}
                />
                <label htmlFor={reason} className="text-sm font-medium leading-none cursor-pointer">{reason}</label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNameChangeDialogOpen(false); setNameChangeReasons([]); }}>Cancel</Button>
            <Button onClick={confirmNameChange} className="rounded-none bg-ink hover:bg-ink-deep text-cream text-[11px] font-medium tracking-[0.1em] uppercase min-h-[44px]">Confirm & Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}