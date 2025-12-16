import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Loader2, CheckCircle } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function VendorSignup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check if user already has a vendor listing
      const vendors = await base44.entities.Vendor.list();
      const existingVendor = vendors.find(v => v.user_id === currentUser.id);
      
      if (existingVendor) {
        // Redirect to Manage Listing if already exists
        navigate(createPageUrl("ManageListing"));
      }
      
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const createVendorMutation = useMutation({
    mutationFn: async (data) => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      
      // Calculate end date based on subscription type
      if (data.subscription_type === "annual") {
        endDate.setMonth(endDate.getMonth() + 12); // 10 months + 2 free = 12 months
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const vendorData = {
        ...data,
        user_id: user.id,
        starting_price: data.starting_price ? parseFloat(data.starting_price) : undefined,
        years_in_business: data.years_in_business ? parseInt(data.years_in_business) : undefined,
        subscription_start_date: startDate,
        subscription_end_date: endDate.toISOString().split('T')[0],
        // services, event_type, category are already arrays from the form
        status: "pending",
      };

      // Clean up empty strings for optional fields to avoid validation errors
      ["contact_email", "website", "instagram", "facebook", "twitter", "tiktok", "linkedin", "image_url"].forEach(key => {
        if (vendorData[key] === "") delete vendorData[key];
      });

      return base44.entities.Vendor.create(vendorData);
    },
    onSuccess: async (newVendor) => {
      setIsSubmitted(true);
      toast.success("Your vendor listing has been submitted for review!");
      
      // Notify admin
      try {
        await base44.functions.invoke('notifyVendorSubmission', {
          business_name: newVendor.business_name,
          vendor_id: newVendor.id,
          contact_email: newVendor.contact_email
        });
      } catch (err) {
        console.error("Failed to notify admin", err);
      }
    },
    onError: (error) => {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to create listing. Please try again.");
    }
  });

  const handleSubmit = (formData) => {
    createVendorMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Listing Submitted!</h1>
          <p className="text-slate-600 mb-6">
            Your vendor listing has been submitted for review. We'll notify you once it's approved and published.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl("VendorMarketplace"))}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Vendor Profile</h1>
          <p className="text-slate-600">Join Omnievents and reach thousands of event planners</p>
        </div>

        <VendorForm 
          initialData={{ 
            contact_email: user?.email,
            image_url: user?.avatar_url, // Auto-fill from social login
            business_name: user?.full_name // Auto-fill name as starting point
          }}
          onSubmit={handleSubmit}
          isSubmitting={createVendorMutation.isPending}
          submitLabel="Submit Your Listing"
        />
      </div>
    </div>
  );
}