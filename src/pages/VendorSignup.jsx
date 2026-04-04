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

        const newVendor = await base44.entities.Vendor.create({
          ...vendorData,
          user_id: user.id,
          subscription_type: 'trial',
          is_trial: true,
          subscription_start_date: new Date().toISOString().split('T')[0],
          subscription_end_date: trialEndDate.toISOString().split('T')[0],
          status: 'pending'
        });

        // Create verification record in separate entity
        await base44.entities.VendorVerification.create({
          vendor_id: newVendor.id,
          user_id: user.id,
          ghana_card_number,
          ghana_card_image_url,
          ghana_card_back_image_url,
          ghana_card_selfie_url,
          ghana_card_status: 'pending'
        });

        return { trial: true, vendorId: newVendor.id };
      }

      // For paid plans, use checkout
      const response = await base44.functions.invoke('createVendorCheckout', {
        subscription_type: data.subscription_type,
        vendorData
      });

      return response.data;
    },
    onSuccess: (data) => {
      if (data.trial) {
        // Trial created successfully, redirect to manage listing
        toast.success("Trial listing created! We'll review it shortly.");
        setTimeout(() => {
          navigate(createPageUrl("ManageListing"));
        }, 1500);
      } else {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to start checkout. Please try again.");
    }
  });

  const handleSubmit = (formData) => {
    createCheckoutMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>);

  }

  if (isSubmitted && paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Payment Successful!</h1>
          <p className="text-slate-600 mb-4">
            Your subscription is active and your vendor listing is being created.
          </p>
          <p className="text-slate-600 mb-6">
            We'll notify you once it's approved and published.
          </p>
          <Button
            onClick={() => navigate(createPageUrl("ManageListing"))}
            className="bg-indigo-600 hover:bg-indigo-700">

            Go to Dashboard
          </Button>
        </Card>
      </div>);

  }

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Vendor Listing</h1>
          <p className="text-slate-600">Join Khareus and reach thousands of event planners</p>
        </div>

        <VendorForm
          initialData={{
            contact_email: user?.email,
            image_url: user?.avatar_url,
            business_name: user?.full_name
          }}
          onSubmit={handleSubmit}
          isSubmitting={createCheckoutMutation.isPending}
          submitLabel="Submit"
          submitIcon={<Send className="h-5 w-5" />} />

      </div>
    </div>);

}