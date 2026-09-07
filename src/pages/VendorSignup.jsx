import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Loader2, CheckCircle, Send } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function VendorSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check for payment success
        if (searchParams.get('success') === 'true') {
          setPaymentSuccess(true);
          setIsSubmitted(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth or data fetch error:", error);
        toast.error("Failed to load page. Please try again.");
        setTimeout(() => {
          navigate(createPageUrl("VendorMarketplace"));
        }, 2000);
      }
    };
    checkAuth();
  }, [navigate, searchParams]);

  const createCheckoutMutation = useMutation({
    mutationFn: async (data) => {
      // Separate Ghana Card fields from vendor data
      const { ghana_card_number, ghana_card_image_url, ghana_card_back_image_url, ghana_card_selfie_url, ...restData } = data;

      const hasGhanaCard = ghana_card_number && ghana_card_image_url && ghana_card_back_image_url && ghana_card_selfie_url;

      const vendorData = {
        ...restData,
        starting_price: restData.starting_price ? parseFloat(restData.starting_price) : undefined,
        years_in_business: restData.years_in_business ? parseInt(restData.years_in_business) : undefined
      };

      // Check if trial is selected
      if (data.subscription_type === 'trial') {
        // Count existing trial listings for this user
        const allVendors = await base44.entities.Vendor.filter({ user_id: user.id });
        const trialCount = allVendors.filter((v) => v.is_trial === true).length;

        if (trialCount >= 3) {
          throw new Error("You've reached the maximum of 3 trial listings. Please choose a paid plan.");
        }

        // Create trial vendor directly without payment
        const trialEndDate = new Date();
        trialEndDate.setMonth(trialEndDate.getMonth() + 1);

        let newVendor;
        try {
          newVendor = await base44.entities.Vendor.create({
            ...vendorData,
            user_id: user.id,
            subscription_type: 'trial',
            is_trial: true,
            subscription_start_date: new Date().toISOString().split('T')[0],
            subscription_end_date: trialEndDate.toISOString().split('T')[0],
            status: 'pending',
            ghana_card_status: hasGhanaCard ? 'pending' : undefined
          });
        } catch (err) {
          console.error('Vendor creation failed:', err);
          throw new Error("We couldn't create your listing. Please check that all required fields are filled in correctly and try again.");
        }

        // Create verification record if Ghana Card data was provided (non-blocking)
        let ghanaCardSaved = false;
        if (hasGhanaCard) {
          try {
            await base44.entities.VendorVerification.create({
              vendor_id: newVendor.id,
              user_id: user.id,
              ghana_card_number,
              ghana_card_image_url,
              ghana_card_back_image_url,
              ghana_card_selfie_url,
              ghana_card_status: 'pending'
            });
            ghanaCardSaved = true;
          } catch (err) {
            console.error('Ghana Card verification save failed:', err);
            // Vendor was created successfully — don't block the flow
            toast.info("Your listing was created but Ghana Card details couldn't be saved. You can add them later by editing your listing.");
          }
        }

        return { trial: true, vendorId: newVendor.id, businessName: vendorData.business_name, hasGhanaCard: hasGhanaCard && ghanaCardSaved, ghanaCardProvided: hasGhanaCard };
      }

      // For paid plans, use checkout
      const response = await base44.functions.invoke('createVendorCheckout', {
        subscription_type: data.subscription_type,
        vendorData
      });

      return response.data;
    },
    onSuccess: async (data) => {
      if (data.trial) {
        const needsGhanaCardUpload = !data.hasGhanaCard && !data.ghanaCardProvided;

        // Only show upload-related feedback if Ghana Card details were not provided
        if (!needsGhanaCardUpload) {
          toast.success("Trial listing created! We'll review it shortly.");
        }

        // Send confirmation email
        try {
          const ghanaCardNote = needsGhanaCardUpload
            ? '<li style="color: #D97706; font-weight: 600;">⚠️ Ghana Card verification is still pending — please edit your listing to upload it</li>'
            : '<li>Your Ghana Card details have been received for verification</li>';

          await base44.integrations.Core.SendEmail({
            to: user.email,
            from_name: 'Khareus',
            subject: needsGhanaCardUpload ? 'Listing Submitted — Ghana Card Verification Needed' : 'Your Vendor Listing Has Been Submitted!',
            body: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="padding: 32px 24px;">
                  <h1 style="color: #4F46E5; font-size: 24px; margin: 0 0 20px 0;">Listing Submitted Successfully!</h1>
                  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${user.full_name || 'there'},</p>
                  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your vendor listing <strong>"${data.businessName}"</strong> has been submitted and is now pending review by our team.</p>
                  ${needsGhanaCardUpload ? `
                  <div style="background: #FFFBEB; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #F59E0B;">
                    <p style="margin: 0; color: #92400E; font-weight: 600; font-size: 14px;">⚠️ Ghana Card Verification Pending</p>
                    <p style="margin: 8px 0 0; color: #92400E; font-size: 13px;">Please edit your listing to add your Ghana Card details and complete verification.</p>
                  </div>
                  ` : ''}
                  <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
                    <p style="margin: 4px 0; color: #334155;"><strong>What happens next?</strong></p>
                    <ul style="color: #334155; font-size: 14px; line-height: 1.8;">
                      <li>Our team will review your listing within 24-48 hours</li>
                      ${ghanaCardNote}
                      <li>You'll receive an email when your listing is approved</li>
                      <li>You can view and edit your listing anytime from your dashboard</li>
                    </ul>
                  </div>
                  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Want to make changes? You can edit your listing:</p>
                  <a href="https://khareus.com/EditVendor?id=${data.vendorId}" style="display: inline-block; padding: 12px 28px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;">Edit My Listing</a>
                  <a href="https://khareus.com/ManageListing" style="display: inline-block; padding: 12px 28px; background-color: #ffffff; color: #4F46E5; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0 16px 8px; border: 2px solid #4F46E5;">View My Listings</a>
                </div>
                <div style="border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center;">
                  <p style="color: #94A3B8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Khareus. All rights reserved.</p>
                </div>
              </div>
            `
          });
        } catch (e) {
          console.error('Failed to send vendor confirmation email:', e);
        }

        // Notify admin
        try {
          await base44.functions.invoke('notifyVendorSubmission', {
            business_name: data.businessName || 'New Vendor',
            vendor_id: data.vendorId,
            contact_email: user.email
          });
        } catch (e) {
          console.error('Failed to notify admin:', e);
        }

        // Only show the pending dialog when Ghana Card details were not provided
        if (!needsGhanaCardUpload) {
          setTimeout(() => {
            navigate(createPageUrl("ManageListing"));
          }, 1500);
        }
      } else {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to start checkout. Please try again.");
    }
  });

  const handleSubmit = async (formData) => {
    return new Promise((resolve, reject) => {
      createCheckoutMutation.mutate(formData, {
        onSuccess: (data) => resolve(data),
        onError: (err) => reject(err)
      });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#211B16] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold-text dark:text-gold-dark" />
      </div>);

  }

  if (isSubmitted && paymentSuccess) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#211B16] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 text-center bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] rounded-none">
          <CheckCircle className="h-9 w-9 mx-auto text-gold-text dark:text-gold-dark" />
          <h1 className="mt-5 font-serif text-[30px] text-ink dark:text-[#F1E8E0]">Payment successful</h1>
          <p className="mt-3 text-[14px] font-light leading-[1.7] text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            Your subscription is active and your vendor listing is being created. We'll notify you once it's approved and published.
          </p>
          <button
            onClick={() => navigate(createPageUrl("ManageListing"))}
            className="mt-6 w-full min-h-[48px] rounded-none bg-ink dark:bg-[#F1E8E0] text-cream dark:text-[#211B16] text-[11.5px] font-medium tracking-[0.1em] uppercase hover:bg-ink-deep transition-colors">
            Go to dashboard
          </button>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#211B16] py-10 md:py-14 px-5 md:px-10 pb-[82px] md:pb-14">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-9 pb-8 border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
          <Store className="h-7 w-7 mx-auto text-gold-text dark:text-gold-dark" />
          <h1 className="mt-4 font-serif text-[30px] md:text-[40px] leading-[1.15] text-ink dark:text-[#F1E8E0]">Create your vendor listing</h1>
          <p className="mt-2 text-[14.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            Join Khareus and reach thousands of event planners
          </p>
        </div>

        <VendorForm
          initialData={{
            contact_email: user?.email
          }}
          onSubmit={handleSubmit}
          isSubmitting={createCheckoutMutation.isPending}
          submitLabel="Submit"
          submitIcon={<Send className="h-5 w-5" />} />

      </div>
    </div>);

}