import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function ManageListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const vendors = await base44.entities.Vendor.list();
      const existingVendor = vendors.find(v => v.user_id === currentUser.id);
      
      if (!existingVendor) {
        toast.error("You don't have a vendor listing yet.");
        navigate(createPageUrl("VendorSignup"));
        return;
      }
      
      setVendor(existingVendor);
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const updateVendorMutation = useMutation({
    mutationFn: async (data) => {
      const vendorData = {
        ...data,
        starting_price: data.starting_price ? parseFloat(data.starting_price) : undefined,
        years_in_business: data.years_in_business ? parseInt(data.years_in_business) : undefined,
        // services, event_type, category are already arrays from the form
      };
      // Keep existing status unless specifically changing logic (e.g., re-approval needed?)
      // For now, we'll keep the existing status or let it be handled by admin
      return base44.entities.Vendor.update(vendor.id, vendorData);
    },
    onSuccess: () => {
      toast.success("Your listing has been updated successfully!");
      queryClient.invalidateQueries(['vendor', vendor.id]);
    },
    onError: () => {
      toast.error("Failed to update listing. Please try again.");
    }
  });

  const handleSubmit = (formData) => {
    updateVendorMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Button 
                variant="ghost" 
                onClick={() => navigate(createPageUrl("VendorMarketplace"))}
                className="flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
            </Button>
            {vendor && (
                <Button 
                    variant="outline" 
                    onClick={() => navigate(`${createPageUrl("VendorDetail")}?id=${vendor.id}`)}
                    className="flex items-center gap-2"
                >
                    View Public Listing
                    <ExternalLink className="h-4 w-4" />
                </Button>
            )}
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Manage Your Listing</h1>
          <p className="text-slate-600">Update your business information, photos, and services</p>
          
          {vendor.status === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg inline-block text-sm font-medium">
                  Your listing is currently pending approval.
              </div>
          )}
        </div>

        <VendorForm 
          initialData={vendor}
          onSubmit={handleSubmit}
          isSubmitting={updateVendorMutation.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}